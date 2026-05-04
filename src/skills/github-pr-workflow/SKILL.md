---
name: github-pr-workflow
description: >
  Manage the full GitHub PR lifecycle: branch, commit, open PR, monitor CI,
  auto-fix failures, review, checkpoint if risky, and merge.
keywords:
  - pull request
  - pr
  - branch
  - ci
  - merge
  - github
  - auto-fix
triggers:
  - open a pr
  - create a pr
  - make a pull request
  - fix ci failures
  - monitor ci
  - auto-fix
  - merge pr
  - review this pr
---

# GitHub PR Workflow

Full lifecycle: branch → commit → push → PR open → CI monitor → auto-fix loop → review → checkpoint → merge.

## Prerequisites

- Authenticated with GitHub (`gh auth status` must pass)
- Inside a git repo with a GitHub remote

## 1. Branch

```bash
git fetch origin
git checkout main && git pull origin main
git checkout -b feat/description   # or fix/, refactor/, docs/
```

Naming: `feat/`, `fix/`, `refactor/`, `docs/`, `ci/`, `test/`.

## 2. Make Changes & Commit

Use `write_file`/`patch` to edit files, then commit:

```bash
git add <files>
git commit -m "type: short description

Longer explanation if needed."
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`, `perf`.

## 3. Push & Open PR

```bash
git push -u origin HEAD
gh pr create \
  --title "feat: add feature name" \
  --body "## Summary
- Bullet points

## Test Plan
- [ ] Tests pass

Closes #N"
```

Options: `--draft`, `--reviewer user1,user2`, `--label "enhancement"`, `--base develop`.

## 4. Monitor CI

```bash
# Watch until complete
gh pr checks --watch
```

If `gh` is unavailable, poll via REST:

```bash
SHA=$(git rev-parse HEAD)
for i in $(seq 1 20); do
  STATUS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/commits/$SHA/status" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['state'])")
  echo "Check $i: $STATUS"
  [ "$STATUS" = "success" ] || [ "$STATUS" = "failure" ] || [ "$STATUS" = "error" ] && break
  sleep 30
done
```

## 5. Auto-Fix CI Failures

The auto-fix loop is the key differentiator. Run it when CI fails.

### Step 1: Diagnose

```bash
gh run list --branch $(git branch --show-current) --limit 5
gh run view <RUN_ID> --log-failed
```

### Step 2: Fix

Use `read_file` + `patch`/`write_file` to fix the issue, then:

```bash
git add <fixed_files>
git commit -m "fix: resolve CI failure in <check_name>"
git push
```

### Step 3: Re-check

Re-run `gh pr checks --watch`. Repeat up to 3 times. After 3 failed attempts, report to user.

### Auto-Fix Loop Pattern

```
1. gh pr checks --watch → identify failures
2. gh run view <RUN_ID> --log-failed → read failure logs
3. read_file + patch/write_file → fix the code
4. git add && git commit -m "fix: ..." && git push
5. gh pr checks --watch → re-verify
6. Repeat (max 3) → then escalate to user
```

## 6. Code Review

Before merging, review the changes using the `code-review` skill:

```bash
# Get the diff
gh pr diff > /tmp/pr.diff
# Or locally:
git diff main...HEAD
```

Then invoke the `code-review` skill to assess correctness, quality, security, and maintainability.

If findings are blocking, return to the auto-fix loop (Section 5) before proceeding.

## 7. Checkpoint (If Risky)

For high-risk changes (breaking API, DB migration, security-sensitive), use the `checkpoint` tool before merging:

```
checkpoint --title "Merge PR #N: <description>" --risk <level>
```

Only proceed to merge after the checkpoint is confirmed.

## 8. Merge

```bash
# Squash merge (cleanest for feature branches)
gh pr merge --squash --delete-branch

# Auto-merge (waits for all checks to pass)
gh pr merge --auto --squash --delete-branch
```

After merge, clean up locally:

```bash
git checkout main && git pull origin main
git branch -d <branch_name>
```

## Quick Reference

| Action | Command |
|--------|---------|
| List my PRs | `gh pr list --author @me` |
| View diff | `gh pr diff` |
| Add comment | `gh pr comment N --body "..."` |
| Request review | `gh pr edit N --add-reviewer user` |
| Close PR | `gh pr close N` |
| Checkout PR | `gh pr checkout N` |
