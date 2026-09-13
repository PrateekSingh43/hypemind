import {
  InteractionAction,
  ItemType,
  prisma,
  ItemStatus,
  type Prisma,
} from "@repo/db";
import { BadRequestError, UnauthorizedError } from "../errors/httpErrors";

const MAX_QUICK_NOTE_LENGTH = 2500;
const MAX_QUICK_NOTE_TAGS = 10;

const quickNoteSelect = {
  id: true,
  title: true,
  contentString: true,
  contentJson: true,
  updatedAt: true,
  isPinned: true,
  projectId: true,
  tags: {
    select: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ItemSelect;

type QuickNoteWithTags = Prisma.ItemGetPayload<{
  select: typeof quickNoteSelect;
}>;

type QuickNotePayload = {
  title?: string;
  content?: string;
  contentJson?: unknown;
  status?: string;
  isPinned?: boolean;
  projectId?: string;
  deletedAt?: Date | string | null;
  tags?: string[];
};

const serializeQuickNote = (note: QuickNoteWithTags) => ({
  ...note,
  tags: note.tags.map(({ tag }) => tag.name),
});

const normalizeTags = (tags?: string[]) => {
  if (tags === undefined) return undefined;

  return Array.from(
    new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ).slice(0, MAX_QUICK_NOTE_TAGS);
};

const syncQuickNoteTags = async (
  tx: Prisma.TransactionClient,
  workspaceId: string,
  itemId: string,
  tags?: string[],
) => {
  if (tags === undefined) return;

  await tx.itemTag.deleteMany({
    where: { itemId },
  });

  for (const name of tags) {
    const tag = await tx.tag.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
      update: {},
      create: {
        workspaceId,
        name,
      },
    });

    await tx.itemTag.create({
      data: {
        itemId,
        tagId: tag.id,
      },
    });
  }
};

export const updateQuickNoteService = async (
  userId: string,
  itemId: string,
  workspaceId: string,
  payload: QuickNotePayload,
) => {
  if (
    typeof payload.content === "string" &&
    payload.content.length > MAX_QUICK_NOTE_LENGTH
  ) {
    throw new BadRequestError(
      `Note is too long. Maximum ${MAX_QUICK_NOTE_LENGTH} characters allowed.`,
    );
  }

  const tags = normalizeTags(payload.tags);

  const { itemForEvent, note } = await prisma.$transaction(async (tx) => {
    // Security: Ensure item belongs to the workspace
    const existing = await tx.item.findFirst({
      where: { id: itemId, workspaceId },
    });
    if (!existing) {
      throw new Error("Item not found or access denied");
    }

    const itemForEvent = await tx.item.update({
      where: {
        id: itemId,
      },
      data: {
        title: payload.title,
        contentJson:
          payload.contentJson === undefined
            ? undefined
            : (payload.contentJson as Prisma.InputJsonValue),
        contentString: payload.content,
        status: payload.status as ItemStatus | undefined,
        isPinned: payload.isPinned,
        projectId: payload.projectId,
        deletedAt: payload.deletedAt,
      },
    });

    await syncQuickNoteTags(tx, workspaceId, itemId, tags);

    const note = await tx.item.findFirstOrThrow({
      where: {
        id: itemId,
        workspaceId,
      },
      select: quickNoteSelect,
    });

    return { itemForEvent, note };
  });


  return serializeQuickNote(note);
};

