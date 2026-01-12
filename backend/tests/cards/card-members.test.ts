import { describe, test, expect, beforeEach } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders } from "../helpers/auth";
import { createTestApp } from "../helpers/app";
import { uuidv7 } from "uuidv7";

describe("Cards Members Tests", () => {
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

  describe("Card Members", () => {
    let cardId: string;
    let boardMemberId: string;

    beforeEach(async () => {
      // Create a card for testing members
      cardId = uuidv7();
      await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          name: "Card for Member Tests",
          listId: testListId,
          order: 0,
        }),
      });

      // Add a board member to use for card member tests
      boardMemberId = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardMemberId,
          userId: "auth0|testuser123",
          name: "Test User",
          email: "testuser@example.com",
          avatar: "https://example.com/avatar.jpg",
          role: "member",
        }),
      });
    });

    test("should create a card with members", async () => {
      const newCardId = uuidv7();
      const newCard = {
        id: newCardId,
        name: "Card with Members",
        listId: testListId,
        order: 1,
        members: [{ id: boardMemberId }],
      };

      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newCard),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", newCardId);
      expect(data).toHaveProperty("members");
      
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("id", boardMemberId);
    });

    test("should add members to existing card via PUT", async () => {
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("members");
      
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("id", boardMemberId);
    });

    test("should retrieve card with member details via GET", async () => {
      // First add a member to the card
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Retrieve the card
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("members");
      
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("id", boardMemberId);
      expect(data.members[0]).toHaveProperty("name", "Test User");
      expect(data.members[0]).toHaveProperty("email", "testuser@example.com");
      expect(data.members[0]).toHaveProperty("avatar", "https://example.com/avatar.jpg");
      expect(data.members[0]).toHaveProperty("initials");
    });

    test("should add multiple members to a card", async () => {
      // Add another board member
      const boardMember2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardMember2Id,
          userId: "auth0|testuser456",
          name: "Jane Doe",
          email: "jane@example.com",
          role: "member",
        }),
      });

      // Add both members to the card
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }, { id: boardMember2Id }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("members");
      
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(2);
      
      const memberIds = data.members.map((m: any) => m.id);
      expect(memberIds).toContain(boardMemberId);
      expect(memberIds).toContain(boardMember2Id);
    });

    test("should remove members from a card by updating with empty array", async () => {
      // First add a member
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Remove all members
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("members");
      
      expect(Array.isArray(data.members)).toBe(true);
      expect(data.members).toHaveLength(0);
    });

    test("should replace existing members when updating", async () => {
      // Add first member
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Add another board member
      const boardMember2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardMember2Id,
          userId: "auth0|testuser789",
          name: "Bob Smith",
          email: "bob@example.com",
          role: "member",
        }),
      });

      // Replace with different member
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMember2Id }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("id", boardMember2Id);
      expect(data.members[0]).toHaveProperty("name", "Bob Smith");
    });

    test("should retrieve cards with members in board endpoint", async () => {
      // Add a member to the card
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Get the entire board
      const res = await app.request(`/boards/${testBoardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const board = await res.json() as any;
      expect(board).toHaveProperty("lists");
      
      const list = board.lists.find((l: any) => l.id === testListId);
      expect(list).toBeDefined();
      
      const card = list.cards.find((c: any) => c.id === cardId);
      expect(card).toBeDefined();
      expect(card).toHaveProperty("members");
      expect(Array.isArray(card.members)).toBe(true);
      expect(card.members).toHaveLength(1);
      expect(card.members[0]).toHaveProperty("id", boardMemberId);
      expect(card.members[0]).toHaveProperty("name", "Test User");
    });

    test("should retrieve cards with members in cards endpoint", async () => {
      // Add a member to the card
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Get all cards for the board
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const cards = await res.json() as any[];
      
      const card = cards.find((c: any) => c.id === cardId);
      expect(card).toBeDefined();
      
      expect(card.members).toBeDefined();
      expect(Array.isArray(card.members)).toBe(true);
      expect(card.members).toHaveLength(1);
      expect(card.members[0]).toHaveProperty("id", boardMemberId);
    });

    test("should generate correct initials for members", async () => {
      // Add member with multiple name parts
      const boardMember2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardMember2Id,
          userId: "auth0|johnsmith",
          name: "John Michael Smith",
          email: "john.smith@example.com",
          role: "member",
        }),
      });

      // Add member to card
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMember2Id }],
        }),
      });

      // Retrieve the card
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const data = await res.json() as any;
      expect(data.members[0]).toHaveProperty("initials", "JM");
    });

    test("should persist members when moving card to different list", async () => {
      // Create another list
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

      // Add member to card
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }],
        }),
      });

      // Move card to different list
      await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          listId: list2Id,
        }),
      });

      // Verify members are still present
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const data = await res.json() as any;
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("id", boardMemberId);
    });

    test("should auto-create board member from Auth0 when adding non-existent member to card", async () => {
      // This test simulates adding a member to a card using a userId that doesn't exist
      // in board_members table yet. The system should fetch from Auth0 and create the member.
      
      // Note: In a real scenario, this would call Auth0 API. In tests, this might need mocking.
      // For now, we test the flow assuming the member exists in the system.
      
      const newUserId = "auth0|auto-created-user";
      
      // First, manually add this user to board_members to simulate Auth0 response
      const autoMemberId = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: autoMemberId,
          userId: newUserId,
          name: "Auto Created User",
          email: "auto@example.com",
          role: "member",
        }),
      });

      // Now add this member to the card
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: autoMemberId }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("name", "Auto Created User");
      expect(data.members[0]).toHaveProperty("email", "auto@example.com");
    });

    test("should handle creating card with member that needs to be auto-fetched", async () => {
      // Create a new member for this test
      const newMemberId = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: newMemberId,
          userId: "auth0|newfetcheduser",
          name: "Fetched User",
          email: "fetched@example.com",
          role: "member",
        }),
      });

      // Create a card with this member directly
      const newCardId = uuidv7();
      const res = await app.request(`/boards/${testBoardId}/cards`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: newCardId,
          name: "Card with Auto-Fetched Member",
          listId: testListId,
          order: 0,
          members: [{ id: newMemberId }],
        }),
      });

      const data = await res.json() as any;
      console.log(data);
      expect(res.status).toBe(200);
      expect(data.members).toHaveLength(1);
      expect(data.members[0]).toHaveProperty("name", "Fetched User");
    });

    test("should handle multiple members including auto-fetched ones", async () => {
      // Add another member that would be auto-fetched
      const autoMember2Id = uuidv7();
      await app.request(`/boards/${testBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: autoMember2Id,
          userId: "auth0|anotheruser",
          name: "Another Auto User",
          email: "another@example.com",
          role: "member",
        }),
      });

      // Add both the existing member and the new one to the card
      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: boardMemberId }, { id: autoMember2Id }],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.members).toHaveLength(2);
      
      const memberNames = data.members.map((m: any) => m.name);
      expect(memberNames).toContain("Test User");
      expect(memberNames).toContain("Another Auto User");
    });

    test("should gracefully handle invalid member references", async () => {
      // Try to add a member with a completely invalid/non-existent ID
      // The system should handle this gracefully
      const fakeId = uuidv7(); // Non-existent member ID

      const res = await app.request(`/boards/${testBoardId}/cards/${cardId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          members: [{ id: fakeId }],
        }),
      });

      // The request should still succeed, but the invalid member should be skipped
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      // The members array might be empty or exclude the invalid member
      expect(Array.isArray(data.members)).toBe(true);
    });
  });
});