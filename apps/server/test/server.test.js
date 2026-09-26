import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { startServer } from '../src/server.js';

const configFor = (/** @type {number} */ port) => {
  const url = new URL(inject('mongoUri'));
  url.pathname = `/test_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  return loadConfig({
    NODE_ENV: 'test',
    PORT: String(port),
    MONGO_URI: url.toString(),
    DATA_DIR: path.join(os.tmpdir(), `clinic-test-${randomUUID()}`),
  });
};

describe('startServer', () => {
  /** @type {import('node:http').Server} */
  let blocker;
  let busyPort = 0;

  beforeAll(async () => {
    blocker = createServer();
    await new Promise((r) => blocker.listen(0, '127.0.0.1', () => r(undefined)));
    busyPort = /** @type {import('node:net').AddressInfo} */ (blocker.address()).port;
  });
  afterAll(() => new Promise((r) => blocker.close(() => r(undefined))));

  it('PORT=0 picks a free port and reports it', async () => {
    const running = await startServer(configFor(0));
    try {
      expect(running.port).toBeGreaterThan(0);
      const res = await fetch(`${running.url}/api/health`);
      expect(res.status).toBe(200);
    } finally {
      await running.close();
    }
  });

  it('rejects with EADDRINUSE when the port is taken (regression: crashed with a TypeError)', async () => {
    await expect(startServer(configFor(busyPort))).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });
});
