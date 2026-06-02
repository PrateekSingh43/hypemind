const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api/v1";
const REQUEST_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 10000,
);

const WORKSPACE_ID_KEY = "hm:workspace-id:v1";
export const WORKSPACE_CHANGED_EVENT = "hm:workspace-changed";

let inMemoryAccessToken: string | null = null;
let inMemoryWorkspaceId: string | null = null;

type ApiRequestInit = RequestInit & {
  requiresAuth?: boolean;
  redirectOnAuthFailure?: boolean;
  skipAuthRefresh?: boolean;
};

type AuthPayload = {
  accessToken?: unknown;
  user?: { workspaceId?: unknown };
  data?: {
    accessToken?: unknown;
    user?: { workspaceId?: unknown };
  };
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  createdAt: string;
  joinedAt: string;
};

let refreshPromise: Promise<string> | null = null;

const AUTH_REFRESH_EXCLUDED_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStorage(key: string) {
  if (!canUseStorage()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  if (!canUseStorage()) {
    return;
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures to keep app flow alive.
  }
}

function resolveEndpoint(endpoint: string) {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

function hasAuthIndicator() {
  if (!canUseStorage()) {
    return false;
  }

  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith("hm_logged_in="));
}

function canRefreshAuth(endpoint: string, init?: ApiRequestInit) {
  const endpointPath = resolveEndpoint(endpoint);
  return (
    (init?.requiresAuth ?? true) &&
    !init?.skipAuthRefresh &&
    !AUTH_REFRESH_EXCLUDED_ENDPOINTS.has(endpointPath)
  );
}

function extractAuthPayload(payload: unknown): AuthPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  return payload as AuthPayload;
}

function syncAuthPayload(payload: unknown) {
  const authPayload = extractAuthPayload(payload);
  if (!authPayload) {
    return;
  }

  const accessToken =
    typeof authPayload.data?.accessToken === "string"
      ? authPayload.data.accessToken
      : typeof authPayload.accessToken === "string"
        ? authPayload.accessToken
        : null;

  if (accessToken) {
    setAccessToken(accessToken);
  }

  const workspaceId =
    typeof authPayload.data?.user?.workspaceId === "string"
      ? authPayload.data.user.workspaceId
      : typeof authPayload.user?.workspaceId === "string"
        ? authPayload.user.workspaceId
        : null;

  if (workspaceId && !getWorkspaceId()) {
    storeWorkspaceId(workspaceId);
  }
}

async function parseResponsePayload(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? await res.json()
    : await res.text();
}

function clearAuthState() {
  clearAccessToken();
  clearWorkspaceId();
  clearAuthIndicator();
}

function handleAuthExpired(redirectOnAuthFailure = true) {
  clearAuthState();

  if (!canUseStorage() || !redirectOnAuthFailure) {
    return;
  }

  if (window.location.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set(
      "redirect",
      `${window.location.pathname}${window.location.search}`,
    );
    window.location.replace(loginUrl.toString());
  }
}

async function refreshAccessToken(redirectOnAuthFailure = true) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 10_000);
      let refreshRes: Response;
      try {
        refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          signal: controller.signal,
        });
      } catch (error) {
        const isAbortError =
          error instanceof Error && error.name === "AbortError";
        throw new Error(
          isAbortError
            ? "Auth refresh timed out"
            : "Network error during auth refresh",
        );
      } finally {
        globalThis.clearTimeout(timeout);
      }
      const refreshPayload = await parseResponsePayload(refreshRes);

      if (!refreshRes.ok) {
        const message =
          typeof refreshPayload === "object" &&
          refreshPayload !== null &&
          "message" in refreshPayload &&
          typeof (refreshPayload as { message?: unknown }).message === "string"
            ? (refreshPayload as { message: string }).message
            : "Session expired. Please login again";
        throw new Error(message);
      }

      const accessToken = extractAuthPayload(refreshPayload)?.data?.accessToken;
      if (typeof accessToken !== "string") {
        throw new Error("Refresh succeeded without an access token");
      }

      syncAuthPayload(refreshPayload);
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  try {
    return await refreshPromise;
  } catch (error) {
    handleAuthExpired(redirectOnAuthFailure);
    throw error;
  }
}

