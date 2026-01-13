import db from "@/lib/db";
import {
  boardsTable,
  listsTable,
  cardsTable,
  cardLabelsTable,
  cardMembersTable,
  labelsTable,
  boardMembersTable,
  attachmentsTable
} from "@/lib/db/schema";
import { eq, and, gte, gt, lt, lte, sql } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { randomUUID } from "crypto";
import { logActivity } from "./activities.service";
import { publishBoardChanged } from "./events.service";
import { ensureBoardMembersExist } from "./members.service";
import { 
  CreateCardSchema, 
  UpdateCardSchema,
  CardLabelSchema,
  CardMemberSchema,
  CardAttachmentSchema
} from "@/types/cards";
import type { z } from "zod";

// Infer types from Zod schemas
type CreateCardRequest = z.infer<typeof CreateCardSchema>;
type UpdateCardRequest = z.infer<typeof UpdateCardSchema>;
type CardLabel = z.infer<typeof CardLabelSchema>;
type CardMember = z.infer<typeof CardMemberSchema>;
type CardAttachment = z.infer<typeof CardAttachmentSchema>;

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

// Note: `userSub` is the authenticated user's subject (user id)
export async function getCardsForBoard(userSub: string, boardId: string) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const cards = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(listsTable.boardId, boardId));

  const cardIds = cards.map(c => c.cards.id);

  if (cardIds.length === 0) {
    return [];
  }

  const cardLabelsData = await db
    .select({
      cardId: cardLabelsTable.cardId,
      labelId: labelsTable.id,
      labelName: labelsTable.name,
      labelColor: labelsTable.color,
    })
    .from(cardLabelsTable)
    .innerJoin(labelsTable, eq(cardLabelsTable.labelId, labelsTable.id))
    .where(sql`${cardLabelsTable.cardId} IN (${sql.join(cardIds.map(id => sql`${id}`), sql`, `)})`);

  const cardMembersData = await db
    .select({
      cardId: cardMembersTable.cardId,
      memberId: boardMembersTable.id,
      memberName: boardMembersTable.name,
      memberEmail: boardMembersTable.email,
      memberAvatar: boardMembersTable.avatar,
    })
    .from(cardMembersTable)
    .innerJoin(boardMembersTable, eq(cardMembersTable.memberId, boardMembersTable.id))
    .where(sql`${cardMembersTable.cardId} IN (${sql.join(cardIds.map(id => sql`${id}`), sql`, `)})`);

  const cardAttachmentsData = await db
    .select()
    .from(attachmentsTable)
    .where(sql`${attachmentsTable.cardId} IN (${sql.join(cardIds.map(id => sql`${id}`), sql`, `)})`);

  const labelsByCard = new Map<string, CardLabel[]>();
  for (const cl of cardLabelsData) {
    if (!labelsByCard.has(cl.cardId)) {
      labelsByCard.set(cl.cardId, []);
    }
    labelsByCard.get(cl.cardId)!.push({
      id: cl.labelId,
      name: cl.labelName,
      color: cl.labelColor,
    });
  }

  const membersByCard = new Map<string, CardMember[]>();
  for (const cm of cardMembersData) {
    if (!membersByCard.has(cm.cardId)) {
      membersByCard.set(cm.cardId, []);
    }
    const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    membersByCard.get(cm.cardId)!.push({
      id: cm.memberId,
      name: cm.memberName,
      email: cm.memberEmail,
      avatar: cm.memberAvatar,
      initials,
    });
  }

  const attachmentsByCard = new Map<string, CardAttachment[]>();
  for (const attachment of cardAttachmentsData) {
    if (!attachmentsByCard.has(attachment.cardId)) {
      attachmentsByCard.set(attachment.cardId, []);
    }
    attachmentsByCard.get(attachment.cardId)!.push(attachment);
  }

  return cards.map(c => ({
    id: c.cards.id,
    name: c.cards.name,
    description: c.cards.description,
    order: c.cards.order,
    listId: c.cards.listId,
    labels: labelsByCard.get(c.cards.id) || [],
    members: membersByCard.get(c.cards.id) || [],
    attachments: attachmentsByCard.get(c.cards.id) || [],
    startDate: c.cards.startDate,
    deadline: c.cards.deadline,
    dueAt: c.cards.dueAt,
    dueComplete: c.cards.dueComplete,
    reminderMinutes: c.cards.reminderMinutes,
    latitude: c.cards.latitude,
    longitude: c.cards.longitude,
    coverColor: c.cards.coverColor,
    coverUrl: c.cards.coverUrl,
    completed: c.cards.completed,
    isTemplate: c.cards.isTemplate,
  }));
}

