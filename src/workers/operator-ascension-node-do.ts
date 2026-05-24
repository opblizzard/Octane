/**
 * OCTANE v5 — OperatorAscensionNodeDO
 * Durable Object: Sovereign operator state & ascension progression.
 */
import { DurableObject } from 'cloudflare:workers';
import { OperatorAscensionNode } from '../subsystems/oan/index.js';
import { OANConfig, OperatorSession, OperatorIdentity, SovereigntyProtocol, Env } from '../types/index.js';
import { jsonResponse, errorResponse, traceId } from '../utils/helpers.js';

const DEFAULT_CONFIG: OANConfig = {
  ascensionStages:    7,
  sovereignProtocol:  SovereigntyProtocol.SOVEREIGN,
  oathRequired:       true,
  checkpointInterval: 3_600_000,
  maxConcurrentOps:   5,
};

export class OperatorAscensionNodeDO extends DurableObject {
  private oan: OperatorAscensionNode;

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env);
    this.oan = new OperatorAscensionNode(DEFAULT_CONFIG);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tid = traceId();
    try {
      if (request.method === 'GET' && url.pathname === '/stages')
        return jsonResponse({ success: true, data: this.oan.getStages(), traceId: tid });

      if (request.method === 'GET' && url.pathname === '/oath')
        return jsonResponse({ success: true, data: { oath: this.oan.getOath() }, traceId: tid });

      if (request.method === 'POST' && url.pathname === '/advance') {
        const { session, operator } = await request.json<{session:OperatorSession;operator:OperatorIdentity}>();
        const stage = await this.oan.advanceStage(session, operator);
        return jsonResponse({ success: true, data: stage, traceId: tid });
      }

      if (request.method === 'POST' && url.pathname === '/decree') {
        const b = await request.json<{operatorId:string;title:string;body:string}>();
        const d = this.oan.issueDecree(b.operatorId, b.title, b.body);
        return jsonResponse({ success: true, data: d, traceId: tid });
      }

      if (request.method === 'GET' && url.pathname === '/decrees')
        return jsonResponse({ success: true, data: this.oan.getDecrees(), traceId: tid });

      if (request.method === 'GET' && url.pathname === '/ethics')
        return jsonResponse({ success: true, data: this.oan.getEthicsLog(), traceId: tid });

      return errorResponse('Not found', 404);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'OAN error', 500);
    }
  }
}
