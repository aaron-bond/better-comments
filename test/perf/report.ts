import * as fs from 'fs';
import * as path from 'path';
import { repoRoot } from '../repo';
import { HostResult, NodeResult } from './results';
import { caseKey } from './workloads';

// Pairs each case's Node and host results, compares builds, and fits the host times against the
// Node time, so the cheap Node layer can stand in for the host.
//
// Usage: node out/test/perf/report.js [results folder]   (defaults to the latest run)

export const perfDir = path.join(repoRoot, '.perf');

interface Fit { slope: number; intercept: number; r2: number; n: number; worstResidual: number }

/** Least squares fit of y = intercept + slope × x */
export function fit(points: Array<[number, number]>): Fit {
    const n = points.length;
    const mx = points.reduce((s, [x]) => s + x, 0) / n;
    const my = points.reduce((s, [, y]) => s + y, 0) / n;
    const sxx = points.reduce((s, [x]) => s + (x - mx) ** 2, 0);
    const sxy = points.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
    const syy = points.reduce((s, [, y]) => s + (y - my) ** 2, 0);

    const slope = sxx ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const residuals = points.map(([x, y]) => y - (intercept + slope * x));
    const ssRes = residuals.reduce((s, r) => s + r * r, 0);
    return { slope, intercept, r2: syy ? 1 - ssRes / syy : 1, n, worstResidual: Math.max(...residuals.map(Math.abs)) };
}

function readResults<T>(dir: string, prefix: string): T[] {
    return fs.readdirSync(dir)
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as T[]);
}

const ms = (value: number | undefined) => value === undefined ? '' : value.toFixed(value < 10 ? 2 : 1);

function table(header: string[], rows: string[][]): string {
    return [header, header.map(() => '---'), ...rows].map(r => `| ${r.join(' | ')} |`).join('\n');
}

/** Writes report.md and combined.json into the results folder, and returns the report */
export function writeReport(dir: string): string {
    const node = readResults<NodeResult>(dir, 'node-');
    const host = readResults<HostResult>(dir, 'host-');
    const hostByKey = new Map(host.map(h => [caseKey(h), h]));
    const nodeByKey = new Map(node.map(n => [caseKey(n), n]));
    const keys = Array.from(new Set([...nodeByKey.keys(), ...hostByKey.keys()]));
    const builds = Array.from(new Set([...node, ...host].map(r => r.build)));

    const lines: string[] = [`# Performance results`, '', `${path.basename(dir)}. All times are medians in ms.`];
    if (host.length) lines.push('', `VS Code ${host[0].vscodeVersion}. Host edit times include the extension's 100 ms debounce.`);

    lines.push('', '## Per case', '', table(
        ['Build', 'Tags', 'Language', 'Lines', 'Ranges', 'Node update', 'Host update', 'Host update p90', 'Edit to decorated', 'Switch to decorated', 'First open'],
        keys.map(key => {
            const n = nodeByKey.get(key);
            const h = hostByKey.get(key);
            const c = (n ?? h)!;
            const ranges = h?.ranges !== undefined && n && h.ranges !== n.ranges ? `${n.ranges} (host ${h.ranges})` : String(n?.ranges ?? h?.ranges ?? '');
            return [c.build, c.tagSet, c.languageId, String(c.lines), ranges,
                ms(n?.update.median), ms(h?.edit.update.median), ms(h?.edit.update.p90),
                ms(h?.edit.total.median), ms(h?.switchTo.total.median), ms(h?.open.total)];
        }),
    ));

    // Each other build against the first ("current" by default)
    if (builds.length > 1) {
        const [base, ...others] = builds;
        for (const other of others) {
            lines.push('', `## ${base} against ${other}`, '', `Ratio of ${base}'s time to ${other}'s: below 1 means ${base} is faster.`, '');
            const rows = keys
                .filter(key => key.startsWith(`${base}|`))
                .map(key => {
                    const otherKey = key.replace(`${base}|`, `${other}|`);
                    const ratio = (a?: number, b?: number) => a !== undefined && b ? (a / b).toFixed(2) : '';
                    const c = (nodeByKey.get(key) ?? hostByKey.get(key))!;
                    return [c.tagSet, c.languageId, String(c.lines),
                        ratio(nodeByKey.get(key)?.update.median, nodeByKey.get(otherKey)?.update.median),
                        ratio(hostByKey.get(key)?.edit.update.median, hostByKey.get(otherKey)?.edit.update.median),
                        ratio(hostByKey.get(key)?.edit.total.median, hostByKey.get(otherKey)?.edit.total.median)];
                });
            lines.push(table(['Tags', 'Language', 'Lines', 'Node update', 'Host update', 'Edit to decorated'], rows));
        }
    }

    // How well the Node time predicts each host time, over every case that has both
    const paired = keys.filter(k => nodeByKey.has(k) && hostByKey.has(k)).map(k => ({ n: nodeByKey.get(k)!, h: hostByKey.get(k)! }));
    const fits: Record<string, Fit> = {};
    if (paired.length >= 3) {
        const metrics: Array<[string, (h: HostResult) => number]> = [
            ['Host update', h => h.edit.update.median],
            ['Edit to decorated', h => h.edit.total.median],
            ['Switch to decorated', h => h.switchTo.total.median],
        ];
        lines.push('', '## Node time as a predictor of host time', '',
            `Fitted over ${paired.length} cases: host time ≈ intercept + slope × Node update time.`, '');
        lines.push(table(['Host metric', 'Intercept', 'Slope', 'R²', 'Worst miss'], metrics.map(([name, metric]) => {
            const f = fit(paired.map(p => [p.n.update.median, metric(p.h)]));
            fits[name] = f;
            return [name, ms(f.intercept), f.slope.toFixed(2), f.r2.toFixed(3), ms(f.worstResidual)];
        })));
    }

    const report = lines.join('\n') + '\n';
    fs.writeFileSync(path.join(dir, 'report.md'), report);
    fs.writeFileSync(path.join(dir, 'combined.json'), JSON.stringify({ node, host, fits }, null, 2));
    return report;
}

if (require.main === module) {
    const resultsRoot = path.join(perfDir, 'results');
    const dir = process.argv[2] ?? path.join(resultsRoot, fs.readdirSync(resultsRoot).sort().pop()!);
    console.log(writeReport(dir));
}
