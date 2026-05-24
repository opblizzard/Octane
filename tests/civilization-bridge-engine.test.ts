import { describe, it, expect, beforeEach } from 'vitest';
import { CivilizationBridgeEngine } from '../src/subsystems/cbe/index.js';

const CONFIG = {
  bridgeDepth: 6, translationMode: 'EXISTENTIAL' as const,
  coherenceThreshold: 0.3, maxConcurrentBridges: 4,
  autoSeal: false, sealDelay: 300_000,
};

describe('CivilizationBridgeEngine', () => {
  let cbe: CivilizationBridgeEngine;

  beforeEach(() => { cbe = new CivilizationBridgeEngine(CONFIG); });

  it('opens a bridge between two civilizations', async () => {
    const bridge = await cbe.openBridge('Alpha', 'Omega', 1000, 2000);
    expect(bridge.id).toBeDefined();
    expect(bridge.state).toBe('STABLE');
    expect(bridge.coherence).toBeGreaterThan(0.3);
  });

  it('translates content across a bridge', async () => {
    const bridge = await cbe.openBridge('Alpha', 'Omega', 1000, 2000);
    const t = await cbe.translate(bridge.id, 'Hello from Alpha civilization');
    expect(t.translated).toContain('[EXISTENTIAL BRIDGE]');
    expect(t.coherence).toBeGreaterThan(0);
  });

  it('throws when max bridges exceeded', async () => {
    for (let i = 0; i < CONFIG.maxConcurrentBridges; i++) {
      await cbe.openBridge(`Civ${i}`, `Civ${i+1}`, i*100, (i+1)*100);
    }
    await expect(cbe.openBridge('X','Y',0,1)).rejects.toThrow('Max concurrent bridges');
  });

  it('seals a bridge', async () => {
    const bridge = await cbe.openBridge('A', 'B', 0, 100);
    const sealed = cbe.sealBridge(bridge.id);
    expect(sealed).toBe(true);
    expect(cbe.getActiveBridgeCount()).toBe(0);
  });

  it('records translation history', async () => {
    const bridge = await cbe.openBridge('Alpha','Beta', 0, 500);
    await cbe.translate(bridge.id, 'Message one');
    await cbe.translate(bridge.id, 'Message two');
    expect(cbe.getTranslationHistory().length).toBe(2);
  });
});
