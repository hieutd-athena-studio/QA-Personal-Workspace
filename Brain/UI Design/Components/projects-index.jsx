// projects-index.jsx — Projects landing page

function ProjectsIndexPage({ openNewProject }) {
  const [projects, setProjects] = React.useState(PROJECTS);
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const openProject = (p) => {
    // The prototype only has one project page wired (Aurora). For others we
    // navigate too — they'll land on Project Detail showing Aurora's data.
    // In a real app, this would carry the project id through the URL.
    window.location.href = "Project Detail.html";
  };

  const removeProject = (p) => {
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
    setConfirmDelete(null);
  };

  return (
    <div className="idx-page">
      <div className="idx-scroll scroll">
        <div className="idx-inner">
          <header className="idx-head">
            <div className="text">
              <h1>Projects</h1>
              <div className="sub">
                <span>Open one to browse cases, plans, and cycles.</span>
                <span style={{ color: "var(--fg-faint)" }}>·</span>
                <span>Press <span className="kbd">⌘K</span> to jump anywhere.</span>
              </div>
            </div>
            <button className="btn primary" onClick={openNewProject}>
              <IconSparkle size={13} />New project
            </button>
          </header>

          {projects.length === 0 ? (
            <div className="idx-empty">
              <div className="icon"><IconLayers size={18} /></div>
              <h4>No projects yet</h4>
              <p>Create one to start tracking test cases and execution cycles.</p>
              <button className="btn primary" onClick={openNewProject}>
                <IconSparkle size={13} />Create your first project
              </button>
            </div>
          ) : (
            <div className="idx-list">
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  className="idx-row appearing"
                  style={{ animationDelay: `${Math.min(i, 7) * 30}ms` }}
                  onClick={() => openProject(p)}
                >
                  <div className="pswatch" style={{ background: p.color }} />
                  <span className="pprefix">{p.prefix}</span>
                  <div>
                    <div className="pname">{p.name}</div>
                    <div className="pdesc">{p.description}</div>
                  </div>
                  <div /> {/* spacer for 1fr */}
                  <div className="pstats">
                    <span><b>{p.cases}</b>cases</span>
                    <span><b>{p.plans}</b>plans</span>
                  </div>
                  <div className="pact" onClick={(e) => e.stopPropagation()}>
                    <button className="ghost-btn square" aria-label="Delete project"
                            onClick={() => setConfirmDelete(p)}>
                      <IconX size={14} />
                    </button>
                    <span className="chev" style={{ marginLeft: 4 }}><IconChevR size={16} /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <AlertDialog
          title={`Delete ${confirmDelete.name}?`}
          description={
            <>
              <strong>{confirmDelete.prefix} — {confirmDelete.name}</strong> and all its
              test cases, plans, and cycles will be removed. This can't be undone.
            </>
          }
          confirmLabel="Delete project"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeProject(confirmDelete)}
        />
      )}
    </div>
  );
}

Object.assign(window, { ProjectsIndexPage });
