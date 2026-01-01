import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";
import { boardsTable, listsTable, cardsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get a quick summary of a board without detailed card information
 */
export const getBoardSummaryTool = (boardId: string) => tool({
  description:
    "Get a quick summary of the current board including its name, number of lists, and number of cards. Use this for high-level overview questions.",
  inputSchema: z.object({}),
  execute: async () => {
    const board = await db.query.boardsTable.findFirst({
      where: eq(boardsTable.id, boardId),
      with: {
        lists: {
          orderBy: asc(listsTable.order),
          with: {
            cards: true,
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

    const totalCards = board.lists.reduce(
      (sum, list) => sum + list.cards.length,
      0
    );

    return {
      success: true,
      summary: {
        id: board.id,
        name: board.name,
        totalLists: board.lists.length,
        totalCards,
        lists: board.lists.map((list) => ({
          name: list.name,
          cardCount: list.cards.length,
        })),
      },
    };
  },
});
