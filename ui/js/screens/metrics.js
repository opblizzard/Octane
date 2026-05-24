export function renderMetrics({ startedAt }) {
  const uptime = startedAt ? Math.floor((Date.now()-startedAt)/1000) : 0;
  return `
  <div class="grid-4" style="margin-bottom:16px;">
    <div class="stat-tile"><div class="value glow-accent">0</div><div class="label">Total Signals</div></div>
    <div class="stat-tile"><div class="value">0</div><div class="label">Active Bridges</div></div>
    <div class="stat-tile"><div class="value">0</div><div class="label">Lattice Nodes</div></div>
    <div class="stat-tile"><div class="value glow-stellar">100%</div><div class="label">Coherence</div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">▦ Subsystem Health</div>
      ${['SRC','CBE','ELX','OAN'].map(s => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span class="mono badge badge-accent" style="width:40px;text-align:center">${s}</span>
          <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:100%;background:var(--stellar)"></div></div>
          <span class="badge badge-stellar">HEALTHY</span>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">▦ Engine Vitals</div>
      <table class="data-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>State</td><td><span class="badge badge-stellar">STELLAR</span></td></tr>
        <tr><td>Version</td><td class="mono">5.0.0-STELLAR</td></tr>
        <tr><td>Uptime</td><td class="mono">${uptime}s</td></tr>
        <tr><td>Operator Stage</td><td class="mono">1 / 7</td></tr>
        <tr><td>Active Flows</td><td class="mono">0</td></tr>
        <tr><td>Epoch</td><td class="mono">${Date.now()}</td></tr>
      </table>
    </div>
  </div>`;
}
