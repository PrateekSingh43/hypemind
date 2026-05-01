import { InteractionAction, ItemType, prisma, ItemStatus } from "@repo/db";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors"

const MAX_QUICK_NOTE_LENGTH = 2500;




export const updateQuickNoteService = async (itemId: string, workspaceId: string, payload: { title?: string, content?: string, status?: string, isPinned?: boolean, projectId?: string }) => {
	if (payload.content && payload.content.length > MAX_QUICK_NOTE_LENGTH) {
		throw new BadRequestError(`Note is too long. Maximum ${MAX_QUICK_NOTE_LENGTH} characters allowed.`)
	}

	const updated = await prisma.item.update({
		where: {
			id: itemId,
			workspaceId, // Security: Ensure item belongs to the workspace
		},
		data: {
			title: payload.title,
			contentJson: payload.content as any, // In future, this will be TipTap JSON
			contentString: payload.content,
			status: payload.status as any,
			isPinned: payload.isPinned,
			projectId: payload.projectId,
		}
	});

	// Record the edit event
	await prisma.interactionEvent.create({
		data: {
			userId: updated.createdById || "",
			workspaceId,
			itemId: updated.id,
			action: "EDIT",
			meta: { fields: Object.keys(payload) }
		}
	});

	return updated;
}

export const getQuickNotesService = async (workspaceId: string) => {
	const notes = await prisma.item.findMany({
		where: {
			workspaceId,
			type: ItemType.QUICK_NOTE,
			status: ItemStatus.ACTIVE // Only show active notes in the list
		},
		orderBy: {
			updatedAt: "desc"
		},
		select: {
			id: true,
			title: true,
			contentString: true,
			updatedAt: true,
			isPinned: true,
			projectId: true,
		}
	});

	return notes;
}

export const createQuickNoteService = async (payload: { title?: string, content: string, userId: string, workspaceId: string, isPinned?: boolean, projectId?: string }) => {

	if (!payload) {
		throw new BadRequestError("Wrong data was sent")
	};

	const { title, content, userId, workspaceId } = payload;

	if (content && content.length > MAX_QUICK_NOTE_LENGTH) {
		throw new BadRequestError(`Note is too long. Maximum ${MAX_QUICK_NOTE_LENGTH} characters allowed.`)
	}


	// check if user exists and is active/verified
	const user = await prisma.user.findUnique({ where: { id: userId }, })

	if (!user || !user.isActive || !user.emailVerified) {
		throw new UnauthorizedError("User does not exist or is not authorized");
	}

	// Verify workspace membership
	const membership = await prisma.workspaceMember.findUnique({
		where: {
			workspaceId_userId: {
				workspaceId,
				userId
			}
		}
	})

	if (!membership) {
		throw new UnauthorizedError("Workspace not found or access denied");
	}

	// create the quickNote 
	const quickNote = await prisma.item.create({
		data: {
			title: title || "Untitled Note",
			contentString: content, // Now saving plain text for search
			type: ItemType.QUICK_NOTE,
			status: ItemStatus.ACTIVE,
			isPinned: payload.isPinned || false,
			workspaceId,
			createdById: userId,
			projectId: payload.projectId || null,
		}
	})

	await prisma.interactionEvent.create({
		data: {
			userId,
			workspaceId,
			itemId: quickNote.id,
			action: InteractionAction.CREATE,
			meta: { type: "quick_note" }
		}
	});

	return quickNote;
}
