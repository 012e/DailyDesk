import db from "@/lib/db";
import { boardsTable, boardMembersTable } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class AuthorizationError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 403) {
    super(message);
    this.status = status;
    this.name = "AuthorizationError";
  }
}

/**
 * Board roles and their permissions:
 * - owner: Full control (inherited from board.userId, not stored in boardMembers)
 * - admin: Can manage members (add/remove/update roles), full content control
 * - member: Can create/edit/delete lists, cards, and their content
 */
export type BoardRole = "owner" | "admin" | "member";

/**
 * Permission types for board operations
 */
export type Permission = 
  // Board permissions
  | "board:read"
  | "board:update"
  | "board:delete"
  // Member management permissions (admin only)
  | "member:read"
  | "member:add"
  | "member:update"
  | "member:remove"
  // Content permissions (for lists, cards, etc.)
  | "content:read"
  | "content:create"
  | "content:update"
  | "content:delete";

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<BoardRole, Permission[]> = {
  owner: [
    "board:read",
    "board:update",
    "board:delete",
    "member:read",
    "member:add",
    "member:update",
    "member:remove",
    "content:read",
    "content:create",
    "content:update",
    "content:delete",
  ],
  admin: [
    "board:read",
    "board:update",
    // Admin cannot delete the board
    "member:read",
    "member:add",
    "member:update",
    "member:remove",
    "content:read",
    "content:create",
    "content:update",
    "content:delete",
  ],
  member: [
    "board:read",
    "member:read",
    "content:read",
    "content:create",
    "content:update",
    "content:delete",
  ],
};

export interface BoardAccess {
  boardId: string;
  userId: string;
  role: BoardRole;
  isOwner: boolean;
  isMember: boolean;
  memberId?: string; // The board member ID if user is a member
  permissions: Permission[];
}

/**
 * Get user's role and access level for a specific board
 */
export async function getBoardAccess(
  boardId: string,
  userSub: string
): Promise<BoardAccess | null> {
  // Get board and check if user is owner
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    return null;
  }

  const isOwner = board[0].userId === userSub;

  if (isOwner) {
    return {
      boardId,
      userId: userSub,
      role: "owner",
      isOwner: true,
      isMember: false,
      permissions: ROLE_PERMISSIONS.owner,
    };
  }

  // Check if user is a member
  const member = await db
    .select()
    .from(boardMembersTable)
    .where(
      and(
        eq(boardMembersTable.boardId, boardId),
        eq(boardMembersTable.userId, userSub)
      )
    )
    .limit(1);

  if (member.length === 0) {
    return null;
  }

  const memberRole = member[0].role as BoardRole;

  return {
    boardId,
    userId: userSub,
    role: memberRole,
    isOwner: false,
    isMember: true,
    memberId: member[0].id,
    permissions: ROLE_PERMISSIONS[memberRole] || ROLE_PERMISSIONS.member,
  };
}

/**
 * Check if a user has access to a board (any role)
 */
export async function checkBoardAccess(
  boardId: string,
  userSub: string
): Promise<BoardAccess> {
  const access = await getBoardAccess(boardId, userSub);

  if (!access) {
    // Check if board exists to give appropriate error message
    const board = await db
      .select()
      .from(boardsTable)
      .where(eq(boardsTable.id, boardId))
      .limit(1);

    if (board.length === 0) {
      throw new AuthorizationError("Board không tồn tại", 404);
    }

    throw new AuthorizationError("Không có quyền truy cập Board này", 403);
  }

  return access;
}

/**
 * Check if a user has a specific permission on a board
 */
