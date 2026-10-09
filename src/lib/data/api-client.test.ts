import { afterEach, describe, expect, it, vi } from 'vitest';
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
  it('fails with the HTTP status when the API responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    await expect(fetchWgpgblRows()).rejects.toThrow(new ApiError('API responded 503'));
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

    await expect(fetchWgpgblRows()).rejects.toThrow('API unavailable');
  });
});
