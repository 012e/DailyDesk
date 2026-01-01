import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";
import { cardsTable, checklistItemsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get detailed information about a specific card
 */
export const getCardDetailsTool = tool({
  description:
    "Get detailed information about a specific card including its name, dates, location, and all checklist items. Use this when the user asks about a specific card or task.",
  inputSchema: z.object({
    cardId: z.string().describe("The ID of the card to get details for"),
  }),
  execute: async ({ cardId }: { cardId: string }) => {
    const card = await db.query.cardsTable.findFirst({
      where: eq(cardsTable.id, cardId),
      with: {
        checklistItems: {
          orderBy: asc(checklistItemsTable.order),
        },
        list: {
          with: {
            board: true,
          },
        },
      },
    });

    if (!card) {
      return {
        success: false,
        error: "Card not found",
      };
    }

    const completedItems = card.checklistItems.filter(
      (item) => item.completed
    ).length;
    const totalItems = card.checklistItems.length;

    return {
      success: true,
      card: {
        id: card.id,
        name: card.name,
        order: card.order,
        coverUrl: card.coverUrl,
        coverColor: card.coverColor,
        startDate: card.startDate,
        deadline: card.deadline,
        latitude: card.latitude,
        longitude: card.longitude,
        list: {
          id: card.list.id,
          name: card.list.name,
        },
        board: {
          id: card.list.board.id,
          name: card.list.board.name,
        },
        checklistItems: card.checklistItems.map((item) => ({
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
  },
});
