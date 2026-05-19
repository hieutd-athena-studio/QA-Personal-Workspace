// test-case-form.jsx — Test case edit form
// AlertDialog, useToasts, ToastStack live in overlays.jsx

// ── Step rows with drag-to-reorder ───────────────────────────
function StepRow({ step, index, total, isNew, onChange, onRemove, draggingIdx, dropIdx,
                  onDragStart, onDragOver, onDrop, onDragEnd }) {
  const dragging = draggingIdx === index;
  const dropTarget = dropIdx === index && draggingIdx !== index && draggingIdx != null;
  return (
    <div
      className={`step-row ${dragging ? "dragging" : ""} ${dropTarget ? "drop-target" : ""} ${isNew ? "new" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="step-handle" title="Drag to reorder">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
          <circle cx="2" cy="7" r="1.2"/><circle cx="8" cy="7" r="1.2"/>
          <circle cx="2" cy="12" r="1.2"/><circle cx="8" cy="12" r="1.2"/>
        </svg>
      </div>
      <div className="step-num">{index + 1}</div>
      <div className="step-col">
        <div className="lbl">Action</div>
        <textarea
          value={step.action}
          placeholder="Describe the action taken…"
          rows={2}
          onChange={(e) => onChange("action", e.target.value)}
        />
      </div>
      <div className="step-col">
        <div className="lbl">Expected</div>
        <textarea
          value={step.expected}
          placeholder="What the system should do…"
          rows={2}
          onChange={(e) => onChange("expected", e.target.value)}
        />
      </div>
      <button
        className="step-remove"
        onClick={onRemove}
        disabled={total <= 1}
        aria-label="Remove step"
        title="Remove step"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
function TestCasePage({ initial: initProp, onNameChange }) {
  // Deep-clone so local edits don't mutate the data module
  const initial = React.useMemo(
    () => JSON.parse(JSON.stringify(initProp || ASSIGNMENTS[8])),
    [initProp],
  );

  const [tc, setTc] = React.useState(initial);
  const [newStepIds, setNewStepIds] = React.useState(new Set());
  const [savingState, setSavingState] = React.useState("idle");   // idle | saving | saved
  const [lastSavedAgo, setLastSavedAgo] = React.useState("just now");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [toasts, pushToast] = useToasts();

  // drag state
  const [draggingIdx, setDraggingIdx] = React.useState(null);
  const [dropIdx, setDropIdx] = React.useState(null);

  // Subcategory option groups, derived from the data so the current value
  // is always present even if it wasn't in a hand-coded list.
  const subcatGroups = React.useMemo(() => {
    const grouped = {};
    for (const c of CATALOGUE) {
      grouped[c.category] ??= new Set();
      grouped[c.category].add(c.subcategory);
    }
    grouped[tc.category] ??= new Set();
    grouped[tc.category].add(tc.subcategory);
    return Object.entries(grouped).map(([cat, subs]) => ({
      cat,
      subs: [...subs].sort(),
    }));
  }, [tc.category, tc.subcategory]);

  // mark "dirty" → debounced save
  const dirtyRef = React.useRef(false);
  const update = React.useCallback((patch) => {
    setTc((prev) => ({ ...prev, ...patch }));
    dirtyRef.current = true;
    if (patch.name != null) onNameChange?.(patch.name);
  }, [onNameChange]);

  // Debounced auto-save (simulated)
  React.useEffect(() => {
    if (!dirtyRef.current) return;
    setSavingState("saving");
    const t = setTimeout(() => {
      dirtyRef.current = false;
      setSavingState("saved");
      setLastSavedAgo("just now");
    }, 700);
    return () => clearTimeout(t);
  }, [tc]);

  // age the "saved" caption
  React.useEffect(() => {
    if (savingState !== "saved") return;
    const start = Date.now();
    const i = setInterval(() => {
      const s = Math.round((Date.now() - start) / 1000);
      if (s < 5) setLastSavedAgo("just now");
      else if (s < 60) setLastSavedAgo(`${s}s ago`);
      else setLastSavedAgo(`${Math.floor(s / 60)}m ago`);
    }, 1000);
    return () => clearInterval(i);
  }, [savingState]);

  // step operations -----------------------------------
  const setStep = (i, key, value) => {
    setTc((prev) => {
      const steps = prev.steps.map((s, idx) => idx === i ? { ...s, [key]: value } : s);
      return { ...prev, steps };
    });
    dirtyRef.current = true;
  };

  const addStep = () => {
    const id = `s_${Date.now()}`;
    setTc((prev) => ({ ...prev, steps: [...prev.steps, { _id: id, action: "", expected: "" }] }));
    setNewStepIds((s) => new Set(s).add(id));
    setTimeout(() => setNewStepIds((s) => { const n = new Set(s); n.delete(id); return n; }), 220);
    dirtyRef.current = true;
  };

  const removeStep = (i) => {
    if (tc.steps.length <= 1) return;
    setTc((prev) => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== i) }));
    dirtyRef.current = true;
  };

  // drag-reorder ---------------------------------------
  const onDragStart = (e, i) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
    setDraggingIdx(i);
  };
  const onDragOver = (e, i) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropIdx !== i) setDropIdx(i);
  };
  const onDrop = (e, i) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from) || from === i) { setDraggingIdx(null); setDropIdx(null); return; }
    setTc((prev) => {
      const next = [...prev.steps];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return { ...prev, steps: next };
    });
    dirtyRef.current = true;
    setDraggingIdx(null);
    setDropIdx(null);
  };
  const onDragEnd = () => { setDraggingIdx(null); setDropIdx(null); };

  // delete -----------------------------------------------
  const handleDelete = () => {
    setConfirmDelete(false);
    pushToast("Test case deleted", "success");
    setTimeout(() => { window.location.href = "Project Detail.html"; }, 700);
  };

  return (
    <div className="tc-page">
      <div className="tc-scroll scroll">
        <div className="inner">
          <a className="tc-back" href="Project Detail.html">
            <IconArrowL size={11} />
            <span>{PROJECT.name}</span>
            <span className="sep">›</span>
            <span className="here">Test cases</span>
          </a>

          <header className="tc-head">
            <span className="id-pill">{tc.display_id}</span>
            <div className="body">
              <input
                className="h1-input"
                value={tc.name}
                onChange={(e) => update({ name: e.target.value })}
                spellCheck={false}
                aria-label="Case name"
              />
              <div className="meta-row">
                <span className="pill mono">{tc.version}</span>
                <span className="cat-pill">
                  {tc.category}
                  <span className="sep">›</span>
                  {tc.subcategory}
                </span>
                <span style={{ flex: 1 }} />
                <div className={`saved ${savingState === "saving" ? "saving" : ""}`}>
                  <span className="dot" />
                  {savingState === "saving" ? "Saving…" : `Saved ${lastSavedAgo}`}
                </div>
              </div>
            </div>
            <div className="actions">
              <button className="btn danger" onClick={() => setConfirmDelete(true)}>
                <IconX size={13} />
                Delete
              </button>
            </div>
          </header>

          <hr className="tc-divider" />

          {/* ── Basic info ──────────────────────────────────────── */}
          <section className="tc-section">
            <div className="tc-section-head">
              <h3>Basic info</h3>
              <span className="helper">How the case appears in lists and reports.</span>
            </div>
            <div className="tc-fields">
              <div className="tc-row-2">
                <div className="tc-field">
                  <label htmlFor="subcategory">Subcategory</label>
                  <select
                    id="subcategory"
                    className="tc-select"
                    value={tc.subcategory}
                    onChange={(e) => update({ subcategory: e.target.value })}
                  >
                    {subcatGroups.map(({ cat, subs }) => (
                      <optgroup key={cat} label={cat}>
                        {subs.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="tc-field">
                  <label htmlFor="version">Version</label>
                  <input
                    id="version"
                    className="tc-input mono"
                    value={tc.version}
                    onChange={(e) => update({ version: e.target.value })}
                  />
                </div>
              </div>
              <div className="tc-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="tc-textarea"
                  value={tc.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                />
                <div className="hint">Plain-language summary. Markdown isn't rendered here yet.</div>
              </div>
              <div className="tc-field">
                <label htmlFor="expected">Expected result</label>
                <textarea
                  id="expected"
                  className="tc-textarea"
                  value={tc.expected_result}
                  onChange={(e) => update({ expected_result: e.target.value })}
                  rows={3}
                />
                <div className="hint">The single authoritative "what should happen" statement.</div>
              </div>
            </div>
          </section>

          <hr className="tc-divider" />

          {/* ── Steps ───────────────────────────────────────────── */}
          <section className="tc-section">
            <div className="tc-section-head">
              <h3>Test steps</h3>
              <span className="count">{tc.steps.length}</span>
              <span className="helper">Drag the handle to reorder.</span>
            </div>

            <div className="tc-steps">
              {tc.steps.map((s, i) => (
                <StepRow
                  key={s._id || `${i}-${s.action.slice(0, 8)}`}
                  step={s}
                  index={i}
                  total={tc.steps.length}
                  isNew={s._id && newStepIds.has(s._id)}
                  onChange={(key, val) => setStep(i, key, val)}
                  onRemove={() => removeStep(i)}
                  draggingIdx={draggingIdx}
                  dropIdx={dropIdx}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>

            <button className="add-step" onClick={addStep}>
              <IconSparkle size={13} />
              Add step
            </button>
          </section>
        </div>
      </div>

      {confirmDelete && (
        <AlertDialog
          title="Delete this test case?"
          description={
            <>
              <strong>{tc.display_id} — {tc.name}</strong> will be removed from this project, including its steps and any cycle assignments. This can't be undone.
            </>
          }
          confirmLabel="Delete case"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      <ToastStack items={toasts} />
    </div>
  );
}

Object.assign(window, { TestCasePage });
