# Tracker issues — shared reference

Single source for issue tracker operations in **backlog** and **implementation** workflows.

Platform CLI details: [platforms/github.md](../platforms/github.md) or [platforms/gitlab.md](../platforms/gitlab.md).

## Commands (discover flags via --help)

| Task | GitHub | GitLab |
|------|--------|--------|
| List | `gh issue list` | `glab issue list` |
| View | `gh issue view N` | `glab issue view N` |
| Create | `gh issue create` | `glab issue create` |
| Edit body | `gh issue edit N` | `glab issue update N` |
| Reopen | `gh issue reopen N` | `glab issue reopen N` |
| Close | `gh issue close N` | `glab issue close N` |

Use `--body-file` or heredoc for multi-line bodies.

## Every new issue

- [ ] Title — verb + scope
- [ ] Acceptance criteria — concrete checkboxes
- [ ] Milestone — if the repo uses them
- [ ] Labels — type, area, priority as appropriate
- [ ] **Depends on** — in body + native blocker links when order matters
- [ ] **Out of scope** — explicit boundaries

Body structure: [issue-template.md](issue-template.md).

## Decomposition

One issue ≈ one reviewable PR/MR (roughly 15–30 min review). Do not split into fragments that only make sense together.

Declare dependencies so agents skip blocked work. Document blockers in the body under **Depends on**.

### Blockers

- GitHub: see **Issue Dependencies** in [platforms/github.md](../platforms/github.md)
- GitLab: see **Issue Dependencies** in [platforms/gitlab.md](../platforms/gitlab.md)

## Create vs edit

| Situation | Action |
|-----------|--------|
| New approved work | Create issue |
| Refinement to scope, AC, UX | Edit same issue |
| Team policy changed | Search and edit affected issues; remove obsolete instructions |

## Stale issue cleanup

When project policy changes, grep open and closed issues for outdated guidance and update them. Remove wrong text; do not restate obvious defaults.

## During implementation

- Tick acceptance-criteria checkboxes in the issue body when done
- Brief comments at key stages (branch, blocked, PR opened)
- Sync labels / board status if the project uses them

Platform-specific checkbox edit and board moves: platform files above.

## Closing via PR/MR

PR/MR body: `Closes #N` (one issue per PR/MR unless user explicitly batches).
