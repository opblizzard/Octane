/**
 * OCTANE v5 — ExistenceLatticeDO
 * Durable Object: Persistent cross-existential state mesh.
 */
import { DurableObject } from 'cloudflare:workers';
import { ExistenceLattice } from '../subsystems/elx/index.js';
import { ELXConfig, ExistentialLayer, LatticeQuery, Env } from '../types/index.js';
import { jsonResponse, errorResponse, traceId } from '../utils/helpers.js';

const DEFAULT_CONFIG: ELXConfig = {
  latticeDepth:        9,
  nodeCapacity:        10_000,
  persistenceMode:     'DURABLE',
  coherenceInterval:   60_000,
  quantumEntanglement: true,
};

export class ExistenceLatticeDO extends DurableObject {
  private lattice: ExistenceLattice;

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env);
    this.lattice = new ExistenceLattice(DEFAULT_CONFIG);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tid = traceId();
    try {
      if (request.method === 'POST' && url.pathname === '/write') {
        const b = await request.json<{layer:ExistentialLayer;contextId:string;data:Record<string,unknown>;weight?:number;ttl?:number}>();
        const node = await this.lattice.write(b.layer, b.contextId, b.data, b.weight, b.ttl);
        return jsonResponse({ success: true, data: node, traceId: tid });
      }
      if (request.method === 'GET' && url.pathname.startsWith('/node/')) {
        const id = url.pathname.split('/')[2];
        const n = await this.lattice.read(id);
        return n ? jsonResponse({ success: true, data: n, traceId: tid }) : errorResponse('Node not found', 404);
      }
      if (request.method === 'POST' && url.pathname === '/query') {
        const q = await request.json<LatticeQuery>();
        return jsonResponse({ success: true, data: this.lattice.query(q), traceId: tid });
      }
      if (request.method === 'POST' && url.pathname === '/entangle') {
        const { a, b: bId } = await request.json<{a:string;b:string}>();
        return jsonResponse({ success: this.lattice.entangle(a, bId), traceId: tid });
      }
      if (request.method === 'GET' && url.pathname === '/snapshot')
        return jsonResponse({ success: true, data: this.lattice.snapshot(), traceId: tid });
      if (request.method === 'GET' && url.pathname === '/coherence')
        return jsonResponse({ success: true, data: { coherence: this.lattice.getCoherence(), nodes: this.lattice.getNodeCount() }, traceId: tid });
      return errorResponse('Not found', 404);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'ELX error', 500);
    }
  }
}
