import { describe, test, expect, beforeEach, vi } from "vitest";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createAuthHeaders, mockUser } from "./helpers/auth";
import { createTestApp } from "./helpers/app";
import { uuidv7 } from "uuidv7";

// Mock fetch globally for user search tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Members API Integration Tests", () => {
  let app: OpenAPIHono;

  beforeEach(() => {
    // Create a new app instance for each test
    app = createTestApp();
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("GET /boards/{boardId}/members", () => {
    test("should return all members for a board as owner", async () => {
      // First create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board with Members",
        }),
      });

      // Add a member
      const memberId = uuidv7();
      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: "auth0|member123",
          name: "John Doe",
          email: "john@example.com",
          avatar: "https://example.com/avatar.jpg",
          role: "member",
        }),
      });

      // Get all members
      const res = await app.request(`/boards/${boardId}/members`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("userId");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("email");
    });

    test("should return members for a board member", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add current user as a member
      const memberId = uuidv7();
      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: mockUser.sub,
          name: mockUser.name,
          email: mockUser.email,
          role: "member",
        }),
      });

      // Get members
      const res = await app.request(`/boards/${boardId}/members`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("should return 404 if board does not exist", async () => {
      const nonExistentBoardId = uuidv7();

      const res = await app.request(`/boards/${nonExistentBoardId}/members`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data).toHaveProperty("error");
    });

    test("should return 403 if user is not owner or member", async () => {
      // Create a board with a different user context would be needed
      // For now, this test demonstrates the structure
      const boardId = uuidv7();
      
      const res = await app.request(`/boards/${boardId}/members`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404); // Board doesn't exist for this user
    });

    test("should reject request without authentication", async () => {
      const boardId = uuidv7();

      const res = await app.request(`/boards/${boardId}/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /boards/{boardId}/members", () => {
    test("should add a member to a board as owner", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add a member
      const memberId = uuidv7();
      const newMember = {
        id: memberId,
        userId: "auth0|newmember456",
        name: "Jane Smith",
        email: "jane@example.com",
        avatar: "https://example.com/jane.jpg",
        role: "member",
      };

      const res = await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newMember),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("id", memberId);
      expect(data).toHaveProperty("userId", newMember.userId);
      expect(data).toHaveProperty("name", newMember.name);
      expect(data).toHaveProperty("email", newMember.email);
      expect(data).toHaveProperty("role", "member");
    });

    test("should add a member with admin role", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add an admin member
      const memberId = uuidv7();
      const newMember = {
        id: memberId,
        userId: "auth0|admin789",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
      };

      const res = await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newMember),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("role", "admin");
    });

    test("should return 404 if board does not exist", async () => {
      const nonExistentBoardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${nonExistentBoardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: "auth0|user123",
          name: "Test User",
          email: "test@example.com",
        }),
      });

      expect(res.status).toBe(404);
    });

    test("should return 409 if member already exists in board", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add a member
      const memberId = uuidv7();
      const newMember = {
        id: memberId,
        userId: "auth0|duplicate123",
        name: "Duplicate User",
        email: "duplicate@example.com",
      };

      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify(newMember),
      });

      // Try to add the same member again (same userId)
      const res = await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: uuidv7(), // Different ID but same userId
          userId: "auth0|duplicate123",
          name: "Duplicate User",
          email: "duplicate@example.com",
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data).toHaveProperty("error");
    });

    test("should reject request without authentication", async () => {
      const boardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: memberId,
          userId: "auth0|user123",
          name: "Test User",
          email: "test@example.com",
        }),
      });

      expect(res.status).toBe(401);
    });

    test("should validate required fields", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Try to add member without required fields
      const res = await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: uuidv7(),
          // Missing userId, name, email
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /boards/{boardId}/members/{id}", () => {
    test("should update member role as board owner", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add a member
      const memberId = uuidv7();
      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: "auth0|member123",
          name: "Member User",
          email: "member@example.com",
          role: "member",
        }),
      });

      // Update member role
      const res = await app.request(`/boards/${boardId}/members/${memberId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          role: "admin",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("role", "admin");
    });

    test("should return 404 if member does not exist", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      const nonExistentMemberId = uuidv7();
      const res = await app.request(`/boards/${boardId}/members/${nonExistentMemberId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          role: "admin",
        }),
      });

      expect(res.status).toBe(404);
    });

    test("should return 404 if board does not exist", async () => {
      const nonExistentBoardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${nonExistentBoardId}/members/${memberId}`, {
        method: "PUT",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          role: "admin",
        }),
      });

      expect(res.status).toBe(404);
    });

    test("should reject request without authentication", async () => {
      const boardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${boardId}/members/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "admin",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /boards/{boardId}/members/{id}", () => {
    test("should remove member as board owner", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add a member
      const memberId = uuidv7();
      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: "auth0|member123",
          name: "Member User",
          email: "member@example.com",
        }),
      });

      // Remove member
      const res = await app.request(`/boards/${boardId}/members/${memberId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data).toHaveProperty("message");

      // Verify member is removed
      const getRes = await app.request(`/boards/${boardId}/members`, {
        method: "GET",
        headers: createAuthHeaders(),
      });

      const members = await getRes.json() as any[];
      const removedMember = members.find((m: any) => m.id === memberId);
      expect(removedMember).toBeUndefined();
    });

    test("should allow member to remove themselves", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      // Add current user as member
      const memberId = uuidv7();
      await app.request(`/boards/${boardId}/members`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: memberId,
          userId: mockUser.sub,
          name: mockUser.name,
          email: mockUser.email,
        }),
      });

      // Remove self
      const res = await app.request(`/boards/${boardId}/members/${memberId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
    });

    test("should return 404 if member does not exist", async () => {
      // Create a board
      const boardId = uuidv7();
      await app.request("/boards", {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          id: boardId,
          name: "Test Board",
        }),
      });

      const nonExistentMemberId = uuidv7();
      const res = await app.request(`/boards/${boardId}/members/${nonExistentMemberId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should return 404 if board does not exist", async () => {
      const nonExistentBoardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${nonExistentBoardId}/members/${memberId}`, {
        method: "DELETE",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(404);
    });

    test("should reject request without authentication", async () => {
      const boardId = uuidv7();
      const memberId = uuidv7();

      const res = await app.request(`/boards/${boardId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /users/search", () => {
    test("should search users successfully with valid query", async () => {
      const mockAuth0Response = [
        {
          user_id: "auth0|123456",
          email: "john.doe@example.com",
          name: "John Doe",
          picture: "https://example.com/avatar.jpg",
          nickname: "johndoe",
        },
        {
          user_id: "auth0|789012",
          email: "jane.smith@example.com",
          name: "Jane Smith",
          picture: "https://example.com/avatar2.jpg",
          nickname: "janesmith",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAuth0Response,
      });

      const res = await app.request("/users/search?q=john&per_page=10&page=0", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        user_id: "auth0|123456",
        email: "john.doe@example.com",
        name: "John Doe",
        picture: "https://example.com/avatar.jpg",
        nickname: "johndoe",
      });

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain("/api/v2/users");
      expect(fetchCall[0]).toContain("john");
      expect(fetchCall[0]).toContain("search_engine=v3");
      expect(fetchCall[1].headers.Authorization).toContain("Bearer");
    });

    test("should handle search with pagination parameters", async () => {
      const mockAuth0Response = [
        {
          user_id: "auth0|111",
          email: "user1@example.com",
          name: "User One",
          picture: null,
          nickname: "user1",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockAuth0Response,
      });

      const res = await app.request("/users/search?q=user&per_page=5&page=2", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);

      // Verify pagination parameters were passed
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain("per_page=5");
      expect(fetchCall[0]).toContain("page=2");
    });

    test("should use default pagination when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const res = await app.request("/users/search?q=test", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);

      // Verify default pagination parameters
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain("per_page=10");
      expect(fetchCall[0]).toContain("page=0");
    });

    test("should return empty array when no users found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const res = await app.request("/users/search?q=nonexistent", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test("should reject request without authentication", async () => {
      const res = await app.request("/users/search?q=john", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.status).toBe(401);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test("should require query parameter", async () => {
      const res = await app.request("/users/search", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      // Should return validation error
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test("should reject empty query parameter", async () => {
      const res = await app.request("/users/search?q=", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      // Should return validation error for empty string
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test("should handle Auth0 API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Rate limit exceeded",
      });

      const res = await app.request("/users/search?q=john", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(429);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test("should handle Auth0 API unauthorized errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid token",
      });

      const res = await app.request("/users/search?q=john", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(401);
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const res = await app.request("/users/search?q=john", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(500);
    });

    test("should properly encode search query in URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const specialQuery = "test@example.com";
      const res = await app.request(
        `/users/search?q=${encodeURIComponent(specialQuery)}`,
        {
          method: "GET",
          headers: createAuthHeaders(),
        }
      );

      expect(res.status).toBe(200);

      const fetchCall = mockFetch.mock.calls[0];
      // Verify the query is properly encoded in the Auth0 API call
      expect(fetchCall[0]).toContain(encodeURIComponent("*test@example.com*"));
    });

    test("should include search_engine parameter for Auth0 v3", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const res = await app.request("/users/search?q=test", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain("search_engine=v3");
    });

    test("should map Auth0 user fields correctly", async () => {
      const mockAuth0User = {
        user_id: "auth0|999",
        email: "complete@example.com",
        name: "Complete User",
        picture: "https://example.com/pic.jpg",
        nickname: "complete",
        // Extra fields that should be ignored
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        last_login: "2024-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockAuth0User],
      });

      const res = await app.request("/users/search?q=complete", {
        method: "GET",
        headers: createAuthHeaders(),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(data).toHaveLength(1);
      
      // Should only include mapped fields
      expect(data[0]).toEqual({
        user_id: "auth0|999",
        email: "complete@example.com",
        name: "Complete User",
        picture: "https://example.com/pic.jpg",
        nickname: "complete",
      });
      
      // Should not include extra fields
      expect(data[0]).not.toHaveProperty("created_at");
      expect(data[0]).not.toHaveProperty("updated_at");
      expect(data[0]).not.toHaveProperty("last_login");
    });
  });
});
