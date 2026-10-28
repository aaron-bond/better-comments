// Builds the regular expression sources the parser matches with

/**
 * Escapes a tag for use in a regular expression
 * @param tag The tag as configured, e.g. "!" or "TODO"
 */
export function escapeTag(tag: string): string {
    const escapedSequence = tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
    return escapedSequence.replace(/\//gi, "\\/"); // ! hardcoded to escape slashes
}

/**
 * Escapes a given string for use in a regular expression
 * @param input The input string to be escaped
 * @returns {string} The escaped string
 */
export function escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Escapes the single line comment delimiter(s) of a language
 * @param singleLine One delimiter, several if the language has more than one single line comment format, or the
 * object form
 */
export function escapeLineDelimiter(singleLine: string | string[] | LineCommentObject): string {
    if (typeof singleLine === 'string') {
        return escapeRegExp(singleLine).replace(/\//ig, "\\/");
    }

    // * if multiple delimiters are passed, the language has more than one single line comment format
    if (Array.isArray(singleLine)) {
        return singleLine
            .map(s => escapeRegExp(s))
            .join("|");
    }

    // ! P1: the object form ({ comment, noIndent }) isn't read, so its delimiter is empty
    return "";
}

/**
 * Builds the single line comment expression
 * @param escapedTags The escaped tags, in configuration order
 * @param delimiter The escaped line comment delimiter
 * @param plainText True to match tags at the start of a line instead of after a delimiter
 */
export function buildLineCommentExpression(escapedTags: string[], delimiter: string, plainText: boolean): string {
    let expression: string;
    if (plainText) {
        // start by tying the regex to the first character in a line
        expression = "(^)+([ \\t]*[ \\t]*)";
    } else {
        // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
        expression = "(" + delimiter + ")+( |\t)*";
    }

    // Apply all configurable comment start tags
    expression += "(";
    expression += escapedTags.join("|");
    expression += ")+(.*)";

    return expression;
}

/**
 * Builds the expression that finds a block comment
 * @param blockCommentStart The escaped start delimiter
 * @param blockCommentEnd The escaped end delimiter
 */
export function buildBlockCommentExpression(blockCommentStart: string, blockCommentEnd: string): string {
    let regexString = "(^|[ \\t])(";
    regexString += blockCommentStart;
    regexString += "[\\s])+([\\s\\S]*?)(";
    regexString += blockCommentEnd;
    regexString += ")";

    return regexString;
}

/**
 * Builds the expression that finds tagged lines inside a block comment
 * @param escapedTags The escaped tags, in configuration order
 */
export function buildBlockLineExpression(escapedTags: string[]): string {
    let commentMatchString = "(^)+([ \\t]*[ \\t]*)(";
    commentMatchString += escapedTags.join("|");
    commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

    return commentMatchString;
}

// Find rows of comments matching pattern /** */
export const jsDocCommentExpression = /(^|[ \t])(\/\*\*)+([\s\S]*?)(\*\/)/.source;

/**
 * Builds the expression that finds tagged lines inside a JSDoc comment, after the leading *
 * @param escapedTags The escaped tags, in configuration order
 */
export function buildJSDocLineExpression(escapedTags: string[]): string {
    let commentMatchString = "(^)+([ \\t]*\\*[ \\t]*)("; // Highlight after leading *
    commentMatchString += escapedTags.join("|");
    commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

    return commentMatchString;
}
