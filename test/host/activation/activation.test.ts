import * as assert from 'assert';
import * as vscode from 'vscode';
import { extensionActiveAtInstall, extensionId, recorder } from '../shim';

// VS Code is launched with javascript.js already open (see runTests.ts), so the extension activates
// with an active editor, as it does when you open VS Code on a file. The settings have an invalid tag before the
// alert tag, so this is also the case from #552

describe('activation with a file already open', () => {
    it('installs the shim before the extension activates', () => {
        assert.strictEqual(extensionActiveAtInstall, false);
    });

    it('decorates the open file without any further action', async () => {
        const deadline = Date.now() + 15000;
        let decorated = false;
        while (!decorated && Date.now() < deadline) {
            decorated = recorder.editorCalls.some(c => c.uri.endsWith('/javascript.js') && c.ranges.length > 0);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        assert.ok(vscode.extensions.getExtension(extensionId)!.isActive, 'the extension activated on its own');
        assert.ok(decorated, 'javascript.js was decorated');
    });

    it('skips the invalid tag and decorates with the valid one (#552)', () => {
        const calls = recorder.editorCalls.filter(c => c.uri.endsWith('/javascript.js'));
        assert.strictEqual(new Set(calls.map(c => c.key)).size, 1, 'one decoration type, for the one valid tag');
        assert.ok(calls.some(c => c.ranges.length > 0), 'the alert tag decorated something');
    });
});
