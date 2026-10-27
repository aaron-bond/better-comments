import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { findTags } from './core/finder';
import { applyLanguage, beginLanguageSwitch, initialLanguageState, LanguageState } from './core/languageState';
import { prepareTag } from './core/tags';

export class Parser {
    private tags: CommentTag[] = [];

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
     * Sets the language whose comments FindComments looks for, based on its comment syntax
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    public async SetRegex(languageCode: string) {
        await this.setDelimiter(languageCode);
    }

    /**
     * Finds all tagged comments in the document, ready for ApplyDecorations
     * @param activeEditor The active text editor containing the code document
     */
    public FindComments(activeEditor: vscode.TextEditor): void {
        let text = activeEditor.document.getText();

        for (let match of findTags(text, this.state, this.tags, this.contributions)) {
            let startPos = activeEditor.document.positionAt(match.start);
            let endPos = activeEditor.document.positionAt(match.end);

            this.tags[match.tagIndex].ranges.push({ range: new vscode.Range(startPos, endPos) });
        }
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
