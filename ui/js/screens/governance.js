export function renderGovernance() {
  const tiers = [
    { tier:'OUTER_RING', label:'Outer Ring', perms:['read:metrics','read:health','read:flows_list'] },
    { tier:'INNER_CIRCLE', label:'Inner Circle', perms:['read:*','execute:primary_signal','execute:inter_existential_bridge','query:lattice'] },
    { tier:'SOVEREIGN', label:'Sovereign', perms:['*'] },
  ];
  return `
  <div class="card">
    <div class="card-title">⚖ Ethics Charter — Article Summary</div>
    ${['Sovereign Purpose','Bridge Integrity','Lattice Sanctity','Emergency Containment','Operator Accountability','Lifecycle Integrity'].map((a,i) =>
      `<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;">
        <span class="badge badge-accent">Art. ${['I','II','III','IV','V','VI'][i]}</span>
        <span style="font-size:12px">${a}</span>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-title">⊞ Access Tiers</div>
    ${tiers.map(t => `
      <div style="margin-bottom:14px;padding:12px;background:var(--bg-panel);border-radius:8px;border:1px solid var(--border)">
        <span class="badge badge-accent" style="margin-bottom:8px;display:inline-block">${t.label}</span>
        <div class="mono" style="font-size:10px;color:var(--text-dim)">${t.perms.join(' · ')}</div>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-title">✉ Active Decrees</div>
    <div style="padding:12px;background:var(--bg-panel);border-radius:8px;">
      <div style="font-size:12px;font-weight:700;margin-bottom:4px">Founding Decree — OCTANE v5 STELLAR</div>
      <div style="font-size:11px;color:var(--text-dim);line-height:1.6">By sovereign authority, OCTANE v5 is hereby declared operational. The Inter-Existential Engine is ignited.</div>
      <div style="margin-top:8px;font-size:9px;color:var(--text-muted)">Issued: May 23, 2026 · Protocol: ABSOLUTE · Enforced: YES</div>
    </div>
  </div>`;
}
