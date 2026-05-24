export function renderSRC({ engineState }) {
  return `
  <div class="grid-3" style="margin-bottom:16px;">
    <div class="stat-tile"><div class="value glow-accent">0</div><div class="label">Active Conduits</div></div>
    <div class="stat-tile"><div class="value glow-stellar">500</div><div class="label">Bandwidth (sig/s)</div></div>
    <div class="stat-tile"><div class="value">7.0</div><div class="label">Reach Radius</div></div>
  </div>
  <div class="card">
    <div class="card-title">◎ Stellar Reach Conduit — State</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><div class="mono" style="font-size:10px;color:var(--text-dim)">STATUS</div><span class="badge badge-accent">IDLE</span></div>
      <div><div class="mono" style="font-size:10px;color:var(--text-dim)">STELLAR MAPPING</div><span class="badge badge-stellar">ENABLED</span></div>
      <div><div class="mono" style="font-size:10px;color:var(--text-dim)">AUTO AMPLIFY</div><span class="badge badge-stellar">ON</span></div>
      <div><div class="mono" style="font-size:10px;color:var(--text-dim)">AMPLIFY THRESHOLD</div><span class="mono">CRITICAL (3)</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">⬡ Reach Vector [Civ · Epoch · Context]</div>
    <div style="display:flex;gap:16px;">
      ${['CIVILIZATIONAL','EPOCHAL','CONTEXTUAL'].map((l,i) => `
        <div style="flex:1;text-align:center;">
          <div class="mono glow-accent" style="font-size:24px">0.0</div>
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-dim);margin-top:4px">${l}</div>
          <div class="progress-track" style="margin-top:8px"><div class="progress-fill" style="width:0%"></div></div>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-title">〜 Active Conduits</div>
    <p style="color:var(--text-dim);font-size:12px;">No active conduits. Ignite the engine and initiate a reach to open conduits.</p>
  </div>`;
}
