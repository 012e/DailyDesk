import db from "@/lib/db";
import { boardMembersTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import getConfig from "@/lib/config";
import { ContentfulStatusCode } from "hono/utils/http-status";

export class MemberServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "MemberServiceError";
  }
}

interface Auth0User {
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  nickname?: string;
}

/**
 * Fetches user information from Auth0 Management API by user ID
 */
async function fetchAuth0UserById(userId: string): Promise<Auth0User | null> {
  const config = getConfig();

  if (!config.auth0Token) {
    throw new MemberServiceError("Auth0 Management API token not configured", 500);
  }

  try {
    const url = `https://${config.auth0Domain}/api/v2/users/${encodeURIComponent(userId)}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.auth0Token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Auth0 API error:", errorText);
      throw new MemberServiceError(`Auth0 API error: ${response.statusText}`, response.status as ContentfulStatusCode);
    }

    const user = await response.json() as any;
    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      nickname: user.nickname,
    };
  } catch (error) {
    if (error instanceof MemberServiceError) {
      throw error;
    }
    console.error("Error fetching user from Auth0:", error);
    throw new MemberServiceError("Failed to fetch user from Auth0", 500);
  }
}

export async function fetchAuth0UserInfo(userId: string): Promise<{
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
} | null> {
  try {
    const auth0User = await fetchAuth0UserById(userId);
    if (!auth0User) return null;
    const name =
      auth0User.name ||
      auth0User.nickname ||
      auth0User.email.split("@")[0];
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return {
      id: auth0User.user_id,
      name,
      email: auth0User.email,
      avatar: auth0User.picture || undefined,
      initials,
    };
  } catch (error) {
    console.error("Failed to fetch Auth0 user info:", error);
    return null;
  }
}

/**
 * Ensures a board member exists in the database. If the member doesn't exist,
 * fetches their information from Auth0 and inserts them into the board.
 * 
 * @param boardId - The ID of the board
 * @param userId - The Auth0 user ID
 * @param role - The role to assign if creating a new member (default: "member")
 * @returns The board member record (either existing or newly created)
 */
export async function ensureBoardMemberExists(
  boardId: string,
  userId: string,
  role: "member" | "admin" = "member"
): Promise<typeof boardMembersTable.$inferSelect> {
  // Check if member already exists
  const existingMember = await db
    .select()
    .from(boardMembersTable)
    .where(
      and(
        eq(boardMembersTable.boardId, boardId),
        eq(boardMembersTable.userId, userId)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    return existingMember[0];
  }

  // Member doesn't exist, fetch from Auth0
  console.log(`Member ${userId} not found in board ${boardId}, fetching from Auth0...`);
  
  const auth0User = await fetchAuth0UserById(userId);
  
  if (!auth0User) {
    throw new MemberServiceError(`User ${userId} not found in Auth0`, 404);
  }

  // Insert the new member
  const newMember = await db
    .insert(boardMembersTable)
    .values({
      id: randomUUID(),
      boardId,
      userId: auth0User.user_id,
      name: auth0User.name || auth0User.nickname || auth0User.email.split("@")[0],
      email: auth0User.email,
      avatar: auth0User.picture || null,
      role,
    })
    .returning();

  console.log(`✅ Created new board member: ${newMember[0].name} (${newMember[0].email})`);
  
  return newMember[0];
}

/**
 * Ensures multiple board members exist in the database. 
 * For each member that doesn't exist, fetches their information from Auth0 and inserts them.
 * 
 * @param boardId - The ID of the board
 * @param memberIds - Array of board member IDs to ensure exist
 * @returns Array of validated board member records
 */
export async function ensureBoardMembersExist(
  boardId: string,
  memberIds: string[]
): Promise<typeof boardMembersTable.$inferSelect[]> {
  if (memberIds.length === 0) {
    return [];
  }

  // Get all existing members
  const existingMembers = await db
    .select()
    .from(boardMembersTable)
    .where(eq(boardMembersTable.boardId, boardId));

  const existingMemberMap = new Map(
    existingMembers.map(m => [m.id, m])
  );

  const result: typeof boardMembersTable.$inferSelect[] = [];

  // Check each requested member
  for (const memberId of memberIds) {
    const existingMember = existingMemberMap.get(memberId);
    
    if (existingMember) {
      result.push(existingMember);
    } else {
      // Member ID provided doesn't exist in board_members table
      // This could mean the memberId is actually a userId from Auth0
      // Try to find by userId or create new member
      const memberByUserId = existingMembers.find(m => m.userId === memberId);
      
      if (memberByUserId) {
        result.push(memberByUserId);
      } else {
        // Treat memberId as userId and create new member
        try {
          const newMember = await ensureBoardMemberExists(boardId, memberId, "member");
          result.push(newMember);
          existingMemberMap.set(newMember.id, newMember);
        } catch (error) {
          console.error(`Failed to ensure member ${memberId} exists:`, error);
          // Don't throw, just skip this member
        }
      }
    }
  }

  return result;
}
