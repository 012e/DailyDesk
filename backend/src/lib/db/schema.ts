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
  order: integer("order").notNull(),
  listId: text("list_id")
    .notNull()
    .references(() => listsTable.id, { onDelete: "cascade" }),
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
});

// Relations - Board to Lists (one-to-many)
export const boardRelations = relations(boardsTable, ({ many }) => ({
  lists: many(listsTable),
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
