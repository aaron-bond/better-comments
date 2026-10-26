"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOut = exports.installShim = exports.toRanges = exports.extensionActiveAtInstall = exports.recorder = exports.extensionId = exports.samplesDir = exports.outDir = exports.repoRoot = void 0;
const path = require("path");
const vscode = require("vscode");
const Module = require("module");
// Each extension gets its own copy of the vscode API, so wrapping the test's copy doesn't
// reach the extension, and TextEditor objects are frozen, so they can't be spied on either.
// Instead, every require('vscode') from the extension's compiled code (out/*.js) gets an API
// that records decoration types and hands out editors whose setDecorations calls are recorded.
// The extension activates from the same require cache, so its calls are recorded too.
exports.repoRoot = path.resolve(__dirname, '../../..');
exports.outDir = path.join(exports.repoRoot, 'out');
exports.samplesDir = path.join(exports.repoRoot, 'test/fixtures/samples');
exports.extensionId = 'aaron-bond.better-comments';
exports.recorder = {
    createdTypes: [],
    editorCalls: [],
};
const wrappedEditors = new WeakMap();
function wrapEditor(real) {
    if (!real)
        return real;
    let wrapped = wrappedEditors.get(real);
    if (!wrapped) {
        wrapped = Object.create(real, {
            setDecorations: {
                value(type, ranges) {
                    exports.recorder.editorCalls.push({ uri: real.document.uri.toString(), key: type.key, ranges: toRanges(ranges) });
                    return real.setDecorations(type, ranges);
                },
            },
        });
        wrappedEditors.set(real, wrapped);
    }
    return wrapped;
}
// The parser passes { range } objects; copy them, as it empties its array straight after the call
function toRanges(ranges) {
    return ranges.map(r => r instanceof vscode.Range ? r : r.range);
}
exports.toRanges = toRanges;
const shimWindow = Object.create(vscode.window, {
    createTextEditorDecorationType: {
        value(options) {
            const type = vscode.window.createTextEditorDecorationType(options);
            exports.recorder.createdTypes.push({ type, options });
            return type;
        },
    },
    activeTextEditor: {
        get() { return wrapEditor(vscode.window.activeTextEditor); },
    },
    onDidChangeActiveTextEditor: {
        value(listener, thisArg, disposables) {
            return vscode.window.onDidChangeActiveTextEditor(e => listener.call(thisArg, wrapEditor(e)), undefined, disposables);
        },
    },
});
const shimApi = Object.create(vscode, { window: { value: shimWindow } });
function installShim() {
    var _a;
    if (exports.extensionActiveAtInstall !== undefined)
        return;
    exports.extensionActiveAtInstall = !!((_a = vscode.extensions.getExtension(exports.extensionId)) === null || _a === void 0 ? void 0 : _a.isActive);
    const loader = Module;
    const originalLoad = loader._load;
    loader._load = function (request, parent) {
        var _a;
        if (request === 'vscode' && ((_a = parent === null || parent === void 0 ? void 0 : parent.filename) === null || _a === void 0 ? void 0 : _a.startsWith(exports.outDir + path.sep))) {
            return shimApi;
        }
        return originalLoad.apply(this, arguments);
    };
}
exports.installShim = installShim;
// Loads one of the extension's unmodified compiled modules, e.g. loadOut('parser')
function loadOut(name) {
    return require(path.join(exports.outDir, name));
}
exports.loadOut = loadOut;
//# sourceMappingURL=shim.js.map