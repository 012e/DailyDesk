import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, cardLabelsTable, cardMembersTable, labelsTable, boardMembersTable } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export async function getBoardsForUser(userSub: string) {
  const boards = await db.query.boardsTable.findMany({
    where: eq(boardsTable.userId, userSub),
    with: {
      lists: {
        orderBy: asc(listsTable.order),
        with: {
          cards: {
            orderBy: asc(cardsTable.order),
          },
        },
      },
    },
  });

  // Get all card IDs from all boards
  const cardIds = boards.flatMap(board =>
    board.lists.flatMap(list => list.cards.map(card => card.id))
  );

  if (cardIds.length === 0) {
    return boards;
  }

  // Get labels for all cards
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

  // Get members for all cards
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

  // Group labels and members by card ID
  const labelsByCard = new Map<string, Array<{ id: string; name: string; color: string }>>();
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

  const membersByCard = new Map<string, Array<{ id: string; name: string; email: string; avatar: string | null; initials: string }>>();
  for (const cm of cardMembersData) {
    if (!membersByCard.has(cm.cardId)) {
      membersByCard.set(cm.cardId, []);
    }
    // Generate initials from name
    const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    membersByCard.get(cm.cardId)!.push({
      id: cm.memberId,
      name: cm.memberName,
      email: cm.memberEmail,
      avatar: cm.memberAvatar,
      initials,
    });
  }

  // Add labels and members to cards in all boards
  return boards.map(board => ({
    ...board,
    lists: board.lists.map(list => ({
      ...list,
      cards: list.cards.map(card => ({
        ...card,
        labels: labelsByCard.get(card.id) || [],
        members: membersByCard.get(card.id) || [],
      })),
    })),
  })) as any;
}

export async function createBoard(userSub: string, req: any) {
  const board = await db
    .insert(boardsTable)
    .values({
      id: req.id,
      name: req.name,
      userId: userSub,
      backgroundUrl: req.backgroundUrl ?? null,
      backgroundColor: req.backgroundColor ?? null,
    })
    .returning();

  return board[0];
}

export async function getBoardById(userSub: string, id: string) {
  const board = await db.query.boardsTable.findFirst({
    where: eq(boardsTable.id, id),
    with: {
      lists: {
        orderBy: asc(listsTable.order),
        with: {
          cards: {
            orderBy: asc(cardsTable.order),
          },
        },
      },
    },
  });

  if (!board) throw new ServiceError("Board không tồn tại", 404);
  if (board.userId !== userSub) throw new ServiceError("Không có quyền truy cập Board này", 403);

  // Get all card IDs from the board
  const cardIds = board.lists.flatMap(list => list.cards.map(card => card.id));

  if (cardIds.length === 0) {
    return board;
  }

  // Get labels for all cards
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

  // Get members for all cards
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

  // Group labels and members by card ID
  const labelsByCard = new Map<string, Array<{ id: string; name: string; color: string }>>();
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

  const membersByCard = new Map<string, Array<{ id: string; name: string; email: string; avatar: string | null; initials: string }>>();
  for (const cm of cardMembersData) {
    if (!membersByCard.has(cm.cardId)) {
      membersByCard.set(cm.cardId, []);
    }
    // Generate initials from name
    const initials = cm.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    membersByCard.get(cm.cardId)!.push({
      id: cm.memberId,
      name: cm.memberName,
      email: cm.memberEmail,
      avatar: cm.memberAvatar,
      initials,
    });
  }

  // Add labels and members to cards
  return {
    ...board,
    lists: board.lists.map(list => ({
      ...list,
      cards: list.cards.map(card => ({
        ...card,
        labels: labelsByCard.get(card.id) || [],
        members: membersByCard.get(card.id) || [],
      })),
    })),
  } as any;
}

export async function updateBoard(userSub: string, id: string, req: any) {
  // Check if board exists and user owns it
  const existingBoard = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (existingBoard.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (existingBoard[0].userId !== userSub) {
    throw new ServiceError("Không có quyền cập nhật Board này", 403);
  }

  const updateData: {
    name?: string;
    backgroundUrl?: string | null;
    backgroundColor?: string | null;
  } = {};

  if (req.name !== undefined) updateData.name = req.name;
  if (req.backgroundUrl !== undefined) updateData.backgroundUrl = req.backgroundUrl;
  if (req.backgroundColor !== undefined) updateData.backgroundColor = req.backgroundColor;

  const updatedBoard = await db
    .update(boardsTable)
    .set(updateData)
    .where(eq(boardsTable.id, id))
    .returning();

  return updatedBoard[0];
}

export async function deleteBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const existingBoard = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (existingBoard.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (existingBoard[0].userId !== userSub) {
    throw new ServiceError("Không có quyền xóa Board này", 403);
  }

  await db.delete(boardsTable).where(eq(boardsTable.id, id));

  return { message: "Xóa Board thành công" };
}

export async function getListsForBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, id));

  return lists;
}

export async function getCardsForBoard(userSub: string, id: string) {
  // Check if board exists and user owns it
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, id))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  if (board[0].userId !== userSub) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  const cards = await db
    .select({
      id: cardsTable.id,
      name: cardsTable.name,
      order: cardsTable.order,
      listId: cardsTable.listId,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .where(eq(listsTable.boardId, id));

  return cards;
}
