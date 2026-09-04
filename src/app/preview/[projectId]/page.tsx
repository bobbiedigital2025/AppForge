import { getProject } from '@/lib/agents/pipeline';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = getProject(projectId);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Preview not available</h2>
          <p style={{ color: '#666' }}>Project not found or pipeline not started yet.</p>
        </div>
      </div>
    );
  }

  const { state, files, testResults, complianceChecks } = data;
  const specs = state.specs;
  const arch = state.architecture;
  const frontendFiles = files.filter(f => f.agent === 'frontend');
  const dbFiles = files.filter(f => f.agent === 'database');
  const beFiles = files.filter(f => f.agent === 'backend');
  const devopsFiles = files.filter(f => f.agent === 'devops');
  const docsFiles = files.filter(f => f.agent === 'docs');

  const tests = (testResults || []) as Array<{ testName: string; type: string; status: string; duration: number; error: string | null }>;
  const checks = (complianceChecks || []) as Array<{ name: string; status: string; details: string }>;

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const passedChecks = checks.filter(c => c.status === 'passed').length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;

  const statusColor = state.status === 'done' ? '#10b981' : state.status === 'failed' ? '#ef4444' : '#a855f7';
  const statusLabel = state.status === 'done' ? 'Build Complete' : state.status === 'failed' ? 'Build Failed' : 'Building...';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{state.name} — Live Preview</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; }
          .preview-header { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.75rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
          .preview-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; }
          .preview-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
          .preview-nav { display: flex; gap: 1.5rem; font-size: 0.875rem; color: #999; }
          .preview-nav a { color: #999; text-decoration: none; cursor: pointer; }
          .preview-nav a:hover { color: #fff; }
          .preview-hero { padding: 4rem 1.5rem; text-align: center; max-width: 900px; margin: 0 auto; }
          .preview-hero h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem; background: linear-gradient(135deg, #a78bfa, #f0abfc, #67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .preview-hero p { font-size: 1.25rem; color: #999; margin-bottom: 2rem; }
          .preview-cta { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 2rem; border-radius: 0.75rem; font-weight: 600; font-size: 1rem; background: linear-gradient(135deg, #7c3aed, #c026d3, #0891b2); color: #fff; border: none; cursor: pointer; }
          .preview-section { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
          .preview-section h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; }
          .feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
          .feature-card { padding: 1.25rem; border-radius: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
          .feature-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
          .feature-card p { font-size: 0.875rem; color: #888; }
          .priority-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 500; margin-bottom: 0.5rem; }
          .stack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
          .stack-item { display: flex; gap: 0.5rem; align-items: center; padding: 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); font-size: 0.875rem; }
          .stack-key { color: #666; text-transform: capitalize; }
          .stack-val { color: #ccc; font-weight: 500; }
          .routes-list { display: flex; flex-direction: column; gap: 0.5rem; }
          .route-item { display: flex; gap: 0.75rem; align-items: center; padding: 0.625rem 1rem; border-radius: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); font-size: 0.875rem; }
          .route-method { font-family: monospace; font-size: 0.75rem; font-weight: 700; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
          .route-path { font-family: monospace; color: #67e8f9; }
          .route-desc { color: #666; margin-left: auto; }
          .data-models { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
          .model-card { padding: 1rem; border-radius: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); }
          .model-card h4 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: #a78bfa; }
          .model-fields { font-size: 0.75rem; color: #888; font-family: monospace; }
          .file-list { display: flex; flex-direction: column; gap: 0.375rem; }
          .file-item { display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem 0.75rem; border-radius: 0.375rem; background: rgba(255,255,255,0.02); font-family: monospace; font-size: 0.8125rem; }
          .file-agent { font-size: 0.6875rem; padding: 0.0625rem 0.375rem; border-radius: 9999px; margin-left: auto; }
          .test-row { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.8125rem; }
          .status-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
          .progress-bar { height: 0.5rem; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden; margin: 1rem 0; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #c026d3); border-radius: 9999px; transition: width 0.5s ease; }
          .tab-bar { display: flex; gap: 0.5rem; padding: 0 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .tab { padding: 0.75rem 1rem; font-size: 0.875rem; color: #666; cursor: pointer; border-bottom: 2px solid transparent; }
          .tab.active { color: #fff; border-bottom-color: #a855f7; }
          .tab:hover { color: #ccc; }
          .preview-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 2rem 1.5rem; text-align: center; color: #444; font-size: 0.8125rem; }
          .live-indicator { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.6875rem; color: #10b981; }
          .live-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .meta-row { display: flex; gap: 1rem; font-size: 0.75rem; color: #666; margin-top: 0.5rem; }
          .meta-row span { display: flex; align-items: center; gap: 0.25rem; }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <header className="preview-header">
          <div className="preview-brand">
            <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, #7c3aed, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
              {state.name.slice(0, 2).toUpperCase()}
            </div>
            {state.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {state.status !== 'done' && (
              <span className="live-indicator">
                <span className="live-dot"></span>
                LIVE BUILD
              </span>
            )}
            <span className="preview-badge" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Progress */}
        <div className="preview-section" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
            <span>Build Progress</span>
            <span>{data.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${data.progress}%` }}></div>
          </div>
          <div className="meta-row">
            <span>Phase {state.currentPhase + 1}/7</span>
            <span>·</span>
            <span>{files.length} files generated</span>
            {data.ai?.connected && <><span>·</span><span>AI: {data.ai.model}</span></>}
          </div>
        </div>

        {/* Hero */}
        <section className="preview-hero">
          <h1>{state.name}</h1>
          <p>{specs?.summary || state.idea}</p>
          <button className="preview-cta">Get Started →</button>
          {specs && (
            <div className="meta-row" style={{ justifyContent: 'center' }}>
              <span>Target: {specs.targetAudience}</span>
              <span>·</span>
              <span>Monetization: {specs.monetization}</span>
              <span>·</span>
              <span>Marketplace: {specs.marketplace}</span>
            </div>
          )}
        </section>

        {/* Features */}
        {specs && specs.features.length > 0 && (
          <section className="preview-section">
            <h2>Features</h2>
            <div className="feature-grid">
              {specs.features.map((f, i) => (
                <div key={i} className="feature-card">
                  <span className="priority-badge" style={{
                    background: f.priority === 'critical' ? '#ef444420' : f.priority === 'high' ? '#f59e0b20' : '#6b728020',
                    color: f.priority === 'critical' ? '#ef4444' : f.priority === 'high' ? '#f59e0b' : '#9ca3af',
                  }}>{f.priority}</span>
                  <h3>{f.name}</h3>
                  <p>{f.description}</p>
                  <div style={{ fontSize: '0.6875rem', color: '#555', marginTop: '0.5rem' }}>{f.complexity} complexity</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tech Stack */}
        {specs && Object.keys(specs.techStack).length > 0 && (
          <section className="preview-section">
            <h2>Tech Stack</h2>
            <div className="stack-grid">
              {Object.entries(specs.techStack).map(([k, v]) => (
                <div key={k} className="stack-item">
                  <span className="stack-key">{k}:</span>
                  <span className="stack-val">{v}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Architecture: Page Routes */}
        {arch?.pageRoutes && arch.pageRoutes.length > 0 && (
          <section className="preview-section">
            <h2>Page Routes</h2>
            <div className="routes-list">
              {arch.pageRoutes.map((r, i) => (
                <div key={i} className="route-item">
                  <span className="route-method" style={{ background: '#7c3aed20', color: '#a78bfa' }}>PAGE</span>
                  <span className="route-path">{r.path}</span>
                  <span className="route-desc">{r.name} ({r.role})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Architecture: API Endpoints */}
        {arch?.apiEndpoints && arch.apiEndpoints.length > 0 && (
          <section className="preview-section">
            <h2>API Endpoints</h2>
            <div className="routes-list">
              {arch.apiEndpoints.map((e, i) => (
                <div key={i} className="route-item">
                  <span className="route-method" style={{
                    background: e.method === 'GET' ? '#10b98120' : e.method === 'POST' ? '#0891b220' : e.method === 'DELETE' ? '#ef444420' : '#f59e0b20',
                    color: e.method === 'GET' ? '#10b981' : e.method === 'POST' ? '#0891b2' : e.method === 'DELETE' ? '#ef4444' : '#f59e0b',
                  }}>{e.method}</span>
                  <span className="route-path">{e.path}</span>
                  <span className="route-desc">{e.description}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Architecture: Data Models */}
        {arch?.dataModels && arch.dataModels.length > 0 && (
          <section className="preview-section">
            <h2>Data Models</h2>
            <div className="data-models">
              {arch.dataModels.map((m, i) => (
                <div key={i} className="model-card">
                  <h4>{m.name}</h4>
                  <div className="model-fields">
                    {m.fields.map((f, j) => (
                      <div key={j}>{f.name}: {f.type}{f.references ? ` → ${f.references}` : ''}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Test Results */}
        {tests.length > 0 && (
          <section className="preview-section">
            <h2>Test Results ({passedTests} passed, {failedTests} failed)</h2>
            <div style={{ borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {tests.map((t, i) => (
                <div key={i} className="test-row">
                  <span className="status-dot" style={{ background: t.status === 'passed' ? '#10b981' : t.status === 'failed' ? '#ef4444' : '#666' }}></span>
                  <span style={{ color: '#ccc' }}>{t.testName}</span>
                  <span style={{ color: '#555', fontSize: '0.6875rem' }}>{t.type}</span>
                  <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.6875rem' }}>{t.duration}ms</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compliance Checks */}
        {checks.length > 0 && (
          <section className="preview-section">
            <h2>Compliance Audit ({passedChecks} passed, {failedChecks} failed)</h2>
            <div style={{ borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {checks.map((c, i) => (
                <div key={i} className="test-row">
                  <span className="status-dot" style={{ background: c.status === 'passed' ? '#10b981' : '#ef4444' }}></span>
                  <span style={{ color: '#ccc', fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto' }}>{c.details}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Generated Files */}
        {files.length > 0 && (
          <section className="preview-section">
            <h2>Generated Files ({files.length})</h2>
            <div className="file-list">
              {frontendFiles.map((f, i) => (
                <div key={`fe-${i}`} className="file-item">
                  <span style={{ color: '#67e8f9' }}>▶</span>
                  <span style={{ color: '#ccc' }}>{f.path}</span>
                  <span className="file-agent" style={{ background: '#67e8f920', color: '#67e8f9' }}>frontend</span>
                </div>
              ))}
              {beFiles.map((f, i) => (
                <div key={`be-${i}`} className="file-item">
                  <span style={{ color: '#a78bfa' }}>▶</span>
                  <span style={{ color: '#ccc' }}>{f.path}</span>
                  <span className="file-agent" style={{ background: '#a78bfa20', color: '#a78bfa' }}>backend</span>
                </div>
              ))}
              {dbFiles.map((f, i) => (
                <div key={`db-${i}`} className="file-item">
                  <span style={{ color: '#f59e0b' }}>▶</span>
                  <span style={{ color: '#ccc' }}>{f.path}</span>
                  <span className="file-agent" style={{ background: '#f59e0b20', color: '#f59e0b' }}>database</span>
                </div>
              ))}
              {devopsFiles.map((f, i) => (
                <div key={`do-${i}`} className="file-item">
                  <span style={{ color: '#10b981' }}>▶</span>
                  <span style={{ color: '#ccc' }}>{f.path}</span>
                  <span className="file-agent" style={{ background: '#10b98120', color: '#10b981' }}>devops</span>
                </div>
              ))}
              {docsFiles.map((f, i) => (
                <div key={`dc-${i}`} className="file-item">
                  <span style={{ color: '#ec4899' }}>▶</span>
                  <span style={{ color: '#ccc' }}>{f.path}</span>
                  <span className="file-agent" style={{ background: '#ec489920', color: '#ec4899' }}>docs</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deployment */}
        {state.deploymentUrl && (
          <section className="preview-section">
            <h2>Deployment</h2>
            <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Deployed to Vercel</span>
              <div style={{ marginTop: '0.5rem' }}>
                <a href={state.deploymentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9', textDecoration: 'underline', fontSize: '0.875rem' }}>
                  {state.deploymentUrl}
                </a>
              </div>
            </div>
          </section>
        )}

        <footer className="preview-footer">
          <p>{state.name} — Live preview by AppForge. Built with AI agents.</p>
          <p style={{ marginTop: '0.25rem' }}>Project ID: {state.id} · {files.length} files · {data.progress}% complete</p>
        </footer>

        {/* Auto-refresh script */}
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.parent === window) {
            // Standalone mode — auto-refresh every 3s while building
            setInterval(() => { window.location.reload(); }, 3000);
          }
        `}} />
      </body>
    </html>
  );
}
