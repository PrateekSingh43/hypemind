import { prisma } from "@repo/db";

const DEFAULT_PREFS = {
	themeMode: "system",
	themePalette: "hype-default",
	prefersReducedMotion: false,
	density: "comfortable",
	editorDefaultBlock: "paragraph",
	hotkeys: {
		quickCapture: "q",
		openSearch: "k",
		newJournal: "j",
		newCanvas: "c",
		toggleAssistant: ".",
		toggleTheme: "t",
		openInbox: "i",
	},
	experimental: {
		vectorSearch: false,
		graphLite: true,
		aiInlineRewrite: false,
	},
};

export async function getSettings(userId: string) {
	const record = await prisma.userSetting.findUnique({
		where: { userId },
		select: { prefs: true, updatedAt: true },
	});

	return {
		prefs: (record?.prefs as Record<string, unknown>) ?? DEFAULT_PREFS,
		updatedAt: record?.updatedAt ?? null,
	};
}

export async function getMe(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			avatarUrl: true,
		},
	});

	return user;
}

export async function updateSettings(userId: string, prefs: Record<string, unknown>) {
	// Deep merge incoming prefs with existing
	const existing = await prisma.userSetting.findUnique({
		where: { userId },
		select: { prefs: true },
	});

	const currentPrefs = (existing?.prefs as Record<string, unknown>) ?? DEFAULT_PREFS;
	const merged = deepMerge(currentPrefs, prefs);

	const record = await prisma.userSetting.upsert({
		where: { userId },
		update: { prefs: merged as any },
		create: { userId, prefs: merged as any },
		select: { prefs: true, updatedAt: true },
	});

	return {
		prefs: record.prefs as Record<string, unknown>,
		updatedAt: record.updatedAt,
	};
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		if (
			source[key] &&
			typeof source[key] === "object" &&
			!Array.isArray(source[key]) &&
			target[key] &&
			typeof target[key] === "object" &&
			!Array.isArray(target[key])
		) {
			result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
		} else {
			result[key] = source[key];
		}
	}
	return result;
}
