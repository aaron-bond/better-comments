import * as assert from 'assert';
import {
    applyLanguage, beginLanguageSwitch, findsBlockComments, findsJSDocComments, findsLineComments,
    initialLanguageState, LanguageSettings, LanguageState, lineCommentExpression,
} from '../../src/core/languageState';

const defaults: LanguageSettings = { multilineComments: true, highlightPlainText: false };

const js: CommentConfig = { lineComment: '//', blockComment: ['/*', '*/'] };
const python: CommentConfig = { lineComment: '#', blockComment: ['"""', '"""'] };
const shell: CommentConfig = { lineComment: '#' };
const css: CommentConfig = { blockComment: ['/*', '*/'] };

/** Switches language the way the parser does: reset, then apply once the config has loaded */
function switchTo(state: LanguageState, languageCode: string, config: CommentConfig | undefined, settings = defaults): LanguageState {
    return applyLanguage(beginLanguageSwitch(state), languageCode, config, settings);
}

function after(languages: Array<[string, CommentConfig | undefined]>, settings = defaults): LanguageState {
    return languages.reduce((state, [code, config]) => switchTo(state, code, config, settings), initialLanguageState);
}

describe('languageState', () => {
    it('starts supported, with single line matching on and block matching off', () => {
        assert.deepStrictEqual(initialLanguageState, {
            delimiter: '', blockCommentStart: '', blockCommentEnd: '',
            highlightSingleLineComments: true, highlightMultilineComments: false, highlightJSDoc: false,
            isPlainText: false, matchLineStart: false, ignoreFirstLine: false, supportedLanguage: true,
        });
    });

    describe('beginLanguageSwitch', () => {
        it('resets only supportedLanguage, ignoreFirstLine, isPlainText and matchLineStart', () => {
            const busy: LanguageState = {
                delimiter: 'd', blockCommentStart: 's', blockCommentEnd: 'e',
                highlightSingleLineComments: false, highlightMultilineComments: true, highlightJSDoc: true,
                isPlainText: true, matchLineStart: true, ignoreFirstLine: true, supportedLanguage: true,
            };
            assert.deepStrictEqual(beginLanguageSwitch(busy), {
                ...busy, supportedLanguage: false, ignoreFirstLine: false, isPlainText: false, matchLineStart: false,
            });
        });

        it('does not change the state it is given', () => {
            const state = { ...initialLanguageState };
            beginLanguageSwitch(state);
            assert.deepStrictEqual(state, initialLanguageState);
        });
    });

    describe('applyLanguage', () => {
        it('sets up a language with line and block comments', () => {
            assert.deepStrictEqual(switchTo(initialLanguageState, 'csharp', js), {
                ...initialLanguageState,
                delimiter: '\\/\\/', blockCommentStart: '/\\*', blockCommentEnd: '\\*/',
                highlightMultilineComments: true, supportedLanguage: true,
            });
        });

        it('escapes / in line delimiters but not in block delimiters', () => {
            const state = switchTo(initialLanguageState, 'csharp', js);
            assert.strictEqual(new RegExp(state.delimiter).source, '\\/\\/');
            assert.strictEqual(state.blockCommentStart, '/\\*');
        });

        it('takes highlightMultilineComments from the multilineComments setting', () => {
            assert.strictEqual(switchTo(initialLanguageState, 'csharp', js, { ...defaults, multilineComments: false }).highlightMultilineComments, false);
        });

        it('marks a language with no config as unsupported and leaves the delimiters alone', () => {
            const state = switchTo(after([['csharp', js]]), 'log', undefined);
            assert.strictEqual(state.supportedLanguage, false);
            assert.strictEqual(state.delimiter, '\\/\\/');
        });

        it('pinned 1: sets highlightJSDoc for the JS family and never resets it', () => {
            for (const code of ['apex', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact']) {
                assert.strictEqual(switchTo(initialLanguageState, code, js).highlightJSDoc, true, code);
            }
            assert.strictEqual(after([['javascript', js], ['python', python], ['csharp', js]]).highlightJSDoc, true);
        });

        it('pinned 2: a comments object with neither field switches single line matching off for good', () => {
            const state = after([['bc-no-comment-syntax', {}], ['csharp', js]]);
            assert.strictEqual(state.highlightSingleLineComments, false);
            assert.strictEqual(state.supportedLanguage, true);
        });

        it('pinned 3: a block-only language uses its block opener as the line delimiter', () => {
            assert.strictEqual(switchTo(initialLanguageState, 'css', css).delimiter, '\\/\\*');
        });

        it('pinned 4: highlightMultilineComments carries over to a language without block comments', () => {
            const state = after([['javascript', js], ['shellscript', shell]]);
            assert.strictEqual(state.highlightMultilineComments, true);
            assert.strictEqual(state.blockCommentStart, '');
            assert.strictEqual(state.blockCommentEnd, '');
        });

        it('pinned 8: sets ignoreFirstLine for Python, Elixir and Tcl only', () => {
            for (const code of ['python', 'elixir', 'tcl']) {
                assert.strictEqual(switchTo(initialLanguageState, code, shell).ignoreFirstLine, true, code);
            }
            assert.strictEqual(switchTo(after([['python', python]]), 'ruby', shell).ignoreFirstLine, false);
        });

        it('makes plaintext supported, and matched at line starts, only when highlightPlainText is on', () => {
            const off = switchTo(initialLanguageState, 'plaintext', undefined);
            assert.deepStrictEqual([off.isPlainText, off.supportedLanguage, off.matchLineStart], [true, false, false]);
            const on = switchTo(initialLanguageState, 'plaintext', undefined, { ...defaults, highlightPlainText: true });
            assert.deepStrictEqual([on.isPlainText, on.supportedLanguage, on.matchLineStart], [true, true, true]);
        });

        it('pinned 9: a language applied over plaintext mid-switch keeps isPlainText, and matchLineStart follows the setting', () => {
            // Two overlapping switches: plaintext's config resolves, then JavaScript's, with no reset in between
            const plain = applyLanguage(beginLanguageSwitch(initialLanguageState), 'plaintext', undefined, defaults);
            const both = applyLanguage(plain, 'javascript', js, defaults);
            assert.deepStrictEqual([both.isPlainText, both.supportedLanguage, both.matchLineStart], [true, true, false]);
            assert.strictEqual(lineCommentExpression(both, ['!']), '(\\/\\/)+( |\t)*(!)+(.*)');
        });

        it('pinned 11: plaintext keeps the previous language\'s delimiters and block matching', () => {
            const state = after([['javascript', js], ['plaintext', undefined]], { ...defaults, highlightPlainText: true });
            assert.strictEqual(state.blockCommentStart, '/\\*');
            assert.strictEqual(state.highlightMultilineComments, true);
        });

        it('P1: an object-form lineComment gives an empty delimiter', () => {
            const makefile: CommentConfig = { lineComment: { comment: '#', noIndent: true } };
            const state = switchTo(initialLanguageState, 'makefile', makefile);
            assert.strictEqual(state.delimiter, '');
            assert.strictEqual(state.supportedLanguage, true);
        });

        it('uses every delimiter of a language with several line comment formats', () => {
            assert.strictEqual(switchTo(initialLanguageState, 'x', { lineComment: ['//', '#'] }).delimiter, '//|#');
        });

        it('does not change the state it is given', () => {
            const state = beginLanguageSwitch(initialLanguageState);
            const copy = { ...state };
            applyLanguage(state, 'javascript', js, defaults);
            assert.deepStrictEqual(state, copy);
        });
    });

    describe('lineCommentExpression', () => {
        it('matches after the delimiter for a code language', () => {
            assert.strictEqual(lineCommentExpression(after([['python', python]]), ['!']), '(#)+( |\t)*(!)+(.*)');
        });

        it('matches from the start of the line for plaintext with highlightPlainText on', () => {
            const settings = { ...defaults, highlightPlainText: true };
            assert.strictEqual(lineCommentExpression(after([['plaintext', undefined]], settings), ['!']), '(^)+([ \\t]*[ \\t]*)(!)+(.*)');
        });
    });

    describe('which scans run', () => {
        it('runs every scan for a JS-family language by default', () => {
            const state = after([['javascript', js]]);
            assert.deepStrictEqual([findsLineComments(state), findsBlockComments(state), findsJSDocComments(state)], [true, true, true]);
        });

        it('runs the JSDoc scan without block comments once a JS-family language has been seen', () => {
            const settings = { ...defaults, multilineComments: false };
            assert.strictEqual(findsJSDocComments(after([['python', python]], settings)), false);
            assert.strictEqual(findsJSDocComments(after([['javascript', js], ['python', python]], settings)), true);
        });

        it('pinned 1: runs the JSDoc scan in every language while multilineComments is on', () => {
            assert.strictEqual(findsJSDocComments(after([['python', python]])), true);
        });
    });
});
