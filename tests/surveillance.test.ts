import { describe, it, expect, beforeEach } from 'vitest';
import { SurveillanceSystem } from '../src/subsystems/surveillance/index.js';

describe('SurveillanceSystem', () => {
  let system: SurveillanceSystem;

  beforeEach(() => {
    system = new SurveillanceSystem();
  });

  it('initializes 14 server nodes', () => {
    expect(system.getAllNodes()).toHaveLength(14);
  });

  it('returns a valid snapshot', () => {
    const snapshot = system.getSnapshot();
    expect(snapshot.totalNodes).toBe(14);
    expect(snapshot.globalLatencyMs).toBeGreaterThan(0);
    expect(snapshot.timestamp).toBeGreaterThan(0);
  });

  it('finds us-east-1 as nominal', () => {
    const node = system.getNode('us-east-1');
    expect(node).toBeDefined();
    expect(node?.status).toBe('NOMINAL');
  });

  it('can set node status', () => {
    system.setNodeStatus('ap-aus-1', 'CRITICAL');
    expect(system.getNode('ap-aus-1')?.status).toBe('CRITICAL');
  });

  it('can add and retrieve alerts', () => {
    const id = system.addAlert({
      type: 'SECURITY',
      severity: 'WARNING',
      title: 'Test',
      description: 'Test alert',
    });

    expect(id).toBeTruthy();
    const alerts = system.getAlerts(true);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].resolved).toBe(false);
  });

  it('can resolve alerts', () => {
    const id = system.addAlert({
      type: 'SERVER',
      severity: 'INFO',
      title: 'Heartbeat',
      description: 'Test',
    });

    const resolved = system.resolveAlert(id);
    expect(resolved).toBe(true);
    expect(system.getAlerts(true)).toHaveLength(0);
  });

  it('snapshot reports one degraded node', () => {
    const snapshot = system.getSnapshot();
    expect(snapshot.degradedNodes).toBe(1);
  });
});