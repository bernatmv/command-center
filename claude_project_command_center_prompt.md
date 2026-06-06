# Claude Prompt: Project Command Center

Copy and paste this prompt into Claude Code inside any project/repo.

> For a fully worked reference of what this produces, see the static example in
> [`example/`](./example/) (a Command Center for a fictional AI product).

---

You are working inside an existing software project/repository.

Your task is to create and maintain a **Project Command Center**: a beautiful, visual, always-updated web page that acts as the central dashboard for understanding the current state of this project.

The Command Center must give any developer, product owner, client, or AI agent an at-a-glance understanding of:

- What this project is
- What has already been built
- What is currently in progress
- What remains to be done
- What decisions have been made
- What blockers, risks, or open questions exist
- What PRDs, specs, issues, milestones, or implementation phases exist
- How far along the roadmap we are
- What the next best actions are

The Command Center should be treated as a living artifact that must be updated whenever the project evolves.

---

## Core goal

Create a visual web page inside this repo that acts as a command center for the project.

It should not be a boring markdown checklist.

It should feel like a modern product/project dashboard: aesthetic, visual, readable, and useful.

It should help both humans and AI agents quickly understand the current project state without needing to read the entire codebase.

---

## First, inspect the project

Before implementing anything, analyze the repository.

Look for:

- Existing framework: Next.js, React, Vite, Astro, Remix, plain HTML, etc.
- Existing styling system: Tailwind, CSS modules, styled-components, shadcn/ui, Radix, Chakra, etc.
- Existing routing structure
- Existing documentation
- README files
- PRDs
- specs
- tickets
- TODOs
- package scripts
- database/schema files
- roadmap documents
- changelogs
- issue templates
- architecture docs
- existing product copy
- environment examples
- tests
- deployment setup

Use the existing conventions of the repo. Do not introduce unnecessary dependencies unless clearly useful.

If the repo already has a web app, add the Command Center as an internal route.

Preferred routes:

- `/command-center`
- `/project-command-center`
- `/dashboard/project`

Choose the most natural route for the existing project.

If the repo does not have a web app, create the smallest reasonable static or lightweight app/page that can be opened locally.

For this static fallback, prefer a zero-build page: a single `index.html` plus a small renderer, where the data lives in a plain JS global (e.g. `data.js` setting `window.COMMAND_CENTER_DATA = {...}`) rather than a `fetch`-ed JSON file. This keeps the page working both when opened directly via `file://` and when served from a static host, with no build step and no local server.

---

## What to build

Create a visually rich Command Center page with the following sections.

You may adapt names and layout based on the project, but the information should be present.

---

## 1. Project Overview

Show a concise overview of the project.

Include:

- Project name
- One-line product description
- Current phase/status
- Target user/customer
- Main value proposition
- Last updated date
- Current version or milestone, if available

This should appear as a hero/header section.

Make it visually appealing, with status badges, progress indicators, and strong hierarchy.

---

## 2. Roadmap Progress

Create a visual roadmap showing the main phases of the project.

Example phases:

- Discovery
- PRD / Requirements
- Design
- Architecture
- MVP Build
- Core Features
- Integrations
- Testing
- Polish
- Launch
- Post-launch Improvements

Adapt these phases to the actual project.

Each roadmap item should include:

- Phase name
- Status: `done`, `in-progress`, `blocked`, `not-started`, or `needs-review`
- Short description
- Progress percentage
- Related files/docs/components, if known
- Key notes

This should be visual, not just text.

Good options:

- Horizontal roadmap timeline
- Vertical milestone timeline
- Kanban-style roadmap
- Progress bars
- Status cards
- Mermaid diagram
- SVG timeline
- Stepper component

Choose what fits the repo best.

---

## 3. Feature Matrix

Create a feature matrix showing the major product features.

For each feature, include:

- Feature name
- Description
- Status
- Priority: high / medium / low
- Owner: Human / AI / unknown, if applicable
- Related files
- Implementation notes
- Test status, if known
- Completion percentage

This should be easy to scan.

Use visual indicators:

- Colored badges
- Icons
- Progress bars
- Small status dots
- Grouping by product area

---

