/**
 * OCTANE v5 — SRC Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StellarReachConduit } from '../src/subsystems/src-conduit/index.js';
import { ExistentialLayer, SignalPriority } from '../src/types/index.js';

const CONFIG = {
  reachRadius: 7, conduitBandwidth: 500, stellarMapping: true,
  autoAmplify: false, amplifyThreshold: SignalPriority.CRITICAL,
};

describe('StellarReachConduit', () => {
  let src: StellarReachConduit;

  beforeEach(() => { src = new StellarReachConduit(CONFIG); });

  it('initializes in IDLE state', () => {
    expect(src.getState().status).toBe('IDLE');
    expect(src.getState().activeConduits).toBe(0);
  });

  it('reaches across CIVILIZATIONAL layer', async () => {
    const result = await src.reach(ExistentialLayer.CIVILIZATIONAL, { test: true });
    expect(result.conduitId).toBeDefined();
    expect(result.targetLayer).toBe(ExistentialLayer.CIVILIZATIONAL);
    expect(result.reachStrength).toBeGreaterThan(0);
    expect(result.signal).toBeDefined();
  });

  it('reaches across INTER_SEAM layer with higher strength', async () => {
    const civ  = await src.reach(ExistentialLayer.CIVILIZATIONAL, {});
    const seam = await src.reach(ExistentialLayer.INTER_SEAM, {});
    expect(seam.reachStrength).toBeGreaterThanOrEqual(civ.reachStrength);
  });

  it('increments totalSignals on each reach', async () => {
    await src.reach(ExistentialLayer.EPOCHAL, {});
    await src.reach(ExistentialLayer.CONTEXTUAL, {});
    expect(src.getState().totalSignals).toBe(2);
  });

  it('seals a conduit', async () => {
    const result = await src.reach(ExistentialLayer.CIVILIZATIONAL, {});
    const sealed = src.seal(result.conduitId);
    expect(sealed).toBe(true);
    expect(src.getConduits().find(c => c.conduitId === result.conduitId)).toBeUndefined();
  });

  it('bandwidth reduces with active conduits', async () => {
    const full = src.getBandwidth();
    await src.reach(ExistentialLayer.CIVILIZATIONAL, {});
    expect(src.getBandwidth()).toBeLessThan(full);
  });
});
