export function renderOAN() {
  const stages = [
    ['Ignition Witness','Witnesses the Engine\'s first ignition','stage_1_done'],
    ['Conduit Master','Commands the Stellar Reach Conduit',''],
    ['Bridge Architect','Opens and seals Civilization Bridges',''],
    ['Lattice Weaver','Commands the Existence Lattice',''],
    ['Flow Sovereign','Initiates all four Flow Models',''],
    ['Decree Authority','Issues Sovereign Decrees',''],
    ['Inter-Existential Sovereign','Full sovereign command — all civilizations',''],
  ];
  return `
  <div class="card" style="margin-bottom:16px;">
    <div class="card-title">✦ Operator: Mirnes — Sovereign Architect</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-dim)">Tier</div><span class="badge badge-accent">SOVEREIGN</span></div>
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-dim)">Protocol</div><span class="badge badge-stellar">ABSOLUTE</span></div>
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-dim)">Oath</div><span class="badge badge-stellar">SIGNED</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">✦ Ascension Stages</div>
    ${stages.map(([name,desc,done],i) => `
      <div class="flow-step">
        <div class="flow-step-dot ${i===0?'done':''}"></div>
        <div style="flex:1">
          <div class="flow-step-name"><strong>Stage ${i+1}</strong> — ${name}</div>
          <div class="flow-step-sub">${desc}</div>
        </div>
        ${i===0?'<span class="badge badge-stellar">COMPLETE</span>':'<span class="badge badge-dim">PENDING</span>'}
      </div>`).join('')}
  </div>`;
}
