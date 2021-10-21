import * as vscode from 'vscode';

interface CommentTag {
	tag: string;
	escapedTag: string;
	decoration: vscode.TextEditorDecorationType;
	ranges: Array<vscode.DecorationOptions>;
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

export class Parser {
	private tags: CommentTag[] = [];
	private expression: string = "";

	private delimiter: string = "";
	private blockCommentStart: string = "";
	private blockCommentEnd: string = "";

	private highlightSingleLineComments = true;
	private highlightMultilineComments = false;
	private highlightJSDoc = false;

	// * this will allow plaintext files to show comment highlighting if switched on
	private isPlainText = false;

	// * this is used to prevent the first line of the file (specifically python) from coloring like other comments
	private ignoreFirstLine = false;

	// * this is used to trigger the events when a supported language code is found
	public supportedLanguage = true;

	// Read from the package.json
	private contributions: Contributions = vscode.workspace.getConfiguration('better-comments') as any;

	public constructor() {
		this.setTags();
	}

	/**
	 * Sets the regex to be used by the matcher based on the config specified in the package.json
	 * @param languageCode The short code of the current language
	 * https://code.visualstudio.com/docs/languages/identifiers
	 */
	public SetRegex(languageCode: string) {
		this.setDelimiter(languageCode);

		// if the language isn't supported, we don't need to go any further
		if (!this.supportedLanguage) {
			return;
		}

		let characters: Array<string> = [];
		for (let commentTag of this.tags) {
			characters.push(commentTag.escapedTag);
		}

		if (this.isPlainText && this.contributions.highlightPlainText) {
			// start by tying the regex to the first character in a line
			this.expression = "(^)+([ \\t]*[ \\t]*)";
		} else {
			// start by finding the delimiter (//, --, #, ') with optional spaces or tabs
			this.expression = "(" + this.delimiter.replace(/\//ig, "\\/") + ")+( |\t)*";
		}

		// Apply all configurable comment start tags
		this.expression += "(";
		this.expression += characters.join("|");
		this.expression += ")+(.*)";
	}

	/**
	 * Finds all single line comments delimited by a given delimiter and matching tags specified in package.json
	 * @param activeEditor The active text editor containing the code document
	 */
	public FindSingleLineComments(activeEditor: vscode.TextEditor): void {

		// If highlight single line comments is off, single line comments are not supported for this language
		if (!this.highlightSingleLineComments) return;

		let text = activeEditor.document.getText();

		// if it's plain text, we have to do mutliline regex to catch the start of the line with ^
		let regexFlags = (this.isPlainText) ? "igm" : "ig";
		let regEx = new RegExp(this.expression, regexFlags);

		let match: any;
		while (match = regEx.exec(text)) {
			let startPos = activeEditor.document.positionAt(match.index);
			let endPos = activeEditor.document.positionAt(match.index + match[0].length);
			let range = { range: new vscode.Range(startPos, endPos) };

			// Required to ignore the first line of .py files (#61)
			if (this.ignoreFirstLine && startPos.line === 0 && startPos.character === 0) {
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
		if (!this.highlightMultilineComments) return;
		
		let text = activeEditor.document.getText();

		// Build up regex matcher for custom delimiter tags
		let characters: Array<string> = [];
		for (let commentTag of this.tags) {
			characters.push(commentTag.escapedTag);
		}

		// Combine custom delimiters and the rest of the comment block matcher
		let commentMatchString = "(^)+([ \\t]*[ \\t]*)(";
		commentMatchString += characters.join("|");
		commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

		// Use start and end delimiters to find block comments
		let regexString = "(^|[ \\t])(";
		regexString += this.blockCommentStart;
		regexString += "[\\s])+([\\s\\S]*?)(";
		regexString += this.blockCommentEnd;
		regexString += ")";

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
		if (!this.highlightMultilineComments && !this.highlightJSDoc) return;

		let text = activeEditor.document.getText();

		// Build up regex matcher for custom delimiter tags
		let characters: Array<string> = [];
		for (let commentTag of this.tags) {
			characters.push(commentTag.escapedTag);
		}

		// Combine custom delimiters and the rest of the comment block matcher
		let commentMatchString = "(^)+([ \\t]*\\*[ \\t]*)("; // Highlight after leading *
		let regEx = /(^|[ \t])(\/\*\*)+([\s\S]*?)(\*\/)/gm; // Find rows of comments matching pattern /** */

		commentMatchString += characters.join("|");
		commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";

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

	/**
	 * Sets the comment delimiter [//, #, --, '] of a given language
	 * @param languageCode The short code of the current language
	 * https://code.visualstudio.com/docs/languages/identifiers
	 */
	private setDelimiter(languageCode: string): void {
		this.supportedLanguage = true;
		this.ignoreFirstLine = false;
		this.isPlainText = false;

		switch (languageCode) {

			case "asciidoc":
				this.setCommentFormat("//", "////", "////");
				break;

			case "apex":
			case "javascript":
			case "javascriptreact":
			case "typescript":
			case "typescriptreact":
				this.setCommentFormat("//", "/*", "*/");
				this.highlightJSDoc = true;
				break;

			case "al":
			case "c":
			case "cpp":
			case "csharp":
			case "dart":
			case "flax":
			case "fsharp":
			case "go":
			case "groovy":
			case "haxe":
			case "java":
			case "jsonc":
			case "kotlin":
			case "less":
			case "pascal":
			case "objectpascal":
			case "php":
			case "rust":
			case "scala":
			case "sass":
			case "scss":
			case "shaderlab":
			case "stylus":
			case "swift":
			case "verilog":
			case "vue":
				this.setCommentFormat("//", "/*", "*/");
				break;
			
			case "css":
				this.setCommentFormat("/*", "/*", "*/");
				break;

			case "coffeescript":
			case "dockerfile":
			case "gdscript":
			case "graphql":
			case "julia":
			case "makefile":
			case "perl":
			case "perl6":
			case "puppet":
			case "r":
			case "ruby":
			case "shellscript":
			case "tcl":
			case "yaml":
				this.delimiter = "#";
				break;
			
			case "tcl":
				this.delimiter = "#";
				this.ignoreFirstLine = true;
				break;

			case "elixir":
			case "python":
				this.setCommentFormat("#", '"""', '"""');
				this.ignoreFirstLine = true;
				break;
			
			case "nim":
				this.setCommentFormat("#", "#[", "]#");
				break;

			case "powershell":
				this.setCommentFormat("#", "<#", "#>");
				break;

			case "ada":
			case "hive-sql":
			case "pig":
			case "plsql":
			case "sql":
				this.delimiter = "--";
				break;
			
			case "lua":
				this.setCommentFormat("--", "--[[", "]]");
				break;

			case "elm":
			case "haskell":
				this.setCommentFormat("--", "{-", "-}");
				break;

			case "brightscript":
			case "diagram": // ? PlantUML is recognized as Diagram (diagram)
			case "vb":
				this.delimiter = "'";
				break;

			case "bibtex":
			case "erlang":
			case "latex":
			case "matlab":
				this.delimiter = "%";
				break;

			case "clojure":
			case "racket":
			case "lisp":
				this.delimiter = ";";
				break;

			case "terraform":
				this.setCommentFormat("#", "/*", "*/");
				break;

			case "COBOL":
				this.delimiter = this.escapeRegExp("*>");
				break;

			case "fortran-modern":
				this.delimiter = "c";
				break;
			
			case "SAS":
			case "stata":
				this.setCommentFormat("*", "/*", "*/");
				break;
			
			case "html":
			case "markdown":
			case "xml":
				this.setCommentFormat("<!--", "<!--", "-->");
				break;
			
			case "twig":
				this.setCommentFormat("{#", "{#", "#}");
				break;

			case "genstat":
				this.setCommentFormat("\\", '"', '"');
				break;
			
			case "cfml":
				this.setCommentFormat("<!---", "<!---", "--->");
				break;

			case "bat":
			case "cmd":
				// you can use :: , rem or : with leading space to comment a line
				this.delimiter = this.escapeRegExp('rem\ |::|: \ '); 
				break;

			case "plaintext":
				this.isPlainText = true;

				// If highlight plaintext is enabeld, this is a supported language
				this.supportedLanguage = this.contributions.highlightPlainText;
				break;

			default:
				this.supportedLanguage = false;
				break;
		}
	}

	/**
	 * Sets the highlighting tags up for use by the parser
	 */
	private setTags(): void {
		let items = this.contributions.tags;
		for (let item of items) {
			let options: vscode.DecorationRenderOptions = { color: item.color, backgroundColor: item.backgroundColor };

			// ? the textDecoration is initialised to empty so we can concat a preceeding space on it
			options.textDecoration = "";

			if (item.strikethrough) {
				options.textDecoration += "line-through";
			}
			
			if (item.underline) {
				options.textDecoration += " underline";
			}
			
			if (item.bold) {
				options.fontWeight = "bold";
			}

			if (item.italic) {
				options.fontStyle = "italic";
			}

			let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
			this.tags.push({
				tag: item.tag,
				escapedTag: escapedSequence.replace(/\//gi, "\\/"), // ! hardcoded to escape slashes
				ranges: [],
				decoration: vscode.window.createTextEditorDecorationType(options)
			});
		}
	}

	/**
	 * Escapes a given string for use in a regular expression
	 * @param input The input string to be escaped
	 * @returns {string} The escaped string
	 */
	private escapeRegExp(input: string): string {
		return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	/**
	 * Set up the comment format for single and multiline highlighting
	 * @param singleLine The single line comment delimiter. If NULL, single line is not supported
	 * @param start The start delimiter for block comments
	 * @param end The end delimiter for block comments
	 */
	private setCommentFormat(singleLine: string | null, start: string, end: string): void {
		
		// If no single line comment delimiter is passed, single line comments are not supported
		if (singleLine) {
			this.delimiter = this.escapeRegExp(singleLine);
		}
		else {
			this.highlightSingleLineComments = false;
		}

		this.blockCommentStart = this.escapeRegExp(start);
		this.blockCommentEnd = this.escapeRegExp(end);
		this.highlightMultilineComments = this.contributions.multilineComments;
	}
}
