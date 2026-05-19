// shell.jsx — App shell: header + context strip + command palette mock

const SHELL_STYLES = `
  /* ── Header (root shell) ──────────────────────────────────────── */
  .app-header {
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    background: rgba(11, 11, 14, 0.7);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border-bottom: 1px solid var(--border);
    min-width: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--fg);
  }
  .brand-mark {
    width: 22px; height: 22px;
    border-radius: var(--radius-sm);
    display: grid; place-items: center;
    background: linear-gradient(180deg, var(--accent), #6d28d9);
    color: white;
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 12px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 1px 2px rgba(0, 0, 0, 0.4);
  }
  .brand-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .brand-sep {
    width: 1px; height: 18px;
    background: var(--border-strong);
    margin: 0 4px;
    flex-shrink: 0;
  }
  .brand, .brand-mark { flex-shrink: 0; }

  /* breadcrumb in header */
  .crumb {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px;
    color: var(--fg-muted);
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }
  .crumb > span, .crumb > a { flex-shrink: 0; white-space: nowrap; }
  .crumb .sep { color: var(--fg-faint); }
  .crumb .swatch {
    width: 9px; height: 9px;
    border-radius: 2px;
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.4) inset;
    flex-shrink: 0;
  }
  .crumb .here {
    color: var(--fg);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    flex: 1 1 auto;
    min-width: 0;
  }
  /* progressive shedding at narrow widths */
  @media (max-width: 1100px) {
    .crumb .crumb-id { display: none; }
  }

  /* search palette trigger */
  .search-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px 0 10px;
    width: 280px;
    min-width: 0;
    flex-shrink: 1;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--fg-subtle);
    cursor: pointer;
    transition: border-color var(--motion-fast) var(--ease-out),
                background var(--motion-fast) var(--ease-out);
  }
  .search-trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--border-strong);
    color: var(--fg-muted);
  }
  .search-trigger > svg, .search-trigger > .kbd { flex-shrink: 0; }
  .search-trigger > span {
    flex: 1;
    min-width: 0;
    text-align: left;
    font-size: 12.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (max-width: 1100px) {
    .search-trigger { width: 200px; }
  }
  @media (max-width: 900px) {
    .search-trigger { width: auto; padding: 0 8px; }
    .search-trigger > span { display: none; }
  }

  /* env pill (brief: tinted by environment) */
  .env-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 20px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid var(--border);
  }
  .env-pill { flex-shrink: 0; }
  .env-pill.prod   { background: var(--env-prod);   color: #fca5a5; border-color: rgba(239,68,68,0.22); }
  .env-pill.stage  { background: var(--env-stage);  color: #fcd34d; border-color: rgba(245,158,11,0.22); }
  .env-pill.dev    { background: var(--env-dev);    color: #93c5fd; border-color: rgba(59,130,246,0.22); }
  .env-pill.local  { background: var(--env-local);  color: var(--fg-muted); }
  .env-pill::before {
    content: ""; width: 5px; height: 5px; border-radius: 50%;
    background: currentColor;
  }

  /* ── Command palette overlay ──────────────────────────────────── */
  .palette-overlay {
    position: absolute;
    inset: 0;
    background: rgba(5, 5, 7, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 100px;
    z-index: 100;
    animation: paletteFadeIn 120ms var(--ease-out);
  }
  @keyframes paletteFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .palette {
    width: 560px;
    max-width: calc(100% - 48px);
    background: var(--surface-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.04),
      0 24px 60px rgba(0, 0, 0, 0.55);
    overflow: hidden;
    animation: paletteIn 140ms var(--ease-out);
  }
  @keyframes paletteIn {
    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .palette-input {
    width: 100%;
    height: 44px;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--border);
    padding: 0 14px;
    color: var(--fg);
    font-family: inherit;
    font-size: 14px;
    outline: none;
  }
  .palette-input::placeholder { color: var(--fg-subtle); }
  .palette-group {
    padding: 6px 0;
    border-bottom: 1px solid var(--border-soft);
  }
  .palette-group:last-child { border-bottom: 0; }
  .palette-label {
    padding: 6px 14px 4px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--fg-subtle);
  }
  .palette-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 14px;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-out);
    color: var(--fg);
    font-size: 13px;
  }
  .palette-row:hover, .palette-row.active {
    background: rgba(255, 255, 255, 0.05);
  }
  .palette-row.active { background: var(--accent-soft); }
  .palette-row .lead {
    display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
  }
  .palette-row .lead-id {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--fg-subtle);
    min-width: 60px;
  }
  .palette-row .trail {
    display: flex; gap: 4px;
  }
  .palette-footer {
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid var(--border-soft);
    display: flex; gap: 14px; align-items: center;
    font-size: 11.5px;
    color: var(--fg-subtle);
  }
  .palette-footer .group {
    display: inline-flex; align-items: center; gap: 6px;
  }
`;

