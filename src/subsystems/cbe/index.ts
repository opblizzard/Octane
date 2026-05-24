/**
 * OCTANE v5 — CBE: Civilization Bridge Engine
 * Bridges between civilizations, epochs, and systems of meaning.
 * The CBE is the translation layer — it allows signals that originated
 * in one existential context to be understood in another.
 */
import {
  CBEConfig, CivilizationBridge, CBETranslation,
  OctaneSignal, ExistentialLayer,
} from '../../types/index.js';
import { generateId, now, clamp } from '../../utils/helpers.js';

export class CivilizationBridgeEngine {
  private config: CBEConfig;
  private bridges: Map<string, CivilizationBridge> = new Map();
  private translations: CBETranslation[] = [];

  constructor(config: CBEConfig) {
    this.config = config;
  }

  async openBridge(
    fromCiv: string, toCiv: string,
    fromEpoch: number, toEpoch: number,
    operator?: string,
  ): Promise<CivilizationBridge> {
    if (this.bridges.size >= this.config.maxConcurrentBridges) {
      throw new Error(`Max concurrent bridges (${this.config.maxConcurrentBridges}) reached`);
    }

    const bridge: CivilizationBridge = {
      id:          generateId('brg'),
      fromCiv, toCiv, fromEpoch, toEpoch,
      coherence:   this.computeCoherence(fromCiv, toCiv, fromEpoch, toEpoch),
      state:       'FORMING',
      openedAt:    now(),
      signalCount: 0,
      operator,
    };

    if (bridge.coherence < this.config.coherenceThreshold) {
      throw new Error(`Bridge coherence ${bridge.coherence.toFixed(3)} below threshold ${this.config.coherenceThreshold}`);
    }

    bridge.state = 'STABLE';
    this.bridges.set(bridge.id, bridge);

    if (this.config.autoSeal) {
      setTimeout(() => this.sealBridge(bridge.id), this.config.sealDelay);
    }

    return bridge;
  }

  async translate(
    bridgeId: string,
    source: string,
  ): Promise<CBETranslation> {
    const bridge = this.bridges.get(bridgeId);
    if (!bridge || bridge.state !== 'STABLE') {
      throw new Error(`Bridge ${bridgeId} not available`);
    }

    const lossPercent = clamp((1 - bridge.coherence) * 100, 0, 99);
    const translation: CBETranslation = {
      bridgeId,
      source,
      translated: this.performTranslation(source, bridge.fromCiv, bridge.toCiv, this.config.translationMode),
      mode:       this.config.translationMode,
      coherence:  bridge.coherence,
      lossPercent,
      artifacts:  lossPercent > 20 ? [`translation artifact at epoch ${bridge.toEpoch}`] : [],
    };

    bridge.signalCount++;
    bridge.coherence = clamp(bridge.coherence - 0.001, 0, 1);
    if (bridge.coherence < this.config.coherenceThreshold) {
      bridge.state = 'DEGRADING';
    }

    this.translations.push(translation);
    return translation;
  }

  private performTranslation(
    source: string, _from: string, _to: string, mode: CBEConfig['translationMode'],
  ): string {
    switch (mode) {
      case 'LITERAL':      return source;
      case 'SEMANTIC':     return `[SEMANTIC] ${source}`;
      case 'EXISTENTIAL':  return `[EXISTENTIAL BRIDGE] ${source}`;
    }
  }

  private computeCoherence(
    fromCiv: string, toCiv: string, fromEpoch: number, toEpoch: number,
  ): number {
    const civDistance  = fromCiv === toCiv ? 0 : 0.2;
    const epochGap     = Math.min(Math.abs(toEpoch - fromEpoch) / 1000, 0.3);
    const bridgeFactor = this.config.bridgeDepth / 7;
    return clamp(bridgeFactor - civDistance - epochGap, 0.1, 1.0);
  }

  sealBridge(bridgeId: string): boolean {
    const bridge = this.bridges.get(bridgeId);
    if (!bridge) return false;
    bridge.state    = 'SEALED';
    bridge.sealedAt = now();
    this.bridges.delete(bridgeId);
    return true;
  }

  processSignal(signal: OctaneSignal, bridgeId: string): Promise<CBETranslation> {
    return this.translate(bridgeId, JSON.stringify(signal.payload));
  }

  getBridges(): CivilizationBridge[] { return [...this.bridges.values()]; }
  getActiveBridgeCount(): number     { return this.bridges.size; }
  getTranslationHistory(): CBETranslation[] { return [...this.translations]; }
  getConfig(): CBEConfig { return { ...this.config }; }
}
