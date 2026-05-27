# Security Final Sweep - 2026-05-27

Last verified: 2026-05-27 17:08 Asia/Manila

Repository: `Iron-Mark/Hackathon-HireProof`

Verified commit: `86e8f190e0e3717cf7b8bb565d4566f34b0b855c`

## Summary

- Open pull requests: `0`
- Remote branches: `main` only
- Latest `main` GitHub Actions run: success
- Vercel deployment status for verified commit: success
- Dependabot open alerts: `0`
- Secret scanning open alerts: `0`
- Branch protection: enabled on `main`

## GitHub Security Settings

Checked with GitHub API:

- Secret scanning: enabled
- Secret scanning push protection: enabled
- Dependabot security updates: enabled
- Secret scanning non-provider patterns: disabled
- Secret scanning validity checks: disabled

Repository Actions settings:

- GitHub Actions: enabled
- Allowed actions: all
- Repository Actions secrets listed by current token: none
- Repository Actions variables listed by current token: none

## Branch Protection

Branch: `main`

- Protected: yes
- Required status checks: `lint-build-cursor-tests`
- Required status checks are strict: yes
- Require conversation resolution before merge: yes
- Force pushes allowed: no
- Branch deletion allowed: no
- Lock branch: no
- Required PR reviews: not configured
- Admin enforcement: not enabled
- Rulesets API result: no repository rulesets configured

Note: direct admin pushes can still bypass the required check because admin enforcement is not enabled. The required check does run and passed for the verified commit.

## Alert Status

Dependabot:

- Open alerts: `0`

Secret scanning:

- Open alerts before sweep: `1`
- Alert: `#1`, `github_app_installation_access_token`
- Location: historical `package.json` in commit `cdd3657165d15ed28a2e5baee5f9c33f00091fc5`
- Current `main`: token-bearing repository URL is no longer present
- Action taken: resolved alert `#1` as `revoked`
- Open alerts after sweep: `0`

Code scanning:

- API result: no analysis found
- Status: no code-scanning analysis is currently uploaded/configured for this repository

## Verification Commands

Commands run:

```powershell
gh repo view Iron-Mark/Hackathon-HireProof --json nameWithOwner,defaultBranchRef,isPrivate,visibility,pushedAt,url
gh api repos/Iron-Mark/Hackathon-HireProof/branches/main
gh api repos/Iron-Mark/Hackathon-HireProof/branches/main/protection
gh api repos/Iron-Mark/Hackathon-HireProof
gh api repos/Iron-Mark/Hackathon-HireProof/rulesets
gh api 'repos/Iron-Mark/Hackathon-HireProof/dependabot/alerts?state=open&per_page=100'
gh api 'repos/Iron-Mark/Hackathon-HireProof/secret-scanning/alerts?state=open&per_page=100'
gh api repos/Iron-Mark/Hackathon-HireProof/secret-scanning/alerts/1
gh api repos/Iron-Mark/Hackathon-HireProof/secret-scanning/alerts/1/locations
gh api -X PATCH repos/Iron-Mark/Hackathon-HireProof/secret-scanning/alerts/1 -f state=resolved -f resolution=revoked
gh api 'repos/Iron-Mark/Hackathon-HireProof/code-scanning/alerts?state=open&per_page=100'
gh secret list --repo Iron-Mark/Hackathon-HireProof
gh variable list --repo Iron-Mark/Hackathon-HireProof
gh api 'repos/Iron-Mark/Hackathon-HireProof/actions/runs?branch=main&per_page=1'
```

## Residual Recommendations

- Enable a CodeQL/code-scanning workflow if code-scanning status should be part of the release gate.
- Consider enabling required PR reviews and admin enforcement on `main` if all future changes should go through PRs.
- Consider narrowing GitHub Actions allowed actions from `all` to an allowlist if this repository needs stricter supply-chain controls.
