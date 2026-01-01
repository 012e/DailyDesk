import { tool } from "ai";
import { z } from "zod";
import { getBoardById } from "@/services/boards.service";

/**
 * Tool to get a quick summary of a board without detailed card information
 */
export const getBoardSummaryTool = (boardId: string, userId: string) => tool({
  description:
    "Get a quick summary of the current board including its name, number of lists, and number of cards. Use this for high-level overview questions.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const board = await getBoardById(userId, boardId);

      const totalCards = board.lists.reduce((sum: number, list: any) => sum + list.cards.length, 0);

      return {
        success: true,
        summary: {
          id: board.id,
          name: board.name,
          totalLists: board.lists.length,
          totalCards,
          lists: board.lists.map((list: any) => ({
            name: list.name,
            cardCount: list.cards.length,
          })),
        },
      };
    } catch (err: any) {
      console.error("Error fetching board summary:", err);
      return { success: false, error: err?.message ?? "Board not found" };
    }
  },
});
