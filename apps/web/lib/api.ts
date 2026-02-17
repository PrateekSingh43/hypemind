const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = {
	get: async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
		const res = await fetch(`${API_BASE_URL}${endpoint}`, {
			...init,
			headers: { "Content-Type": "application/json", ...init?.headers },
		});
		if (!res.ok) throw new Error(`API GET Error: ${res.statusText}`);
		return res.json();
	},
	post: async <T>(endpoint: string, data: any, init?: RequestInit): Promise<T> => {
		const res = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "POST",
			body: JSON.stringify(data),
			...init,
			headers: { "Content-Type": "application/json", ...init?.headers },
		});
		if (!res.ok) throw new Error(`API POST Error: ${res.statusText}`);
		return res.json();
	},
};
