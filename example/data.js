/**
 * Project Command Center — data source.
 *
 * Edit THIS file to update the dashboard. The page renders entirely from it.
 * It's a plain JS global so it works via file:// and static hosts with no build step.
 *
 * Example data for fictional product "Forkcast" — replace with your project's data.
 */
window.COMMAND_CENTER_DATA = {
  projectOverview: {
    name: "Forkcast",
    description: "AI meal-planning copilot — pantry + diet + budget → a week of recipes + a one-tap grocery order.",
    status: "in-progress",
    progress: 62,
    milestone: "M3 — Closed Beta",
    lastUpdated: "2026-06-13",
  },

  humanActions: [
    {
      id: "ha1",
      priority: "critical",
      title: "License a verified allergen-ingredient database",
      description: "Safety guardrails rely on a manually curated list. A licensed dataset is required before any public launch.",
      blocks: ["Public launch", "Allergen test suite", "Legal sign-off"],
      howTo: "Evaluate Edamam Food API (edamam.com) or Spoonacular (spoonacular.com/food-api). Request pricing, sign up, and paste API keys into .env.",
      status: "pending",
    },
    {
      id: "ha2",
      priority: "critical",
      title: "Follow up on Instacart partner API application",
      description: "Submitted 2026-05-02, no response in 6 weeks. One-tap checkout is fully blocked.",
      blocks: ["One-tap checkout", "Grocery integrations roadmap phase"],
      howTo: "Email partnerships@instacart.com with your application ID. Simultaneously start the Amazon Fresh Partner API application at developer.amazon.com.",
      status: "pending",
    },
    {
      id: "ha3",
      priority: "high",
      title: "Legal review — allergen safety claims and ToS",
      description: "A food-tech lawyer needs to review the allergen approach, any in-app safety claims, and the Terms of Service before public launch.",
      blocks: ["Public launch", "Marketing site copy", "App Store submission"],
      howTo: "Engage a food-tech lawyer via Clerky or a local firm. Share the allergen filtering code, the safety PRD, and the draft ToS.",
      status: "pending",
    },
    {
      id: "ha4",
      priority: "high",
      title: "Set up Stripe account and configure products",
      description: "No Stripe account exists yet. Billing work cannot start without it.",
      blocks: ["Monetization sprint", "Subscription billing feature"],
      howTo: "Create a Stripe account at stripe.com. Add a Product 'Forkcast Pro' with monthly ($9.99) and annual ($89) prices. Copy keys to .env.",
      status: "pending",
    },
  ],

  now: {
    inProgress: [
      { title: "Pantry barcode scanning", owner: "AI" },
      { title: "Budget estimator accuracy pass", owner: "AI" },
      { title: "Beta onboarding flow polish", owner: "Human" },
    ],
    nextSteps: [
      { order: 1, owner: "AI",    title: "Write allergen-safety test suite",              unlocks: "Public launch confidence + legal sign-off",        blockedBy: "ha1" },
      { order: 2, owner: "Human", title: "Follow up on Instacart / start Amazon Fresh",   unlocks: "One-tap checkout, grocery integration phase",       blockedBy: "" },
      { order: 3, owner: "AI",    title: "Build CSV / print grocery list fallback",        unlocks: "Grocery value for beta users now",                  blockedBy: "" },
      { order: 4, owner: "Human", title: "License allergen-ingredient database",           unlocks: "Allergen tests, legal review, public launch",       blockedBy: "" },
      { order: 5, owner: "AI",    title: "Add pantry tests before barcode scanning lands", unlocks: "Safe to ship barcode scanning, closes tech debt",   blockedBy: "" },
    ],
  },

  roadmap: [
    { title: "Discovery",       status: "done",        progress: 100 },
    { title: "PRD",             status: "done",        progress: 100 },
    { title: "Design",          status: "done",        progress: 100 },
    { title: "Architecture",    status: "done",        progress: 100 },
    { title: "MVP Build",       status: "in-progress", progress: 65  },
    { title: "Integrations",    status: "blocked",     progress: 20  },
    { title: "Closed Beta",     status: "in-progress", progress: 30  },
    { title: "Testing",         status: "needs-review",progress: 25  },
    { title: "Launch",          status: "not-started", progress: 0   },
  ],

  risks: [
    { severity: "high",   title: "Allergen filtering has no dedicated test suite",      action: "Build test suite with adversarial cases before launch" },
    { severity: "high",   title: "Instacart API approval stalled for 6 weeks",         action: "Follow up + start Amazon Fresh application in parallel" },
    { severity: "medium", title: "Pantry feature shipped with zero test coverage",      action: "Add unit + integration tests before barcode scanning" },
    { severity: "medium", title: "Budget estimates are US-only",                        action: "Decide: source international data or geo-gate the feature" },
    { severity: "low",    title: "Magic-link auth creates email deliverability risk",   action: "Monitor bounce rates; keep backup provider configured" },
  ],

  changelog: [
    { date: "2026-06-13", type: "doc",     title: "Command Center redesigned — simplified to 6 sections" },
    { date: "2026-06-04", type: "feature", title: "Smart grocery list shipped (aisle-grouped, de-duplicated)" },
    { date: "2026-05-28", type: "feature", title: "Pantry manual entry live" },
    { date: "2026-05-15", type: "decision",title: "Allergen filtering declared a hard safety boundary" },
    { date: "2026-05-02", type: "risk",    title: "Instacart API delay flagged as a blocker" },
  ],
};
