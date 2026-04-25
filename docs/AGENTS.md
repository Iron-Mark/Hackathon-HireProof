# Repository Guidelines

## Project Structure & Module Organization

This repository is a document-focused workspace for the Zero to Agent hackathon strategy.

- `deep-research-report-01.md` and `deep-research-report-02.md` contain primary research and recommendations.
- `Contrarian Winning Strategy for Zero to Agent-02.pdf` is a supporting exported report.
- `.vscode/settings.json` contains editor visibility preferences only.

Keep new written material at the repository root unless it belongs in a clearly named subfolder such as `assets/`, `exports/`, or `notes/`. Use lowercase hyphenated filenames for new Markdown files, for example `submission-plan.md`.

## Build, Test, and Development Commands

There is no application build pipeline or package manager config yet.

- `rg --files` lists tracked workspace files quickly.
- `Get-Content -Path .\deep-research-report-01.md -TotalCount 80` previews a report.
- `git status` checks repository state if Git is initialized later.

If code is added, document exact install, run, lint, and test commands here.

## Coding Style & Naming Conventions

For Markdown, use `#` headings in sentence or title case, short paragraphs, and bullet lists for scanability. Keep tables only when they improve comparison. Prefer ASCII punctuation unless quoting existing material that already uses special characters.

For future code, follow the conventions of the framework introduced. Avoid broad formatting changes to research documents unless the task is editorial.

## Testing Guidelines

No automated tests are configured. For documentation changes, verify:

- Markdown headings render in a logical hierarchy.
- Links and citations remain intact.
- Tables stay readable in a standard Markdown preview.

If an app is added, place tests beside source files or in `tests/`, and add the test command here.

## Commit & Pull Request Guidelines

This workspace does not expose Git history, so no existing commit convention can be inferred. Use Conventional Commit prefixes:

- `feat`: user-visible behavior or capability.
- `fix`: bug or regression correction.
- `chore`: maintenance, tooling, refactor, or docs-only work.

Do not run `git commit` or `git push` unless explicitly asked. The checkpoint trigger phrase is `create checkpoint commit`. Pull requests should include a summary, changed files or sections, reviewer notes, and screenshots only when UI or rendered output changes.

## Agent-Specific Instructions

Preserve user-authored research content. Do not rewrite conclusions, citations, or strategic recommendations unless requested. Make narrowly scoped edits and call out assumptions caused by missing build, test, or Git metadata.
