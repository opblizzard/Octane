export function renderELX() {
  return `
  <div class="grid-4" style="margin-bottom:16px;">
    <div class="stat-tile"><div class="value glow-accent">0</div><div class="label">Lattice Nodes</div></div>
    <div class="stat-tile"><div class="value glow-stellar">100%</div><div class="label">Coherence</div></div>
    <div class="stat-tile"><div class="value">9</div><div class="label">Lattice Depth</div></div>
    <div class="stat-tile"><div class="value">10K</div><div class="label">Node Capacity</div></div>
  </div>
  <div class="card">
    <div class="card-title">◈ Existence Lattice — Layer Distribution</div>
    ${['CIVILIZATIONAL','EPOCHAL','CONTEXTUAL','INTER_SEAM'].map(l => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
          <span class="mono">${l}</span><span class="mono glow-accent">0 nodes</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-title">◎ Config</div>
    <table class="data-table">
      <tr><th>Parameter</th><th>Value</th></tr>
      <tr><td>Persistence Mode</td><td><span class="badge badge-accent">DURABLE</span></td></tr>
      <tr><td>Quantum Entanglement</td><td><span class="badge badge-stellar">ENABLED</span></td></tr>
      <tr><td>Coherence Interval</td><td class="mono">60,000 ms</td></tr>
    </table>
  </div>`;
}
