// project-detail.jsx — Project detail page with tabs
// Hero pane: Test Cases. Others are nicely stubbed.

// ─────────────────────────────────────────────────────────────
// Tab bar with sliding underline (CSS layout, no Framer needed)
// ─────────────────────────────────────────────────────────────
function TabBar({ tabs, value, onChange }) {
  const barRef = React.useRef(null);
  const [ind, setInd] = React.useState({ left: 0, width: 0 });

  React.useLayoutEffect(() => {
    const btn = barRef.current?.querySelector(`[data-key="${value}"]`);
    if (!btn) return;
    const parent = barRef.current.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setInd({ left: r.left - parent.left, width: r.width });
  }, [value, tabs.length]);

  React.useEffect(() => {
    const onResize = () => {
      const btn = barRef.current?.querySelector(`[data-key="${value}"]`);
      if (!btn) return;
      const parent = barRef.current.getBoundingClientRect();
      const r = btn.getBoundingClientRect();
      setInd({ left: r.left - parent.left, width: r.width });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value]);

  return (
    <div className="tab-bar" role="tablist" ref={barRef}>
      {tabs.map((t) => (
        <button
          key={t.key}
          data-key={t.key}
          role="tab"
          aria-selected={value === t.key}
          className="tab-btn"
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.badge != null && <span className="badge">{t.badge}</span>}
        </button>
      ))}
      <div className="tab-indicator" style={{ left: ind.left, width: ind.width }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cases pane — toolbar, grouped categories, selection action bar
// ─────────────────────────────────────────────────────────────
function CasesPane({ onOpenCase }) {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());
  const [collapsed, setCollapsed] = React.useState(new Set());

  // debounce for the searching indicator
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);
  const searching = query.trim() !== debounced.trim();

  const lc = debounced.trim().toLowerCase();
  const list = lc
    ? CATALOGUE.filter(
        (c) =>
          c.name.toLowerCase().includes(lc) ||
          c.display_id.toLowerCase().includes(lc) ||
          c.category.toLowerCase().includes(lc) ||
          c.subcategory.toLowerCase().includes(lc),
      )
    : CATALOGUE;

  // group by category > subcategory
  const grouped = React.useMemo(() => {
    const out = {};
    for (const c of CATALOGUE) {
      out[c.category] ??= {};
      out[c.category][c.subcategory] ??= [];
      out[c.category][c.subcategory].push(c);
    }
    return out;
  }, []);

  const toggleSel = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearSel = () => setSelected(new Set());

  const toggleCat = (cat) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  return (
    <div className="tab-pane scroll" style={{ position: "relative" }}>
      <div className="cases-toolbar">
        <div className={`search-input ${searching ? "searching" : ""}`}>
          <IconSearch size={14} />
          <input
            type="text"
            placeholder="Search test cases…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear" onClick={() => setQuery("")} aria-label="Clear search">
              <IconX size={12} />
            </button>
          )}
          <div className="pulse-line" />
        </div>

        <button className="btn subtle"><IconLayers size={13} />Category</button>
        <button className="btn subtle"><IconCorner size={13} />Import</button>
        <button className="btn subtle"><IconArrowR size={13} />Export</button>
        <div style={{ flex: 1 }} />
        <button className="btn primary"><IconSparkle size={13} />New case</button>
      </div>

      {lc ? (
        list.length === 0 ? (
          <div className="empty">
            <IconSearch size={20} style={{ color: "var(--fg-faint)" }} />
            <h4>No matches for “{debounced}”</h4>
            <p>Try a different query or clear the search.</p>
          </div>
        ) : (
          <div>
            <div className="search-meta">
              <strong>{list.length}</strong> case{list.length === 1 ? "" : "s"} matching “{debounced}”
            </div>
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "8px",
              background: "var(--surface-1)",
            }}>
              {list.map((c) => (
                <CaseRow
                  key={c.id} c={c}
                  selected={selected.has(c.id)}
                  onToggle={() => toggleSel(c.id)}
                  onOpen={() => onOpenCase?.(c)}
                  showMeta
                />
              ))}
            </div>
          </div>
        )
      ) : (
        Object.entries(grouped).map(([cat, subs]) => {
          const total = Object.values(subs).reduce((s, arr) => s + arr.length, 0);
          const isCollapsed = collapsed.has(cat);
          return (
            <section className="cat-section" key={cat}>
              <header className={`cat-head ${isCollapsed ? "collapsed" : ""}`}>
                <h3>{cat}</h3>
                <span className="cat-count">{total}</span>
                <button className="toggle" onClick={() => toggleCat(cat)} aria-label="Toggle">
                  <IconChevDown size={14} />
                </button>
              </header>
              {!isCollapsed &&
                Object.entries(subs).map(([sub, items]) => (
                  <div className="subcat" key={sub}>
                    <div className="subcat-head">
                      <span>{sub}</span>
                      <span className="ct">{items.length}</span>
                    </div>
                    {items.map((c) => (
                      <CaseRow
                        key={c.id} c={c}
                        selected={selected.has(c.id)}
                        onToggle={() => toggleSel(c.id)}
                        onOpen={() => onOpenCase?.(c)}
                      />
                    ))}
                  </div>
                ))}
            </section>
          );
        })
      )}

      {selected.size > 0 && <SelectionBar count={selected.size} onClear={clearSel} />}
    </div>
  );
}

