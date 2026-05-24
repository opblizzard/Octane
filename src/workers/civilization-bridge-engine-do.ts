/**
 * OCTANE v5 — CivilizationBridgeEngineDO
 * Durable Object: Persistent bridge state across civilizations/epochs.
 */
import { DurableObject } from 'cloudflare:workers';
import { CivilizationBridgeEngine } from '../subsystems/cbe/index.js';
import { CBEConfig, Env } from '../types/index.js';
import { jsonResponse, errorResponse, traceId } from '../utils/helpers.js';

const DEFAULT_CONFIG: CBEConfig = {
  bridgeDepth:          6,
  translationMode:      'EXISTENTIAL',
  coherenceThreshold:   0.3,
  maxConcurrentBridges: 12,
  autoSeal:             false,
  sealDelay:            300_000,
};

export class CivilizationBridgeEngineDO extends DurableObject {
  private cbe: CivilizationBridgeEngine;

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env);
    this.cbe = new CivilizationBridgeEngine(DEFAULT_CONFIG);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tid = traceId();
    try {
      if (request.method === 'GET'  && url.pathname === '/bridges')
        return jsonResponse({ success: true, data: this.cbe.getBridges(), traceId: tid });

      if (request.method === 'POST' && url.pathname === '/bridge/open') {
        const b = await request.json<{fromCiv:string;toCiv:string;fromEpoch:number;toEpoch:number;operator?:string}>();
        const bridge = await this.cbe.openBridge(b.fromCiv, b.toCiv, b.fromEpoch, b.toEpoch, b.operator);
        return jsonResponse({ success: true, data: bridge, traceId: tid });
      }

      if (request.method === 'POST' && url.pathname === '/translate') {
        const b = await request.json<{bridgeId:string;source:string}>();
        const t = await this.cbe.translate(b.bridgeId, b.source);
        return jsonResponse({ success: true, data: t, traceId: tid });
      }

      if (request.method === 'DELETE' && url.pathname.startsWith('/bridge/seal/')) {
        const id = url.pathname.split('/')[3];
        const ok = this.cbe.sealBridge(id);
        return jsonResponse({ success: ok, traceId: tid });
      }

      if (request.method === 'GET' && url.pathname === '/history')
        return jsonResponse({ success: true, data: this.cbe.getTranslationHistory(), traceId: tid });

      return errorResponse('Not found', 404);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'CBE error', 500);
    }
  }
}
