// execution.jsx — Execution page (route /cycles/$cycleId/execute)
// The hero screen — highest-touch polish per brief.

const EXEC_STYLES = `
  /* ── Layout ────────────────────────────────────────────────── */
  .exec-root {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px 1fr;
  }
  @media (max-width: 1180px) {
    .exec-root { grid-template-columns: 288px 1fr; }
  }
  @media (max-width: 980px) {
    .exec-root { grid-template-columns: 256px 1fr; }
  }

  /* ── Sidebar ───────────────────────────────────────────────── */
  .exec-sidebar {
    background: rgba(255, 255, 255, 0.015);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .sb-head {
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .sb-cycle-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--fg);
    letter-spacing: -0.005em;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
  }
  .sb-cycle-meta {
    display: flex; align-items: center; gap: 6px;
    font-size: 11.5px;
    color: var(--fg-subtle);
    margin-bottom: 14px;
  }
  .sb-cycle-meta .mono { color: var(--fg-muted); }

  .progress {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    overflow: hidden;
    display: flex;
  }
  .progress-bar > i {
    height: 100%;
    transition: width var(--motion-slow) var(--ease-out);
  }
  .progress-bar > i.pass    { background: var(--pass); }
  .progress-bar > i.fail    { background: var(--fail); }
  .progress-bar > i.blocked { background: var(--blocked); }
  .progress-num {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--fg-muted);
    font-variant-numeric: tabular-nums;
  }

  .sb-legend {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 12px;
  }
  .sb-legend > div {
    display: flex; align-items: center; gap: 6px;
    font-size: 10.5px;
    color: var(--fg-subtle);
  }
  .sb-legend .dot {
    width: 7px; height: 7px; border-radius: 50%;
  }
  .sb-legend .dot.pass    { background: var(--pass); }
  .sb-legend .dot.fail    { background: var(--fail); }
  .sb-legend .dot.blocked { background: var(--blocked); }
  .sb-legend .dot.unexec  { background: var(--unexec); }
  .sb-legend .n {
    color: var(--fg);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    margin-left: 2px;
  }

  /* sidebar filter chips */
  .sb-filter {
    display: flex;
    gap: 4px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .sb-filter .chip {
    flex: 1;
    height: 24px;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--fg-muted);
    font-size: 11.5px;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out),
                color var(--motion-fast) var(--ease-out),
                border-color var(--motion-fast) var(--ease-out);
  }
  .sb-filter .chip:hover { background: rgba(255, 255, 255, 0.04); color: var(--fg); }
  .sb-filter .chip.active {
    background: rgba(255, 255, 255, 0.06);
    color: var(--fg);
    border-color: var(--border-strong);
  }
  .sb-filter .chip .count {
    font-family: var(--font-mono);
    font-size: 10.5px;
    opacity: 0.6;
  }

  /* assignment rows */
  .sb-list { flex: 1; overflow-y: auto; padding: 6px 0; }
  .sb-row {
    position: relative;
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 18px 8px 17px;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out);
    border-left: 3px solid transparent;
  }
  .sb-row:hover { background: rgba(255, 255, 255, 0.03); }
  .sb-row.active {
    background: var(--accent-soft);
    border-left-color: var(--accent);
  }
  .sb-row.flashing {
    animation: outlinePulse 500ms var(--ease-out);
  }
  .sb-row .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--unexec);
    flex-shrink: 0;
  }
  .sb-row .dot.pass    { background: var(--pass); }
  .sb-row .dot.fail    { background: var(--fail); }
  .sb-row .dot.blocked { background: var(--blocked); }
  .sb-row .dot.unexec  { background: transparent; box-shadow: inset 0 0 0 1.5px var(--unexec); }
  .sb-row .dot.pulse {
    animation: dotPulse 280ms var(--ease-out);
  }
  .sb-row .row-id {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--fg-subtle);
    white-space: nowrap;
  }
  .sb-row.active .row-id { color: var(--fg-muted); }
  .sb-row .row-name {
    font-size: 12.5px;
    color: var(--fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }
  .sb-row.active .row-name { color: var(--fg); font-weight: 500; }
  .sb-row .row-ver {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-faint);
  }

  /* sidebar footer (jump-to / next failed) */
  .sb-foot {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .sb-foot button {
    flex: 1;
    height: 28px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--fg-muted);
    font-size: 11.5px;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }
  .sb-foot button:hover { background: rgba(255, 255, 255, 0.06); color: var(--fg); }

  /* ── Main pane ─────────────────────────────────────────────── */
  .exec-main {
    display: flex; flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--bg);
  }
  .case-head {
    flex-shrink: 0;
    padding: 18px 32px 14px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .case-head .topline {
    display: flex; align-items: center; gap: 10px;
    color: var(--fg-subtle);
    font-size: 12px;
  }
  .case-head .topline .crumb-sep { color: var(--fg-faint); }
  .case-head h1 {
    margin: 0;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: var(--fg);
    text-wrap: pretty;
  }
  .case-head .subline {
    display: flex; align-items: center; gap: 10px;
    margin-top: 2px;
  }
  .case-head .subline .saved {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--fg-subtle);
  }
  .case-head .subline .saved .pulse-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--pass);
    box-shadow: 0 0 8px var(--pass);
    opacity: 0.7;
  }

  .id-pill {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 9px;
    border-radius: 5px;
    background: var(--accent-soft);
    color: #c4b5fd;
    font-family: var(--font-mono);
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    border: 1px solid rgba(139, 92, 246, 0.18);
  }

  .case-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 32px 24px;
  }

  @media (max-width: 1180px) {
    .case-head { padding: 16px 22px 12px; }
    .case-body { padding: 20px 22px 22px; }
    .status-bar { padding: 12px 18px; gap: 10px; }
    .status-bar .skey { height: 32px; padding: 0 10px; gap: 8px; font-size: 12.5px; }
    .status-bar .skey .key-chip { display: none; }
    .status-bar .nav-arrow { width: 28px; height: 28px; }
    .status-bar .nav-pos { font-size: 11.5px; padding: 0 2px; }
  }
  @media (max-width: 1100px) {
    .case-head { padding: 16px 22px 12px; }
    .case-body { padding: 20px 22px 22px; }
    .status-bar { padding: 12px 18px; }
  }
  @media (max-width: 920px) {
    .case-head { padding: 14px 16px 12px; }
    .case-body { padding: 16px 16px 18px; }
    .status-bar { padding: 10px 12px; gap: 8px; }
    .status-bar .skey { padding: 0 8px; gap: 6px; }
    .status-bar .status-keys { gap: 6px; }
  }

  .section {
    margin-bottom: 30px;
  }
  .section:last-child { margin-bottom: 0; }

  .section h3 {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--fg-subtle);
    display: flex; align-items: center; gap: 8px;
  }
  .section h3 .count {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--fg-faint);
    letter-spacing: 0;
    text-transform: none;
  }

  .prose {
    font-size: 14px;
    line-height: 1.6;
    color: var(--fg-muted);
    max-width: 64ch;
    text-wrap: pretty;
  }
  .prose strong { color: var(--fg); font-weight: 600; }
  .prose code {
    font-family: var(--font-mono);
    font-size: 12.5px;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 4px;
  }

  /* steps */
  .steps {
    display: flex; flex-direction: column;
    gap: 1px;
    background: var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    max-width: 920px;
  }
  .step {
    display: grid;
    grid-template-columns: 36px 1fr 1fr;
    gap: 0;
    background: var(--bg);
    padding: 14px 0;
  }
  .step .num {
    display: flex;
    justify-content: center;
    padding-top: 1px;
  }
  .step .num span {
    width: 22px; height: 22px;
    border-radius: 50%;
    display: grid; place-items: center;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-strong);
    color: var(--fg-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
  }
  .step .col {
    padding: 0 18px;
  }
  .step .col + .col {
    border-left: 1px solid var(--border);
  }
  .step .col-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--fg-faint);
    margin-bottom: 6px;
  }
  .step .col-body {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--fg);
  }
  .step .col-body code {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--fg);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 4px;
  }
  .step:nth-child(odd) { background: rgba(255, 255, 255, 0.012); }

  .expected-card {
    background: rgba(139, 92, 246, 0.06);
    border: 1px solid rgba(139, 92, 246, 0.16);
    border-radius: var(--radius-lg);
    padding: 14px 18px;
    max-width: 920px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .expected-card .marker {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent-hover);
    display: grid; place-items: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .expected-card .body {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--fg);
  }

  .notes-area {
    width: 100%;
    max-width: 920px;
    min-height: 96px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 14px;
    color: var(--fg);
    font-family: inherit;
    font-size: 13.5px;
    line-height: 1.55;
    resize: vertical;
    outline: none;
    transition: border-color var(--motion-fast) var(--ease-out),
                background var(--motion-fast) var(--ease-out);
  }
  .notes-area:hover { border-color: var(--border-strong); }
  .notes-area:focus { border-color: var(--accent-ring); background: var(--surface-2); }
  .notes-area::placeholder { color: var(--fg-faint); }

  /* ── Status bar (bottom of main pane) ──────────────────────── */
  .status-bar {
    flex-shrink: 0;
    padding: 14px 32px;
    border-top: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.012);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .status-bar .nav-group {
    display: flex; gap: 6px;
    margin-right: auto;
    flex-shrink: 0;
  }
  .nav-arrow {
    width: 32px; height: 32px;
    display: grid; place-items: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--fg-muted);
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out),
                color var(--motion-fast) var(--ease-out);
  }
  .nav-arrow:hover { background: rgba(255, 255, 255, 0.05); color: var(--fg); }
  .nav-arrow:disabled { opacity: 0.4; cursor: not-allowed; }

  .nav-pos {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--fg-subtle);
    align-self: center;
    padding: 0 4px;
  }

  /* status keys group */
  .status-keys { display: flex; gap: 8px; flex-shrink: 0; }
  .skey {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    padding: 0 12px 0 14px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    color: var(--fg);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out),
                border-color var(--motion-fast) var(--ease-out),
                transform var(--motion-fast) var(--ease-out);
  }
  .skey .dot {
    width: 7px; height: 7px; border-radius: 50%;
  }
  .skey.pass    .dot { background: var(--pass); }
  .skey.fail    .dot { background: var(--fail); }
  .skey.blocked .dot { background: var(--blocked); }
  .skey.unexec  .dot { background: transparent; box-shadow: inset 0 0 0 1.5px var(--unexec); }

  .skey:hover { background: var(--surface-3); }
  .skey:active { transform: translateY(0.5px); }
  .skey .key-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1;
    color: var(--fg-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-strong);
    border-bottom-color: rgba(255,255,255,0.18);
    border-radius: 3px;
    padding: 3px 5px;
    transition: opacity var(--motion-fast) var(--ease-out);
  }
  .skey:hover .key-chip { opacity: 0.5; }

  .skey.is-current {
    border-color: var(--accent-ring);
  }
  .skey.is-current.pass    { background: var(--pass-soft); border-color: rgba(16,185,129,0.4); }
  .skey.is-current.fail    { background: var(--fail-soft); border-color: rgba(239,68,68,0.4); }
  .skey.is-current.blocked { background: var(--blocked-soft); border-color: rgba(245,158,11,0.4); }

  /* environment / context */
  .meta-strip {
    display: flex; align-items: center; gap: 8px;
    font-size: 11.5px; color: var(--fg-subtle);
  }
  .meta-strip .sep { color: var(--fg-faint); }

  /* exec-time fade-in for case content */
  .case-fade {
    animation: caseFade var(--motion-base) var(--ease-out);
  }
  @keyframes caseFade {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── Helpers ─────────────────────────────────────────────────────
function statusCounts(list) {
  const c = { pass: 0, fail: 0, blocked: 0, unexec: 0 };
  list.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
  return c;
}

// Render inline `code` markers from a string (very small parser — we control the data).
function richText(s) {
  const parts = [];
  let i = 0; const re = /`([^`]+)`/g; let m;
  while ((m = re.exec(s))) {
    if (m.index > i) parts.push(s.slice(i, m.index));
    parts.push(<code key={parts.length}>{m[1]}</code>);
    i = m.index + m[0].length;
  }
  if (i < s.length) parts.push(s.slice(i));
  return parts;
}

// ── ExecutionPage ───────────────────────────────────────────────
function ExecutionPage({ openPalette }) {
  React.useEffect(() => {
    if (document.getElementById("exec-styles")) return;
    const el = document.createElement("style");
    el.id = "exec-styles";
    el.textContent = EXEC_STYLES;
    document.head.appendChild(el);
  }, []);

  // assignments live in state so status changes feel real
  const [items, setItems] = React.useState(ASSIGNMENTS);
  const [activeId, setActiveId] = React.useState("a9");          // AUR-114
  const [filter, setFilter] = React.useState("all");             // all | unexec | failing
  const [pulsingDot, setPulsingDot] = React.useState(null);      // assignment id
  const [flashRow, setFlashRow] = React.useState(null);          // next-row id to outline-pulse
  const [savedAt, setSavedAt] = React.useState(null);            // notes saved timestamp
  const [notesDraft, setNotesDraft] = React.useState({});        // local edits, per id

  const listRef = React.useRef(null);

  const filtered = React.useMemo(() => {
    if (filter === "unexec")  return items.filter((a) => a.status === "unexec");
    if (filter === "failing") return items.filter((a) => a.status === "fail" || a.status === "blocked");
    return items;
  }, [items, filter]);

  const counts = statusCounts(items);
  const total = items.length;
  const done = counts.pass + counts.fail + counts.blocked;
  const pct = (n) => total === 0 ? 0 : (n / total) * 100;

  const active = items.find((a) => a.id === activeId) || items[0];
  const activeIdx = filtered.findIndex((a) => a.id === activeId);
  const fullIdx = items.findIndex((a) => a.id === activeId);

  // status apply ----------------------------------------------------
  const applyStatus = React.useCallback((status) => {
    if (!active) return;
    setItems((prev) =>
      prev.map((a) => a.id === active.id ? { ...a, status, executed_at: "just now" } : a),
    );
    setPulsingDot(active.id);
    setTimeout(() => setPulsingDot(null), 320);

    // advance to next case in the current filter, briefly flash its row
    const idxInFiltered = filtered.findIndex((a) => a.id === active.id);
    const next = filtered[idxInFiltered + 1] || filtered[idxInFiltered - 1];
    if (next && next.id !== active.id) {
      setTimeout(() => {
        setActiveId(next.id);
        setFlashRow(next.id);
        setTimeout(() => setFlashRow(null), 500);
      }, 140);
    }
  }, [active, filtered]);

  // nav arrows ------------------------------------------------------
  const nav = React.useCallback((delta) => {
    if (filtered.length === 0) return;
    const i = filtered.findIndex((a) => a.id === activeId);
    const ni = Math.max(0, Math.min(filtered.length - 1, i + delta));
    setActiveId(filtered[ni].id);
  }, [filtered, activeId]);

  // jump to next failed (from palette / N key) ---------------------
  const jumpToNextFailed = React.useCallback(() => {
    const start = items.findIndex((a) => a.id === activeId);
    for (let off = 1; off <= items.length; off++) {
      const k = (start + off) % items.length;
      if (items[k].status === "fail") { setActiveId(items[k].id); return; }
    }
  }, [items, activeId]);

  // expose for command palette caller
  React.useEffect(() => {
    window.__jumpToNextFailed = jumpToNextFailed;
  }, [jumpToNextFailed]);

  // keyboard --------------------------------------------------------
  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "p": e.preventDefault(); applyStatus("pass"); break;
        case "f": e.preventDefault(); applyStatus("fail"); break;
        case "b": e.preventDefault(); applyStatus("blocked"); break;
        case "u": e.preventDefault(); applyStatus("unexec"); break;
        case "arrowdown":
        case "arrowright": e.preventDefault(); nav(1); break;
        case "arrowup":
        case "arrowleft":  e.preventDefault(); nav(-1); break;
        case "n":          e.preventDefault(); jumpToNextFailed(); break;
        default: break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [applyStatus, nav, jumpToNextFailed]);

  // smooth-scroll active row into view ------------------------------
  React.useEffect(() => {
    const node = listRef.current?.querySelector(`[data-id="${activeId}"]`);
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const parent = listRef.current.getBoundingClientRect();
    if (rect.top < parent.top + 20 || rect.bottom > parent.bottom - 20) {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeId]);

  // notes auto-save indicator ---------------------------------------
  const notesValue = notesDraft[active?.id] ?? active?.notes ?? "";
  React.useEffect(() => {
    if (!(active?.id in notesDraft)) return;
    const t = setTimeout(() => setSavedAt(Date.now()), 600);
    return () => clearTimeout(t);
  }, [notesValue, active?.id]);

  if (!active) return null;

  // ── render ──
  return (
    <div className="exec-root">
      {/* ─── Sidebar ─── */}
      <aside className="exec-sidebar">
        <div className="sb-head">
          <div className="sb-cycle-name">
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {CYCLE.name}
            </span>
          </div>
          <div className="sb-cycle-meta">
            <span className="mono">{CYCLE.display_id}</span>
            <span style={{ color: "var(--fg-faint)" }}>·</span>
            <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {CYCLE.build}
            </span>
          </div>

          <div className="progress" aria-label={`${done} of ${total} executed`}>
            <div className="progress-bar">
              <i className="pass"    style={{ width: `${pct(counts.pass)}%` }} />
              <i className="fail"    style={{ width: `${pct(counts.fail)}%` }} />
              <i className="blocked" style={{ width: `${pct(counts.blocked)}%` }} />
            </div>
            <div className="progress-num">{done}<span style={{ opacity: 0.5 }}>/{total}</span></div>
          </div>

          <div className="sb-legend">
            <div><span className="dot pass"/>Pass<span className="n">{counts.pass}</span></div>
            <div><span className="dot fail"/>Fail<span className="n">{counts.fail}</span></div>
            <div><span className="dot blocked"/>Blocked<span className="n">{counts.blocked}</span></div>
            <div><span className="dot unexec"/>Open<span className="n">{counts.unexec}</span></div>
          </div>
        </div>

        <div className="sb-filter" role="tablist">
          <button
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >All <span className="count">{items.length}</span></button>
          <button
            className={`chip ${filter === "unexec" ? "active" : ""}`}
            onClick={() => setFilter("unexec")}
          >Open <span className="count">{counts.unexec}</span></button>
          <button
            className={`chip ${filter === "failing" ? "active" : ""}`}
            onClick={() => setFilter("failing")}
          >Issues <span className="count">{counts.fail + counts.blocked}</span></button>
        </div>

        <div className="sb-list scroll" ref={listRef}>
          {filtered.map((a) => (
            <div
              key={a.id}
              data-id={a.id}
              className={`sb-row ${a.id === active.id ? "active" : ""} ${flashRow === a.id ? "flashing" : ""}`}
              onClick={() => setActiveId(a.id)}
            >
              <span className={`dot ${a.status} ${pulsingDot === a.id ? "pulse" : ""}`}
                    style={{
                      "--flash":
                        a.status === "pass"    ? "var(--pass-flash)" :
                        a.status === "fail"    ? "var(--fail-flash)" :
                        a.status === "blocked" ? "var(--blocked-flash)" : "transparent",
                    }} />
              <span className="row-id mono">{a.display_id}</span>
              <span className="row-name">{a.name}</span>
              <span className="row-ver mono">{a.version}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "32px 18px", color: "var(--fg-subtle)", fontSize: 12.5, textAlign: "center" }}>
              No cases match this filter.
            </div>
          )}
        </div>

        <div className="sb-foot">
          <button onClick={jumpToNextFailed}>
            <IconFlag size={13} />
            Next failed
            <span className="kbd" style={{ marginLeft: "auto" }}>N</span>
          </button>
          <button onClick={openPalette}>
            <IconSearch size={13} />
            Jump…
            <span className="kbd" style={{ marginLeft: "auto" }}>⌘K</span>
          </button>
        </div>
      </aside>

      {/* ─── Main pane ─── */}
      <section className="exec-main">
        <div className="case-head">
          <div className="topline">
            <span>{active.category}</span>
            <span className="crumb-sep">›</span>
            <span>{active.subcategory}</span>
          </div>
          <h1>{active.name}</h1>
          <div className="subline">
            <span className="id-pill">{active.display_id}</span>
            <span className="pill mono">{active.version}</span>
            <span className="meta-strip">
              <span className="sep">·</span>
              <span>{active.executed_at ? `Last run ${active.executed_at}` : "Unexecuted"}</span>
              {savedAt && active?.id in notesDraft && (
                <span className="saved" style={{ animation: "savedFade 2.4s var(--ease-out)" }}>
                  <span className="pulse-dot" />
                  Notes saved
                </span>
              )}
            </span>
            <button className="ghost-btn square" style={{ marginLeft: "auto" }} aria-label="More">
              <IconDots size={15} />
            </button>
          </div>
        </div>

        <div className="case-body scroll" key={active.id}>
          <div className="case-fade">
            <div className="section">
              <h3>Description</h3>
              <div className="prose">{richText(active.description)}</div>
            </div>

            <div className="section">
              <h3>Steps <span className="count">{active.steps.length}</span></h3>
              <div className="steps">
                {active.steps.map((s, i) => (
                  <div className="step" key={i}>
                    <div className="num"><span>{i + 1}</span></div>
                    <div className="col">
                      <div className="col-label">Action</div>
                      <div className="col-body">{richText(s.action)}</div>
                    </div>
                    <div className="col">
                      <div className="col-label">Expected</div>
                      <div className="col-body">{richText(s.expected)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>Expected result</h3>
              <div className="expected-card">
                <div className="marker"><IconCheck size={12} /></div>
                <div className="body">{richText(active.expected_result)}</div>
              </div>
            </div>

            <div className="section">
              <h3>Notes</h3>
              <textarea
                className="notes-area"
                placeholder="Capture observations, env quirks, defect IDs…"
                value={notesValue}
                onChange={(e) => setNotesDraft((d) => ({ ...d, [active.id]: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* ─── Status bar ─── */}
        <div className="status-bar">
          <div className="nav-group">
            <button className="nav-arrow" onClick={() => nav(-1)} disabled={activeIdx <= 0} aria-label="Previous case">
              <IconChevL size={15} />
            </button>
            <button className="nav-arrow" onClick={() => nav(1)} disabled={activeIdx >= filtered.length - 1} aria-label="Next case">
              <IconChevR size={15} />
            </button>
            <div className="nav-pos">{fullIdx + 1} / {items.length}</div>
          </div>

          <div className="status-keys">
            <button
              className={`skey pass ${active.status === "pass" ? "is-current" : ""}`}
              onClick={() => applyStatus("pass")}
            >
              <span className="dot" />
              Pass
              <span className="key-chip">P</span>
            </button>
            <button
              className={`skey fail ${active.status === "fail" ? "is-current" : ""}`}
              onClick={() => applyStatus("fail")}
            >
              <span className="dot" />
              Fail
              <span className="key-chip">F</span>
            </button>
            <button
              className={`skey blocked ${active.status === "blocked" ? "is-current" : ""}`}
              onClick={() => applyStatus("blocked")}
            >
              <span className="dot" />
              Blocked
              <span className="key-chip">B</span>
            </button>
            <button
              className={`skey unexec ${active.status === "unexec" ? "is-current" : ""}`}
              onClick={() => applyStatus("unexec")}
              title="Clear status"
            >
              <span className="dot" />
              Reset
              <span className="key-chip">U</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { ExecutionPage });
