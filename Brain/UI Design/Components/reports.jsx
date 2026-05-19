// reports.jsx — Reports page (Single cycle + Compare cycles)

// Synthetic per-case statuses across multiple cycles.
// Cycle 42 = our hero (mixed from ASSIGNMENTS).
// Cycle 41 = mostly pass (staging clean run).
// Cycle 40 = all unexec (regression, not yet started).
// Cycle 39 = older smoke pass (mixed, mostly pass).
const REPORT_CYCLES = [
  { id: "cy42", display_id: "AUR-CY-042", name: "Smoke Pass — Production", env: "Production", build: "checkout-web @ 2.4.0-rc.3" },
  { id: "cy41", display_id: "AUR-CY-041", name: "Smoke Pass — Staging",    env: "Staging",    build: "checkout-web @ 2.4.0-rc.2" },
  { id: "cy40", display_id: "AUR-CY-040", name: "Regression — Staging",    env: "Staging",    build: "checkout-web @ 2.4.0-rc.2" },
  { id: "cy39", display_id: "AUR-CY-039", name: "Smoke Pass — Production", env: "Production", build: "checkout-web @ 2.3.4" },
];

const STATUS_LABEL = { pass: "Pass", fail: "Fail", blocked: "Blocked", unexec: "Unexecuted" };

// Build a status map for each cycle keyed by case display_id.
// For cy42 we copy from ASSIGNMENTS (a9..). For others we synthesize realistic spreads.
const REPORT_DATA = (() => {
  // Pick a subset of CATALOGUE that we'll show in the report
  const cases = CATALOGUE.slice(0, 18);
  const seed = (n, statuses) => {
    // deterministic per-display_id offset so spreads are stable across renders
    const out = {};
    cases.forEach((c, i) => {
      out[c.display_id] = statuses[(i + n) % statuses.length];
    });
    return out;
  };
  return {
    cy42: (() => {
      const out = {};
      cases.forEach((c) => {
        const a = ASSIGNMENTS.find((x) => x.display_id === c.display_id);
        out[c.display_id] = a ? a.status : "unexec";
      });
      return out;
    })(),
    cy41: seed(1, ["pass", "pass", "pass", "pass", "fail", "pass", "pass", "pass"]),
    cy40: Object.fromEntries(cases.map((c) => [c.display_id, "unexec"])),
    cy39: seed(3, ["pass", "pass", "fail", "pass", "blocked", "pass", "pass", "pass", "pass"]),
  };
})();

function tally(map) {
  const t = { pass: 0, fail: 0, blocked: 0, unexec: 0, total: 0 };
  for (const k in map) { t[map[k]] = (t[map[k]] || 0) + 1; t.total++; }
  return t;
}

// ── Segmented tab ──────────────────────────────────────────────
function RepSegments({ value, options, onChange }) {
  const barRef = React.useRef(null);
  const [ind, setInd] = React.useState({ left: 2, width: 0 });
  React.useLayoutEffect(() => {
    const btn = barRef.current?.querySelector(`[data-key="${value}"]`);
    if (!btn) return;
    const parent = barRef.current.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setInd({ left: r.left - parent.left, width: r.width });
  }, [value]);
  return (
    <div className="rep-tabs" ref={barRef}>
      <div className="thumb" style={{ left: ind.left, width: ind.width }} />
      {options.map((o) => (
        <button key={o.key} data-key={o.key}
                className={`seg ${value === o.key ? "active" : ""}`}
                onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Single cycle pane ─────────────────────────────────────────
function SingleCycleReport({ cycleId }) {
  const cycle = REPORT_CYCLES.find((c) => c.id === cycleId) || REPORT_CYCLES[0];
  const map = REPORT_DATA[cycle.id] || {};
  const t = tally(map);
  const pct = (n) => t.total === 0 ? 0 : Math.round((n / t.total) * 100);

  const cases = CATALOGUE.filter((c) => c.display_id in map);

  return (
    <>
      <div className="stat-row">
        <div className="s">
          <div className="label">Total cases</div>
          <div className="num">{t.total}</div>
          <div className="sub">in this cycle</div>
        </div>
        <div className="s">
          <div className="label"><span className="dot pass" />Pass</div>
          <div className="num">{t.pass}<span className="num pct">{pct(t.pass)}%</span></div>
          <div className="sub">of total</div>
        </div>
        <div className="s">
          <div className="label"><span className="dot fail" />Fail</div>
          <div className="num">{t.fail}<span className="num pct">{pct(t.fail)}%</span></div>
          <div className="sub">{t.fail === 0 ? "no defects" : `${t.fail} defect${t.fail === 1 ? "" : "s"}`}</div>
        </div>
        <div className="s">
          <div className="label"><span className="dot blocked" />Blocked</div>
          <div className="num">{t.blocked}<span className="num pct">{pct(t.blocked)}%</span></div>
          <div className="sub">waiting on deps</div>
        </div>
        <div className="s">
          <div className="label"><span className="dot unexec" />Unexecuted</div>
          <div className="num">{t.unexec}<span className="num pct">{pct(t.unexec)}%</span></div>
          <div className="sub">{t.unexec === 0 ? "complete" : "remaining"}</div>
        </div>
      </div>

      <div className="plan-section-head" style={{ marginBottom: 14 }}>
        <h3>Per-case breakdown</h3>
        <span className="helper">Sorted by execution order. Click an ID to open the case.</span>
      </div>

      <div className="case-bd-table">
        {cases.map((c) => {
          const st = map[c.display_id];
          return (
            <div className="case-bd-row" key={c.display_id}>
              <span className={`dot ${st}`} />
              <span className="id">{c.display_id}</span>
              <span className="nm">{c.name}</span>
              <span className="ver">{c.version}</span>
              <span className="when">
                {st === "unexec" ? "—" : st === "blocked" ? "blocked" : "executed"}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

Object.assign(window, { RepSegments, SingleCycleReport, REPORT_CYCLES, REPORT_DATA, tally });
