# Prismio website

The public sites for the [Prismio](https://github.com/prismio-lang/prismio)
programming language, as one pnpm + Turborepo workspace.

| App | Site | Port | What it is |
| --- | --- | --- | --- |
| `apps/web` | the landing site | 3000 | install, benchmarks, community |
| `apps/docs` | <https://docs.prismio.org> | 3001 | the language guide, standard library, and specification — for people writing Prismio |
| `apps/developers` | <https://developers.prismio.org> | 3002 | the contributor reference — for people changing the compiler, runtime, and tooling |
| `apps/play` | <https://play.prismio.org> | 3004 | interactive compiler playground — write, run, inspect AIF, and examine LLVM IR in the browser |

`packages/` holds the shared UI library and the ESLint and TypeScript configs.

## Writing documentation

**Read [DOC_STYLE.md](DOC_STYLE.md) before writing or rewriting a page** under
`apps/docs/content` or `apps/developers/content`. It explains why an accurate
page can still be unusable, the page shape every page follows (problem → see
it work → read a failure → worked example → internals), and the rules the
content audit enforces. `apps/developers/content/testing/aif-differential.md`
and `apps/developers/content/aif/overview.md` are its worked examples.

Every command output on a page is pasted from a real run. A `prismio` snippet
that compiles on its own is marked `<!-- prismio-check: pass -->` (or `fail`,
for one that must be rejected), and the example gate builds it.

## Checks

Both content sites carry the same two gates. The example gate needs a Prismio
compiler; the compiler repository is a sibling checkout at `../prismio`, and its
project host is the usual choice:

```bash
cd apps/developers
PRISMIO=../../../prismio/.prismio/build/debug/prismio node scripts/verify-doc-examples.mjs
node scripts/audit-content.mjs
```

```bash
cd apps/docs
PRISMIO=../../../prismio/.prismio/build/debug/prismio node scripts/verify-doc-examples.mjs
node scripts/audit-content.mjs
```

The audit checks frontmatter, internal links, acronym expansions, and two
readability rules from `DOC_STYLE.md`. Pages that do not yet meet those two are
listed in each app's `scripts/readability-baseline.json`. That list may only
shrink: fix a page and remove its entry — the audit fails if a listed page
already passes — and never add one.

`pnpm --filter <app> check` runs Velite, both gates, and ESLint together.

## Development

```bash
pnpm install
pnpm dev                       # every app
pnpm --filter developers dev   # one app
pnpm build
```

Node 24 or newer is required.
