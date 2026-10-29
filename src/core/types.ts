// Plain data types shared by the core. Nothing in src/core may import vscode.

// A colour string, or a theme colour: VS Code reads any object with a string id as one (ThemeColor.isThemeColor)
export type ColorSetting = string | { id: string };

export interface TagSetting {
    tag: string;
    color?: ColorSetting;
    strikethrough?: boolean;
    underline?: boolean;
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: ColorSetting;
}

// Matches the shape of vscode.DecorationRenderOptions that the parser has always produced
export interface TagStyle {
    color: ColorSetting | undefined;
    backgroundColor: ColorSetting | undefined;
    textDecoration?: string;
    fontWeight?: string;
    fontStyle?: string;
}
