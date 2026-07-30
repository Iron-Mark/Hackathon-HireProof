# Identity Guard

`identity-guard` (`.github/workflows/identity-guard.yml`) fails any pull
request into `main` or `dev` whose commits carry the work-account identity
(`trampettimg`, case-insensitive) in the author, committer, or a
`Co-authored-by:`/`Signed-off-by:` trailer.

## Why it exists

On 2026-07-27, the branch commits behind PRs #76, #78, #84, and #85 were
authored as `Mark.Siazon@trampettimg.com` (a GitHub-side session was on the
work account). Squash-merging folded that identity into `main`/`dev` as
`Co-authored-by` trailers — removing it afterwards took a history rewrite and
a force-push of every branch (2026-07-30). This check makes the mistake cost
one red CI run instead.

## If it fires red

1. Fix the identity for future commits in this clone:

   ```sh
   git config user.email 67873853+Iron-Mark@users.noreply.github.com
   git config user.name "Mark Siazon"
   ```

2. Rewrite the offending commits on your PR branch (message-only edit —
   file contents are untouched):

   ```sh
   git rebase -i origin/dev   # mark offending commits "reword" / "edit"
   # or, for a trailer in the tip commit only:
   git commit --amend --reset-author
   git push --force-with-lease
   ```

3. If the offender is a *trailer* rather than the author, delete the
   `Co-authored-by:` line while rewording.

The guard scans `merge-base(base, head)..head`, so commits already on the
base branch are never re-flagged.

## Local hook (optional, faster feedback)

```sh
cp hooks/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
```

Catches a bad identity or trailer at commit time. It cannot see GitHub-side
commits (web UI edits, applied suggestions, API commits) — that is exactly
the gap the CI check covers.

## Root-cause hygiene

The leak did not come from this repo's git config. It came from a session
authenticated as the work account. Before working on personal repos:

```sh
gh auth switch --user Iron-Mark
gh auth status   # active account must be Iron-Mark
```
