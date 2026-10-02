# Contributing to the Prismio website

Thank you for helping. This repository holds the websites: the main site, the language
documentation, the contributor documentation, and the placeholder sites for the package
registry and the playground. For the compiler, runtime, and standard library, see the
[compiler repository](https://github.com/prismio-lang/prismio) and its
[CONTRIBUTING.md](https://github.com/prismio-lang/prismio/blob/main/CONTRIBUTING.md).

## What helps most

- **Fixing something that is wrong.** The sites describe a compiler that is still changing.
  A claim that no longer matches it, a broken example, or a dead link is worth a pull request
  on its own.
- **Improving the documentation.** Pages under `apps/docs/content` and
  `apps/developers/content`. Read [DOC_STYLE.md](DOC_STYLE.md) first.
- **Accessibility and readability** of the main site: contrast, keyboard use, small screens.

## Before you start

For anything bigger than a typo or a one-line fix, open an issue first so the approach can
be agreed before you write the code. Small fixes can go straight to a pull request.

## Setup

You need Node 24 or newer and pnpm.

```bash
git clone https://github.com/prismio-lang/website.git
cd website
pnpm install
pnpm --filter web dev        # the main site, http://localhost:3000
```

The README lists every app and its port. The docs and developers sites build their pages
from Markdown with Velite, so `pnpm --filter docs dev` starts both.

## Making a change

1. Create a branch from `main`.
2. Keep the change small and focused. One fix or one page per pull request.
3. Run the checks that apply:

   ```bash
   pnpm lint
   pnpm check-types
   pnpm --filter docs check          # if you touched apps/docs
   pnpm --filter developers check    # if you touched apps/developers
   ```

   The two content sites also have an example gate that builds every runnable `prismio`
   snippet. It needs a compiler; see "Checks" in the README.
4. Open a pull request against `main`.

### Accuracy rules

- **Check a claim against the compiler** before you write it, and say plainly when something
  is experimental or missing.
- **Paste real output.** Every command output on a documentation page comes from a real run.
- **Do not edit `apps/web/data/results.json` by hand.** It is produced by the benchmark
  harness; see "Benchmark data" in the README.
- **Do not hard-code numbers** that the data already provides, such as workload counts.

### Style

- Match the code around you: naming, comment density, and the existing components.
- Keep text readable: at least 12px, and enough contrast against the dark background.
- Every interactive element needs a visible keyboard focus state.
- Do not add dependencies without saying why in the pull request.

## Pull requests

- Describe what changed, why, and how you checked it.
- Link the issue it closes (`Closes #123`).
- Include a screenshot for any visible change.
- Respond to review comments with follow-up commits rather than force-pushing once review
  has started.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By taking part you agree to
uphold it.

## License

By contributing, you agree that your contribution is licensed under the
[Apache License 2.0](LICENSE), the same as the rest of the project.