export async function createCard(userSub: string, boardId: string, req: CreateCardRequest) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền tạo Card trong Board này", 403);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, req.listId))
    .limit(1);

  if (list.length === 0) {
    throw new ServiceError("List không tồn tại", 404);
  }

  if (list[0].boardId !== boardId) {
    throw new ServiceError("List không thuộc Board này", 403);
  }

  const cardsInList = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.listId, req.listId));

  const listSize = cardsInList.length;

  if (req.order < 0 || req.order > listSize) {
    throw new ServiceError(`Order must be between 0 and ${listSize} for this list`, 400);
  }

  const card = await db
    .insert(cardsTable)
    .values({
      id: req.id,
      name: req.name,
      description: req.description,
      order: req.order,
      listId: req.listId,
      startDate: req.startDate ? new Date(req.startDate) : null,
      deadline: req.deadline ? new Date(req.deadline) : null,
      dueAt: req.dueAt ? new Date(req.dueAt) : null,
      dueComplete: req.dueComplete ?? false,
      reminderMinutes: req.reminderMinutes ?? null,
      latitude: req.latitude,
      longitude: req.longitude,
      coverColor: req.coverColor,
      coverUrl: req.coverUrl,
      coverUrl: req.coverUrl,
      completed: req.completed,
      isTemplate: req.isTemplate ?? false,
    })
    .returning();

  const createdCard = card[0];

  if (req.labels && req.labels.length > 0) {
    const labelInserts = req.labels.map((label) => ({
      id: randomUUID(),
      cardId: createdCard.id,
      labelId: label.id,
    }));
    await db.insert(cardLabelsTable).values(labelInserts);
  }

  if (req.members && req.members.length > 0) {
    // Ensure all members exist in board_members table (fetch from Auth0 if needed)
    const memberIds = req.members.map(m => m.id);
    const validatedMembers = await ensureBoardMembersExist(boardId, memberIds);
    
    if (validatedMembers.length > 0) {
      const memberInserts = validatedMembers.map((member) => ({
        id: randomUUID(),
        cardId: createdCard.id,
        memberId: member.id,
      }));
      await db.insert(cardMembersTable).values(memberInserts);
    }
  }

  // Log activity for card creation (non-blocking)
  try {
    await logActivity({
      cardId: createdCard.id,
      userId: userSub,
      actionType: "card.created",
      description: `created this card`,
    });
  } catch (error) {
    console.error("Failed to log activity for card creation:", error);
    // Don't fail the main operation if activity logging fails
  }

  // Publish card created event
  publishBoardChanged(boardId, 'card', createdCard.id, 'created', userSub);

  // Fetch the created members if any were added
  let cardMembers: CardMember[] = [];
  if (req.members && req.members.length > 0) {
    const cardMembersData = await db
      .select({
        memberId: boardMembersTable.id,
        memberName: boardMembersTable.name,
        memberEmail: boardMembersTable.email,
        memberAvatar: boardMembersTable.avatar,
      })
      .from(cardMembersTable)
      .innerJoin(boardMembersTable, eq(cardMembersTable.memberId, boardMembersTable.id))
      .where(eq(cardMembersTable.cardId, createdCard.id));

    cardMembers = cardMembersData.map(cm => {
      const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return {
        id: cm.memberId,
        name: cm.memberName,
        email: cm.memberEmail,
        avatar: cm.memberAvatar,
        initials,
      };
    });
  }

  // Return card with labels and members as arrays
  return {
    ...createdCard,
    labels: req.labels || [],
    members: cardMembers,
  };
}

