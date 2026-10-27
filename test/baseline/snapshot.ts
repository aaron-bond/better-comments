import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { isDeepStrictEqual } from 'util';
import { repoRoot } from '../repo';

// Snapshot files are written by the host baseline with --update-snapshots and compared exactly otherwise

export const snapshotRoot = path.join(repoRoot, 'test/baseline/snapshots');

// Host snapshots are shared by every VS Code version. A version only gets its own copy of a file where its
// output differs: versions/<label>/<path> is then used instead of host/<path>.
const sharedDir = 'host';
const versionsDir = 'versions';

export interface RecordedRange {
    start: string; // line:character
    end: string;
    text: string;
}

export interface CaseResult {
    supported: boolean;
    error?: string;
    setDecorationsCalls: number;
    applied: Array<{ tag: string; ranges: RecordedRange[] }>;
}

export interface Snapshot {
    settings: string;
    target: string;
    input: string;
    languageId: string;
    eol: 'LF' | 'CRLF';
    decorationTypes: Array<{ tag: string; options: object }>;
    // Histories that give the same result are grouped together
    results: Array<{ histories: string[] } & CaseResult>;
}

export function groupByResult(byHistory: Array<[string, CaseResult]>): Snapshot['results'] {
    const groups = new Map<string, { histories: string[] } & CaseResult>();
    for (const [history, result] of byHistory) {
        const key = JSON.stringify(result);
        const group = groups.get(key);
        if (group) group.histories.push(history);
        else groups.set(key, { histories: [history], ...result });
    }
    return [...groups.values()];
}

export const updateSnapshots = process.env.BC_UPDATE_SNAPSHOTS === '1';

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
// Round-trip so undefined properties compare the same way they're stored
const normalise = (actual: unknown) => JSON.parse(JSON.stringify(actual));

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

// Deletes the file, and any folders under versions/ that it leaves empty
function removeVersionFile(file: string): void {
    if (!fs.existsSync(file)) return;
    fs.unlinkSync(file);
    const stop = path.join(snapshotRoot, versionsDir);
    for (let dir = path.dirname(file); dir.startsWith(stop) && fs.readdirSync(dir).length === 0; dir = path.dirname(dir)) {
        fs.rmdirSync(dir);
    }
}

/** The versions that have files of their own, because some of their output differs from the shared set */
export function versionsWithOwnSnapshots(): string[] {
    const dir = path.join(snapshotRoot, versionsDir);
    return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

/** The host snapshot a version is compared against: its own file if it has one, otherwise the shared one */
export function hostSnapshotFile(relativePath: string, version?: string): string {
    const own = version ? path.join(snapshotRoot, versionsDir, version, relativePath) : undefined;
    return own && fs.existsSync(own) ? own : path.join(snapshotRoot, sharedDir, relativePath);
}

export const ownsSharedSnapshots = process.env.BC_OWNS_SHARED_SNAPSHOTS === '1';

/**
 * Compares a host result with the version's snapshot.
 * With --update-snapshots, the version that owns the shared set (the first one run) rewrites it. Any other version
 * writes its own file only where it differs from the shared one, and removes its own file where it doesn't.
 * readOnly: only ever compare (the Node baseline checks the host's snapshots)
 */
export function matchHostSnapshot(relativePath: string, actual: unknown, version: string | undefined, options: { readOnly?: boolean } = {}): void {
    const normalised = normalise(actual);
    const shared = path.join(snapshotRoot, sharedDir, relativePath);
    const own = version ? path.join(snapshotRoot, versionsDir, version, relativePath) : undefined;

    if (updateSnapshots && !options.readOnly) {
        if (ownsSharedSnapshots || !fs.existsSync(shared)) {
            writeJson(shared, normalised);
            if (own) removeVersionFile(own);
        } else if (own && !isDeepStrictEqual(normalised, readJson(shared))) {
            writeJson(own, normalised);
        } else if (own) {
            removeVersionFile(own);
        }
        return;
    }

    const file = hostSnapshotFile(relativePath, version);
    if (!fs.existsSync(file)) {
        assert.fail(`No snapshot at ${path.relative(snapshotRoot, file)}. Run the host baseline with --update-snapshots to create it.`);
    }
    assert.deepStrictEqual(normalised, readJson(file));
}

// readOnly: only ever compare, even with --update-snapshots (the Node baseline checks the host's snapshots)
export function matchSnapshot(relativePath: string, actual: unknown, options: { readOnly?: boolean } = {}): void {
    const file = path.join(snapshotRoot, relativePath);
    const normalised = normalise(actual);

    if (updateSnapshots && !options.readOnly) {
        writeJson(file, normalised);
        return;
    }

    if (!fs.existsSync(file)) {
        assert.fail(`No snapshot at ${relativePath}. Run the host baseline with --update-snapshots to create it.`);
    }
    assert.deepStrictEqual(normalised, readJson(file));
}
