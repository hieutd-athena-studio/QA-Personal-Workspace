// project-app.jsx — Root for the Project Detail page

const PROJECT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "macos",
  "accent": "#8b5cf6"
}/*EDITMODE-END*/;

function applyAccentProject(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.setProperty("--accent-tint",  `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.setProperty("--accent-ring",  `rgba(${r}, ${g}, ${b}, 0.55)`);
}

function ProjectCrumb() {
  return (
    <div className="crumb">
      <a className="back-link" href="Projects.html" style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        color: "var(--fg-subtle)", textDecoration: "none",
      }}>
        <IconArrowL size={11} />
        <span>Projects</span>
      </a>
      <span className="sep">›</span>
      <div className="swatch" style={{ background: PROJECT.color }} />
      <span className="here">{PROJECT.name}</span>
    </div>
  );
}

function ProjectApp() {
  const [t, setTweak] = useTweaks(PROJECT_TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => { applyAccentProject(t.accent); }, [t.accent]);

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

  const openExecute = () => {
    window.location.href = "Execution Page.html";
  };

  const openCase = (c) => {
    window.location.href = `Test Case.html?id=${encodeURIComponent(c.display_id)}`;
  };

  return (
    <DesktopChrome os={t.chrome} title={`${PROJECT.name} — QA Workspace`}>
      <AppShell
        crumb={<ProjectCrumb />}
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
        <ProjectDetailPage onOpenCase={openCase} onOpenExecute={openExecute} />
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

ReactDOM.createRoot(document.getElementById("root")).render(<ProjectApp />);
