# OCTANE v5 — API Reference

## Engine

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Engine identity |
| GET | `/health` | Health check + subsystem status |
| GET | `/version` | Version info |
| GET | `/metrics` | Engine metrics |
| POST | `/engine/ignite` | Ignite the engine |
| POST | `/engine/contain` | Emergency containment |
| GET | `/engine/state` | Current engine state |
| GET | `/engine/session` | Operator session |

## SRC — Stellar Reach Conduit
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/src/state` | — | Conduit state |
| GET | `/src/conduits` | — | Active conduits |
| GET | `/src/bandwidth` | — | Available bandwidth |
| POST | `/src/reach` | `{layer, payload, operatorId?}` | Initiate reach |
| DELETE | `/src/seal/:id` | — | Seal a conduit |

## CBE — Civilization Bridge Engine
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/cbe/bridges` | — | Active bridges |
| POST | `/cbe/bridge/open` | `{fromCiv,toCiv,fromEpoch,toEpoch}` | Open bridge |
| POST | `/cbe/translate` | `{bridgeId, source}` | Translate content |
| DELETE | `/cbe/bridge/seal/:id` | — | Seal a bridge |
| GET | `/cbe/history` | — | Translation history |

## ELX — Existence Lattice
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/elx/write` | `{layer, contextId, data, weight?, ttl?}` | Write node |
| GET | `/elx/node/:id` | — | Read node |
| DELETE | `/elx/node/:id` | — | Delete node |
| POST | `/elx/query` | `{layer?, contextId?, minWeight?, limit, offset}` | Query nodes |
| POST | `/elx/entangle` | `{a, b}` | Entangle two nodes |
| GET | `/elx/snapshot` | — | Take lattice snapshot |
| GET | `/elx/coherence` | — | Coherence + node count |

## OAN — Operator Ascension Node
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/oan/stages` | — | All ascension stages |
| POST | `/oan/stage/advance` | `{session, operator}` | Advance stage |
| GET | `/oan/oath` | — | Retrieve the Operator Oath |
| POST | `/oan/oath/sign` | — | Sign the oath |
| POST | `/oan/decree` | `{operatorId, title, body}` | Issue decree |
| GET | `/oan/decrees` | — | Active decrees |
| POST | `/oan/ethics/check` | `{action}` | Run ethics check |

## Flow Models
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/flows/execute` | `{flow, initiatedBy?, context?}` | Execute any flow |
| POST | `/flows/primary-signal` | `{layer?, payload?}` | Primary signal flow |
| POST | `/flows/inter-existential` | `{fromCiv?, toCiv?}` | Bridge flow |
| POST | `/flows/emergency-containment` | `{reason?}` | Containment flow |
| POST | `/flows/operator-ascension` | `{stage?}` | Ascension flow |
| GET | `/flows` | — | All executions |
| GET | `/flows/active` | — | Active executions |
| GET | `/flows/:id` | — | Single execution |

## Governance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/governance/charter` | Ethics Charter text |
| GET | `/governance/lifecycle` | System lifecycle |
| GET | `/governance/access-policies` | All access tier policies |
| POST | `/governance/decree` | Issue decree |
| DELETE | `/governance/decree/:id` | Revoke decree |
| POST | `/governance/ethics/check` | Ethics check |
