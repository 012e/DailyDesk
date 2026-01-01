import { tool } from "ai";
import { z } from "zod";
import { getBoardById } from "@/services/boards.service";
import { getChecklistItemsForCard } from "@/services/checklist-items.service";
import { getCardById } from "@/services/cards.service";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get detailed information about a specific card
 */
export const getCardDetailsTool = (boardId: string, userId: string) =>
  tool({
  description:
    "Get detailed information about a specific card including its name, dates, location, and all checklist items. Use this when the user asks about a specific card or task.",
  inputSchema: z.object({
    cardId: z.string().describe("The ID of the card to get details for"),
  }),
  execute: async ({ cardId }: { cardId: string }) => {
    try {
      // Verify card + board ownership via services
      const card = await getCardById(userId, boardId, cardId);

      // Get checklist items from service
      const checklistItems = await getChecklistItemsForCard(userId, boardId, cardId);

      // Get list & board names via board service
      const board = await getBoardById(userId, boardId);
      const list = board.lists.find((l: any) => l.id === card.listId);

      const completedItems = checklistItems.filter((item: any) => item.completed).length;
      const totalItems = checklistItems.length;

      return {
        success: true,
        card: {
          id: card.id,
          name: card.name,
          order: card.order,
          coverUrl: (card as any).coverUrl ?? null,
          coverColor: (card as any).coverColor ?? null,
          startDate: card.startDate,
          deadline: card.deadline,
          latitude: card.latitude,
          longitude: card.longitude,
          list: {
            id: list?.id ?? card.listId,
            name: list?.name ?? null,
          },
          board: {
            id: board.id,
            name: board.name,
          },
          checklistItems: checklistItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            completed: item.completed,
            order: item.order,
          })),
          checklistProgress: {
            completed: completedItems,
            total: totalItems,
            percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
          },
        },
      };
    } catch (err: any) {
      console.error("Error fetching card details:", err);
      return { success: false, error: err?.message ?? "Card not found" };
    }
  },
});
