import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

// Boards table
export const boardsTable = sqliteTable("boards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  userId: text("user_id").notNull(), // Clerk user ID
  backgroundUrl: text("background_url"),
  backgroundPublicId: text("background_public_id"),
  backgroundColor: text("background_color"), // Valid hex color code
});

// Lists table with foreign key to boards
export const listsTable = sqliteTable("lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  boardId: text("board_id")
    .notNull()
    .references(() => boardsTable.id, { onDelete: "cascade" }),
});

// Cards table with foreign key to lists
export const cardsTable = sqliteTable("cards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  coverUrl: text("cover_url"),
  coverPublicId: text("cover_public_id"),
  coverColor: text("cover_color"),
  coverMode: text("cover_mode"),
  listId: text("list_id")
    .notNull()
    .references(() => listsTable.id, { onDelete: "cascade" }),
  startDate: integer("start_date", { mode: "timestamp" }),
  deadline: integer("deadline", { mode: "timestamp" }),
  dueAt: integer("due_at", { mode: "timestamp" }),
  dueComplete: integer("due_complete", { mode: "boolean" }).default(false),
  reminderMinutes: integer("reminder_minutes"),
  recurrence: text("recurrence"), // never, daily_weekdays, weekly, monthly_date, monthly_day
  recurrenceDay: integer("recurrence_day"), // for monthly_day (e.g., 2 for 2nd Sunday)
  recurrenceWeekday: integer("recurrence_weekday"), // for monthly_day (0=Sunday, 6=Saturday)
  repeatFrequency: text("repeat_frequency"), // daily, weekly, monthly
  repeatInterval: integer("repeat_interval"), // e.g., 2 for "every 2 weeks"
  latitude: integer("latitude"),
  longitude: integer("longitude"),
  completed: integer("completed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Checklist items table with foreign key to cards
export const checklistItemsTable = sqliteTable("checklist_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull(),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
});

// Attachments table with foreign key to cards
export const attachmentsTable = sqliteTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  publicId: text("public_id"),
  type: text("type").notNull(),
  size: integer("size").notNull().default(0),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  uploadedBy: text("uploaded_by").notNull(),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
});

// Labels table - user-specific labels (can be applied to cards across multiple boards)
// Each user can have unique combinations of (name, color) - same name with different colors allowed
export const labelsTable = sqliteTable("labels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  color: text("color").notNull(), // Hex color code
  userId: text("user_id").notNull(), // Auth0 user ID - labels belong to users, not boards
}, (table) => ({
  uniqueUserNameColor: unique().on(table.userId, table.name, table.color)
}));

// Board members table - maps Clerk users to boards
export const boardMembersTable = sqliteTable("board_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  boardId: text("board_id")
    .notNull()
    .references(() => boardsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name").notNull(), // User's full name from Clerk
  email: text("email").notNull(), // User's email from Clerk
  avatar: text("avatar"), // User's avatar URL from Clerk
  role: text("role").notNull().default("member"), // member, admin, viewer
  addedAt: integer("added_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Card-Label junction table (many-to-many)
export const cardLabelsTable = sqliteTable("card_labels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  labelId: text("label_id")
    .notNull()
    .references(() => labelsTable.id, { onDelete: "cascade" }),
});

// Card-Member junction table (many-to-many)
export const cardMembersTable = sqliteTable("card_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => boardMembersTable.id, { onDelete: "cascade" }),
});

// Comments table - stores user comments on cards
export const commentsTable = sqliteTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Clerk user ID
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Activities table - stores activity log for cards (auto-generated, cannot be edited/deleted)
export const activitiesTable = sqliteTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Clerk user ID of the person who performed the action
  actionType: text("action_type").notNull(), // e.g., "card.created", "card.renamed", "card.moved", "member.added"
  description: text("description").notNull(), // Human-readable description: "moved card from Todo to Done"
  metadata: text("metadata"), // JSON string for additional data (e.g., {"from": "listId1", "to": "listId2"})
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relations - Board to Lists (one-to-many), Labels (one-to-many), and Members (one-to-many)
export const boardRelations = relations(boardsTable, ({ many }) => ({
  lists: many(listsTable),
  members: many(boardMembersTable),
}));

// Relations - List to Board (many-to-one) and List to Cards (one-to-many)
export const listRelations = relations(listsTable, ({ one, many }) => ({
  board: one(boardsTable, {
    fields: [listsTable.boardId],
    references: [boardsTable.id],
  }),
  cards: many(cardsTable),
}));

// Relations - Card to List (many-to-one), Card to Checklist Items (one-to-many), Card to Attachments (one-to-many), and Card to Labels/Members (many-to-many)
export const cardRelations = relations(cardsTable, ({ one, many }) => ({
  list: one(listsTable, {
    fields: [cardsTable.listId],
    references: [listsTable.id],
  }),
  checklistItems: many(checklistItemsTable),
  attachments: many(attachmentsTable),
  cardLabels: many(cardLabelsTable),
  cardMembers: many(cardMembersTable),
  comments: many(commentsTable),
  activities: many(activitiesTable),
}));

// Relations - Checklist Item to Card (many-to-one)
export const checklistItemRelations = relations(checklistItemsTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [checklistItemsTable.cardId],
    references: [cardsTable.id],
  }),
}));

// Relations - Attachment to Card (many-to-one)
export const attachmentRelations = relations(attachmentsTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [attachmentsTable.cardId],
    references: [cardsTable.id],
  }),
}));

// Relations - Label to Board (many-to-one)
export const labelRelations = relations(labelsTable, ({ many }) => ({
  cardLabels: many(cardLabelsTable),
}));

// Relations - Board Member to Board (many-to-one)
export const boardMemberRelations = relations(boardMembersTable, ({ one, many }) => ({
  board: one(boardsTable, {
    fields: [boardMembersTable.boardId],
    references: [boardsTable.id],
  }),
  cardMembers: many(cardMembersTable),
}));

// Relations - Card Label junction (many-to-one to both Card and Label)
export const cardLabelRelations = relations(cardLabelsTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [cardLabelsTable.cardId],
    references: [cardsTable.id],
  }),
  label: one(labelsTable, {
    fields: [cardLabelsTable.labelId],
    references: [labelsTable.id],
  }),
}));

// Relations - Card Member junction (many-to-one to both Card and BoardMember)
export const cardMemberRelations = relations(cardMembersTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [cardMembersTable.cardId],
    references: [cardsTable.id],
  }),
  member: one(boardMembersTable, {
    fields: [cardMembersTable.memberId],
    references: [boardMembersTable.id],
  }),
}));

// Relations - Comment to Card (many-to-one)
export const commentRelations = relations(commentsTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [commentsTable.cardId],
    references: [cardsTable.id],
  }),
}));

// Relations - Activity to Card (many-to-one)
export const activityRelations = relations(activitiesTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [activitiesTable.cardId],
    references: [cardsTable.id],
  }),
}));

// Due Reminder Log table - tracks sent reminders to avoid duplicates
export const dueReminderLogTable = sqliteTable("due_reminder_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  cardId: text("card_id")
    .notNull()
    .references(() => cardsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  dueAtSnapshot: integer("due_at_snapshot", { mode: "timestamp" }).notNull(),
  reminderMinutes: integer("reminder_minutes").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
