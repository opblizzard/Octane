import { Context } from 'hono';
import { Env, AccessTier, SovereigntyProtocol } from '../../types/index.js';
import { GovernanceEngine, ETHICS_CHARTER, ACCESS_POLICIES } from '../../governance/index.js';
import { createOperator, signOath } from '../../utils/sovereign-identity.js';
import { traceId, now } from '../../utils/helpers.js';

const gov = new GovernanceEngine();
gov.recordIgnition();

export const governanceHandler = {
  charter:   (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { charter: ETHICS_CHARTER }, traceId: traceId(), timestamp: now() }),
  lifecycle: (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: gov.getLifecycle(), traceId: traceId(), timestamp: now() }),
  policies:  (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: ACCESS_POLICIES, traceId: traceId(), timestamp: now() }),
  decrees:   (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: gov.getActiveDecrees(), traceId: traceId(), timestamp: now() }),
  ethicsLog: (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: gov.getEthicsLog(), traceId: traceId(), timestamp: now() }),
  issueDecree: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json<{ title: string; body: string; protocol?: SovereigntyProtocol }>();
    const op   = signOath(createOperator('Mirnes — Sovereign Architect', AccessTier.SOVEREIGN, SovereigntyProtocol.SOVEREIGN));
    const decree = gov.issueDecree(op, body.title, body.body, body.protocol);
    return c.json({ success: true, data: decree, traceId: traceId(), timestamp: now() });
  },
  revokeDecree: async (c: Context<{ Bindings: Env }>) => {
    const id = c.req.param('id') ?? '';
    const op  = signOath(createOperator('Mirnes — Sovereign Architect', AccessTier.SOVEREIGN, SovereigntyProtocol.SOVEREIGN));
    const ok  = gov.revokeDecree(id, op);
    return c.json({ success: ok, traceId: traceId(), timestamp: now() });
  },
  ethicsCheck: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json<{ action: string }>();
    const op   = signOath(createOperator('Mirnes — Sovereign Architect', AccessTier.SOVEREIGN, SovereigntyProtocol.SOVEREIGN));
    const check = gov.ethicsCheck(body.action, op);
    return c.json({ success: true, data: check, traceId: traceId(), timestamp: now() });
  },
};
