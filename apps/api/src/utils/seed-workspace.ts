/**
 * Seed a workspace with default PARA structure.
 * Idempotent — skips if workspace already has areas.
 * 
 * Uses the current schema: Area → Project → Item, Tag
 * (replaces the old collection/node/label-based seeder)
 */

import { prisma } from "@repo/db";

interface SeedOptions {
	workspaceId: string;
	userId: string;
}

export async function seedWorkspace({ workspaceId, userId }: SeedOptions) {
	// Idempotent check
	const existingAreaCount = await prisma.area.count({ where: { workspaceId } });
	if (existingAreaCount > 0) {
		console.log(`Workspace ${workspaceId} already seeded. Skipping.`);
		return { seeded: false };
	}

	console.log(`Seeding workspace ${workspaceId}...`);

	await prisma.$transaction(async (tx) => {
		// 1. Create default area
		const area = await tx.area.create({
			data: {
				workspaceId,
				title: "Personal",
				slug: "personal",
				description: "Your personal area for organizing projects",
				createdById: userId,
			},
		});

		// 2. Create getting-started project
		const project = await tx.project.create({
			data: {
				areaId: area.id,
				title: "Getting Started",
				slug: "getting-started",
				description: "Your first project — learn how HypeMind works",
				status: "ACTIVE",
				createdById: userId,
			},
		});

		// 3. Create welcome item (pinned, in inbox)
		await tx.item.create({
			data: {
				workspaceId,
				title: "Welcome to HypeMind",
				type: "QUICK_NOTE",
				contentJson: {
					type: "doc",
					content: [
						{
							type: "heading",
							attrs: { level: 1 },
							content: [{ type: "text", text: "Welcome to HypeMind 🧠" }],
						},
						{
							type: "paragraph",
							content: [
								{
									type: "text",
									text: "This is your second brain. Use Quick Capture (Ctrl+Q) to jot down ideas, organize them into projects, and let your thoughts evolve.",
								},
							],
						},
					],
				},
				isPinned: true,
				pinnedAt: new Date(),
				createdById: userId,
			},
		});

		// 4. Create today's journal entry
		const today = new Date();
		await tx.item.create({
			data: {
				workspaceId,
				title: today.toLocaleDateString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				}),
				type: "JOURNAL",
				metadata: { date: today.toISOString().split("T")[0] },
				createdById: userId,
			},
		});

		// 5. Create default tags
		const tags = [
			{ name: "important", color: "#EF4444" },
			{ name: "idea", color: "#F59E0B" },
			{ name: "reference", color: "#3B82F6" },
			{ name: "actionable", color: "#10B981" },
		];

		for (const tag of tags) {
			await tx.tag.create({
				data: { workspaceId, name: tag.name, color: tag.color },
			});
		}

		// 6. Set onboarding state
		await tx.workspaceSetting.upsert({
			where: { workspaceId },
			update: {},
			create: {
				workspaceId,
				prefs: { onboardingStep: 1 },
			},
		});
	});

	console.log(`Workspace ${workspaceId} seeded successfully!`);
	return { seeded: true };
}

// CLI runner
const isDirectRun = typeof require !== "undefined" && require.main === module;
if (isDirectRun) {
	const workspaceId = process.argv[2];
	const userId = process.argv[3];

	if (!workspaceId || !userId) {
		console.error("Usage: tsx seed-workspace.ts <workspaceId> <userId>");
		process.exit(1);
	}

	seedWorkspace({ workspaceId, userId })
		.then(() => process.exit(0))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
