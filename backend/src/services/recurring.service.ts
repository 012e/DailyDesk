import db from "@/lib/db";
import { cardsTable, listsTable, boardsTable } from "@/lib/db/schema";
import { eq, and, or, lt, isNotNull } from "drizzle-orm";
import { logActivity } from "./activities.service";
import { publishBoardChanged } from "./events.service";

export type RepeatFrequency = "daily" | "weekly" | "monthly";

export interface RepeatConfig {
  frequency: RepeatFrequency;
  interval: number;
}

export interface CardWithRepeat {
  id: string;
  dueAt: Date | null;
  dueComplete: boolean | null;
  repeatFrequency: string | null;
  repeatInterval: number | null;
}

/**
 * Calculate next due date based on repeat configuration.
 * Uses deterministic date math (timezone-safe).
 */
export function calculateNextDueDate(
  currentDueDate: Date,
  frequency: RepeatFrequency,
  interval: number
): Date {
  const next = new Date(currentDueDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
  }

  return next;
}

/**
 * Apply recurring due date logic to a card.
 * - Calculates next due date based on repeat config
 * - Resets dueComplete to false
 */
export function applyRecurringDueDate(card: CardWithRepeat): {
  dueAt: Date;
  dueComplete: boolean;
} | null {
  if (!card.dueAt || !card.repeatFrequency || !card.repeatInterval) {
    return null;
  }

  const frequency = card.repeatFrequency as RepeatFrequency;
  const interval = card.repeatInterval;
  const currentDue = new Date(card.dueAt);
  const now = new Date();

  // Calculate next due date
  let nextDue = calculateNextDueDate(currentDue, frequency, interval);

  // If next due is still in the past, keep advancing until it's in the future
  while (nextDue < now) {
    nextDue = calculateNextDueDate(nextDue, frequency, interval);
  }

  return {
    dueAt: nextDue,
    dueComplete: false,
  };
}

/**
 * Process all cards that need recurring due date update.
 * Criteria: has repeat config AND (dueComplete=true OR dueAt < now)
 */
export async function processRecurringDueDates() {
  const now = new Date();

  // Find cards with repeat config where:
  // - dueComplete = true (user marked complete)
  // - OR dueAt < now (overdue)
  const cardsToProcess = await db
    .select({
      id: cardsTable.id,
      name: cardsTable.name,
      dueAt: cardsTable.dueAt,
      dueComplete: cardsTable.dueComplete,
      repeatFrequency: cardsTable.repeatFrequency,
      repeatInterval: cardsTable.repeatInterval,
      listId: cardsTable.listId,
      boardId: boardsTable.id,
      boardUserId: boardsTable.userId,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
    .where(
      and(
        isNotNull(cardsTable.repeatFrequency),
        isNotNull(cardsTable.repeatInterval),
        isNotNull(cardsTable.dueAt),
        or(
          eq(cardsTable.dueComplete, true),
          lt(cardsTable.dueAt, now)
        )
      )
    );

  for (const card of cardsToProcess) {
    const result = applyRecurringDueDate(card);
    if (!result) continue;

    try {
      // Update card with new due date
      await db
        .update(cardsTable)
        .set({
          dueAt: result.dueAt,
          dueComplete: result.dueComplete,
          updatedAt: new Date(),
        })
        .where(eq(cardsTable.id, card.id));

      // Log activity (only "due date changed" - no recurring-specific log)
      await logActivity({
        cardId: card.id,
        userId: card.boardUserId,
        actionType: "card.due.updated",
        description: "due date changed",
      });

      // Notify connected clients
      publishBoardChanged(card.boardId, "card", card.id, "updated", card.boardUserId);

      console.log(
        `🔄 [RECURRING] Card "${card.name}" due date updated: ${result.dueAt.toISOString()}`
      );
    } catch (error) {
      console.error(`❌ Failed to process recurring due date for card ${card.id}:`, error);
    }
  }

  return cardsToProcess.length;
}

/**
 * Start cron job to process recurring due dates.
 * Runs every 5 minutes.
 */
export function startRecurringCron() {
  console.log("🔁 Starting recurring due date service...");

  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      const processed = await processRecurringDueDates();
      if (processed > 0) {
        console.log(`🔁 Processed ${processed} recurring cards`);
      }
    } catch (error) {
      console.error("Error in recurring due date cron job:", error);
    }
  }, INTERVAL_MS);

  // Run immediately on startup as well
  processRecurringDueDates().catch(console.error);

  console.log("✅ Recurring due date service started (runs every 5 minutes)");
}
