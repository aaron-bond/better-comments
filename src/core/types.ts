// Plain data types shared by the core. Nothing in src/core may import vscode.

export interface TagSetting {
    tag: string;
    color?: string;
    strikethrough?: boolean;
    underline?: boolean;
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: string;
}

// Matches the shape of vscode.DecorationRenderOptions that the parser has always produced
export interface TagStyle {
    color: string | undefined;
    backgroundColor: string | undefined;
    textDecoration?: string;
    fontWeight?: string;
    fontStyle?: string;
}
