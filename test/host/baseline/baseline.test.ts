import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { CommentSyntax } from '../../baseline/generate';
import {
    effectiveTags, generatedText, histories, historyName, InputSpec, inputName, languagesUsed,
    noCommentSyntaxLanguage, SettingsVariant, settingsVariants, targets,
} from '../../baseline/matrix';
import { CaseResult, groupByResult, matchHostSnapshot, RecordedRange, Snapshot } from '../../baseline/snapshot';
import { loadOut, recorder, samplesDir, toRanges } from '../shim';
import { runUpdate, setLanguage } from '../../parserUpdate';

// Records what the unmodified parser does for every case in the matrix, in a real VS Code.
// Each case does exactly what updateDecorations in extension.ts does, on a fresh Parser.

const label = process.env.BC_VSCODE_LABEL;
if (!label) throw new Error('BC_VSCODE_LABEL is not set');

const { Configuration } = loadOut('configuration');
const { Parser } = loadOut('parser');

async function applySettings(variant: SettingsVariant): Promise<void> {
    const config = vscode.workspace.getConfiguration('better-comments');
    await config.update('tags', variant.tags, vscode.ConfigurationTarget.Global);
    await config.update('multilineComments', variant.multilineComments, vscode.ConfigurationTarget.Global);
    await config.update('highlightPlainText', variant.highlightPlainText, vscode.ConfigurationTarget.Global);

    const applied = vscode.workspace.getConfiguration('better-comments');
    assert.deepStrictEqual(applied.get('tags'), effectiveTags(variant));
    assert.strictEqual(applied.get('multilineComments'), variant.multilineComments ?? true);
    assert.strictEqual(applied.get('highlightPlainText'), variant.highlightPlainText ?? false);
}

const syntaxCache = new Map<string, CommentSyntax | undefined>();
async function syntaxOf(languageId: string): Promise<CommentSyntax | undefined> {
    if (!syntaxCache.has(languageId)) {
        syntaxCache.set(languageId, await new Configuration().GetCommentConfiguration(languageId));
    }
    return syntaxCache.get(languageId);
}

async function openInput(languageId: string, input: InputSpec, variant: SettingsVariant): Promise<vscode.TextDocument> {
    let doc: vscode.TextDocument;
    if (input.kind === 'sample') {
        doc = await vscode.workspace.openTextDocument(path.join(samplesDir, input.file));
    } else {
        const content = input.kind === 'empty' ? ''
            : generatedText(input, await syntaxOf(input.syntaxFrom), effectiveTags(variant));
        doc = await vscode.workspace.openTextDocument({ language: languageId, content });
    }
    assert.strictEqual(doc.languageId, languageId, `${inputName(input)} opened as ${doc.languageId}`);
    return doc;
}

const position = (p: vscode.Position) => `${p.line}:${p.character}`;

async function runCase(doc: vscode.TextDocument, history: string[]): Promise<{ result: CaseResult; types: Snapshot['decorationTypes'] }> {
    // The constructor is synchronous, so only this parser's types land in between
    const before = recorder.createdTypes.length;
    const parser = new Parser(new Configuration());
    const created = recorder.createdTypes.slice(before);
    const tags: string[] = vscode.workspace.getConfiguration('better-comments').get<Array<{ tag: string }>>('tags')!.map(t => t.tag);
    assert.strictEqual(created.length, tags.length);
    const tagByKey = new Map(created.map((c, i) => [c.type.key, tags[i]]));

    const calls: Array<{ tag: string; ranges: vscode.Range[] }> = [];
    const editor = {
        document: doc,
        setDecorations(type: vscode.TextEditorDecorationType, ranges: Array<vscode.Range | vscode.DecorationOptions>) {
            calls.push({ tag: tagByKey.get(type.key)!, ranges: toRanges(ranges) });
        },
    };

    // Only SetLanguage changes the carried-over flags; FindComments only collects ranges and ApplyDecorations clears them
    for (const languageId of history) {
        await setLanguage(parser, languageId);
    }
    await setLanguage(parser, doc.languageId);

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
        ranges: c.ranges.map((r): RecordedRange => ({ start: position(r.start), end: position(r.end), text: doc.getText(r) })),
    }));

    const types = created.map((c, i) => ({ tag: tags[i], options: c.options }));
    created.forEach(c => c.type.dispose());
    return { result, types };
}

describe(`host baseline (${label})`, function () {
    this.timeout(120000);

    it('has the fixture language with an empty comments object', async () => {
        assert.deepStrictEqual(await syntaxOf(noCommentSyntaxLanguage), {});
    });

    it('records the language configs the Node baseline uses', async () => {
        const dump: Record<string, CommentSyntax | null> = {};
        for (const languageId of languagesUsed) {
            dump[languageId] = (await syntaxOf(languageId)) ?? null;
        }
        matchHostSnapshot('language-configs.json', dump, label);
    });

    for (const variant of settingsVariants) {
        describe(`settings: ${variant.name}`, () => {
            before(() => applySettings(variant));

            for (const target of targets) {
                for (const input of target.inputs) {
                    it(`${target.languageId} / ${inputName(input)}`, async () => {
                        const doc = await openInput(target.languageId, input, variant);

                        const byHistory: Array<[string, CaseResult]> = [];
                        let decorationTypes: Snapshot['decorationTypes'] | undefined;
                        for (const history of histories) {
                            const { result, types } = await runCase(doc, history);
                            byHistory.push([historyName(history), result]);
                            if (decorationTypes) assert.deepStrictEqual(types, decorationTypes, 'decoration types depend on history');
                            decorationTypes = types;
                        }

                        const snapshot: Snapshot = {
                            settings: variant.name,
                            target: target.languageId,
                            input: inputName(input),
                            languageId: doc.languageId,
                            eol: doc.eol === vscode.EndOfLine.CRLF ? 'CRLF' : 'LF',
                            decorationTypes: decorationTypes!,
                            results: groupByResult(byHistory),
                        };
                        matchHostSnapshot(path.join(variant.name, `${target.languageId}--${inputName(input)}.json`), snapshot, label);
                    });
                }
            }
        });
    }

    after(() => applySettings({ name: 'reset' }));
});
