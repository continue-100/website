# Prismio website

The public sites for the [Prismio](https://github.com/prismio-lang/prismio) programming
language, in one pnpm and Turborepo workspace.

[![GEO Score](https://geoready.dev/badge?url=https%3A%2F%2Fprismio.org)](https://geoready.dev?utm_source=badge)

| App | Site | Port | What it is |
| --- | --- | --- | --- |
| [`apps/web`](apps/web) | <https://prismio.org> | 3000 | The main site: overview, install, benchmarks, roadmap, community, sponsors, team |
| [`apps/docs`](apps/docs) | <https://docs.prismio.org> | 3001 | The language guide, standard library, and specification, for people writing Prismio |
| [`apps/developers`](apps/developers) | <https://developers.prismio.org> | 3002 | The contributor reference, for people changing the compiler, runtime, and tooling |
| [`apps/packages`](apps/packages) | <https://packages.prismio.org> | 3003 | The package registry site. A "coming soon" page for now: Prismio 0.1 has no registry |
| [`apps/play`](apps/play) | <https://play.prismio.org> | 3004 | The playground. A "coming soon" page for now |

## Stack

Next.js 16 (App Router) and React 19, TypeScript, Tailwind CSS 4, and
[HeroUI](https://heroui.com) 3 for a few interactive components. The two content sites build
their pages from Markdown with [Velite](https://velite.js.org).

## Layout

```
apps/
  web/              the main site
  docs/             language documentation (content/ is Markdown)
  developers/       contributor documentation (content/ is Markdown)
  packages/         package registry site
  play/             playground site
packages/
  ui/               shared UI: footer, logo, copyright
  utils/            shared constants (version, LLVM version, Discord invite)
  docs-core/        the documentation engine shared by docs and developers
  eslint-config/    shared ESLint configuration
  typescript-config/ shared tsconfig bases
```

## Getting started

You need **Node 24 or newer** and **pnpm** (the version is pinned in `package.json`; with
Corepack, `corepack enable` is enough).

```bash
pnpm install
pnpm dev                    # every app
pnpm --filter web dev       # one app: http://localhost:3000
pnpm build
pnpm lint
pnpm check-types
```

## Working on the main site

`apps/web` holds the routes under `app/` (`/`, `/install`, `/benchmarks`, `/roadmap`,
`/community`, `/sponsors`, `/team`, `/about`), the homepage sections in
`components/landing/`, and the benchmark components in `components/benchmarks/`.

**The pages describe a compiler that lives in another repository, so they must stay true to
it.** Before writing a claim about what Prismio can do, check it against the compiler repo
or the docs. Prefer saying what is experimental or missing over leaving it out.

### Benchmark data

`apps/web/data/results.json` is the output of the compiler repository's benchmark harness
(`benchmarks/run.py`, run with `prismio bench`). Do not edit it by hand. To refresh it:

```bash
# in the compiler repository
prismio bench

# in this repository, with the compiler checked out next to it (../prismio)
pnpm --filter web sync:benchmarks
# or point at another checkout
PRISMIO_REPO=/path/to/prismio pnpm --filter web sync:benchmarks
```

The script copies the file, makes any absolute path in it repo-relative, and refuses to
write the copy if a home-directory path is left in it.

## Writing documentation

**Read [DOC_STYLE.md](DOC_STYLE.md) before writing or rewriting a page** under
`apps/docs/content` or `apps/developers/content`. It explains why an accurate page can still
be unusable, the page shape every page follows (problem, see it work, read a failure, worked
example, internals), and the rules the content audit enforces.
`apps/developers/content/testing/aif-differential.md` and
`apps/developers/content/aif/overview.md` are its worked examples.

Every command output on a page is pasted from a real run. A `prismio` snippet that compiles
on its own is marked `<!-- prismio-check: pass -->` (or `fail`, for one that must be
rejected), and the example gate builds it.

### Checks

Both content sites carry the same two gates. The example gate needs a Prismio compiler; the
compiler repository is a sibling checkout at `../prismio`, and its project host is the usual
choice:

```bash
cd apps/developers   # or apps/docs
PRISMIO=../../../prismio/.prismio/build/debug/prismio node scripts/verify-doc-examples.mjs
node scripts/audit-content.mjs
```

The audit checks frontmatter, internal links, acronym expansions, and two readability rules
from `DOC_STYLE.md`. Pages that do not yet meet those two are listed in each app's
`scripts/readability-baseline.json`. That list may only shrink: fix a page and remove its
entry (the audit fails if a listed page already passes), and never add one.

`pnpm --filter docs check` and `pnpm --filter developers check` run Velite, both gates, and
ESLint together.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. For the compiler,
runtime, and standard library, see the
[compiler repository](https://github.com/prismio-lang/prismio). Everyone taking part is
expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

To report a vulnerability, follow [SECURITY.md](SECURITY.md). Please do not open a public
issue for it.

## License

[Apache-2.0](LICENSE), the same license as Prismio itself.
