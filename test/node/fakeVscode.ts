import { ParserConstructor } from '../parserUpdate';
import { wrapLoad } from '../requireHook';

// A minimal stand-in for the vscode API: just what Parser uses. Importing this module installs it,
// so it must be imported before anything that requires vscode.

export class Position {
    constructor(public readonly line: number, public readonly character: number) { }
}

export class Range {
    constructor(public readonly start: Position, public readonly end: Position) { }
}

export interface FakeDecorationType {
    key: string;
    options: object;
    dispose(): void;
}

let settings: object = {};
let nextKey = 0;
export const createdTypes: FakeDecorationType[] = [];

/** Sets what getConfiguration('better-comments') returns from now on */
export function setSettings(value: object): void {
    settings = value;
}

const fakeApi = {
    Position,
    Range,
    window: {
        createTextEditorDecorationType(options: object): FakeDecorationType {
            const type = { key: `FakeDecorationType${nextKey++}`, options, dispose() { } };
            createdTypes.push(type);
            return type;
        },
    },
    workspace: {
        getConfiguration(section: string) {
            if (section !== 'better-comments') throw new Error(`Unexpected configuration section ${section}`);
            return settings;
        },
    },
};

wrapLoad(original => function (request, ...rest) {
    if (request === 'vscode') return fakeApi;
    return original.call(this, request, ...rest);
});

/** A TextDocument with VS Code's line handling: \r\n, \r and \n all end a line */
export class FakeDocument {
    private readonly lineStarts: number[] = [0];
    private readonly lineEnds: number[] = [];

    constructor(private readonly text: string, public readonly languageId: string) {
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === '\r' || ch === '\n') {
                this.lineEnds.push(i);
                if (ch === '\r' && text[i + 1] === '\n') i++;
                this.lineStarts.push(i + 1);
            }
        }
        this.lineEnds.push(text.length);
    }

    get eol(): 'LF' | 'CRLF' {
        return this.text.includes('\r\n') ? 'CRLF' : 'LF';
    }

    getText(range?: Range): string {
        if (!range) return this.text;
        return this.text.slice(this.offsetAt(range.start), this.offsetAt(range.end));
    }

    positionAt(offset: number): Position {
        offset = Math.max(0, Math.min(offset, this.text.length));
        let low = 0;
        let high = this.lineStarts.length - 1;
        while (low < high) {
            const mid = (low + high + 1) >> 1;
            if (this.lineStarts[mid] <= offset) low = mid; else high = mid - 1;
        }
        // An offset inside a line break belongs to the end of that line
        return new Position(low, Math.min(offset, this.lineEnds[low]) - this.lineStarts[low]);
    }

    offsetAt(position: Position): number {
        return this.lineStarts[position.line] + position.character;
    }
}

/** Loads the Parser to test: the TypeScript source, or another build named in BC_PARSER_PATH */
export function loadParser(): ParserConstructor {
    // Which build is only known at run time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require(process.env.BC_PARSER_PATH || '../../src/parser') as { Parser: ParserConstructor }).Parser;
}
