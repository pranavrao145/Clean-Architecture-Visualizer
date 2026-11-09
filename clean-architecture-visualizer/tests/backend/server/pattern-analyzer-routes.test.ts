import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import type { AddressInfo } from 'net';
import { PatternsAccess } from '../../../src/data_access/PatternsAccess.js';
import { SessionDBAccess } from '../../../src/data_access/sessionDBAccess.js';
import { CommonPatternFactory } from '../../../src/entity/CommonPatternFactory.js';
import { startServer, stopServer } from '../../../src/server/server.js';
import { makeSingletonASG } from '../fixtures/singleton-asg.js';

describe('POST /api/design-patterns/analyze', () => {
  let url: string;

  const post = (body: unknown) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeEach(async () => {
    const server = await startServer(
      true,
      new SessionDBAccess(),
      { buildCodebaseASG: async () => makeSingletonASG() },
      new PatternsAccess(new CommonPatternFactory())
    );
    const { port } = server.address() as AddressInfo;
    url = `http://localhost:${port}/api/design-patterns/analyze`;
  });

  afterEach(async () => {
    await stopServer();
  });

  it('returns the diagram and the patterns the user chose', async () => {
    const res = await post({ patternIds: ['singleton'] });
    const body = (await res.json()) as Record<string, unknown[]>;

    expect(res.status).toBe(200);
    expect(body.classes).toHaveLength(4);
    expect(body.relationships).toHaveLength(2);
    expect(body.patternInstances).toHaveLength(1);
  });

  it('responds 400 to a pattern outside the supported list', async () => {
    const res = await post({ patternIds: ['strategy'] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Unknown pattern ID: strategy',
    });
  });

  it('responds 400 to a request with no body', async () => {
    const res = await fetch(url, { method: 'POST' });

    expect(res.status).toBe(400);
  });
});
