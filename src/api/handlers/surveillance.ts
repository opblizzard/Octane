import { Hono } from 'hono';
import type { Env } from '../../types/index.js';

export const surveillanceRouter = new Hono<{ Bindings: Env }>();

surveillanceRouter.get('/snapshot', async (c) => {
  const stub = c.env.SURVEILLANCE_DO.get(c.env.SURVEILLANCE_DO.idFromName('global'));
  const res = await stub.fetch('http://do/surveillance/snapshot');
  return c.json(await res.json());
});

surveillanceRouter.get('/nodes', async (c) => {
  const stub = c.env.SURVEILLANCE_DO.get(c.env.SURVEILLANCE_DO.idFromName('global'));
  const res = await stub.fetch('http://do/surveillance/nodes');
  return c.json(await res.json());
});

surveillanceRouter.get('/alerts', async (c) => {
  const stub = c.env.SURVEILLANCE_DO.get(c.env.SURVEILLANCE_DO.idFromName('global'));
  const onlyActive = c.req.query('onlyActive') !== 'false';
  const res = await stub.fetch(`http://do/surveillance/alerts?onlyActive=${onlyActive}`);
  return c.json(await res.json());
});

surveillanceRouter.post('/alerts', async (c) => {
  const stub = c.env.SURVEILLANCE_DO.get(c.env.SURVEILLANCE_DO.idFromName('global'));
  const body = await c.req.json();
  const res = await stub.fetch('http://do/surveillance/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return c.json(await res.json(), res.status as 200 | 201);
});

export default surveillanceRouter;