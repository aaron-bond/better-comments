import * as fs from 'fs';
import * as path from 'path';

// The repo root, found by walking up, so paths work from both test/ and out/test/
function findRepoRoot(from: string): string {
    for (let dir = from; ; dir = path.dirname(dir)) {
        const pkg = path.join(dir, 'package.json');
        if (fs.existsSync(pkg) && JSON.parse(fs.readFileSync(pkg, 'utf8')).name === 'better-comments') return dir;
        if (path.dirname(dir) === dir) throw new Error(`No better-comments package.json above ${from}`);
    }
}

export const repoRoot = findRepoRoot(__dirname);
