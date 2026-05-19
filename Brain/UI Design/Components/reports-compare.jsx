// reports-compare.jsx — Reports: Compare cycles + page root

// ── Compare cycles ────────────────────────────────────────────
function CompareCyclesReport() {
  const [selected, setSelected] = React.useState(["cy42", "cy41", "cy39"]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [picker, setPicker] = React.useState(false);

  const cycles = REPORT_CYCLES.filter((c) => selected.includes(c.id));
  const remaining = REPORT_CYCLES.filter((c) => !selected.includes(c.id));

  const cases = CATALOGUE.slice(0, 18);
  // filter rows
  const filtered = cases.filter((c) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "diff") {
      // show only rows where status differs between cycles
      const statuses = cycles.map((cy) => REPORT_DATA[cy.id]?.[c.display_id]);
      return new Set(statuses).size > 1;
    }
    return cycles.some((cy) => REPORT_DATA[cy.id]?.[c.display_id] === statusFilter);
  });

  const removeChip = (id) => setSelected((arr) => arr.filter((x) => x !== id));
  const addChip = (id) => { setSelected((arr) => [...arr, id]); setPicker(false); };

  // grid template: case col + 1 per cycle
  const gridTemplate = `2.2fr ${cycles.map(() => "minmax(60px, 1fr)").join(" ")}`;

  return (
    <>
      <div className="cycle-picker">
        <span className="lbl">Cycles</span>
        <div className="chip-bar" style={{ margin: 0 }}>
          {cycles.map((c) => (
            <span key={c.id} className="chip-tag" title={c.name}>
              {c.display_id}
              <button className="x" onClick={() => removeChip(c.id)} aria-label="Remove">
                <IconX size={11} />
              </button>
            </span>
          ))}
          {remaining.length > 0 && (
            <div className="popover-anchor">
              <button className="add-chip" onClick={() => setPicker((v) => !v)}>
                <IconSparkle size={11} />
                Add cycle
              </button>
              {picker && (
                <AddCyclePopover items={remaining} onPick={addChip} onClose={() => setPicker(false)} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-row">
        <RepSegments
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { key: "all",     label: "All cases" },
            { key: "diff",    label: "Differing" },
            { key: "fail",    label: "Has failures" },
            { key: "blocked", label: "Has blockers" },
            { key: "unexec",  label: "Has unexecuted" },
          ]}
        />
        <div style={{ flex: 1 }} />
        <button className="btn subtle"><IconArrowR size={13} />Export CSV</button>
      </div>

      <div className="cmp-wrap">
        <div className="cmp-grid">
          <div className="cmp-thead" style={{ gridTemplateColumns: gridTemplate }}>
            <div>Test case</div>
            {cycles.map((c) => (
              <div key={c.id} className="cmp-cell" title={c.name}>{c.display_id.replace("AUR-", "")}</div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 12.5 }}>
              No cases match this filter.
            </div>
          ) : (
            filtered.map((c) => (
              <div className="cmp-trow" key={c.id} style={{ gridTemplateColumns: gridTemplate }}>
                <div className="cmp-cell lead">
                  <span className="id">{c.display_id}</span>
                  <span className="nm">{c.name}</span>
                </div>
                {cycles.map((cy) => {
                  const st = REPORT_DATA[cy.id]?.[c.display_id] || "unexec";
                  return (
                    <div className="cmp-cell" key={cy.id}>
                      <span className={`cmp-dot ${st}`} data-label={STATUS_LABEL[st]} />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="plan-section-head" style={{ marginBottom: 0 }}>
        <h3>Cycle summary</h3>
        <span className="helper">P/F/B/U mix per cycle, with a stacked-bar visual.</span>
      </div>

      <div className="cmp-sum">
        <div className="row">
          <div>Cycle</div>
          <div className="n">Pass</div>
          <div className="n">Fail</div>
          <div className="n">Blocked</div>
          <div className="n">Open</div>
          <div>Mix</div>
        </div>
        {cycles.map((c) => {
          const t = tally(REPORT_DATA[c.id] || {});
          const w = (n) => t.total === 0 ? 0 : (n / t.total) * 100;
          return (
            <div className="row" key={c.id}>
              <div className="nm">
                <span className="id">{c.display_id}</span>
                {c.name}
              </div>
              <div className="n pass">{t.pass}</div>
              <div className="n fail">{t.fail}</div>
              <div className="n blocked">{t.blocked}</div>
              <div className="n">{t.unexec}</div>
              <div className="bar">
                <i className="pass"    style={{ width: `${w(t.pass)}%`    }} />
                <i className="fail"    style={{ width: `${w(t.fail)}%`    }} />
                <i className="blocked" style={{ width: `${w(t.blocked)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AddCyclePopover({ items, onPick, onClose }) {
  const ref = React.useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div className="popover left" ref={ref} style={{ minWidth: 280, top: "calc(100% + 6px)" }}>
      <div className="menu-label">Add to comparison</div>
      {items.map((c) => (
        <div key={c.id} className="menu-item" onClick={() => onPick(c.id)}>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)", minWidth: 76 }}>{c.display_id}</span>
          <span style={{ flex: 1 }}>{c.name}</span>
          <span className={`env-pill ${c.env === "Production" ? "prod" : c.env === "Staging" ? "stage" : "dev"}`}
                style={{ height: 16, fontSize: 10, padding: "0 6px" }}>
            {c.env}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ padding: 12, fontSize: 12, color: "var(--fg-subtle)" }}>All cycles already added.</div>
      )}
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────
function ReportsPage() {
  const [view, setView] = React.useState("single");
  const [singleCycleId, setSingleCycleId] = React.useState(REPORT_CYCLES[0].id);

  return (
    <div className="rep-page">
      <div className="rep-scroll scroll">
        <div className="rep-inner">
          <a className="tc-back" href="Project Detail.html">
            <IconArrowL size={11} />
            <span>{PROJECT.name}</span>
            <span className="sep">›</span>
            <span className="here">Reports</span>
          </a>

          <header className="rep-head">
            <h1>Reports</h1>
            <p>Single-cycle stats or compare cycle outcomes side-by-side.</p>
          </header>

          <RepSegments
            value={view}
            onChange={setView}
            options={[
              { key: "single",  label: "Single cycle" },
              { key: "compare", label: "Compare cycles" },
            ]}
          />

          {view === "single" ? (
            <>
              <div className="cycle-picker">
                <span className="lbl">Cycle</span>
                <select value={singleCycleId} onChange={(e) => setSingleCycleId(e.target.value)}>
                  {REPORT_CYCLES.map((c) => (
                    <option key={c.id} value={c.id}>{c.display_id} — {c.name}</option>
                  ))}
                </select>
                <div style={{ flex: 1 }} />
                <button className="btn subtle"><IconArrowR size={13} />Export CSV</button>
              </div>
              <SingleCycleReport cycleId={singleCycleId} />
            </>
          ) : (
            <CompareCyclesReport />
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CompareCyclesReport, ReportsPage });
