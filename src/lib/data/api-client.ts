// Browser-side client for odbc-as400-api. Only hardcoded paths are requested, so no user input reaches the URL.
export const API_BASE_URL = process.env.NEXT_PUBLIC_ODBC_API_URL ?? 'http://localhost:3099';

const WGPGBL_PATH = '/api/web/services/WGPGBL';
const MGPGST_PATH = '/api/web/services/MGPGST';
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 500;
// Caps a runaway load: 100 pages x 500 rows.
const MAX_PAGES = 100;

export class ApiError extends Error {}

type Envelope = { rows?: unknown; error?: unknown };

async function getJson(path: string, params: URLSearchParams): Promise<Envelope> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}?${params}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new ApiError(`API responded ${response.status}`);
    const body = (await response.json()) as Envelope;
    if (body.error !== undefined) throw new ApiError('API returned an error');
    return body;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    if (controller.signal.aborted) throw new ApiError('API timed out');
    throw new ApiError('API unavailable');
  } finally {
    clearTimeout(timer);
  }
}

function rowsOf(body: Envelope): unknown[] {
  if (!Array.isArray(body.rows)) throw new ApiError('API response has no rows');
  return body.rows;
}

/** Fetches every WGPGBL row in one request (the endpoint takes no parameters). */
export async function fetchWgpgblRows(): Promise<unknown[]> {
  return rowsOf(await getJson(WGPGBL_PATH, new URLSearchParams()));
}

/** Fetches every MGPGST row, one page at a time so the server handles one query at a time. */
export async function fetchMgpgstRows(): Promise<unknown[]> {
  const all: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    const rows = rowsOf(await getJson(MGPGST_PATH, params));
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
  throw new ApiError('MGPGST has more rows than the page limit');
}
