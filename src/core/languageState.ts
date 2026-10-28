import { buildLineCommentExpression, escapeLineDelimiter, escapeRegExp } from './regex';

// The per-language state the parser carries from one language to the next.
// Some of it is never reset (see beginLanguageSwitch), so the previous languages affect the next one.

export interface LanguageState {
    delimiter: string;
    blockCommentStart: string;
    blockCommentEnd: string;

    highlightSingleLineComments: boolean;
    highlightMultilineComments: boolean;
    highlightJSDoc: boolean;

    // * this will allow plaintext files to show comment highlighting if switched on
    isPlainText: boolean;

    // True when single line comments are matched at the start of a line instead of after a delimiter:
    // plaintext with highlightPlainText on. Set and reset with isPlainText
    matchLineStart: boolean;

    // * this is used to prevent the first line of the file (specifically python) from coloring like other comments
    ignoreFirstLine: boolean;

    // * this is used to trigger the events when a supported language code is found
    supportedLanguage: boolean;
}

export interface LanguageSettings {
    multilineComments: boolean;
    highlightPlainText: boolean;
}

export const initialLanguageState: LanguageState = {
    delimiter: "",
    blockCommentStart: "",
    blockCommentEnd: "",
    highlightSingleLineComments: true,
    highlightMultilineComments: false,
    highlightJSDoc: false,
    isPlainText: false,
    matchLineStart: false,
    ignoreFirstLine: false,
    supportedLanguage: true,
};

/**
 * The part of a language switch that happens before the language's config has been loaded
 * ? kept separate from applyLanguage because overlapping switches interleave between the two
 */
export function beginLanguageSwitch(state: LanguageState): LanguageState {
    return {
        ...state,
        supportedLanguage: false,
        ignoreFirstLine: false,
        isPlainText: false,
        matchLineStart: false,
    };
}

/**
 * The part of a language switch that happens once the language's config has been loaded
 * @param state The state after beginLanguageSwitch
 * @param languageCode The short code of the language
 * https://code.visualstudio.com/docs/languages/identifiers
 * @param config The language's comment syntax, or undefined if it has none
 * @param settings The better-comments settings
 */
export function applyLanguage(
        state: LanguageState,
        languageCode: string,
        config: CommentConfig | undefined,
        settings: LanguageSettings): LanguageState {

    let next = { ...state };

    if (config) {
        const blockCommentStart = config.blockComment ? config.blockComment[0] : null;
        const blockCommentEnd = config.blockComment ? config.blockComment[1] : null;

        next = setCommentFormat(next, settings, config.lineComment || blockCommentStart, blockCommentStart, blockCommentEnd);

        next.supportedLanguage = true;
    }

    switch (languageCode) {
        case "apex":
        case "javascript":
        case "javascriptreact":
        case "typescript":
        case "typescriptreact":
            next.highlightJSDoc = true;
            break;

        case "elixir":
        case "python":
        case "tcl":
            next.ignoreFirstLine = true;
            break;

        case "plaintext":
            next.isPlainText = true;
            next.matchLineStart = settings.highlightPlainText;

            // If highlight plaintext is enabled, this is a supported language
            next.supportedLanguage = settings.highlightPlainText;
            break;
    }

    return next;
}

/**
 * Builds the single line comment expression for the current language
 * @param state The state after applyLanguage
 * @param escapedTags The escaped tags, in configuration order
 */
export function lineCommentExpression(state: LanguageState, escapedTags: string[]): string {
    return buildLineCommentExpression(escapedTags, state.delimiter, state.matchLineStart);
}

// If highlight single line comments is off, single line comments are not supported for this language
export function findsLineComments(state: LanguageState): boolean {
    return state.highlightSingleLineComments;
}

// If highlight multiline is off in package.json or doesn't apply to his language, block comments aren't searched
export function findsBlockComments(state: LanguageState): boolean {
    return state.highlightMultilineComments;
}

// JSDoc comments are searched when multiline comments are, and for languages that have used JSDoc
export function findsJSDocComments(state: LanguageState): boolean {
    return state.highlightMultilineComments || state.highlightJSDoc;
}

/**
 * Set up the comment format for single and multiline highlighting
 * @param singleLine The single line comment delimiter. If NULL, single line is not supported
 * @param start The start delimiter for block comments
 * @param end The end delimiter for block comments
 */
function setCommentFormat(
        state: LanguageState,
        settings: LanguageSettings,
        singleLine: string | string[] | LineCommentObject | null,
        start: string | null = null,
        end: string | null = null): LanguageState {

    const next = { ...state };

    next.delimiter = "";
    next.blockCommentStart = "";
    next.blockCommentEnd = "";

    // If no single line comment delimiter is passed, single line comments are not supported
    if (singleLine) {
        next.delimiter = escapeLineDelimiter(singleLine);
    }
    else {
        next.highlightSingleLineComments = false;
    }

    if (start && end) {
        next.blockCommentStart = escapeRegExp(start);
        next.blockCommentEnd = escapeRegExp(end);

        next.highlightMultilineComments = settings.multilineComments;
    }

    return next;
}
