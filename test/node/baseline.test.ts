import { createdTypes, FakeDocument, loadParser, Range, setSettings } from './fakeVscode';

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { CommentSyntax } from '../baseline/generate';
import {
    effectiveTags, generatedText, histories, historyName, InputSpec, inputName, SettingsVariant, settingsVariants, targets,
} from '../baseline/matrix';
import { CaseResult, groupByResult, matchSnapshot, snapshotRoot, Snapshot } from '../baseline/snapshot';
import { repoRoot } from '../repo';
import { runUpdate } from '../parserUpdate';

// The host baseline's matrix, run in plain Node against the real Parser with a fake vscode and the language
// configs the host recorded. It compares against the host's snapshots and never writes them, so passing
// means Node and the real host agree.

const Parser = loadParser();
const samplesDir = path.join(repoRoot, 'test/fixtures/samples');
const labels = fs.readdirSync(snapshotRoot).filter(name => fs.existsSync(path.join(snapshotRoot, name, 'language-configs.json')));

function settingsFor(variant: SettingsVariant) {
    return {
        tags: effectiveTags(variant),
        multilineComments: variant.multilineComments ?? true,
        highlightPlainText: variant.highlightPlainText ?? false,
    };
}

function inputText(input: InputSpec, configs: Record<string, CommentSyntax | null>, variant: SettingsVariant): string {
    switch (input.kind) {
        case 'sample': return fs.readFileSync(path.join(samplesDir, input.file), 'utf8');
        case 'empty': return '';
        case 'generated': return generatedText(input, configs[input.syntaxFrom] ?? undefined, effectiveTags(variant));
    }
}

const position = (p: { line: number; character: number }) => `${p.line}:${p.character}`;

async function runCase(doc: FakeDocument, history: string[], configs: Record<string, CommentSyntax | null>, tags: string[]) {
    // Each GetCommentConfiguration call resolves asynchronously, as the real one does
    const configuration = { GetCommentConfiguration: async (languageId: string) => configs[languageId] ?? undefined };

    const before = createdTypes.length;
    const parser = new Parser(configuration);
    const created = createdTypes.slice(before);
    assert.strictEqual(created.length, tags.length);
    const tagByKey = new Map(created.map((c, i) => [c.key, tags[i]]));

    const calls: Array<{ tag: string; ranges: Range[] }> = [];
    const editor = {
        document: doc,
        setDecorations(type: { key: string }, ranges: Array<{ range: Range }>) {
            calls.push({ tag: tagByKey.get(type.key)!, ranges: ranges.map(r => r.range) });
        },
    };

    for (const languageId of history) {
        await parser.SetRegex(languageId);
    }
    await parser.SetRegex(doc.languageId);

    const result: CaseResult = { supported: parser.supportedLanguage, setDecorationsCalls: 0, applied: [] };
    if (parser.supportedLanguage) {
        try {
            runUpdate(parser, editor);
        } catch (e) {
            result.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        }
    }

    result.setDecorationsCalls = calls.length;
    result.applied = calls.filter(c => c.ranges.length).map(c => ({
        tag: c.tag,
        ranges: c.ranges.map(r => ({ start: position(r.start), end: position(r.end), text: doc.getText(r) })),
    }));

    return { result, types: created.map((c, i) => ({ tag: tags[i], options: c.options })) };
}

describe('Node baseline', () => {
    it('has host snapshots to compare against', () => {
        assert.ok(labels.length > 0, `No host snapshots under ${snapshotRoot}. Run npm run test:baseline:host -- --update-snapshots first.`);
    });

    for (const label of labels) {
        describe(label, () => {
            const configs: Record<string, CommentSyntax | null> =
                JSON.parse(fs.readFileSync(path.join(snapshotRoot, label, 'language-configs.json'), 'utf8'));

            for (const variant of settingsVariants) {
                describe(`settings: ${variant.name}`, () => {
                    for (const target of targets) {
                        for (const input of target.inputs) {
                            it(`${target.languageId} / ${inputName(input)}`, async () => {
                                const settings = settingsFor(variant);
                                setSettings(settings);
                                const doc = new FakeDocument(inputText(input, configs, variant), target.languageId);

                                const byHistory: Array<[string, CaseResult]> = [];
                                let decorationTypes: Snapshot['decorationTypes'] | undefined;
                                for (const history of histories) {
                                    const { result, types } = await runCase(doc, history, configs, settings.tags.map(t => t.tag));
                                    byHistory.push([historyName(history), result]);
                                    decorationTypes = types;
                                }

                                const snapshot: Snapshot = {
                                    settings: variant.name,
                                    target: target.languageId,
                                    input: inputName(input),
                                    languageId: doc.languageId,
                                    eol: doc.eol,
                                    decorationTypes: decorationTypes!,
                                    results: groupByResult(byHistory),
                                };
                                matchSnapshot(path.join(label, variant.name, `${target.languageId}--${inputName(input)}.json`), snapshot, { readOnly: true });
                            });
                        }
                    }
                });
            }
        });
    }
});
