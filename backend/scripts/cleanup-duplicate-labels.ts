import db from "../src/lib/db";
import { labelsTable, cardLabelsTable } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";

async function cleanupDuplicateLabels() {
  console.log("🔍 Finding duplicate labels...");

  // Find all labels grouped by userId, name, and color
  const duplicates = await db
    .select({
      userId: labelsTable.userId,
      name: labelsTable.name,
      color: labelsTable.color,
      ids: sql<string>`GROUP_CONCAT(${labelsTable.id})`.as('ids'),
      count: sql<number>`COUNT(*)`.as('count')
    })
    .from(labelsTable)
    .groupBy(labelsTable.userId, labelsTable.name, labelsTable.color)
    .having(sql`COUNT(*) > 1`);

  console.log(`Found ${duplicates.length} duplicate label groups`);

  for (const dup of duplicates) {
    const ids = dup.ids.split(',');
    const keepId = ids[0]; // Keep the first one
    const deleteIds = ids.slice(1); // Delete the rest

    console.log(`\n📝 Label: "${dup.name}" (${dup.color}) - User: ${dup.userId}`);
    console.log(`   Keeping: ${keepId}`);
    console.log(`   Deleting: ${deleteIds.join(', ')}`);

    // Update card_labels to point to the kept label
    for (const deleteId of deleteIds) {
      await db
        .update(cardLabelsTable)
        .set({ labelId: keepId })
        .where(sql`${cardLabelsTable.labelId} = ${deleteId}`);
    }

    // Delete duplicate labels
    for (const deleteId of deleteIds) {
      await db
        .delete(labelsTable)
        .where(sql`${labelsTable.id} = ${deleteId}`);
    }
  }

  console.log("\n✅ Cleanup complete!");
  console.log(`Removed ${duplicates.reduce((sum, d) => sum + (d.count - 1), 0)} duplicate labels`);
}

cleanupDuplicateLabels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
