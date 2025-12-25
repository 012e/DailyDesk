import { describe, test, expect, beforeEach } from "@jest/globals";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders, mockUser } from "./helpers/auth";
import { createTestApp } from "./helpers/app";

describe("Boards API Integration Tests", () => {
  let app: OpenAPIHono;

  beforeEach(() => {
    // Create a new app instance for each test
    app = createTestApp();
  });

  describe("GET /boards", () => {
    test("should return empty array for authenticated user with no boards", async () => {
      const res = await app.request("/boards", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /boards", () => {
    test("should create a new board", async () => {
      const newBoard = {
        id: crypto.randomUUID(),
        name: "Test Board",
        backgroundColor: "#3498db",
      };

      const res = await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newBoard),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", newBoard.id);
      expect(data).toHaveProperty("name", newBoard.name);
      expect(data).toHaveProperty("backgroundColor", newBoard.backgroundColor);
      expect(data).toHaveProperty("userId", mockUser.sub);
    });

    test("should reject board creation without authentication", async () => {
      const newBoard = {
        id: crypto.randomUUID(),
        name: "Test Board",
      };

      const res = await app.request("/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBoard),
      });

      expect(res.status).toBe(401);
    });

    test("should validate required fields", async () => {
      const invalidBoard = {
        id: "invalid-id", // Not a valid UUID
      };

      const res = await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(invalidBoard),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /boards/:id", () => {
    test("should return a specific board with lists and cards", async () => {
      // First create a board
      const boardId = crypto.randomUUID();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board for Retrieval",
        }),
      });

      // Then retrieve it
      const res = await app.request(`/boards/${boardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", boardId);
      expect(data).toHaveProperty("lists");
      expect(Array.isArray(data.lists)).toBe(true);
    });

    test("should return 404 for non-existent board", async () => {
      const nonExistentId = crypto.randomUUID();

      const res = await app.request(`/boards/${nonExistentId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /boards/:id", () => {
    test("should update board properties", async () => {
      // First create a board
      const boardId = crypto.randomUUID();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Original Name",
        }),
      });

      // Then update it
      // The server expects PUT for full updates
      const res = await app.request(`/boards/${boardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          name: "Updated Name",
          backgroundColor: "#e74c3c",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("name", "Updated Name");
      expect(data).toHaveProperty("backgroundColor", "#e74c3c");
    });
  });

  describe("DELETE /boards/:id", () => {
    test("should delete a board", async () => {
      // First create a board
      const boardId = crypto.randomUUID();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Board to Delete",
        }),
      });

      // Then delete it
      const deleteRes = await app.request(`/boards/${boardId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);

      // Verify it's gone
      const getRes = await app.request(`/boards/${boardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(getRes.status).toBe(404);
    });
  });
});