export async function checkPermission(
  boardId: string,
  userSub: string,
  permission: Permission
): Promise<BoardAccess> {
  const access = await checkBoardAccess(boardId, userSub);

  if (!access.permissions.includes(permission)) {
    throw new AuthorizationError(
      `Không có quyền thực hiện thao tác này (yêu cầu: ${permission})`,
      403
    );
  }

  return access;
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(
  boardId: string,
  userSub: string,
  permissions: Permission[]
): Promise<BoardAccess> {
  const access = await checkBoardAccess(boardId, userSub);

  const hasPermission = permissions.some(p => access.permissions.includes(p));
  
  if (!hasPermission) {
    throw new AuthorizationError(
      `Không có quyền thực hiện thao tác này`,
      403
    );
  }

  return access;
}

/**
 * Check if user has all of the specified permissions
 */
export async function checkAllPermissions(
  boardId: string,
  userSub: string,
  permissions: Permission[]
): Promise<BoardAccess> {
  const access = await checkBoardAccess(boardId, userSub);

  const hasAllPermissions = permissions.every(p => access.permissions.includes(p));
  
  if (!hasAllPermissions) {
    throw new AuthorizationError(
      `Không có quyền thực hiện thao tác này`,
      403
    );
  }

  return access;
}

/**
 * Check if user is board owner
 */
export async function requireBoardOwner(
  boardId: string,
  userSub: string
): Promise<BoardAccess> {
  const access = await checkBoardAccess(boardId, userSub);

  if (!access.isOwner) {
    throw new AuthorizationError(
      "Chỉ chủ board mới có thể thực hiện thao tác này",
      403
    );
  }

  return access;
}

/**
 * Check if user is admin or owner (can manage members)
 */
export async function requireMemberManagement(
  boardId: string,
  userSub: string
): Promise<BoardAccess> {
  return checkPermission(boardId, userSub, "member:add");
}

/**
 * Check if user can modify content (lists, cards, etc.)
 */
export async function requireContentModification(
  boardId: string,
  userSub: string
): Promise<BoardAccess> {
  return checkPermission(boardId, userSub, "content:create");
}

/**
 * Check if user can read board content
 */
export async function requireContentRead(
  boardId: string,
  userSub: string
): Promise<BoardAccess> {
  return checkPermission(boardId, userSub, "content:read");
}

/**
 * Helper to get board ID from a list
 */
export async function getBoardIdFromList(listId: string): Promise<string | null> {
  const result = await db
    .select({ boardId: sql<string>`board_id` })
    .from(sql`lists`)
    .where(sql`id = ${listId}`)
    .limit(1);

  return result.length > 0 ? result[0].boardId : null;
}

/**
 * Helper to get board ID from a card
 */
export async function getBoardIdFromCard(cardId: string): Promise<string | null> {
  const result = await db
    .select({ boardId: sql<string>`boards.id` })
    .from(sql`cards`)
    .innerJoin(sql`lists`, sql`cards.list_id = lists.id`)
    .innerJoin(sql`boards`, sql`lists.board_id = boards.id`)
    .where(sql`cards.id = ${cardId}`)
    .limit(1);

  return result.length > 0 ? result[0].boardId : null;
}

/**
 * Role hierarchy - used to prevent users from assigning roles higher than their own
 */
const ROLE_HIERARCHY: Record<BoardRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Check if a user can assign/change a role
 * Only owner and admin can assign roles
 * Users cannot assign roles equal or higher than their own (except owner who can do anything)
 */
export function canAssignRole(
  assignerRole: BoardRole,
  targetRole: BoardRole
): boolean {
  if (assignerRole === "owner") {
    return true;
  }
  
  // Only admin can assign roles (besides owner)
  if (assignerRole !== "admin") {
    return false;
  }
  
  return ROLE_HIERARCHY[assignerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Validate role assignment
 */
export async function validateRoleAssignment(
  boardId: string,
  userSub: string,
  targetRole: BoardRole
): Promise<BoardAccess> {
  const access = await checkPermission(boardId, userSub, "member:update");
  
  if (!canAssignRole(access.role, targetRole)) {
    throw new AuthorizationError(
      `Không thể gán vai trò ${targetRole}. Bạn chỉ có thể gán vai trò thấp hơn vai trò của mình.`,
      403
    );
  }

  return access;
}

/**
 * Get all board IDs that a user has access to (as owner or member)
 */
export async function getBoardIdsForUser(userSub: string): Promise<string[]> {
  // Get boards where user is owner
  const ownedBoards = await db
    .select({ id: boardsTable.id })
    .from(boardsTable)
    .where(eq(boardsTable.userId, userSub));

  // Get boards where user is a member
  const memberBoards = await db
    .select({ boardId: boardMembersTable.boardId })
    .from(boardMembersTable)
    .where(eq(boardMembersTable.userId, userSub));

  const boardIds = [
    ...ownedBoards.map(b => b.id),
    ...memberBoards.map(m => m.boardId),
  ];

  return [...new Set(boardIds)]; // Remove duplicates
}
