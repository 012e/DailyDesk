import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
  description: text("description"), // Card description
  order: integer("order").notNull(),
  listId: text("list_id")
    .notNull()
    .references(() => listsTable.id, { onDelete: "cascade" }),
  labels: text("labels"), // JSON string: Label[]
  members: text("members"), // JSON string: Member[]
  startDate: integer("start_date", { mode: "timestamp" }), // Optional start date for events
  deadline: integer("deadline", { mode: "timestamp" }), // Optional deadline for events
  latitude: integer("latitude"), // Optional latitude for location
  longitude: integer("longitude"), // Optional longitude for location
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

// Labels table
export const labelsTable = sqliteTable("labels", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  color: text("color").notNull(), // Hex color code
  boardId: text("board_id")
    .notNull()
    .references(() => boardsTable.id, { onDelete: "cascade" }),
});

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

// Relations - Board to Lists (one-to-many), Labels (one-to-many), and Members (one-to-many)
export const boardRelations = relations(boardsTable, ({ many }) => ({
  lists: many(listsTable),
  labels: many(labelsTable),
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

// Relations - Card to List (many-to-one) and Card to Checklist Items (one-to-many)
export const cardRelations = relations(cardsTable, ({ one, many }) => ({
  list: one(listsTable, {
    fields: [cardsTable.listId],
    references: [listsTable.id],
  }),
  checklistItems: many(checklistItemsTable),
}));

// Relations - Checklist Item to Card (many-to-one)
export const checklistItemRelations = relations(checklistItemsTable, ({ one }) => ({
  card: one(cardsTable, {
    fields: [checklistItemsTable.cardId],
    references: [cardsTable.id],
  }),
}));

// Relations - Label to Board (many-to-one)
export const labelRelations = relations(labelsTable, ({ one }) => ({
  board: one(boardsTable, {
    fields: [labelsTable.boardId],
    references: [boardsTable.id],
  }),
}));

// Relations - Board Member to Board (many-to-one)
export const boardMemberRelations = relations(boardMembersTable, ({ one }) => ({
  board: one(boardsTable, {
    fields: [boardMembersTable.boardId],
    references: [boardsTable.id],
  }),
}));
