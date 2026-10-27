import { installShim } from './shim';

// Before anything else, so the shim is in place before the extension activates
installShim();

import * as fs from 'fs';
import * as path from 'path';
import Mocha = require('mocha');

// Entry point inside the extension host. Runs the *.test.js files of the suite named in
// BC_TEST_SUITE (a folder next to this file), e.g. "integration".
export async function run(): Promise<void> {
    const suite = process.env.BC_TEST_SUITE;
    if (!suite) throw new Error('BC_TEST_SUITE is not set');

    const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 20000 });
    for (const file of findTests(path.join(__dirname, suite))) {
        mocha.addFile(file);
    }

    await new Promise<void>((resolve, reject) => {
        mocha.run(failures => failures ? reject(new Error(`${failures} test(s) failed`)) : resolve());
    });
}

function findTests(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return findTests(full);
        return entry.name.endsWith('.test.js') ? [full] : [];
    });
}
