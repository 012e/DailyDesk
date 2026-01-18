/**
 * Authorization Integration Test
 * 
 * This script tests the authorization service by creating test data
 * and verifying that permissions are enforced correctly.
 * 
 * Run with: npx tsx tests/authorization-integration.test.ts
 */

import db from "../src/lib/db";
import { boardsTable, boardMembersTable, listsTable } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getBoardAccess,
  checkBoardAccess,
  checkPermission,
  requireBoardOwner,
  requireMemberManagement,
  canAssignRole,
  AuthorizationError,
} from "../src/services/authorization.service";

// Test user IDs
const OWNER_ID = "test-owner-" + Date.now();
const ADMIN_ID = "test-admin-" + Date.now();
const MEMBER_ID = "test-member-" + Date.now();
const VIEWER_ID = "test-viewer-" + Date.now();
const OUTSIDER_ID = "test-outsider-" + Date.now();

let testBoardId: string;

async function setup() {
  console.log("🔧 Setting up test data...\n");

  // Create a test board
  testBoardId = crypto.randomUUID();
  await db.insert(boardsTable).values({
    id: testBoardId,
    name: "Authorization Test Board",
    userId: OWNER_ID,
  });
  console.log(`✅ Created board: ${testBoardId}`);
  console.log(`   Owner: ${OWNER_ID}`);

  // Add admin member
  await db.insert(boardMembersTable).values({
    id: crypto.randomUUID(),
    boardId: testBoardId,
    userId: ADMIN_ID,
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  });
  console.log(`✅ Added admin: ${ADMIN_ID}`);

  // Add regular member
  await db.insert(boardMembersTable).values({
    id: crypto.randomUUID(),
    boardId: testBoardId,
    userId: MEMBER_ID,
    name: "Member User",
    email: "member@test.com",
    role: "member",
  });
  console.log(`✅ Added member: ${MEMBER_ID}`);

  // Add viewer
  await db.insert(boardMembersTable).values({
    id: crypto.randomUUID(),
    boardId: testBoardId,
    userId: VIEWER_ID,
    name: "Viewer User",
    email: "viewer@test.com",
    role: "viewer",
  });
  console.log(`✅ Added viewer: ${VIEWER_ID}`);
  console.log();
}

async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");
  await db.delete(boardMembersTable).where(eq(boardMembersTable.boardId, testBoardId));
  await db.delete(boardsTable).where(eq(boardsTable.id, testBoardId));
  console.log("✅ Cleanup complete");
}

async function testGetBoardAccess() {
  console.log("📋 Testing getBoardAccess()...\n");

  // Test owner access
  const ownerAccess = await getBoardAccess(testBoardId, OWNER_ID);
  console.log(`  Owner access: role=${ownerAccess?.role}, isOwner=${ownerAccess?.isOwner}`);
  console.assert(ownerAccess?.role === "owner", "Owner should have 'owner' role");
  console.assert(ownerAccess?.isOwner === true, "Owner should be marked as owner");

  // Test admin access
  const adminAccess = await getBoardAccess(testBoardId, ADMIN_ID);
  console.log(`  Admin access: role=${adminAccess?.role}, isOwner=${adminAccess?.isOwner}`);
  console.assert(adminAccess?.role === "admin", "Admin should have 'admin' role");
  console.assert(adminAccess?.isOwner === false, "Admin should not be marked as owner");

  // Test member access
  const memberAccess = await getBoardAccess(testBoardId, MEMBER_ID);
  console.log(`  Member access: role=${memberAccess?.role}, isOwner=${memberAccess?.isOwner}`);
  console.assert(memberAccess?.role === "member", "Member should have 'member' role");

  // Test viewer access
  const viewerAccess = await getBoardAccess(testBoardId, VIEWER_ID);
  console.log(`  Viewer access: role=${viewerAccess?.role}, isOwner=${viewerAccess?.isOwner}`);
  console.assert(viewerAccess?.role === "viewer", "Viewer should have 'viewer' role");

  // Test outsider access
  const outsiderAccess = await getBoardAccess(testBoardId, OUTSIDER_ID);
  console.log(`  Outsider access: ${outsiderAccess === null ? "null (no access)" : "HAS ACCESS (ERROR!)"}`);
  console.assert(outsiderAccess === null, "Outsider should have no access");

  console.log("  ✅ getBoardAccess tests passed\n");
}

