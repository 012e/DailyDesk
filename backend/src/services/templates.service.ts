import db from "@/lib/db";
import {
  boardTemplatesTable,
  templateListsTable,
  templateCardsTable,
  templateLabelsTable,
  boardsTable,
  listsTable,
  cardsTable,
  cardLabelsTable,
  labelsTable,
} from "@/lib/db/schema";
import { eq, asc, or, and, isNull } from "drizzle-orm";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { randomUUID } from "crypto";
import { publishBoardChanged } from "./events.service";

export class ServiceError extends Error {
  status: ContentfulStatusCode;

  constructor(message: string, status: ContentfulStatusCode = 400) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

/**
 * Get all templates available to a user (system templates + their own templates + public templates)
 */
export async function getTemplates(userSub: string, category?: string) {
  let whereCondition;
  
  if (category) {
    // Get templates by category: system templates, user's own, or public
    whereCondition = and(
      eq(boardTemplatesTable.category, category),
      or(
        isNull(boardTemplatesTable.userId), // System templates
        eq(boardTemplatesTable.userId, userSub), // User's own templates
        eq(boardTemplatesTable.isPublic, true) // Public templates
      )
    );
  } else {
    // Get all templates: system templates, user's own, or public
    whereCondition = or(
      isNull(boardTemplatesTable.userId), // System templates
      eq(boardTemplatesTable.userId, userSub), // User's own templates
      eq(boardTemplatesTable.isPublic, true) // Public templates
    );
  }

  const templates = await db.query.boardTemplatesTable.findMany({
    where: whereCondition,
    orderBy: asc(boardTemplatesTable.name),
  });

  return templates;
}

/**
 * Get a specific template with all its details (lists, cards, labels)
 */
export async function getTemplateById(userSub: string, templateId: string) {
  const template = await db.query.boardTemplatesTable.findFirst({
    where: eq(boardTemplatesTable.id, templateId),
    with: {
      lists: {
        orderBy: asc(templateListsTable.order),
        with: {
          cards: {
            orderBy: asc(templateCardsTable.order),
          },
        },
      },
      labels: true,
    },
  });

  if (!template) {
    throw new ServiceError("Template not found", 404);
  }

  // Check access: system templates (no userId), user's own templates, or public templates
  const hasAccess =
    !template.userId || // System template
    template.userId === userSub || // User's own template
    template.isPublic; // Public template

  if (!hasAccess) {
    throw new ServiceError("You don't have access to this template", 403);
  }

  return template;
}

/**
 * Create a new board template
 */
export async function createTemplate(userSub: string, data: any) {
  const templateId = randomUUID();

  // Insert the template
  const [template] = await db
    .insert(boardTemplatesTable)
    .values({
      id: templateId,
      name: data.name,
      description: data.description,
      category: data.category,
      userId: userSub,
      isPublic: data.isPublic ?? false,
      backgroundUrl: data.backgroundUrl,
      backgroundColor: data.backgroundColor,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Insert lists
  if (data.lists && data.lists.length > 0) {
    const listsToInsert = data.lists.map((list: any) => ({
      id: randomUUID(),
      templateId: templateId,
      name: list.name,
      order: list.order,
    }));

    const insertedLists = await db
      .insert(templateListsTable)
      .values(listsToInsert)
      .returning();

    // Insert cards for each list
    const cardsToInsert: any[] = [];
    for (let i = 0; i < data.lists.length; i++) {
      const list = data.lists[i];
      const insertedList = insertedLists[i];

      if (list.cards && list.cards.length > 0) {
        list.cards.forEach((card: any) => {
          cardsToInsert.push({
            id: randomUUID(),
            templateListId: insertedList.id,
            name: card.name,
            description: card.description,
            order: card.order,
          });
        });
      }
    }

    if (cardsToInsert.length > 0) {
      await db.insert(templateCardsTable).values(cardsToInsert);
    }
  }

  // Insert labels
  if (data.labels && data.labels.length > 0) {
    const labelsToInsert = data.labels.map((label: any) => ({
      id: randomUUID(),
      templateId: templateId,
      name: label.name,
      color: label.color,
    }));

    await db.insert(templateLabelsTable).values(labelsToInsert);
  }

  return await getTemplateById(userSub, templateId);
}

/**
 * Update a template (only the owner can update)
 */
export async function updateTemplate(userSub: string, templateId: string, data: any) {
  const template = await db
    .select()
    .from(boardTemplatesTable)
    .where(eq(boardTemplatesTable.id, templateId))
    .limit(1);

  if (template.length === 0) {
    throw new ServiceError("Template not found", 404);
  }

  // Only the owner can update (system templates can't be updated)
  if (template[0].userId !== userSub) {
    throw new ServiceError("Only the template owner can update it", 403);
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
  if (data.backgroundUrl !== undefined) updateData.backgroundUrl = data.backgroundUrl;
  if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor;

  const [updatedTemplate] = await db
    .update(boardTemplatesTable)
    .set(updateData)
    .where(eq(boardTemplatesTable.id, templateId))
    .returning();

  return updatedTemplate;
}

/**
 * Delete a template (only the owner can delete)
 */
export async function deleteTemplate(userSub: string, templateId: string) {
  const template = await db
    .select()
    .from(boardTemplatesTable)
    .where(eq(boardTemplatesTable.id, templateId))
    .limit(1);

  if (template.length === 0) {
    throw new ServiceError("Template not found", 404);
  }

  // Only the owner can delete (system templates can't be deleted)
  if (template[0].userId !== userSub) {
    throw new ServiceError("Only the template owner can delete it", 403);
  }

  await db.delete(boardTemplatesTable).where(eq(boardTemplatesTable.id, templateId));

  return { message: "Template deleted successfully" };
}

/**
 * Create a board from a template
 */
export async function createBoardFromTemplate(
  userSub: string,
  templateId: string,
  boardName: string,
  includeCards: boolean = true
) {
  // Get the template with all details
  const template = await getTemplateById(userSub, templateId);

  // Create the board
  const boardId = randomUUID();
  const [board] = await db
    .insert(boardsTable)
    .values({
      id: boardId,
      name: boardName,
      userId: userSub,
      backgroundUrl: template.backgroundUrl,
      backgroundColor: template.backgroundColor,
    })
    .returning();

  // Copy labels first (so we can reference them later if needed)
  const labelMapping = new Map<string, string>(); // old label ID -> new label ID
  if (template.labels && template.labels.length > 0) {
    const existingLabels = await db
      .select({
        id: labelsTable.id,
        name: labelsTable.name,
        color: labelsTable.color,
      })
      .from(labelsTable)
      .where(eq(labelsTable.userId, userSub));
    const existingByKey = new Map(
      existingLabels.map(label => [`${label.name}::${label.color}`, label.id])
    );

    const labelsToInsert = [];
    for (const label of template.labels) {
      const key = `${label.name}::${label.color}`;
      const existingId = existingByKey.get(key);
      if (existingId) {
        labelMapping.set(label.id, existingId);
        continue;
      }
      const newLabelId = randomUUID();
      labelMapping.set(label.id, newLabelId);
      labelsToInsert.push({
        id: newLabelId,
        userId: userSub,
        name: label.name,
        color: label.color,
      });
    }

    if (labelsToInsert.length > 0) {
      await db.insert(labelsTable).values(labelsToInsert);
    }
  }

  // Copy lists
  if (template.lists && template.lists.length > 0) {
    const listsToInsert = template.lists.map((list: any) => ({
      id: randomUUID(),
      boardId: boardId,
      name: list.name,
      order: list.order,
    }));

    const insertedLists = await db.insert(listsTable).values(listsToInsert).returning();

    // Copy cards if requested
    if (includeCards) {
      const cardsToInsert: any[] = [];
      for (let i = 0; i < template.lists.length; i++) {
        const templateList = template.lists[i];
        const insertedList = insertedLists[i];

        if (templateList.cards && templateList.cards.length > 0) {
          templateList.cards.forEach((card: any) => {
            cardsToInsert.push({
              id: randomUUID(),
              listId: insertedList.id,
              name: card.name,
              description: card.description,
              order: card.order,
            });
          });
        }
      }

      if (cardsToInsert.length > 0) {
        await db.insert(cardsTable).values(cardsToInsert);
      }
    }
  }

  // Publish board created event
  publishBoardChanged(boardId, "board", boardId, "created", userSub);

  return board;
}

/**
 * Save an existing board as a template
 */
export async function saveBoardAsTemplate(
  userSub: string,
  boardId: string,
  templateName: string,
  templateDescription?: string,
  category?: string,
  isPublic: boolean = false
) {
  // Check if user has access to the board
  const board = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId))
    .limit(1);

  if (board.length === 0) {
    throw new ServiceError("Board not found", 404);
  }

  // Only the owner can save as template
  if (board[0].userId !== userSub) {
    throw new ServiceError("Only the board owner can save it as a template", 403);
  }

  // Get board lists
  const lists = await db
    .select()
    .from(listsTable)
    .where(eq(listsTable.boardId, boardId))
    .orderBy(asc(listsTable.order));

  // Get board labels
  const boardLabels = await db
    .select({
      id: labelsTable.id,
      name: labelsTable.name,
      color: labelsTable.color,
    })
    .from(cardLabelsTable)
    .innerJoin(cardsTable, eq(cardLabelsTable.cardId, cardsTable.id))
    .innerJoin(listsTable, eq(cardsTable.listId, listsTable.id))
    .innerJoin(labelsTable, eq(cardLabelsTable.labelId, labelsTable.id))
    .where(eq(listsTable.boardId, boardId))
    .groupBy(labelsTable.id, labelsTable.name, labelsTable.color);

  // Create template
  const templateId = randomUUID();
  const [template] = await db
    .insert(boardTemplatesTable)
    .values({
      id: templateId,
      name: templateName,
      description: templateDescription,
      category: category,
      userId: userSub,
      isPublic: isPublic,
      backgroundUrl: board[0].backgroundUrl,
      backgroundColor: board[0].backgroundColor,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Copy lists
  if (lists.length > 0) {
    const listsToInsert = lists.map((list: any) => ({
      id: randomUUID(),
      templateId: templateId,
      name: list.name,
      order: list.order,
    }));

    await db.insert(templateListsTable).values(listsToInsert);
  }

  // Copy labels
  if (boardLabels.length > 0) {
    const labelsToInsert = boardLabels.map((label: any) => ({
      id: randomUUID(),
      templateId: templateId,
      name: label.name,
      color: label.color,
    }));

    await db.insert(templateLabelsTable).values(labelsToInsert);
  }

  return await getTemplateById(userSub, templateId);
}
