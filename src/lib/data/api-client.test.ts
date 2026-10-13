import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchMgpgstRows, fetchWgpgblRows } from './api-client';

afterEach(() => {
  vi.unstubAllGlobals();
});

const rowsOf = (count: number) => Array.from({ length: count }, (_, i) => ({ id: i }));
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('fetchMgpgstRows', () => {
  it('reads pages of 500 until a short page and returns all rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ P_ISFOUND: '1', rows: rowsOf(500) }))
      .mockResolvedValueOnce(jsonResponse({ P_ISFOUND: '1', rows: rowsOf(3) }));
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchMgpgstRows();

    expect(rows).toHaveLength(503);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/web/services/MGPGST?limit=500&offset=0');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('limit=500&offset=500');
  });

  it('stops with an error when the page limit is exceeded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => jsonResponse({ rows: rowsOf(500) })),
    );

    await expect(fetchMgpgstRows()).rejects.toThrow('MGPGST has more rows than the page limit');
  });
});

describe('fetchWgpgblRows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a 503 with backoff and returns the rows when a later attempt succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ rows: rowsOf(2) }));
    vi.stubGlobal('fetch', fetchMock);

    const pending = fetchWgpgblRows();
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after three attempts and reports the last HTTP status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 429));
    vi.stubGlobal('fetch', fetchMock);

    const pending = expect(fetchWgpgblRows()).rejects.toThrow('API responded 429');
    await vi.runAllTimersAsync();

    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 400 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 400));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWgpgblRows()).rejects.toThrow('API responded 400');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with the HTTP status when the API responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(fetchWgpgblRows()).rejects.toThrow(new ApiError('API responded 500'));
  });

  it('does not expose the API error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: false, error: 'SQL0204 table secret' })),
    );

    await expect(fetchWgpgblRows()).rejects.toThrow('API returned an error');
  });

  it('reports an unreachable API without the network detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const pending = expect(fetchWgpgblRows()).rejects.toThrow('API unavailable');
    await vi.runAllTimersAsync();

    await pending;
  });
});
