import * as assert from 'assert';
import {
    buildBlockCommentExpression, buildBlockLineExpression, buildJSDocLineExpression, buildLineCommentExpression,
    escapeLineDelimiter, escapeRegExp, escapeTag, jsDocCommentExpression,
} from '../../src/core/regex';

describe('regex', () => {
    describe('escapeTag', () => {
        const cases: Array<[string, string]> = [
            ['!', '!'],
            ['TODO', 'TODO'],
            ['?', '\\?'],
            ['*', '\\*'],
            ['+', '\\+'],
            ['.', '\\.'],
            ['$', '\\$'],
            ['^', '\\^'],
            ['|', '\\|'],
            ['(', '\\('],
            [')', '\\)'],
            ['[', '\\['],
            ['{', '\\{'],
            ['\\', '\\\\'],
            ['//', '\\/\\/'],
            ['@note', '@note'],
            ['', ''],
        ];
        for (const [tag, expected] of cases) {
            it(`escapes ${JSON.stringify(tag)}`, () => assert.strictEqual(escapeTag(tag), expected));
        }

        // pinned 6: escaped with its own character class, which leaves these alone
        for (const tag of [']', '}', '-']) {
            it(`pinned 6: leaves ${JSON.stringify(tag)} unescaped`, () => assert.strictEqual(escapeTag(tag), tag));
        }

        it('pinned 6: unescaped ], } and - are still literal outside a character class', () => {
            for (const tag of [']', '}', '-']) {
                assert.ok(new RegExp(escapeTag(tag)).test(`x${tag}x`));
            }
        });
    });

    describe('escapeRegExp', () => {
        it('escapes every regex metacharacter', () => {
            assert.strictEqual(escapeRegExp('.*+?^${}()|[]\\'), '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
        });

        it('leaves / alone', () => assert.strictEqual(escapeRegExp('//'), '//'));
    });

    describe('escapeLineDelimiter', () => {
        it('escapes a string delimiter, including slashes', () => {
            assert.strictEqual(escapeLineDelimiter('//'), '\\/\\/');
            assert.strictEqual(escapeLineDelimiter('#'), '#');
            assert.strictEqual(escapeLineDelimiter('--'), '--');
        });

        it('joins several delimiters, without escaping slashes', () => {
            assert.strictEqual(escapeLineDelimiter(['//', '#']), '//|#');
            assert.strictEqual(escapeLineDelimiter(['*>', '.']), '\\*>|\\.');
        });

        it('gives an empty delimiter for an empty array', () => {
            assert.strictEqual(escapeLineDelimiter([]), '');
        });

        it('drops empty delimiters, which would match anywhere in a line', () => {
            assert.strictEqual(escapeLineDelimiter(['', '#']), '#');
            assert.strictEqual(escapeLineDelimiter(['']), '');
        });
    });

    describe('expressions', () => {
        it('builds the single line expression after a delimiter', () => {
            assert.strictEqual(buildLineCommentExpression(['!', '\\?'], '\\/\\/', false), '(\\/\\/)+( |\t)*(!|\\?)+(.*)');
        });

        it('builds the plaintext expression from the start of a line', () => {
            assert.strictEqual(buildLineCommentExpression(['!', '\\?'], 'ignored', true), '(^)+([ \\t]*[ \\t]*)(!|\\?)+(.*)');
        });

        it('builds the block comment expression', () => {
            assert.strictEqual(buildBlockCommentExpression('\\/\\*', '\\*\\/'), '(^|[ \\t])(\\/\\*[\\s])+([\\s\\S]*?)(\\*\\/)');
        });

        it('builds the block line expression', () => {
            assert.strictEqual(buildBlockLineExpression(['!', 'todo']), '(^)+([ \\t]*[ \\t]*)(!|todo)([ ]*|[:])+([^*/][^\\r\\n]*)');
        });

        it('builds the JSDoc line expression, after the leading *', () => {
            assert.strictEqual(buildJSDocLineExpression(['!', 'todo']), '(^)+([ \\t]*\\*[ \\t]*)(!|todo)([ ]*|[:])+([^*/][^\\r\\n]*)');
        });

        it('finds /** */ blocks', () => {
            assert.strictEqual(jsDocCommentExpression, '(^|[ \\t])(\\/\\*\\*)+([\\s\\S]*?)(\\*\\/)');
        });
    });
});