## 4. Current Sprint / Current Focus

Show what the project is currently focused on.

Include:

- Active milestone
- Current tasks
- In-progress work
- Next immediate actions
- Recently completed items
- Pending review items
- Known blockers

This section should make it obvious what Claude or another developer should work on next.

---

## 5. Architecture Map

Create a visual architecture overview.

Include:

- Main frontend structure
- Backend/API structure
- Database/storage
- Authentication
- External services
- Deployment
- Background jobs/workers
- AI/agent workflows, if relevant
- Key data flows

Prefer a visual diagram.

Use one of these depending on repo conventions:

- Mermaid diagram
- SVG diagram
- CSS-based node graph
- Card-based architecture map

If Mermaid is already supported, use Mermaid. Otherwise, create a visually styled static diagram with HTML/CSS/React components.

---

## 6. PRD / Specs Tracker

Create a section that tracks product requirements and specs.

Look for existing PRD/spec files in the repo.

If they exist, summarize them.

If they do not exist, create a starter structure.

Track:

- PRD name
- Status
- Related milestone
- Requirements covered
- Requirements still missing
- Open questions
- Linked files

This section should help ensure the implementation and the PRD stay aligned.

---

## 7. Decisions Log

Create a concise decision log.

Track important decisions such as:

- Technology choices
- Product scope decisions
- UX decisions
- API decisions
- Data model decisions
- Deployment decisions
- Trade-offs

Each decision should include:

- Date
- Decision
- Reason
- Impact
- Related files

If no decision log exists, create an initial one based on what can be inferred from the repo.

---

## 8. Risks, Blockers, and Open Questions

Create a highly visible section for:

- Risks
- Blockers
- Unknowns
- Pending product decisions
- Technical debt
- Security concerns
- Performance concerns
- Missing tests
- Missing environment variables
- Deployment risks

Each item should include:

- Type: risk / blocker / open-question / tech-debt
- Severity: high / medium / low
- Description
- Suggested next action
- Related files

---

## 9. Notes for AI Agents

Create a section specifically for future AI agents working on this repo.

Include:

- How to understand the project quickly
- Where important files live
- How to run the app
- How to run tests
- How to update the Command Center
- Project conventions
- Things not to break
- Known pitfalls
- Current next tasks

This is very important.

The Command Center should make future AI coding sessions faster and safer.

---

## 10. Activity / Changelog

Show a visual changelog of recent project progress.

Track:

- Date
- What changed
- Type: feature / bugfix / refactor / doc / decision / risk
- Related files
- Notes

If no changelog exists, create an initial one based on the changes you make now.

---

## 11. Human-Only Unblocking Actions

**This is one of the most important sections.**

Create a dedicated, highly visible section for actions that **only a human can perform** and that are currently blocking progress.

AI agents cannot complete these. They require a real person: a founder, a developer, a business contact, or a third party.

Examples of human-only actions:

- Approving or following up on a third-party API or partner application
- Setting up accounts, billing, or credentials (Stripe, AWS, App Store, etc.)
- Making a legal, compliance, or contractual decision
- Performing a manual process (DNS change, form submission, physical hardware setup)
- Acquiring a license, dataset, or asset
- Giving a go/no-go decision on product or architectural direction
- Reviewing and approving a security-sensitive implementation
- Contacting support, vendors, or legal counsel

For each action, include:

- Priority: `critical` / `high` / `medium`
- Title
- Description of what needs to be done and why
- What is currently blocked until this is resolved
- How to do it (where to go, who to contact, what to click)
- Assigned to (if known)
- Due by / urgency note
- Status: `pending` / `in-progress` / `done`

This section should be rendered at the top of the dashboard (or in a highly visible position) so the human reading it immediately knows what they need to act on personally.

Do not put things here that an AI agent could handle. Only include genuine human gates.

---

## 12. Recommended Next Steps

Create a clear, ordered list of the highest-priority next actions for the project.

This section exists so that anyone — a developer, a product owner, or an AI agent picking up the project fresh — immediately knows what to do next without reading everything else.

Each step should include:

