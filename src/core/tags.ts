import { escapeTag } from './regex';
import { toTagStyle } from './style';
import { TagSetting, TagStyle } from './types';

export interface PreparedTag {
    tag: string;
    escapedTag: string;
    style: TagStyle;
}

/**
 * Prepares one configured tag for matching and decorating
 * @param item The tag as configured in better-comments.tags
 */
export function prepareTag(item: TagSetting): PreparedTag {
    const style = toTagStyle(item);

    return {
        tag: item.tag,
        escapedTag: escapeTag(item.tag),
        style,
    };
}
