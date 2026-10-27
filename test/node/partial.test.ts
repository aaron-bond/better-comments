import { FakeDocument, loadParser, Range, setSettings } from './fakeVscode';

import * as assert from 'assert';

// If a scan throws partway through, the matches it found before the throw stay in the tags' ranges.
// ApplyDecorations doesn't run for that update, so they are applied by the next one, along with its own.
// The parser's own expressions always capture a tag, so nothing it builds throws today: the test swaps
// in an expression whose tag group is optional, so the tag lookup throws on the second line.

const Parser = loadParser();

describe('a scan that throws partway through', () => {
    it('keeps the matches before the throw, and the next update applies them too', async () => {
        setSettings({ tags: [{ tag: '!', color: '#FF2D00' }], multilineComments: true, highlightPlainText: false });
        const parser = new Parser({ GetCommentConfiguration: async () => ({ lineComment: '//' }) });
        await parser.SetRegex('javascript');

        const applied: string[][] = [];
        const editor = (text: string) => ({
            document: new FakeDocument(text, 'javascript'),
            setDecorations(_type: unknown, ranges: Array<{ range: Range }>) {
                applied.push(ranges.map(({ range: r }) => `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`));
            },
        });

        const expression = parser.expression;
        parser.expression = '(\\/\\/)+( )*(!)?(.*)';
        assert.throws(() => parser.FindSingleLineComments(editor('// ! first\n// x\n')), TypeError);

        parser.expression = expression;
        const next = editor('// ! next\n');
        parser.FindSingleLineComments(next);
        parser.ApplyDecorations(next);

        assert.deepStrictEqual(applied, [['0:0-0:10', '0:0-0:9']]);
    });
});