async function fetchWithTimeout(
  method: "GET" | "POST" | "PATCH",
  endpointPath: string,
  body: unknown,
  init: ApiRequestInit | undefined,
  timeoutMs: number,
) {
  const headers = new Headers(init?.headers);
  const token = getAccessToken();
  const requiresAuth = init?.requiresAuth ?? true;

  if (requiresAuth && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchInit: ApiRequestInit = { ...(init ?? {}) };
  delete fetchInit.requiresAuth;
  delete fetchInit.redirectOnAuthFailure;
  delete fetchInit.skipAuthRefresh;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${API_BASE_URL}${endpointPath}`, {
      ...fetchInit,
      method,
      credentials: "include",
      headers,
      signal: controller.signal,
      body: body === undefined ? init?.body : JSON.stringify(body),
    });
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";
    if (isAbortError) {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw new Error("Network error while contacting API");
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH",
  endpoint: string,
  body?: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  const timeoutMs =
    Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
      ? REQUEST_TIMEOUT_MS
      : 3000;
  const endpointPath = resolveEndpoint(endpoint);
  const shouldRefresh = canRefreshAuth(endpointPath, init);
  const redirectOnAuthFailure = init?.redirectOnAuthFailure ?? true;

  if (
    shouldRefresh &&
    endpointPath !== "/auth/me" &&
    !getAccessToken() &&
    hasAuthIndicator()
  ) {
    try {
      await refreshAccessToken(redirectOnAuthFailure);
    } catch {
      // Let the original request surface the auth error for this caller.
    }
  }

  let res = await fetchWithTimeout(method, endpointPath, body, init, timeoutMs);

  if (res.status === 401 && shouldRefresh) {
    try {
      await refreshAccessToken(redirectOnAuthFailure);
      res = await fetchWithTimeout(method, endpointPath, body, init, timeoutMs);
    } catch {
      // Keep the original 401 response so the normal error path gives a useful message.
    }
  }

  const responsePayload = await parseResponsePayload(res);

  if (!res.ok) {
    if (res.status === 401 && shouldRefresh) {
      handleAuthExpired(redirectOnAuthFailure);
    }

    const message =
      typeof responsePayload === "object" &&
      responsePayload !== null &&
      "message" in responsePayload &&
      typeof (responsePayload as { message?: unknown }).message === "string"
        ? (responsePayload as { message: string }).message
        : `API ${method} Error (${res.status})`;
    throw new Error(message);
  }

  syncAuthPayload(responsePayload);

  return responsePayload as T;
}

export function setAccessToken(token: string) {
  inMemoryAccessToken = token;
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
}

export function clearAuthIndicator() {
  if (canUseStorage()) {
    document.cookie =
      "hm_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Also clear it specifically for the current domain just in case
    document.cookie = `hm_logged_in=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function storeWorkspaceId(workspaceId: string) {
  inMemoryWorkspaceId = workspaceId;
  writeStorage(WORKSPACE_ID_KEY, workspaceId);
  if (canUseStorage()) {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_CHANGED_EVENT, { detail: { workspaceId } }),
    );
  }
}

export function clearWorkspaceId() {
  inMemoryWorkspaceId = null;
  writeStorage(WORKSPACE_ID_KEY, null);
  if (canUseStorage()) {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_CHANGED_EVENT, {
        detail: { workspaceId: null },
      }),
    );
  }
}

export function getWorkspaceId() {
  if (inMemoryWorkspaceId) {
    return inMemoryWorkspaceId;
  }
  const stored = readStorage(WORKSPACE_ID_KEY);
  if (stored) {
    inMemoryWorkspaceId = stored;
  }
  return stored;
}

export async function resolveWorkspaceId(): Promise<string | null> {
  const stored = getWorkspaceId();
  if (stored) {
    return stored;
  }

  try {
    const res = await api.get<{
      success: boolean;
      data?: { user?: { workspaceId?: string | null } };
    }>("/auth/me");
    const workspaceId = res.data?.user?.workspaceId ?? null;
    if (workspaceId) {
      storeWorkspaceId(workspaceId);
    }
    return workspaceId;
  } catch {
    return null;
  }
}

export function subscribeToWorkspaceChange(
  handler: (workspaceId: string | null) => void,
) {
  if (!canUseStorage()) {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<{ workspaceId?: string | null }>;
    handler(customEvent.detail?.workspaceId ?? null);
  };

  window.addEventListener(WORKSPACE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, listener);
}

export const api = {
  get: async <T>(endpoint: string, init?: ApiRequestInit): Promise<T> => {
    return request<T>("GET", endpoint, undefined, init);
  },
  post: async <T>(
    endpoint: string,
    data?: unknown,
    init?: ApiRequestInit,
  ): Promise<T> => {
    return request<T>("POST", endpoint, data, init);
  },
  patch: async <T>(
    endpoint: string,
    data?: unknown,
    init?: ApiRequestInit,
  ): Promise<T> => {
    return request<T>("PATCH", endpoint, data, init);
  },
};
