# Identity Guard

`identity-guard` (`.github/workflows/identity-guard.yml`) fails any pull
request whose commits carry a forbidden identity in the author, committer, or
a `Co-authored-by:`/`Signed-off-by:` trailer.

The forbidden pattern is **never stored in the repository**. It lives in the
`IDENTITY_GUARD_PATTERN` secret, and the workflow prints only the offending
commit SHA and field on a hit - the matched text itself never reaches the
(potentially public) logs.

## Why it exists

In July 2026 an unwanted account identity entered protected history in this
account's repos: PR branches carried commits made under the wrong identity,
and squash-merging folded that identity into the mainline as `Co-authored-by`
trailers. Removing it afterwards took a history rewrite and a force-push of
every affected branch. This check makes a repeat cost one red CI run instead.

## Setup (once per repo)

```sh
gh secret set IDENTITY_GUARD_PATTERN --body '<forbidden pattern>'
gh secret set IDENTITY_GUARD_PATTERN --app dependabot --body '<forbidden pattern>'
```

Both stores matter: workflow runs triggered by Dependabot only receive
Dependabot-store secrets, and Dependabot PR branches are exactly where the
July incident started. Without the secret the guard skips with a warning
rather than blocking every PR.

## If it fires red

1. Identify the offender locally (CI prints only the SHA):

   ```sh
   git show -s --format='%an <%ae>%n%cn <%ce>%n%B' <sha>
   ```

2. Fix the identity for future commits in this clone: set `user.email` to
   your GitHub noreply address (GitHub → Settings → Emails).

3. Rewrite the offending commits on your PR branch (message-only edit -
   file contents are untouched):

   ```sh
   git rebase -i <base>      # mark offending commits "reword" / "edit"
   # or, for the tip commit only:
   git commit --amend --reset-author
   git push --force-with-lease
   ```

   If the offender is a *trailer* rather than the author, delete the
   `Co-authored-by:` line while rewording.

The guard scans `merge-base(base, head)..head`, so commits already on the
base branch are never re-flagged.

## Local hook (optional, faster feedback)

```sh
cp hooks/commit-msg .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg
git config identity-guard.pattern '<forbidden pattern>'
```

Catches a bad identity or trailer at commit time. The pattern lives in your
local git config, never in the repo. The hook cannot see GitHub-side commits
(web UI edits, applied suggestions, API commits) - that is exactly the gap
the CI check covers.

## Root-cause hygiene

The July incident did not come from a repo's git config. It came from a
session authenticated as the wrong account. Before working on these repos:

```sh
gh auth status   # verify the active account is the intended one
gh auth switch --user <intended-account>   # if it is not
```
