import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { applyLanguage, beginLanguageSwitch, initialLanguageState, LanguageState } from './core/languageState';
import {
    buildBlockCommentExpression, buildBlockLineExpression, buildJSDocLineExpression, buildLineCommentExpression,
    escapeTag, jsDocCommentExpression,
} from './core/regex';
import { toTagStyle } from './core/style';

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

        let characters: Array<string> = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }

        this.expression = buildLineCommentExpression(characters, this.state.delimiter, this.state.isPlainText && this.contributions.highlightPlainText);
    }

    /**
     * Finds all single line comments delimited by a given delimiter and matching tags specified in package.json
     * @param activeEditor The active text editor containing the code document
     */
    public FindSingleLineComments(activeEditor: vscode.TextEditor): void {

        // If highlight single line comments is off, single line comments are not supported for this language
        if (!this.state.highlightSingleLineComments) return;

        let text = activeEditor.document.getText();

        // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
        let regexFlags = (this.state.isPlainText) ? "igm" : "ig";
        let regEx = new RegExp(this.expression, regexFlags);

        let match: any;
        while (match = regEx.exec(text)) {
            let startPos = activeEditor.document.positionAt(match.index);
            let endPos = activeEditor.document.positionAt(match.index + match[0].length);
            let range = { range: new vscode.Range(startPos, endPos) };

            // Required to ignore the first line of .py files (#61)
            if (this.state.ignoreFirstLine && startPos.line === 0 && startPos.character === 0) {
                continue;
            }

            // Find which custom delimiter was used in order to add it to the collection
            let matchTag = this.tags.find(item => item.tag.toLowerCase() === match[3].toLowerCase());

            if (matchTag) {
                matchTag.ranges.push(range);
            }
        }
    }

    /**
     * Finds block comments as indicated by start and end delimiter
     * @param activeEditor The active text editor containing the code document
     */
    public FindBlockComments(activeEditor: vscode.TextEditor): void {

        // If highlight multiline is off in package.json or doesn't apply to his language, return
        if (!this.state.highlightMultilineComments) return;
        
        let text = activeEditor.document.getText();

        // Build up regex matcher for custom delimiter tags
        let characters: Array<string> = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }

        // Combine custom delimiters and the rest of the comment block matcher
        let commentMatchString = buildBlockLineExpression(characters);

        // Use start and end delimiters to find block comments
        let regexString = buildBlockCommentExpression(this.state.blockCommentStart, this.state.blockCommentEnd);

        let regEx = new RegExp(regexString, "gm");
        let commentRegEx = new RegExp(commentMatchString, "igm");

        // Find the multiline comment block
        let match: any;
        while (match = regEx.exec(text)) {
            let commentBlock = match[0];

            // Find the line
            let line;
            while (line = commentRegEx.exec(commentBlock)) {
                let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
                let range: vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

                // Find which custom delimiter was used in order to add it to the collection
                let matchString = line[3] as string;
                let matchTag = this.tags.find(item => item.tag.toLowerCase() === matchString.toLowerCase());

                if (matchTag) {
                    matchTag.ranges.push(range);
                }
            }
        }
    }

    /**
     * Finds all multiline comments starting with "*"
     * @param activeEditor The active text editor containing the code document
     */
    public FindJSDocComments(activeEditor: vscode.TextEditor): void {

        // If highlight multiline is off in package.json or doesn't apply to his language, return
        if (!this.state.highlightMultilineComments && !this.state.highlightJSDoc) return;

        let text = activeEditor.document.getText();

        // Build up regex matcher for custom delimiter tags
        let characters: Array<string> = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }

        // Combine custom delimiters and the rest of the comment block matcher
        let commentMatchString = buildJSDocLineExpression(characters);
        let regEx = new RegExp(jsDocCommentExpression, "gm");

        let commentRegEx = new RegExp(commentMatchString, "igm");

        // Find the multiline comment block
        let match: any;
        while (match = regEx.exec(text)) {
            let commentBlock = match[0];

            // Find the line
            let line;
            while (line = commentRegEx.exec(commentBlock)) {
                let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
                let range: vscode.DecorationOptions = { range: new vscode.Range(startPos, endPos) };

                // Find which custom delimiter was used in order to add it to the collection
                let matchString = line[3] as string;
                let matchTag = this.tags.find(item => item.tag.toLowerCase() === matchString.toLowerCase());

                if (matchTag) {
                    matchTag.ranges.push(range);
                }
            }
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
            this.tags.push({
                tag: item.tag,
                escapedTag: escapeTag(item.tag),
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(toTagStyle(item))
            });
        }
    }

    //#endregion
}
