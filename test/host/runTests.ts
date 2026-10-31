import * as path from 'path';
import { repoRoot } from '../repo';
import { launchSuite } from './launch';

// The lowest version allowed by "engines" in package.json, and the current stable release
const defaultVersions = ['1.101.0', 'stable'];

// The activation suite's tags: one without a tag string, which is skipped, then the alert tag
const activationTags = [{ color: '#00FF00' }, { tag: '!', color: '#FF2D00' }];

// Usage: node out/test/host/runTests.js <suite> [--update-snapshots] [version...]
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const updateSnapshots = args.includes('--update-snapshots');
    const [suite, ...versionArgs] = args.filter(a => a !== '--update-snapshots');
    if (!suite) throw new Error('Usage: runTests.js <suite> [--update-snapshots] [version...]');

    const versions = versionArgs.length ? versionArgs : defaultVersions;

    const failed: string[] = [];
    for (const [i, version] of versions.entries()) {
        try {
            await launchSuite({
                suite,
                version,
                env: {
                    // Versions share one snapshot set and differ by label ("1.101.0", "stable"), not by resolved version
                    BC_VSCODE_LABEL: version,
                    BC_UPDATE_SNAPSHOTS: updateSnapshots ? '1' : '',
                    // The first version run writes the shared set; the rest only record where they differ
                    BC_OWNS_SHARED_SNAPSHOTS: i === 0 ? '1' : '',
                },
                // The activation suite starts with a file open, as when VS Code is opened on a file, and with an invalid
                // tag before a valid one, which stopped the extension activating up to 3.1.1 (#552)
                files: suite === 'activation' ? [path.join(repoRoot, 'test/fixtures/samples/javascript.js')] : [],
                settings: suite === 'activation' ? { 'better-comments.tags': activationTags } : undefined,
            });
        } catch (e) {
            console.error(`Suite "${suite}" failed on VS Code ${version}:`, e);
            failed.push(version);
        }
    }

    if (failed.length) throw new Error(`Suite "${suite}" failed on: ${failed.join(', ')}`);
}

main().catch(e => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
