import { Context } from 'hono';
import { Env, EngineState, AccessTier, SovereigntyProtocol } from '../../types/index.js';
import { generateId, now, traceId } from '../../utils/helpers.js';
import { createOperator, signOath } from '../../utils/sovereign-identity.js';

const VERSION = '5.0.0';
const CODENAME = 'STELLAR';
let engineState: EngineState = EngineState.DORMANT;
let activatedAt: number | null = null;
let ignitionCount = 0;

export const engineHandler = {
  health: async (c: Context<{ Bindings: Env }>) => {
    return c.json({
      success: true, traceId: traceId(), timestamp: now(),
      data: {
        engine: engineState, version: VERSION, codename: CODENAME,
        uptime: activatedAt ? now() - activatedAt : 0,
        subsystems: { SRC: 'HEALTHY', CBE: 'HEALTHY', ELX: 'HEALTHY', OAN: 'HEALTHY' },
      },
    });
  },
  version: (c: Context<{ Bindings: Env }>) => c.json({
    version: VERSION, codename: CODENAME, edition: 'Inter-Existential Engine',
    issueDate: '2026-05-23', org: 'Ionirix LLC', classification: 'Sovereign-Eyes Only',
  }),
  state: (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { state: engineState }, traceId: traceId(), timestamp: now() }),
  session: (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { active: engineState !== EngineState.DORMANT, state: engineState }, traceId: traceId(), timestamp: now() }),
  activation: (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { activatedAt, ignitionCount, codename: CODENAME }, traceId: traceId(), timestamp: now() }),
  ignite: async (c: Context<{ Bindings: Env }>) => {
    if (engineState === EngineState.STELLAR) return c.json({ success: false, error: 'Engine already STELLAR', traceId: traceId(), timestamp: now() }, 409);
    engineState = EngineState.STELLAR;
    activatedAt = now();
    ignitionCount++;
    const op = signOath(createOperator('Mirnes — Sovereign Architect', AccessTier.SOVEREIGN, SovereigntyProtocol.SOVEREIGN));
    return c.json({
      success: true, traceId: traceId(), timestamp: now(),
      data: {
        receiptId: generateId('rcpt'), version: VERSION, codename: CODENAME,
        operator: op.handle, activatedAt, initialState: engineState,
        subsystems: { SRC: 'OK', CBE: 'OK', ELX: 'OK', OAN: 'OK' },
        invocation: 'By the authority of the Sovereign Architect — OCTANE v5 STELLAR — IGNITED.',
      },
    });
  },
  contain: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json().catch(() => ({}));
    engineState = EngineState.CONTAINED;
    return c.json({ success: true, data: { contained: true, reason: body.reason ?? 'Manual containment', state: engineState }, traceId: traceId(), timestamp: now() });
  },
};
