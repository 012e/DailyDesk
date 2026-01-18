import z from "zod";

// Hex color validation regex
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// Template Label Schema
export const TemplateLabelSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  color: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  templateId: z.uuid(),
});

// Template Card Schema
export const TemplateCardSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  order: z.number().int(),
  templateListId: z.uuid(),
});

// Template List Schema
export const TemplateListSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  order: z.number().int(),
  templateId: z.uuid(),
});

// Template List with Cards Schema
export const TemplateListWithCardsSchema = TemplateListSchema.extend({
  cards: z.array(TemplateCardSchema).optional(),
});

// Board Template Schema
export const BoardTemplateSchema = z.object({
  id: z.uuid(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  category: z.string().optional(),
  userId: z.string().optional(), // null for system templates
  isPublic: z.boolean().default(false),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().regex(hexColorRegex).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Board Template with Details (lists, cards, labels)
export const BoardTemplateWithDetailsSchema = BoardTemplateSchema.extend({
  lists: z.array(TemplateListWithCardsSchema),
  labels: z.array(TemplateLabelSchema).optional(),
});

// Create Template Schema
export const CreateBoardTemplateSchema = z.object({
  name: z.string().nonempty().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z
    .enum(["business", "education", "personal", "design", "marketing", "engineering", "other"])
    .optional(),
  isPublic: z.boolean().default(false),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().regex(hexColorRegex).optional(),
  lists: z.array(
    z.object({
      name: z.string().nonempty(),
      order: z.number().int(),
      cards: z
        .array(
          z.object({
            name: z.string().nonempty(),
            description: z.string().optional(),
            order: z.number().int(),
          })
        )
        .optional(),
    })
  ),
  labels: z
    .array(
      z.object({
        name: z.string().nonempty(),
        color: z.string().regex(hexColorRegex),
      })
    )
    .optional(),
});

// Update Template Schema
export const UpdateBoardTemplateSchema = z.object({
  name: z.string().nonempty().optional(),
  description: z.string().nullable().optional(),
  category: z
    .enum(["business", "education", "personal", "design", "marketing", "engineering", "other"])
    .nullable()
    .optional(),
  isPublic: z.boolean().optional(),
  backgroundUrl: z.string().nullable().optional(),
  backgroundColor: z.string().regex(hexColorRegex).nullable().optional(),
});

// Create Board from Template Schema
export const CreateBoardFromTemplateSchema = z.object({
  templateId: z.uuid(),
  boardName: z.string().nonempty().min(1, "Board name is required"),
  includeCards: z.boolean().default(true), // Whether to copy sample cards
});

// Export types
export type BoardTemplate = z.infer<typeof BoardTemplateSchema>;
export type BoardTemplateWithDetails = z.infer<typeof BoardTemplateWithDetailsSchema>;
export type CreateBoardTemplate = z.infer<typeof CreateBoardTemplateSchema>;
export type UpdateBoardTemplate = z.infer<typeof UpdateBoardTemplateSchema>;
export type CreateBoardFromTemplate = z.infer<typeof CreateBoardFromTemplateSchema>;
export type TemplateLabel = z.infer<typeof TemplateLabelSchema>;
export type TemplateList = z.infer<typeof TemplateListSchema>;
export type TemplateListWithCards = z.infer<typeof TemplateListWithCardsSchema>;
export type TemplateCard = z.infer<typeof TemplateCardSchema>;