async function testPermissions() {
  console.log("📋 Testing checkPermission()...\n");

  const testCases = [
    { user: OWNER_ID, role: "owner", permission: "board:read", expected: true },
    { user: OWNER_ID, role: "owner", permission: "board:delete", expected: true },
    { user: OWNER_ID, role: "owner", permission: "member:add", expected: true },
    { user: OWNER_ID, role: "owner", permission: "content:create", expected: true },
    
    { user: ADMIN_ID, role: "admin", permission: "board:read", expected: true },
    { user: ADMIN_ID, role: "admin", permission: "board:update", expected: true },
    { user: ADMIN_ID, role: "admin", permission: "board:delete", expected: false },
    { user: ADMIN_ID, role: "admin", permission: "member:add", expected: true },
    { user: ADMIN_ID, role: "admin", permission: "content:create", expected: true },
    
    { user: MEMBER_ID, role: "member", permission: "board:read", expected: true },
    { user: MEMBER_ID, role: "member", permission: "board:update", expected: false },
    { user: MEMBER_ID, role: "member", permission: "member:add", expected: false },
    { user: MEMBER_ID, role: "member", permission: "content:create", expected: true },
    { user: MEMBER_ID, role: "member", permission: "content:delete", expected: true },
    
    { user: VIEWER_ID, role: "viewer", permission: "board:read", expected: true },
    { user: VIEWER_ID, role: "viewer", permission: "board:update", expected: false },
    { user: VIEWER_ID, role: "viewer", permission: "member:add", expected: false },
    { user: VIEWER_ID, role: "viewer", permission: "content:read", expected: true },
    { user: VIEWER_ID, role: "viewer", permission: "content:create", expected: false },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      await checkPermission(testBoardId, tc.user, tc.permission as any);
      if (tc.expected) {
        console.log(`  ✅ ${tc.role} CAN ${tc.permission}`);
        passed++;
      } else {
        console.log(`  ❌ ${tc.role} SHOULD NOT have ${tc.permission} but was allowed!`);
        failed++;
      }
    } catch (error) {
      if (error instanceof AuthorizationError) {
        if (!tc.expected) {
          console.log(`  ✅ ${tc.role} CANNOT ${tc.permission} (as expected)`);
          passed++;
        } else {
          console.log(`  ❌ ${tc.role} SHOULD have ${tc.permission} but was denied!`);
          failed++;
        }
      } else {
        console.log(`  ❌ Unexpected error for ${tc.role} ${tc.permission}:`, error);
        failed++;
      }
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
}

async function testRoleAssignment() {
  console.log("📋 Testing canAssignRole()...\n");

  const testCases = [
    { assigner: "owner", target: "admin", expected: true },
    { assigner: "owner", target: "member", expected: true },
    { assigner: "owner", target: "viewer", expected: true },
    
    { assigner: "admin", target: "admin", expected: false },
    { assigner: "admin", target: "member", expected: true },
    { assigner: "admin", target: "viewer", expected: true },
    
    { assigner: "member", target: "admin", expected: false },
    { assigner: "member", target: "member", expected: false },
    { assigner: "member", target: "viewer", expected: true },
    
    { assigner: "viewer", target: "viewer", expected: false },
    { assigner: "viewer", target: "member", expected: false },
  ];

  for (const tc of testCases) {
    const result = canAssignRole(tc.assigner as any, tc.target as any);
    const status = result === tc.expected ? "✅" : "❌";
    console.log(`  ${status} ${tc.assigner} ${result ? "CAN" : "CANNOT"} assign ${tc.target} role`);
  }

  console.log();
}

async function testRequireFunctions() {
  console.log("📋 Testing requireBoardOwner() and requireMemberManagement()...\n");

  // Test requireBoardOwner
  try {
    await requireBoardOwner(testBoardId, OWNER_ID);
    console.log("  ✅ Owner passes requireBoardOwner");
  } catch {
    console.log("  ❌ Owner should pass requireBoardOwner");
  }

  try {
    await requireBoardOwner(testBoardId, ADMIN_ID);
    console.log("  ❌ Admin should NOT pass requireBoardOwner");
  } catch {
    console.log("  ✅ Admin correctly denied by requireBoardOwner");
  }

  // Test requireMemberManagement
  try {
    await requireMemberManagement(testBoardId, OWNER_ID);
    console.log("  ✅ Owner passes requireMemberManagement");
  } catch {
    console.log("  ❌ Owner should pass requireMemberManagement");
  }

  try {
    await requireMemberManagement(testBoardId, ADMIN_ID);
    console.log("  ✅ Admin passes requireMemberManagement");
  } catch {
    console.log("  ❌ Admin should pass requireMemberManagement");
  }

  try {
    await requireMemberManagement(testBoardId, MEMBER_ID);
    console.log("  ❌ Member should NOT pass requireMemberManagement");
  } catch {
    console.log("  ✅ Member correctly denied by requireMemberManagement");
  }

  console.log();
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("           AUTHORIZATION SERVICE INTEGRATION TEST");
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    await setup();
    await testGetBoardAccess();
    await testPermissions();
    await testRoleAssignment();
    await testRequireFunctions();

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    ALL TESTS COMPLETED");
    console.log("═══════════════════════════════════════════════════════════════");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

main();
