// test-case-app.jsx — Root for Test Case edit page

const TC_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "macos",
  "accent": "#8b5cf6"
}/*EDITMODE-END*/;

function applyAccentTC(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.setProperty("--accent-tint",  `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.setProperty("--accent-ring",  `rgba(${r}, ${g}, ${b}, 0.55)`);
}

// Resolve the case to show. Prefer rich ASSIGNMENTS data; fall back to
// CATALOGUE stub (no steps written yet) so any case from Project Detail
// opens into the form even if its full content hasn't been authored.
function resolveCase() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return ASSIGNMENTS.find((a) => a.display_id === "AUR-114");
  const a = ASSIGNMENTS.find((x) => x.display_id === id);
  if (a) return a;
  const c = CATALOGUE.find((x) => x.display_id === id);
  if (c) {
    return {
      id: c.id,
      display_id: c.display_id,
      name: c.name,
      version: c.version,
      category: c.category,
      subcategory: c.subcategory,
      description: "",
      expected_result: "",
      steps: [{ action: "", expected: "" }],
    };
  }
  return ASSIGNMENTS.find((a) => a.display_id === "AUR-114");
}

function TCCrumb({ name }) {
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
      <a href="Project Detail.html" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>Test cases</a>
      <span className="sep">›</span>
      <span className="here">{name}</span>
    </div>
  );
}

function TCApp() {
  const [t, setTweak] = useTweaks(TC_TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const tcase = React.useMemo(() => resolveCase(), []);
  // Track current name so the crumb updates as the user types.
  const [name, setName] = React.useState(tcase.name);

  React.useEffect(() => { applyAccentTC(t.accent); }, [t.accent]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Listen to bubbled name updates from the page via a small custom event.
  React.useEffect(() => {
    const onName = (e) => setName(e.detail);
    window.addEventListener("tcNameChange", onName);
    return () => window.removeEventListener("tcNameChange", onName);
  }, []);

  return (
    <DesktopChrome os={t.chrome} title={`${tcase.display_id} — ${PROJECT.name}`}>
      <AppShell
        crumb={<TCCrumb name={name} />}
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
        <TestCasePage initial={tcase} onNameChange={setName} />
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

ReactDOM.createRoot(document.getElementById("root")).render(<TCApp />);