export async function getCardById(userSub: string, boardId: string, id: string) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, card[0].cards.listId))
    .limit(1);

  if (list.length === 0 || list[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const cardLabelsData = await db
    .select({
      labelId: labelsTable.id,
      labelName: labelsTable.name,
      labelColor: labelsTable.color,
    })
    .from(cardLabelsTable)
    .innerJoin(labelsTable, eq(cardLabelsTable.labelId, labelsTable.id))
    .where(eq(cardLabelsTable.cardId, id));

  const cardMembersData = await db
    .select({
      memberId: boardMembersTable.id,
      memberName: boardMembersTable.name,
      memberEmail: boardMembersTable.email,
      memberAvatar: boardMembersTable.avatar,
    })
    .from(cardMembersTable)
    .innerJoin(boardMembersTable, eq(cardMembersTable.memberId, boardMembersTable.id))
    .where(eq(cardMembersTable.cardId, id));

  const cardAttachments = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.cardId, id));

  const labels = cardLabelsData.map(cl => ({
    id: cl.labelId,
    name: cl.labelName,
    color: cl.labelColor,
  }));

  const members = cardMembersData.map(cm => {
    const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return {
      id: cm.memberId,
      name: cm.memberName,
      email: cm.memberEmail,
      avatar: cm.memberAvatar,
      initials,
    };
  });

  return {
    id: card[0].cards.id,
    name: card[0].cards.name,
    description: card[0].cards.description,
    order: card[0].cards.order,
    listId: card[0].cards.listId,
    labels: labels,
    members: members,
    attachments: cardAttachments,
    startDate: card[0].cards.startDate,
    deadline: card[0].cards.deadline,
    dueAt: card[0].cards.dueAt,
    dueComplete: card[0].cards.dueComplete,
    reminderMinutes: card[0].cards.reminderMinutes,
    latitude: card[0].cards.latitude,
    longitude: card[0].cards.longitude,
    coverColor: card[0].cards.coverColor,
    coverUrl: card[0].cards.coverUrl,
    coverUrl: card[0].cards.coverUrl,
    completed: card[0].cards.completed,
    isTemplate: card[0].cards.isTemplate,
  };
}

