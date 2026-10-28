import Module from 'module';

// require() goes through Module._load, which the test harnesses replace to hand out a stand-in vscode API.
// It isn't public API, but it's how require() has resolved modules in every Node version.
export type Load = (this: unknown, request: string, parent: NodeModule | undefined, ...rest: unknown[]) => unknown;

const loader = Module as unknown as { _load: Load };

/** Replaces require()'s loader with one built around the current one */
export function wrapLoad(wrap: (original: Load) => Load): void {
    loader._load = wrap(loader._load);
}
