const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:4000/api/v1";
const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 30000);

const ACCESS_TOKEN_KEY = "hm:access-token:v1";
const WORKSPACE_ID_KEY = "hm:workspace-id:v1";

let inMemoryAccessToken: string | null = null;
let inMemoryWorkspaceId: string | null = null;

type ApiRequestInit = RequestInit & {
	requiresAuth?: boolean;
};

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

async function request<T>(
	method: "GET" | "POST" | "PATCH",
	endpoint: string,
	body?: unknown,
	init?: ApiRequestInit
): Promise<T> {
	const headers = new Headers(init?.headers);
	const token = getAccessToken();
	const controller = new AbortController();
	const timeoutMs =
		Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
			? REQUEST_TIMEOUT_MS
			: 3000;
	const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

	if ((init?.requiresAuth ?? true) && token && !headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	if (body !== undefined && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	let res: Response;
	try {
		res = await fetch(`${API_BASE_URL}${resolveEndpoint(endpoint)}`, {
			...init,
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

	const contentType = res.headers.get("content-type") ?? "";
	const responsePayload = contentType.includes("application/json")
		? await res.json()
		: await res.text();

	if (!res.ok) {
		const message =
			typeof responsePayload === "object" &&
				responsePayload !== null &&
				"message" in responsePayload &&
				typeof (responsePayload as { message?: unknown }).message === "string"
				? (responsePayload as { message: string }).message
				: `API ${method} Error (${res.status})`;
		throw new Error(message);
	}

	return responsePayload as T;
}

export function setAccessToken(token: string) {
	inMemoryAccessToken = token;
	writeStorage(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
	inMemoryAccessToken = null;
	writeStorage(ACCESS_TOKEN_KEY, null);
}

export function getAccessToken() {
	if (inMemoryAccessToken) {
		return inMemoryAccessToken;
	}
	const stored = readStorage(ACCESS_TOKEN_KEY);
	if (stored) {
		inMemoryAccessToken = stored;
	}
	return stored;
}

export function storeWorkspaceId(workspaceId: string) {
	inMemoryWorkspaceId = workspaceId;
	writeStorage(WORKSPACE_ID_KEY, workspaceId);
}

export function clearWorkspaceId() {
	inMemoryWorkspaceId = null;
	writeStorage(WORKSPACE_ID_KEY, null);
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

	if (!getAccessToken()) {
		return null;
	}

	try {
		const res = await api.get<{ success: boolean; data?: { user?: { workspaceId?: string | null } } }>(
			"/auth/me"
		);
		const workspaceId = res.data?.user?.workspaceId ?? null;
		if (workspaceId) {
			storeWorkspaceId(workspaceId);
		}
		return workspaceId;
	} catch {
		return null;
	}
}

export const api = {
	get: async <T>(endpoint: string, init?: ApiRequestInit): Promise<T> => {
		return request<T>("GET", endpoint, undefined, init);
	},
	post: async <T>(endpoint: string, data: unknown, init?: ApiRequestInit): Promise<T> => {
		return request<T>("POST", endpoint, data, init);
	},
	patch: async <T>(endpoint: string, data: unknown, init?: ApiRequestInit): Promise<T> => {
		return request<T>("PATCH", endpoint, data, init);
	},
};
