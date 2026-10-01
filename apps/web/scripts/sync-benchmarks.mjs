#!/usr/bin/env node
/**
 * Copies the compiler repository's benchmark results into this site.
 *
 *   pnpm sync:benchmarks                    # reads ../../../prismio (next to this repo)
 *   PRISMIO_REPO=/path/to/prismio pnpm sync:benchmarks
 *
 * `benchmarks/run.py` (`prismio bench`) is the single source of truth; this only
 * copies its `benchmarks/results/results.json` to `data/results.json`. Results
 * written before schema 2 recorded absolute paths from the machine that ran them,
 * so every path in `build_commands` and `artifacts` is made repo-relative here,
 * and the copy is refused if a home-directory path is still left in it.
 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {basename, dirname, isAbsolute, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.env.PRISMIO_REPO ?? resolve(here, '../../../../prismio'));
const source = resolve(repo, 'benchmarks/results/results.json');
const target = resolve(here, '../data/results.json');

if (!existsSync(source)) {
    console.error(`No results at ${source}.\nRun \`prismio bench\` in the compiler repository first, or set PRISMIO_REPO.`);
    process.exit(1);
}

/** An absolute path as a reader of the repository would type it. */
function portable(token) {
    if (!isAbsolute(token)) return token;
    for (const marker of ['/benchmarks/', '/.prismio/']) {
        const at = token.lastIndexOf(marker);
        if (at >= 0) return token.slice(at + 1);
    }
    return basename(token);
}

const portableCommand = (command) => command.split(/\s+/).map(portable).join(' ');

const data = JSON.parse(readFileSync(source, 'utf8'));

if (data.build_commands) {
    data.build_commands = Object.fromEntries(
        Object.entries(data.build_commands).map(([arm, command]) => [arm, portableCommand(command)]),
    );
}
if (data.artifacts) {
    data.artifacts = Object.fromEntries(
        Object.entries(data.artifacts).map(([name, path]) => [name, portable(path)]),
    );
}

const output = JSON.stringify(data, null, 2) + '\n';
const leak = output.match(/\/(?:Users|home)\/[^"\s]+/);
if (leak) {
    console.error(`Refusing to write: a machine path is still in the results (${leak[0]}).`);
    process.exit(1);
}

writeFileSync(target, output);

const workloads = Array.isArray(data.benchmarks) ? data.benchmarks.length : 0;
console.log(`Synced ${workloads} workloads, ${data.runs} runs each`);
console.log(`  generated   ${data.generated_at}`);
console.log(`  schema      v${data.schema_version ?? 1}${data.environment ? '' : '  (no environment block: re-run `prismio bench` with the current run.py)'}`);
console.log(`  wrote       ${target}`);
