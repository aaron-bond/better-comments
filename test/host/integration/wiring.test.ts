import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { extensionId, recorder, samplesDir, SetDecorationsCall } from '../shim';

// End-to-end behaviour of the real activated extension (extension.ts), as it is today

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor<T>(what: string, check: () => T | undefined, timeoutMs = 5000): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = check();
        if (result) return result;
        if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
        await sleep(50);
    }
}

const callsFor = (doc: vscode.TextDocument, since = 0): SetDecorationsCall[] =>
    recorder.editorCalls.slice(since).filter(c => c.uri === doc.uri.toString());

// The decorated text of one pass, keyed by decoration type
function decoratedText(doc: vscode.TextDocument, calls: SetDecorationsCall[]): string[] {
    return calls.flatMap(c => c.ranges.map(r => `${c.key}: ${doc.getText(r)}`)).sort();
}

// A pass is one setDecorations call per configured tag
const tagCount = () => vscode.workspace.getConfiguration('better-comments').get<unknown[]>('tags')!.length;

async function show(file: string, column?: vscode.ViewColumn): Promise<{ doc: vscode.TextDocument; editor: vscode.TextEditor }> {
    const doc = await vscode.workspace.openTextDocument(path.join(samplesDir, file));
    const editor = await vscode.window.showTextDocument(doc, column);
    return { doc, editor };
}

async function onePass(doc: vscode.TextDocument, since: number): Promise<SetDecorationsCall[]> {
    await waitFor(`a decoration pass on ${path.basename(doc.fileName)}`, () => callsFor(doc, since).length >= tagCount());
    await sleep(300);
    return callsFor(doc, since).slice(-tagCount());
}

describe('extension wiring', () => {
    before(async () => {
        await vscode.extensions.getExtension(extensionId)!.activate();
    });

    afterEach(async () => {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    it('decorates each language correctly when switching editors, and the same again on return', async () => {
        let since = recorder.editorCalls.length;
        const js = await show('javascript.js');
        const first = decoratedText(js.doc, await onePass(js.doc, since));
        assert.ok(first.some(t => t.endsWith(': // ! Need more content here')), 'JavaScript alert decorated');

        since = recorder.editorCalls.length;
        const py = await show('test.py');
        const python = decoratedText(py.doc, await onePass(py.doc, since));
        assert.ok(python.some(t => t.endsWith(': # ! Import the modules')), 'Python alert decorated');
        assert.ok(!python.some(t => t.includes(': //')), 'no // comments decorated in Python');

        since = recorder.editorCalls.length;
        await show('javascript.js');
        assert.deepStrictEqual(decoratedText(js.doc, await onePass(js.doc, since)), first);
    });

    it('does not decorate a language it does not support', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'log', content: '// ! not a comment here\n' });
        const since = recorder.editorCalls.length;
        await vscode.window.showTextDocument(doc);
        await sleep(500);
        assert.deepStrictEqual(callsFor(doc, since), []);
    });

    it('debounces a burst of edits into fewer decoration passes', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: '' });
        const editor = await vscode.window.showTextDocument(doc);
        await sleep(500);

        const since = recorder.editorCalls.length;
        const edits = 10;
        for (let i = 0; i < edits; i++) {
            await editor.edit(b => b.insert(new vscode.Position(i, 0), `// ! edit ${i}\n`));
            await sleep(10);
        }
        await waitFor('the last edit to be decorated', () =>
            callsFor(doc, since).some(c => c.ranges.some(r => doc.getText(r) === `// ! edit ${edits - 1}`)));
        await sleep(300);

        const passes = callsFor(doc, since).length / tagCount();
        assert.ok(passes >= 1 && passes < edits, `expected fewer than ${edits} passes, got ${passes}`);
    });

    describe('settings changes, without a restart', () => {
        const config = () => vscode.workspace.getConfiguration('better-comments');
        let original: unknown;

        before(() => { original = config().inspect('tags')!.globalValue; });
        afterEach(async () => { await config().update('tags', original, vscode.ConfigurationTarget.Global); });

        // Opens a JavaScript document and waits for its first pass to decorate the alert
        async function showDecorated(content: string): Promise<vscode.TextDocument> {
            const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content });
            const since = recorder.editorCalls.length;
            await vscode.window.showTextDocument(doc);
            await waitFor('the alert to be decorated', () => callsFor(doc, since).some(c => c.ranges.some(r => doc.getText(r) === '// ! alert')));
            await sleep(300);
            return doc;
        }

        const decorates = (doc: vscode.TextDocument, since: number, text: string) =>
            callsFor(doc, since).some(c => c.ranges.some(r => doc.getText(r) === text));

        it('decorates a tag added to the settings', async () => {
            const doc = await showDecorated('// @note added at runtime\n// ! alert\n');
            const since = recorder.editorCalls.length;
            await config().update('tags', [...config().get<object[]>('tags')!, { tag: '@note', color: '#00FF00' }], vscode.ConfigurationTarget.Global);
            await waitFor('@note to be decorated', () => decorates(doc, since, '// @note added at runtime'));
        });

        it('stops decorating a tag removed from the settings', async () => {
            const doc = await showDecorated('// ! alert\n// ? query\n');
            const since = recorder.editorCalls.length;
            await config().update('tags', config().get<Array<{ tag: string }>>('tags')!.filter(t => t.tag !== '!'), vscode.ConfigurationTarget.Global);
            const pass = await onePass(doc, since);
            assert.ok(decoratedText(doc, pass).some(t => t.endsWith(': // ? query')), 'the query is still decorated');
            assert.ok(!decorates(doc, since, '// ! alert'), 'the removed alert tag was still decorated');
        });

        it('keeps the current tags when the new settings are invalid', async () => {
            const doc = await showDecorated('// ! alert\n');
            await config().update('tags', [{ color: '#00FF00' }], vscode.ConfigurationTarget.Global);
            await sleep(300);

            // An edit still decorates with the tags from before
            const since = recorder.editorCalls.length;
            await vscode.window.activeTextEditor!.edit(b => b.insert(new vscode.Position(1, 0), '// ! second alert\n'));
            await waitFor('the second alert to be decorated', () => decorates(doc, since, '// ! second alert'));
        });
    });

    it('pinned 10: does not redecorate an editor that is visible but not active', async () => {
        const js = await show('javascript.js', vscode.ViewColumn.One);
        await sleep(300);
        await show('test.py', vscode.ViewColumn.Two);
        await sleep(300);

        const since = recorder.editorCalls.length;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(js.doc.uri, new vscode.Position(0, 0), '// ! edited while inactive\n');
        await vscode.workspace.applyEdit(edit);
        await sleep(500);

        assert.deepStrictEqual(callsFor(js.doc, since), []);
        await vscode.window.showTextDocument(js.doc, vscode.ViewColumn.One);
    });
});
