import { FakeDocument, loadParser, Range, setSettings } from './fakeVscode';

import * as assert from 'assert';
import { matchSnapshot } from '../baseline/snapshot';

// Pinned 9: language switches are async and change state shared by every editor, so two switches can
// overlap. The baseline only ever switches one language at a time, so this records what happens when
// they overlap: every ordered pair of languages, finishing in either order, observed part way through.
// The snapshot was recorded from v3.0.2 (BC_PARSER_PATH pointing at its build).

const Parser = loadParser();

const configs: Record<string, CommentConfig> = {
    javascript: { lineComment: '//', blockComment: ['/*', '*/'] },
    csharp: { lineComment: '//', blockComment: ['/*', '*/'] },
    python: { lineComment: '#', blockComment: ['"""', '"""'] },
    css: { blockComment: ['/*', '*/'] },
    'bc-no-comment-syntax': {},
};
const languages = ['javascript', 'csharp', 'python', 'css', 'plaintext', 'log', 'bc-no-comment-syntax'];
const primes = [[], ['javascript'], ['bc-no-comment-syntax']];
const settingsVariants = [
    { multilineComments: true, highlightPlainText: false },
    { multilineComments: false, highlightPlainText: true },
    { multilineComments: true, highlightPlainText: true },
];

const text = '# ! py\n// ! js\n/* ! block */\n/*\n ! inside\n*/\n/**\n * ! jsdoc\n */\n! bare\n';
const doc = new FakeDocument(text, 'irrelevant');

function observe(parser: any): string {
    const applied: string[] = [];
    const editor = {
        document: doc,
        setDecorations(_type: unknown, ranges: Array<{ range: Range }>) {
            applied.push(ranges.map(({ range: r }) => `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`).join(','));
        },
    };

    const supported = parser.supportedLanguage;
    let error: string | undefined;
    if (supported) {
        try {
            parser.FindSingleLineComments(editor);
            parser.FindBlockComments(editor);
            parser.FindJSDocComments(editor);
            parser.ApplyDecorations(editor);
        } catch (e) {
            error = String(e);
        }
    }
    return JSON.stringify({ supported, error, applied });
}

const tick = () => new Promise(resolve => setImmediate(resolve));

async function scenario(prime: string[], first: string, second: string, reversed: boolean): Promise<string[]> {
    // Each config read waits until the scenario releases it
    const pending: Array<() => void> = [];
    const configuration = {
        GetCommentConfiguration: (id: string) => new Promise(resolve => pending.push(() => resolve(configs[id]))),
    };
    const parser = new Parser(configuration);
    const log: string[] = [];

    for (const language of prime) {
        const done = parser.SetRegex(language);
        await tick();
        pending.shift()!();
        await done;
    }

    const a = parser.SetRegex(first);
    await tick();
    log.push(`during first: ${observe(parser)}`);

    const b = parser.SetRegex(second);
    await tick();
    log.push(`during both: ${observe(parser)}`);

    const [x, y] = reversed ? [pending[1], pending[0]] : [pending[0], pending[1]];
    x();
    await tick();
    await tick();
    log.push(`after one resolves: ${observe(parser)}`);

    y();
    await Promise.all([a, b]);
    log.push(`after both: ${observe(parser)}`);
    return log;
}

describe('overlapping language switches (pinned 9)', () => {
    it('match what v3.0.2 did', async () => {
        const results: Record<string, string[]> = {};
        for (const settings of settingsVariants) {
            setSettings({ ...settings, tags: [{ tag: '!', color: '#f00' }, { tag: 'todo', color: '#0f0' }] });
            for (const prime of primes) {
                for (const first of languages) {
                    for (const second of languages) {
                        for (const reversed of [false, true]) {
                            const name = [
                                `multiline=${settings.multilineComments}`, `plaintext=${settings.highlightPlainText}`,
                                `after=${prime.join('>') || 'none'}`, `${first} then ${second}`, reversed ? 'second finishes first' : 'in order',
                            ].join(' | ');
                            results[name] = await scenario(prime, first, second, reversed);
                        }
                    }
                }
            }
        }

        assert.strictEqual(Object.keys(results).length, 882);
        matchSnapshot('overlapping-switches.json', results);
    });
});
