import { describe, test, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders } from "./helpers/auth";
import { createTestApp } from "./helpers/app";

describe("Lists API Integration Tests", () => {
  let app: OpenAPIHono;
  let testBoardId: string;

  beforeEach(async () => {
    // Create a new app instance for each test
    app = createTestApp();

    // Create a test board to use for list tests
    testBoardId = crypto.randomUUID();
    await app.request("/api/boards", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: testBoardId,
        name: "Test Board for Lists",
      }),
    });
  });

  describe("POST /api/lists", () => {
    test("should create a new list", async () => {
      const newList = {
        id: crypto.randomUUID(),
        name: "To Do",
        boardId: testBoardId,
        order: 0,
      };

      const res = await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newList),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", newList.id);
      expect(data).toHaveProperty("name", newList.name);
      expect(data).toHaveProperty("boardId", testBoardId);
      expect(data).toHaveProperty("order", 0);
    });

    test("should validate board exists", async () => {
      const newList = {
        id: crypto.randomUUID(),
        name: "Invalid List",
        boardId: crypto.randomUUID(), // Non-existent board
        order: 0,
      };

      const res = await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newList),
      });

      // Should fail due to foreign key constraint
      expect(res.status).not.toBe(200);
    });

    test("should require authentication", async () => {
      const newList = {
        id: crypto.randomUUID(),
        name: "Unauthorized List",
        boardId: testBoardId,
        order: 0,
      };

      const res = await app.request("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newList),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/lists/:id", () => {
    test("should update list name", async () => {
      // Create a list first
      const listId = crypto.randomUUID();
      await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: listId,
          name: "Original Name",
          boardId: testBoardId,
          order: 0,
        }),
      });

      // Update it
      const res = await app.request(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("name", "Updated Name");
    });

    test("should update list order", async () => {
      // Create two lists
      const list1Id = crypto.randomUUID();
      const list2Id = crypto.randomUUID();

      await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list1Id,
          name: "List 1",
          boardId: testBoardId,
          order: 0,
        }),
      });

      await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list2Id,
          name: "List 2",
          boardId: testBoardId,
          order: 1,
        }),
      });

      // Reorder
      const res = await app.request(`/api/lists/${list1Id}`, {
        method: "PATCH",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          order: 2,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("order", 2);
    });
  });

  describe("DELETE /api/lists/:id", () => {
    test("should delete a list", async () => {
      // Create a list
      const listId = crypto.randomUUID();
      await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: listId,
          name: "List to Delete",
          boardId: testBoardId,
          order: 0,
        }),
      });

      // Delete it
      const deleteRes = await app.request(`/api/lists/${listId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);

      // Verify the board no longer has the list
      const boardRes = await app.request(`/api/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const deletedList = board.lists.find((l: any) => l.id === listId);
      expect(deletedList).toBeUndefined();
    });

    test("should cascade delete cards when list is deleted", async () => {
      // Create a list with a card
      const listId = crypto.randomUUID();
      const cardId = crypto.randomUUID();

      await app.request("/api/lists", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: listId,
          name: "List with Card",
          boardId: testBoardId,
          order: 0,
        }),
      });

      await app.request("/api/cards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card to be deleted",
          listId: listId,
          order: 0,
        }),
      });

      // Delete the list
      await app.request(`/api/lists/${listId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      // The card should be automatically deleted due to cascade
      // We can verify this by checking the board doesn't have the card
      const boardRes = await app.request(`/api/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const allCards = board.lists.flatMap((l: any) => l.cards);
      const deletedCard = allCards.find((c: any) => c.id === cardId);
      expect(deletedCard).toBeUndefined();
    });
  });

  describe("List ordering", () => {
    test("should maintain correct order when multiple lists are created", async () => {
      const listIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

      // Create three lists
      for (let i = 0; i < 3; i++) {
        await app.request("/api/lists", {
          method: "POST",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            id: listIds[i],
            name: `List ${i + 1}`,
            boardId: testBoardId,
            order: i,
          }),
        });
      }

      // Get the board and verify order
      const res = await app.request(`/api/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await res.json() as any;
      expect(board.lists).toHaveLength(3);
      expect(board.lists[0].order).toBe(0);
      expect(board.lists[1].order).toBe(1);
      expect(board.lists[2].order).toBe(2);
    });
  });
});
