/**
 * Seed file for creating sample user data
 * 
 * Usage:
 *   pnpm tsx seed.ts --user-id <user_id>
 * 
 * If no user_id is provided, it defaults to a demo user ID.
 */

import db from "./src/lib/db";
import {
  boardsTable,
  listsTable,
  cardsTable,
  labelsTable,
  checklistItemsTable,
  boardMembersTable,
} from "./src/lib/db/schema";
import { randomUUID } from "crypto";

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArgIndex = args.indexOf("--user-id");
const userId = userIdArgIndex !== -1 ? args[userIdArgIndex + 1] : "user_demo_123456789";

// Simulated inviter ID
const INVITER_ID = `inviter_${randomUUID().substring(0, 8)}`;
const INVITER_NAME = "Admin User (Boss)";
const INVITER_EMAIL = "admin@dailydesk.demo";

console.log(`🌱 Starting seed for user: ${userId}`);
console.log(`👤 Using inviter: ${INVITER_NAME} (${INVITER_ID})`);

async function seed() {
  try {
    //
    // --- PART 1: OWNED BOARDS ---
    //

    // 1.1 "Project DailyDesk" Board
    console.log("Creating 'Project DailyDesk' board (Owned)...");
    const board1Id = randomUUID();
    await db.insert(boardsTable).values({
      id: board1Id,
      name: "Project DailyDesk",
      userId: userId,
      backgroundUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
      backgroundColor: "#0079bf",
    });

    const lists1 = [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Review", order: 2 },
      { name: "Done", order: 3 },
    ];

    const listIds1: string[] = [];
    for (const list of lists1) {
      const id = randomUUID();
      listIds1.push(id);
      await db.insert(listsTable).values({
        id,
        boardId: board1Id,
        name: list.name,
        order: list.order,
      });
    }

    // Cards for Board 1
    await db.insert(cardsTable).values([
      {
        id: randomUUID(),
        listId: listIds1[0],
        name: "Research competitor analysis",
        description: "Look into top 3 competitors and analyze their feature sets.",
        order: 0,
        completed: false,
      },
      {
        id: randomUUID(),
        listId: listIds1[0],
        name: "Draft Q3 Roadmap",
        description: "Outline key milestones for Q3.",
        order: 1,
        completed: false,
        deadline: new Date(Date.now() + 86400000 * 5),
      },
    ]);

    const cardInProgressId = randomUUID();
    await db.insert(cardsTable).values({
      id: cardInProgressId,
      listId: listIds1[1],
      name: "Implement Authentication",
      description: "Using Clerk for auth. Need to handle webhooks.",
      order: 0,
      completed: false,
      coverColor: "#e0e0e0",
      startDate: new Date(),
    });

    await db.insert(checklistItemsTable).values([
      { id: randomUUID(), cardId: cardInProgressId, name: "Setup Clerk provider", completed: true, order: 0 },
      { id: randomUUID(), cardId: cardInProgressId, name: "Create login page", completed: true, order: 1 },
      { id: randomUUID(), cardId: cardInProgressId, name: "Protect API routes", completed: false, order: 2 },
    ]);

    await db.insert(cardsTable).values({
      id: randomUUID(),
      listId: listIds1[3],
      name: "Initial Project Setup",
      order: 0,
      completed: true,
      dueComplete: true,
      dueAt: new Date(Date.now() - 86400000),
    });


    // 1.2 "Personal Life" Board
    console.log("Creating 'Personal Life' board (Owned)...");
    const board2Id = randomUUID();
    await db.insert(boardsTable).values({
      id: board2Id,
      name: "Personal Life",
      userId: userId,
      backgroundUrl: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&q=80",
    });

    const lists2 = [
      { name: "Grocery", order: 0 },
      { name: "Hobbies", order: 1 },
    ];

    const listIds2: string[] = [];
    for (const list of lists2) {
      const id = randomUUID();
      listIds2.push(id);
      await db.insert(listsTable).values({
        id,
        boardId: board2Id,
        name: list.name,
        order: list.order,
      });
    }

    await db.insert(cardsTable).values([
      { id: randomUUID(), listId: listIds2[0], name: "Milk", order: 0 },
      { id: randomUUID(), listId: listIds2[0], name: "Eggs", order: 1 },
      { id: randomUUID(), listId: listIds2[0], name: "Bread", order: 2 },
      { id: randomUUID(), listId: listIds2[1], name: "Learn Guitar", order: 0, description: "Practice for 30 mins daily" },
    ]);

    // 1.3 "Marketing Campaign" Board (New)
    console.log("Creating 'Marketing Campaign' board (Owned)...");
    const board3Id = randomUUID();
    await db.insert(boardsTable).values({
      id: board3Id,
      name: "Marketing Campaign Q1",
      userId: userId,
      backgroundUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80",
    });
    
    const lists3 = [{ name: "Ideas", order: 0 }, { name: "Content", order: 1 }, { name: "Published", order: 2 }];
     for (const list of lists3) {
      await db.insert(listsTable).values({
        id: randomUUID(),
        boardId: board3Id,
        name: list.name,
        order: list.order,
      });
    }


    //
    // --- PART 2: INVITED BOARDS ---
    //

    // 2.1 "Company Strategy" (Invited as Member)
    console.log("Creating 'Company Strategy' board (Invited)...");
    const invitedBoard1Id = randomUUID();
    await db.insert(boardsTable).values({
      id: invitedBoard1Id,
      name: "Company Strategy 2026",
      userId: INVITER_ID, // Owned by inviter
      backgroundUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    });

    // Add Inviter as admin
    await db.insert(boardMembersTable).values({
      id: randomUUID(),
      boardId: invitedBoard1Id,
      userId: INVITER_ID,
      name: INVITER_NAME,
      email: INVITER_EMAIL,
      role: "admin",
    });

    // Add User as member
    await db.insert(boardMembersTable).values({
      id: randomUUID(),
      boardId: invitedBoard1Id,
      userId: userId,
      name: "You", // Placeholder name
      email: "you@dailydesk.demo", // Placeholder email
      role: "member",
    });

    const listsInv1 = [{ name: "Goals", order: 0 }, { name: "KPIs", order: 1 }];
    for (const list of listsInv1) {
       await db.insert(listsTable).values({
        id: randomUUID(),
        boardId: invitedBoard1Id,
        name: list.name,
        order: list.order,
      });
    }

    // 2.2 "Team Retreat" (Invited as Admin)
    console.log("Creating 'Team Retreat' board (Invited)...");
    const invitedBoard2Id = randomUUID();
    await db.insert(boardsTable).values({
      id: invitedBoard2Id,
      name: "Team Retreat Planning",
      userId: INVITER_ID,
      backgroundUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    });

    await db.insert(boardMembersTable).values({
      id: randomUUID(),
      boardId: invitedBoard2Id,
      userId: INVITER_ID,
      name: INVITER_NAME,
      email: INVITER_EMAIL,
      role: "admin",
    });

    await db.insert(boardMembersTable).values({
      id: randomUUID(),
      boardId: invitedBoard2Id,
      userId: userId,
      name: "You",
      email: "you@dailydesk.demo",
      role: "admin", // You are also an admin here
    });

     const listsInv2 = [{ name: "Venue", order: 0 }, { name: "Activities", order: 1 }];
    for (const list of listsInv2) {
       await db.insert(listsTable).values({
        id: randomUUID(),
        boardId: invitedBoard2Id,
        name: list.name,
        order: list.order,
      });
    }


    // 3. Create Labels (User specific)
    const labels = [
      { name: "Urgent", color: "#ef4444" },
      { name: "Doc", color: "#3b82f6" },
      { name: "Bug", color: "#eab308" },
      { name: "Design", color: "#ec4899" },
    ];

    for (const label of labels) {
      try {
         await db.insert(labelsTable).values({
          id: randomUUID(),
          userId: userId,
          name: label.name,
          color: label.color,
         }).onConflictDoNothing();
      } catch (e) {
        // ignore unique constraint errors
      }
    }

    console.log("✅ Seed completed successfully!");
    console.log(`User ID used: ${userId}`);
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