export const getQuickNotesService = async (workspaceId: string) => {
  const notes = await prisma.item.findMany({
    where: {
      workspaceId,
      type: ItemType.QUICK_NOTE,
      status: ItemStatus.ACTIVE, // Only show active notes in the list
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: quickNoteSelect,
  });

  return notes.map(serializeQuickNote);
};

export const createQuickNoteService = async (payload: {
  title?: string;
  content: string;
  contentJson?: unknown;
  userId: string;
  workspaceId: string;
  isPinned?: boolean;
  projectId?: string;
  tags?: string[];
}) => {
  if (!payload) {
    throw new BadRequestError("Wrong data was sent");
  }

  const { title, content, userId, workspaceId } = payload;

  if (content && content.length > MAX_QUICK_NOTE_LENGTH) {
    throw new BadRequestError(
      `Note is too long. Maximum ${MAX_QUICK_NOTE_LENGTH} characters allowed.`,
    );
  }

  // check if user exists and is active/verified
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive || !user.emailVerified) {
    throw new UnauthorizedError("User does not exist or is not authorized");
  }

  // Verify workspace membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("Workspace not found or access denied");
  }

  const tags = normalizeTags(payload.tags);

  // create the quickNote
  const quickNote = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        title: title || "Untitled Note",
        contentString: content, // Now saving plain text for search
        contentJson:
          payload.contentJson === undefined
            ? undefined
            : (payload.contentJson as Prisma.InputJsonValue),
        type: ItemType.QUICK_NOTE,
        status: ItemStatus.ACTIVE,
        isPinned: payload.isPinned || false,
        workspaceId,
        createdById: userId,
        projectId: payload.projectId || null,
      },
    });

    await syncQuickNoteTags(tx, workspaceId, created.id, tags);

    return tx.item.findFirstOrThrow({
      where: {
        id: created.id,
        workspaceId,
      },
      select: quickNoteSelect,
    });
  });

  await prisma.interactionEvent.create({
    data: {
      userId,
      workspaceId,
      itemId: quickNote.id,
      action: InteractionAction.CREATE,
      meta: { type: "quick_note" },
    },
  });

  return serializeQuickNote(quickNote);
};

export const duplicateQuickNoteService = async (
  userId: string,
  workspaceId: string,
  itemId: string
) => {
  const originalItem = await prisma.item.findFirst({
    where: { id: itemId, workspaceId },
    include: { tags: { include: { tag: true } } },
  });

  if (!originalItem) {
    throw new Error("Item not found");
  }

  const titleMatch = (originalItem.title || "Untitled Note").match(/^(.*) \((\d+)\)$/);
  let baseTitle = originalItem.title || "Untitled Note";
  if (titleMatch) {
    baseTitle = titleMatch[1];
  } else {
    const copyMatch = baseTitle.match(/^(.*) \(Copy\)$/);
    if (copyMatch) {
      baseTitle = copyMatch[1];
    }
  }

  const existingItems = await prisma.item.findMany({
    where: {
      workspaceId,
      type: ItemType.QUICK_NOTE,
      title: {
        startsWith: baseTitle,
      },
    },
    select: { title: true },
  });

  let maxNum = 0;
  for (const p of existingItems) {
    if (p.title === baseTitle) {
      // base exists
    } else {
      const escapedBase = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = (p.title || "").match(new RegExp(`^${escapedBase} \\((\\d+)\\)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const newTitle = `${baseTitle} (${maxNum + 1})`;

  const quickNote = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        title: newTitle,
        contentString: originalItem.contentString,
        contentJson: originalItem.contentJson
          ? JSON.parse(JSON.stringify(originalItem.contentJson))
          : undefined,
        type: ItemType.QUICK_NOTE,
        status: ItemStatus.ACTIVE,
        isPinned: originalItem.isPinned,
        workspaceId,
        createdById: userId,
        projectId: originalItem.projectId,
      },
    });

    const tags = originalItem.tags.map(t => t.tag.name);
    await syncQuickNoteTags(tx, workspaceId, created.id, tags);

    return tx.item.findFirstOrThrow({
      where: {
        id: created.id,
        workspaceId,
      },
      select: quickNoteSelect,
    });
  });

  await prisma.interactionEvent.create({
    data: {
      userId,
      workspaceId,
      itemId: quickNote.id,
      action: InteractionAction.DUPLICATE,
      meta: { type: "quick_note", originalId: itemId },
    },
  });

  return serializeQuickNote(quickNote);
};
