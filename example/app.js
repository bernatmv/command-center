/* Project Command Center — renderer. Turns COMMAND_CENTER_DATA into the page. */
(function () {
  const data = window.COMMAND_CENTER_DATA;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // ── 1. Hero ────────────────────────────────────────────
  function renderHero() {
    const o = data.projectOverview;
    document.title = `${o.name} · Command Center`;
    $("#brand-name").textContent = o.name;

    $("#hero").innerHTML = `
      <div class="hero-card">
        <div>
          <div>
            <span class="badge ${esc(o.status)}">
              <span class="sdot"></span>${esc(o.status.replace(/-/g, " "))}
            </span>
          </div>
          <h1>${esc(o.name)}</h1>
          <p class="desc">${esc(o.description)}</p>
          <div class="hero-meta">
            <span class="badge">🎯 ${esc(o.milestone)}</span>
            <span class="badge">Updated ${esc(o.lastUpdated)}</span>
          </div>
        </div>
        <div class="ring-wrap">
          <div class="ring" style="--p:${Number(o.progress) || 0}">
            <span class="num">${Number(o.progress) || 0}<small>%</small></span>
          </div>
          <span class="ring-label">overall progress</span>
        </div>
      </div>`;
  }

  // ── 2. Human Actions ───────────────────────────────────
  function renderHumanActions() {
    const actions = data.humanActions || [];
    const pending = actions.filter((a) => a.status !== "done");
    $("#human-count").textContent =
      pending.length ? `${pending.length} pending` : "all clear";

    if (!actions.length) {
      $("#human").innerHTML = `<div class="all-clear">✓ No human actions pending — all clear.</div>`;
      return;
    }

    const order = { critical: 0, high: 1, medium: 2 };
    const sorted = [...actions].sort(
      (a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
    );

    $("#human").innerHTML = `<div class="human-grid">${sorted
      .map(
        (a) => `
      <div class="ha-card ${esc(a.priority)} status-${esc(a.status)}">
        <div class="ha-head">
          <span class="sev ${esc(a.priority)}">${esc(a.priority)}</span>
          <h4>${esc(a.title)}</h4>
        </div>
        <p class="ha-desc">${esc(a.description)}</p>
        ${
          a.blocks?.length
            ? `<div class="ha-blocks">
                <span class="lbl">Blocks:</span>
                ${a.blocks.map((b) => `<span class="blocked-chip">${esc(b)}</span>`).join("")}
               </div>`
            : ""
        }
        <div class="ha-how"><b>→</b> ${esc(a.howTo)}</div>
        <div class="ha-footer">
          <span class="status-pill ${esc(a.status)}">${esc(a.status)}</span>
        </div>
      </div>`
      )
      .join("")}</div>`;
  }

  // ── 3. Now & Next ──────────────────────────────────────
  function renderNow() {
    const n = data.now;
    const inProgress = (n.inProgress || []).slice(0, 3);
    const nextSteps = (n.nextSteps || []).slice(0, 5);

    $("#now").innerHTML = `
      <div class="card now-grid">
        <div class="now-col">
          <h3>In progress</h3>
          <div class="inprogress-list">
            ${inProgress
              .map(
                (item) => `
              <div class="ip-item">
                <span class="ip-dot"></span>
                <span>${esc(item.title)}</span>
                <span class="owner ${esc((item.owner || "AI").toLowerCase())}">${esc(item.owner || "AI")}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="now-col">
          <h3>Up next</h3>
          <div class="steps-list">
            ${nextSteps
              .map(
                (s) => `
              <div class="step-row">
                <div class="step-num">${s.order}</div>
                <div class="step-body">
                  <div class="step-title">
                    <span>${esc(s.title)}</span>
                    <span class="owner ${esc((s.owner || "AI").toLowerCase())}">${esc(s.owner || "AI")}</span>
                    ${s.blockedBy ? `<span class="badge blocked" style="font-size:10px;padding:1px 6px">Blocked</span>` : ""}
                  </div>
                  ${s.unlocks ? `<div class="step-unlocks">${esc(s.unlocks)}</div>` : ""}
                  ${s.blockedBy ? `<div class="step-blocked">Waiting on human action: ${esc(s.blockedBy)}</div>` : ""}
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>`;
  }

  // ── 4. Roadmap stepper ─────────────────────────────────
  function renderRoadmap() {
    const phases = data.roadmap || [];
    $("#roadmap-count").textContent = `${phases.length} phases`;

    const icons = { done: "✓", blocked: "✕", "needs-review": "!" };

    $("#roadmap").innerHTML = `
      <div class="card roadmap-wrap">
        <div class="roadmap-strip">
          ${phases
            .map(
              (p) => `
            <div class="rm-phase ${esc(p.status)}">
              <div class="rm-node">
                <span class="rm-check">${esc(icons[p.status] || "")}</span>
              </div>
              <div class="rm-name">${esc(p.title)}</div>
              <div class="rm-pct">${p.progress}%</div>
            </div>`
            )
            .join("")}
        </div>
      </div>`;
  }

  // ── 5. Risks ───────────────────────────────────────────
  function renderRisks() {
    const all = data.risks || [];
    const order = { high: 0, medium: 1, low: 2 };
    const sorted = [...all].sort(
      (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
    );
    const shown = sorted.slice(0, 5);
    const extra = sorted.length - shown.length;

    $("#risks-count").textContent = `${all.length} open`;
    $("#risks").innerHTML = `
      <div class="card risks-list">
        ${shown
          .map(
            (r) => `
          <div class="risk-row">
            <span class="sev-tag ${esc(r.severity)}">${esc(r.severity)}</span>
            <span class="risk-title">${esc(r.title)}</span>
            <span class="risk-action">${esc(r.action)}</span>
          </div>`
          )
          .join("")}
        ${extra ? `<div class="risk-more">and ${extra} more risk${extra > 1 ? "s" : ""}</div>` : ""}
      </div>`;
  }

  // ── 6. Activity ────────────────────────────────────────
  function renderActivity() {
    const entries = (data.changelog || []).slice(0, 5);
    $("#activity").innerHTML = `
      <div class="card activity-list">
        ${entries
          .map(
            (e) => `
          <div class="act-row">
            <span class="act-date">${esc(e.date)}</span>
            <span class="act-type ${esc(e.type)}">${esc(e.type)}</span>
            <span class="act-title">${esc(e.title)}</span>
          </div>`
          )
          .join("")}
      </div>`;
  }

  // ── Render all ─────────────────────────────────────────
  function render() {
    if (!data) {
      document.body.innerHTML =
        '<p style="padding:40px;font-family:sans-serif">No COMMAND_CENTER_DATA found. Check that data.js loaded before app.js.</p>';
      return;
    }
    renderHero();
    renderHumanActions();
    renderNow();
    renderRoadmap();
    renderRisks();
    renderActivity();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
