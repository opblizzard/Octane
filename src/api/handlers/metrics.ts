import { Context } from 'hono';
import { Env } from '../../types/index.js';
import { traceId, now } from '../../utils/helpers.js';

export const metricsHandler = {
  all: (c: Context<{ Bindings: Env }>) => c.json({
    success: true, traceId: traceId(), timestamp: now(),
    data: {
      engine:         'STELLAR',
      version:        '5.0.0',
      uptime:         0,
      totalSignals:   0,
      activeBridges:  0,
      latticeNodes:   0,
      activeFlows:    0,
      operatorStage:  1,
      coherence:      1.0,
      epoch:          Date.now(),
      lastHeartbeat:  now(),
    },
  }),
};
