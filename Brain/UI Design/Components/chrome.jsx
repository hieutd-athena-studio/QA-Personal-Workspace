// chrome.jsx — Desktop window chrome (macOS / Windows)
// A thin titlebar around the whole app. The chrome is purely cosmetic —
// the brief calls for an Electron-style window for presentation.

const CHROME_STYLES = `
  .chrome {
    position: relative;
    width: 100%;
    height: 100%;
    background: #050507;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0px, 2vw, 24px);
    overflow: hidden;
  }
  .chrome::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139, 92, 246, 0.10), transparent 60%),
      radial-gradient(ellipse 50% 40% at 100% 100%, rgba(56, 189, 248, 0.06), transparent 60%);
    pointer-events: none;
  }
  .chrome-window {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 1440px;
    max-height: 920px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 30px 80px rgba(0, 0, 0, 0.55),
      0 8px 30px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  }

  /* ── macOS titlebar ─────────────────────────────────────────── */
  .titlebar-mac {
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
    border-bottom: 1px solid var(--border);
    user-select: none;
    -webkit-app-region: drag;
  }
  .traffic-lights { display: flex; gap: 8px; align-items: center; }
  .traffic-dot {
    width: 12px; height: 12px; border-radius: 50%;
    border: 0.5px solid rgba(0, 0, 0, 0.2);
  }
  .traffic-dot.close   { background: #ff5f57; }
  .traffic-dot.min     { background: #febc2e; }
  .traffic-dot.max     { background: #28c840; }
  .titlebar-title {
    flex: 1;
    text-align: center;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--fg-muted);
    letter-spacing: 0.01em;
  }
  .titlebar-spacer { width: 52px; }

  /* ── Windows titlebar ───────────────────────────────────────── */
  .titlebar-win {
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
    border-bottom: 1px solid var(--border);
    user-select: none;
    -webkit-app-region: drag;
  }
  .titlebar-win .titlebar-title {
    text-align: left;
    padding-left: 14px;
    flex: 1;
  }
  .win-controls { display: flex; height: 100%; }
  .win-btn {
    width: 46px; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--fg-muted);
    transition: background var(--motion-fast) var(--ease-out),
                color var(--motion-fast) var(--ease-out);
  }
  .win-btn:hover { background: rgba(255, 255, 255, 0.06); color: var(--fg); }
  .win-btn.close-btn:hover { background: #e81123; color: white; }
`;

function DesktopChrome({ os = "macos", title = "QA Workspace", children }) {
  React.useEffect(() => {
    if (document.getElementById("chrome-styles")) return;
    const el = document.createElement("style");
    el.id = "chrome-styles";
    el.textContent = CHROME_STYLES;
    document.head.appendChild(el);
  }, []);

  return (
    <div className="chrome">
      <div className="chrome-window">
        {os === "macos" ? (
          <div className="titlebar-mac">
            <div className="traffic-lights">
              <div className="traffic-dot close" />
              <div className="traffic-dot min" />
              <div className="traffic-dot max" />
            </div>
            <div className="titlebar-title">{title}</div>
            <div className="titlebar-spacer" />
          </div>
        ) : (
          <div className="titlebar-win">
            <div className="titlebar-title">{title}</div>
            <div className="win-controls">
              <div className="win-btn" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
              </div>
              <div className="win-btn" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
              </div>
              <div className="win-btn close-btn" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
              </div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesktopChrome });
