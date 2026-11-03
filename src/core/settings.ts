import { LanguageSettings } from './languageState';
import { ColorSetting, TagSetting } from './types';
import { property } from './unknown';

// The better-comments settings, once checked
export interface Settings extends LanguageSettings {
    tags: TagSetting[];
}

/**
 * Checks the better-comments settings. They come from settings.json, so they can hold any JSON value: the schema
 * in package.json only says tags is an array, so VS Code passes on whatever the items contain.
 * - Flags are only ever tested for truthiness, so any value is read as a boolean.
 * - A colour is kept if it's a string or a theme colour ({ "id": "editorError.foreground" }), the shapes VS Code can
 *   use. Anything else is dropped.
 * - A tag without a string tag is skipped, and tags that aren't a list give none. Up to 3.1.1 either stopped the
 *   extension loading (#552). An incomplete tag is normal while settings.json is being edited, so nothing is reported.
 * @param raw The value of vscode.workspace.getConfiguration('better-comments')
 */
export function readSettings(raw: unknown): Settings {
    const tags = property(raw, 'tags');
    const list: unknown[] = Array.isArray(tags) ? tags : [];

    return {
        tags: list.map(readTag).filter(tag => tag !== undefined),
        multilineComments: Boolean(property(raw, 'multilineComments')),
        highlightPlainText: Boolean(property(raw, 'highlightPlainText')),
    };
}

function readTag(item: unknown): TagSetting | undefined {
    const tag = property(item, 'tag');
    if (typeof tag !== 'string') {
        return undefined;
    }

    return {
        tag,
        color: readColor(property(item, 'color')),
        backgroundColor: readColor(property(item, 'backgroundColor')),
        strikethrough: Boolean(property(item, 'strikethrough')),
        underline: Boolean(property(item, 'underline')),
        bold: Boolean(property(item, 'bold')),
        italic: Boolean(property(item, 'italic')),
    };
}

function readColor(value: unknown): ColorSetting | undefined {
    if (typeof value === 'string') {
        return value;
    }

    const id = property(value, 'id');
    return typeof id === 'string' ? { id } : undefined;
}
