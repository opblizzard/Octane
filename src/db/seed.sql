-- OCTANE v5 — Seed Data
-- Sovereign Architect initial state

INSERT OR IGNORE INTO operators (
  id, handle, tier, sovereignty_level, ascension_progress,
  ignition_count, last_active, oath_signed, inner_circle, created_at
) VALUES (
  'op_SOVEREIGN_MIRNES_001',
  'Mirnes — Sovereign Architect',
  'SOVEREIGN', 'ABSOLUTE', 0.0, 0,
  strftime('%s','now') * 1000, 1, '[]',
  strftime('%s','now') * 1000
);

INSERT OR IGNORE INTO decrees (
  decre_id, issued_by, issued_at, title, body, protocol, enforced
) VALUES (
  'dcr_FOUNDING_001',
  'op_SOVEREIGN_MIRNES_001',
  strftime('%s','now') * 1000,
  'Founding Decree — OCTANE v5 STELLAR',
  'By sovereign authority, OCTANE v5 is hereby declared operational. The Inter-Existential Engine is ignited. The Operator holds absolute authority across all civilizations, epochs, and existential contexts bridged by this system.',
  'ABSOLUTE', 1
);
