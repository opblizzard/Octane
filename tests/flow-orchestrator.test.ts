import { describe, it, expect } from 'vitest';
import { FlowOrchestrator } from '../src/flows/index.js';
import { FlowModel } from '../src/types/index.js';

describe('FlowOrchestrator', () => {
  const orchestrator = new FlowOrchestrator();

  it('executes PRIMARY_SIGNAL flow', async () => {
    const exec = await orchestrator.run(FlowModel.PRIMARY_SIGNAL, 'test');
    expect(exec.state).toBe('COMPLETED');
    expect(exec.steps.every(s => s.status === 'DONE')).toBe(true);
    expect(exec.result).toBeDefined();
  });

  it('executes INTER_EXISTENTIAL_BRIDGE flow', async () => {
    const exec = await orchestrator.run(FlowModel.INTER_EXISTENTIAL_BRIDGE, 'test', { fromCiv: 'Civ1', toCiv: 'Civ2' });
    expect(exec.state).toBe('COMPLETED');
    expect(exec.steps.length).toBe(6);
  });

  it('executes EMERGENCY_CONTAINMENT flow', async () => {
    const exec = await orchestrator.run(FlowModel.EMERGENCY_CONTAINMENT, 'test', { reason: 'test containment' });
    expect(exec.state).toBe('COMPLETED');
    expect(exec.result).toHaveProperty('contained', true);
  });

  it('executes OPERATOR_ASCENSION flow', async () => {
    const exec = await orchestrator.run(FlowModel.OPERATOR_ASCENSION, 'test', { stage: 1 });
    expect(exec.state).toBe('COMPLETED');
    expect(exec.result).toHaveProperty('ascended', true);
  });

  it('tracks execution history', async () => {
    await orchestrator.run(FlowModel.PRIMARY_SIGNAL, 'test');
    expect(orchestrator.getAll().length).toBeGreaterThan(0);
  });
});
