import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { Parser } from './parser';

// this method is called when vs code is activated
export async function activate(context: vscode.ExtensionContext) {
    let activeEditor: vscode.TextEditor;

    const configuration: Configuration = new Configuration();
    const parser: Parser = new Parser(configuration);

    // The pending update, if any. Declared before the first triggerUpdateDecorations() call below
    let timeout: NodeJS.Timeout | undefined;

    // Called to handle events below
    const updateDecorations = function () {
        // if no active window is open, return
        if (!activeEditor) return;

        // if lanugage isn't supported, return
        if (!parser.supportedLanguage) return;

        // Finds the single line, block and jsdoc comments using the language comment delimiters
        parser.FindComments(activeEditor);

        // Apply the styles set in the package.json
        parser.ApplyDecorations(activeEditor);
    };

    // Get the active editor for the first time and set its language
    if (vscode.window.activeTextEditor) {
        activeEditor = vscode.window.activeTextEditor;

        // Set the comment syntax for the specified language
        await parser.SetLanguage(activeEditor.document.languageId);

        // Trigger first update of decorators
        triggerUpdateDecorations();
    }

    // * Handle extensions being added or removed
    vscode.extensions.onDidChange(() => {
        configuration.UpdateLanguagesDefinitions();
    }, null, context.subscriptions);

    // * Handle the better-comments settings changing
    vscode.workspace.onDidChangeConfiguration(async event => {
        if (!event.affectsConfiguration('better-comments')) return;

        // Nothing in the settings should make this throw, since invalid tags are skipped. If it does,
        // keep the current tags rather than leave the promise rejected with nothing to handle it
        try {
            parser.UpdateSettings();
        } catch (error) {
            console.error('Better Comments: could not apply the new settings', error);
        }

        // The new settings can change how the current language is matched, as well as the tags
        if (activeEditor) {
            await parser.SetLanguage(activeEditor.document.languageId);
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // * Handle active file changed
    vscode.window.onDidChangeActiveTextEditor(async editor => {
        if (editor) {
            activeEditor = editor;

            // Set the comment syntax for the updated language
            await parser.SetLanguage(editor.document.languageId);

            // Trigger update to set decorations for newly active file
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // * Handle file contents changed
    vscode.workspace.onDidChangeTextDocument(event => {

        // Trigger updates if the text was changed in the same document
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // * IMPORTANT:
    // * To avoid calling update too often,
    // * set a timer for 100ms to wait before updating decorations
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
    }
}

export function deactivate() { }