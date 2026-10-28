// Drives this repository's Parser or an older build's, as extension.ts does. v3.0.2 has SetRegex where
// SetLanguage is now, and FindSingleLineComments, FindBlockComments and FindJSDocComments where FindComments
// is, and the overlap test and the benchmark still run against it.

export function setLanguage(parser: any, languageId: string): Promise<void> {
    return typeof parser.SetLanguage === 'function' ? parser.SetLanguage(languageId) : parser.SetRegex(languageId);
}

// One decoration update
export function runUpdate(parser: any, editor: unknown): void {
    if (typeof parser.FindComments === 'function') {
        parser.FindComments(editor);
    } else {
        parser.FindSingleLineComments(editor);
        parser.FindBlockComments(editor);
        parser.FindJSDocComments(editor);
    }
    parser.ApplyDecorations(editor);
}
