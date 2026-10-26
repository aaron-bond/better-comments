import { escapeLineDelimiter, escapeRegExp } from './regex';

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
        let blockCommentStart = config.blockComment ? config.blockComment[0] : null;
        let blockCommentEnd = config.blockComment ? config.blockComment[1] : null;

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

            // If highlight plaintext is enabled, this is a supported language
            next.supportedLanguage = settings.highlightPlainText;
            break;
    }

    return next;
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
        singleLine: string | string[] | null,
        start: string | null = null,
        end: string | null = null): LanguageState {

    let next = { ...state };

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
