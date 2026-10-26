import * as path from 'path';
import { repoRoot } from '../repo';
import { CommentSyntax, generateDocument } from './generate';

// The case matrix shared by the host and Node baselines

export interface TagSetting {
    tag: string;
    color: string;
    backgroundColor?: string;
    strikethrough?: boolean;
    underline?: boolean;
    bold?: boolean;
    italic?: boolean;
}

export interface SettingsVariant {
    name: string;
    // undefined means the package.json default
    tags?: TagSetting[];
    multilineComments?: boolean;
    highlightPlainText?: boolean;
}

export const defaultTags: TagSetting[] =
    require(path.join(repoRoot, 'package.json')).contributes.configuration.properties['better-comments.tags'].default;

const styleCombinations = Array.from({ length: 16 }, (_, i) => ({
    strikethrough: !!(i & 1), underline: !!(i & 2), bold: !!(i & 4), italic: !!(i & 8),
}));

const customTagNames = ['?', '*', '+', '.', '$', '^', '|', '(', ')', '[', ']', '{', '}', '\\', '/', '-', '@note', 'FIXME:', '⚠', '**'];

export const customTags: TagSetting[] = customTagNames.map((tag, i) => ({
    tag,
    color: `#${(0x100000 + i * 0x0a0b0c).toString(16).slice(-6).toUpperCase()}`,
    // Some tags have no backgroundColor at all
    ...(i % 3 === 0 ? { backgroundColor: 'transparent' } : i % 3 === 1 ? { backgroundColor: '#00000020' } : {}),
    ...styleCombinations[i % styleCombinations.length],
}));

export const settingsVariants: SettingsVariant[] = [
    { name: 'default' },
    { name: 'multiline-off', multilineComments: false },
    { name: 'plaintext-on', highlightPlainText: true },
    { name: 'custom-tags', tags: customTags },
    { name: 'empty-tag', tags: [...defaultTags.slice(0, 2), { tag: '', color: '#ABCDEF' }] },
];

// Languages set on the parser before the target, in order. The parser carries state between them.
export const noCommentSyntaxLanguage = 'bc-no-comment-syntax';
export const histories: string[][] = [
    [],
    ['javascript'],
    ['csharp'],
    ['python'],
    ['plaintext'],
    ['log'],
    [noCommentSyntaxLanguage],
    ['javascript', noCommentSyntaxLanguage],
];

export const historyName = (history: string[]): string => history.length ? history.join('>') : 'none';

export type InputSpec =
    | { kind: 'sample'; file: string }
    | { kind: 'generated'; syntaxFrom: string; eol: 'LF' | 'CRLF'; bareTags?: boolean }
    | { kind: 'empty' };

export interface Target {
    languageId: string;
    inputs: InputSpec[];
}

const generatedInputs = (languageId: string): InputSpec[] => [
    { kind: 'generated', syntaxFrom: languageId, eol: 'LF' },
    { kind: 'generated', syntaxFrom: languageId, eol: 'CRLF' },
    { kind: 'empty' },
];

export const targets: Target[] = [
    { languageId: 'javascript', inputs: [{ kind: 'sample', file: 'javascript.js' }, ...generatedInputs('javascript')] },
    { languageId: 'csharp', inputs: [{ kind: 'sample', file: 'csharp.cs' }, { kind: 'sample', file: 'nested.cs' }, ...generatedInputs('csharp')] },
    { languageId: 'python', inputs: [{ kind: 'sample', file: 'test.py' }, ...generatedInputs('python')] },
    // No plaintext config exists, so it keeps whatever delimiters the previous language left behind
    { languageId: 'plaintext', inputs: [
        { kind: 'sample', file: 'plaintext.txt' },
        { kind: 'sample', file: 'unsupported/cobol.cbl' },
        { kind: 'generated', syntaxFrom: 'javascript', eol: 'LF', bareTags: true },
    ] },
    // No language config at all: the unsupported case
    { languageId: 'log', inputs: [{ kind: 'generated', syntaxFrom: 'javascript', eol: 'LF', bareTags: true }] },
];

export function inputName(input: InputSpec): string {
    switch (input.kind) {
        case 'sample': return `sample-${input.file.replace(/[\/\\]/g, '_')}`;
        case 'generated': return `generated-from-${input.syntaxFrom}${input.bareTags ? '-bare' : ''}-${input.eol.toLowerCase()}`;
        case 'empty': return 'empty';
    }
}

// Languages whose comment syntax both baselines need
export const languagesUsed: string[] = Array.from(new Set([
    ...targets.map(t => t.languageId),
    ...histories.flat(),
])).sort();

export function generatedText(input: Extract<InputSpec, { kind: 'generated' }>, syntax: CommentSyntax | undefined, tags: TagSetting[]): string {
    const text = generateDocument(syntax, tags.map(t => t.tag), { bareTags: input.bareTags });
    return input.eol === 'CRLF' ? text.replace(/\n/g, '\r\n') : text;
}

export const effectiveTags = (variant: SettingsVariant): TagSetting[] => variant.tags ?? defaultTags;
