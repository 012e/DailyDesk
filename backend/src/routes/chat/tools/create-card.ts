import { tool } from "ai";
import { z } from "zod";
import { uuidv7 } from "uuidv7";
import { createCard as createCardService, getCardsForBoard } from "@/services/cards.service";

/**
 * Tool to create a new card with user approval
 */
export const createCardTool = (boardId: string, userId: string) =>
  tool({
    description:
      "Create a new card in a specified list. This requires user approval before creation. Use this when the user asks to create a new task, card, or todo item. You should suggest appropriate values for the card based on the user's request.",
    inputSchema: z.object({
      listId: z
        .string()
        .describe(
          "The ID of the list where the card should be created. Use getBoardInfo or getBoardSummary to get available list IDs."
        ),
      name: z.string().describe("The name/title of the card"),
      startDate: z
        .string()
        .optional()
        .describe("Optional start date in ISO 8601 format (e.g., 2026-01-15)"),
      deadline: z
        .string()
        .optional()
        .describe("Optional deadline in ISO 8601 format (e.g., 2026-01-20)"),
      latitude: z
        .number()
        .optional()
        .describe("Optional latitude for location-based cards"),
      longitude: z
        .number()
        .optional()
        .describe("Optional longitude for location-based cards"),
    }),
    needsApproval: true,
    execute: async ({
      listId,
      name,
      startDate,
      deadline,
      latitude,
      longitude,
    }: {
      listId: string;
      name: string;
      startDate?: string;
      deadline?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      try {
        // Determine order by counting existing cards in the list using service
        const boardCards = await getCardsForBoard(userId, boardId);
        const cardsInList = boardCards.filter((c: any) => c.listId === listId);
        const order = cardsInList.length;

        const id = uuidv7();

        const created = await createCardService(userId, boardId, {
          id,
          name,
          order,
          listId,
          startDate: startDate ?? undefined,
          deadline: deadline ? new Date(deadline) : undefined,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        });

        return {
          success: true,
          message: `Card "${name}" has been created successfully`,
          card: {
            id: created.id,
            name: created.name,
            order: created.order,
            listId: created.listId,
            startDate: created.startDate,
            deadline: created.deadline,
            latitude: created.latitude,
            longitude: created.longitude,
          },
        };
      } catch (error: any) {
        console.error("Error creating card:", error);
        return {
          success: false,
          error: error?.message ?? "Failed to create card. Please try again.",
        };
      }
    },
  });
