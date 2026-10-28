import * as fs from 'fs';
import * as path from 'path';
import { customTags, defaultTags, TagSetting } from '../baseline/matrix';
import { repoRoot } from '../repo';

// The documents and settings both benchmark layers measure, so their results can be paired up

export interface PerfLanguage {
    languageId: string;
    sample: string;
    // Starts the line the edits add and remove
    lineComment: string;
}

export const perfLanguages: PerfLanguage[] = [
    { languageId: 'javascript', sample: 'javascript.js', lineComment: '//' },
    { languageId: 'csharp', sample: 'nested.cs', lineComment: '//' },
    { languageId: 'python', sample: 'test.py', lineComment: '#' },
];

export const defaultSizes = [1000, 5000, 10000, 25000, 50000];

export interface PerfTagSet {
    name: string;
    tags: TagSetting[];
}

export const perfTagSets: PerfTagSet[] = [
    { name: 'default', tags: defaultTags },
    { name: 'custom-tags', tags: customTags },
];

/** Repeats the language's sample until it has at least this many lines, ending on a whole copy */
export function documentText(language: PerfLanguage, lines: number): string {
    let sample = fs.readFileSync(path.join(repoRoot, 'test/fixtures/samples', language.sample), 'utf8');
    if (!sample.endsWith('\n')) sample += '\n';

    const sampleLines = sample.split('\n').length - 1;
    return sample.repeat(Math.ceil(lines / sampleLines));
}

/** The line each edit adds at the end of the document, and the next edit removes */
export function editLine(language: PerfLanguage): string {
    return `${language.lineComment} ! perf edit\n`;
}

export const lineCount = (text: string): number => text.split('\n').length - 1;

/** Identifies one measured case in both layers' results */
export function caseKey(c: { build: string; tagSet: string; languageId: string; lines: number }): string {
    return `${c.build}|${c.tagSet}|${c.languageId}|${c.lines}`;
}

export interface Stats {
    n: number;
    min: number;
    median: number;
    p90: number;
    max: number;
}

export function stats(samples: number[]): Stats {
    const sorted = [...samples].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    return { n: sorted.length, min: sorted[0], median: at(0.5), p90: at(0.9), max: sorted[sorted.length - 1] };
}