function CaseRow({ c, selected, onToggle, onOpen, showMeta }) {
  return (
    <div
      className={`case-row ${selected ? "selected" : ""}`}
      onClick={(e) => {
        // checkbox toggles selection; row otherwise opens
        if (e.target.closest(".cb")) return;
        onOpen?.();
      }}
    >
      <button
        className="cb" onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        aria-label="Select case" aria-pressed={selected}
      >
        <IconCheck size={10} stroke={2.4} />
      </button>
      <span className="row-id">{c.display_id}</span>
      <span className="row-name">{c.name}</span>
      {showMeta && (
        <span className="row-meta">{c.category} · {c.subcategory}</span>
      )}
      <span className="row-ver">{c.version}</span>
    </div>
  );
}

function SelectionBar({ count, onClear }) {
  return (
    <div className="selbar-shell">
      <div className="selbar" role="toolbar" aria-label="Selection actions">
        <span className="count"><b>{count}</b> selected</span>
        <span className="vsep" />
        <button className="iconbtn" title="Add to test type"><IconLayers size={14} /></button>
        <button className="iconbtn" title="Move to subcategory"><IconCorner size={14} /></button>
        <button className="iconbtn" title="Duplicate"><IconLayers size={14} /></button>
        <button className="iconbtn danger" title="Delete"><IconX size={14} /></button>
        <span className="vsep" />
        <button className="iconbtn" onClick={onClear} title="Clear selection" aria-label="Clear selection">
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Other tab panes (stubs — clean but minimal)
// ─────────────────────────────────────────────────────────────
function DashboardPane() {
  return (
    <div className="tab-pane scroll">
      <div className="stat-grid">
        <Stat n={DASHBOARD.cases}   label="Test cases" sub="across 4 categories" />
        <Stat n={DASHBOARD.plans}   label="Test plans" sub="active" />
        <Stat n={DASHBOARD.cycles}  label="Cycles"     sub="6 in progress" />
        <Stat n={DASHBOARD.types}   label="Test types" sub="grouping cases" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div className="deadline-card">
          <h3>Upcoming deadlines</h3>
          {DASHBOARD.upcoming.map((p) => {
            const tone = p.days_to <= 1 ? "red" : p.days_to <= 7 ? "amber" : "";
            const dlabel = p.days_to <= 0 ? "Today" : p.days_to === 1 ? "1 day" : `${p.days_to} days`;
            return (
              <div className="deadline-row" key={p.id}>
                <div className={`urg ${tone}`} />
                <span className="id">{p.display_id}</span>
                <span className="name">{p.name}</span>
                <span className={`days ${tone}`}>{dlabel}</span>
              </div>
            );
          })}
        </div>
        <div className="deadline-card">
          <h3>Task budget</h3>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginTop: 4 }}>
            {DASHBOARD.task_budget.toFixed(2)}
            <span style={{ fontSize: 13, color: "var(--fg-muted)", fontWeight: 400, marginLeft: 6 }}>
              / {DASHBOARD.working_days} days
            </span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.55 }}>
            Total planned work across active test plans.
            {" "}<span style={{ color: "var(--fg-subtle)" }}>0.25-day granularity.</span>
          </div>
          <div style={{ marginTop: 12, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${(DASHBOARD.task_budget / DASHBOARD.working_days) * 100}%`, height: "100%", background: "var(--accent)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label, sub }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="num">{n}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

function PlansPane({ onOpenExecute }) {
  return (
    <div className="tab-pane scroll">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div className="eyebrow">All plans · {PLANS.length}</div>
        <div style={{ flex: 1 }} />
        <button className="btn primary"><IconSparkle size={13} />New plan</button>
      </div>

      {PLANS.map((p) => {
        const total = p.progress.pass + p.progress.fail + p.progress.blocked + p.progress.unexec;
        const pct = (n) => total === 0 ? 0 : (n / total) * 100;
        return (
          <div className="plan-row" key={p.id}>
            <div>
              <div className="pid">{p.display_id}</div>
            </div>
            <div>
              <div className="pname">{p.name}</div>
              <div className="pdesc">{p.description}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11.5, color: "var(--fg-subtle)" }}>
                <span>{p.start_date} → {p.end_date}</span>
                <span style={{ color: "var(--fg-faint)" }}>·</span>
                <span>{p.working_days} working days</span>
                <span style={{ color: "var(--fg-faint)" }}>·</span>
                <span>{p.cycles} cycle{p.cycles === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div>
              <div className="pprog">
                <div className="bar">
                  <i className="pass"    style={{ width: `${pct(p.progress.pass)}%` }} />
                  <i className="fail"    style={{ width: `${pct(p.progress.fail)}%` }} />
                  <i className="blocked" style={{ width: `${pct(p.progress.blocked)}%` }} />
                </div>
                <span className="num">{p.progress.pass + p.progress.fail + p.progress.blocked}/{total}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                <button className="btn subtle" onClick={onOpenExecute}><IconPlay size={11}/>Execute</button>
                <button className="btn subtle" onClick={() => { window.location.href = "Plan Detail.html"; }}>Open</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypesPane() {
  return (
    <div className="tab-pane scroll">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div className="eyebrow">Test types · {TYPES.length}</div>
        <div style={{ flex: 1 }} />
        <button className="btn primary"><IconSparkle size={13} />New type</button>
      </div>
      {TYPES.map((t) => (
        <div className="type-row" key={t.id}>
          <div>
            <div className="tname">{t.name}</div>
            <div className="tdesc">{t.description}</div>
          </div>
          <div className="tcount">
            <div className="bar"><i style={{ width: `${(t.assigned / t.total) * 100}%` }} /></div>
            <span className="nm">{t.assigned}/{t.total}</span>
          </div>
          <button className="btn subtle">Manage cases</button>
        </div>
      ))}
    </div>
  );
}

function ReportsPane() {
  return (
    <div className="tab-pane scroll">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div className="eyebrow">Reports</div>
        <div style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => { window.location.href = "Reports.html"; }}>
          <IconArrowR size={13} />Open Reports
        </button>
      </div>
      <div className="coming">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <IconLayers size={22} style={{ color: "var(--fg-faint)" }} />
        </div>
        <b>Reports</b> — single-cycle stats + multi-cycle comparison.
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--fg-subtle)" }}>
          5-stat row, dot-only comparison cells, mini stacked bar per cycle. Opens on its own page.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────
function ProjectDetailPage({ openPalette, onOpenExecute, onOpenCase }) {
  const [tab, setTab] = React.useState("cases");

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "cases",     label: "Test Cases", badge: CATALOGUE.length },
    { key: "plans",     label: "Plans & Cycles", badge: PLANS.length },
    { key: "types",     label: "Test Types", badge: TYPES.length },
    { key: "reports",   label: "Reports" },
  ];

  return (
    <div className="project-page">
      <div className="proj-head">
        <a className="back" href="Projects.html">
          <IconArrowL size={12} /> All projects
        </a>
        <div className="proj-id">
          <div className="proj-swatch" style={{ background: PROJECT.color }} />
          <div className="body">
            <div className="prefix">{PROJECT.prefix}</div>
            <h1>{PROJECT.name}</h1>
            <div className="desc">
              Direct-to-consumer e-commerce platform — web + mobile. QA coverage for cart,
              checkout, post-purchase, and admin flows ahead of the 2.4 release.
            </div>
          </div>
          <div className="actions">
            <button className="ghost-btn square" aria-label="More">
              <IconDots size={16} />
            </button>
          </div>
        </div>
      </div>

      <TabBar tabs={tabs} value={tab} onChange={setTab} />

      {tab === "dashboard" && <DashboardPane key="d" />}
      {tab === "cases"     && <CasesPane    key="c" onOpenCase={onOpenCase} />}
      {tab === "plans"     && <PlansPane    key="p" onOpenExecute={onOpenExecute} />}
      {tab === "types"     && <TypesPane    key="t" />}
      {tab === "reports"   && <ReportsPane  key="r" />}
    </div>
  );
}

Object.assign(window, { ProjectDetailPage });
