import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { applyLanguage, beginLanguageSwitch, findTags, initialLanguageState, LanguageState, prepareTag, readSettings } from './core';

// A configured tag with its decoration type, and the ranges found for it since the last ApplyDecorations
interface DecoratedTag {
    tag: string;
    escapedTag: string;
    decoration: vscode.TextEditorDecorationType;
    ranges: vscode.DecorationOptions[];
}

export class Parser {
    private tags: DecoratedTag[] = [];

    // Carried from one language to the next
    private state: LanguageState = initialLanguageState;

    // * this is used to trigger the events when a supported language code is found
    public get supportedLanguage(): boolean {
        return this.state.supportedLanguage;
    }

    // The better-comments settings, read and checked once, so changes need a restart (pinned 7)
    private contributions = readSettings(vscode.workspace.getConfiguration('better-comments'));

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
     * Sets the language whose comments FindComments looks for, from its comment syntax
     * ? called SetRegex up to v3.0.2
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    public async SetLanguage(languageCode: string): Promise<void> {
        this.state = beginLanguageSwitch(this.state);

        const config = await this.configuration.GetCommentConfiguration(languageCode);

        this.state = applyLanguage(this.state, languageCode, config, this.contributions);
    }

    /**
     * Finds all tagged comments in the document, ready for ApplyDecorations
     * @param activeEditor The active text editor containing the code document
     */
    public FindComments(activeEditor: vscode.TextEditor): void {
        const text = activeEditor.document.getText();

        for (const match of findTags(text, this.state, this.tags)) {
            const startPos = activeEditor.document.positionAt(match.start);
            const endPos = activeEditor.document.positionAt(match.end);

            this.tags[match.tagIndex].ranges.push({ range: new vscode.Range(startPos, endPos) });
        }
    }

    /**
     * Apply decorations after finding all relevant comments
     * @param activeEditor The active text editor containing the code document
     */
    public ApplyDecorations(activeEditor: vscode.TextEditor): void {
        for (const tag of this.tags) {
            activeEditor.setDecorations(tag.decoration, tag.ranges);

            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }

    //#region  Private Methods

    /**
     * Sets the highlighting tags up for use by the parser
     */
    private setTags(): void {
        const items = this.contributions.tags;
        for (const item of items) {
            const prepared = prepareTag(item);
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
