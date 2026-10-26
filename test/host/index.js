"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const shim_1 = require("./shim");
// Before anything else, so the shim is in place before the extension activates
(0, shim_1.installShim)();
const fs = require("fs");
const path = require("path");
const Mocha = require("mocha");
// Entry point inside the extension host. Runs the *.test.js files of the suite named in
// BC_TEST_SUITE (a folder next to this file), e.g. "integration".
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const suite = process.env.BC_TEST_SUITE;
        if (!suite)
            throw new Error('BC_TEST_SUITE is not set');
        const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 20000 });
        for (const file of findTests(path.join(__dirname, suite))) {
            mocha.addFile(file);
        }
        yield new Promise((resolve, reject) => {
            mocha.run(failures => failures ? reject(new Error(`${failures} test(s) failed`)) : resolve());
        });
    });
}
exports.run = run;
function findTests(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
            return findTests(full);
        return entry.name.endsWith('.test.js') ? [full] : [];
    });
}
//# sourceMappingURL=index.js.map