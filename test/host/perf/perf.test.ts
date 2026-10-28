import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as util from 'util';
import * as vscode from 'vscode';
import { HostResult } from '../../perf/results';
import { caseKey, defaultSizes, documentText, editLine, lineCount, perfLanguages, stats } from '../../perf/workloads';
import { extensionId, recorder } from '../shim';

// Layer 2: what the real activated extension does in a real extension host, for whichever build was
// launched. The extension debounces with setTimeout(updateDecorations, 100), so timing each
// updateDecorations callback gives exact times without changing the extension.

const env = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
};

const build = env('BC_BUILD');
const tagSet = env('BC_TAG_SET');
const out = env('BC_PERF_OUT');
const sizes = process.env.BC_PERF_SIZES ? process.env.BC_PERF_SIZES.split(',').map(Number) : defaultSizes;
const iterations = Number(process.env.BC_PERF_ITERATIONS || 15);
const warmup = 3;

//#region Timing updateDecorations

// uri is the active editor's document when the update ran
interface UpdateRun { uri?: string; scheduledAt: number; start: number; end: number }

const runs: UpdateRun[] = [];
const realSetTimeout = global.setTimeout;

function timedSetTimeout(this: unknown, handler: unknown, delay?: number, ...args: unknown[]) {
    if (typeof handler === 'function' && handler.name === 'updateDecorations') {
        const scheduledAt = performance.now();
        return realSetTimeout(function (this: unknown, ...callArgs: unknown[]) {
            const uri = vscode.window.activeTextEditor?.document.uri.toString();
            const start = performance.now();
            try {
                return (handler as (...a: unknown[]) => unknown).apply(this, callArgs);
            } finally {
                runs.push({ uri, scheduledAt, start, end: performance.now() });
            }
        }, delay, ...args);
    }
    return (realSetTimeout as (...args: unknown[]) => NodeJS.Timeout).call(this, handler, delay, ...args);
}
// Keeps util.promisify(setTimeout) working while the wrapper is installed
(timedSetTimeout as unknown as Record<symbol, unknown>)[util.promisify.custom] =
    (realSetTimeout as unknown as Record<symbol, unknown>)[util.promisify.custom];

const sleep = (ms: number) => new Promise(resolve => realSetTimeout(resolve, ms));

/** The first update of this document that was scheduled after the given time */
async function nextRun(doc: vscode.TextDocument, after: number, timeoutMs = 30000): Promise<UpdateRun> {
    const uri = doc.uri.toString();
    const deadline = performance.now() + timeoutMs;
    for (;;) {
        // Not just any update: closing the previous case's editor schedules one too, which can run once this document is active
        const run = runs.find(r => r.scheduledAt >= after && r.uri === uri);
        if (run) return run;
        if (performance.now() > deadline) throw new Error('Timed out waiting for updateDecorations');
        await sleep(1);
    }
}

/** Waits until no update has started for a while, so one measurement can't overlap the next */
async function settle(quietMs = 150): Promise<void> {
    for (;;) {
        const last = runs.length ? runs[runs.length - 1].end : 0;
        const quietFor = performance.now() - last;
        if (quietFor >= quietMs) return;
        await sleep(quietMs - quietFor);
    }
}

//#endregion

// Ranges the shim saw set on this document since a given call
function rangesSince(doc: vscode.TextDocument, since: number): number | undefined {
    const calls = recorder.editorCalls.slice(since).filter(c => c.uri === doc.uri.toString());
    if (!calls.length) return undefined;

    // Only the last pass: one call per configured tag
    const tags = vscode.workspace.getConfiguration('better-comments').get<unknown[]>('tags')!.length;
    return calls.slice(-tags).reduce((sum, c) => sum + c.ranges.length, 0);
}

describe(`performance: ${build}, ${tagSet} tags`, function () {
    this.timeout(0);

    const results: HostResult[] = [];
    let plainText: vscode.TextDocument;

    before(async () => {
        global.setTimeout = timedSetTimeout as unknown as typeof setTimeout;

        const extension = vscode.extensions.getExtension(extensionId)!;
        assert.strictEqual(path.resolve(extension.extensionPath), path.resolve(env('BC_EXTENSION_ROOT')), 'the build under test is loaded');
        await extension.activate();

        plainText = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'switching away\n' });
    });

    after(() => {
        global.setTimeout = realSetTimeout;
        fs.writeFileSync(out, JSON.stringify(results, null, 2));
    });

    for (const language of perfLanguages) {
        for (const size of sizes) {
            it(`${language.languageId}, ${size} lines`, async () => {
                const text = documentText(language, size);
                const line = editLine(language);
                const doc = await vscode.workspace.openTextDocument({ language: language.languageId, content: text });

                await settle();
                let t0 = performance.now();
                const editor = await vscode.window.showTextDocument(doc);
                let run = await nextRun(doc, t0);
                const open = { total: run.end - t0, update: run.end - run.start };

                // Edit where the user would be looking
                const end = doc.positionAt(text.length);
                editor.selection = new vscode.Selection(end, end);
                editor.revealRange(new vscode.Range(end, end));

                const editTotal: number[] = [];
                const editUpdate: number[] = [];
                const timerLateness: number[] = [];
                let ranges: number | undefined;
                for (let i = 0; i < warmup + iterations; i++) {
                    await settle();
                    const since = recorder.editorCalls.length;
                    const length = doc.getText().length;

                    t0 = performance.now();
                    await editor.edit(edit => i % 2 === 0
                        ? edit.insert(doc.positionAt(length), line)
                        : edit.delete(new vscode.Range(doc.positionAt(length - line.length), doc.positionAt(length))));
                    run = await nextRun(doc, t0);

                    if (i < warmup) continue;
                    editTotal.push(run.end - t0);
                    editUpdate.push(run.end - run.start);
                    timerLateness.push(run.start - run.scheduledAt - 100);
                    if (i % 2 === 1) ranges = rangesSince(doc, since);
                }

                const switchTotal: number[] = [];
                const switchUpdate: number[] = [];
                for (let i = 0; i < 5; i++) {
                    await settle();
                    await vscode.window.showTextDocument(plainText);
                    await settle();

                    t0 = performance.now();
                    await vscode.window.showTextDocument(doc);
                    run = await nextRun(doc, t0);
                    switchTotal.push(run.end - t0);
                    switchUpdate.push(run.end - run.start);
                }

                results.push({
                    build, tagSet, languageId: language.languageId, lines: lineCount(text), vscodeVersion: vscode.version, ranges,
                    open,
                    switchTo: { total: stats(switchTotal), update: stats(switchUpdate) },
                    edit: { total: stats(editTotal), update: stats(editUpdate), timerLateness: stats(timerLateness) },
                });
                const r = results[results.length - 1];
                console.log(`      ${caseKey(r)}: edit ${r.edit.total.median.toFixed(1)} ms, of which update ${r.edit.update.median.toFixed(1)} ms`);

                await settle();
                await vscode.window.showTextDocument(doc);
                await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
            });
        }
    }
});
