import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { repoRoot } from '../repo';

// The split described in src/core/index.ts: the core is pure and self-contained, and the rest of src/ only
// reaches it through its index

const srcDir = path.join(repoRoot, 'src');
const coreDir = path.join(srcDir, 'core');
const coreIndex = path.join(coreDir, 'index');

// Packages the core may use: pure, with no I/O
const corePackages = ['json5'];

function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(file);
        return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [file] : [];
    });
}

/** Every module the file imports or re-exports, with relative ones resolved to a path without extension */
function importsOf(file: string): string[] {
    return ts.preProcessFile(fs.readFileSync(file, 'utf8'), true, true).importedFiles.map(({ fileName }) =>
        fileName.startsWith('.') ? path.resolve(path.dirname(file), fileName) : fileName);
}

const isInCore = (target: string) => target === coreDir || target.startsWith(coreDir + path.sep);
const relative = (file: string) => path.relative(repoRoot, file);

describe('src/core boundary', () => {
    const files = sourceFiles(srcDir);
    const coreFiles = files.filter(isInCore);
    const shellFiles = files.filter(f => !isInCore(f));

    it('finds the files to check', () => {
        assert.ok(coreFiles.length > 0 && shellFiles.length > 0);
    });

    it('the core imports only itself and pure packages: no vscode, no Node modules', () => {
        const violations = coreFiles.flatMap(file => importsOf(file)
            .filter(target => path.isAbsolute(target) ? !isInCore(target) : !corePackages.includes(target))
            .map(target => `${relative(file)} imports ${path.isAbsolute(target) ? relative(target) : target}`));
        assert.deepStrictEqual(violations, []);
    });

    it('the rest of src/ imports the core only through src/core/index.ts', () => {
        const violations = shellFiles.flatMap(file => importsOf(file)
            .filter(target => path.isAbsolute(target) && isInCore(target) && target !== coreDir && target !== coreIndex)
            .map(target => `${relative(file)} imports ${relative(target)}`));
        assert.deepStrictEqual(violations, []);
    });
});
