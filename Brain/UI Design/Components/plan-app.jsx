// plan-app.jsx — Root for Plan Detail

const PD_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "macos",
  "accent": "#8b5cf6"
}/*EDITMODE-END*/;

function applyAccentPD(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-soft",  `rgba(${r}, ${g}, ${b}, 0.14)`);
  root.setProperty("--accent-tint",  `rgba(${r}, ${g}, ${b}, 0.08)`);
  root.setProperty("--accent-ring",  `rgba(${r}, ${g}, ${b}, 0.55)`);
}

function PDCrumb() {
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
      <a href="Project Detail.html" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>Plans &amp; cycles</a>
      <span className="sep">›</span>
      <span className="here">{PLANS[0].name}</span>
    </div>
  );
}

function PDApp() {
  const [t, setTweak] = useTweaks(PD_TWEAK_DEFAULTS);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [toasts, pushToast] = useToasts();

  React.useEffect(() => { applyAccentPD(t.accent); }, [t.accent]);

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

  return (
    <DesktopChrome os={t.chrome} title={`${PLANS[0].display_id} — ${PROJECT.name}`}>
      <AppShell
        crumb={<PDCrumb />}
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
        <PlanDetailPage pushToast={pushToast} />
      </AppShell>

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

ReactDOM.createRoot(document.getElementById("root")).render(<PDApp />);
