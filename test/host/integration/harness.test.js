"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const path = require("path");
const vscode = require("vscode");
const shim_1 = require("../shim");
// Checks that the harness itself can see what the unmodified extension does.
// If these fail, every other host test is suspect.
const defaultTags = require('../../../../package.json').contributes.configuration.properties['better-comments.tags'].default;
function waitFor(what, check, timeoutMs = 5000) {
    return __awaiter(this, void 0, void 0, function* () {
        const deadline = Date.now() + timeoutMs;
        for (;;) {
            const result = check();
            if (result)
                return result;
            if (Date.now() > deadline)
                throw new Error(`Timed out waiting for ${what}`);
            yield new Promise(r => setTimeout(r, 50));
        }
    });
}
const callsFor = (doc) => shim_1.recorder.editorCalls.filter(c => c.uri === doc.uri.toString());
describe('test harness', () => {
    it('installs the shim before the extension activates', () => {
        assert.strictEqual(shim_1.extensionActiveAtInstall, false);
    });
    it('records the decoration types the unmodified parser creates', () => {
        const { Configuration } = (0, shim_1.loadOut)('configuration');
        const { Parser } = (0, shim_1.loadOut)('parser');
        // The constructor is synchronous, so nothing else can create types in between
        const before = shim_1.recorder.createdTypes.length;
        new Parser(new Configuration());
        const created = shim_1.recorder.createdTypes.slice(before);
        assert.deepStrictEqual(created.map(c => c.options.color), defaultTags.map(t => t.color));
    });
    it('reads the real built-in language configs', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { Configuration } = (0, shim_1.loadOut)('configuration');
        const config = new Configuration();
        const lineComments = {};
        for (const languageId of ['javascript', 'csharp', 'python']) {
            lineComments[languageId] = (_a = (yield config.GetCommentConfiguration(languageId))) === null || _a === void 0 ? void 0 : _a.lineComment;
        }
        assert.deepStrictEqual(lineComments, { javascript: '//', csharp: '//', python: '#' });
    }));
    it('captures the activated extension decorating an opened file', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield vscode.workspace.openTextDocument(path.join(shim_1.samplesDir, 'javascript.js'));
        yield vscode.window.showTextDocument(doc);
        yield vscode.extensions.getExtension(shim_1.extensionId).activate();
        yield waitFor('decorations on javascript.js', () => callsFor(doc).some(c => c.ranges.length > 0));
    }));
    it('captures the activated extension updating after an edit', () => __awaiter(void 0, void 0, void 0, function* () {
        // Untitled, so nothing on disk is touched
        const doc = yield vscode.workspace.openTextDocument({ language: 'javascript', content: 'const a = 1;\n' });
        const editor = yield vscode.window.showTextDocument(doc);
        yield waitFor('first decoration pass', () => callsFor(doc).length > 0);
        yield editor.edit(b => b.insert(new vscode.Position(0, 0), '// ! harness edit\n'));
        const alert = yield waitFor('the new alert to be decorated', () => callsFor(doc).find(c => c.ranges.some(r => r.start.line === 0 && r.start.character === 0)));
        const range = alert.ranges.find(r => r.start.line === 0);
        assert.strictEqual(doc.getText(range), '// ! harness edit');
        yield vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    }));
});
//# sourceMappingURL=harness.test.js.map