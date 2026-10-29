import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigurationLike, ParserConstructor } from '../../parserUpdate';
import { packageJson } from '../../repo';
import { extensionActiveAtInstall, extensionId, loadOut, recorder, samplesDir, SetDecorationsCall } from '../shim';

// Checks that the harness itself can see what the unmodified extension does.
// If these fail, every other host test is suspect.

const defaultTags = packageJson.contributes.configuration.properties['better-comments.tags'].default as Array<{ tag: string; color: string }>;

const loadConfiguration = () => loadOut<{ Configuration: new () => ConfigurationLike }>('configuration').Configuration;
const loadParser = () => loadOut<{ Parser: ParserConstructor }>('parser').Parser;

async function waitFor<T>(what: string, check: () => T | undefined, timeoutMs = 5000): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = check();
        if (result) return result;
        if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
        await new Promise(r => setTimeout(r, 50));
    }
}

const callsFor = (doc: vscode.TextDocument): SetDecorationsCall[] =>
    recorder.editorCalls.filter(c => c.uri === doc.uri.toString());

describe('test harness', () => {
    it('installs the shim before the extension activates', () => {
        assert.strictEqual(extensionActiveAtInstall, false);
    });

    it('records the decoration types the unmodified parser creates', () => {
        const Configuration = loadConfiguration();
        const Parser = loadParser();

        // The constructor is synchronous, so nothing else can create types in between
        const before = recorder.createdTypes.length;
        new Parser(new Configuration());
        const created = recorder.createdTypes.slice(before);

        assert.deepStrictEqual(created.map(c => c.options.color), defaultTags.map(t => t.color));
    });

    it('passes theme colours from the settings through to the decoration types', async () => {
        const config = vscode.workspace.getConfiguration('better-comments');
        const themeColour = { tag: '!', color: { id: 'editorError.foreground' }, backgroundColor: { id: 'editor.background' } };
        await config.update('tags', [themeColour], vscode.ConfigurationTarget.Global);
        try {
            const Configuration = loadConfiguration();
            const Parser = loadParser();

            const before = recorder.createdTypes.length;
            new Parser(new Configuration());
            const created = recorder.createdTypes.slice(before);

            assert.deepStrictEqual(created.map(c => [c.options.color, c.options.backgroundColor]),
                [[{ id: 'editorError.foreground' }, { id: 'editor.background' }]]);
        } finally {
            await config.update('tags', undefined, vscode.ConfigurationTarget.Global);
        }
    });

    it('reads the real built-in language configs', async () => {
        const Configuration = loadConfiguration();
        const config = new Configuration();

        const lineComments: Record<string, unknown> = {};
        for (const languageId of ['javascript', 'csharp', 'python']) {
            lineComments[languageId] = (await config.GetCommentConfiguration(languageId))?.lineComment;
        }
        assert.deepStrictEqual(lineComments, { javascript: '//', csharp: '//', python: '#' });
    });

    it('treats a language whose config is unreadable or missing as having none', async () => {
        const Configuration = loadConfiguration();
        const config = new Configuration();

        assert.strictEqual(await config.GetCommentConfiguration('bc-broken-config'), undefined);
        assert.strictEqual(await config.GetCommentConfiguration('bc-missing-config'), undefined);
        // A failed read is remembered, not retried
        assert.strictEqual(await config.GetCommentConfiguration('bc-broken-config'), undefined);
    });

    it('captures the activated extension decorating an opened file', async () => {
        const doc = await vscode.workspace.openTextDocument(path.join(samplesDir, 'javascript.js'));
        await vscode.window.showTextDocument(doc);
        await vscode.extensions.getExtension(extensionId)!.activate();

        await waitFor('decorations on javascript.js', () => callsFor(doc).some(c => c.ranges.length > 0));
    });

    it('captures the activated extension updating after an edit', async () => {
        // Untitled, so nothing on disk is touched
        const doc = await vscode.workspace.openTextDocument({ language: 'javascript', content: 'const a = 1;\n' });
        const editor = await vscode.window.showTextDocument(doc);
        await waitFor('first decoration pass', () => callsFor(doc).length > 0);

        await editor.edit(b => b.insert(new vscode.Position(0, 0), '// ! harness edit\n'));

        const alert = await waitFor('the new alert to be decorated', () => callsFor(doc).find(c =>
            c.ranges.some(r => r.start.line === 0 && r.start.character === 0)));
        const range = alert.ranges.find(r => r.start.line === 0)!;
        assert.strictEqual(doc.getText(range), '// ! harness edit');

        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    });
});
