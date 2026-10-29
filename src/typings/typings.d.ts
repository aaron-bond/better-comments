// A language's comment syntax, from its language-configuration.json
interface CommentConfig {
    // VS Code's built-in configs use the object form only after 1.101.0 (P1: it isn't read yet)
    lineComment?: string | string[] | LineCommentObject;
    blockComment?: [string, string];
}

interface LineCommentObject {
    comment: string;
    noIndent?: boolean;
}
