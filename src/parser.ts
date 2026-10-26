import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { findBlockComments, findJSDocComments, findLineComments, TagMatch } from './core/finder';
import {
    applyLanguage, beginLanguageSwitch, findsBlockComments, findsJSDocComments, findsLineComments,
    initialLanguageState, LanguageState, lineCommentExpression,
} from './core/languageState';
import { prepareTag } from './core/tags';

export class Parser {
    private tags: CommentTag[] = [];
    private expression: string = "";

    // Carried from one language to the next
    private state: LanguageState = initialLanguageState;

    // * this is used to trigger the events when a supported language code is found
    public get supportedLanguage(): boolean {
        return this.state.supportedLanguage;
    }

    // Read from the package.json
    private contributions: Contributions = vscode.workspace.getConfiguration('better-comments') as any;

    // The configuration necessary to find supported languages on startup
    private configuration: Configuration;

    /**
     * Creates a new instance of the Parser class
     * @param configuration 
     */
    public constructor(config: Configuration) {

        this.configuration = config;

        this.setTags();
    }

    /**
     * Sets the regex to be used by the matcher based on the config specified in the package.json
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    public async SetRegex(languageCode: string) {
        await this.setDelimiter(languageCode);

        // if the language isn't supported, we don't need to go any further
        if (!this.state.supportedLanguage) {
            return;
        }

        this.expression = lineCommentExpression(this.state, this.escapedTags(), this.contributions);
    }

    /**
     * Finds all single line comments delimited by a given delimiter and matching tags specified in package.json
     * @param activeEditor The active text editor containing the code document
     */
    public FindSingleLineComments(activeEditor: vscode.TextEditor): void {

        if (!findsLineComments(this.state)) return;

        let text = activeEditor.document.getText();

        this.collectRanges(activeEditor, findLineComments(text, this.expression, this.state.isPlainText, this.state.ignoreFirstLine, this.tagNames()));
    }

    /**
     * Finds block comments as indicated by start and end delimiter
     * @param activeEditor The active text editor containing the code document
     */
    public FindBlockComments(activeEditor: vscode.TextEditor): void {

        if (!findsBlockComments(this.state)) return;

        let text = activeEditor.document.getText();

        this.collectRanges(activeEditor, findBlockComments(text, this.escapedTags(), this.tagNames(), this.state.blockCommentStart, this.state.blockCommentEnd));
    }

    /**
     * Finds all multiline comments starting with "*"
     * @param activeEditor The active text editor containing the code document
     */
    public FindJSDocComments(activeEditor: vscode.TextEditor): void {

        if (!findsJSDocComments(this.state)) return;

        let text = activeEditor.document.getText();

        this.collectRanges(activeEditor, findJSDocComments(text, this.escapedTags(), this.tagNames()));
    }

    /**
     * Apply decorations after finding all relevant comments
     * @param activeEditor The active text editor containing the code document
     */
    public ApplyDecorations(activeEditor: vscode.TextEditor): void {
        for (let tag of this.tags) {
            activeEditor.setDecorations(tag.decoration, tag.ranges);

            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }

    //#region  Private Methods

    /**
     * Adds each match to its tag's ranges as it's found
     * @param activeEditor The active text editor containing the code document
     * @param matches The matches, as document offsets
     */
    private collectRanges(activeEditor: vscode.TextEditor, matches: Iterable<TagMatch>): void {
        for (let match of matches) {
            let startPos = activeEditor.document.positionAt(match.start);
            let endPos = activeEditor.document.positionAt(match.end);

            this.tags[match.tagIndex].ranges.push({ range: new vscode.Range(startPos, endPos) });
        }
    }

    private tagNames(): string[] {
        return this.tags.map(commentTag => commentTag.tag);
    }

    private escapedTags(): string[] {
        return this.tags.map(commentTag => commentTag.escapedTag);
    }

    /**
     * Sets the comment delimiter [//, #, --, '] of a given language
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    private async setDelimiter(languageCode: string): Promise<void> {
        this.state = beginLanguageSwitch(this.state);

        const config = await this.configuration.GetCommentConfiguration(languageCode);

        this.state = applyLanguage(this.state, languageCode, config, this.contributions);
    }

    /**
     * Sets the highlighting tags up for use by the parser
     */
    private setTags(): void {
        let items = this.contributions.tags;
        for (let item of items) {
            let prepared = prepareTag(item);
            this.tags.push({
                tag: prepared.tag,
                escapedTag: prepared.escapedTag,
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(prepared.style)
            });
        }
    }

    //#endregion
}
