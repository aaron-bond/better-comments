'use strict';

import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	const alert_decorationType = vscode.window.createTextEditorDecorationType({
		color: '#FF2D00'
	});

	const question_decorationType = vscode.window.createTextEditorDecorationType({
		color: '#3498DB'
	});

	const removed_decorationType = vscode.window.createTextEditorDecorationType({
		textDecoration: 'line-through'
	});

	const todo_decorationType = vscode.window.createTextEditorDecorationType({
		color: '#FF8C00'
	});

	function updateDecorations() {
		if (!activeEditor) return;

		// Regex will find: // + ! OR ? OR // OR TODO, until end of line
		const regEx = /(\/\/)+(\!|\?|\/\/|[\\t\\T][\\o\\O][\\d\\D][\\o\\O])+(.*)+/g;

		const text = activeEditor.document.getText();

		const alerts: vscode.DecorationOptions[] = [];
		const questions: vscode.DecorationOptions[] = [];
		const informational: vscode.DecorationOptions[] = [];
		const removed: vscode.DecorationOptions[] = [];
		const todos: vscode.DecorationOptions[] = [];

		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos) };

			let matchString = match[2] as string;
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
			}
		}

		activeEditor.setDecorations(alert_decorationType, alerts);
		activeEditor.setDecorations(question_decorationType, questions);
		activeEditor.setDecorations(removed_decorationType, removed);
		activeEditor.setDecorations(todo_decorationType, todos);
	}

	// Text update handlers
	let activeEditor = vscode.window.activeTextEditor;
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

	var timeout = null;
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateDecorations, 500);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
}