// overlays.jsx — All remaining overlays: dialogs, popovers, banner, theme toggle, shortcuts

// ═══════════════════════════════════════════════════════════════
// ALERT DIALOG (small confirmation modal, used everywhere)
// ═══════════════════════════════════════════════════════════════
function AlertDialog({ title, description, confirmLabel = "Delete", confirmTone = "danger", onCancel, onConfirm }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="alertdialog" aria-labelledby="dialog-title">
        <div className="dialog-body">
          <div className="icon"><IconAlert size={18} /></div>
          <div className="text">
            <h3 id="dialog-title">{title}</h3>
            <p>{description}</p>
          </div>
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmTone === "danger" ? "danger" : "primary"}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOAST SYSTEM (sonner-style, bottom-right)
// ═══════════════════════════════════════════════════════════════
function useToasts() {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((msg, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((arr) => [...arr, { id, msg, tone }]);
    setTimeout(() => setItems((arr) => arr.filter((t) => t.id !== id)), 3200);
  }, []);
  return [items, push];
}

function ToastStack({ items }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span className="icon">
            {t.tone === "success" ? <IconCheck size={14} /> :
             t.tone === "error"   ? <IconAlert size={14} /> :
                                    <IconCircle size={14} />}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DIALOGS
// ═══════════════════════════════════════════════════════════════

// ── New Project ────────────────────────────────────────────────
function NewProjectDialog({ onClose, onCreate }) {
  const [prefix, setPrefix] = React.useState("");
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [color, setColor] = React.useState("#8b5cf6");
  const presets = ["#8b5cf6", "#2563eb", "#0d9488", "#f59e0b", "#ec4899", "#22c55e", "#ef4444", "#a855f7"];

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = prefix.trim().length >= 2 && name.trim().length >= 2;

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fdialog" role="dialog" aria-labelledby="np-title">
        <div className="fdialog-head">
          <h3 id="np-title">New project</h3>
          <p>Projects scope test cases, plans, and cycles. Each gets a unique prefix and color.</p>
        </div>
        <div className="fdialog-body">
          <div className="frow row-2">
            <div className="frow" style={{ flex: "0 0 110px", marginBottom: 0 }}>
              <label htmlFor="np-prefix">Prefix</label>
              <input
                id="np-prefix" className="input mono" maxLength={6}
                value={prefix}
                placeholder="AUR"
                onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
              <div className="hint">2–6 letters; uppercase</div>
            </div>
            <div className="frow" style={{ marginBottom: 0 }}>
              <label htmlFor="np-name">Name</label>
              <input
                id="np-name" className="input"
                value={name}
                placeholder="Aurora"
                onChange={(e) => setName(e.target.value)}
              />
              <div className="hint">Display name shown on the project card.</div>
            </div>
          </div>

          <div className="frow">
            <label htmlFor="np-desc">Description</label>
            <textarea
              id="np-desc" value={desc}
              placeholder="What this project covers."
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="frow">
            <label>Color</label>
            <div className="color-block">
              <div className="swatch-big" style={{ background: color }}>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="meta">
                <span className="mono">{color.toUpperCase()}</span>
                <span>Used in the sidebar swatch and accent flourishes.</span>
              </div>
            </div>
            <div className="preset-row">
              {presets.map((p) => (
                <button
                  key={p} className={`preset ${p === color ? "active" : ""}`}
                  style={{ background: p }} onClick={() => setColor(p)}
                  aria-label={p}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="fdialog-foot">
          <span className="left">{prefix && `${prefix}-001 will be the first case ID`}</span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!canSubmit} onClick={() => onCreate?.({ prefix, name, desc, color })}>
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Cycle ──────────────────────────────────────────────────
function NewCycleDialog({ onClose, onCreate }) {
  const [name, setName] = React.useState("");
  const [env, setEnv] = React.useState("Production");
  const [build, setBuild] = React.useState("");

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fdialog" role="dialog" aria-labelledby="nc-title">
        <div className="fdialog-head">
          <h3 id="nc-title">New test cycle</h3>
          <p>A cycle is one execution of a plan against a specific build.</p>
        </div>
        <div className="fdialog-body">
          <div className="frow">
            <label htmlFor="nc-name">Cycle name</label>
            <input id="nc-name" className="input" value={name} placeholder="Smoke Pass — Production"
                   onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="frow row-2">
            <div className="frow" style={{ marginBottom: 0 }}>
              <label htmlFor="nc-env">Environment</label>
              <select id="nc-env" value={env} onChange={(e) => setEnv(e.target.value)}>
                <option>Production</option>
                <option>Staging</option>
                <option>Dev</option>
                <option>Local</option>
              </select>
            </div>
            <div className="frow" style={{ marginBottom: 0 }}>
              <label htmlFor="nc-build">Build / version</label>
              <input id="nc-build" className="input mono" value={build}
                     placeholder="checkout-web @ 2.4.0-rc.3"
                     onChange={(e) => setBuild(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="fdialog-foot">
          <span className="left">Next: pick which test cases this cycle covers.</span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={name.trim().length < 2} onClick={() => onCreate?.({ name, env, build })}>
            Create cycle
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Assignments / Manage Type Cases (same pattern) ─────
function ManageCasesDialog({ title, subtitle, initialIds = [], onClose, onSave }) {
  const [sel, setSel] = React.useState(() => new Set(initialIds));
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lc = q.trim().toLowerCase();
  const list = lc
    ? CATALOGUE.filter((c) =>
        c.name.toLowerCase().includes(lc) ||
        c.display_id.toLowerCase().includes(lc) ||
        c.category.toLowerCase().includes(lc))
    : CATALOGUE;

  const toggle = (id) => setSel((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allShownSelected = list.length > 0 && list.every((c) => sel.has(c.id));
  const toggleAll = () => setSel((prev) => {
    const next = new Set(prev);
    if (allShownSelected) list.forEach((c) => next.delete(c.id));
    else                  list.forEach((c) => next.add(c.id));
    return next;
  });

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fdialog lg" role="dialog" aria-labelledby="mc-title">
        <div className="fdialog-head">
          <h3 id="mc-title">{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="fdialog-body">
          <div className="search-input" style={{ maxWidth: "100%", marginBottom: 12 }}>
            <IconSearch size={13} />
            <input type="text" placeholder="Search test cases…"
                   value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="clear" onClick={() => setQ("")} aria-label="Clear"><IconX size={11} /></button>}
            <div className="pulse-line" />
          </div>

          <div className="cklist">
            <div className="ckhead">
              <button className="cb" onClick={toggleAll}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        border: `1.2px solid ${allShownSelected ? "var(--accent)" : "var(--border-strong)"}`,
                        background: allShownSelected ? "var(--accent)" : "var(--surface-1)",
                        display: "grid", placeItems: "center", color: "white",
                      }}
                      aria-label="Toggle all">
                {allShownSelected && <IconCheck size={10} stroke={2.4} />}
              </button>
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {allShownSelected ? "Deselect all" : "Select all"} {lc && `(${list.length} matching)`}
              </span>
              <span className="summary">{sel.size} of {CATALOGUE.length} selected</span>
            </div>
            <div className="ckbody scroll">
              {list.map((c) => (
                <div key={c.id} className={`ckitem ${sel.has(c.id) ? "checked" : ""}`} onClick={() => toggle(c.id)}>
                  <span className="cb"><IconCheck size={10} stroke={2.4} /></span>
                  <span className="id">{c.display_id}</span>
                  <span className="nm">{c.name}</span>
                  <span className="sub">{c.category} · {c.subcategory}</span>
                </div>
              ))}
              {list.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 12 }}>
                  No cases match.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="fdialog-foot">
          <span className="left">
            <span className="mono">+{Math.max(0, sel.size - initialIds.length)}</span> added,
            <span className="mono"> −{initialIds.filter((id) => !sel.has(id)).length}</span> removed
          </span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave?.([...sel])}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── New Test Type ──────────────────────────────────────────────
function NewTypeDialog({ onClose, onCreate }) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fdialog" role="dialog" aria-labelledby="nt-title">
        <div className="fdialog-head">
          <h3 id="nt-title">New test type</h3>
          <p>Test types are an orthogonal grouping — Smoke, Regression, API. A case can belong to many types.</p>
        </div>
        <div className="fdialog-body">
          <div className="frow">
            <label htmlFor="nt-name">Name</label>
            <input id="nt-name" className="input" value={name} placeholder="Smoke"
                   onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="frow">
            <label htmlFor="nt-desc">Description</label>
            <textarea id="nt-desc" value={desc}
                      placeholder="Critical-path coverage that must pass for every release."
                      onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <div className="fdialog-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={name.trim().length < 2} onClick={() => onCreate?.({ name, desc })}>
            Create type
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// POPOVERS
// ═══════════════════════════════════════════════════════════════

// Click-outside hook
function useClickOutside(ref, onOutside) {
  React.useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onOutside]);
}

// ── Settings menu ──────────────────────────────────────────────
function SettingsMenu({ open, onClose, onShowShortcuts }) {
  const ref = React.useRef(null);
  useClickOutside(ref, onClose);
  const [autoUpdate, setAutoUpdate] = React.useState(true);
  const [checking, setChecking] = React.useState(false);

  if (!open) return null;
  return (
    <div className="popover left" ref={ref} style={{ minWidth: 260 }}>
      <div className="menu-label">Updates</div>
      <div className="menu-item" onClick={() => setAutoUpdate((v) => !v)}>
        <span className={`check ${autoUpdate ? "on" : ""}`}>
          {autoUpdate && <IconCheck size={10} stroke={2.4} />}
        </span>
        Check for updates automatically
      </div>
      <div className="menu-item" onClick={() => { setChecking(true); setTimeout(() => setChecking(false), 1500); }}>
        {checking ? <span className="spinner" /> : <IconCircle size={14} style={{ color: "var(--fg-muted)" }} />}
        {checking ? "Checking…" : "Check for updates now"}
      </div>
      <div className="menu-sep" />
      <div className="menu-label">Help</div>
      <div className="menu-item" onClick={() => { onShowShortcuts?.(); onClose(); }}>
        <IconKBD size={14} style={{ color: "var(--fg-muted)" }} />
        Keyboard shortcuts
        <span className="right">?</span>
      </div>
      <div className="menu-item">
        <IconCircle size={14} style={{ color: "var(--fg-muted)" }} />
        About QA Workspace
      </div>
      <div className="menu-sep" />
      <div className="menu-item">
        <IconFlag size={14} style={{ color: "var(--fg-muted)" }} />
        Open log file…
      </div>
    </div>
  );
}

// ── Project ••• menu (Backup / Restore) ───────────────────────
function ProjectMenu({ open, onClose }) {
  const ref = React.useRef(null);
  useClickOutside(ref, onClose);
  if (!open) return null;
  return (
    <div className="popover left" ref={ref} style={{ minWidth: 220 }}>
      <div className="menu-label">Data</div>
      <div className="menu-item">
        <IconLayers size={14} style={{ color: "var(--fg-muted)" }} />
        Backup project…
        <span className="right">⌘B</span>
      </div>
      <div className="menu-item">
        <IconCorner size={14} style={{ color: "var(--fg-muted)" }} />
        Restore from backup…
      </div>
      <div className="menu-sep" />
      <div className="menu-item">
        <IconArrowR size={14} style={{ color: "var(--fg-muted)" }} />
        Export as CSV
      </div>
      <div className="menu-sep" />
      <div className="menu-item danger">
        <IconX size={14} />
        Delete project…
      </div>
    </div>
  );
}

// ── Date range picker (two months) ─────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }
function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fmtMonth(d) { return d.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
function fmtDisplay(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

function monthDays(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function CalendarMonth({ year, month, onPrev, onNext, range, today, onPick }) {
  const days = monthDays(year, month);
  const monthDate = new Date(year, month, 1);
  return (
    <div className="cal-month">
      <div className="cal-month-head">
        <span>{fmtMonth(monthDate)}</span>
        <div className="cal-nav">
          {onPrev && <button onClick={onPrev} aria-label="Prev"><IconChevL size={12} /></button>}
          {onNext && <button onClick={onNext} aria-label="Next"><IconChevR size={12} /></button>}
        </div>
      </div>
      <div className="cal-grid">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
        {days.map((d) => {
          const inMonth = d.getMonth() === month;
          const t = today && fmtDate(d) === fmtDate(today);
          let cls = "cal-day";
          if (!inMonth) cls += " dim";
          if (t) cls += " today";
          if (range.start && fmtDate(d) === fmtDate(range.start)) cls += " range-start" + (range.end ? " has-end" : "");
          if (range.end   && fmtDate(d) === fmtDate(range.end))   cls += " range-end has-start";
          if (range.start && range.end && d > range.start && d < range.end) cls += " in-range";
          return (
            <div key={fmtDate(d)} className={cls} onClick={() => onPick(d)}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePopover({ value, onChange, onClose }) {
  const ref = React.useRef(null);
  useClickOutside(ref, onClose);
  const today = new Date("2026-05-19");
  const [view, setView] = React.useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const next = (() => {
    const m = view.month + 1;
    return m > 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: m };
  })();

  const pick = (d) => {
    if (!value.start || (value.start && value.end)) onChange({ start: d, end: null });
    else if (d < value.start) onChange({ start: d, end: value.start });
    else                       onChange({ start: value.start, end: d });
  };

  const setPreset = (days) => {
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(end.getDate() + days);
    onChange({ start, end });
  };

  return (
    <div className="popover left" ref={ref} style={{ width: 560, padding: 0 }}>
      <div className="cal">
        <CalendarMonth
          year={view.year} month={view.month}
          onPrev={() => setView({
            year:  view.month === 0 ? view.year - 1 : view.year,
            month: view.month === 0 ? 11 : view.month - 1,
          })}
          range={value} today={today} onPick={pick}
        />
        <CalendarMonth
          year={next.year} month={next.month}
          onNext={() => setView({
            year:  next.month === 11 ? next.year + 1 : next.year,
            month: next.month === 11 ? 0 : next.month + 1,
          })}
          range={value} today={today} onPick={pick}
        />
      </div>
      <div className="cal-preset">
        <button onClick={() => setPreset(7)}>Next 7 days</button>
        <button onClick={() => setPreset(14)}>Next 2 weeks</button>
        <button onClick={() => setPreset(30)}>Next 30 days</button>
        <button onClick={() => setPreset(90)}>This quarter</button>
        <span style={{ flex: 1 }} />
        <button onClick={() => onChange({ start: null, end: null })}>Clear</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MISC OVERLAYS
// ═══════════════════════════════════════════════════════════════

// ── Update banner ──────────────────────────────────────────────
function UpdateBanner({ state, onDismiss, onInstall }) {
  // state: "available" | "downloading" (with percent) | "downloaded" | null
  if (!state) return null;
  const { kind, percent } = state;

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <span className="icon">
        {kind === "available"   ? <IconSparkle size={12} /> :
         kind === "downloading" ? <span className="spinner" /> :
                                  <IconCheck size={12} />}
      </span>
      <span className="msg">
        {kind === "available"   && <><b>Update available</b> — Version 2.4.1 is ready to download.</>}
        {kind === "downloading" && <><b>Downloading update</b> · {percent ?? 0}%</>}
        {kind === "downloaded"  && <><b>Update ready</b> — Install when you're ready. Your work is preserved.</>}
      </span>
      <span className="actions">
        {kind === "available" && (
          <>
            <button className="btn subtle">Release notes</button>
            <button className="btn primary">Download</button>
          </>
        )}
        {kind === "downloaded" && (
          <button className="btn primary" onClick={onInstall}>Install &amp; restart</button>
        )}
        <button className="ghost-btn square" onClick={onDismiss} aria-label="Dismiss">
          <IconX size={13} />
        </button>
      </span>
      {kind === "downloading" && (
        <div className="progress-line" style={{ width: `${percent ?? 0}%` }} />
      )}
    </div>
  );
}

// ── Keyboard shortcuts overlay ─────────────────────────────────
function KbdShortcutsOverlay({ onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const Row = ({ label, keys }) => (
    <div className="row">
      <span className="lbl">{label}</span>
      <span className="keys">{keys.map((k, i) => <span key={i} className="kbd">{k}</span>)}</span>
    </div>
  );

  return (
    <div className="dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="kbd-overlay" role="dialog" aria-labelledby="kbd-title">
        <header>
          <h3 id="kbd-title">Keyboard shortcuts</h3>
          <button className="ghost-btn square close" onClick={onClose} aria-label="Close">
            <IconX size={15} />
          </button>
        </header>
        <div className="grid scroll">
          <div className="group">
            <h4>Global</h4>
            <Row label="Open command palette" keys={["⌘", "K"]} />
            <Row label="Show keyboard shortcuts" keys={["?"]} />
            <Row label="Toggle theme" keys={["⌘", "⇧", "L"]} />
            <Row label="Go to projects" keys={["⌘", "1"]} />
          </div>
          <div className="group">
            <h4>Navigation</h4>
            <Row label="Next case" keys={["→"]} />
            <Row label="Previous case" keys={["←"]} />
            <Row label="Jump to next failed" keys={["N"]} />
            <Row label="Jump to next blocked" keys={["B"]} />
          </div>
          <div className="group">
            <h4>Execution</h4>
            <Row label="Mark Pass" keys={["P"]} />
            <Row label="Mark Fail" keys={["F"]} />
            <Row label="Mark Blocked" keys={["B"]} />
            <Row label="Clear status" keys={["U"]} />
            <Row label="Focus notes" keys={["⌘", "/"]} />
          </div>
          <div className="group">
            <h4>Editing</h4>
            <Row label="New test case" keys={["⌘", "N"]} />
            <Row label="Save (if not auto-saving)" keys={["⌘", "S"]} />
            <Row label="Delete" keys={["⌘", "⌫"]} />
            <Row label="Add step" keys={["⌘", "↵"]} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Theme toggle (3-state, animated icon swap) ────────────────
function ThemeToggle3({ mode, onChange }) {
  // mode: "light" | "dark" | "system"
  return (
    <div className="theme-segment" role="radiogroup" aria-label="Theme">
      <div className={`thumb ${mode}`} />
      <button className={`seg ${mode === "light" ? "active" : ""}`}  onClick={() => onChange("light")}  role="radio" aria-checked={mode === "light"}  title="Light"><IconSun size={14}/></button>
      <button className={`seg ${mode === "dark" ? "active" : ""}`}   onClick={() => onChange("dark")}   role="radio" aria-checked={mode === "dark"}   title="Dark"><IconMoon size={14}/></button>
      <button className={`seg ${mode === "system" ? "active" : ""}`} onClick={() => onChange("system")} role="radio" aria-checked={mode === "system"} title="System">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>
        </svg>
      </button>
    </div>
  );
}

// Single-icon toggle with rotate-swap
function ThemeToggleIcon({ mode, onChange }) {
  return (
    <button className="theme-icon" data-mode={mode} aria-label="Toggle theme"
            onClick={() => onChange(mode === "dark" ? "light" : "dark")}>
      <IconSun size={15} className="icon-sun" />
      <IconMoon size={15} className="icon-moon" />
    </button>
  );
}

Object.assign(window, {
  AlertDialog, useToasts, ToastStack,
  NewProjectDialog, NewCycleDialog, NewTypeDialog, ManageCasesDialog,
  SettingsMenu, ProjectMenu, DateRangePopover,
  UpdateBanner, KbdShortcutsOverlay,
  ThemeToggle3, ThemeToggleIcon,
  useClickOutside, fmtDisplay, fmtDate,
});
