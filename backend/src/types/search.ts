import { z } from "@hono/zod-openapi";

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(1).openapi({ description: "Từ khóa tìm kiếm" }),
  types: z
    .preprocess(
      (val) => {
        // Handle single value or array
        if (typeof val === "string") {
          return [val];
        }
        return val;
      },
      z.array(z.enum(["board", "card", "list", "comment", "label", "checklist"]))
    )
    .optional()
    .openapi({
      description:
        "Các loại đối tượng cần tìm kiếm. Nếu không chỉ định sẽ tìm tất cả",
    }),
  boardId: z
    .string()
    .optional()
    .openapi({
      description: "ID của board để giới hạn phạm vi tìm kiếm",
    }),
  limit: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(20)
    .openapi({ description: "Số lượng kết quả tối đa mỗi loại" }),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// Search result item schemas
export const boardSearchResultSchema = z.object({
  type: z.literal("board"),
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isFavorite: z.boolean(),
  background: z.string().nullable(),
  createdAt: z.string(),
});

export const cardSearchResultSchema = z.object({
  type: z.literal("card"),
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  boardId: z.string(),
  boardName: z.string(),
  listId: z.string(),
  listName: z.string(),
  position: z.number(),
  dueDate: z.string().nullable(),
  isCompleted: z.boolean(),
  labels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
  ),
});

export const listSearchResultSchema = z.object({
  type: z.literal("list"),
  id: z.string(),
  name: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  position: z.number(),
  cardCount: z.number(),
});

export const commentSearchResultSchema = z.object({
  type: z.literal("comment"),
  id: z.string(),
  content: z.string(),
  cardId: z.string(),
  cardTitle: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  authorId: z.string(),
  authorName: z.string().nullable(),
  authorAvatar: z.string().nullable(),
  createdAt: z.string(),
});

export const labelSearchResultSchema = z.object({
  type: z.literal("label"),
  id: z.string(),
  name: z.string(),
  color: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  cardCount: z.number(),
});

export const checklistSearchResultSchema = z.object({
  type: z.literal("checklist"),
  id: z.string(),
  text: z.string(),
  isChecked: z.boolean(),
  cardId: z.string(),
  cardTitle: z.string(),
  boardId: z.string(),
  boardName: z.string(),
});

// Union of all search result types
export const searchResultSchema = z.discriminatedUnion("type", [
  boardSearchResultSchema,
  cardSearchResultSchema,
  listSearchResultSchema,
  commentSearchResultSchema,
  labelSearchResultSchema,
  checklistSearchResultSchema,
]);

export type SearchResult = z.infer<typeof searchResultSchema>;

// Search response schema
export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  total: z.number(),
  query: z.string(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
