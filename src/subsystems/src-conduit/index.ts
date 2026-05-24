/**
 * OCTANE v5 — SRC: Stellar Reach Conduit
 * Handles signal intake and scanning across existential contexts.
 * The SRC is the outermost layer — it reaches across civilizations
 * and epochs to pull signals into the engine.
 */
import {
  SRCConfig, SRCState, SRCReachResult, OctaneSignal,
  ExistentialLayer, SignalPriority, SubsystemId, FlowModel,
} from '../../types/index.js';
import { generateId, now, clamp } from '../../utils/helpers.js';

export class StellarReachConduit {
  private config: SRCConfig;
  private state: SRCState;
  private conduits: Map<string, SRCReachResult> = new Map();

  constructor(config: SRCConfig) {
    this.config = config;
    this.state = {
      status:         'IDLE',
      activeConduits: 0,
      totalSignals:   0,
      reachVector:    [0, 0, 0],
      lastReach:      0,
      peakReach:      0,
    };
  }

  async reach(
    layer: ExistentialLayer,
    payload: Record<string, unknown>,
    operatorId?: string,
  ): Promise<SRCReachResult> {
    this.state.status = 'REACHING';

    const signal: OctaneSignal = {
      id:          generateId('sig'),
      timestamp:   now(),
      origin:      SubsystemId.SRC,
      destination: SubsystemId.CBE,
      layer,
      flow:        FlowModel.PRIMARY_SIGNAL,
      priority:    this.computePriority(layer),
      payload,
      operatorId,
      traceId:     generateId('trc'),
      epoch:       Date.now(),
    };

    const strength = this.computeReachStrength(layer);
    const latency  = Math.round(10 + (1 - strength) * 40);

    const result: SRCReachResult = {
      conduitId:       generateId('cnd'),
      targetLayer:     layer,
      reachStrength:   strength,
      bridgeAvailable: strength > 0.4,
      signal,
      latencyMs:       latency,
    };

    this.conduits.set(result.conduitId, result);
    this.state.activeConduits = this.conduits.size;
    this.state.totalSignals++;
    this.state.lastReach = now();
    this.state.peakReach = Math.max(this.state.peakReach, strength);
    this.updateReachVector(layer, strength);

    if (this.config.autoAmplify && signal.priority >= this.config.amplifyThreshold) {
      await this.amplify(result);
    }

    this.state.status = this.conduits.size > 0 ? 'LOCKED' : 'IDLE';
    return result;
  }

  private computePriority(layer: ExistentialLayer): SignalPriority {
    const map: Record<ExistentialLayer, SignalPriority> = {
      [ExistentialLayer.CIVILIZATIONAL]: SignalPriority.STANDARD,
      [ExistentialLayer.EPOCHAL]:        SignalPriority.ELEVATED,
      [ExistentialLayer.CONTEXTUAL]:     SignalPriority.STANDARD,
      [ExistentialLayer.INTER_SEAM]:     SignalPriority.EXISTENTIAL,
    };
    return map[layer];
  }

  private computeReachStrength(layer: ExistentialLayer): number {
    const base = this.config.reachRadius / 10;
    const layerBonus: Record<ExistentialLayer, number> = {
      [ExistentialLayer.CIVILIZATIONAL]: 0.0,
      [ExistentialLayer.EPOCHAL]:        0.1,
      [ExistentialLayer.CONTEXTUAL]:     0.05,
      [ExistentialLayer.INTER_SEAM]:     0.2,
    };
    return clamp(base + layerBonus[layer], 0, 1);
  }

  private updateReachVector(layer: ExistentialLayer, strength: number): void {
    const idx: Record<ExistentialLayer, number> = {
      [ExistentialLayer.CIVILIZATIONAL]: 0,
      [ExistentialLayer.EPOCHAL]:        1,
      [ExistentialLayer.CONTEXTUAL]:     2,
      [ExistentialLayer.INTER_SEAM]:     0,
    };
    this.state.reachVector[idx[layer]] = clamp(
      this.state.reachVector[idx[layer]] + strength * 0.1, 0, 10,
    );
  }

  private async amplify(result: SRCReachResult): Promise<void> {
    this.state.status = 'AMPLIFYING';
    result.reachStrength = clamp(result.reachStrength * 1.25, 0, 1);
    result.signal.priority = Math.min(result.signal.priority + 1, SignalPriority.EXISTENTIAL) as SignalPriority;
    await Promise.resolve();
  }

  seal(conduitId: string): boolean {
    return this.conduits.delete(conduitId);
  }

  getState():    SRCState  { return { ...this.state }; }
  getConduits(): SRCReachResult[] { return [...this.conduits.values()]; }
  getBandwidth(): number {
    return clamp(this.config.conduitBandwidth - this.conduits.size * 10, 0, this.config.conduitBandwidth);
  }
}
