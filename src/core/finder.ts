import { buildBlockCommentExpression, buildBlockLineExpression, buildJSDocLineExpression, jsDocCommentExpression } from './regex';

// Finds tagged comments in a document's text. Matches are document offsets.
// ? these are generators so callers collect each match as it's found, as the parser always has:
// ? if a tag lookup throws partway through, the matches found before it have already been collected

export interface TagMatch {
    tagIndex: number; // index into the configured tags
    start: number;
    end: number;
}

/**
 * Runs a global regex over the text, skipping zero-length matches
 * ? exec doesn't move past a zero-length match, so without this the loop never ends.
 * ? the plaintext expression with an empty tag matches zero characters on an empty line
 */
function* matchAll(regEx: RegExp, text: string): Generator<RegExpExecArray> {
    let match: RegExpExecArray | null;
    while (match = regEx.exec(text)) {
        if (match[0].length === 0) {
            regEx.lastIndex++;
            continue;
        }

        yield match;
    }
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
 */
export function* findLineComments(text: string, expression: string, isPlainText: boolean, ignoreFirstLine: boolean, tags: string[]): Generator<TagMatch> {
    // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
    let regexFlags = (isPlainText) ? "igm" : "ig";
    let regEx = new RegExp(expression, regexFlags);

    for (let match of matchAll(regEx, text)) {
        // Required to ignore the first line of .py files (#61)
        if (ignoreFirstLine && match.index === 0) {
            continue;
        }

        // Find which custom delimiter was used in order to add it to the collection
        let tagIndex = findTagIndex(tags, match[3]);

        if (tagIndex >= 0) {
            yield { tagIndex, start: match.index, end: match.index + match[0].length };
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
 */
export function* findBlockComments(text: string, escapedTags: string[], tags: string[], blockCommentStart: string, blockCommentEnd: string): Generator<TagMatch> {
    // Combine custom delimiters and the rest of the comment block matcher
    let commentMatchString = buildBlockLineExpression(escapedTags);

    // Use start and end delimiters to find block comments
    let regexString = buildBlockCommentExpression(blockCommentStart, blockCommentEnd);

    yield* findTaggedLines(text, new RegExp(regexString, "gm"), new RegExp(commentMatchString, "igm"), tags);
}

/**
 * Finds tagged lines in multiline comments starting with "*"
 * @param text The document's text
 * @param escapedTags The escaped tags, in configuration order
 * @param tags The configured tags, in configuration order
 */
export function* findJSDocComments(text: string, escapedTags: string[], tags: string[]): Generator<TagMatch> {
    // Combine custom delimiters and the rest of the comment block matcher
    let commentMatchString = buildJSDocLineExpression(escapedTags);
    let regEx = new RegExp(jsDocCommentExpression, "gm");

    yield* findTaggedLines(text, regEx, new RegExp(commentMatchString, "igm"), tags);
}

function* findTaggedLines(text: string, regEx: RegExp, commentRegEx: RegExp, tags: string[]): Generator<TagMatch> {
    // Find the multiline comment block
    for (let match of matchAll(regEx, text)) {
        let commentBlock = match[0];

        // Find the line
        for (let line of matchAll(commentRegEx, commentBlock)) {
            // Find which custom delimiter was used in order to add it to the collection
            let matchString = line[3] as string;
            let tagIndex = findTagIndex(tags, matchString);

            if (tagIndex >= 0) {
                yield {
                    tagIndex,
                    start: match.index + line.index + line[2].length,
                    end: match.index + line.index + line[0].length,
                };
            }
        }
    }
}
