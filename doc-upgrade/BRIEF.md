# Brief: Prismio documentation readability upgrade (shared by every subagent)

You are rewriting a small, assigned set of documentation pages. One or two other
agents may be rewriting *other* pages in the same repository at the same time.

## Work economically

Token budget matters on this job. Read what the brief lists, verify the facts you
actually rewrite, capture the outputs you need, then **write each page as soon as
its material is ready** — do not research every page before writing the first.
Do not read whole large source files when `rg` finds the line.

## Locations

- Compiler repo (READ-ONLY for you): `/Users/vibrant/Desktop/Projects/Prismio/prismio`
- Website repo: `/Users/vibrant/Desktop/Projects/Prismio/website`
  - contributor site: `apps/developers/content/<slug>.md` (audience: people changing the compiler)
  - user site: `apps/docs/content/<slug>.md` (audience: people writing Prismio programs)
  - A slug `foo` may be `foo.md`, `foo.mdx`, or `foo/index.md`.
- Compiler to use for every command: `P=/Users/vibrant/Desktop/Projects/Prismio/prismio/.prismio/build/debug/prismio`
  (call it as `$P`, not bare `prismio`; `$P --version` prints `prismio 0.1.0 / llvm 23.1.1`).
- Your private scratch directory is given in your task. Create it with `mkdir -p` and put every test program there.
- The shell is zsh: quote globs (`rg -g '*.psm'`), and do not write `echo =====`.

## Read these first, in order

1. `/Users/vibrant/Desktop/Projects/Prismio/website/DOC_STYLE.md` — the rules. Follow them.
2. `apps/developers/content/testing/aif-differential.md` — an original worked example.
3. `apps/developers/content/runtime/overview.md` — rewritten in the target style; it shows how an existing dense page was converted without losing facts.
4. Your assigned pages, in full.

## What to do to each assigned page

The pages are accurate and dense but read like internal design notes. **Density is not the problem — keep every fact.** Add the on-ramp:

1. **Open with the problem** the subject solves, in plain words. The first prose paragraph must NOT start with a backticked identifier or path (the audit rejects `` `src/foo.psm` does… `` as an opening). A `## Heading` first is fine; the rule applies to the first prose paragraph.
2. **See it work**: at least one real command with its real, pasted output, or a `prismio` snippet. The audit only counts fences tagged exactly ```` ```bash ````, ```` ```prismio ```` or ```` ```text ````.
3. **Show what failure looks like** where the reader runs something: real error output and what to do about it.
4. **One traced worked example** where a good one exists.
5. **Internals last**, on developer pages under a heading that says so, e.g. `## If you are changing this` / `## If you are changing the …`. Source maps, function lists and call orders go there.

Also:
- **Headings name the reader's question**, not the mechanism ("How to debug a disagreement", not "Parsers and compared facts").
- **Expand acronyms on first use, per page.** Exact expansions (the audit enforces these): AIF = **Adaptive Inference Framework** (never "Allocation…"); UMS = **Unified Manifest System**. Also expand RC, IR, FFI, ABI, DWARF, JIT, LSP, etc. once per page.
- **Define a term before the paragraph that uses it**, or link to where it is defined.
- **State deliberate omissions** where coverage is partial.
- Do not pad, hedge, or add marketing tone. Keep sentences as tight as the originals.
- Keep British/American spelling consistent with the page you are editing.
- Frontmatter: keep `title`, `status`, `version`, `tags`, `related` (you may add valid related slugs). You may sharpen `description`. **Set `lastUpdated: "2026-09-17"`.**
- Internal links are `/slug` form, e.g. `[AIF overview](/aif/overview)`, and must point at pages that exist *in the same site* (the audit checks). The user site is `https://docs.prismio.org`.
- Do not use an H1 (`# `) in the body.
- `no-command: <specific reason>` in frontmatter is allowed ONLY for a page that genuinely cannot have anything runnable (e.g. a roadmap of work that does not exist). Prefer a real block. For a "coming soon" feature, the best block is usually the compiler **rejecting** it — real output — marked `<!-- prismio-check: fail -->`.

## Facts: verify, don't trust

The pages are mostly right but some facts are stale. Before keeping a specific claim you rewrite (a file path, function name, flag, count, output format), check it against the compiler tree (`rg`, `ls`). **If it is wrong, correct it and list the correction in your report.** If you cannot verify something and it is not obviously wrong, keep it. Known recent changes: function visibility now defaults to **private** (`public`/`private`/`internal`); `std.*` imports resolve to precompiled `.plib` files under the toolchain's `stdlib/`; the tools under `tools/` are mostly Python (`run_suite.py`, `aif_differential.py`, `release_gate.py`); `Int` is `i32`; out-of-range `list_get` returns a zero value (slices are bounds-checked); tasks and channels live in `runtime/program_support.c`.

