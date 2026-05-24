/**
 * OCTANE v5 — Dashboard App
 * Inter-Existential Engine Control Interface
 */
import { renderDashboard }  from './screens/dashboard.js';
import { renderSRC }        from './screens/src.js';
import { renderCBE }        from './screens/cbe.js';
import { renderELX }        from './screens/elx.js';
import { renderOAN }        from './screens/oan.js';
import { renderFlows }      from './screens/flows.js';
import { renderGovernance } from './screens/governance.js';
import { renderMetrics }    from './screens/metrics.js';

const BASE_URL = '';  // Set to your CF Worker URL in production

const SCREENS = {
  dashboard:  { title: 'Command Center',       render: renderDashboard },
  src:        { title: 'Stellar Reach Conduit', render: renderSRC },
  cbe:        { title: 'Civilization Bridge Engine', render: renderCBE },
  elx:        { title: 'Existence Lattice',    render: renderELX },
  oan:        { title: 'Operator Ascension Node', render: renderOAN },
  flows:      { title: 'Flow Models',          render: renderFlows },
  governance: { title: 'Governance & Sovereignty', render: renderGovernance },
  metrics:    { title: 'Engine Metrics',       render: renderMetrics },
};

const SIMPLE_SCREENS = ['signals','bridges','decrees','ethics','settings'];

let currentScreen = 'dashboard';
let engineState   = 'DORMANT';
let startedAt     = null;

// ── Init ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initNav();
  initIgniteBtn();
  updateEpoch();
  setInterval(updateEpoch, 1000);
  navigate('dashboard');
});

function initNav() {
  document.querySelectorAll('.nav-item[data-screen]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.screen));
  });
}

function initIgniteBtn() {
  document.getElementById('igniteBtn').addEventListener('click', async () => {
    if (engineState === 'STELLAR') return;
    engineState = 'IGNITING';
    updateStatus();
    await new Promise(r => setTimeout(r, 800));
    engineState = 'STELLAR';
    startedAt   = Date.now();
    updateStatus();
    document.getElementById('igniteBtn').textContent = '✦ ENGINE STELLAR';
    document.getElementById('igniteBtn').style.borderColor = 'var(--stellar)';
    document.getElementById('igniteBtn').style.color = 'var(--stellar)';
    if (currentScreen === 'dashboard') navigate('dashboard');
  });
}

function navigate(screen) {
  currentScreen = screen;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.screen === screen));

  const def = SCREENS[screen];
  const title = def ? def.title : screen.charAt(0).toUpperCase() + screen.slice(1);
  document.getElementById('screenTitle').textContent = title;

  const content = document.getElementById('content');
  if (def) {
    content.innerHTML = def.render({ engineState, startedAt, baseUrl: BASE_URL });
  } else {
    content.innerHTML = renderSimpleScreen(screen);
  }
}

function renderSimpleScreen(screen) {
  return `<div class="card"><div class="card-title">◎ ${screen.toUpperCase()}</div><p style="color:var(--text-dim);font-size:12px;">This panel is available in the deployed engine instance.</p></div>`;
}

function updateStatus() {
  const dot   = document.getElementById('engineDot');
  const label = document.getElementById('engineStateLabel');
  label.textContent = engineState;
  dot.className = 'status-dot ' + engineState.toLowerCase();
}

function updateEpoch() {
  const el = document.getElementById('epochLabel');
  if (el) el.textContent = `EPOCH: ${Date.now()}`;
}

// Expose for screens
window.octane = { engineState: () => engineState, startedAt: () => startedAt };
