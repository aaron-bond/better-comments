import { buildBlockCommentExpression, buildBlockLineExpression, buildJSDocLineExpression, jsDocCommentExpression } from './regex';

// Finds tagged comments in a document's text. Matches are document offsets.
// ? each finder pushes into an array the caller passes in, as it goes, as the parser always has:
// ? if a tag lookup throws partway through, the matches found before it are already in the array

export interface TagMatch {
    tagIndex: number; // index into the configured tags
    start: number;
    end: number;
}

/**
 * True for a zero-length match, after moving the regex past it so the caller can skip it
 * ? exec doesn't move past a zero-length match, so without this the loop never ends.
 * ? the plaintext expression with an empty tag matches zero characters on an empty line
 */
function skipZeroLength(regEx: RegExp, match: RegExpExecArray): boolean {
    if (match[0].length === 0) {
        regEx.lastIndex++;
        return true;
    }

    return false;
}

/**
 * Finds the first configured tag a matched tag string belongs to, ignoring case
 * Throws if nothing was captured, as the parser always has
 */
function findTagIndex(tags: string[], matched: string): number {
    return tags.findIndex(tag => tag.toLowerCase() === matched.toLowerCase());
}

/**
 * Finds all single line comments matching the expression built by buildLineCommentExpression
 * @param text The document's text
 * @param expression The single line comment expression
 * @param isPlainText True for plaintext, where tags are matched at the start of each line
 * @param ignoreFirstLine True to skip a match at the very start of the document
 * @param tags The configured tags, in configuration order
 * @param matches Receives each match as it's found
 */
export function findLineComments(text: string, expression: string, isPlainText: boolean, ignoreFirstLine: boolean, tags: string[], matches: TagMatch[]): void {
    // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
    let regexFlags = (isPlainText) ? "igm" : "ig";
    let regEx = new RegExp(expression, regexFlags);

    let match: RegExpExecArray | null;
    while (match = regEx.exec(text)) {
        if (skipZeroLength(regEx, match)) continue;

        // Required to ignore the first line of .py files (#61)
        if (ignoreFirstLine && match.index === 0) {
            continue;
        }

        // Find which custom delimiter was used in order to add it to the collection
        let tagIndex = findTagIndex(tags, match[3]);

        if (tagIndex >= 0) {
            matches.push({ tagIndex, start: match.index, end: match.index + match[0].length });
        }
    }
}

/**
 * Finds tagged lines in block comments as indicated by start and end delimiter
 * @param text The document's text
 * @param escapedTags The escaped tags, in configuration order
 * @param tags The configured tags, in configuration order
 * @param blockCommentStart The escaped start delimiter
 * @param blockCommentEnd The escaped end delimiter
 * @param matches Receives each match as it's found
 */
export function findBlockComments(text: string, escapedTags: string[], tags: string[], blockCommentStart: string, blockCommentEnd: string, matches: TagMatch[]): void {
    // Combine custom delimiters and the rest of the comment block matcher
    let commentMatchString = buildBlockLineExpression(escapedTags);

    // Use start and end delimiters to find block comments
    let regexString = buildBlockCommentExpression(blockCommentStart, blockCommentEnd);

    findTaggedLines(text, new RegExp(regexString, "gm"), new RegExp(commentMatchString, "igm"), tags, matches);
}

/**
 * Finds tagged lines in multiline comments starting with "*"
 * @param text The document's text
 * @param escapedTags The escaped tags, in configuration order
 * @param tags The configured tags, in configuration order
 * @param matches Receives each match as it's found
 */
export function findJSDocComments(text: string, escapedTags: string[], tags: string[], matches: TagMatch[]): void {
    // Combine custom delimiters and the rest of the comment block matcher
    let commentMatchString = buildJSDocLineExpression(escapedTags);
    let regEx = new RegExp(jsDocCommentExpression, "gm");

    findTaggedLines(text, regEx, new RegExp(commentMatchString, "igm"), tags, matches);
}

function findTaggedLines(text: string, regEx: RegExp, commentRegEx: RegExp, tags: string[], matches: TagMatch[]): void {
    // Find the multiline comment block
    let match: RegExpExecArray | null;
    while (match = regEx.exec(text)) {
        if (skipZeroLength(regEx, match)) continue;

        let commentBlock = match[0];

        // Find the line
        let line: RegExpExecArray | null;
        while (line = commentRegEx.exec(commentBlock)) {
            if (skipZeroLength(commentRegEx, line)) continue;

            // Find which custom delimiter was used in order to add it to the collection
            let matchString = line[3] as string;
            let tagIndex = findTagIndex(tags, matchString);

            if (tagIndex >= 0) {
                matches.push({
                    tagIndex,
                    start: match.index + line.index + line[2].length,
                    end: match.index + line.index + line[0].length,
                });
            }
        }
    }
}
