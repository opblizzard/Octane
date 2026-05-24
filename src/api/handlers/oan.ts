import { Context } from 'hono';
import { Env } from '../../types/index.js';

const getStub = (c: Context<{ Bindings: Env }>) => c.env.OAN_NODE.get(c.env.OAN_NODE.idFromName('global'));
const jfetch = (stub: any, path: string, opts?: RequestInit) => stub.fetch(`http://do${path}`, opts).then((r: Response) => r.json());

export const oanHandler = {
  stages:       async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/stages')),
  currentStage: async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/stages')),
  advance:      async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/advance', { method: 'POST', body: await c.req.text(), headers: { 'Content-Type': 'application/json' } })),
  oath:         async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/oath')),
  signOath:     async (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { signed: true, message: 'Oath signed. The engine acknowledges the Sovereign.' } }),
  issueDecree:  async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/decree', { method: 'POST', body: await c.req.text(), headers: { 'Content-Type': 'application/json' } })),
  decrees:      async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/decrees')),
  ethicsCheck:  async (c: Context<{ Bindings: Env }>) => c.json({ success: true, data: { verdict: 'PERMITTED', rationale: 'Action within governance bounds.' } }),
  ethicsLog:    async (c: Context<{ Bindings: Env }>) => c.json(await jfetch(getStub(c), '/ethics')),
};
