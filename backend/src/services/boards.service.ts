import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable, cardLabelsTable, cardMembersTable, labelsTable, boardMembersTable, attachmentsTable } from "@/lib/db/schema";
import { eq, asc, sql, or } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { publishBoardChanged } from "./events.service";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

/**
 * Helper function to check if a user has access to a board (owner or member)
 */
async function checkBoardAccess(boardId: string, userSub: string, requireOwner: boolean = false): Promise<{ isOwner: boolean; isMember: boolean }> {
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board không tồn tại", 404);
  }

  const isOwner = board[0].userId === userSub;
  
  let isMember = false;
  if (!isOwner) {
    const memberCheck = await db
      .select()
      .from(boardMembersTable)
      .where(
        sql`${boardMembersTable.boardId} = ${boardId} AND ${boardMembersTable.userId} = ${userSub}`
      )
      .limit(1);
    isMember = memberCheck.length > 0;
  }

  if (requireOwner && !isOwner) {
    throw new ServiceError("Chỉ chủ board mới có thể thực hiện thao tác này", 403);
  }

  if (!isOwner && !isMember) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

  return { isOwner, isMember };
}


export async function getBoardsForUser(userSub: string) {
  // Get boards where user is the owner
  const ownedBoards = await db.query.boardsTable.findMany({
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

  // Get boards where user is a member
  const memberBoards = await db
    .select({
      boardId: boardMembersTable.boardId,
    })
    .from(boardMembersTable)
    .where(eq(boardMembersTable.userId, userSub));

  const memberBoardIds = memberBoards.map(mb => mb.boardId);

  let sharedBoards: any[] = [];
  if (memberBoardIds.length > 0) {
    sharedBoards = await db.query.boardsTable.findMany({
      where: sql`${boardsTable.id} IN (${sql.join(memberBoardIds.map(id => sql`${id}`), sql`, `)})`,
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
  }

  // Combine owned and shared boards
  const boards = [...ownedBoards, ...sharedBoards];

  // Get all card IDs from all boards
  const cardIds = boards.flatMap((board: any) =>
    board.lists.flatMap((list: any) => list.cards.map((card: any) => card.id))
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

  // Get attachments for all cards
  const cardAttachmentsData = await db
    .select()
    .from(attachmentsTable)
    .where(sql`${attachmentsTable.cardId} IN (${sql.join(cardIds.map(id => sql`${id}`), sql`, `)})`);

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

  const attachmentsByCard = new Map<string, Array<any>>();
  for (const attachment of cardAttachmentsData) {
    if (!attachmentsByCard.has(attachment.cardId)) {
      attachmentsByCard.set(attachment.cardId, []);
    }
    attachmentsByCard.get(attachment.cardId)!.push(attachment);
  }

  // Add labels, members, and attachments to cards in all boards
  return boards.map((board: any) => ({
    ...board,
    lists: board.lists.map((list: any) => ({
      ...list,
      cards: list.cards.map((card: any) => ({
        ...card,
        labels: labelsByCard.get(card.id) || [],
        members: membersByCard.get(card.id) || [],
        attachments: attachmentsByCard.get(card.id) || [],
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

  // Publish board created event
  publishBoardChanged(board[0].id, 'board', board[0].id, 'created', userSub);

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
  
  // Check if user is owner or member
  const isOwner = board.userId === userSub;
  const isMember = await db
    .select()
    .from(boardMembersTable)
    .where(
      sql`${boardMembersTable.boardId} = ${id} AND ${boardMembersTable.userId} = ${userSub}`
    )
    .limit(1);

  if (!isOwner && isMember.length === 0) {
    throw new ServiceError("Không có quyền truy cập Board này", 403);
  }

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

  // Get attachments for all cards
  const cardAttachmentsData = await db
    .select()
    .from(attachmentsTable)
    .where(sql`${attachmentsTable.cardId} IN (${sql.join(cardIds.map(id => sql`${id}`), sql`, `)})`);

  console.log("[GET BOARD BY ID] Found attachments:", cardAttachmentsData.length);

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

  const attachmentsByCard = new Map<string, Array<any>>();
  for (const attachment of cardAttachmentsData) {
    if (!attachmentsByCard.has(attachment.cardId)) {
      attachmentsByCard.set(attachment.cardId, []);
    }
    attachmentsByCard.get(attachment.cardId)!.push(attachment);
  }

  // Add labels, members, and attachments to cards
  return {
    ...board,
    lists: board.lists.map(list => ({
      ...list,
      cards: list.cards.map(card => ({
        ...card,
        labels: labelsByCard.get(card.id) || [],
        members: membersByCard.get(card.id) || [],
        attachments: attachmentsByCard.get(card.id) || [],
      })),
    })),
  } as any;
}

export async function updateBoard(userSub: string, id: string, req: any) {
  // Check if board exists and user is the owner (only owner can update)
  await checkBoardAccess(id, userSub, true);

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

  // Publish board updated event
  publishBoardChanged(id, 'board', id, 'updated', userSub);

  return updatedBoard[0];
}

export async function deleteBoard(userSub: string, id: string) {
  // Check if board exists and user is the owner (only owner can delete)
  await checkBoardAccess(id, userSub, true);

  await db.delete(boardsTable).where(eq(boardsTable.id, id));

  // Publish board deleted event
  publishBoardChanged(id, 'board', id, 'deleted', userSub);

  return { message: "Xóa Board thành công" };
}

export async function getListsForBoard(userSub: string, id: string) {
  // Check if board exists and user has access
  await checkBoardAccess(id, userSub);

  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, id));

  return lists;
}

export async function getCardsForBoard(userSub: string, id: string) {
  // Check if board exists and user has access
  await checkBoardAccess(id, userSub);

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
