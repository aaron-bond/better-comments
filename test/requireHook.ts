import Module from 'module';

// The test harnesses replace require()'s loader to hand out a stand-in vscode API (see nodeInternals.d.ts)
export type Load = typeof Module._load;

/** Replaces require()'s loader with one built around the current one */
export function wrapLoad(wrap: (original: Load) => Load): void {
    Module._load = wrap(Module._load);
}
