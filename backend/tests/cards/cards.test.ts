import { describe, test, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders } from "../helpers/auth";
import { createTestApp } from "../helpers/app";
import { uuidv7 } from "uuidv7";

describe("Cards API Integration Tests", () => {
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

  describe("GET /boards/:boardId/cards", () => {
    test("should return empty array when board has no cards", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test("should return all cards for a board", async () => {
      // Create multiple cards
      const card1Id = uuidv7();
      const card2Id = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card1Id,
          name: "Card 1",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card2Id,
          name: "Card 2",
          listId: testListId,
          order: 1,
        }),
      });

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(data).toHaveLength(2);
      expect(data.find((c) => c.id === card1Id)).toBeDefined();
      expect(data.find((c) => c.id === card2Id)).toBeDefined();
    });

    test("should return 404 for non-existent board", async () => {
      const fakeBoardId = uuidv7();
      const res = await app.request(`/boards/${fakeBoardId}/cards`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should require authentication", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /boards/:boardId/cards", () => {
    test("should create a new card", async () => {
      const newCard = {
        id: uuidv7(),
        name: "New Task",
        listId: testListId,
        order: 0,
      };

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", newCard.id);
      expect(data).toHaveProperty("name", newCard.name);
      expect(data).toHaveProperty("listId", testListId);
      expect(data).toHaveProperty("order", 0);
    });

    test("should return 404 when board does not exist", async () => {
      const fakeBoardId = uuidv7();
      const newCard = {
        id: uuidv7(),
        name: "Card for non-existent board",
        listId: testListId,
        order: 0,
      };

      const res = await app.request(`/boards/${fakeBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(404);
    });

    test("should return 404 when list does not exist", async () => {
      const fakeListId = uuidv7();
      const newCard = {
        id: uuidv7(),
        name: "Card for non-existent list",
        listId: fakeListId,
        order: 0,
      };

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(404);
    });

    test("should return 403 when list does not belong to board", async () => {
      // Create another board and list
      const otherBoardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: otherBoardId,
          name: "Other Board",
        }),
      });

      const otherListId = uuidv7();
      await app.request(`/boards/${otherBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: otherListId,
          name: "Other List",
          order: 0,
        }),
      });

      // Try to create card in testBoard but with list from otherBoard
      const newCard = {
        id: uuidv7(),
        name: "Card with wrong list",
        listId: otherListId,
        order: 0,
      };

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(403);
    });

    test("should require authentication", async () => {
      const newCard = {
        id: uuidv7(),
        name: "Unauthorized Card",
        listId: testListId,
        order: 0,
      };

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /boards/:boardId/cards/:id", () => {
    test("should return a specific card", async () => {
      // Create a card
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Specific Card",
          listId: testListId,
          order: 0,
        }),
      });

      // Retrieve it
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", cardId);
      expect(data).toHaveProperty("name", "Specific Card");
      expect(data).toHaveProperty("listId", testListId);
    });

    test("should return 404 for non-existent card", async () => {
      const fakeCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${fakeCardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should return 404 for non-existent board", async () => {
      const cardId = uuidv7();
      const fakeBoardId = uuidv7();
      const res = await app.request(`/boards/${fakeBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should require authentication", async () => {
      const cardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /boards/:boardId/cards/:id", () => {
    test("should update card name", async () => {
      // Create a card
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Original Name",
          listId: testListId,
          order: 0,
        }),
      });

      // Update it
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("name", "Updated Name");
    });

    test("should return 404 when trying to move card to non-existent list", async () => {
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card to Move",
          listId: testListId,
          order: 0,
        }),
      });

      const fakeListId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          listId: fakeListId,
        }),
      });

      expect(res.status).toBe(404);
    });

    test("should return 403 when trying to move card to list in different board", async () => {
      // Create another board and list
      const otherBoardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: otherBoardId,
          name: "Other Board",
        }),
      });

      const otherListId = uuidv7();
      await app.request(`/boards/${otherBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: otherListId,
          name: "Other List",
          order: 0,
        }),
      });

      // Create card in testBoard
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card to Move",
          listId: testListId,
          order: 0,
        }),
      });

      // Try to move to list in other board
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          listId: otherListId,
        }),
      });

      expect(res.status).toBe(403);
    });

    test("should return 404 for non-existent card", async () => {
      const fakeCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${fakeCardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(404);
    });

    test("should require authentication", async () => {
      const cardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /boards/:boardId/cards/:id", () => {
    test("should delete a card", async () => {
      // Create a card
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card to Delete",
          listId: testListId,
          order: 0,
        }),
      });

      // Delete it
      const deleteRes = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);
      const deleteData = await deleteRes.json() as any;
      expect(deleteData).toHaveProperty("message");

      // Verify it's gone
      const getRes = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(getRes.status).toBe(404);
    });

    test("should return 404 for non-existent card", async () => {
      const fakeCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${fakeCardId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should return 404 for non-existent board", async () => {
      const cardId = uuidv7();
      const fakeBoardId = uuidv7();
      const res = await app.request(`/boards/${fakeBoardId}/cards/${cardId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should require authentication", async () => {
      const cardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
    });

    test("should maintain correct order of remaining cards after deleting first card", async () => {
      // Create three cards: [Card A(0), Card B(1), Card C(2)]
      const cardAId = uuidv7();
      const cardBId = uuidv7();
      const cardCId = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardAId,
          name: "Card A",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardBId,
          name: "Card B",
          listId: testListId,
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardCId,
          name: "Card C",
          listId: testListId,
          order: 2,
        }),
      });

      // Delete Card A (first card)
      const deleteRes = await app.request(`/boards/${testBoardId}/cards/${cardAId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);

      // Get the board and verify remaining cards have correct order
      const boardRes = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const cards = board.lists[0].cards;

      // Should have 2 cards left
      expect(cards).toHaveLength(2);

      // Find the remaining cards
      const cardB = cards.find((c: any) => c.id === cardBId);
      const cardC = cards.find((c: any) => c.id === cardCId);

      expect(cardB).toBeDefined();
      expect(cardC).toBeDefined();

      // Cards should be reordered: Card B(0), Card C(1)
      expect(cardB.order).toBe(0);
      expect(cardC.order).toBe(1);
    });

    test("should maintain correct order of remaining cards after deleting middle card", async () => {
      // Create three cards: [Card A(0), Card B(1), Card C(2)]
      const cardAId = uuidv7();
      const cardBId = uuidv7();
      const cardCId = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardAId,
          name: "Card A",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardBId,
          name: "Card B",
          listId: testListId,
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardCId,
          name: "Card C",
          listId: testListId,
          order: 2,
        }),
      });

      // Delete Card B (middle card)
      const deleteRes = await app.request(`/boards/${testBoardId}/cards/${cardBId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);

      // Get the board and verify remaining cards have correct order
      const boardRes = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const cards = board.lists[0].cards;

      // Should have 2 cards left
      expect(cards).toHaveLength(2);

      // Find the remaining cards
      const cardA = cards.find((c: any) => c.id === cardAId);
      const cardC = cards.find((c: any) => c.id === cardCId);

      expect(cardA).toBeDefined();
      expect(cardC).toBeDefined();

      // Cards should be reordered: Card A(0), Card C(1)
      expect(cardA.order).toBe(0);
      expect(cardC.order).toBe(1);
    });

    test("should maintain correct order of remaining cards after deleting last card", async () => {
      // Create three cards: [Card A(0), Card B(1), Card C(2)]
      const cardAId = uuidv7();
      const cardBId = uuidv7();
      const cardCId = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardAId,
          name: "Card A",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardBId,
          name: "Card B",
          listId: testListId,
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardCId,
          name: "Card C",
          listId: testListId,
          order: 2,
        }),
      });

      // Delete Card C (last card)
      const deleteRes = await app.request(`/boards/${testBoardId}/cards/${cardCId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(deleteRes.status).toBe(200);

      // Get the board and verify remaining cards have correct order
      const boardRes = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const cards = board.lists[0].cards;

      // Should have 2 cards left
      expect(cards).toHaveLength(2);

      // Find the remaining cards
      const cardA = cards.find((c: any) => c.id === cardAId);
      const cardB = cards.find((c: any) => c.id === cardBId);

      expect(cardA).toBeDefined();
      expect(cardB).toBeDefined();

      // Cards should maintain their order: Card A(0), Card B(1)
      expect(cardA.order).toBe(0);
      expect(cardB.order).toBe(1);
    });

    test("should maintain correct order after deleting multiple cards in sequence", async () => {
      // Create five cards: [Card A(0), Card B(1), Card C(2), Card D(3), Card E(4)]
      const cardAId = uuidv7();
      const cardBId = uuidv7();
      const cardCId = uuidv7();
      const cardDId = uuidv7();
      const cardEId = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardAId,
          name: "Card A",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardBId,
          name: "Card B",
          listId: testListId,
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardCId,
          name: "Card C",
          listId: testListId,
          order: 2,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardDId,
          name: "Card D",
          listId: testListId,
          order: 3,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardEId,
          name: "Card E",
          listId: testListId,
          order: 4,
        }),
      });

      // Delete Card B (order 1)
      await app.request(`/boards/${testBoardId}/cards/${cardBId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      // Delete Card D (originally order 3, now should be order 2)
      await app.request(`/boards/${testBoardId}/cards/${cardDId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      // Get the board and verify remaining cards have correct sequential order
      const boardRes = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const cards = board.lists[0].cards;

      // Should have 3 cards left
      expect(cards).toHaveLength(3);

      // Find the remaining cards
      const cardA = cards.find((c: any) => c.id === cardAId);
      const cardC = cards.find((c: any) => c.id === cardCId);
      const cardE = cards.find((c: any) => c.id === cardEId);

      expect(cardA).toBeDefined();
      expect(cardC).toBeDefined();
      expect(cardE).toBeDefined();

      // Cards should be reordered sequentially: Card A(0), Card C(1), Card E(2)
      expect(cardA.order).toBe(0);
      expect(cardC.order).toBe(1);
      expect(cardE.order).toBe(2);
    });

    test("should handle deletion correctly when cards are in different lists", async () => {
      // Create a second list
      const list2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list2Id,
          name: "List 2",
          order: 1,
        }),
      });

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
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardBId,
          name: "Card B",
          listId: testListId,
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardCId,
          name: "Card C",
          listId: testListId,
          order: 2,
        }),
      });

      // Create cards in list 2: [Card X(0), Card Y(1), Card Z(2)]
      const cardXId = uuidv7();
      const cardYId = uuidv7();
      const cardZId = uuidv7();

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

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardZId,
          name: "Card Z",
          listId: list2Id,
          order: 2,
        }),
      });

      // Delete Card B from list 1
      await app.request(`/boards/${testBoardId}/cards/${cardBId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      // Delete Card Y from list 2
      await app.request(`/boards/${testBoardId}/cards/${cardYId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      // Get the board and verify card orders in both lists
      const boardRes = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await boardRes.json() as any;
      const list1 = board.lists.find((l: any) => l.id === testListId);
      const list2 = board.lists.find((l: any) => l.id === list2Id);

      // Check list 1: should have Card A(0), Card C(1)
      expect(list1.cards).toHaveLength(2);
      const cardA = list1.cards.find((c: any) => c.id === cardAId);
      const cardC = list1.cards.find((c: any) => c.id === cardCId);
      expect(cardA.order).toBe(0);
      expect(cardC.order).toBe(1);

      // Check list 2: should have Card X(0), Card Z(1)
      expect(list2.cards).toHaveLength(2);
      const cardX = list2.cards.find((c: any) => c.id === cardXId);
      const cardZ = list2.cards.find((c: any) => c.id === cardZId);
      expect(cardX.order).toBe(0);
      expect(cardZ.order).toBe(1);
    });
  });

  describe("Card ordering", () => {
    test("should maintain correct order when multiple cards are created", async () => {
      const cardIds = [uuidv7(), uuidv7(), uuidv7()];

      // Create three cards
      for (let i = 0; i < 3; i++) {
        await app.request(`/boards/${testBoardId}/cards`, {
          method: "POST",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            id: cardIds[i],
            name: `Card ${i + 1}`,
            listId: testListId,
            order: i,
          }),
        });
      }

      // Get the board and verify order
      const res = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await res.json() as any;
      const cards = board.lists[0].cards;
      expect(cards).toHaveLength(3);
      expect(cards[0].order).toBe(0);
      expect(cards[1].order).toBe(1);
      expect(cards[2].order).toBe(2);
    });

    test("should allow reordering cards", async () => {
      // Create two cards
      const card1Id = uuidv7();
      const card2Id = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card1Id,
          name: "Card 1",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card2Id,
          name: "Card 2",
          listId: testListId,
          order: 1,
        }),
      });

      // Swap their order
      await app.request(`/boards/${testBoardId}/cards/${card1Id}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          order: 1,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards/${card2Id}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          order: 0,
        }),
      });

      // Verify new order
      const res = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const board = await res.json() as any;
      const cards = board.lists[0].cards;
      
      const reorderedCard1 = cards.find((c: any) => c.id === card1Id);
      const reorderedCard2 = cards.find((c: any) => c.id === card2Id);
      
      expect(reorderedCard1.order).toBe(1);
      expect(reorderedCard2.order).toBe(0);
    });
  });

  describe("Card with complex data", () => {
    test("should create and retrieve card with all fields", async () => {
      const startDate = new Date("2025-01-01T00:00:00Z");
      const deadline = new Date("2025-12-31T23:59:59Z");

      const cardId = uuidv7();
      const newCard = {
        id: cardId,
        name: "Complex Card",
        listId: testListId,
        order: 0,
        startDate: startDate.toISOString(),
        deadline: deadline.toISOString(),
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const createRes = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(createRes.status).toBe(200);

      // Retrieve and verify all fields
      const getRes = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const data = await getRes.json() as any;
      expect(data).toHaveProperty("id", cardId);
      expect(data).toHaveProperty("name", "Complex Card");
      expect(data).toHaveProperty("listId", testListId);
      expect(data).toHaveProperty("order", 0);
      expect(data).toHaveProperty("startDate");
      expect(data).toHaveProperty("deadline");
      expect(data).toHaveProperty("latitude", 37.7749);
      expect(data).toHaveProperty("longitude", -122.4194);
    });
  });

  describe("Card order bounds validation", () => {
    test("should reject creating card with order exceeding list size", async () => {
      // Create 2 cards (order 0 and 1)
      const card1Id = uuidv7();
      const card2Id = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card1Id,
          name: "Card 1",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card2Id,
          name: "Card 2",
          listId: testListId,
          order: 1,
        }),
      });

      // Try to create a card with order 5 (out of bounds, max should be 2)
      const invalidCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: invalidCardId,
          name: "Invalid Order Card",
          listId: testListId,
          order: 5,
        }),
      });

      expect(res.status).toBe(400);
      const error = await res.json() as any;
      expect(error).toHaveProperty("error");
      expect(error.error).toMatch(/order/i);
    });

    test("should allow creating card at exactly list size (at the end)", async () => {
      // Create 2 cards (order 0 and 1)
      const card1Id = uuidv7();
      const card2Id = uuidv7();

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card1Id,
          name: "Card 1",
          listId: testListId,
          order: 0,
        }),
      });

      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: card2Id,
          name: "Card 2",
          listId: testListId,
          order: 1,
        }),
      });

      // Creating a card at order 2 (list size) should succeed
      const validCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: validCardId,
          name: "Valid Order Card",
          listId: testListId,
          order: 2,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("order", 2);
    });

    test("should allow creating first card in empty list with order 0", async () => {
      // Create a new list
      const emptyListId = uuidv7();
      await app.request(`/boards/${testBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: emptyListId,
          name: "Empty List",
          order: 1,
        }),
      });

      // Create first card with order 0
      const cardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "First Card",
          listId: emptyListId,
          order: 0,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("order", 0);
    });

    test("should reject creating first card in empty list with order > 0", async () => {
      // Create a new list
      const emptyListId = uuidv7();
      await app.request(`/boards/${testBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: emptyListId,
          name: "Empty List",
          order: 1,
        }),
      });

      // Try to create first card with order 1 (should be 0)
      const cardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Invalid First Card",
          listId: emptyListId,
          order: 1,
        }),
      });

      expect(res.status).toBe(400);
      const error = await res.json() as any;
      expect(error).toHaveProperty("error");
      expect(error.error).toMatch(/order/i);
    });

    test("should reject updating card order beyond list size", async () => {
      // Create 3 cards
      const cardIds = [uuidv7(), uuidv7(), uuidv7()];
      for (let i = 0; i < 3; i++) {
        await app.request(`/boards/${testBoardId}/cards`, {
          method: "POST",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            id: cardIds[i],
            name: `Card ${i + 1}`,
            listId: testListId,
            order: i,
          }),
        });
      }

      // Try to update card to order 10 (out of bounds, max should be 2)
      const res = await app.request(`/boards/${testBoardId}/cards/${cardIds[0]}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          order: 10,
        }),
      });

      expect(res.status).toBe(400);
      const error = await res.json() as any;
      expect(error).toHaveProperty("error");
      expect(error.error).toMatch(/order/i);
    });

    test("should allow updating card order within valid range", async () => {
      // Create 3 cards
      const cardIds = [uuidv7(), uuidv7(), uuidv7()];
      for (let i = 0; i < 3; i++) {
        await app.request(`/boards/${testBoardId}/cards`, {
          method: "POST",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            id: cardIds[i],
            name: `Card ${i + 1}`,
            listId: testListId,
            order: i,
          }),
        });
      }

      // Update card from order 0 to order 2 (last position, valid)
      const res = await app.request(`/boards/${testBoardId}/cards/${cardIds[0]}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          order: 2,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("order", 2);
    });

    test("should reject moving card to another list with order out of bounds", async () => {
      // Create second list with 2 cards
      const list2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/lists`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list2Id,
          name: "List 2",
          order: 1,
        }),
      });

      const list2Card1Id = uuidv7();
      const list2Card2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list2Card1Id,
          name: "List 2 Card 1",
          listId: list2Id,
          order: 0,
        }),
      });
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: list2Card2Id,
          name: "List 2 Card 2",
          listId: list2Id,
          order: 1,
        }),
      });

      // Create card in first list
      const cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card to Move",
          listId: testListId,
          order: 0,
        }),
      });

      // Try to move card to list2 with order 5 (out of bounds, max should be 2)
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          listId: list2Id,
          order: 5,
        }),
      });

      expect(res.status).toBe(400);
      const error = await res.json() as any;
      expect(error).toHaveProperty("error");
      expect(error.error).toMatch(/order/i);
    });

  describe("Card movement between lists with order management", () => {
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

      const board = await boardRes.json() as any;
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

      const board = await boardRes.json() as any;
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

      const board = await boardRes.json() as any;
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
});
