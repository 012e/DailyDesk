import { describe, test, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders, mockUser } from "./helpers/auth";
import { createTestApp } from "./helpers/app";
import { uuidv7 } from "uuidv7";

describe("Comments API Integration Tests", () => {
  let app: OpenAPIHono;
  let testBoardId: string;
  let testListId: string;
  let testCardId: string;

  beforeEach(async () => {
    app = createTestApp();

    // Create board
    testBoardId = uuidv7();
    await app.request("/boards", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ id: testBoardId, name: "Comments Test Board" }),
    });

    // Create list
    testListId = uuidv7();
    await app.request(`/boards/${testBoardId}/lists`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ id: testListId, name: "Test List", order: 0 }),
    });

    // Create card
    testCardId = uuidv7();
    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({ id: testCardId, name: "Test Card", listId: testListId, order: 0 }),
    });
  });

  describe("POST /boards/:boardId/cards/:cardId/comments", () => {
    test("should create a new comment", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "This is a test comment" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("cardId", testCardId);
      expect(data).toHaveProperty("content", "This is a test comment");
      expect(data).toHaveProperty("userId", mockUser.sub);
    });

    test("should require authentication", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "No auth" }),
      });

      expect(res.status).toBe(401);
    });

    test("should validate required fields", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "" }),
      });

      expect(res.status).toBe(400);
    });

    test("should return 404 for non-existent card", async () => {
      const fakeCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${fakeCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "Hello" }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /boards/:boardId/cards/:cardId/comments", () => {
    test("should return comments for a card", async () => {
      // create two comments
      const c1 = uuidv7();
      const c2 = uuidv7();

      await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "First comment" }),
      });

      await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "Second comment" }),
      });

      const res = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data.find((d) => d.content === "First comment")).toBeDefined();
      expect(data.find((d) => d.content === "Second comment")).toBeDefined();
    });
  });

  describe("PUT /boards/:boardId/cards/:cardId/comments/:commentId", () => {
    test("should update a comment", async () => {
      // create comment
      const createRes = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "To be updated" }),
      });
      expect(createRes.status).toBe(200);
      const created = await createRes.json() as any;

      // update
      const updateRes = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments/${created.id}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "Updated content" }),
      });

      expect(updateRes.status).toBe(200);
      const updated = await updateRes.json() as any;
      expect(updated).toHaveProperty("id", created.id);
      expect(updated).toHaveProperty("content", "Updated content");
    });
  });

  describe("DELETE /boards/:boardId/cards/:cardId/comments/:commentId", () => {
    test("should delete a comment", async () => {
      // create comment
      const createRes = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ content: "To be deleted" }),
      });
      expect(createRes.status).toBe(200);
      const created = await createRes.json() as any;

      // delete
      const delRes = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments/${created.id}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(delRes.status).toBe(200);

      // ensure it's gone
      const getRes = await app.request(`/boards/${testBoardId}/cards/${testCardId}/comments`, {
        method: "GET",
        headers: createAuthHeaders(),
      });
      expect(getRes.status).toBe(200);
      const comments = await getRes.json() as any[];
      expect(comments.find((c) => c.id === created.id)).toBeUndefined();
    });
  });
});
