// Builds a document that puts every tag in every position we care about, from a language's comment syntax

export interface CommentSyntax {
    // Built-in configs use the object form only after VS Code 1.101.0
    lineComment?: string | string[] | { comment: string; noIndent?: boolean };
    blockComment?: [string, string];
}

export function generateDocument(syntax: CommentSyntax | undefined, tags: string[], options: { bareTags?: boolean } = {}): string {
    const lines: string[] = [];
    const lineComment = syntax?.lineComment;
    const lineDelimiters = lineComment === undefined ? []
        : typeof lineComment === 'string' ? [lineComment]
        : Array.isArray(lineComment) ? lineComment : [lineComment.comment];
    const block = syntax?.blockComment;

    // Line 0 matters for the shebang rule, which skips a match there only when the text starts with #!
    if (lineDelimiters.length && tags.length) {
        lines.push(`${lineDelimiters[0]} ${tags[0]} first line of the file`);
    }

    for (const tag of tags) {
        lines.push('');
        lines.push(`code(); // tag ${JSON.stringify(tag)}`);

        for (const d of lineDelimiters) {
            lines.push(`${d} ${tag} start of line`);
            lines.push(`    ${d} ${tag} indented with spaces`);
            lines.push(`\t${d} ${tag} indented with a tab`);
            lines.push(`${d}${tag} no space after the delimiter`);
            lines.push(`${d}   ${tag} several spaces after the delimiter`);
            lines.push(`code(); ${d} ${tag} after code`);
            lines.push(`let s = "${d} ${tag} inside a string literal";`);
            lines.push(`${d} not ${tag} tag after the first word`);
            if (tag.toUpperCase() !== tag) lines.push(`${d} ${tag.toUpperCase()} upper case`);
            lines.push(`${d} ${tag}`);
        }

        if (block) {
            const [start, end] = block;
            lines.push(`${start} ${tag} single-line block ${end}`);
            lines.push(`code(); ${start} ${tag} block after code ${end}`);
            lines.push(start);
            lines.push(`${tag} block line at column 0`);
            lines.push(`    ${tag} indented block line`);
            lines.push(`    ${tag}: with a colon`);
            lines.push(`    not ${tag} tag after the first word`);
            lines.push(end);
        }

        lines.push('/**');
        lines.push(` * ${tag} jsdoc line`);
        lines.push(` *   ${tag}: jsdoc line with a colon`);
        lines.push(` * not ${tag} tag after the first word`);
        lines.push(' */');

        if (options.bareTags) {
            lines.push(`${tag} bare tag at the start of a line`);
            lines.push(`  ${tag} bare tag, indented`);
        }
    }

    lines.push('');
    for (const d of lineDelimiters) lines.push(d);

    // Left open at the end of the file
    if (block && tags.length) {
        lines.push(block[0]);
        lines.push(`    ${tags[0]} inside an unterminated block`);
    }

    return lines.join('\n') + '\n';
}
