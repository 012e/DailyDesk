import db from "./src/lib/db";
import { boardMembersTable, boardsTable } from "./src/lib/db/schema";
import * as fs from "fs";

async function checkBoardMembers() {
  let output = "=== Checking board_members table ===\n\n";
  
  const members = await db.select().from(boardMembersTable);
  output += "All board members:\n";
  output += JSON.stringify(members, null, 2);
  output += `\n\nTotal members: ${members.length}\n`;

  output += "\n=== Checking boards table (with IDs) ===\n\n";
  const boards = await db.select().from(boardsTable);
  output += "All boards:\n";
  boards.forEach(b => {
    output += `- ID: ${b.id} | Name: ${b.name} | Owner: ${b.userId}\n`;
  });
  
  // Check if member's boardIds exist in boards
  output += "\n=== Cross-reference check ===\n\n";
  const boardIds = new Set(boards.map(b => b.id));
  members.forEach(m => {
    const exists = boardIds.has(m.boardId);
    output += `Member ${m.email} -> Board ${m.boardId} exists: ${exists}\n`;
  });
  
  fs.writeFileSync("db-check-output.txt", output);
  console.log("Output written to db-check-output.txt");
  
  process.exit(0);
}

checkBoardMembers().catch(console.error);
