---
name: workflow
description: Universal project workflows for software repos — brainstorm ideas, maintain docs, research and file backlog issues, implement with PR/MR. Works with GitHub and GitLab. Use when discussing features, exploring the codebase, creating or updating issues, writing documentation, or implementing tracked work.
---

# Project Workflow

A set of **independent workflows** for common project work. Pick the workflow that matches the user's request — there is no required order.

**User's explicit request always wins** over heuristics below.

## Platform

Detect from git remotes (`git remote -v`):

| Remote | CLI | Reference |
|--------|-----|-----------|
| `github.com` | `gh` | [platforms/github.md](platforms/github.md) |
| GitLab host | `glab` | [platforms/gitlab.md](platforms/gitlab.md) |

Read only the matching platform file before tracker or PR/MR commands. Discover flags via `<cli> <command> --help`.

## Shared references

| File | Use |
|------|-----|
| [shared/orientation.md](shared/orientation.md) | Read before any workflow |
| [shared/tracker-issues.md](shared/tracker-issues.md) | Create, edit, blockers, labels (backlog + implementation comments) |
| [shared/issue-template.md](shared/issue-template.md) | Issue body structure |

## Workflow router

| User signal | Workflow |
|-------------|----------|
| brainstorm, explore ideas, think through options, PRD-level discussion | [workflows/brainstorm.md](workflows/brainstorm.md) |
| update docs, README, `.docs/`, AGENTS.md | [workflows/documentation.md](workflows/documentation.md) |
| how does X work, problem, bug report, idea, tradeoffs, create/update issue, backlog, «answer only» | [workflows/backlog.md](workflows/backlog.md) |
| implement, fix, take issue #N, code changes, PR/MR | [workflows/implementation.md](workflows/implementation.md) |

If ambiguous, ask once which workflow fits.

## Optional sequences (not mandatory)

Common paths — user may skip or reorder freely:

```
brainstorm → documentation → backlog → implementation
brainstorm → backlog → implementation
backlog → implementation
```

Examples:
- New product idea: brainstorm → capture in docs → backlog issues → implement
- Existing repo: backlog (research + file issue) → implementation
- Docs-only request: documentation only

## Boundaries between workflows

| Workflow | Changes code? | Changes tracker? | Changes docs? |
|----------|---------------|------------------|---------------|
| brainstorm | No | No | No (may recommend) |
| documentation | No | No | Yes |
| backlog | No | Yes (when asked) | No |
| implementation | Yes | Comments / state only | Only if issue requires |

Backlog creation and issue grooming belong to **backlog**, not implementation.
