# Example: Forkcast Command Center

A live, self-contained example of the **[Project Command Center](../claude_project_command_center_prompt.md)** — the dashboard Claude builds when you paste the prompt into a repo.

It depicts a fictional AI product, **Forkcast** (an AI meal-planning copilot), mid-MVP, so every section has realistic content: roadmap, feature matrix, current focus, architecture map, PRD tracker, decisions log, risks/blockers, AI-agent notes, and a changelog.

## View it

**Live demo:** published via GitHub Pages — see the link in the repo's [README](../README.md).

**Locally** — it's plain HTML/CSS/JS with no build step:

```bash
# from this folder, any static server works:
python -m http.server 8000
# then open http://localhost:8000
```

> Opening `index.html` directly via `file://` also works in most browsers, since the
> data lives in `data.js` (a global) rather than a `fetch`-ed JSON file.

## How it works

| File | Role |
|------|------|
| `data.js` | The single source of truth — `window.COMMAND_CENTER_DATA = { … }`. **Edit this to update the dashboard.** |
| `app.js` | Tiny vanilla renderer that turns the data into DOM. No framework. |
| `index.html` | Page shell + section anchors. |
| `styles.css` | Premium dark dashboard styling (auto light mode via `prefers-color-scheme`). No dependencies. |

The page renders entirely from `data.js`. To change what's shown, edit the data — never hand-edit the rendered markup.

## Using this as a starting point

For a real project, the prompt usually adapts the Command Center to your existing framework and design system. This static version is the zero-dependency fallback the prompt produces for repos with no web app — and it's the easiest thing to deploy to GitHub Pages.
