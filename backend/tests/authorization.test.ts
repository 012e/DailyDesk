import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "@/lib/db";
import { boardsTable, boardMembersTable, listsTable, cardsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getBoardAccess,
  checkBoardAccess,
  checkPermission,
  requireBoardOwner,
  requireMemberManagement,
  canAssignRole,
  AuthorizationError,
  type BoardRole,
  type Permission,
} from "@/services/authorization.service";

describe("Authorization Tests", () => {
  let testBoardId: string;
  let listId: string;
  let cardId: string;

  // Test user IDs
  const ownerUserId = "test-owner-user-id";
  const adminUserId = "test-admin-user-id";
  const memberUserId = "test-member-user-id";
  const outsiderUserId = "test-outsider-user-id";

  beforeEach(async () => {
    // Create a test board owned by owner
    testBoardId = crypto.randomUUID();
    await db.insert(boardsTable).values({
      id: testBoardId,
      name: "Test Authorization Board",
      userId: ownerUserId,
    });

    // Add admin member
    await db.insert(boardMembersTable).values({
      id: crypto.randomUUID(),
      boardId: testBoardId,
      userId: adminUserId,
      name: "Admin User",
      email: "admin@test.com",
      role: "admin",
    });

    // Add regular member
    await db.insert(boardMembersTable).values({
      id: crypto.randomUUID(),
      boardId: testBoardId,
      userId: memberUserId,
      name: "Member User",
      email: "member@test.com",
      role: "member",
    });

    // Create a test list
    listId = crypto.randomUUID();
    await db.insert(listsTable).values({
      id: listId,
      name: "Test List",
      order: 0,
      boardId: testBoardId,
    });

    // Create a test card
    cardId = crypto.randomUUID();
    await db.insert(cardsTable).values({
      id: cardId,
      name: "Test Card",
      order: 0,
      listId: listId,
    });
  });

  afterEach(async () => {
    // Clean up test data in correct order (cards -> lists -> members -> boards)
    // Note: This cleanup is optional as beforeEach in setup.ts clears all tables anyway
  });

  describe("getBoardAccess", () => {
    it("returns 'owner' for board owner", async () => {
      const access = await getBoardAccess(testBoardId, ownerUserId);
      expect(access).toMatchObject({ role: "owner", isOwner: true, isMember: false });
    });

    it("returns 'admin' for admin member", async () => {
      const access = await getBoardAccess(testBoardId, adminUserId);
      expect(access).toMatchObject({ role: "admin", isOwner: false, isMember: true });
    });

    it("returns 'member' for regular member", async () => {
      const access = await getBoardAccess(testBoardId, memberUserId);
      expect(access).toMatchObject({ role: "member", isOwner: false, isMember: true });
    });

    it("returns null for outsider", async () => {
      const access = await getBoardAccess(testBoardId, outsiderUserId);
      expect(access).toBeNull();
    });
  });

  describe("checkBoardAccess", () => {
    it("does not throw for owner", async () => {
      await expect(checkBoardAccess(testBoardId, ownerUserId)).resolves.not.toThrow();
    });

    it("does not throw for member", async () => {
      await expect(checkBoardAccess(testBoardId, memberUserId)).resolves.not.toThrow();
    });

    it("throws for outsider", async () => {
      await expect(checkBoardAccess(testBoardId, outsiderUserId)).rejects.toThrow(AuthorizationError);
    });
  });

  describe("checkPermission - board:read", () => {
    it("owner can read board", async () => {
      await expect(checkPermission(testBoardId, ownerUserId, "board:read")).resolves.not.toThrow();
    });

    it("admin can read board", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "board:read")).resolves.not.toThrow();
    });

    it("member can read board", async () => {
      await expect(checkPermission(testBoardId, memberUserId, "board:read")).resolves.not.toThrow();
    });

    it("outsider cannot read board", async () => {
      await expect(checkPermission(testBoardId, outsiderUserId, "board:read")).rejects.toThrow(AuthorizationError);
    });
  });

  describe("checkPermission - board:update", () => {
    it("owner can update board", async () => {
      await expect(checkPermission(testBoardId, ownerUserId, "board:update")).resolves.not.toThrow();
    });

    it("admin can update board", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "board:update")).resolves.not.toThrow();
    });

    it("member cannot update board", async () => {
      await expect(checkPermission(testBoardId, memberUserId, "board:update")).rejects.toThrow(AuthorizationError);
    });
  });

  describe("checkPermission - board:delete", () => {
    it("owner can delete board", async () => {
      await expect(checkPermission(testBoardId, ownerUserId, "board:delete")).resolves.not.toThrow();
    });

    it("admin cannot delete board", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "board:delete")).rejects.toThrow(AuthorizationError);
    });

    it("member cannot delete board", async () => {
      await expect(checkPermission(testBoardId, memberUserId, "board:delete")).rejects.toThrow(AuthorizationError);
    });
  });

  describe("checkPermission - content:create", () => {
    it("owner can create content", async () => {
      await expect(checkPermission(testBoardId, ownerUserId, "content:create")).resolves.not.toThrow();
    });

    it("admin can create content", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "content:create")).resolves.not.toThrow();
    });

    it("member can create content", async () => {
      await expect(checkPermission(testBoardId, memberUserId, "content:create")).resolves.not.toThrow();
    });
  });

  describe("checkPermission - content:read", () => {
    it("member can read content", async () => {
      await expect(checkPermission(testBoardId, memberUserId, "content:read")).resolves.not.toThrow();
    });
  });

  describe("requireBoardOwner", () => {
    it("passes for owner", async () => {
      await expect(requireBoardOwner(testBoardId, ownerUserId)).resolves.not.toThrow();
    });

    it("throws for admin", async () => {
      await expect(requireBoardOwner(testBoardId, adminUserId)).rejects.toThrow(AuthorizationError);
    });

    it("throws for member", async () => {
      await expect(requireBoardOwner(testBoardId, memberUserId)).rejects.toThrow(AuthorizationError);
    });
  });

  describe("requireMemberManagement", () => {
    it("owner can manage members", async () => {
      await expect(requireMemberManagement(testBoardId, ownerUserId)).resolves.not.toThrow();
    });

    it("admin can manage members", async () => {
      await expect(requireMemberManagement(testBoardId, adminUserId)).resolves.not.toThrow();
    });

    it("member cannot manage members", async () => {
      await expect(requireMemberManagement(testBoardId, memberUserId)).rejects.toThrow(AuthorizationError);
    });
  });

  describe("Admin member permissions", () => {
    it("admin has member:add permission", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "member:add")).resolves.not.toThrow();
    });

    it("admin has member:update permission", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "member:update")).resolves.not.toThrow();
    });

    it("admin has member:remove permission", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "member:remove")).resolves.not.toThrow();
    });

    it("admin has member:read permission", async () => {
      await expect(checkPermission(testBoardId, adminUserId, "member:read")).resolves.not.toThrow();
    });

    it("admin access includes all member permissions", async () => {
      const access = await getBoardAccess(testBoardId, adminUserId);
      expect(access?.permissions).toContain("member:add");
      expect(access?.permissions).toContain("member:update");
      expect(access?.permissions).toContain("member:remove");
      expect(access?.permissions).toContain("member:read");
    });
  });

  describe("canAssignRole", () => {
    it("owner can assign any role", () => {
      expect(canAssignRole("owner", "admin")).toBe(true);
      expect(canAssignRole("owner", "member")).toBe(true);
    });

    it("admin can assign member role", () => {
      expect(canAssignRole("admin", "member")).toBe(true);
    });

    it("admin cannot assign admin role", () => {
      expect(canAssignRole("admin", "admin")).toBe(false);
    });

    it("member cannot assign any role", () => {
      expect(canAssignRole("member", "admin")).toBe(false);
      expect(canAssignRole("member", "member")).toBe(false);
    });
  });
});
