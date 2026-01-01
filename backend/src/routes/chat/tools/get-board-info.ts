import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get information about a specific board including its lists and cards
 */
export const getBoardInfoTool = (boardId: string) => tool({
  description:
    "Get detailed information about the current board including its name, lists, and cards. Use this when the user asks about the board's structure, content, or organization.",
  inputSchema: z.object({}),
  execute: async () => {
    const board = await db.query.boardsTable.findFirst({
      where: eq(boardsTable.id, boardId),
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

    if (!board) {
      return {
        success: false,
        error: "Board not found",
      };
    }

    return {
      success: true,
      board: {
        id: board.id,
        name: board.name,
        backgroundUrl: board.backgroundUrl,
        backgroundColor: board.backgroundColor,
        totalLists: board.lists.length,
        totalCards: board.lists.reduce(
          (sum, list) => sum + list.cards.length,
          0
        ),
        lists: board.lists.map((list) => ({
          id: list.id,
          name: list.name,
          order: list.order,
          cardCount: list.cards.length,
          cards: list.cards.map((card) => ({
            id: card.id,
            name: card.name,
            order: card.order,
            coverUrl: card.coverUrl,
            coverColor: card.coverColor,
            startDate: card.startDate,
            deadline: card.deadline,
          })),
        })),
      },
    };
  },
});
