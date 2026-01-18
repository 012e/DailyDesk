import db from "@/lib/db";
import {
  boardsTable,
  cardsTable,
  listsTable,
  commentsTable,
  labelsTable,
  checklistItemsTable,
  boardMembersTable,
  cardLabelsTable,
} from "@/lib/db/schema";
import { sql, and, or, like, eq, inArray } from "drizzle-orm";
import type { SearchQuery, SearchResult } from "@/types/search";
import { getBoardIdsForUser } from "./authorization.service";

/**
 * Search across multiple entity types in the database
 * Only returns results from boards the user has access to
 */
export async function search(
  query: SearchQuery,
  userId: string
): Promise<{ results: SearchResult[]; total: number }> {
  const { q, types, boardId, limit } = query;
  const searchPattern = `%${q.toLowerCase()}%`;

  // Get boards the user has access to
  const accessibleBoardIds = boardId
    ? [boardId]
    : await getBoardIdsForUser(userId);

  if (accessibleBoardIds.length === 0) {
    return { results: [], total: 0 };
  }

  const results: SearchResult[] = [];
  const searchTypes = types || [
    "board",
    "card",
    "list",
    "comment",
    "label",
    "checklist",
  ];

  // Search boards
  if (searchTypes.includes("board")) {
    const boards = await db
      .select({
        id: boardsTable.id,
        name: boardsTable.name,
        userId: boardsTable.userId,
        backgroundUrl: boardsTable.backgroundUrl,
        backgroundColor: boardsTable.backgroundColor,
      })
      .from(boardsTable)
      .where(
        and(
          inArray(boardsTable.id, accessibleBoardIds),
          sql`LOWER(${boardsTable.name}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    for (const board of boards) {
      // Check if user has favorited this board
      const member = await db
        .select({ id: boardMembersTable.id })
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.boardId, board.id),
            eq(boardMembersTable.userId, userId)
          )
        )
        .limit(1);

      results.push({
        type: "board",
        id: board.id,
        name: board.name,
        description: null,
        isFavorite: member.length > 0,
        background: board.backgroundUrl || board.backgroundColor || null,
        createdAt: new Date().toISOString(), // Add timestamp if needed
      });
    }
  }

  // Search cards
  if (searchTypes.includes("card")) {
    const cards = await db
      .select({
        cardId: cardsTable.id,
        cardName: cardsTable.name,
        cardDescription: cardsTable.description,
        cardOrder: cardsTable.order,
        cardDueAt: cardsTable.dueAt,
        cardDueComplete: cardsTable.dueComplete,
        listId: listsTable.id,
        listName: listsTable.name,
        boardId: boardsTable.id,
        boardName: boardsTable.name,
      })
      .from(cardsTable)
      .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
      .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
      .where(
        and(
          inArray(boardsTable.id, accessibleBoardIds),
          or(
            sql`LOWER(${cardsTable.name}) LIKE ${searchPattern}`,
            sql`LOWER(${cardsTable.description}) LIKE ${searchPattern}`
          )
        )
      )
      .limit(limit);

    // Get labels for each card
    for (const card of cards) {
      const cardLabels = await db
        .select({
          id: labelsTable.id,
          name: labelsTable.name,
          color: labelsTable.color,
        })
        .from(cardLabelsTable)
        .innerJoin(labelsTable, eq(cardLabelsTable.labelId, labelsTable.id))
        .where(eq(cardLabelsTable.cardId, card.cardId));

      results.push({
        type: "card",
        id: card.cardId,
        title: card.cardName,
        description: card.cardDescription || null,
        boardId: card.boardId,
        boardName: card.boardName,
        listId: card.listId,
        listName: card.listName,
        position: card.cardOrder,
        dueDate: card.cardDueAt ? card.cardDueAt.toISOString() : null,
        isCompleted: card.cardDueComplete || false,
        labels: cardLabels.map((l: { id: string; name: string; color: string }) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
      });
    }
  }

  // Search lists
  if (searchTypes.includes("list")) {
    const lists = await db
      .select({
        listId: listsTable.id,
        listName: listsTable.name,
        listOrder: listsTable.order,
        boardId: boardsTable.id,
        boardName: boardsTable.name,
      })
      .from(listsTable)
      .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
      .where(
        and(
          inArray(boardsTable.id, accessibleBoardIds),
          sql`LOWER(${listsTable.name}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    for (const list of lists) {
      // Count cards in list
      const cardCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(cardsTable)
        .where(eq(cardsTable.listId, list.listId));

      results.push({
        type: "list",
        id: list.listId,
        name: list.listName,
        boardId: list.boardId,
        boardName: list.boardName,
        position: list.listOrder,
        cardCount: cardCount[0]?.count || 0,
      });
    }
  }

  // Search comments
  if (searchTypes.includes("comment")) {
    const comments = await db
      .select({
        commentId: commentsTable.id,
        commentContent: commentsTable.content,
        commentCreatedAt: commentsTable.createdAt,
        authorId: commentsTable.userId,
        cardId: cardsTable.id,
        cardName: cardsTable.name,
        boardId: boardsTable.id,
        boardName: boardsTable.name,
      })
      .from(commentsTable)
      .innerJoin(cardsTable, eq(commentsTable.cardId, cardsTable.id))
      .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
      .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
      .where(
        and(
          inArray(boardsTable.id, accessibleBoardIds),
          sql`LOWER(${commentsTable.content}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    // Get author details for each comment
    for (const comment of comments) {
      const author = await db
        .select({
          name: boardMembersTable.name,
          avatar: boardMembersTable.avatar,
        })
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.userId, comment.authorId),
            eq(boardMembersTable.boardId, comment.boardId)
          )
        )
        .limit(1);

      results.push({
        type: "comment",
        id: comment.commentId,
        content: comment.commentContent,
        cardId: comment.cardId,
        cardTitle: comment.cardName,
        boardId: comment.boardId,
        boardName: comment.boardName,
        authorId: comment.authorId,
        authorName: author[0]?.name || null,
        authorAvatar: author[0]?.avatar || null,
        createdAt: comment.commentCreatedAt.toISOString(),
      });
    }
  }

  // Search labels (only user's labels used in accessible boards)
  if (searchTypes.includes("label")) {
    const labels = await db
      .select({
        labelId: labelsTable.id,
        labelName: labelsTable.name,
        labelColor: labelsTable.color,
      })
      .from(labelsTable)
      .where(
        and(
          eq(labelsTable.userId, userId),
          sql`LOWER(${labelsTable.name}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    for (const label of labels) {
      // Get boards where this label is used
      const labelBoards = await db
        .selectDistinct({
          boardId: boardsTable.id,
          boardName: boardsTable.name,
        })
        .from(cardLabelsTable)
        .innerJoin(cardsTable, eq(cardLabelsTable.cardId, cardsTable.id))
        .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
        .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
        .where(
          and(
            eq(cardLabelsTable.labelId, label.labelId),
            inArray(boardsTable.id, accessibleBoardIds)
          )
        )
        .limit(1);

      if (labelBoards.length > 0) {
        // Count cards with this label
        const cardCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(cardLabelsTable)
          .where(eq(cardLabelsTable.labelId, label.labelId));

        results.push({
          type: "label",
          id: label.labelId,
          name: label.labelName,
          color: label.labelColor,
          boardId: labelBoards[0].boardId,
          boardName: labelBoards[0].boardName,
          cardCount: cardCount[0]?.count || 0,
        });
      }
    }
  }

  // Search checklist items
  if (searchTypes.includes("checklist")) {
    const checklistItems = await db
      .select({
        checklistId: checklistItemsTable.id,
        checklistName: checklistItemsTable.name,
        checklistCompleted: checklistItemsTable.completed,
        cardId: cardsTable.id,
        cardName: cardsTable.name,
        boardId: boardsTable.id,
        boardName: boardsTable.name,
      })
      .from(checklistItemsTable)
      .innerJoin(cardsTable, eq(checklistItemsTable.cardId, cardsTable.id))
      .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
      .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
      .where(
        and(
          inArray(boardsTable.id, accessibleBoardIds),
          sql`LOWER(${checklistItemsTable.name}) LIKE ${searchPattern}`
        )
      )
      .limit(limit);

    for (const item of checklistItems) {
      results.push({
        type: "checklist",
        id: item.checklistId,
        text: item.checklistName,
        isChecked: item.checklistCompleted || false,
        cardId: item.cardId,
        cardTitle: item.cardName,
        boardId: item.boardId,
        boardName: item.boardName,
      });
    }
  }

  return {
    results,
    total: results.length,
  };
}