export async function updateCard(userSub: string, boardId: string, id: string, req: UpdateCardRequest) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const existingCard = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (existingCard.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const currentList = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, existingCard[0].listId))
    .limit(1);

  if (currentList.length === 0 || currentList[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  if (req.listId && req.listId !== existingCard[0].listId) {
    const newList = await db
      .select()
      .from(listsTable)
      .where(eq(listsTable.id, req.listId))
      .limit(1);

    if (newList.length === 0) {
      throw new ServiceError("List đích không tồn tại", 404);
    }

    if (newList[0].boardId !== boardId) {
      throw new ServiceError("List đích không thuộc Board này", 403);
    }
  }

  if (req.order !== undefined) {
    const targetListId = req.listId || existingCard[0].listId;
    const isMovingToNewList = req.listId && req.listId !== existingCard[0].listId;

    const cardsInTargetList = await db
      .select()
      .from(cardsTable)
      .where(
        isMovingToNewList
          ? eq(cardsTable.listId, targetListId)
          : and(
              eq(cardsTable.listId, targetListId),
              sql`${cardsTable.id} != ${id}`
            )
      );

    const targetListSize = cardsInTargetList.length;

    if (req.order < 0 || req.order > targetListSize) {
      throw new ServiceError(`Order must be between 0 and ${targetListSize} for this list`, 400);
    }
  }

  const isMovingToNewList = req.listId && req.listId !== existingCard[0].listId;
  const isChangingOrder = req.order !== undefined && req.order !== existingCard[0].order;

  if (isMovingToNewList || isChangingOrder) {
    const oldListId = existingCard[0].listId;
    const newListId = req.listId || oldListId;
    const oldOrder = existingCard[0].order;
    const newOrder = req.order !== undefined ? req.order : existingCard[0].order;

    if (isMovingToNewList) {
      await db
        .update(cardsTable)
        .set({
          order: sql`${cardsTable.order} - 1`,
        })
        .where(
          and(
            eq(cardsTable.listId, oldListId),
            gt(cardsTable.order, oldOrder)
          )
        );

      await db
        .update(cardsTable)
        .set({
          order: sql`${cardsTable.order} + 1`,
        })
        .where(
          and(
            eq(cardsTable.listId, newListId),
            gte(cardsTable.order, newOrder)
          )
        );
    } else {
      if (newOrder > oldOrder) {
        await db
          .update(cardsTable)
          .set({
            order: sql`${cardsTable.order} - 1`,
          })
          .where(
            and(
              eq(cardsTable.listId, oldListId),
              gt(cardsTable.order, oldOrder),
              lte(cardsTable.order, newOrder)
            )
          );
      } else {
        await db
          .update(cardsTable)
          .set({
            order: sql`${cardsTable.order} + 1`,
          })
          .where(
            and(
              eq(cardsTable.listId, oldListId),
              gte(cardsTable.order, newOrder),
              lt(cardsTable.order, oldOrder)
            )
          );
      }
    }
  }

  const updateData: Partial<typeof cardsTable.$inferInsert> = {};
  if (req.name !== undefined) updateData.name = req.name;
  if (req.description !== undefined) updateData.description = req.description;
  if (req.order !== undefined) updateData.order = req.order;
  if (req.listId !== undefined) updateData.listId = req.listId;
  if (req.startDate !== undefined) updateData.startDate = req.startDate ? new Date(req.startDate) : null;
  if (req.deadline !== undefined) updateData.deadline = req.deadline ? new Date(req.deadline) : null;
  if (req.dueAt !== undefined) updateData.dueAt = req.dueAt ? new Date(req.dueAt) : null;
  if (req.dueComplete !== undefined) updateData.dueComplete = req.dueComplete;
  if (req.reminderMinutes !== undefined) updateData.reminderMinutes = req.reminderMinutes;
  if (req.latitude !== undefined) updateData.latitude = req.latitude;
  if (req.longitude !== undefined) updateData.longitude = req.longitude;
  if (req.coverColor !== undefined) updateData.coverColor = req.coverColor;
  if (req.coverUrl !== undefined) updateData.coverUrl = req.coverUrl;
  if (req.coverMode !== undefined) updateData.coverMode = req.coverMode;
  if (req.coverMode !== undefined) updateData.coverMode = req.coverMode;
  if (req.completed !== undefined) updateData.completed = req.completed;
  if (req.isTemplate !== undefined) updateData.isTemplate = req.isTemplate;

  let updatedCard;
  if (Object.keys(updateData).length > 0) {
    const result = await db
      .update(cardsTable)
      .set(updateData)
      .where(eq(cardsTable.id, id))
      .returning();
    updatedCard = result[0];
  } else {
    const current = await db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.id, id))
      .limit(1);
    updatedCard = current[0];
  }

  if (req.labels !== undefined) {
    try {
      await db.delete(cardLabelsTable).where(eq(cardLabelsTable.cardId, id));

      if (req.labels && req.labels.length > 0) {
        const labelInserts = req.labels.map((label) => ({
          id: randomUUID(),
          cardId: id,
          labelId: label.id,
        }));
        await db.insert(cardLabelsTable).values(labelInserts);
      }
    } catch (error) {
      console.error("Error updating labels:", error);
      throw error;
    }
  }

  if (req.members !== undefined) {
    await db.delete(cardMembersTable).where(eq(cardMembersTable.cardId, id));

    if (req.members && req.members.length > 0) {
      // Ensure all members exist in board_members table (fetch from Auth0 if needed)
      const memberIds = req.members.map(m => m.id);
      const validatedMembers = await ensureBoardMembersExist(boardId, memberIds);
      
      if (validatedMembers.length > 0) {
        const memberInserts = validatedMembers.map((member) => ({
          id: randomUUID(),
          cardId: id,
          memberId: member.id,
        }));
        await db.insert(cardMembersTable).values(memberInserts);
      }
    }
  }

  // Always fetch and return attachments
  const cardAttachments = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.cardId, id));

  // Log activities for detected changes (non-blocking)
  try {
    // Name changed
    if (req.name && req.name !== existingCard[0].name) {
      await logActivity({
        cardId: id,
        userId: userSub,
        actionType: "card.renamed",
        description: `renamed this card from "${existingCard[0].name}" to "${req.name}"`,
        metadata: { oldName: existingCard[0].name, newName: req.name },
      });
    }

    // Description updated
    if (req.description !== undefined && req.description !== existingCard[0].description) {
      await logActivity({
        cardId: id,
        userId: userSub,
        actionType: "card.description.updated",
        description: req.description ? `updated the description` : `removed the description`,
      });
    }

    // Card moved to different list
    if (req.listId && req.listId !== existingCard[0].listId) {
      // Get list names for better description
      const [oldListResult, newListResult] = await Promise.all([
        db.select({ name: listsTable.name }).from(listsTable).where(eq(listsTable.id, existingCard[0].listId)).limit(1),
        db.select({ name: listsTable.name }).from(listsTable).where(eq(listsTable.id, req.listId)).limit(1),
      ]);

      const oldListName = oldListResult[0]?.name || "Unknown";
      const newListName = newListResult[0]?.name || "Unknown";

      await logActivity({
        cardId: id,
        userId: userSub,
        actionType: "card.moved",
        description: `moved this card from "${oldListName}" to "${newListName}"`,
        metadata: {
          oldListId: existingCard[0].listId,
          newListId: req.listId,
          oldListName,
          newListName,
        },
      });
    }

    // Deadline changed
    if (req.deadline !== undefined) {
      const oldDeadline = existingCard[0].deadline;
      if (!oldDeadline && req.deadline) {
        await logActivity({
          cardId: id,
          userId: userSub,
          actionType: "deadline.set",
          description: `set the deadline to ${new Date(req.deadline).toLocaleDateString()}`,
          metadata: { deadline: req.deadline },
        });
      } else if (oldDeadline && !req.deadline) {
        await logActivity({
          cardId: id,
          userId: userSub,
          actionType: "deadline.removed",
          description: `removed the deadline`,
        });
      } else if (oldDeadline && req.deadline && oldDeadline.getTime() !== new Date(req.deadline).getTime()) {
        await logActivity({
          cardId: id,
          userId: userSub,
          actionType: "deadline.changed",
          description: `changed the deadline from ${oldDeadline.toLocaleDateString()} to ${new Date(req.deadline).toLocaleDateString()}`,
          metadata: { oldDeadline, newDeadline: req.deadline },
        });
      }
    }
  } catch (error) {
    console.error("Failed to log activity for card update:", error);
    // Don't fail the main operation if activity logging fails
  }

  // Publish card updated event (or moved if list changed)
  const action = (req.listId && req.listId !== existingCard[0].listId) ? 'moved' : 'updated';
  publishBoardChanged(boardId, 'card', id, action, userSub);

  // Fetch updated labels and members if they were modified
  let updatedLabels = undefined;
  let updatedMembers = undefined;

  if (req.labels !== undefined) {
    const cardLabelsData = await db
      .select({
        labelId: labelsTable.id,
        labelName: labelsTable.name,
        labelColor: labelsTable.color,
      })
      .from(cardLabelsTable)
      .innerJoin(labelsTable, eq(cardLabelsTable.labelId, labelsTable.id))
      .where(eq(cardLabelsTable.cardId, id));

    updatedLabels = cardLabelsData.map(cl => ({
      id: cl.labelId,
      name: cl.labelName,
      color: cl.labelColor,
    }));
  }

  if (req.members !== undefined) {
    const cardMembersData = await db
      .select({
        memberId: boardMembersTable.id,
        memberName: boardMembersTable.name,
        memberEmail: boardMembersTable.email,
        memberAvatar: boardMembersTable.avatar,
      })
      .from(cardMembersTable)
      .innerJoin(boardMembersTable, eq(cardMembersTable.memberId, boardMembersTable.id))
      .where(eq(cardMembersTable.cardId, id));

    updatedMembers = cardMembersData.map(cm => {
      const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return {
        id: cm.memberId,
        name: cm.memberName,
        email: cm.memberEmail,
        avatar: cm.memberAvatar,
        initials,
      };
    });
  }

  // Return card with labels, members, and attachments as arrays
  return {
    ...updatedCard,
    labels: updatedLabels,
    members: updatedMembers,
    attachments: cardAttachments,
  };
}

