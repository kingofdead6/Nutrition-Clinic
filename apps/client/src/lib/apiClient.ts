import type { ApiErrorBody, ErrorCode } from '@shared';

/**
 * Where the backend runs (the Render service). To develop against a local server, change
 * it to `http://localhost:4000/api` (the PORT in apps/server/.env).
 */
export const API_BASE_URL = 'https://nutrition-clinic-0ay3.onrender.com/api';

// The single entry point for HTTP calls. Auth is an httpOnly cookie set by the API, so
// every request includes credentials.

export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const isApiErrorBody = (v: unknown): v is ApiErrorBody =>
  typeof v === 'object' && v !== null && 'error' in v && typeof v.error === 'object';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      credentials: 'include',
      signal: opts.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...opts.headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'errors.network');
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (isApiErrorBody(data)) {
      throw new ApiError(res.status, data.error.code, data.error.message, data.error.details);
    }
    throw new ApiError(res.status, 'INTERNAL_ERROR', 'errors.generic');
  }
  return data as T;
}

/** `attachment; filename="x.zip"` → `x.zip`. */
function filenameFrom(disposition: string | null): string | null {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * GETs a file and saves it through the browser (an object URL + a temporary link), so
 * API errors surface as ApiError instead of a JSON page. Returns the saved file name.
 */
async function download(path: string, fallbackName: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path), { credentials: 'include' });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'errors.network');
  }
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => undefined);
    if (isApiErrorBody(data)) {
      throw new ApiError(res.status, data.error.code, data.error.message, data.error.details);
    }
    throw new ApiError(res.status, 'INTERNAL_ERROR', 'errors.generic');
  }
  const name = filenameFrom(res.headers.get('Content-Disposition')) ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

export const apiClient = {
  download,
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, body, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, undefined, opts),
  /** Absolute URL for links/images/downloads served by the API (e.g. photos, backup zip). */
  url: (path: string, query?: RequestOptions['query']) => buildUrl(path, query),
};
