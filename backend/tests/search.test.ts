import { describe, it, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders, mockUser } from "./helpers/auth";
import { createTestApp } from "./helpers/app";
import db from "@/lib/db";
import {
  boardsTable,
  listsTable,
  cardsTable,
  labelsTable,
  cardLabelsTable,
  checklistItemsTable,
  commentsTable,
} from "@/lib/db/schema";

describe("Search API", () => {
  let app: OpenAPIHono;
  const userId = mockUser.sub; // Use the actual mock user ID
  const headers = createAuthHeaders();
  let testBoardId: string;
  let testCardId: string;
  let testListId: string;
  let testLabelId: string;

  beforeEach(async () => {
    // Create a new app instance for each test
    app = createTestApp();

    // Create test board
    const board = await db
      .insert(boardsTable)
      .values({
        name: "Test Search Board",
        userId,
      })
      .returning();
    testBoardId = board[0].id;

    // Create test list
    const list = await db
      .insert(listsTable)
      .values({
        name: "Test Search List",
        boardId: testBoardId,
        order: 0,
      })
      .returning();
    testListId = list[0].id;

    // Create test card
    const card = await db
      .insert(cardsTable)
      .values({
        name: "Test Search Card with unique keyword",
        description: "This is a searchable description",
        listId: testListId,
        order: 0,
      })
      .returning();
    testCardId = card[0].id;

    // Create checklist item
    await db.insert(checklistItemsTable).values({
      name: "Search checklist item",
      cardId: testCardId,
      order: 0,
      completed: false,
    });

    // Create comment
    await db.insert(commentsTable).values({
      content: "This is a searchable comment",
      cardId: testCardId,
      userId,
    });
  });

  it("should search across all entity types", async () => {
    const response = await app.request("/search?q=Test&limit=10", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    expect(data.query).toBe("Test");
    // At minimum should have 1 result since the test creates data with "Test" in the name
    expect(data.total).toBeGreaterThan(0);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);

    // Should find at least the board, card, list
    const resultTypes = data.results.map((r: any) => r.type);
    expect(resultTypes).toContain("board");
    expect(resultTypes).toContain("card");
    expect(resultTypes).toContain("list");
  });

  it("should filter by entity type", async () => {
    const response = await app.request("/search?q=Test&types=card&limit=10", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    expect(data.results).toBeDefined();
    expect(data.results.every((r: any) => r.type === "card")).toBe(true);
  });

  it("should limit results per type", async () => {
    const response = await app.request("/search?q=Test&limit=2", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    // Each entity type should have at most 2 results
    const typeCounts = data.results.reduce((acc: any, r: any) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

    Object.values(typeCounts).forEach((count: any) => {
      expect(count).toBeLessThanOrEqual(2);
    });
  });

  it("should search within specific board", async () => {
    // Create another board
    const otherBoard = await db
      .insert(boardsTable)
      .values({
        name: "Other Search Board",
        userId,
      })
      .returning();

    const response = await app.request(`/search?q=Test&boardId=${testBoardId}&limit=10`, {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    // All results should belong to the specified board
    data.results.forEach((result: any) => {
      if (result.boardId) {
        expect(result.boardId).toBe(testBoardId);
      }
    });
  });

  it("should not find results for queries that don't match", async () => {
    const response = await app.request("/search?q=nonexistent-keyword-xyz&limit=10", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    expect(data.total).toBe(0);
    expect(data.results).toHaveLength(0);
  });

  it("should search card descriptions", async () => {
    const response = await app.request("/search?q=searchable&types=card&limit=10", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    expect(data.results).toBeDefined();
    const card = data.results.find((r: any) => r.id === testCardId);
    expect(card).toBeDefined();
    expect(card.description).toContain("searchable description");
  });

  it("should include card labels in search results", async () => {
    const response = await app.request("/search?q=unique&types=card&limit=10", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    const card = data.results.find((r: any) => r.id === testCardId);
    expect(card).toBeDefined();
    expect(card.labels).toBeDefined();
    expect(Array.isArray(card.labels)).toBe(true);
    // Labels should be empty array since we didn't create any for this test
    expect(card.labels.length).toBe(0);
  });

  it("should only return results from accessible boards", async () => {
    // Create a board for a different user
    const otherUserId = "other-user-456";
    await db.insert(boardsTable).values({
      name: "Private Search Board",
      userId: otherUserId,
    });

    const response = await app.request("/search?q=Test&limit=20", {
      method: "GET",
      headers,
    });

    expect(response.status).toBe(200);
    const data = await response.json() as any;

    // Should not include results from the other user's board
    const privateBoard = data.results.find(
      (r: any) => r.name === "Private Search Board"
    );
    expect(privateBoard).toBeUndefined();
  });
});
