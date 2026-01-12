import { describe, test, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders } from "../helpers/auth";
import { createTestApp } from "../helpers/app";
import { uuidv7 } from "uuidv7";

describe("Card movement between lists with order management", () => {
  let app: OpenAPIHono;
  let testBoardId: string;
  let testListId: string;

  beforeEach(async () => {
    // Create a new app instance for each test
    app = createTestApp();

    // Create a test board and list to use for card tests
    testBoardId = uuidv7();
    await app.request("/boards", {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: testBoardId,
        name: "Test Board for Cards",
      }),
    });

    testListId = uuidv7();
    await app.request(`/boards/${testBoardId}/lists`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: testListId,
        name: "Test List",
        order: 0,
      }),
    });
  });
  let list1Id: string;
  let list2Id: string;

  beforeEach(async () => {
    // Create two lists
    list1Id = uuidv7();
    list2Id = uuidv7();

    await app.request(`/boards/${testBoardId}/lists`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: list1Id,
        name: "List 1",
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/lists`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: list2Id,
        name: "List 2",
        order: 1,
      }),
    });
  });

  test("should move card from one list to another and update orders", async () => {
    // Create cards in list 1: [Card A(0), Card B(1), Card C(2)]
    const cardAId = uuidv7();
    const cardBId = uuidv7();
    const cardCId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardAId,
        name: "Card A",
        listId: list1Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardBId,
        name: "Card B",
        listId: list1Id,
        order: 1,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardCId,
        name: "Card C",
        listId: list1Id,
        order: 2,
      }),
    });

    // Create cards in list 2: [Card X(0), Card Y(1)]
    const cardXId = uuidv7();
    const cardYId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardXId,
        name: "Card X",
        listId: list2Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardYId,
        name: "Card Y",
        listId: list2Id,
        order: 1,
      }),
    });

    // Move Card B from list1 to list2 at position 1 (between X and Y)
    // Expected result in list2: [Card X(0), Card B(1), Card Y(2)]
    await app.request(`/boards/${testBoardId}/cards/${cardBId}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        listId: list2Id,
        order: 1,
      }),
    });

    // Get board to check all card orders
    const boardRes = await app.request(`/boards/${testBoardId}`, {
      method: "GET",
      headers: createAuthHeaders(),
    });

    const board = (await boardRes.json()) as any;
    const list1 = board.lists.find((l: any) => l.id === list1Id);
    const list2 = board.lists.find((l: any) => l.id === list2Id);

    // Check list 1 still has correct order: [Card A(0), Card C(1)]
    expect(list1.cards).toHaveLength(2);
    const cardA = list1.cards.find((c: any) => c.id === cardAId);
    const cardC = list1.cards.find((c: any) => c.id === cardCId);
    expect(cardA.order).toBe(0);
    expect(cardC.order).toBe(1); // Should be adjusted from 2 to 1

    // Check list 2 has correct order: [Card X(0), Card B(1), Card Y(2)]
    expect(list2.cards).toHaveLength(3);
    const cardX = list2.cards.find((c: any) => c.id === cardXId);
    const cardB = list2.cards.find((c: any) => c.id === cardBId);
    const cardY = list2.cards.find((c: any) => c.id === cardYId);
    expect(cardX.order).toBe(0);
    expect(cardB.order).toBe(1);
    expect(cardY.order).toBe(2); // Should be adjusted from 1 to 2
  });

  test("should handle moving card to end of another list", async () => {
    // Create cards in list 1: [Card A(0), Card B(1)]
    const cardAId = uuidv7();
    const cardBId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardAId,
        name: "Card A",
        listId: list1Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardBId,
        name: "Card B",
        listId: list1Id,
        order: 1,
      }),
    });

    // Create cards in list 2: [Card X(0), Card Y(1)]
    const cardXId = uuidv7();
    const cardYId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardXId,
        name: "Card X",
        listId: list2Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardYId,
        name: "Card Y",
        listId: list2Id,
        order: 1,
      }),
    });

    // Move Card A from list1 to end of list2
    await app.request(`/boards/${testBoardId}/cards/${cardAId}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        listId: list2Id,
        order: 2, // After X and Y
      }),
    });

    // Get board to check all card orders
    const boardRes = await app.request(`/boards/${testBoardId}`, {
      method: "GET",
      headers: createAuthHeaders(),
    });

    const board = (await boardRes.json()) as any;
    const list1 = board.lists.find((l: any) => l.id === list1Id);
    const list2 = board.lists.find((l: any) => l.id === list2Id);

    // Check list 1: [Card B(0)]
    expect(list1.cards).toHaveLength(1);
    const cardB = list1.cards.find((c: any) => c.id === cardBId);
    expect(cardB.order).toBe(0); // Adjusted from 1 to 0

    // Check list 2: [Card X(0), Card Y(1), Card A(2)]
    expect(list2.cards).toHaveLength(3);
    const cardX = list2.cards.find((c: any) => c.id === cardXId);
    const cardY = list2.cards.find((c: any) => c.id === cardYId);
    const cardA = list2.cards.find((c: any) => c.id === cardAId);
    expect(cardX.order).toBe(0);
    expect(cardY.order).toBe(1);
    expect(cardA.order).toBe(2);
  });

  test("should handle moving card to beginning of another list", async () => {
    // Create cards in list 1: [Card A(0), Card B(1)]
    const cardAId = uuidv7();
    const cardBId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardAId,
        name: "Card A",
        listId: list1Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardBId,
        name: "Card B",
        listId: list1Id,
        order: 1,
      }),
    });

    // Create cards in list 2: [Card X(0), Card Y(1)]
    const cardXId = uuidv7();
    const cardYId = uuidv7();

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardXId,
        name: "Card X",
        listId: list2Id,
        order: 0,
      }),
    });

    await app.request(`/boards/${testBoardId}/cards`, {
      method: "POST",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        id: cardYId,
        name: "Card Y",
        listId: list2Id,
        order: 1,
      }),
    });

    // Move Card B from list1 to beginning of list2
    await app.request(`/boards/${testBoardId}/cards/${cardBId}`, {
      method: "PUT",
      headers: createAuthHeaders(),
      body: JSON.stringify({
        listId: list2Id,
        order: 0,
      }),
    });

    // Get board to check all card orders
    const boardRes = await app.request(`/boards/${testBoardId}`, {
      method: "GET",
      headers: createAuthHeaders(),
    });

    const board = (await boardRes.json()) as any;
    const list1 = board.lists.find((l: any) => l.id === list1Id);
    const list2 = board.lists.find((l: any) => l.id === list2Id);

    // Check list 1: [Card A(0)]
    expect(list1.cards).toHaveLength(1);
    const cardA = list1.cards.find((c: any) => c.id === cardAId);
    expect(cardA.order).toBe(0);

    // Check list 2: [Card B(0), Card X(1), Card Y(2)]
    expect(list2.cards).toHaveLength(3);
    const cardB = list2.cards.find((c: any) => c.id === cardBId);
    const cardX = list2.cards.find((c: any) => c.id === cardXId);
    const cardY = list2.cards.find((c: any) => c.id === cardYId);
    expect(cardB.order).toBe(0);
    expect(cardX.order).toBe(1); // Adjusted from 0 to 1
    expect(cardY.order).toBe(2); // Adjusted from 1 to 2
  });
});
