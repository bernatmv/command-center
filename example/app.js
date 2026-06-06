/* Project Command Center — renderer. Turns COMMAND_CENTER_DATA into the page. */
(function () {
  const data = window.COMMAND_CENTER_DATA;
  const $ = (sel) => document.querySelector(sel);

  // --- helpers ---
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const label = (s) => esc(String(s).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  const badge = (status) =>
    `<span class="badge ${esc(status)}"><span class="sdot"></span>${label(status)}</span>`;

  const files = (arr) =>
    arr && arr.length
      ? `<div class="files">${arr.map((f) => `<span class="tag">${esc(f)}</span>`).join("")}</div>`
      : "";

  const notes = (arr) =>
    arr && arr.length
      ? `<ul class="notes">${arr.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
      : "";

  const bar = (pct, status) =>
    `<div class="bar ${esc(status || "")}"><span style="width:${Number(pct) || 0}%"></span></div>`;

  const liList = (arr) =>
    `<ul>${(arr || []).map((x) => `<li>${esc(x)}</li>`).join("") || '<li class="pill">none</li>'}</ul>`;

  // --- overview / hero ---
  function renderHero() {
    const o = data.projectOverview;
    const roadmapAvg = Math.round(
      (data.roadmap.reduce((s, r) => s + (Number(r.progress) || 0), 0) / data.roadmap.length) || 0
    );
    document.title = `${o.name} · Command Center`;
    $("#brand-name").textContent = o.name;
    $("#hero").innerHTML = `
      <div class="hero-card">
        <div>
          <div class="hero-badges">
            ${badge(o.status)}
            <span class="badge">Phase: ${esc(o.phase)}</span>
            ${o.currentMilestone ? `<span class="badge">${esc(o.currentMilestone)}</span>` : ""}
            ${o.version ? `<span class="badge">v${esc(o.version)}</span>` : ""}
          </div>
          <h1>${esc(o.name)}</h1>
          <p class="desc">${esc(o.description)}</p>
          <div class="meta">
            <div><div class="k">Value</div><div class="v">${esc(o.valueProposition)}</div></div>
          </div>
          <div class="meta">
            <div><div class="k">Target users</div><div class="v">${esc(o.targetUsers)}</div></div>
            <div><div class="k">Last updated</div><div class="v">${esc(o.lastUpdated)}</div></div>
          </div>
        </div>
        <div class="ring-wrap">
          <div class="ring" style="--p:${roadmapAvg}">
            <div class="ring-num">${roadmapAvg}<small>%</small></div>
          </div>
          <div class="ring-label">overall roadmap progress</div>
        </div>
      </div>`;
  }

  // --- roadmap ---
  function renderRoadmap() {
    $("#roadmap-count").textContent = `${data.roadmap.length} phases`;
    $("#roadmap").innerHTML = `<div class="timeline">${data.roadmap
      .map(
        (r) => `
      <div class="tl-item ${esc(r.status)}">
        <div class="card">
          <div class="tl-head">
            <h3>${esc(r.title)}</h3>
            ${badge(r.status)}
            ${r.priority ? `<span class="prio ${esc(r.priority)}">${esc(r.priority)}</span>` : ""}
          </div>
          <p class="tl-desc">${esc(r.description)}</p>
          <div class="tl-foot">${bar(r.progress, r.status)}<span class="pct">${r.progress}%</span></div>
          ${notes(r.notes)}
          ${files(r.relatedFiles)}
        </div>
      </div>`
      )
      .join("")}</div>`;
  }

  // --- features (grouped by area) ---
  function renderFeatures() {
    const areas = {};
    data.features.forEach((f) => {
      (areas[f.area] = areas[f.area] || []).push(f);
    });
    $("#features-count").textContent = `${data.features.length} features`;
    $("#features").innerHTML = Object.entries(areas)
      .map(
        ([area, items]) => `
      <div class="feat-area">
        <h3>${esc(area)}</h3>
        <div class="grid cols-2">
          ${items
            .map(
              (f) => `
            <div class="card feat-card">
              <div class="top">
                <h4>${esc(f.name)}</h4>
                ${badge(f.status)}
              </div>
              <div class="fdesc">${esc(f.description)}</div>
              ${bar(f.progress, f.status)}
              <div class="feat-meta">
                <span class="pct">${f.progress}%</span>
                ${f.priority ? `<span class="prio ${esc(f.priority)}">${esc(f.priority)}</span>` : ""}
                ${f.owner ? `<span>owner: ${esc(f.owner)}</span>` : ""}
                ${f.testStatus ? `<span>tests: ${esc(f.testStatus)}</span>` : ""}
              </div>
              ${notes(f.notes)}
              ${files(f.relatedFiles)}
            </div>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("");
  }

  // --- current focus ---
  function renderFocus() {
    const c = data.currentFocus;
    $("#focus").innerHTML = `
      <div class="card">
        <div class="list-block" style="margin-bottom:14px;">
          <h4>Active milestone <span class="pill">${esc(c.activeMilestone)}</span></h4>
        </div>
        <div class="focus-grid">
          <div class="list-block next"><h4>Next actions</h4>${liList(c.nextActions)}</div>
          <div class="list-block"><h4>In progress</h4>${liList(c.inProgress)}</div>
          <div class="list-block"><h4>Pending review</h4>${liList(c.pendingReview)}</div>
          <div class="list-block blockers"><h4>Blockers</h4>${liList(c.blockers)}</div>
        </div>
      </div>`;
  }

  // --- architecture ---
  function renderArchitecture() {
    const a = data.architecture;
    $("#architecture").innerHTML = `
      <div class="card">
        <p class="arch-summary">${esc(a.summary)}</p>
        <div class="arch-grid">
          ${a.components
            .map(
              (n) => `
            <div class="node ${esc(n.type)}">
              <div class="ntype">${esc(n.type)}</div>
              <h4>${esc(n.name)}</h4>
              <p>${esc(n.description)}</p>
            </div>`
            )
            .join("")}
        </div>
        ${
          a.dataFlows && a.dataFlows.length
            ? `<div class="flows">${a.dataFlows
                .map(
                  (f) =>
                    `<div class="flow">${f
                      .split("→")
                      .map((p) => esc(p.trim()))
                      .join(' <span class="farrow">→</span> ')}</div>`
                )
                .join("")}</div>`
            : ""
        }
        ${
          a.externalServices && a.externalServices.length
            ? `<div class="chips">${a.externalServices
                .map((s) => `<span class="badge">${esc(s)}</span>`)
                .join("")}</div>`
            : ""
        }
      </div>`;
  }

  // --- PRD tracker ---
  function renderPrd() {
    $("#prd-count").textContent = `${data.prdTracker.length} specs`;
    $("#prd").innerHTML = `<div class="grid">${data.prdTracker
      .map(
        (p) => `
      <div class="card prd-card">
        <div class="tl-head">
          <h4>${esc(p.title)}</h4>
          ${badge(p.status)}
        </div>
        <p class="tl-desc">${esc(p.summary)}</p>
        <div class="prd-reqs">
          <div class="col"><h5>Covered</h5>${notes(p.coveredRequirements)}</div>
          <div class="col"><h5>Missing</h5>${notes(p.missingRequirements)}</div>
        </div>
        ${p.openQuestions && p.openQuestions.length ? `<div class="col" style="margin-top:10px;"><h5>Open questions</h5>${notes(p.openQuestions)}</div>` : ""}
        ${files(p.relatedFiles)}
      </div>`
      )
      .join("")}</div>`;
  }

  // --- decisions ---
  function renderDecisions() {
    $("#decisions-count").textContent = `${data.decisions.length} logged`;
    $("#decisions").innerHTML = `<div class="grid cols-2">${data.decisions
      .map(
        (d) => `
      <div class="card dec-card">
        <span class="date">${esc(d.date)}</span>
        <h4>${esc(d.title)}</h4>
        <div class="row"><b>Decision</b><span>${esc(d.decision)}</span></div>
        <div class="row"><b>Why</b><span>${esc(d.rationale)}</span></div>
        <div class="row"><b>Impact</b><span>${esc(d.impact)}</span></div>
        ${files(d.relatedFiles)}
      </div>`
      )
      .join("")}</div>`;
  }

  // --- risks ---
  function renderRisks() {
    const order = { high: 0, medium: 1, low: 2 };
    const sorted = [...data.risks].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
    $("#risks-count").textContent = `${data.risks.length} open`;
    $("#risks").innerHTML = `<div class="grid cols-2">${sorted
      .map(
        (r) => `
      <div class="card risk-card ${esc(r.severity)}">
        <div class="rhead">
          <span class="sev ${esc(r.severity)}">${esc(r.severity)}</span>
          <span class="badge">${label(r.type)}</span>
          <h4>${esc(r.title)}</h4>
        </div>
        <p class="tl-desc">${esc(r.description)}</p>
        <div class="action"><b>Next:</b> ${esc(r.suggestedAction)}</div>
        ${files(r.relatedFiles)}
      </div>`
      )
      .join("")}</div>`;
  }

  // --- agent notes ---
  function renderAgentNotes() {
    const n = data.agentNotes;
    const block = (title, arr, mono) =>
      `<div class="list-block"><h4>${title}</h4><ul>${(arr || [])
        .map((x) => `<li>${mono ? `<code>${esc(x)}</code>` : esc(x)}</li>`)
        .join("")}</ul></div>`;
    $("#agent").innerHTML = `
      <div class="card agent">
        <div class="agent-grid">
          ${block("Quick start", n.quickStart)}
          ${block("Important files", n.importantFiles, true)}
          ${block("Commands", n.commands, true)}
          ${block("Conventions", n.conventions)}
          ${block("Pitfalls", n.pitfalls)}
          ${block("Next recommended tasks", n.nextRecommendedTasks)}
        </div>
      </div>`;
  }

  // --- changelog ---
  function renderChangelog() {
    $("#changelog").innerHTML = `<div class="card"><div class="log">${data.changelog
      .map(
        (c) => `
      <div class="log-item">
        <span class="date">${esc(c.date)}</span>
        <div>
          <span class="ctype ${esc(c.type)}">${esc(c.type)}</span>
          <h4>${esc(c.title)}</h4>
          <p>${esc(c.description)}</p>
          ${files(c.relatedFiles)}
        </div>
      </div>`
      )
      .join("")}</div></div>`;
  }

  function render() {
    if (!data) {
      document.body.innerHTML =
        '<p style="padding:40px;font-family:sans-serif">No COMMAND_CENTER_DATA found. Check that data.js loaded before app.js.</p>';
      return;
    }
    renderHero();
    renderRoadmap();
    renderFeatures();
    renderFocus();
    renderArchitecture();
    renderPrd();
    renderDecisions();
    renderRisks();
    renderAgentNotes();
    renderChangelog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
