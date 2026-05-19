// overlays-app.jsx — Showcase page demoing every overlay/dialog/popover

const OVERLAYS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "macos",
  "accent": "#8b5cf6"
}/*EDITMODE-END*/;

function applyAccentO(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.setProperty("--accent-tint",  `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.setProperty("--accent-ring",  `rgba(${r}, ${g}, ${b}, 0.55)`);
}

function OCrumb() {
  return (
    <div className="crumb">
      <a href="Project Detail.html" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: "inherit", textDecoration: "none",
      }}>
        <div className="swatch" style={{ background: PROJECT.color }} />
        <span>{PROJECT.name}</span>
      </a>
      <span className="sep">›</span>
      <span className="here">Overlays &amp; dialogs</span>
    </div>
  );
}

// Card shell for the showcase grid
function ShowCard({ title, tag, desc, children }) {
  return (
    <div className="show-card">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="ttl">{title}</span>
        {tag && <span className="tag">{tag}</span>}
      </div>
      <div className="desc">{desc}</div>
      <div className="row">{children}</div>
    </div>
  );
}

// Update banner inline state cycle
function BannerDemo() {
  const [state, setState] = React.useState(null);

  // when "downloading" runs, fake progress
  React.useEffect(() => {
    if (state?.kind !== "downloading") return;
    let pct = state.percent ?? 0;
    const i = setInterval(() => {
      pct = Math.min(100, pct + 5);
      setState((s) => s?.kind === "downloading" ? { ...s, percent: pct } : s);
      if (pct >= 100) {
        clearInterval(i);
        setTimeout(() => setState({ kind: "downloaded" }), 400);
      }
    }, 220);
    return () => clearInterval(i);
  }, [state?.kind]);

  return (
    <>
      <UpdateBanner state={state} onDismiss={() => setState(null)} onInstall={() => setState(null)} />
      <div className="show-card" style={{ margin: "16px auto", maxWidth: 920 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="ttl">Update banner</span>
          <span className="tag">3.18</span>
        </div>
        <div className="desc">
          Sits between the header and content. Cycles available → downloading (with 2px progress line) → downloaded.
        </div>
        <div className="row">
          <button className="btn" onClick={() => setState({ kind: "available" })}>Available</button>
          <button className="btn" onClick={() => setState({ kind: "downloading", percent: 0 })}>Downloading…</button>
          <button className="btn" onClick={() => setState({ kind: "downloaded" })}>Downloaded</button>
          <button className="btn subtle" onClick={() => setState(null)}>Hide</button>
        </div>
      </div>
    </>
  );
}

// The settings + project popover demos use simple anchors
function MenuDemo() {
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openProject, setOpenProject] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  return (
    <>
      <ShowCard
        title="Settings menu" tag="3.15"
        desc="Header dropdown. Auto-update toggle, manual check (with spinner), shortcuts link."
      >
        <div className="popover-anchor">
          <button className="ghost-btn square" aria-label="Settings"
                  style={{ border: "1px solid var(--border-strong)" }}
                  onClick={() => setOpenSettings((v) => !v)}>
            <IconSettings size={15} />
          </button>
          <SettingsMenu open={openSettings}
                        onClose={() => setOpenSettings(false)}
                        onShowShortcuts={() => setShowShortcuts(true)} />
        </div>
        <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>Click the gear →</span>
      </ShowCard>

      <ShowCard
        title="Project ••• menu" tag="3.5"
        desc="Compresses Backup / Restore / Export / Delete out of the project header."
      >
        <div className="popover-anchor">
          <button className="btn" onClick={() => setOpenProject((v) => !v)}>
            <IconDots size={13} />
            Project actions
          </button>
          <ProjectMenu open={openProject} onClose={() => setOpenProject(false)} />
        </div>
      </ShowCard>

      {showShortcuts && <KbdShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </>
  );
}

function DateDemo() {
  const [range, setRange] = React.useState({ start: new Date("2026-05-12"), end: new Date("2026-05-22") });
  const [open, setOpen] = React.useState(false);

  const label = range.start && range.end
    ? `${fmtDisplay(range.start)} → ${fmtDisplay(range.end)}`
    : range.start
      ? `${fmtDisplay(range.start)} → …`
      : "Pick a date range";

  return (
    <ShowCard title="Date-range picker" tag="3.10"
              desc="Replaces dual native inputs. Two-month view, hover/range states, common presets.">
      <div className="popover-anchor">
        <button className="date-trigger" onClick={() => setOpen((v) => !v)}>
          <IconClock size={13} />
          {label}
          <span className="arrow"><IconChevDown size={12} /></span>
        </button>
        {open && (
          <DateRangePopover
            value={range}
            onChange={setRange}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </ShowCard>
  );
}

function DialogsRow({ pushToast }) {
  const [open, setOpen] = React.useState(null);
  // open: "newProject" | "newCycle" | "manage" | "newType" | "manageType" | "alert"

  return (
    <>
      <ShowCard title="New project" tag="3.3"
                desc="Prefix (auto-uppercased), name, description, color picker with 8 presets.">
        <button className="btn primary" onClick={() => setOpen("newProject")}>
          <IconSparkle size={13} />Open
        </button>
      </ShowCard>

      <ShowCard title="New cycle" tag="3.11"
                desc="Inside a plan: name + environment + build. Followed by Manage Assignments.">
        <button className="btn primary" onClick={() => setOpen("newCycle")}>
          <IconPlay size={11} />Open
        </button>
      </ShowCard>

      <ShowCard title="Manage cycle assignments" tag="3.11"
                desc="Checkbox list of every project case. Search, toggle-all, +/− summary in the footer.">
        <button className="btn" onClick={() => setOpen("manage")}>
          <IconLayers size={13} />Open
        </button>
      </ShowCard>

      <ShowCard title="New test type" tag="3.13"
                desc="Orthogonal grouping. Name + description.">
        <button className="btn primary" onClick={() => setOpen("newType")}>
          <IconSparkle size={13} />Open
        </button>
      </ShowCard>

      <ShowCard title="Manage type cases" tag="3.13"
                desc="Same visual pattern as Manage Assignments — keep the muscle memory.">
        <button className="btn" onClick={() => setOpen("manageType")}>
          <IconLayers size={13} />Open
        </button>
      </ShowCard>

      <ShowCard title="Delete confirmation" tag="3.8"
                desc="Radix AlertDialog — replaces window.confirm everywhere. Already wired on Test Case page.">
        <button className="btn danger" onClick={() => setOpen("alert")}>
          <IconX size={13} />Open
        </button>
      </ShowCard>

      {open === "newProject" && (
        <NewProjectDialog
          onClose={() => setOpen(null)}
          onCreate={(p) => { setOpen(null); pushToast(`Project ${p.prefix} created`, "success"); }}
        />
      )}
      {open === "newCycle" && (
        <NewCycleDialog
          onClose={() => setOpen(null)}
          onCreate={(c) => { setOpen(null); pushToast(`Cycle "${c.name}" created`, "success"); }}
        />
      )}
      {open === "manage" && (
        <ManageCasesDialog
          title="Manage cycle assignments"
          subtitle={`Select test cases to include in ${CYCLE.display_id} · ${CYCLE.name}.`}
          initialIds={CATALOGUE.slice(0, 11).map((c) => c.id)}
          onClose={() => setOpen(null)}
          onSave={(ids) => { setOpen(null); pushToast(`Updated assignments (${ids.length} cases)`, "success"); }}
        />
      )}
      {open === "newType" && (
        <NewTypeDialog
          onClose={() => setOpen(null)}
          onCreate={(t) => { setOpen(null); pushToast(`Type "${t.name}" created`, "success"); }}
        />
      )}
      {open === "manageType" && (
        <ManageCasesDialog
          title="Manage cases — Smoke"
          subtitle="Pick which cases belong to this test type."
          initialIds={["c1", "c9", "c14", "c16", "c24"]}
          onClose={() => setOpen(null)}
          onSave={(ids) => { setOpen(null); pushToast(`Smoke type now has ${ids.length} cases`, "success"); }}
        />
      )}
      {open === "alert" && (
        <AlertDialog
          title="Delete this cycle?"
          description={<><strong>{CYCLE.display_id} — {CYCLE.name}</strong> will be removed, including all run history. This can't be undone.</>}
          confirmLabel="Delete cycle"
          onCancel={() => setOpen(null)}
          onConfirm={() => { setOpen(null); pushToast("Cycle deleted", "success"); }}
        />
      )}
    </>
  );
}

function ToastDemo({ pushToast }) {
  return (
    <ShowCard title="Toast" tag="3.1"
              desc="Sonner-style, bottom-right, stagger if multiple. Auto-dismiss ~3s.">
      <button className="btn primary" onClick={() => pushToast("Test case AUR-114 updated", "success")}>Success</button>
      <button className="btn danger"  onClick={() => pushToast("Save failed — retrying…", "error")}>Error</button>
      <button className="btn" onClick={() => {
        ["Saved AUR-103", "Saved AUR-114", "Saved AUR-126"].forEach((m, i) =>
          setTimeout(() => pushToast(m, "success"), i * 250),
        );
      }}>Stagger 3</button>
    </ShowCard>
  );
}

function ThemeDemo() {
  const [mode, setMode] = React.useState("dark");
  return (
    <ShowCard title="Theme toggle" tag="3.16"
              desc="Animated icon swap (rotate + fade) and a 3-state segmented control (Light · Dark · System).">
      <ThemeToggleIcon mode={mode === "system" ? "dark" : mode}
                       onChange={(m) => setMode(m)} />
      <ThemeToggle3 mode={mode} onChange={setMode} />
      <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>Current: <span className="mono" style={{ color: "var(--fg)" }}>{mode}</span></span>
    </ShowCard>
  );
}

function OApp() {
  const [t, setTweak] = useTweaks(OVERLAYS_TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [toasts, pushToast] = useToasts();
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  React.useEffect(() => { applyAccentO(t.accent); }, [t.accent]);

  // ⌘K + ?
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen((v) => !v);
      } else if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault(); setShowShortcuts(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DesktopChrome os={t.chrome} title="Overlays — QA Workspace">
      <AppShell
        crumb={<OCrumb />}
        onOpenPalette={() => setPaletteOpen(true)}
        paletteOpen={paletteOpen}
        onClosePalette={() => setPaletteOpen(false)}
        palette={
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            onJumpToNextFailed={() => {}}
          />
        }
      >
        <div className="show-page">
          <BannerDemo />
          <div className="show-scroll scroll">
            <div className="show-head">
              <h1>Overlays &amp; dialogs</h1>
              <p>
                Every popup mentioned in the brief, on one page. Trigger each below — try
                <span className="kbd" style={{ margin: "0 4px" }}>?</span> for keyboard shortcuts.
              </p>
            </div>

            <div className="show-grid">
              <DialogsRow pushToast={pushToast} />
              <MenuDemo />
              <DateDemo />
              <ToastDemo pushToast={pushToast} />
              <ThemeDemo />
            </div>
          </div>

          {showShortcuts && <KbdShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
          <ToastStack items={toasts} />
        </div>
      </AppShell>

      <TweaksPanel>
        <TweakSection label="Window">
          <TweakRadio
            label="Chrome"
            value={t.chrome}
            options={[
              { value: "macos",   label: "macOS" },
              { value: "windows", label: "Windows" },
            ]}
            onChange={(v) => setTweak("chrome", v)}
          />
        </TweakSection>
        <TweakSection label="Project accent">
          <TweakColor
            label="Color"
            value={t.accent}
            options={["#8b5cf6", "#2563eb", "#0d9488", "#f59e0b", "#ec4899"]}
            onChange={(v) => setTweak("accent", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </DesktopChrome>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OApp />);