export async function deleteCard(userSub: string, boardId: string, id: string) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const existingCard = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (existingCard.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const list = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.id, existingCard[0].listId))
    .limit(1);

  if (list.length === 0 || list[0].boardId !== boardId) {
    throw new ServiceError("Card không thuộc Board này", 403);
  }

  const deletedCardOrder = existingCard[0].order;
  const deletedCardListId = existingCard[0].listId;

  await db.delete(cardsTable).where(eq(cardsTable.id, id));

  await db
    .update(cardsTable)
    .set({
      order: sql`${cardsTable.order} - 1`,
    })
    .where(
      and(
        eq(cardsTable.listId, deletedCardListId),
        gt(cardsTable.order, deletedCardOrder)
      )
    );

  // Publish card deleted event
  publishBoardChanged(boardId, 'card', id, 'deleted', userSub);

  return { message: "Xóa Card thành công" };
}

export async function updateCardDue(
  userSub: string,
  boardId: string,
  cardId: string,
  dueData: { startDate?: string | null; dueAt?: string | null; dueComplete?: boolean; reminderMinutes?: number | null }
) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(and(eq(cardsTable.id, cardId), eq(listsTable.boardId, boardId)))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  const updateData: Partial<typeof cardsTable.$inferInsert> = { updatedAt: new Date() };

  if (dueData.startDate !== undefined) {
    updateData.startDate = dueData.startDate ? new Date(dueData.startDate) : null;
  }

  if (dueData.dueAt !== undefined) {
    updateData.dueAt = dueData.dueAt ? new Date(dueData.dueAt) : null;
  }

  if (dueData.dueComplete !== undefined) {
    updateData.dueComplete = dueData.dueComplete;
  }

  if (dueData.reminderMinutes !== undefined) {
    updateData.reminderMinutes = dueData.reminderMinutes;
  }

  await db.update(cardsTable).set(updateData).where(eq(cardsTable.id, cardId));

  try {
    const actionDescription = dueData.dueComplete
      ? "marked due date as complete"
      : dueData.dueAt
      ? "set due date"
      : dueData.startDate
      ? "set start date"
      : "updated dates";

    await logActivity({
      cardId,
      userId: userSub,
      actionType: "card.due.updated",
      description: actionDescription,
    });
  } catch (error) {
    console.error("Failed to log due date activity:", error);
  }

  publishBoardChanged(boardId, "card", cardId, "updated", userSub);

  const updatedCard = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  return updatedCard[0];
}

export async function clearCardDue(userSub: string, boardId: string, cardId: string) {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const card = await db
    .select()
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(and(eq(cardsTable.id, cardId), eq(listsTable.boardId, boardId)))
    .limit(1);

  if (card.length === 0) {
    throw new ServiceError("Card không tồn tại", 404);
  }

  await db
    .update(cardsTable)
    .set({
      startDate: null,
      dueAt: null,
      dueComplete: false,
      reminderMinutes: null,
      updatedAt: new Date(),
    })
    .where(eq(cardsTable.id, cardId));

  try {
    await logActivity({
      cardId,
      userId: userSub,
      actionType: "card.due.removed",
      description: "removed dates",
    });
  } catch (error) {
    console.error("Failed to log due date removal activity:", error);
  }

  publishBoardChanged(boardId, "card", cardId, "updated", userSub);

  return { message: "Đã xóa dates" };
}
