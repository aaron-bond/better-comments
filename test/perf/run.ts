import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { hostSnapshotFile } from '../baseline/snapshot';
import { launchSuite } from '../host/launch';
import { repoRoot } from '../repo';
import { perfDir, writeReport } from './report';
import { perfTagSets } from './workloads';

// Runs both benchmark layers for each build and writes a report pairing them up.
//
// Usage: node out/test/perf/run.js [options]
//   --builds current,v3.0.2=084a906   "current" is this checkout's out/; label=commit builds that commit
//   --version stable                  the VS Code version for the host layer
//   --sizes 1000,5000,10000           document sizes in lines (rounded up to whole copies of the sample)
//   --iterations 15                   measured edits per document in the host layer
//   --skip-node, --skip-host          run only one layer

interface Build { label: string; root: string }

function option(args: string[], name: string, fallback: string): string {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

/** Compiles the extension as it was at a commit, into .perf/builds/<label>, once */
function referenceBuild(label: string, commit: string): Build {
    const root = path.join(perfDir, 'builds', label);
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

    if (!fs.existsSync(path.join(root, 'out', 'extension.js'))) {
        console.log(`Building ${label} from ${commit}`);
        fs.rmSync(root, { recursive: true, force: true });

        // The extension's sources and manifest only. It resolves json5 from this repository's node_modules
        const files = git('ls-tree', '-r', '--name-only', commit, 'src', 'package.json', 'tsconfig.json')
            .split('\n')
            .filter(f => f && !f.startsWith('src/test/'));
        for (const file of files) {
            fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
            fs.writeFileSync(path.join(root, file), git('show', `${commit}:${file}`));
        }

        // Emit only: an old commit's types needn't check against this checkout's @types (v3.0.2 uses NodeJS.Timer)
        execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', root, '--noCheck'], { stdio: 'inherit' });
    }
    return { label, root };
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const version = option(args, '--version', 'stable');
    const sizes = option(args, '--sizes', '');
    const iterations = option(args, '--iterations', '');

    const builds = option(args, '--builds', 'current,v3.0.2=084a906').split(',').map(spec => {
        if (spec === 'current') return { label: 'current', root: repoRoot };
        const [label, commit] = spec.split('=');
        if (!commit) throw new Error(`Expected label=commit, not "${spec}"`);
        return referenceBuild(label, commit);
    });

    const resultsDir = path.join(perfDir, 'results', new Date().toISOString().replace(/[:.]/g, '-'));
    fs.mkdirSync(resultsDir, { recursive: true });

    // The language configs the host baseline recorded, so the Node layer parses the same syntax as the host
    const configs = hostSnapshotFile('language-configs.json', version);

    const common: Record<string, string> = {
        ...(sizes ? { BC_PERF_SIZES: sizes } : {}),
        ...(iterations ? { BC_PERF_ITERATIONS: iterations } : {}),
    };

    if (!args.includes('--skip-node')) {
        for (const build of builds) {
            console.log(`\nNode layer: ${build.label}`);
            const result = spawnSync(process.execPath, [path.join(__dirname, 'node', 'bench.js')], {
                stdio: 'inherit',
                env: {
                    ...process.env, ...common,
                    BC_BUILD: build.label,
                    BC_PARSER_PATH: path.join(build.root, 'out', 'parser.js'),
                    BC_PERF_CONFIGS: configs,
                    BC_PERF_OUT: path.join(resultsDir, `node-${build.label}.json`),
                },
            });
            if (result.status !== 0) throw new Error(`The Node layer failed for ${build.label}`);
        }
    }

    if (!args.includes('--skip-host')) {
        for (const build of builds) {
            for (const tagSet of perfTagSets) {
                console.log(`\nHost layer: ${build.label}, ${tagSet.name} tags, VS Code ${version}`);
                await launchSuite({
                    suite: 'perf',
                    version,
                    extensionRoot: build.root,
                    // The extension only reads its settings on activation, so they go in before launch
                    settings: tagSet.name === 'default' ? {} : { 'better-comments.tags': tagSet.tags },
                    env: {
                        ...common,
                        BC_BUILD: build.label,
                        BC_TAG_SET: tagSet.name,
                        BC_EXTENSION_ROOT: build.root,
                        BC_PERF_OUT: path.join(resultsDir, `host-${build.label}-${tagSet.name}.json`),
                    },
                });
            }
        }
    }

    console.log('\n' + writeReport(resultsDir));
    console.log(`Results: ${resultsDir}`);
}

if (require.main === module) {
    main().catch(e => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    });
}
