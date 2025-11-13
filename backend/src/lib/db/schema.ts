import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: integer().primaryKey({
    autoIncrement: true,
  }),
  name: text({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: text({ length: 255 }).notNull().unique(),
});

export const boards = sqliteTable("boards", {
  id: integer().primaryKey({
    autoIncrement: true,
  }),
  name: text({ length: 255 }).notNull(),
});

export const lists = sqliteTable("lists", {
  id: integer().primaryKey({
    autoIncrement: true,
  }),
  name: text({ length: 255 }).notNull(),
  order: integer().notNull(),
});

export const boardRelations = relations(boards, ({ many }) => ({
  lists: many(lists),
}));

export const cards = sqliteTable("cards", {
  id: integer().primaryKey({
    autoIncrement: true,
  }),
  name: text({ length: 255 }).notNull(),
  order: integer().notNull(),
});

export const listRelations = relations(lists, ({ many }) => ({
  cards: many(cards),
}));

export const labels = sqliteTable("labels", {
  id: integer().primaryKey({
    autoIncrement: true,
  }),
  name: text({ length: 255 }).notNull(),
});
