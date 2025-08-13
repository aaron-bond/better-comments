interface CommentTag {
    tag: string;
    escapedTag: string;
    decoration: any;
    ranges: Array<any>;
}

interface Contributions {
    multilineComments: boolean;
    useJSDocStyle: boolean;
    highlightPlainText: boolean;
    tags: [{
        tag: string;
        color: string;
        strikethrough: boolean;
        underline: boolean;
        bold: boolean;
        italic: boolean;
        backgroundColor: string;
    }];
}

interface CommentConfig {
    lineComment?: string;
    blockComment?: [string, string];
}

declare enum LanguageIdentifiers {
    Apex = "apex",
    JavaScript = "javascript",
    JavaScriptReact = "javascriptreact",
    TypeScript = "typescript",
    TypeScriptReact = "typescriptreact",
    Vue = "vue",
    VueHTML = "vue-html",
    Elixir = "elixir",
    Python = "python",
    Tcl = "tcl",
    Plaintext = "plaintext"
}