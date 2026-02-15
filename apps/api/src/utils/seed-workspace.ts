/**
 * Seed PARA Collections for a workspace
 * Run this after workspace creation to set up default structure
 */

import { prisma } from "@repo/db";

interface SeedOptions {
	workspaceId: string;
	userId: string;
}

export async function seedWorkspace({ workspaceId, userId }: SeedOptions) {
	console.log(`Seeding workspace ${workspaceId}...`);

	// 1. Create PARA root collections
	const paraCollections = [
		{ title: "Projects", type: "PROJECT" as const, description: "Active projects with deadlines" },
		{ title: "Areas", type: "AREA" as const, description: "Ongoing responsibilities" },
		{ title: "Resources", type: "RESOURCE" as const, description: "Reference materials" },
		{ title: "Archives", type: "ARCHIVE" as const, description: "Completed and inactive items" },
	];

	for (const col of paraCollections) {
		await prisma.collection.upsert({
			where: {
				id: `${workspaceId}-${col.type.toLowerCase()}`,
			},
			update: {},
			create: {
				id: `${workspaceId}-${col.type.toLowerCase()}`,
				workspaceId,
				title: col.title,
				type: col.type,
				description: col.description,
			},
		});
	}

	console.log("Created PARA collections");

	// 2. Create welcome note
	const welcomeContent = {
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { level: 1 },
				content: [{ type: "text", text: "Welcome to HypeMind 🧠" }],
			},
			{
				type: "paragraph",
				content: [{ type: "text", text: "This is your second brain. Capture ideas, organize with PARA, and let your thoughts evolve." }],
			},
			{
				type: "heading",
				attrs: { level: 2 },
				content: [{ type: "text", text: "Quick Start" }],
			},
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Press ⌘K to capture a quick thought" }] }],
					},
					{
						type: "listItem",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Move notes to Projects, Areas, or Resources" }] }],
					},
					{
						type: "listItem",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Use the sidebar to navigate your knowledge" }] }],
					},
				],
			},
		],
	};

	await prisma.node.upsert({
		where: { id: `${workspaceId}-welcome` },
		update: {},
		create: {
			id: `${workspaceId}-welcome`,
			workspaceId,
			title: "Welcome to HypeMind",
			type: "NOTE",
			studioState: "ACTIVE",
			contentJson: welcomeContent,
			contentHtml: "<h1>Welcome to HypeMind 🧠</h1><p>This is your second brain...</p>",
			isPinned: true,
			lastOpenedAt: new Date(),
		},
	});

	console.log("Created welcome note");

	// 3. Create today's journal
	const today = new Date();
	const journalTitle = today.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const journalId = `${workspaceId}-journal-${today.toISOString().split("T")[0]}`;

	await prisma.node.upsert({
		where: { id: journalId },
		update: {},
		create: {
			id: journalId,
			workspaceId,
			title: journalTitle,
			type: "JOURNAL",
			studioState: "ACTIVE",
			metadata: { date: today.toISOString().split("T")[0] },
			lastOpenedAt: new Date(),
		},
	});

	console.log("Created today's journal");

	// 4. Set onboarding state
	await prisma.workspaceSetting.upsert({
		where: { workspaceId },
		update: {},
		create: {
			workspaceId,
			prefs: { onboardingStep: 1 },
		},
	});

	console.log("Set onboarding state");

	// 5. Create default labels
	const defaultLabels = [
		{ name: "important", color: "#ef4444" },
		{ name: "idea", color: "#f59e0b" },
		{ name: "reference", color: "#3b82f6" },
		{ name: "actionable", color: "#10b981" },
	];

	for (const label of defaultLabels) {
		await prisma.label.upsert({
			where: {
				workspaceId_name: { workspaceId, name: label.name },
			},
			update: {},
			create: {
				workspaceId,
				name: label.name,
				color: label.color,
			},
		});
	}

	console.log("Created default labels");
	console.log(`Workspace ${workspaceId} seeded successfully!`);
}

// CLI runner
if (require.main === module) {
	const workspaceId = process.argv[2];
	const userId = process.argv[3];

	if (!workspaceId || !userId) {
		console.error("Usage: pnpm dlx ts-node seed-workspace.ts <workspaceId> <userId>");
		process.exit(1);
	}

	seedWorkspace({ workspaceId, userId })
		.then(() => process.exit(0))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
