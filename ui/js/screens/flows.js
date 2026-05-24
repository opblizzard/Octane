export function renderFlows() {
  const flows = [
    { id:'PRIMARY_SIGNAL', name:'Primary Signal Flow', desc:'Standard four-layer signal processing through SRC → CBE → ELX → OAN.', steps:['SRC: Signal intake','CBE: Bridge check','ELX: Lattice write','OAN: Operator notify'] },
    { id:'INTER_EXISTENTIAL_BRIDGE', name:'Inter-Existential Bridge Flow', desc:'Cross-civilization and cross-epoch signal bridging with full translation.', steps:['SRC: Stellar lock','CBE: Bridge form','CBE: Translation','ELX: Context persist','SRC: Relay','OAN: Log'] },
    { id:'EMERGENCY_CONTAINMENT', name:'Emergency Containment Flow', desc:'Throttle conduits, seal bridges, and lock the lattice on dangerous signals.', steps:['OAN: Decree','SRC: Throttle','CBE: Seal','ELX: Snapshot+Lock','OAN: Confirm'] },
    { id:'OPERATOR_ASCENSION', name:'Operator Ascension Flow', desc:'Elevate the Operator through the ascension stages via cross-epoch bridging.', steps:['OAN: Verify','ELX: History load','CBE: Cross-epoch','SRC: Amplify','OAN: Unlock'] },
  ];
  return flows.map(f => `
    <div class="card">
      <div class="card-title">⇌ ${f.name}</div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:14px">${f.desc}</p>
      <div>${f.steps.map((s,i) => `<div class="flow-step"><div class="flow-step-dot"></div><span class="flow-step-sub">${i+1}.</span><span class="flow-step-name">${s}</span></div>`).join('')}</div>
    </div>`).join('');
}
