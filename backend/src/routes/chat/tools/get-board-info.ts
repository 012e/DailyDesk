import { tool } from "ai";
import { z } from "zod";
import { getBoardById } from "@/services/boards.service";
import { ServiceError } from "@/services/boards.service";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get information about a specific board including its lists and cards
 */
export const getBoardInfoTool = (boardId: string, userId: string) => tool({
  description:
    "Get detailed information about the current board including its name, lists, and cards. Use this when the user asks about the board's structure, content, or organization.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const board = await getBoardById(userId, boardId);

      return {
        success: true,
        board: {
          id: board.id,
          name: board.name,
          backgroundUrl: board.backgroundUrl,
          backgroundColor: board.backgroundColor,
          totalLists: board.lists.length,
          totalCards: board.lists.reduce((sum: number, list: any) => sum + list.cards.length, 0),
          lists: board.lists.map((list: any) => ({
            id: list.id,
            name: list.name,
            order: list.order,
            cardCount: list.cards.length,
            cards: list.cards.map((card: any) => ({
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
    } catch (err: any) {
      if (err && err.name === "ServiceError") {
        return { success: false, error: err.message };
      }
      console.error("Error fetching board info:", err);
      return { success: false, error: "Board not found" };
    }
  },
});
