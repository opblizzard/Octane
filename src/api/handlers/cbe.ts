import { Context } from 'hono';
import { Env } from '../../types/index.js';

export const cbeHandler = {
  bridges: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    return c.json(await (await stub.fetch('http://do/bridges')).json());
  },
  history: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    return c.json(await (await stub.fetch('http://do/history')).json());
  },
  openBridge: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json();
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    return c.json(await (await stub.fetch('http://do/bridge/open', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })).json());
  },
  translate: async (c: Context<{ Bindings: Env }>) => {
    const body = await c.req.json();
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    return c.json(await (await stub.fetch('http://do/translate', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })).json());
  },
  sealBridge: async (c: Context<{ Bindings: Env }>) => {
    const id = c.req.param('id');
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    return c.json(await (await stub.fetch(`http://do/bridge/seal/${id}`, { method: 'DELETE' })).json());
  },
  getBridge: async (c: Context<{ Bindings: Env }>) => {
    const stub = c.env.CBE_ENGINE.get(c.env.CBE_ENGINE.idFromName('global'));
    const all: any = await (await stub.fetch('http://do/bridges')).json();
    const bridge = all.data?.find((b: any) => b.id === c.req.param('id'));
    return bridge ? c.json({ success: true, data: bridge }) : c.json({ success: false, error: 'Not found' }, 404);
  },
};
