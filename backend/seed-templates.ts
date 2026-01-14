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
    cards: [
      { listName: "Backlog", title: "Research new tools", order: 0, description: "Investigate tools for improving team productivity" },
      { listName: "To Do", title: "Update documentation", order: 0, description: "Revise user guide with latest features" },
      { listName: "To Do", title: "Schedule team meeting", order: 1, description: "Plan Q1 objectives discussion" },
      { listName: "In Progress", title: "Implement user feedback", order: 0, description: "Address top 5 feature requests" },
      { listName: "Review", title: "Code review for PR #123", order: 0, description: "Review authentication module updates" },
      { listName: "Done", title: "Deploy v2.1", order: 0, description: "Successfully deployed to production" },
    ],
    labels: [
      { name: "Bug", color: "#eb5a46" },
      { name: "Feature", color: "#61bd4f" },
      { name: "Enhancement", color: "#00c2e0" },
      { name: "Documentation", color: "#c377e0" },
      { name: "Urgent", color: "#ff9f1a" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
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
    cards: [
      { listName: "Sprint Backlog", title: "API endpoint for user profiles", order: 0, description: "Create REST API for user profile management" },
      { listName: "Sprint Backlog", title: "Fix responsive layout issues", order: 1, description: "Mobile view needs adjustment on smaller screens" },
      { listName: "In Progress", title: "Implement authentication", order: 0, description: "Add JWT-based authentication system" },
      { listName: "Code Review", title: "Database migration script", order: 0, description: "Review schema changes for v2.0" },
      { listName: "Testing", title: "Integration tests for payment", order: 0, description: "Test payment gateway integration" },
      { listName: "Completed", title: "Setup CI/CD pipeline", order: 0, description: "Automated deployment configured" },
    ],
    labels: [
      { name: "Frontend", color: "#61bd4f" },
      { name: "Backend", color: "#00c2e0" },
      { name: "Database", color: "#c377e0" },
      { name: "Critical", color: "#eb5a46" },
      { name: "Nice to Have", color: "#ff9f1a" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
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
    cards: [
      { listName: "Planning", title: "Q1 Marketing Campaign", order: 0, description: "Plan social media and email marketing strategy" },
      { listName: "Planning", title: "Budget allocation", order: 1, description: "Allocate resources for Q1 projects" },
      { listName: "In Progress", title: "Website redesign", order: 0, description: "New homepage and navigation structure" },
      { listName: "In Progress", title: "Hire new developers", order: 1, description: "Interview and onboard 2 senior developers" },
      { listName: "Review", title: "Customer feedback analysis", order: 0, description: "Analyze Q4 customer satisfaction surveys" },
      { listName: "Completed", title: "Product launch event", order: 0, description: "Successfully launched product v3.0" },
    ],
    labels: [
      { name: "High Priority", color: "#eb5a46" },
      { name: "Medium Priority", color: "#ff9f1a" },
      { name: "Low Priority", color: "#61bd4f" },
      { name: "Blocked", color: "#344563" },
      { name: "Research", color: "#c377e0" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
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
    cards: [
      { listName: "Ideas", title: "10 Tips for Remote Work", order: 0, description: "Blog post idea about productivity" },
      { listName: "Ideas", title: "Customer success story", order: 1, description: "Interview with top client" },
      { listName: "Writing", title: "Product announcement", order: 0, description: "Draft blog post for new feature launch" },
      { listName: "Editing", title: "SEO guide for beginners", order: 0, description: "Final review before publishing" },
      { listName: "Scheduled", title: "Weekly newsletter #24", order: 0, description: "Scheduled for Monday 9 AM" },
      { listName: "Published", title: "Year in review 2025", order: 0, description: "Posted on Dec 31, 2025" },
    ],
    labels: [
      { name: "Blog Post", color: "#61bd4f" },
      { name: "Social Media", color: "#00c2e0" },
      { name: "Video", color: "#eb5a46" },
      { name: "Newsletter", color: "#c377e0" },
      { name: "SEO", color: "#ff9f1a" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&q=80",
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
    cards: [
      { listName: "To Do", title: "Buy groceries", order: 0, description: "Milk, eggs, bread, vegetables" },
      { listName: "To Do", title: "Schedule dentist appointment", order: 1, description: "Need to book cleaning appointment" },
      { listName: "To Do", title: "Pay utility bills", order: 2, description: "Electric and water bills due this week" },
      { listName: "In Progress", title: "Plan vacation", order: 0, description: "Research hotels and activities" },
      { listName: "Done", title: "Morning workout", order: 0, description: "30 minutes cardio completed" },
      { listName: "Done", title: "Call mom", order: 1, description: "Weekend catch-up call" },
    ],
    labels: [
      { name: "Important", color: "#eb5a46" },
      { name: "Work", color: "#00c2e0" },
      { name: "Personal", color: "#61bd4f" },
      { name: "Shopping", color: "#ff9f1a" },
      { name: "Health", color: "#c377e0" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80",
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
    cards: [
      { listName: "Concepts", title: "Mobile app icon ideas", order: 0, description: "Brainstorm 5 different icon concepts" },
      { listName: "Concepts", title: "Brand color palette", order: 1, description: "Research color psychology for fintech" },
      { listName: "Wireframes", title: "Dashboard layout", order: 0, description: "Low-fidelity wireframes for admin dashboard" },
      { listName: "Design", title: "Landing page mockup", order: 0, description: "High-fidelity design for homepage" },
      { listName: "Review", title: "User onboarding flow", order: 0, description: "Review with stakeholders" },
      { listName: "Approved", title: "Logo redesign", order: 0, description: "New logo approved for implementation" },
    ],
    labels: [
      { name: "UI Design", color: "#61bd4f" },
      { name: "UX Design", color: "#00c2e0" },
      { name: "Branding", color: "#c377e0" },
      { name: "Prototype", color: "#ff9f1a" },
      { name: "Feedback", color: "#eb5a46" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
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
    cards: [
      { listName: "Module Planning", title: "Introduction to Python", order: 0, description: "Outline for beginner Python module" },
      { listName: "Module Planning", title: "Advanced Data Structures", order: 1, description: "Plan lessons on trees and graphs" },
      { listName: "Content Creation", title: "Variables and Data Types", order: 0, description: "Record video lesson and create slides" },
      { listName: "Review", title: "Functions and Scope quiz", order: 0, description: "Review quiz questions for accuracy" },
      { listName: "Ready to Publish", title: "Object-Oriented Programming", order: 0, description: "Final checks before going live" },
      { listName: "Live", title: "Getting Started with Python", order: 0, description: "Module 1 is now available to students" },
    ],
    labels: [
      { name: "Video Lesson", color: "#eb5a46" },
      { name: "Reading Material", color: "#61bd4f" },
      { name: "Quiz", color: "#00c2e0" },
      { name: "Assignment", color: "#ff9f1a" },
      { name: "Discussion", color: "#c377e0" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
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
    cards: [
      { listName: "Ideas & Concepts", title: "Annual company retreat", order: 0, description: "Team building event for 50 people" },
      { listName: "Planning", title: "Conference venue selection", order: 0, description: "Compare 3 venue options" },
      { listName: "Planning", title: "Create event timeline", order: 1, description: "Hour-by-hour schedule for event day" },
      { listName: "Vendors & Partners", title: "Book keynote speaker", order: 0, description: "Confirm availability and contract" },
      { listName: "In Progress", title: "Send invitations", order: 0, description: "Email and social media announcements" },
      { listName: "Completed", title: "Secure event insurance", order: 0, description: "Liability coverage obtained" },
    ],
    labels: [
      { name: "Venue", color: "#61bd4f" },
      { name: "Catering", color: "#ff9f1a" },
      { name: "Marketing", color: "#00c2e0" },
      { name: "Speakers", color: "#c377e0" },
      { name: "Urgent", color: "#eb5a46" },
    ],
    backgroundUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
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
        backgroundUrl: template.backgroundUrl,
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

      // Insert cards
      if (template.cards) {
        const cardsToInsert = template.cards.map((card) => {
          const list = listsToInsert.find((l) => l.name === card.listName);
          return {
            id: randomUUID(),
            name: card.title,
            description: card.description,
            order: card.order,
            templateListId: list!.id,
          };
        });
        await db.insert(templateCardsTable).values(cardsToInsert);
      }

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
