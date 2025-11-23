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

// Relations - Card to List (many-to-one)
export const cardRelations = relations(cardsTable, ({ one }) => ({
  list: one(listsTable, {
    fields: [cardsTable.listId],
    references: [listsTable.id],
  }),
}));
