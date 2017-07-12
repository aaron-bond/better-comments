'use strict';

import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	let activeEditor: any;

	const contributions = vscode.workspace.getConfiguration('better-comments');
	const alert_decorationType = vscode.window.createTextEditorDecorationType({ color: contributions.alertColor });
	const question_decorationType = vscode.window.createTextEditorDecorationType({ color: contributions.questionColor });
	const removed_decorationType = vscode.window.createTextEditorDecorationType({ color: contributions.removedColor, textDecoration: 'line-through' });
	const todo_decorationType = vscode.window.createTextEditorDecorationType({ color: contributions.todoColor });
	const highlight_decorationType = vscode.window.createTextEditorDecorationType({ color: contributions.highlightColor });
	const showMultilineHighlight: boolean = contributions.multilineComments;

	let alerts: vscode.DecorationOptions[] = [];
	let questions: vscode.DecorationOptions[] = [];
	let informational: vscode.DecorationOptions[] = [];
	let removed: vscode.DecorationOptions[] = [];
	let todos: vscode.DecorationOptions[] = [];
	let highlights: vscode.DecorationOptions[] = [];

	let findSingleLineComments = function () {
		// Regex will find: // + ! OR ? OR // OR TODO, until end of line
		const regEx = /(\/\/)+( )?(\!|\?|\/\/|\*|(todo))+(.*)+/ig;
		const text = activeEditor.document.getText();

		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos) };

			let matchString = match[3] as string;
			switch (matchString.toLowerCase()) {
				case "!":
					alerts.push(decoration);
					break;

				case "?":
					questions.push(decoration);
					break;

				case "//":
					removed.push(decoration);
					break;

				case "todo":
					todos.push(decoration);
					break;

				case "*":
					highlights.push(decoration);
					break;
			}
		}
	};

	let findMultilineComments = function () {
		const regEx = /(^|[ \t])(\/\*)+([\s\S]*?)(\*\/)/g;
		const text = activeEditor.document.getText();
		const commentRegEx = /(^)+([ \t]*)?(\!|\?|\*|(todo))+( )?([a-z])+([^*/\r\n]*)/igm;

		let match;
		while (match = regEx.exec(text)) {
			let commentBlock = match[0];
			let line;
			while (line = commentRegEx.exec(commentBlock)) {
				const startPos = activeEditor.document.positionAt(match.index + line.index);
				const endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
				const decoration = { range: new vscode.Range(startPos, endPos) };

				let matchString = line[3] as string;
				switch (matchString.toLowerCase()) {
					case "!":
						alerts.push(decoration);
						break;

					case "?":
						questions.push(decoration);
						break;

					case "todo":
						todos.push(decoration);
						break;

					case "*":
						highlights.push(decoration);
						break;
				}
			}
		}
	};

	let updateDecorations = function () {
		if (!activeEditor) return;

		// Make sure the decoration options are currently clear
		alerts.length = 0;
		questions.length = 0;
		informational.length = 0;
		removed.length = 0;
		todos.length = 0;
		highlights.length = 0;

		findSingleLineComments();

		if (showMultilineHighlight) {
			findMultilineComments();
		}

		activeEditor.setDecorations(alert_decorationType, alerts);
		activeEditor.setDecorations(question_decorationType, questions);
		activeEditor.setDecorations(removed_decorationType, removed);
		activeEditor.setDecorations(todo_decorationType, todos);
		activeEditor.setDecorations(highlight_decorationType, highlights);
	}

	// Text update handlers
	activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	var timeout: NodeJS.Timer;
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateDecorations, 200);
	}
}

export function deactivate() { }