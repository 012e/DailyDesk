import { tool } from "ai";
import { z } from "zod";
import db from "@/lib/db";
import { cardsTable, listsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

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
      confirm: z
        .boolean()
        .default(false)
        .describe("Confirmation that the user wants to create this card"),
    }),
    requireApproval: true,
    execute: async ({
      listId,
      name,
      startDate,
      deadline,
      latitude,
      longitude,
      confirm,
    }: {
      listId: string;
      name: string;
      startDate?: string;
      deadline?: string;
      latitude?: number;
      longitude?: number;
      confirm: boolean;
    }) => {
      if (!confirm) {
        return {
          success: false,
          message: "Card creation not confirmed",
        };
      }

      try {
        // Verify the list exists and belongs to the board
        const list = await db.query.listsTable.findFirst({
          where: eq(listsTable.id, listId),
          with: {
            board: true,
          },
        });

        if (!list) {
          return {
            success: false,
            error: "List not found",
          };
        }

        if (list.board.id !== boardId) {
          return {
            success: false,
            error: "List does not belong to the current board",
          };
        }

        if (list.board.userId !== userId) {
          return {
            success: false,
            error: "Unauthorized: You don't own this board",
          };
        }

        // Get the number of cards in the list to determine order
        const cardsInList = await db
          .select()
          .from(cardsTable)
          .where(eq(cardsTable.listId, listId));

        const order = cardsInList.length; // Append to the end

        // Create the card
        const newCard = await db
          .insert(cardsTable)
          .values({
            id: uuidv7(),
            name,
            order,
            listId,
            startDate: startDate ? new Date(startDate) : null,
            deadline: deadline ? new Date(deadline) : null,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
          })
          .returning();

        return {
          success: true,
          message: `Card "${name}" has been created successfully in list "${list.name}"`,
          card: {
            id: newCard[0].id,
            name: newCard[0].name,
            order: newCard[0].order,
            listId: newCard[0].listId,
            listName: list.name,
            startDate: newCard[0].startDate,
            deadline: newCard[0].deadline,
            latitude: newCard[0].latitude,
            longitude: newCard[0].longitude,
          },
        };
      } catch (error) {
        console.error("Error creating card:", error);
        return {
          success: false,
          error: "Failed to create card. Please try again.",
        };
      }
    },
  });
