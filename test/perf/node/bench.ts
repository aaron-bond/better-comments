import { FakeDocument, loadParser, setSettings } from '../../node/fakeVscode';

import * as fs from 'fs';
import { CommentSyntax } from '../../baseline/generate';
import { NodeResult } from '../results';
import { caseKey, defaultSizes, documentText, editLine, lineCount, perfLanguages, perfTagSets, stats } from '../workloads';
import { runUpdate } from '../../parserUpdate';

// Layer 1: the time one decoration update spends in the parser, in plain Node with a fake vscode.
// Runs the build in BC_PARSER_PATH and writes its results to BC_PERF_OUT.

const env = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
};

const build = env('BC_BUILD');
const out = env('BC_PERF_OUT');
const configs: Record<string, CommentSyntax | null> = JSON.parse(fs.readFileSync(env('BC_PERF_CONFIGS'), 'utf8'));
const sizes = process.env.BC_PERF_SIZES ? process.env.BC_PERF_SIZES.split(',').map(Number) : defaultSizes;

const Parser = loadParser();
const now = () => Number(process.hrtime.bigint()) / 1e6;

async function measure(tagSet: typeof perfTagSets[number], language: typeof perfLanguages[number], lines: number): Promise<NodeResult> {
    setSettings({ tags: tagSet.tags, multilineComments: true, highlightPlainText: false });

    const parser = new Parser({ GetCommentConfiguration: async (languageId: string) => configs[languageId] ?? undefined });
    await parser.SetRegex(language.languageId);

    // Alternate between the document with and without the edit line, as the host benchmark's edits do
    const text = documentText(language, lines);
    const docs = [new FakeDocument(text, language.languageId), new FakeDocument(text + editLine(language), language.languageId)];

    let ranges = 0;
    const editors = docs.map(document => ({
        document,
        setDecorations(_type: unknown, r: unknown[]) { ranges += r.length; },
    }));

    const update = (i: number) => {
        const editor = editors[i % 2];
        const start = now();
        runUpdate(parser, editor);
        return now() - start;
    };

    for (let i = 0; i < 5; i++) update(i);
    ranges = 0;
    update(0);
    const rangesPerUpdate = ranges;

    // At least 20 samples and half a second, at most 200 samples
    const samples: number[] = [];
    const started = now();
    while (samples.length < 200 && (samples.length < 20 || now() - started < 500)) {
        samples.push(update(samples.length));
    }

    return {
        build, tagSet: tagSet.name, languageId: language.languageId,
        lines: lineCount(text), chars: text.length, ranges: rangesPerUpdate, update: stats(samples),
    };
}

async function main(): Promise<void> {
    const results: NodeResult[] = [];
    for (const tagSet of perfTagSets) {
        for (const language of perfLanguages) {
            for (const lines of sizes) {
                const result = await measure(tagSet, language, lines);
                results.push(result);
                console.log(`  ${caseKey(result)}: median ${result.update.median.toFixed(2)} ms`);
            }
        }
    }
    fs.writeFileSync(out, JSON.stringify(results, null, 2));
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
