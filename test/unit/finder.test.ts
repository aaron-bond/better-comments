import * as assert from 'assert';
import { findTags, MatchTag } from '../../src/core/finder';
import { applyLanguage, beginLanguageSwitch, initialLanguageState, LanguageSettings, LanguageState } from '../../src/core/languageState';
import { escapeTag } from '../../src/core/regex';

const tagNames = ['!', '?', '//', 'todo', '*'];
const tags: MatchTag[] = tagNames.map(tag => ({ tag, escapedTag: escapeTag(tag) }));
const defaults: LanguageSettings = { multilineComments: true, highlightPlainText: false };

// Languages that only exist here, so the language code switches nothing on
const lineOnly = { lineComment: '//' };
const cStyle: CommentConfig = { lineComment: '//', blockComment: ['/*', '*/'] };
const python = { lineComment: '#' };

/** The state after switching through these languages in turn */
function stateAfter(languages: Array<[string, CommentConfig | undefined]>, settings = defaults): LanguageState {
    let state = initialLanguageState;
    for (const [languageId, config] of languages) {
        state = applyLanguage(beginLanguageSwitch(state), languageId, config, settings);
    }
    return state;
}

/** The matched text for each match, with its tag, in the order findTags returns them */
function find(text: string, languages: Array<[string, CommentConfig | undefined]>, settings = defaults, withTags = tags): string[] {
    return findTags(text, stateAfter(languages, settings), withTags, settings)
        .map(m => `${withTags[m.tagIndex].tag}: ${text.slice(m.start, m.end)}`);
}

describe('finder', () => {
    describe('findTags', () => {
        it('returns single line, then block, then JSDoc matches, whatever their order in the text', () => {
            const text = '/*\n ! block\n*/\n/**\n * ? doc\n */\n// ! line\n';
            assert.deepStrictEqual(find(text, [['javascript', cStyle]]), ['!: // ! line', '!: ! block', '?: ? doc']);
        });

        it('only runs the scans the language state allows', () => {
            const text = '/*\n ! block\n*/\n/**\n * ? doc\n */\n// ! line\n';
            assert.deepStrictEqual(find(text, [['bc-line', lineOnly]]), ['!: // ! line']);
        });

        it('returns nothing when there are no tags in the text', () => {
            assert.deepStrictEqual(find('let a = 1; // plain\n', [['javascript', cStyle]]), []);
        });
    });

    describe('single line comments', () => {
        const line = (text: string) => find(text, [['bc-line', lineOnly]]);

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
            assert.deepStrictEqual(find('# ! first\n# ! second\n', [['python', python]]), ['!: # ! second']);
            assert.deepStrictEqual(find(' # ! first, indented\n', [['python', python]]), ['!: # ! first, indented']);
        });

        it('matches tags at the start of each line for plaintext', () => {
            const settings = { ...defaults, highlightPlainText: true };
            assert.deepStrictEqual(find('! alert\n  ? question\nnot ! a tag\n', [['plaintext', undefined]], settings), ['!: ! alert', '?:   ? question']);
        });

        it('P3: steps past zero-length matches instead of looping forever', () => {
            const settings = { ...defaults, highlightPlainText: true };
            const withEmpty = [...tags, { tag: '', escapedTag: '' }];
            assert.deepStrictEqual(find('! alert\n\nplain\n', [['plaintext', undefined]], settings, withEmpty), ['!: ! alert', ': plain']);
        });
    });

    describe('block comments', () => {
        const block = (text: string) => find(text, [['bc-c', cStyle]]);

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

        it('is off when multiline comments are', () => {
            assert.deepStrictEqual(find('/*\n  ! alert\n*/\n', [['bc-c', cStyle]], { ...defaults, multilineComments: false }), []);
        });

        it('pinned 4: finds nothing with the empty delimiters a line-only language leaves behind', () => {
            // Block comments stay switched on from the previous language, with empty delimiters
            const state = stateAfter([['bc-c', cStyle], ['bc-line', lineOnly]]);
            assert.deepStrictEqual([state.highlightMultilineComments, state.blockCommentStart, state.blockCommentEnd], [true, '', '']);
            assert.deepStrictEqual(find('/*\n  ! alert\n*/\n# ! line\n', [['bc-c', cStyle], ['bc-line', lineOnly]]), []);
        });
    });

    describe('JSDoc comments', () => {
        // Multiline comments off, so only the JSDoc scan finds anything in a /* */ block
        const noMultiline = { ...defaults, multilineComments: false };
        const jsdoc = (text: string) => find(text, [['javascript', cStyle]], noMultiline);

        it('matches tagged lines after the leading *', () => {
            assert.deepStrictEqual(jsdoc('/**\n * ! alert\n * plain\n *   ? question\n */\n'), ['!: ! alert', '?: ? question']);
        });

        it('ignores /* */ blocks that are not JSDoc', () => {
            assert.deepStrictEqual(jsdoc('/*\n * ! alert\n */\n'), []);
        });

        it('pinned 1: carries on into the next language once a JSDoc language has been used', () => {
            const text = 'def f():\n    /**\n     * ! in python\n     */\n';
            assert.deepStrictEqual(find(text, [['python', python]], noMultiline), []);
            assert.deepStrictEqual(find(text, [['javascript', cStyle], ['python', python]], noMultiline), ['!: ! in python']);
        });
    });
});
