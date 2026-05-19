// projects-app.jsx — Root for Projects index

const PI_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "macos",
  "accent": "#8b5cf6"
}/*EDITMODE-END*/;

function applyAccentPI(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.setProperty("--accent-tint",  `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.setProperty("--accent-ring",  `rgba(${r}, ${g}, ${b}, 0.55)`);
}

function PICrumb() {
  return (
    <div className="crumb">
      <span className="here">Projects</span>
    </div>
  );
}

function PIApp() {
  const [t, setTweak] = useTweaks(PI_TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [newProjOpen, setNewProjOpen] = React.useState(false);
  const [toasts, pushToast] = useToasts();

  React.useEffect(() => { applyAccentPI(t.accent); }, [t.accent]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNewProjOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DesktopChrome os={t.chrome} title="QA Workspace — Projects">
      <AppShell
        crumb={<PICrumb />}
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
        <ProjectsIndexPage openNewProject={() => setNewProjOpen(true)} />
      </AppShell>

      {newProjOpen && (
        <NewProjectDialog
          onClose={() => setNewProjOpen(false)}
          onCreate={(p) => {
            setNewProjOpen(false);
            pushToast(`Project ${p.prefix} created`, "success");
          }}
        />
      )}
      <ToastStack items={toasts} />

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

ReactDOM.createRoot(document.getElementById("root")).render(<PIApp />);
