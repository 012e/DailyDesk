import db from "@/lib/db";
import {
  cardsTable,
  listsTable,
  boardsTable,
  boardMembersTable,
  cardMembersTable,
  reminderJobsTable,
  emailRemindersSentTable,
} from "@/lib/db/schema";
import { sendReminderEmail } from "@/services/reminder-email.service";
import {
  and,
  eq,
  inArray,
  lte,
  lt,
  sql,
} from "drizzle-orm";
import { randomUUID } from "crypto";

type ReminderType = "due_soon" | "overdue";

const DEFAULT_REMINDER_MINUTES = Number(process.env.REMINDER_MINUTES ?? 1440);
const OVERDUE_GRACE_MINUTES = Number(process.env.OVERDUE_GRACE_MINUTES ?? 0);
const JOB_POLL_INTERVAL_MS = 60 * 1000;
const BASE_BACKOFF_MS = 60 * 1000;
const MAX_JOBS_PER_TICK = 50;

type Recipient = {
  userId: string;
  email: string;
  name: string;
  timezone?: string | null;
};

export async function refreshCardReminders(cardId: string) {
  const cardData = await db
    .select({
      cardId: cardsTable.id,
      boardId: boardsTable.id,
      dueAt: cardsTable.dueAt,
      reminderMinutes: cardsTable.reminderMinutes,
      dueComplete: cardsTable.dueComplete,
      completed: cardsTable.completed,
    })
    .from(cardsTable)
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(boardsTable, eq(listsTable.boardId, boardsTable.id))
    .where(eq(cardsTable.id, cardId))
    .limit(1);

  if (cardData.length === 0) {
    return;
  }

  const card = cardData[0];
  const dueAt = card.dueAt ? new Date(card.dueAt) : null;

  await clearPendingJobs(card.cardId);

  if (!dueAt || card.dueComplete || card.completed) {
    return;
  }

  const reminderMinutes = card.reminderMinutes ?? DEFAULT_REMINDER_MINUTES;
  const recipients = await getReminderRecipients(card.cardId, card.boardId);

  if (recipients.length === 0) {
    return;
  }

  const jobs: Array<{
    reminderType: ReminderType;
    runAt: Date;
    reminderMinutes?: number | null;
  }> = [];

  if (reminderMinutes !== null && reminderMinutes !== undefined) {
    jobs.push({
      reminderType: "due_soon",
      runAt: new Date(dueAt.getTime() - reminderMinutes * 60 * 1000),
      reminderMinutes,
    });
  }

  jobs.push({
    reminderType: "overdue",
    runAt: new Date(dueAt.getTime() + OVERDUE_GRACE_MINUTES * 60 * 1000),
  });

  const values = recipients.flatMap((recipient) =>
    jobs.map((job) => ({
      id: randomUUID(),
      cardId: card.cardId,
      boardId: card.boardId,
      userId: recipient.userId,
      reminderType: job.reminderType,
      dueAtSnapshot: dueAt,
      reminderMinutes: job.reminderMinutes ?? null,
      runAt: job.runAt,
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  if (values.length > 0) {
    await db.insert(reminderJobsTable).values(values).onConflictDoNothing();
  }
}

export async function processReminderJobs() {
  const now = new Date();

  const jobs = await db
    .select()
    .from(reminderJobsTable)
    .where(
      and(
        eq(reminderJobsTable.status, "pending"),
        lte(reminderJobsTable.runAt, now),
        lt(reminderJobsTable.attempts, reminderJobsTable.maxAttempts),
      ),
    )
    .limit(MAX_JOBS_PER_TICK);

  for (const job of jobs) {
    try {
      const alreadySent = await db
        .select()
        .from(emailRemindersSentTable)
        .where(
          and(
            eq(emailRemindersSentTable.cardId, job.cardId),
            eq(emailRemindersSentTable.userId, job.userId),
            eq(emailRemindersSentTable.reminderType, job.reminderType),
            eq(emailRemindersSentTable.dueAtSnapshot, job.dueAtSnapshot),
          ),
        )
        .limit(1);

      if (alreadySent.length > 0) {
        await markJobStatus(job.id, "sent");
        continue;
      }

      const cardState = await db
        .select({
          name: cardsTable.name,
          dueAt: cardsTable.dueAt,
          dueComplete: cardsTable.dueComplete,
          completed: cardsTable.completed,
        })
        .from(cardsTable)
        .where(eq(cardsTable.id, job.cardId))
        .limit(1);

      if (
        cardState.length === 0 ||
        !cardState[0].dueAt ||
        cardState[0].dueComplete ||
        cardState[0].completed ||
        new Date(cardState[0].dueAt).getTime() !== new Date(job.dueAtSnapshot).getTime()
      ) {
        await markJobStatus(job.id, "skipped");
        continue;
      }

      if (
        job.reminderType === "due_soon" &&
        new Date(cardState[0].dueAt).getTime() <= now.getTime()
      ) {
        await markJobStatus(job.id, "skipped");
        continue;
      }

      const recipient = await db
        .select({
          email: boardMembersTable.email,
          name: boardMembersTable.name,
          timezone: boardMembersTable.timezone,
        })
        .from(boardMembersTable)
        .where(
          and(
            eq(boardMembersTable.boardId, job.boardId),
            eq(boardMembersTable.userId, job.userId),
          ),
        )
        .limit(1);

      if (recipient.length === 0) {
        await markJobStatus(job.id, "skipped");
        continue;
      }

      await sendReminderEmail({
        to: recipient[0].email,
        recipientName: recipient[0].name,
        cardName: cardState[0].name,
        dueAt: new Date(job.dueAtSnapshot),
        reminderMinutes: job.reminderMinutes ?? undefined,
        reminderType: job.reminderType as ReminderType,
        timeZone: recipient[0].timezone ?? undefined,
      });

      await db
        .insert(emailRemindersSentTable)
        .values({
          id: randomUUID(),
          cardId: job.cardId,
          userId: job.userId,
          reminderType: job.reminderType,
          dueAtSnapshot: job.dueAtSnapshot,
          sentAt: new Date(),
        })
        .onConflictDoNothing();

      await markJobStatus(job.id, "sent");
    } catch (error) {
      await handleJobFailure(job.id, error);
    }
  }
}

async function handleJobFailure(jobId: string, error: unknown) {
  const job = await db
    .select()
    .from(reminderJobsTable)
    .where(eq(reminderJobsTable.id, jobId))
    .limit(1);

  if (job.length === 0) return;

  const attempts = job[0].attempts + 1;
  const shouldFail = attempts >= job[0].maxAttempts;
  const delay = BASE_BACKOFF_MS * Math.pow(2, attempts - 1);

  await db
    .update(reminderJobsTable)
    .set({
      attempts,
      status: shouldFail ? "failed" : "pending",
      runAt: new Date(Date.now() + delay),
      lastError: error instanceof Error ? error.message : String(error),
      updatedAt: new Date(),
    })
    .where(eq(reminderJobsTable.id, jobId));
}

async function markJobStatus(jobId: string, status: string) {
  await db
    .update(reminderJobsTable)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(reminderJobsTable.id, jobId));
}

async function clearPendingJobs(cardId: string) {
  await db
    .delete(reminderJobsTable)
    .where(
      and(
        eq(reminderJobsTable.cardId, cardId),
        inArray(reminderJobsTable.status, ["pending", "running", "failed"]),
      ),
    );
}

async function getReminderRecipients(cardId: string, boardId: string) {
  const cardMembers = await db
    .select({
      userId: boardMembersTable.userId,
      email: boardMembersTable.email,
      name: boardMembersTable.name,
      timezone: boardMembersTable.timezone,
    })
    .from(cardMembersTable)
    .innerJoin(boardMembersTable, eq(cardMembersTable.memberId, boardMembersTable.id))
    .where(eq(cardMembersTable.cardId, cardId));

  return dedupeRecipients(cardMembers);
}

function dedupeRecipients(recipients: Recipient[]) {
  const seen = new Set<string>();
  return recipients.filter((recipient) => {
    if (seen.has(recipient.userId)) return false;
    seen.add(recipient.userId);
    return true;
  });
}

export function startReminderCron() {
  console.log("🔔 Starting due date reminder service...");

  setInterval(async () => {
    try {
      await processReminderJobs();
    } catch (error) {
      console.error("Error in reminder cron job:", error);
    }
  }, JOB_POLL_INTERVAL_MS);

  console.log("✅ Reminder service started (runs every minute)");
}
