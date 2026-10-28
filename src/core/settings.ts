import { LanguageSettings } from './languageState';
import { TagSetting } from './types';
import { property } from './unknown';

// The better-comments settings, once checked
export interface Settings extends LanguageSettings {
    tags: TagSetting[];
}

/**
 * Checks the better-comments settings. They come from settings.json, so they can hold any JSON value: VS Code
 * warns about values that don't match the schema in package.json, but still passes them on.
 * - Flags are only ever tested for truthiness, so any value is read as a boolean.
 * - A colour that isn't a string can't be used by a decoration, so it's dropped.
 * - Tags that aren't a list of objects with a string tag have always stopped the parser, so they still throw.
 * @param raw The value of vscode.workspace.getConfiguration('better-comments')
 */
export function readSettings(raw: unknown): Settings {
    const tags = property(raw, 'tags');

    // ? the parser used for...of, which also accepts a string: each character then fails as a tag, so only "" passes
    const list: unknown = typeof tags === 'string' ? [...tags] : tags;
    if (!Array.isArray(list)) {
        throw new TypeError('better-comments.tags is not a list');
    }

    return {
        tags: list.map(readTag),
        multilineComments: Boolean(property(raw, 'multilineComments')),
        highlightPlainText: Boolean(property(raw, 'highlightPlainText')),
    };
}

function readTag(item: unknown): TagSetting {
    const tag = property(item, 'tag');
    if (typeof tag !== 'string') {
        throw new TypeError('A better-comments tag has no "tag" string');
    }

    return {
        tag,
        color: stringOrUndefined(property(item, 'color')),
        backgroundColor: stringOrUndefined(property(item, 'backgroundColor')),
        strikethrough: Boolean(property(item, 'strikethrough')),
        underline: Boolean(property(item, 'underline')),
        bold: Boolean(property(item, 'bold')),
        italic: Boolean(property(item, 'italic')),
    };
}

const stringOrUndefined = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined;
