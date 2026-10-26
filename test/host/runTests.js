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
const fs = require("fs");
const os = require("os");
const path = require("path");
const test_electron_1 = require("@vscode/test-electron");
// The lowest version allowed by "engines" in package.json, and the current stable release
const defaultVersions = ['1.65.0', 'stable'];
// Usage: node out/test/host/runTests.js <suite> [version...]
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const [suite, ...versionArgs] = process.argv.slice(2);
        if (!suite)
            throw new Error('Usage: runTests.js <suite> [version...]');
        const versions = versionArgs.length ? versionArgs : defaultVersions;
        const repoRoot = path.resolve(__dirname, '../../..');
        // Set when running from VS Code's integrated terminal; it makes the downloaded VS Code start as plain Node
        delete process.env.ELECTRON_RUN_AS_NODE;
        const failed = [];
        for (const version of versions) {
            const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'better-comments-test-'));
            try {
                yield (0, test_electron_1.runTests)({
                    version,
                    extensionDevelopmentPath: repoRoot,
                    extensionTestsPath: path.join(__dirname, 'index'),
                    extensionTestsEnv: { BC_TEST_SUITE: suite },
                    launchArgs: [
                        '--disable-extensions',
                        '--user-data-dir', userDataDir,
                        '--no-sandbox',
                        '--disable-gpu',
                        '--disable-workspace-trust',
                        '--skip-welcome',
                        '--skip-release-notes',
                    ],
                });
            }
            catch (e) {
                console.error(`Suite "${suite}" failed on VS Code ${version}:`, e);
                failed.push(version);
            }
            finally {
                fs.rmSync(userDataDir, { recursive: true, force: true });
            }
        }
        if (failed.length)
            throw new Error(`Suite "${suite}" failed on: ${failed.join(', ')}`);
    });
}
main().catch(e => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
//# sourceMappingURL=runTests.js.map