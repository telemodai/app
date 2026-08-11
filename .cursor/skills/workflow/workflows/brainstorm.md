# Brainstorm

Long-form idea exploration before concrete backlog or implementation. Not limited to greenfield — use whenever ideas need space before commitment.

## Entry

- User wants to explore, compare, or shape ideas
- Requirements are vague or contested
- Feature direction is undecided (new or existing project)

## Output

- Clarified problem, options, tradeoffs, recommendation
- Optional: approved design ready for [documentation](documentation.md) or [backlog](backlog.md)
- Ideas may be **dropped**, **deferred**, or **developed** — no obligation to file issues

## Does not

- Change code
- Create issues (unless user explicitly asks to hand off to backlog)
- Replace codebase research for "how does X work today?" — use [backlog](backlog.md) for that

## Process

1. **Orient** — [shared/orientation.md](../shared/orientation.md); skim existing docs and code if relevant.
2. **Clarify** — one focused question at a time; prefer multiple choice when useful.
3. **Propose 2–3 approaches** — tradeoffs + clear recommendation.
4. **Present design in sections** — get approval per section when the scope is large.
5. **Decide next step** — user chooses: stop, document, or file backlog issues.

## Design sections (scale to complexity)

- **Problem / solution** — short executive summary
- **Users & stories** — who, what, why
- **Acceptance criteria** — measurable where possible (avoid "fast", "intuitive")
- **Non-goals**
- **Technical approach** — architecture, risks
- **Phased rollout** — MVP vs later

## Principles

- One question at a time
- YAGNI — cut unnecessary scope
- Always show alternatives, not a single path
- Incremental validation — section by section for large designs

## Handoff

| User says | Go to |
|-----------|-------|
| Write/update PRD or `.docs/` | [documentation](documentation.md) |
| Create issues / add to backlog | [backlog](backlog.md) |
| Build it | [backlog](backlog.md) first if no issue exists, then [implementation](implementation.md) |
