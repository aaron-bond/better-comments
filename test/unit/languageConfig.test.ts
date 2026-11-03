import * as assert from 'assert';
import { parseLanguageConfig } from '../../src/core/languageConfig';

describe('parseLanguageConfig', () => {
    it('returns the comments object', () => {
        assert.deepStrictEqual(parseLanguageConfig('{ "comments": { "lineComment": "//", "blockComment": ["/*", "*/"] } }'),
            { lineComment: '//', blockComment: ['/*', '*/'] });
    });

    it('accepts JSON5: comments, trailing commas and unquoted keys', () => {
        const content = `{
            // the comment syntax
            comments: { lineComment: "#", }, /* block */
            brackets: [["(", ")"],],
        }`;
        assert.deepStrictEqual(parseLanguageConfig(content), { lineComment: '#' });
    });

    it('returns undefined when there is no comments object', () => {
        assert.strictEqual(parseLanguageConfig('{ "brackets": [] }'), undefined);
    });

    it('passes an object-form lineComment through unchanged', () => {
        assert.deepStrictEqual(parseLanguageConfig('{ "comments": { "lineComment": { "comment": "#", "noIndent": true } } }'),
            { lineComment: { comment: '#', noIndent: true } });
    });

    it('throws for content that is not valid JSON5', () => {
        assert.throws(() => parseLanguageConfig('{ comments: '));
    });

    it('returns undefined for content that parses to null', () => {
        assert.strictEqual(parseLanguageConfig('null'), undefined);
    });
});
