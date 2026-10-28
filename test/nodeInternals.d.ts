// Node's Module._load, which require() goes through. It isn't public API, so @types/node doesn't declare it, but
// it's how require() has resolved modules in every Node version. The test harnesses replace it (requireHook.ts).
import 'module';

declare module 'module' {
    namespace Module {
        let _load: (this: unknown, request: string, parent: NodeModule | undefined, ...rest: unknown[]) => unknown;
    }
}
