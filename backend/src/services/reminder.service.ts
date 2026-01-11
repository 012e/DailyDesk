import db from "@/lib/db";
import {
  cardsTable,
  dueReminderLogTable,
  boardsTable,
  listsTable,
} from "@/lib/db/schema";
import { eq, and, lte, gte, isNull, isNotNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function checkAndSendReminders() {
  const now = new Date();

  const cardsWithDueSoon = await db
    .select({
      cardId: cardsTable.id,
      cardName: cardsTable.name,
      dueAt: cardsTable.dueAt,
      reminderMinutes: cardsTable.reminderMinutes,
      dueComplete: cardsTable.dueComplete,
      boardId: boardsTable.id,
      boardUserId: boardsTable.userId,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
    .where(
      and(
        isNotNull(cardsTable.dueAt),
        isNotNull(cardsTable.reminderMinutes),
        eq(cardsTable.dueComplete, false)
      )
    );

  for (const card of cardsWithDueSoon) {
    if (!card.dueAt || !card.reminderMinutes) continue;

    const dueTime = new Date(card.dueAt).getTime();
    const reminderTime = dueTime - card.reminderMinutes * 60 * 1000;
    const nowTime = now.getTime();

    if (nowTime < reminderTime || nowTime >= dueTime) {
      continue;
    }

    const existingLog = await db
      .select()
      .from(dueReminderLogTable)
      .where(
        and(
          eq(dueReminderLogTable.cardId, card.cardId),
          eq(dueReminderLogTable.userId, card.boardUserId),
          eq(dueReminderLogTable.dueAtSnapshot, card.dueAt),
          eq(dueReminderLogTable.reminderMinutes, card.reminderMinutes)
        )
      )
      .limit(1);

    if (existingLog.length > 0) {
      continue;
    }

    try {
      await sendReminder(card);

      await db.insert(dueReminderLogTable).values({
        id: randomUUID(),
        cardId: card.cardId,
        userId: card.boardUserId,
        dueAtSnapshot: card.dueAt,
        reminderMinutes: card.reminderMinutes,
        sentAt: now,
      });

      console.log(`✅ Reminder sent for card "${card.cardName}" (ID: ${card.cardId})`);
    } catch (error) {
      console.error(`❌ Failed to send reminder for card ${card.cardId}:`, error);
    }
  }
}

async function sendReminder(card: {
  cardId: string;
  cardName: string;
  dueAt: Date;
  reminderMinutes: number;
  boardUserId: string;
}) {
  console.log(
    `📧 [REMINDER] Card "${card.cardName}" is due in ${card.reminderMinutes} minutes`
  );
  console.log(`   User ID: ${card.boardUserId}`);
  console.log(`   Due at: ${card.dueAt.toISOString()}`);
}

export function startReminderCron() {
  console.log("🔔 Starting due date reminder service...");

  setInterval(
    async () => {
      try {
        await checkAndSendReminders();
      } catch (error) {
        console.error("Error in reminder cron job:", error);
      }
    },
    60 * 1000
  );

  console.log("✅ Reminder service started (runs every minute)");
}