- Order / priority rank
- Title
- Short description of what to do and why
- Owner: `Human` or `AI`
- Effort estimate: `small` / `medium` / `large`
- What this unlocks when done
- Whether it is blocked by a human action (reference the specific action from section 11)

Keep this list short: the top 5–8 actionable steps. Do not list aspirational items or far-future work here — only concrete near-term actions.

The first items on the list should be the things that, if done today, would unblock the most downstream work.

---

## Data source

The Command Center should be easy to maintain.

Create a structured data file that powers the page.

Prefer one of these depending on the repo:

- `src/data/commandCenter.ts`
- `src/lib/command-center.ts`
- `src/content/command-center.json`
- `docs/command-center.json`
- `app/command-center/data.ts`

Choose the path that best matches the project.

The data should include:

- `projectOverview`
- `roadmap`
- `features`
- `currentFocus`
- `architecture`
- `prdTracker`
- `decisions`
- `risks`
- `agentNotes`
- `changelog`
- `humanActions`
- `nextSteps`

The page should render from this structured data, not from hardcoded scattered text.

This makes it easy for future AI agents to update.

---

## Design requirements

The page must be visually strong and appealing.

It should feel like a premium internal product dashboard.

Use the repo’s existing design system if available.

Design direction:

- Clean modern dashboard
- Strong spacing and hierarchy
- Cards
- Badges
- Progress bars
- Timeline
- Visual roadmap
- Diagrams
- Charts or mini-metrics
- Subtle gradients if appropriate
- Responsive layout
- Good dark/light mode compatibility if the project supports it
- Easy to scan at a glance

Avoid:

- A plain markdown-looking page
- Huge walls of text
- Overly generic placeholder content
- Unstyled tables
- Adding unnecessary heavy chart libraries unless already present

If you need visual charts, prefer CSS, SVG, or lightweight existing components.

---

## Maintenance rules

Add explicit instructions to the repo so future Claude sessions know to keep this updated.

Create or update one of these files:

- `CLAUDE.md`
- `AGENTS.md`
- `README.md`
- `docs/COMMAND_CENTER.md`

Add a section saying:

### Project Command Center

This repository includes a living Project Command Center.

Whenever you make meaningful changes to the project, update the Command Center data and page.

Update it when you:

- Add or complete a feature
- Change roadmap status
- Implement part of a PRD
- Add a new PRD/spec
- Make an architectural decision
- Discover a blocker or risk
- Resolve a blocker
- Add important technical debt
- Change setup, deployment, or test instructions

The Command Center should always reflect the real current state of the repo.

Also include where the page lives and where the data file lives.

---

## Required implementation steps

1. Inspect the repo structure.
2. Identify the framework and styling approach.
3. Decide the best location for the Command Center route/page.
4. Create the structured command center data file.
5. Populate the data file based on the actual repo contents.
6. Create the visual Command Center page.
7. Add visual roadmap, feature matrix, architecture map, risks, decisions, PRD tracker, changelog, AI notes, human-only unblocking actions, and recommended next steps.
8. Add or update repo instructions so future AI agents maintain it.
9. Run lint/typecheck/build if available.
10. Fix any issues caused by the implementation.
11. Offer to make the Command Center shareable (see "Deployment & sharing").
12. Summarize what was created and where.

---

## Deployment & sharing

A Command Center is most useful when stakeholders can see it without checking out the repo.

After building it, offer to make it publicly viewable:

- If the static fallback page was used, it can be deployed to **GitHub Pages** with no build step — either by setting Pages to serve a folder (e.g. `/docs`), or by adding a small GitHub Actions workflow that publishes the page's folder.
- If the Command Center is a route inside an existing app, point out how it ships with the app's normal deployment (and note any auth that would gate it).

Do not push or enable anything externally without the user's go-ahead. Just propose the simplest path and let them confirm.

---

## Important behavior

Do not invent fake certainty.

If something is unknown, mark it as unknown.

Use labels like:

- `Unknown`
- `Needs discovery`
- `Needs product decision`
- `Needs technical review`
- `Not found in repo`

Do not pretend a feature is implemented unless the code/docs clearly show it.

When in doubt, create a “Needs verification” note.

---

## Completion criteria

