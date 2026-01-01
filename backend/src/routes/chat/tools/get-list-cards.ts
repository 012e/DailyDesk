import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";
import { listsTable, cardsTable, checklistItemsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * Tool to get all cards in a specific list
 */
export const getListCardsTool = tool({
  description:
    "Get all cards in a specific list including their details, deadlines, and checklist items. Use this when the user asks about cards in a particular list or column.",
  inputSchema: z.object({
    listId: z.string().describe("The ID of the list to get cards from"),
  }),
  execute: async ({ listId }: { listId: string }) => {
    const list = await db.query.listsTable.findFirst({
      where: eq(listsTable.id, listId),
      with: {
        cards: {
          orderBy: asc(cardsTable.order),
          with: {
            checklistItems: {
              orderBy: asc(checklistItemsTable.order),
            },
          },
        },
      },
    });

    if (!list) {
      return {
        success: false,
        error: "List not found",
      };
    }

    return {
      success: true,
      list: {
        id: list.id,
        name: list.name,
        cardCount: list.cards.length,
        cards: list.cards.map((card) => ({
          id: card.id,
          name: card.name,
          order: card.order,
          coverUrl: card.coverUrl,
          coverColor: card.coverColor,
          startDate: card.startDate,
          deadline: card.deadline,
          latitude: card.latitude,
          longitude: card.longitude,
          checklistItems: card.checklistItems.map((item) => ({
            id: item.id,
            name: item.name,
            completed: item.completed,
            order: item.order,
          })),
          totalChecklistItems: card.checklistItems.length,
          completedChecklistItems: card.checklistItems.filter(
            (item) => item.completed
          ).length,
        })),
      },
    };
  },
});
