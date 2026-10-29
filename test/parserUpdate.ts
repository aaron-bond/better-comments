// Drives this repository's Parser or an older build's, as extension.ts does. v3.0.2 has SetRegex where
// SetLanguage is now, and FindSingleLineComments, FindBlockComments and FindJSDocComments where FindComments
// is, and the overlap test and the benchmark still run against it.

import { CommentSyntax } from './baseline/generate';

export interface ConfigurationLike {
    GetCommentConfiguration(languageId: string): Promise<CommentSyntax | undefined>;
}

interface CurrentParser {
    readonly supportedLanguage: boolean;
    SetLanguage(languageId: string): Promise<void>;
    FindComments(editor: unknown): void;
    ApplyDecorations(editor: unknown): void;
}

interface V302Parser {
    readonly supportedLanguage: boolean;
    SetRegex(languageId: string): Promise<void>;
    FindSingleLineComments(editor: unknown): void;
    FindBlockComments(editor: unknown): void;
    FindJSDocComments(editor: unknown): void;
    ApplyDecorations(editor: unknown): void;
}

export type ParserLike = CurrentParser | V302Parser;
export type ParserConstructor = new (configuration: ConfigurationLike) => ParserLike;

export function setLanguage(parser: ParserLike, languageId: string): Promise<void> {
    return 'SetLanguage' in parser ? parser.SetLanguage(languageId) : parser.SetRegex(languageId);
}

// One decoration update
export function runUpdate(parser: ParserLike, editor: unknown): void {
    if ('FindComments' in parser) {
        parser.FindComments(editor);
    } else {
        parser.FindSingleLineComments(editor);
        parser.FindBlockComments(editor);
        parser.FindJSDocComments(editor);
    }
    parser.ApplyDecorations(editor);
}
