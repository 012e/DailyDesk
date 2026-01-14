/**
 * Seed file for creating default board templates
 * 
 * This script creates system templates that all users can use.
 * Run this script once to populate your database with useful templates.
 * 
 * Usage:
 *   pnpm tsx seed-templates.ts
 */

import db from "./src/lib/db";
import {
  boardTemplatesTable,
  templateListsTable,
  templateCardsTable,
  templateLabelsTable,
} from "./src/lib/db/schema";
import { randomUUID } from "crypto";

const defaultTemplates = [
  {
    name: "Kanban Board",
    description: "Classic Kanban workflow for managing tasks",
    category: "business",
    lists: [
      { name: "Backlog", order: 0 },
      { name: "To Do", order: 1 },
      { name: "In Progress", order: 2 },
      { name: "Review", order: 3 },
      { name: "Done", order: 4 },
    ],
    labels: [
      { name: "Bug", color: "#eb5a46" },
      { name: "Feature", color: "#61bd4f" },
      { name: "Enhancement", color: "#00c2e0" },
      { name: "Documentation", color: "#c377e0" },
      { name: "Urgent", color: "#ff9f1a" },
    ],
    backgroundColor: "#0079bf",
  },
  {
    name: "Sprint Planning",
    description: "Agile sprint planning and tracking",
    category: "engineering",
    lists: [
      { name: "Sprint Backlog", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Code Review", order: 2 },
      { name: "Testing", order: 3 },
      { name: "Completed", order: 4 },
    ],
    labels: [
      { name: "Frontend", color: "#61bd4f" },
      { name: "Backend", color: "#00c2e0" },
      { name: "Database", color: "#c377e0" },
      { name: "Critical", color: "#eb5a46" },
      { name: "Nice to Have", color: "#ff9f1a" },
    ],
    backgroundColor: "#519839",
  },
  {
    name: "Project Management",
    description: "Comprehensive project planning and execution",
    category: "business",
    lists: [
      { name: "Planning", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "On Hold", order: 2 },
      { name: "Review", order: 3 },
      { name: "Completed", order: 4 },
    ],
    labels: [
      { name: "High Priority", color: "#eb5a46" },
      { name: "Medium Priority", color: "#ff9f1a" },
      { name: "Low Priority", color: "#61bd4f" },
      { name: "Blocked", color: "#344563" },
      { name: "Research", color: "#c377e0" },
    ],
    backgroundColor: "#d29034",
  },
  {
    name: "Content Calendar",
    description: "Plan and organize content creation",
    category: "marketing",
    lists: [
      { name: "Ideas", order: 0 },
      { name: "Writing", order: 1 },
      { name: "Editing", order: 2 },
      { name: "Scheduled", order: 3 },
      { name: "Published", order: 4 },
    ],
    labels: [
      { name: "Blog Post", color: "#61bd4f" },
      { name: "Social Media", color: "#00c2e0" },
      { name: "Video", color: "#eb5a46" },
      { name: "Newsletter", color: "#c377e0" },
      { name: "SEO", color: "#ff9f1a" },
    ],
    backgroundColor: "#cd5a91",
  },
  {
    name: "Personal To-Do",
    description: "Simple personal task management",
    category: "personal",
    lists: [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "Done", order: 2 },
    ],
    labels: [
      { name: "Important", color: "#eb5a46" },
      { name: "Work", color: "#00c2e0" },
      { name: "Personal", color: "#61bd4f" },
      { name: "Shopping", color: "#ff9f1a" },
      { name: "Health", color: "#c377e0" },
    ],
    backgroundColor: "#89609e",
  },
  {
    name: "Design Project",
    description: "Creative design workflow",
    category: "design",
    lists: [
      { name: "Concepts", order: 0 },
      { name: "Wireframes", order: 1 },
      { name: "Design", order: 2 },
      { name: "Review", order: 3 },
      { name: "Approved", order: 4 },
    ],
    labels: [
      { name: "UI Design", color: "#61bd4f" },
      { name: "UX Design", color: "#00c2e0" },
      { name: "Branding", color: "#c377e0" },
      { name: "Prototype", color: "#ff9f1a" },
      { name: "Feedback", color: "#eb5a46" },
    ],
    backgroundColor: "#00c2e0",
  },
  {
    name: "Course Planning",
    description: "Organize educational content and lessons",
    category: "education",
    lists: [
      { name: "Module Planning", order: 0 },
      { name: "Content Creation", order: 1 },
      { name: "Review", order: 2 },
      { name: "Ready to Publish", order: 3 },
      { name: "Live", order: 4 },
    ],
    labels: [
      { name: "Video Lesson", color: "#eb5a46" },
      { name: "Reading Material", color: "#61bd4f" },
      { name: "Quiz", color: "#00c2e0" },
      { name: "Assignment", color: "#ff9f1a" },
      { name: "Discussion", color: "#c377e0" },
    ],
    backgroundColor: "#b04632",
  },
  {
    name: "Event Planning",
    description: "Plan and coordinate events",
    category: "business",
    lists: [
      { name: "Ideas & Concepts", order: 0 },
      { name: "Planning", order: 1 },
      { name: "Vendors & Partners", order: 2 },
      { name: "In Progress", order: 3 },
      { name: "Completed", order: 4 },
    ],
    labels: [
      { name: "Venue", color: "#61bd4f" },
      { name: "Catering", color: "#ff9f1a" },
      { name: "Marketing", color: "#00c2e0" },
      { name: "Speakers", color: "#c377e0" },
      { name: "Urgent", color: "#eb5a46" },
    ],
    backgroundColor: "#51e898",
  },
];

async function seedTemplates() {
  console.log("🌱 Starting template seeding...");

  try {
    for (const template of defaultTemplates) {
      console.log(`Creating template: ${template.name}`);

      const templateId = randomUUID();

      // Insert template
      await db.insert(boardTemplatesTable).values({
        id: templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        userId: null, // System template
        isPublic: true,
        backgroundColor: template.backgroundColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Insert lists
      const listsToInsert = template.lists.map((list) => ({
        id: randomUUID(),
        templateId: templateId,
        name: list.name,
        order: list.order,
      }));
      await db.insert(templateListsTable).values(listsToInsert);

      // Insert labels
      if (template.labels) {
        const labelsToInsert = template.labels.map((label) => ({
          id: randomUUID(),
          templateId: templateId,
          name: label.name,
          color: label.color,
        }));
        await db.insert(templateLabelsTable).values(labelsToInsert);
      }

      console.log(`✓ Created: ${template.name}`);
    }

    console.log("✅ All templates seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedTemplates()
  .then(() => {
    console.log("🎉 Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
