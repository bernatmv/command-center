# Claude Prompt: Project Command Center

Copy and paste this prompt into Claude Code inside any project/repo.

> Reference implementation: [`example/`](./example/)

---

You are working inside an existing software project/repository.

Your task is to create and maintain a **Project Command Center**: a focused, visual dashboard that gives any developer, product owner, or AI agent an immediate understanding of the project's current state.

One job: make it **immediately obvious** what the project is, what's blocked, and what happens next.

---

## First, inspect the project

Read the repository before implementing anything. Look for: framework, styling system, README, PRDs, TODOs, package scripts, roadmap documents, changelogs, deployment setup.

Use existing conventions. Do not introduce unnecessary dependencies.

**If the repo has a web app**, add the Command Center as an internal route (`/command-center`, `/project-status`, or similar).

**If it doesn't**, create a zero-build static page: `index.html` + `data.js` (sets `window.COMMAND_CENTER_DATA = {...}`) + `app.js`. This works via `file://` and any static host with no build step needed.

---

## What to build

**Six sections, in this order. Do not add more.**

---

### 1. Project Header

A compact hero row. Include:

- Project name (large)
- One-line description
- Status badge: `in-progress` / `blocked` / `launching` / `done`
- Overall progress ring or large percentage (≥100px ring diameter)
- Current milestone and last updated date

One screen row on desktop. Tight and scannable.

---

### 2. Human-Only Unblocking Actions

**Render this immediately after the header, before everything else.**

This section is for actions only a human can perform that are currently blocking progress. It must be visually dominant — a person opening the dashboard must immediately see what they need to do personally.

If there are none pending, show a green "All clear" state. Never hide the section.

Examples: third-party API approvals, legal decisions, account or billing setup, licenses, DNS changes, go/no-go product decisions.

**Visual rules (mandatory):**
- `critical` items: red border + red-tinted background
- `high` items: amber border
- `medium` items: blue border
- Each card shows: what it blocks, and one concrete "how to do it" step
- Resolved (`done`) items are dimmed but remain visible for reference

Data per item: `priority` · `title` · `description` · `blocks[]` · `howTo` · `status`

---

### 3. Now & Next

Two columns side by side:

**Left — In Progress** (max 3 items): what is actively being worked on right now.

**Right — Up Next** (max 5 items, ordered 1–5): the next actions in priority order.

Each "Up Next" item shows:
- Order number (large, visual)
- Owner badge: `Human` (amber) or `AI` (green)
- Title
- One-line "unlocks" statement
- If blocked by a human action: show a red "Blocked" indicator referencing the action

Data:
- `inProgress`: `[{ title, owner }]`
- `nextSteps`: `[{ order, owner, title, unlocks, blockedBy? }]`

---

### 4. Roadmap

A **horizontal stepper strip** — not cards, not a vertical list, not a table.

Render phase nodes on a horizontal track connected by a line. Each node:
- Circle coloured by status: green (done), blue/pulse (in-progress), red (blocked), grey (not started), amber (needs review)
- Phase name directly below
- Progress % below the name

That is all. No descriptions, no file lists, no notes. The strip must be understood in 3 seconds.

Make it horizontally scrollable on mobile if there are many phases.

Data per item: `{ title, status, progress }`

---

### 5. Risks & Blockers

Top 5 items maximum, sorted high → medium → low. One row per risk:

```
[HIGH]  Title of the risk  →  Suggested action
```

If there are more than 5 risks, show a muted "and N more" line at the bottom. No cards, no descriptions. Brevity is mandatory.

Data per item: `{ severity, title, action }`

---

### 6. Activity

Last 5 changelog entries. One line each:

```
2026-06-06  [feature]  Short title of what changed
```

No descriptions, no file lists. A compact strip.

Data per item: `{ date, type, title }`

---

## Data shape

Use this shape exactly, adapted to the project's language and file conventions:

```js
// data.js  (or commandCenter.ts / command-center.json)
window.COMMAND_CENTER_DATA = {
  projectOverview: {
    name: "",
    description: "",
    status: "in-progress | blocked | launching | done",
    progress: 0,
    milestone: "",
    lastUpdated: "",
  },

  humanActions: [
    {
      id: "",
      priority: "critical | high | medium",
      title: "",
      description: "",
      blocks: [],
      howTo: "",
      status: "pending | in-progress | done",
    },
  ],

  now: {
    inProgress: [
      { title: "", owner: "Human | AI" },
    ],
    nextSteps: [
      {
        order: 1,
        owner: "Human | AI",
        title: "",
        unlocks: "",
        blockedBy: "",
      },
    ],
  },

  roadmap: [
    {
      title: "",
      status: "done | in-progress | blocked | not-started | needs-review",
      progress: 0,
    },
  ],

  risks: [
    {
      severity: "high | medium | low",
      title: "",
      action: "",
    },
  ],

  changelog: [
    {
      date: "",
      type: "feature | fix | decision | risk | setup | doc",
      title: "",
    },
  ],
};
```

---

## Visual requirements

The page must feel like a **focused operations dashboard**, not a documentation page.

**Mandatory:**
- Human Actions section is visually dominant — high contrast, coloured borders, cannot be missed
- Roadmap is a horizontal node strip — not vertical, not cards
- Each section enforces a strict text budget: roadmap nodes show only name + %; risk rows show only severity + title + action; activity rows show only date + type + title
- Progress ring on the header (≥100px diameter)
- Responsive — stack sections to single column on mobile; roadmap scrolls horizontally

**Avoid:**
- Stacked text cards as the primary layout for the roadmap or risks
- More than 2 visible lines of text per item in any section
- Equal visual weight across all sections — use size, colour, and contrast to create hierarchy

---

## Maintenance rules

Add this to `CLAUDE.md` or `AGENTS.md`:

```
## Project Command Center

Living dashboard at: [route or file path]
Data file: [data file path]

Update it when:
- A human action is added, changed, or resolved
- A roadmap phase changes status or progress %
- A risk is discovered or resolved
- Next steps change
- A notable change is made (add to changelog, last 5 only)

Keep it accurate. Keep entries brief.
```

---

## Required steps

1. Inspect the repo structure and conventions.
2. Choose route (web app) or static file (no web app).
3. Create the data file and populate it from what you find.
4. Build the six-section visual page.
5. Add maintenance instructions to `CLAUDE.md` / `AGENTS.md`.
6. Run build/lint if available and fix any issues.
7. Offer to deploy to GitHub Pages if a static page was used.
8. Summarize: page location, data file location, what was inferred, what is unknown.

---

## Important

Do not invent certainty. If something is unknown, write `"Unknown"` or mark status as `needs-review`. Do not pretend a feature is done unless the code clearly shows it.

The task is complete when the dashboard opens, the six sections render visually, and someone can understand the project's current status in under 10 seconds.

---

# Recurring instruction (add to CLAUDE.md after first build)

## Always maintain the Project Command Center

Before finishing any meaningful task, update the Command Center data file.

Update when: a human action changes, roadmap progress changes, a risk is added or resolved, next steps change, or a notable change happened (add to changelog).

The Command Center must stay accurate. Keep entries brief.