The task is complete when:

- A Command Center web page exists and can be opened locally.
- The page is visual, aesthetic, and useful.
- The page is powered by structured data.
- The data reflects the current repo as accurately as possible.
- Future AI agents have written instructions to keep it updated.
- The command center includes roadmap, features, PRDs/specs, decisions, risks, architecture, current focus, changelog, AI notes, human-only unblocking actions, and recommended next steps.
- The implementation follows the repo’s existing conventions.
- The project still builds or runs successfully, if build scripts are available.

---

## Suggested content structure

Use this kind of data shape, adapted to the project and language/framework:

    export const commandCenterData = {
      projectOverview: {
        name: "",
        description: "",
        phase: "",
        status: "",
        targetUsers: "",
        valueProposition: "",
        lastUpdated: "",
        currentMilestone: "",
      },

      roadmap: [
        {
          id: "",
          title: "",
          description: "",
          status: "done | in-progress | blocked | not-started | needs-review",
          progress: 0,
          priority: "high | medium | low",
          relatedFiles: [],
          notes: [],
        },
      ],

      features: [
        {
          id: "",
          name: "",
          area: "",
          description: "",
          status: "done | in-progress | blocked | not-started | needs-review",
          priority: "high | medium | low",
          progress: 0,
          relatedFiles: [],
          testStatus: "covered | partial | missing | unknown",
          notes: [],
        },
      ],

      currentFocus: {
        activeMilestone: "",
        inProgress: [],
        nextActions: [],
        pendingReview: [],
        blockers: [],
      },

      architecture: {
        summary: "",
        components: [
          {
            name: "",
            type: "",
            description: "",
            relatedFiles: [],
          },
        ],
        dataFlows: [],
        externalServices: [],
      },

      prdTracker: [
        {
          id: "",
          title: "",
          status: "draft | approved | in-progress | implemented | needs-review | missing",
          summary: "",
          coveredRequirements: [],
          missingRequirements: [],
          openQuestions: [],
          relatedFiles: [],
        },
      ],

      decisions: [
        {
          date: "",
          title: "",
          decision: "",
          rationale: "",
          impact: "",
          relatedFiles: [],
        },
      ],

      risks: [
        {
          id: "",
          type: "risk | blocker | open-question | tech-debt",
          severity: "high | medium | low",
          title: "",
          description: "",
          suggestedAction: "",
          relatedFiles: [],
        },
      ],

      agentNotes: {
        quickStart: [],
        importantFiles: [],
        commands: [],
        conventions: [],
        pitfalls: [],
        nextRecommendedTasks: [],
      },

      changelog: [
        {
          date: "",
          type: "feature | bugfix | refactor | doc | decision | risk | setup",
          title: "",
          description: "",
          relatedFiles: [],
        },
      ],

      humanActions: [
        {
          id: "",
          priority: "critical | high | medium",
          title: "",
          description: "",
          blocks: [],
          howTo: "",
          assignedTo: "",
          dueBy: "",
          status: "pending | in-progress | done",
        },
      ],

      nextSteps: [
        {
          order: 1,
          title: "",
          description: "",
          owner: "Human | AI",
          effort: "small | medium | large",
          unlocks: "",
          blockedBy: "",
        },
      ],
    };

---

## Final response

After implementing, respond with:

- Where the Command Center page was added
- Where the data file lives
- What repo instruction file was updated
- What information was inferred
- What remains unknown
- Which command was run to validate the implementation

---

# Optional recurring instruction for CLAUDE.md

After the first implementation, add this shorter recurring instruction to your project’s `CLAUDE.md`.

## Always maintain the Project Command Center

This repo has a living Project Command Center.

Before finishing any meaningful task, check whether the Command Center needs to be updated.

Update it when:

- Roadmap progress changes
- A feature is added, changed, blocked, or completed
- A PRD/spec is created or implemented
- A technical/product decision is made
- A risk, blocker, or open question is discovered or resolved
- A human-only action is identified, updated, or resolved
- The recommended next steps change
- Setup, deployment, testing, or architecture changes
- Important notes for future AI agents are discovered

The Command Center must stay accurate. Do not leave it stale.
