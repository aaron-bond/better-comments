// One decoration update, as extension.ts runs it, for this repository's Parser or an older build's.
// v3.0.2 has FindSingleLineComments, FindBlockComments and FindJSDocComments where FindComments is now,
// and the overlap test and the benchmark still run against it.
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