function AppShell({ children, crumb, onOpenPalette, paletteOpen, onClosePalette, palette }) {
  React.useEffect(() => {
    if (document.getElementById("shell-styles")) return;
    const el = document.createElement("style");
    el.id = "shell-styles";
    el.textContent = SHELL_STYLES;
    document.head.appendChild(el);
  }, []);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // Global `?` shortcut to open the keyboard cheatsheet (skip when typing).
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "?" || e.metaKey || e.ctrlKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;
      e.preventDefault();
      setShortcutsOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const defaultCrumb = (
    <div className="crumb">
      <div className="swatch" style={{ background: PROJECT.color }} />
      <a href="Project Detail.html" style={{ color: "inherit", textDecoration: "none" }}>{PROJECT.name}</a>
      <span className="sep">›</span>
      <span className="mono crumb-id" style={{ fontSize: 11.5 }}>{CYCLE.display_id}</span>
      <span className="sep crumb-id">·</span>
      <span className="here">{CYCLE.name}</span>
      <span className="env-pill prod" style={{ marginLeft: 4 }}>{CYCLE.environment}</span>
    </div>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div className="brand-name">QA Workspace</div>
        </div>
        <div className="brand-sep" />
        {crumb || defaultCrumb}

        <button className="search-trigger" onClick={onOpenPalette} aria-label="Open command palette">
          <IconSearch size={14} />
          <span>Search test cases, jump to cycle…</span>
          <span className="kbd">⌘K</span>
        </button>

        <button className="ghost-btn square" aria-label="Theme" style={{ flexShrink: 0 }}>
          <IconMoon size={15} />
        </button>
        <div className="popover-anchor" style={{ flexShrink: 0 }}>
          <button className="ghost-btn square" aria-label="Settings"
                  onClick={() => setSettingsOpen((v) => !v)}>
            <IconSettings size={15} />
          </button>
          {typeof SettingsMenu !== "undefined" && (
            <SettingsMenu open={settingsOpen}
                          onClose={() => setSettingsOpen(false)}
                          onShowShortcuts={() => setShortcutsOpen(true)} />
          )}
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {paletteOpen && palette}
      {shortcutsOpen && typeof KbdShortcutsOverlay !== "undefined" && (
        <KbdShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}

// Command palette — opened via ⌘K. Mocks "actions" + "jump to" groups.
function CommandPalette({ onClose, onJumpToNextFailed }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lc = q.trim().toLowerCase();
  const matches = (s) => !lc || s.toLowerCase().includes(lc);

  const cases = ASSIGNMENTS.filter(
    (a) => matches(a.name) || matches(a.display_id),
  ).slice(0, 6);

  return (
    <div className="palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Search test cases, jump to cycle, run command…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {(!lc || "actions".includes(lc)) && (
          <div className="palette-group">
            <div className="palette-label">Actions</div>
            <div className="palette-row active" onClick={() => { onJumpToNextFailed(); onClose(); }}>
              <div className="lead">
                <IconFlag size={14} style={{ color: "var(--fail)" }} />
                <span>Jump to next failed case</span>
              </div>
              <div className="trail">
                <span className="kbd">N</span>
              </div>
            </div>
            <div className="palette-row">
              <div className="lead">
                <IconAlert size={14} style={{ color: "var(--blocked)" }} />
                <span>Jump to next blocked case</span>
              </div>
              <div className="trail">
                <span className="kbd">B</span>
              </div>
            </div>
            <div className="palette-row">
              <div className="lead">
                <IconLayers size={14} style={{ color: "var(--fg-muted)" }} />
                <span>Manage cycle assignments…</span>
              </div>
              <div className="trail"><span className="kbd dim">⌘</span><span className="kbd dim">M</span></div>
            </div>
            <div className="palette-row">
              <div className="lead">
                <IconKBD size={14} style={{ color: "var(--fg-muted)" }} />
                <span>Show keyboard shortcuts</span>
              </div>
              <div className="trail"><span className="kbd dim">?</span></div>
            </div>
          </div>
        )}

        {cases.length > 0 && (
          <div className="palette-group">
            <div className="palette-label">Test cases · this cycle</div>
            {cases.map((a) => (
              <div key={a.id} className="palette-row">
                <div className="lead">
                  <span className="lead-id mono">{a.display_id}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                </div>
                <div className="trail">
                  <span className="pill mono" style={{ height: 18, padding: "0 6px", fontSize: 10 }}>{a.version}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="palette-footer">
          <span className="group"><span className="kbd">↵</span> open</span>
          <span className="group"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="group"><span className="kbd">esc</span> dismiss</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, CommandPalette });
