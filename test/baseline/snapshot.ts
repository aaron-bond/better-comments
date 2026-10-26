import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { repoRoot } from '../repo';

// Snapshot files are written by the host baseline with --update-snapshots and compared exactly otherwise

export const snapshotRoot = path.join(repoRoot, 'test/baseline/snapshots');

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

// readOnly: only ever compare, even with --update-snapshots (the Node baseline checks the host's snapshots)
export function matchSnapshot(relativePath: string, actual: unknown, options: { readOnly?: boolean } = {}): void {
    const file = path.join(snapshotRoot, relativePath);
    // Round-trip so undefined properties compare the same way they're stored
    const normalised = JSON.parse(JSON.stringify(actual));

    if (updateSnapshots && !options.readOnly) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(normalised, null, 2) + '\n');
        return;
    }

    if (!fs.existsSync(file)) {
        assert.fail(`No snapshot at ${relativePath}. Run the host baseline with --update-snapshots to create it.`);
    }
    assert.deepStrictEqual(normalised, JSON.parse(fs.readFileSync(file, 'utf8')));
}
