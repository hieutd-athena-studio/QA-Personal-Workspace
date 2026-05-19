// plan-detail.jsx — Plan detail page (form + TestCyclesPanel)

const PLAN_TASKS_INITIAL = [
  { id: "k1", name: "Cart smoke sweep",                 duration: 1.0 },
  { id: "k2", name: "Guest checkout — happy path",      duration: 1.5 },
  { id: "k3", name: "Saved cards & autofill",           duration: 1.0 },
  { id: "k4", name: "Apple Pay / Google Pay",           duration: 1.0 },
  { id: "k5", name: "3DS challenges & card declines",   duration: 1.25 },
  { id: "k6", name: "EU billing + currency rounding",   duration: 1.0 },
  { id: "k7", name: "Post-purchase: emails + receipts", duration: 0.75 },
  { id: "k8", name: "Buffer / triage",                  duration: 0.5 },
];

const PLAN_CYCLES = [
  {
    id: "cy42", display_id: "AUR-CY-042", name: "Smoke Pass — Production",
    env: "Production",
    build: "checkout-web @ 2.4.0-rc.3",
    tester: "You",
    progress: { pass: 8, fail: 3, blocked: 2, unexec: 7 },
    isHero: true,
  },
  {
    id: "cy41", display_id: "AUR-CY-041", name: "Smoke Pass — Staging",
    env: "Staging",
    build: "checkout-web @ 2.4.0-rc.2",
    tester: "You",
    progress: { pass: 18, fail: 1, blocked: 0, unexec: 1 },
  },
  {
    id: "cy40", display_id: "AUR-CY-040", name: "Regression — Staging",
    env: "Staging",
    build: "checkout-web @ 2.4.0-rc.2",
    tester: "You",
    progress: { pass: 0, fail: 0, blocked: 0, unexec: 32 },
  },
];

function envClass(env) {
  return env === "Production" ? "prod" :
         env === "Staging"    ? "stage" :
         env === "Dev"        ? "dev" : "local";
}

// ── TestCyclesPanel ────────────────────────────────────────────
function TestCyclesPanel({ pushToast }) {
  const [cycles, setCycles] = React.useState(PLAN_CYCLES);
  const [newCycle, setNewCycle] = React.useState(false);
  const [manage, setManage] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);

  return (
    <section className="plan-section">
      <div className="plan-section-head">
        <h3>Test cycles</h3>
        <span className="count" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-faint)" }}>
          {cycles.length}
        </span>
        <span className="helper">Each cycle is one execution of this plan against a specific build.</span>
        <div className="right">
          <button className="btn primary" onClick={() => setNewCycle(true)}>
            <IconSparkle size={13} />New cycle
          </button>
        </div>
      </div>

      <div className="cycle-list">
        {cycles.map((c) => {
          const total = c.progress.pass + c.progress.fail + c.progress.blocked + c.progress.unexec;
          const done = c.progress.pass + c.progress.fail + c.progress.blocked;
          const pct = (n) => total === 0 ? 0 : (n / total) * 100;
          return (
            <div className="cycle-card" key={c.id}>
              <span className="cycid">{c.display_id}</span>
              <div>
                <div className="cycname">
                  {c.name}
                  <span className={`env-pill ${envClass(c.env)}`}>{c.env}</span>
                </div>
                <div className="cycmeta">
                  <span className="mono">{c.build}</span>
                  <span style={{ color: "var(--fg-faint)" }}>·</span>
                  <span>Tester {c.tester}</span>
                </div>
                <div className="cycprog">
                  <div className="bar">
                    <i className="pass"    style={{ width: `${pct(c.progress.pass)}%` }} />
                    <i className="fail"    style={{ width: `${pct(c.progress.fail)}%` }} />
                    <i className="blocked" style={{ width: `${pct(c.progress.blocked)}%` }} />
                  </div>
                  <span className="num">{done}/{total}</span>
                </div>
              </div>
              <div className="cycactions">
                <button className="btn subtle" onClick={() => setManage(c)}>
                  <IconLayers size={13} />Manage cases
                </button>
                <button className="btn primary" onClick={() => { window.location.href = "Execution Page.html"; }}>
                  <IconPlay size={11} />Execute
                </button>
                <button className="ghost-btn square" aria-label="Delete cycle" onClick={() => setConfirmDel(c)}>
                  <IconX size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {newCycle && (
        <NewCycleDialog
          onClose={() => setNewCycle(false)}
          onCreate={(c) => {
            setNewCycle(false);
            const id = `cy${Date.now().toString(36).slice(-4)}`;
            const display_id = `AUR-CY-${String(43 + cycles.length).padStart(3, "0")}`;
            setCycles((arr) => [
              { id, display_id, name: c.name, env: c.env, build: c.build, tester: "You",
                progress: { pass: 0, fail: 0, blocked: 0, unexec: 0 } },
              ...arr,
            ]);
            pushToast(`Cycle ${display_id} created`, "success");
          }}
        />
      )}

      {manage && (
        <ManageCasesDialog
          title={`Manage cases — ${manage.display_id}`}
          subtitle={`Pick the test cases this cycle covers. ${manage.name}.`}
          initialIds={CATALOGUE.slice(0, 14).map((c) => c.id)}
          onClose={() => setManage(null)}
          onSave={(ids) => { setManage(null); pushToast(`Assignments updated (${ids.length} cases)`, "success"); }}
        />
      )}

      {confirmDel && (
        <AlertDialog
          title="Delete this cycle?"
          description={
            <>
              <strong>{confirmDel.display_id} — {confirmDel.name}</strong> will be removed, including all run history. This can't be undone.
            </>
          }
          confirmLabel="Delete cycle"
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            setCycles((arr) => arr.filter((c) => c.id !== confirmDel.id));
            setConfirmDel(null);
            pushToast(`${confirmDel.display_id} deleted`, "success");
          }}
        />
      )}
    </section>
  );
}

