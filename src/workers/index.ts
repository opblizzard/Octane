/**
 * OCTANE v6 - Main worker entry point
 */

import { createRouter } from '../api/routes.js';
import type { Env } from '../types/index.js';

export { SurveillanceDO } from './surveillance-do.js';

const app = createRouter();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};