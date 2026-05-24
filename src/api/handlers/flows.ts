import { Context } from 'hono';
import { Env, FlowModel } from '../../types/index.js';
import { FlowOrchestrator } from '../../flows/index.js';
import { traceId, now } from '../../utils/helpers.js';

const orchestrator = new FlowOrchestrator();

export const flowHandler = {
  list:    (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: orchestrator.getAll(), traceId: traceId(), timestamp: now() }),
  active:  (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: orchestrator.getActive(), traceId: traceId(), timestamp: now() }),
  get: (c: Context<{ Bindings: Env }>) => {
    const exec = orchestrator.getExecution(c.req.param('id') ?? '');
    return exec ? c.json({ success: true, data: exec }) : c.json({ success: false, error: 'Not found' }, 404);
  },
  execute: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json<{ flow: FlowModel; initiatedBy?: string; context?: Record<string, unknown> }>();
    const exec = await orchestrator.run(body.flow, body.initiatedBy ?? 'api', body.context);
    return c.json({ success: true, data: exec, traceId: traceId(), timestamp: now() });
  },
  primarySignal:      async (c: Context<{ Bindings: Env }>) => { const b = await c.req.json().catch(()=>({})); return c.json({ success: true, data: await orchestrator.run(FlowModel.PRIMARY_SIGNAL, 'api', b), traceId: traceId(), timestamp: now() }); },
  interExistential:   async (c: Context<{ Bindings: Env }>) => { const b = await c.req.json().catch(()=>({})); return c.json({ success: true, data: await orchestrator.run(FlowModel.INTER_EXISTENTIAL_BRIDGE, 'api', b), traceId: traceId(), timestamp: now() }); },
  emergencyContainment: async (c: Context<{ Bindings: Env }>) => { const b = await c.req.json().catch(()=>({})); return c.json({ success: true, data: await orchestrator.run(FlowModel.EMERGENCY_CONTAINMENT, 'api', b), traceId: traceId(), timestamp: now() }); },
  operatorAscension:  async (c: Context<{ Bindings: Env }>) => { const b = await c.req.json().catch(()=>({})); return c.json({ success: true, data: await orchestrator.run(FlowModel.OPERATOR_ASCENSION, 'api', b), traceId: traceId(), timestamp: now() }); },
};
