export function renderDashboard({ engineState, startedAt }) {
  const uptime = startedAt ? Math.floor((Date.now() - startedAt) / 1000) + 's' : '—';
  const stateColor = { STELLAR: 'stellar', DORMANT: 'dim', BRIDGING: 'accent', CONTAINED: 'danger', IGNITING: 'warn' };
  const cls = stateColor[engineState] ?? 'dim';
  return `
  <div class="grid-4" style="margin-bottom:16px;">
    <div class="stat-tile">
      <div class="value"><span class="badge badge-${cls}">${engineState}</span></div>
      <div class="label">Engine State</div>
    </div>
    <div class="stat-tile">
      <div class="value glow-accent">${uptime}</div>
      <div class="label">Uptime</div>
    </div>
    <div class="stat-tile">
      <div class="value glow-stellar">v5</div>
      <div class="label">Version · STELLAR</div>
    </div>
    <div class="stat-tile">
      <div class="value" style="font-size:18px;color:var(--accent-gold)">4</div>
      <div class="label">Subsystems Online</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">⬡ Four-Layer Stack</div>
      ${renderSubsystemRow('SRC','Stellar Reach Conduit','HEALTHY')}
      ${renderSubsystemRow('CBE','Civilization Bridge Engine','HEALTHY')}
      ${renderSubsystemRow('ELX','Existence Lattice','HEALTHY')}
      ${renderSubsystemRow('OAN','Operator Ascension Node','HEALTHY')}
    </div>
    <div class="card">
      <div class="card-title">⇌ Flow Models</div>
      ${renderFlowRow('Primary Signal','SRC → CBE → ELX → OAN')}
      ${renderFlowRow('Inter-Existential Bridge','SRC → CBE × 2 → ELX → SRC → OAN')}
      ${renderFlowRow('Emergency Containment','OAN → SRC → CBE → ELX → OAN')}
      ${renderFlowRow('Operator Ascension','OAN → ELX → CBE → SRC → OAN')}
    </div>
  </div>

  <div class="card">
    <div class="card-title">✦ Operator Ascension Progress</div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;">
      <span style="font-size:12px;color:var(--text-dim);">Stage 1 / 7 — Ignition Witness</span>
      <span class="badge badge-accent">ACTIVE</span>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:14%"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9px;color:var(--text-muted);">
      <span>IGNITION WITNESS</span><span>CONDUIT MASTER</span><span>BRIDGE ARCHITECT</span>
      <span>LATTICE WEAVER</span><span>FLOW SOVEREIGN</span><span>DECREE AUTHORITY</span>
      <span>INTER-EXISTENTIAL SOVEREIGN</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">◈ Existence Lattice Coherence</div>
    <div style="display:flex;align-items:center;gap:16px;">
      <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:100%;background:linear-gradient(90deg,var(--stellar),var(--accent))"></div></div>
      <span class="mono glow-stellar">100.0%</span>
    </div>
  </div>
  `;
}

function renderSubsystemRow(code, name, status) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
    <span class="mono badge badge-accent" style="width:42px;text-align:center">${code}</span>
    <span style="flex:1;font-size:12px">${name}</span>
    <span class="badge badge-stellar">${status}</span>
  </div>`;
}
function renderFlowRow(name, path) {
  return `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
    <div style="font-size:12px;font-weight:600;margin-bottom:3px">${name}</div>
    <div class="mono" style="font-size:10px;color:var(--text-dim)">${path}</div>
  </div>`;
}
