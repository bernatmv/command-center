# Command Center

Tools for managing AI-built projects — keeping their roadmap, progress, and state visible at a glance.

The first tool here is a **prompt** you paste into Claude Code (or any capable coding agent) inside any repo. It inspects the project and builds a **Project Command Center**: a living, visual dashboard that tells any developer, product owner, client, or AI agent what the project _is_, what's _built_, what's _in progress_, and what's _next_ — without reading the whole codebase.

## 🚀 Live example

A static Command Center for a fictional AI product (**Forkcast**, an AI meal-planning copilot):

**▶ https://bernatmv.github.io/command-center/**

Source for it lives in [`example/`](./example/).

## What's in this repo

| Path | What it is |
|------|------------|
| [`claude_project_command_center_prompt.md`](./claude_project_command_center_prompt.md) | The prompt. Copy-paste into your project and the agent builds + maintains the dashboard. |
| [`example/`](./example/) | A fully worked, zero-dependency example dashboard (the live demo above). |
| [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) | Publishes `example/` to GitHub Pages. |

## How to use the prompt

1. Open your project in Claude Code.
2. Copy the contents of [`claude_project_command_center_prompt.md`](./claude_project_command_center_prompt.md) and paste it in.
3. The agent inspects your repo and builds a Command Center with:
   - **Project overview** — what it is, phase, target users, value prop
   - **Roadmap** — phases with status + progress
   - **Feature matrix** — features by area, status, priority, tests
   - **Current focus** — what to work on next, blockers
   - **Architecture map**, **PRD/specs tracker**, **decisions log**
   - **Risks & blockers**, **notes for AI agents**, **changelog**
4. It renders from a single structured data file, so updates are easy.
5. It also adds an instruction to your `CLAUDE.md`/`AGENTS.md` so future sessions keep the dashboard accurate.

The prompt adapts to your stack: if you have a web app, the dashboard becomes an internal route; if not, it produces the zero-build static page that the [`example/`](./example/) demonstrates.

## Deploying your own to GitHub Pages

The included workflow publishes the static `example/` folder. To publish it (or your own generated dashboard):

1. Push to `main`.
2. In your repo: **Settings → Pages → Source: GitHub Actions**.
3. The workflow deploys on every push that touches `example/`. The URL appears in the Actions run and under Settings → Pages.

To deploy a dashboard from a different folder, change the `path:` in [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml).

## Why

Projects built largely by AI lose state fast — context windows reset, decisions get forgotten, and "what's left?" becomes expensive to answer. A Command Center makes the current state a first-class, always-current artifact that both humans and future AI sessions can read in seconds.
