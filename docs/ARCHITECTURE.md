# Octane v6 Architecture

Octane v6 introduces the SENTINEL surveillance subsystem as a durable, edge-native monitoring layer.

## Runtime Shape

- The main worker exposes the existing Octane API surface and now exports `SurveillanceDO`.
- Surveillance endpoints are mounted under `/api/v6/surveillance` through the existing Hono router.
- The durable object keeps the planetary node snapshot and alert state in memory for local and edge execution.

## New Endpoints

- `GET /api/v6/surveillance/snapshot`
- `GET /api/v6/surveillance/nodes`
- `GET /api/v6/surveillance/alerts`
- `POST /api/v6/surveillance/alerts`

## Notes

- The surveillance system models 14 global server regions.
- The default snapshot starts with one degraded node at `ap-aus-1`.