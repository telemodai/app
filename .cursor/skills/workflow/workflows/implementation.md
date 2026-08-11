# Implementation

Pick an issue, branch, implement, test, open PR/MR. Issue filing belongs to [backlog](backlog.md).

## Entry

- User asks to implement, fix, or take issue `#N`
- Work from an existing open issue with closed blockers

## Platform

Read [platforms/github.md](../platforms/github.md) or [platforms/gitlab.md](../platforms/gitlab.md) for PR/MR, CI, merge, and issue comments.

Issue checklist / blockers: [shared/tracker-issues.md](../shared/tracker-issues.md).

## Role

- One issue per branch and per PR/MR
- Ask only **blocking** questions
- Brief issue comments at key stages
- Do not reorganize backlog or rewrite docs unless the issue requires it

## Follow-up on shipped work (reopen same issue)

When the user reports a **bug, regression, or fix** tied to work that was **merged and closed** (or clearly the same feature/PR):

1. **Identify the original issue** — explicit `#N`, user reference, or context (same feature area, same PR link).
2. **Reopen that issue** — do not open a duplicate for the same scope.
   - GitHub: `gh issue reopen N`
   - GitLab: `glab issue reopen N`
3. **New branch** from updated default branch — e.g. `issue/N-fix-short-slug` (not reuse the old merged branch).
4. **New PR/MR** — link to the reopened issue (`Closes #N` or reference in body). Comment on the issue: what broke, link to new PR/MR, link to prior merge if helpful.
5. **Scope creep** — if the follow-up is genuinely new feature work, confirm with user; may warrant a **new** issue instead.

Signals: "after #58", "the audit page still…", "regression from last merge", same component as a just-closed issue.

## Sequential execution (default)

```
issue #N → branch issue/N-slug → implement → test → PR/MR → merge & close → update default → (optional) next issue
```

| Rule | Requirement |
|------|-------------|
| One issue | One branch, one PR/MR (`Closes #N`) |
| Branch base | Updated default branch |
| Next issue | After #N merged/closed unless user overrides |
| Dependencies | No work on blocked issues |
| Cleanup | Delete merged feature branch local + remote |

## Execution modes

Ask once per session if not specified:

> **(A) Autonomous** — merge when CI passes, close issue, continue  
> **(B) Review-driven** — stop after PR/MR; user merges

| Signal | Mode |
|--------|------|
| auto-merge, merge yourself, continue | A |
| wait for review, don't merge | B |
| Unspecified | B (safer) |

## Workflow

```
Orient → Mode A/B? → Select issue → Branch → Implement → Verify → PR/MR → Mode gate
```

### Orient

1. [shared/orientation.md](../shared/orientation.md)
2. Read target issue + acceptance criteria
3. Verify blockers closed

### Select issue

**User gave #N:** use it; warn if blocked.

**Otherwise:** open issues in milestone → skip blocked → prefer critical priority → lowest number.

### Branch

Never commit implementation on default branch.

```bash
git fetch origin
git checkout main   # or master
git pull --ff-only
git checkout -b issue/N-short-slug
```

### Implement

- Match repo conventions
- Scope to issue only
- Tests with the change — same PR/MR

**Questions:** only blockers; post blocker on issue, not chat alone.

### Issue comments

| Stage | Comment |
|-------|---------|
| Branch created | Yes — plan |
| Blocked | Required |
| PR opened | Required — summary + link |
| Issue merged/closed | Required — see [Task completion](#task-completion) |

**PR opened template:**
```markdown
✅ **Ready for review**

**Branch:** `issue/N-slug`
**PR/MR:** #M or URL

- [criterion → what was done]
- Tests: [command] — pass
```

### Task completion

When an issue is finished — MR merged, user confirms merge, or asks to close:

1. Re-read the issue (`gh issue view N` / `glab issue view N`).
2. Tick all done checkboxes in the description (`- [ ]` → `- [x]` only for completed items).
3. Post a **closure comment** on the issue (chat alone is not enough).
4. Set board/labels to Done; remove in-progress labels.

**Closure comment:**
```markdown
✅ **Done**

**PR/MR:** #M or URL

- [criterion → delivered]
- Tests: [command] — pass
```

### Issue state during work

| Stage | Action |
|-------|--------|
| Work started | In Progress on board (if used) |
| Criterion done | Tick checkbox in issue body |
| PR opened | In Review if available |
| Merged/closed | Run task completion above |


Run documented tests; fix failures before PR.

### PR/MR body

```markdown
## Summary
[1–3 bullets]

## Issue
Closes #N

## Test plan
- [ ] [test command]
```

### After PR — mode gate

**A:** merge → verify issue closed → **task completion** → pull default → delete branch → next issue if asked.

**B:** notify user with link; wait for merge → **task completion** → pull default → delete branch.

### Verify

| Do | Don't |
|----|-------|
| Reopen + new PR for follow-up fixes on same scope | Duplicate issue for same shipped feature fix |
| One issue per PR/MR | Batch issues without user OK |
| Comment on issue at milestones | Verbose log every commit |
| Delete merged `issue/*` branches | Leave stale branches |
