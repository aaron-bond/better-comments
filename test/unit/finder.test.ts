import * as assert from 'assert';
import { findBlockComments, findJSDocComments, findLineComments, TagMatch } from '../../src/core/finder';
import { buildLineCommentExpression, escapeLineDelimiter, escapeTag } from '../../src/core/regex';

const tags = ['!', '?', '//', 'todo', '*'];
const escaped = tags.map(escapeTag);

/** The matched text for each match, with its tag */
function texts(text: string, matches: Iterable<TagMatch>): string[] {
    return [...matches].map(m => `${tags[m.tagIndex]}: ${text.slice(m.start, m.end)}`);
}

const line = (text: string, delimiter = '//', options: { plainText?: boolean; ignoreFirstLine?: boolean } = {}) =>
    texts(text, findLineComments(text, buildLineCommentExpression(escaped, escapeLineDelimiter(delimiter), !!options.plainText),
        !!options.plainText, !!options.ignoreFirstLine, tags));

describe('finder', () => {
    describe('findLineComments', () => {
        it('matches from the delimiter to the end of the line', () => {
            assert.deepStrictEqual(line('code(); // ! alert\n// TODO: later\n'), ['!: // ! alert', 'todo: // TODO: later']);
        });

        it('ignores comments without a tag straight after the delimiter', () => {
            assert.deepStrictEqual(line('// not ! a tag\n'), []);
        });

        it('matches tags inside string literals too', () => {
            assert.deepStrictEqual(line('let s = "// ! in a string";\n'), ['!: // ! in a string";']);
        });

        it('matches the tag case-insensitively', () => {
            assert.deepStrictEqual(line('// ToDo mixed case\n'), ['todo: // ToDo mixed case']);
        });

        it('treats //// as the // tag after a // delimiter', () => {
            assert.deepStrictEqual(line('//// removed\n'), ['//: //// removed']);
        });

        it('stops at the line break, CRLF included', () => {
            assert.deepStrictEqual(line('// ! one\r\n// ? two\r\n'), ['!: // ! one', '?: // ? two']);
        });

        it('pinned 8: ignoreFirstLine skips a match only at the very start of the text', () => {
            assert.deepStrictEqual(line('# ! first\n# ! second\n', '#', { ignoreFirstLine: true }), ['!: # ! second']);
            assert.deepStrictEqual(line(' # ! first, indented\n', '#', { ignoreFirstLine: true }), ['!: # ! first, indented']);
        });

        it('matches tags at the start of each line for plaintext', () => {
            assert.deepStrictEqual(line('! alert\n  ? question\nnot ! a tag\n', '', { plainText: true }), ['!: ! alert', '?:   ? question']);
        });

        it('P3: steps past zero-length matches instead of looping forever', () => {
            const withEmpty = [...tags, ''];
            const text = '! alert\n\nplain\n';
            const expression = buildLineCommentExpression(withEmpty.map(escapeTag), '', true);
            const found = [...findLineComments(text, expression, true, false, withEmpty)].map(m => [withEmpty[m.tagIndex], text.slice(m.start, m.end)]);
            assert.deepStrictEqual(found, [['!', '! alert'], ['', 'plain']]);
        });

        it('yields each match as it is found, so a later failure keeps the earlier matches', () => {
            // Group 3 doesn't take part on the second line, so the tag lookup throws there
            const found: string[] = [];
            assert.throws(() => {
                for (const m of findLineComments('// ! first\n// x\n', '(\\/\\/)+( )*(!)?(.*)', false, false, tags)) {
                    found.push(tags[m.tagIndex]);
                }
            }, TypeError);
            assert.deepStrictEqual(found, ['!']);
        });
    });

    describe('findBlockComments', () => {
        const block = (text: string) => texts(text, findBlockComments(text, escaped, tags, '/\\*', '\\*/'));

        it('matches tagged lines inside a block, from the tag to the end of the line', () => {
            assert.deepStrictEqual(block('/*\n  ! alert\n  plain\n  TODO: later\n*/\n'), ['!: ! alert', 'todo: TODO: later']);
        });

        it('needs whitespace after the opener', () => {
            assert.deepStrictEqual(block('/*! no space\n*/\n'), []);
        });

        it('only matches tags at the start of a line within the block', () => {
            assert.deepStrictEqual(block('/* ! on the opening line */\n'), []);
        });

        it('ignores an unterminated block', () => {
            assert.deepStrictEqual(block('/*\n  ! never closed\n'), []);
        });

        it('pinned 4: finds nothing with empty delimiters', () => {
            const text = '/*\n  ! alert\n*/\n# ! line\n';
            assert.deepStrictEqual(texts(text, findBlockComments(text, escaped, tags, '', '')), []);
        });
    });

    describe('findJSDocComments', () => {
        const jsdoc = (text: string) => texts(text, findJSDocComments(text, escaped, tags));

        it('matches tagged lines after the leading *', () => {
            assert.deepStrictEqual(jsdoc('/**\n * ! alert\n * plain\n *   ? question\n */\n'), ['!: ! alert', '?: ? question']);
        });

        it('ignores /* */ blocks that are not JSDoc', () => {
            assert.deepStrictEqual(jsdoc('/*\n * ! alert\n */\n'), []);
        });

        it('pinned 1: works on any text, whatever the language', () => {
            assert.deepStrictEqual(jsdoc('def f():\n    /**\n     * ! in python\n     */\n'), ['!: ! in python']);
        });
    });
});
