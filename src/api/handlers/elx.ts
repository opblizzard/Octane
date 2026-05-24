import { Context } from 'hono';
import { Env } from '../../types/index.js';

const getStub = (c: Context<{ Bindings: Env }>) => c.env.ELX_LATTICE.get(c.env.ELX_LATTICE.idFromName('global'));
const jfetch = (stub: any, path: string, opts?: RequestInit) => stub.fetch(`http://do${path}`, opts).then((r: Response) => r.json());

export const elxHandler = {
  write:    async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/write', { method: 'POST', body: await c.req.text(), headers: { 'Content-Type': 'application/json' } })),
  read:     async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), `/node/${c.req.param('id')}`)),
  remove:   async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), `/node/${c.req.param('id')}`, { method: 'DELETE' })),
  query:    async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/query', { method: 'POST', body: await c.req.text(), headers: { 'Content-Type': 'application/json' } })),
  entangle: async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/entangle', { method: 'POST', body: await c.req.text(), headers: { 'Content-Type': 'application/json' } })),
  snapshot: async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/snapshot')),
  coherence:async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/coherence')),
};
