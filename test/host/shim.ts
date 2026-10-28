import * as path from 'path';
import * as vscode from 'vscode';
import { repoRoot } from '../repo';
import { wrapLoad } from '../requireHook';

// Each extension gets its own copy of the vscode API, so wrapping the test's copy doesn't
// reach the extension, and TextEditor objects are frozen, so they can't be spied on either.
// Instead, every require('vscode') from the extension's compiled code (out/*.js) gets an API
// that records decoration types and hands out editors whose setDecorations calls are recorded.
// The extension activates from the same require cache, so its calls are recorded too.

export { repoRoot };
export const outDir = path.join(repoRoot, 'out');
export const samplesDir = path.join(repoRoot, 'test/fixtures/samples');
export const extensionId = 'aaron-bond.better-comments';

export interface CreatedType {
    type: vscode.TextEditorDecorationType;
    options: vscode.DecorationRenderOptions;
}

export interface SetDecorationsCall {
    uri: string;
    key: string;
    ranges: vscode.Range[];
}

export const recorder = {
    createdTypes: [] as CreatedType[],
    editorCalls: [] as SetDecorationsCall[],
};

// Must be false for end-to-end capture to be complete
export let extensionActiveAtInstall: boolean | undefined;

const wrappedEditors = new WeakMap<vscode.TextEditor, vscode.TextEditor>();

function wrapEditor(real: vscode.TextEditor | undefined): vscode.TextEditor | undefined {
    if (!real) return real;

    let wrapped = wrappedEditors.get(real);
    if (!wrapped) {
        wrapped = Object.create(real, {
            setDecorations: {
                value(type: vscode.TextEditorDecorationType, ranges: vscode.Range[] | vscode.DecorationOptions[]) {
                    recorder.editorCalls.push({ uri: real.document.uri.toString(), key: type.key, ranges: toRanges(ranges) });
                    return real.setDecorations(type, ranges);
                },
            },
        }) as vscode.TextEditor;
        wrappedEditors.set(real, wrapped);
    }
    return wrapped;
}

// The parser passes { range } objects; copy them, as it empties its array straight after the call
export function toRanges(ranges: ReadonlyArray<vscode.Range | vscode.DecorationOptions>): vscode.Range[] {
    return ranges.map(r => r instanceof vscode.Range ? r : r.range);
}

const shimWindow = Object.create(vscode.window, {
    createTextEditorDecorationType: {
        value(options: vscode.DecorationRenderOptions) {
            const type = vscode.window.createTextEditorDecorationType(options);
            recorder.createdTypes.push({ type, options });
            return type;
        },
    },
    activeTextEditor: {
        get() { return wrapEditor(vscode.window.activeTextEditor); },
    },
    onDidChangeActiveTextEditor: {
        value(listener: (e: vscode.TextEditor | undefined) => unknown, thisArg?: unknown, disposables?: vscode.Disposable[]) {
            return vscode.window.onDidChangeActiveTextEditor(e => listener.call(thisArg, wrapEditor(e)), undefined, disposables);
        },
    },
}) as typeof vscode.window;

// Own properties, not inherited ones: the compiled `import * as vscode` (esModuleInterop, always on from
// TypeScript 6) copies only the module's own properties
const shimApi = { ...vscode, window: shimWindow };

export function installShim(): void {
    if (extensionActiveAtInstall !== undefined) return;
    extensionActiveAtInstall = !!vscode.extensions.getExtension(extensionId)?.isActive;

    wrapLoad(original => function (request, parent, ...rest) {
        if (request === 'vscode' && parent?.filename?.startsWith(outDir + path.sep)) {
            return shimApi;
        }
        return original.call(this, request, parent, ...rest);
    });
}

// Loads one of the extension's unmodified compiled modules, e.g. loadOut('parser')
export function loadOut<T>(name: string): T {
    // The compiled module, which only exists at run time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(path.join(outDir, name)) as T;
}
