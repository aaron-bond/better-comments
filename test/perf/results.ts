import { Stats } from './workloads';

// What each benchmark layer writes, one entry per measured case

export interface NodeResult {
    build: string;
    tagSet: string;
    languageId: string;
    lines: number;
    chars: number;
    ranges: number;
    // One update, as extension.ts runs it: finding the comments and ApplyDecorations, in ms
    update: Stats;
}

export interface HostResult {
    build: string;
    tagSet: string;
    languageId: string;
    lines: number;
    vscodeVersion: string;
    // Ranges per update, where the shim can see them (this repository's build only)
    ranges?: number;
    // Showing the document for the first time: from showTextDocument to the end of its first update
    open: { total: number; update: number };
    // Switching back to it from a plain text editor: from showTextDocument to the end of its update
    switchTo: { total: Stats; update: Stats };
    // One edit: from the edit to the end of the update it triggers (100 ms of it is the debounce)
    edit: { total: Stats; update: Stats; timerLateness: Stats };
}
