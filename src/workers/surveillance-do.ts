/**
 * OCTANE v6 - Surveillance Durable Object
 */

import { DurableObject } from 'cloudflare:workers';
import { SurveillanceSystem } from '../subsystems/surveillance/index.js';
import type { Env, SurveillanceAlert } from '../types/index.js';
import { errorResponse, jsonResponse } from '../utils/helpers.js';

export class SurveillanceDO extends DurableObject {
  private system: SurveillanceSystem;

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env);
    this.system = new SurveillanceSystem();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/surveillance', '');

    try {
      if (request.method === 'GET' && path === '/snapshot') {
        return jsonResponse({ success: true, data: this.system.getSnapshot(), timestamp: Date.now() });
      }

      if (request.method === 'GET' && path === '/nodes') {
        return jsonResponse({ success: true, data: this.system.getAllNodes(), timestamp: Date.now() });
      }

      if (request.method === 'GET' && path === '/alerts') {
        const onlyActive = url.searchParams.get('onlyActive') !== 'false';
        return jsonResponse({ success: true, data: this.system.getUnifiedAlerts(onlyActive), timestamp: Date.now() });
      }

      if (request.method === 'POST' && path === '/alerts') {
        const alert = await request.json() as Omit<SurveillanceAlert, 'id' | 'timestamp' | 'resolved'>;
        const id = this.system.addAlert(alert);
        return jsonResponse({ success: true, data: { id }, timestamp: Date.now() }, 201);
      }

      return errorResponse('Unknown endpoint', 404);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Surveillance error', 500);
    }
  }
}