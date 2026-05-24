import { describe, it, expect, beforeEach } from 'vitest';
import { ExistenceLattice } from '../src/subsystems/elx/index.js';
import { ExistentialLayer } from '../src/types/index.js';

const CONFIG = {
  latticeDepth: 9, nodeCapacity: 100, persistenceMode: 'DURABLE' as const,
  coherenceInterval: 60_000, quantumEntanglement: true,
};

describe('ExistenceLattice', () => {
  let elx: ExistenceLattice;

  beforeEach(() => { elx = new ExistenceLattice(CONFIG); });

  it('writes and reads a node', async () => {
    const node = await elx.write(ExistentialLayer.CIVILIZATIONAL, 'ctx-1', { data: 'test' });
    const read = await elx.read(node.id);
    expect(read).not.toBeNull();
    expect(read!.contextId).toBe('ctx-1');
  });

  it('queries by layer', async () => {
    await elx.write(ExistentialLayer.CIVILIZATIONAL, 'ctx-a', {});
    await elx.write(ExistentialLayer.EPOCHAL, 'ctx-b', {});
    const results = elx.query({ layer: ExistentialLayer.CIVILIZATIONAL, limit: 10, offset: 0 });
    expect(results.every(n => n.layer === ExistentialLayer.CIVILIZATIONAL)).toBe(true);
  });

  it('entangles two nodes', async () => {
    const a = await elx.write(ExistentialLayer.CIVILIZATIONAL, 'ctx-a', {});
    const b = await elx.write(ExistentialLayer.EPOCHAL, 'ctx-b', {});
    expect(elx.entangle(a.id, b.id)).toBe(true);
    const ra = await elx.read(a.id);
    expect(ra!.entangled).toContain(b.id);
  });

  it('takes a snapshot', async () => {
    await elx.write(ExistentialLayer.CIVILIZATIONAL, 'x', {}, 2.0);
    const snap = elx.snapshot();
    expect(snap.nodeCount).toBe(1);
    expect(snap.totalWeight).toBe(2.0);
  });

  it('coherence starts at 1.0', () => {
    expect(elx.getCoherence()).toBe(1.0);
  });

  it('recohere increases coherence after decay', async () => {
    for (let i = 0; i < 5; i++) await elx.write(ExistentialLayer.CONTEXTUAL, `c${i}`, {});
    const before = elx.getCoherence();
    elx.recohere();
    expect(elx.getCoherence()).toBeGreaterThanOrEqual(before);
  });
});