// ── Plan detail (form + cycles below) ─────────────────────────
function PlanDetailPage({ pushToast }) {
  const plan = PLANS[0];

  const [name, setName] = React.useState(plan.name);
  const [desc, setDesc] = React.useState(plan.description);
  const [range, setRange] = React.useState({ start: new Date(plan.start_date), end: new Date(plan.end_date) });
  const [tasks, setTasks] = React.useState(PLAN_TASKS_INITIAL);
  const [dateOpen, setDateOpen] = React.useState(false);

  // working_days: count of weekdays between start and end inclusive
  const workingDays = React.useMemo(() => {
    if (!range.start || !range.end) return 0;
    let n = 0;
    const d = new Date(range.start);
    while (d <= range.end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) n++;
      d.setDate(d.getDate() + 1);
    }
    return n;
  }, [range]);

  const taskTotal = tasks.reduce((s, t) => s + (Number(t.duration) || 0), 0);
  const over = taskTotal > workingDays;

  const updateTask = (id, key, value) =>
    setTasks((arr) => arr.map((t) => t.id === id ? { ...t, [key]: value } : t));

  const removeTask = (id) =>
    setTasks((arr) => arr.filter((t) => t.id !== id));

  const addTask = () =>
    setTasks((arr) => [...arr, { id: `k_${Date.now().toString(36)}`, name: "", duration: 0.5 }]);

  return (
    <div className="plan-page">
      <div className="plan-scroll scroll">
        <div className="plan-inner">
          <a className="tc-back" href="Project Detail.html">
            <IconArrowL size={11} />
            <span>{PROJECT.name}</span>
            <span className="sep">›</span>
            <span className="here">Plans &amp; cycles</span>
          </a>

          <header className="plan-head">
            <div className="pid-pill">{plan.display_id}</div>
            <input
              className="h1-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Plan name"
            />
          </header>

          {/* Description */}
          <section className="plan-section">
            <div className="plan-section-head">
              <h3>Description</h3>
              <span className="helper">A one-paragraph summary that surfaces on cards and reports.</span>
            </div>
            <textarea
              className="tc-textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              style={{ maxWidth: 720 }}
            />
          </section>

          <hr className="tc-divider" />

          {/* Schedule */}
          <section className="plan-section">
            <div className="plan-section-head">
              <h3>Schedule</h3>
              <span className="helper">Working days exclude weekends.</span>
            </div>
            <div className="dates-grid">
              <div className="tc-field">
                <label>Date range</label>
                <div className="popover-anchor">
                  <button className="date-trigger" onClick={() => setDateOpen((v) => !v)}>
                    <IconClock size={13} />
                    {range.start && range.end
                      ? `${fmtDisplay(range.start)} → ${fmtDisplay(range.end)}`
                      : "Pick a date range"}
                    <span className="arrow"><IconChevDown size={12} /></span>
                  </button>
                  {dateOpen && (
                    <DateRangePopover
                      value={range}
                      onChange={setRange}
                      onClose={() => setDateOpen(false)}
                    />
                  )}
                </div>
              </div>
              <div className="budget-card">
                <div className="lbl">Working days</div>
                <div className="top">
                  <span className="total">{workingDays}</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="tc-divider" />

          {/* Tasks */}
          <section className="plan-section">
            <div className="plan-section-head">
              <h3>Tasks</h3>
              <span className="helper">0.25-day granularity. Add or trim to fit the schedule.</span>
              <div className="right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className={`budget-card ${over ? "over" : ""}`} style={{ minWidth: 200, padding: "8px 12px" }}>
                  <div className="lbl" style={{ marginBottom: 4 }}>
                    {over ? "Over budget" : "Total vs budget"}
                  </div>
                  <div className="top">
                    <span className="total" style={{ fontSize: 18 }}>{taskTotal.toFixed(2)}</span>
                    <span className="of">/ {workingDays} days</span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, (taskTotal / Math.max(1, workingDays)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="task-list" style={{ marginTop: 14 }}>
              {tasks.map((t) => (
                <div className="task-row" key={t.id}>
                  <div className="handle">
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                      <circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
                      <circle cx="2" cy="7" r="1.2"/><circle cx="8" cy="7" r="1.2"/>
                      <circle cx="2" cy="12" r="1.2"/><circle cx="8" cy="12" r="1.2"/>
                    </svg>
                  </div>
                  <input
                    className="tname"
                    value={t.name}
                    placeholder="Task name…"
                    onChange={(e) => updateTask(t.id, "name", e.target.value)}
                  />
                  <div className="dur">
                    <input
                      type="number" step="0.25" min="0"
                      value={t.duration}
                      onChange={(e) => updateTask(t.id, "duration", Number(e.target.value))}
                    />
                    <span className="unit">days</span>
                  </div>
                  <button className="trm" aria-label="Remove task" onClick={() => removeTask(t.id)}>
                    <IconX size={13} />
                  </button>
                </div>
              ))}
              <button className="add-task" onClick={addTask}>
                <IconSparkle size={13} />
                Add task
              </button>
            </div>
          </section>

          <hr className="tc-divider" />

          {/* Cycles */}
          <TestCyclesPanel pushToast={pushToast} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlanDetailPage, TestCyclesPanel });
