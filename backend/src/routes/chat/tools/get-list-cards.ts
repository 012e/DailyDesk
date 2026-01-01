import { tool } from "ai";
import { z } from "zod";
import { getBoardById } from "@/services/boards.service";
import { getChecklistItemsForCard } from "@/services/checklist-items.service";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get all cards in a specific list
 */
export const getListCardsTool = (boardId: string, userId: string) =>
  tool({
  description:
    "Get all cards in a specific list including their details, deadlines, and checklist items. Use this when the user asks about cards in a particular list or column.",
  inputSchema: z.object({
    listId: z.string().describe("The ID of the list to get cards from"),
  }),
  execute: async ({ listId }: { listId: string }) => {
    try {
      const board = await getBoardById(userId, boardId);
      const list = board.lists.find((l: any) => l.id === listId);

      if (!list) return { success: false, error: "List not found" };

      // For each card, fetch checklist items
      const cards = await Promise.all(
        list.cards.map(async (card: any) => {
          const checklistItems = await getChecklistItemsForCard(userId, boardId, card.id);
          const completed = checklistItems.filter((i: any) => i.completed).length;

          return {
            id: card.id,
            name: card.name,
            order: card.order,
            coverUrl: (card as any).coverUrl ?? null,
            coverColor: (card as any).coverColor ?? null,
            startDate: card.startDate,
            deadline: card.deadline,
            latitude: card.latitude,
            longitude: card.longitude,
            checklistItems: checklistItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              completed: item.completed,
              order: item.order,
            })),
            totalChecklistItems: checklistItems.length,
            completedChecklistItems: completed,
          };
        })
      );

      return {
        success: true,
        list: {
          id: list.id,
          name: list.name,
          cardCount: list.cards.length,
          cards,
        },
      };
    } catch (err: any) {
      console.error("Error fetching list cards:", err);
      return { success: false, error: err?.message ?? "List not found" };
    }
  },
});
