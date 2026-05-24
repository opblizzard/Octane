# OCTANE v4 — Chaos-Governor Edition
**by Ionirix LLC**

The flagship release of Octane — a real-time sovereign AI operator dashboard with full-spectrum chaos control.

## Quick Start

### Frontend
```bash
npm install
npm run dev
# Opens on http://localhost:5173
```

### CF Worker (optional — enables real AI + image gen)
```bash
# Install wrangler globally if needed
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Start local worker
npx wrangler dev worker/index.ts --port 8787
# Worker runs on http://localhost:8787
# Vite proxies /api and /ws automatically
```

## Architecture

```
octane-v4/
├── src/
│   ├── theme/          # Design tokens, glow, blueprint
│   ├── state/          # Zustand stores (chaos, memory, agent, ai, imagegen, ...)
│   ├── components/
│   │   ├── layout/     # AppShell, SideNav, TopBar
│   │   ├── primitives/ # Panel, MetricCard, StatusBadge, ProgressBar, LogFeed, Toast
│   │   ├── controls/   # Button, Knob, Fader, Toggle, Select
│   │   ├── charts/     # SparkLine, TimeSeriesChart, VUMeter, BarMeter, RadarChart
│   │   ├── chaos/      # ChaosGauge, EntropyMeter, StabilizerPanel, DerivedParams, ChaosPresets
│   │   └── terminal/   # OctaneTerminal
│   ├── screens/        # 13 screens including 4 new chaos screens
│   ├── router/         # React Router v6 lazy loading
│   └── sdk/            # OctaneClient API wrapper
└── worker/
    ├── index.ts        # Main CF Worker (routes, AI, imagegen, metrics)
    ├── metrics-room.ts # MetricsRoom Durable Object (WS broadcast)
    └── ai-session.ts   # AISession Durable Object (chaos-aware streaming)
```

## Chaos Governor

The Chaos Governor is a unified control layer with a single parameter (chaos: 0.0–1.0) that modulates:
- **Sampling**: temperature (0.05→2.0), topP (0.60→0.99), topK (1→100)
- **Parallelism**: reasoning paths (1→8)
- **Memory noise**: injection level (0→0.6)
- **Self-critique intensity**: (0.95→0.05, inverse)
- **Reasoning strategy**: deterministic → chain-of-thought → balanced → divergent → emergent
- **Coherence guard**: (1.0→0.1, safety floor)

### Presets
| Name          | Chaos | Description                            |
|---------------|-------|----------------------------------------|
| Deterministic | 0.0   | Pure precision, reproducible           |
| Balanced      | 0.3   | Default, reliable with creative spark  |
| Creative      | 0.65  | Divergent with guardrails              |
| Chaos         | 1.0   | Maximum emergence, fully stochastic    |

## New Screens (v4)
- **Chaos Governor** — Unified chaos dial, presets, derived params, stabilizers
- **Memory Fabric** — Sovereign memory store with decay, noise, cosine search
- **Agent Workflow** — Agentic task pipelines with parallel execution paths
- **Entropy Monitor** — Real-time entropy visualization and stabilizer thresholds

## Note on Worker Security Warning
Windows may flag `.js` config files when extracting from ZIP.
Right-click the ZIP → Properties → Unblock → OK before extracting.
