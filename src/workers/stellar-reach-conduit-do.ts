/**
 * OCTANE v5 — StellarReachConduitDO
 * Durable Object: Persistent stellar conduit state per operator/session.
 */
import { DurableObject } from 'cloudflare:workers';
import { StellarReachConduit } from '../subsystems/src-conduit/index.js';
import { SRCConfig, ExistentialLayer, Env } from '../types/index.js';
import { jsonResponse, errorResponse, traceId } from '../utils/helpers.js';

const DEFAULT_CONFIG: SRCConfig = {
  reachRadius:      7,
  conduitBandwidth: 500,
  stellarMapping:   true,
  autoAmplify:      true,
  amplifyThreshold: 3,
};

export class StellarReachConduitDO extends DurableObject {
  private conduit: StellarReachConduit;

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env);
    this.conduit = new StellarReachConduit(DEFAULT_CONFIG);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tid = traceId();

    try {
      if (request.method === 'GET' && url.pathname === '/state') {
        return jsonResponse({ success: true, data: this.conduit.getState(), traceId: tid });
      }

      if (request.method === 'GET' && url.pathname === '/conduits') {
        return jsonResponse({ success: true, data: this.conduit.getConduits(), traceId: tid });
      }

      if (request.method === 'POST' && url.pathname === '/reach') {
        const body = await request.json<{
          layer?: ExistentialLayer; payload?: Record<string, unknown>; operatorId?: string;
        }>();
        const result = await this.conduit.reach(
          body.layer ?? ExistentialLayer.CIVILIZATIONAL,
          body.payload ?? {},
          body.operatorId,
        );
        return jsonResponse({ success: true, data: result, traceId: tid });
      }

      if (request.method === 'DELETE' && url.pathname.startsWith('/seal/')) {
        const conduitId = url.pathname.split('/')[2];
        const ok = this.conduit.seal(conduitId);
        return jsonResponse({ success: ok, traceId: tid });
      }

      if (request.method === 'GET' && url.pathname === '/bandwidth') {
        return jsonResponse({ success: true, data: { bandwidth: this.conduit.getBandwidth() }, traceId: tid });
      }

      return errorResponse('Not found', 404);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'SRC error', 500);
    }
  }
}
