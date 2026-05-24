import { Context } from 'hono';
import { Env, ExistentialLayer } from '../../types/index.js';
import { traceId, now } from '../../utils/helpers.js';

export const srcHandler = {
  state: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.SRC_CONDUIT.get(c.env.SRC_CONDUIT.idFromName('global'));
    const res  = await stub.fetch('http://do/state');
    return c.json(await res.json());
  },
  conduits: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.SRC_CONDUIT.get(c.env.SRC_CONDUIT.idFromName('global'));
    const res  = await stub.fetch('http://do/conduits');
    return c.json(await res.json());
  },
  bandwidth: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.SRC_CONDUIT.get(c.env.SRC_CONDUIT.idFromName('global'));
    const res  = await stub.fetch('http://do/bandwidth');
    return c.json(await res.json());
  },
  reach: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json().catch(() => ({}));
    const stub = c.env.SRC_CONDUIT.get(c.env.SRC_CONDUIT.idFromName('global'));
    const res  = await stub.fetch('http://do/reach', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    return c.json(await res.json());
  },
  seal: async (c: Context<{ Bindings: Env }>) => {
    const id   = c.req.param('id');
    const stub = c.env.SRC_CONDUIT.get(c.env.SRC_CONDUIT.idFromName('global'));
    const res  = await stub.fetch(`http://do/seal/${id}`, { method: 'DELETE' });
    return c.json(await res.json());
  },
};