The compiler repo has a knowledge graph: from the compiler repo you may run `graphify query "<question>"` (or `graphify explain "<concept>"`) to orient yourself before grepping. `rg` on exact text is fine after that. Top-level `RUNTIME.md`, `KNOWN_ISSUES.md`, `CHANGELOG.md`, `aif/evidence/RESULTS-*.md` and `git log` are good sources of truth.

## Real output only

- Every output block must be pasted from a command **you ran in this session**. Never write output from memory or "what it would print".
- You may trim: show an excerpt, or a `...` line where you cut; say "excerpt" if it is not obvious. Never edit the lines you do show, except:
  - replace `/Users/vibrant/Desktop/Projects/Prismio/prismio` with `~/prismio`, and your scratch path with a short relative path;
  - strip ANSI colour codes (`\x1b[..m`).
- A command too expensive or unsafe to run (see below): show the command in a ```` ```bash ```` block **without** output, or quote output that already exists verbatim in a committed file and name that file. Do not invent it.
- `prismio check` prints nothing on success; say so rather than showing an empty block.

## Snippet gate markers

Put `<!-- prismio-check: pass -->` on the line directly before a ```` ```prismio ```` fence that compiles on its own, and `<!-- prismio-check: fail -->` before one that must be rejected. The gate writes each marked snippet to a temp dir and runs `$P build snippet.psm -o snippet.ll`. **Test every snippet you mark exactly that way before marking it.** Do not mark a snippet that needs other files, and do not mark fragments.

Programs need `import std.io` for `println`; `import std.string` for String methods like `.concat()`. Lists: `let xs: List<Int> = list_new()`, `list_push(xs, 1)`, `list_get(xs, 0)`, `list_len(xs)`. The user site `apps/docs/content/language/*.md` and `stdlib/*.md` have many checked examples to copy idioms from.

## Safety rules — these are hard

NEVER, in either repo:
- edit, create or delete any file in the compiler repo;
- run project commands inside the compiler checkout: `prismio build`/`run`/`test`/`clean` **with no source file**, or `prismio init` there — they replace the compiler's project host;
- run `prismio bootstrap`, `tools/bootstrap.*`, `tools/refresh_seed.*`, `tools/release_gate.py`, `tools/install.py`, `tools/package.py`, `tools/ir_snapshot.py`, `benchmarks/run.py`, or `tools/run_suite.py` without `-k`;
- modify anything under the toolchain (`~/prismio/.prismio/build/...`) — to demonstrate a broken `.plib`, copy the whole toolchain layout to your scratch dir first and break the copy;
- run `git checkout`, `git restore`, `git reset`, `git stash`, `git clean`, `git commit` or `git add` in either repo;
- edit `apps/*/scripts/readability-baseline.json`, anything under `.velite/`, or any page not assigned to you (the lead agent updates the baseline);
- run `npm install` or start dev servers.

Allowed and useful:
- `$P check|dump-ast|aif|build|run <file.psm> ...` on programs in your scratch dir (`build x.psm -o x.ll` stops at IR; `--verify`, `-g`, `--jit`, `--target <triple>`, `--why=<id>`, `--summary`, `--manifest`, `--diagnostic-format=json`).
- `cd <compiler repo> && python3 tools/run_suite.py --no-interactive -k <fixture_stem>` for ONE or a few named fixtures (takes ~1 s; tests a copy of the compiler).
- `cd <compiler repo> && python3 tests/test_runner.py --list`.
- `cd <compiler repo> && python3 tools/aif_differential.py --compiler $P <one source file>`.
- `$P init demo` / project commands **inside your scratch dir** (not the compiler checkout).
- `rg`, `ls`, `nm`, `git log`, `git show`, `git diff` (read-only).
- Copying a fixture from `tests/` into your scratch dir to run it.

## Before you finish

From `apps/developers` or `apps/docs` (whichever site your pages are in):

```
PRISMIO=$P node scripts/verify-doc-examples.mjs
node scripts/audit-content.mjs
```

- verify-doc-examples must pass. If it fails on a page that is not yours, note it in your report and leave it.
- The audit will print `<slug>: fixed — remove it from readability-baseline.json …` for pages that now pass. **That line for each of your listed pages is the success signal.** Any *other* failure naming one of your pages must be fixed. Lines about other agents' pages: ignore.

## Report (your final message)

Keep it short, as a list per page:
- slug — what changed structurally (one line)
- facts corrected (old → new, with the evidence), or "none"
- commands whose output you pasted
- anything you could not verify, left out, or are unsure of
Finish with the last lines of both gate commands.
