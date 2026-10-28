import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { repoRoot } from '../repo';

export interface LaunchOptions {
    // A folder next to index.js, e.g. "integration"
    suite: string;
    // A VS Code version, e.g. "1.101.0" or "stable"
    version: string;
    // The Better Comments build to load. Defaults to this repository
    extensionRoot?: string;
    // Written to the test profile's settings.json before launch, so the extension reads them on activation
    settings?: Record<string, unknown>;
    // Passed to the suite, alongside BC_TEST_SUITE
    env?: Record<string, string>;
    // Opened at launch, as when VS Code is opened on a file
    files?: string[];
}

// Runs one suite in a downloaded VS Code with a throwaway profile. Rejects if the suite fails
export async function launchSuite(options: LaunchOptions): Promise<void> {
    // Set when running from VS Code's integrated terminal; it makes the downloaded VS Code start as plain Node
    delete process.env.ELECTRON_RUN_AS_NODE;

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'better-comments-test-'));

    // New and empty documents get the OS line ending by default, which would make snapshots differ on Windows
    fs.mkdirSync(path.join(userDataDir, 'User'));
    fs.writeFileSync(path.join(userDataDir, 'User', 'settings.json'), JSON.stringify({ 'files.eol': '\n', ...options.settings }));
    try {
        await runTests({
            version: options.version,
            extensionDevelopmentPath: [
                options.extensionRoot ?? repoRoot,
                path.join(repoRoot, 'test/fixtures/extensions/no-comment-syntax'),
            ],
            extensionTestsPath: path.join(__dirname, 'index'),
            extensionTestsEnv: {
                ...options.env,
                BC_TEST_SUITE: options.suite,
            },
            launchArgs: [
                ...(options.files ?? []),
                '--disable-extensions',
                '--user-data-dir', userDataDir,
                '--no-sandbox',
                '--disable-gpu',
                '--disable-workspace-trust',
                '--skip-welcome',
                '--skip-release-notes',
            ],
        });
    } finally {
        fs.rmSync(userDataDir, { recursive: true, force: true });
    }
}
