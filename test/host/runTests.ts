import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { repoRoot } from '../repo';

// The lowest version allowed by "engines" in package.json, and the current stable release
const defaultVersions = ['1.65.0', 'stable'];

// Usage: node out/test/host/runTests.js <suite> [--update-snapshots] [version...]
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const updateSnapshots = args.includes('--update-snapshots');
    const [suite, ...versionArgs] = args.filter(a => a !== '--update-snapshots');
    if (!suite) throw new Error('Usage: runTests.js <suite> [--update-snapshots] [version...]');

    const versions = versionArgs.length ? versionArgs : defaultVersions;

    // Set when running from VS Code's integrated terminal; it makes the downloaded VS Code start as plain Node
    delete process.env.ELECTRON_RUN_AS_NODE;

    const failed: string[] = [];
    for (const version of versions) {
        const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'better-comments-test-'));
        try {
            await runTests({
                version,
                extensionDevelopmentPath: [
                    repoRoot,
                    path.join(repoRoot, 'test/fixtures/extensions/no-comment-syntax'),
                ],
                extensionTestsPath: path.join(__dirname, 'index'),
                extensionTestsEnv: {
                    BC_TEST_SUITE: suite,
                    // Snapshots are kept per version label ("1.65.0", "stable"), not per resolved version
                    BC_VSCODE_LABEL: version,
                    BC_UPDATE_SNAPSHOTS: updateSnapshots ? '1' : '',
                },
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
        } catch (e) {
            console.error(`Suite "${suite}" failed on VS Code ${version}:`, e);
            failed.push(version);
        } finally {
            fs.rmSync(userDataDir, { recursive: true, force: true });
        }
    }

    if (failed.length) throw new Error(`Suite "${suite}" failed on: ${failed.join(', ')}`);
}

main().catch(e => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
