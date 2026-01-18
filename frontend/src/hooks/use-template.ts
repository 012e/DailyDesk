import * as z from "zod";
import { api } from "@/lib/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

// Template Schemas
export const TemplateLabelSchema = z.object({
  name: z.string().nonempty(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const TemplateCardSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().optional(),
  order: z.number().int(),
});

export const TemplateListSchema = z.object({
  name: z.string().nonempty(),
  order: z.number().int(),
  cards: z.array(TemplateCardSchema).optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().nonempty().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z
    .enum(["business", "education", "personal", "design", "marketing", "engineering", "other"])
    .optional(),
  isPublic: z.boolean().default(false),
  backgroundUrl: z.string().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  lists: z.array(TemplateListSchema),
  labels: z.array(TemplateLabelSchema).optional(),
});

export type CreateTemplateType = z.infer<typeof CreateTemplateSchema>;
export type TemplateLabelType = z.infer<typeof TemplateLabelSchema>;
export type TemplateListType = z.infer<typeof TemplateListSchema>;

// Hook to get all templates
export function useTemplates(category?: string) {
  const { data } = useSuspenseQuery({
    queryKey: category ? ["templates", category] : ["templates"],
    queryFn: async () => {
      const { data, error } = await api.GET("/templates", {
        params: {
          query: category ? { category } : undefined,
        },
      });
      if (error) throw new Error("Failed to fetch templates");
      return data || [];
    },
  });

  return data;
}

// Hook to get template by ID
export function useTemplate(templateId: string) {
  const { data } = useSuspenseQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const { data, error } = await api.GET("/templates/{id}", {
        params: {
          path: { id: templateId },
        },
      });
      if (error) throw new Error("Failed to fetch template");
      return data;
    },
  });

  return data;
}

// Hook to create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  const createTemplate = async (template: CreateTemplateType) => {
    const { data, error } = await api.POST("/templates", {
      body: template,
    });
    
    if (error) {
      throw new Error("Failed to create template");
    }
    
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    return data;
  };

  return {
    createTemplate,
  };
}

// Hook to create board from template
export function useCreateBoardFromTemplate() {
  const queryClient = useQueryClient();

  const createBoardFromTemplate = async (
    templateId: string,
    boardName: string,
    includeCards: boolean = true
  ) => {
    const { data, error } = await api.POST("/templates/{id}/create-board", {
      params: {
        path: { id: templateId },
      },
      body: {
        boardName,
        includeCards,
      },
    });

    if (error) {
      throw new Error("Failed to create board from template");
    }

    queryClient.invalidateQueries({ queryKey: ["boards"] });
    return data;
  };

  return {
    createBoardFromTemplate,
  };
}

// Hook to save board as template
export function useSaveBoardAsTemplate() {
  const queryClient = useQueryClient();

  const saveBoardAsTemplate = async (
    boardId: string,
    templateName: string,
    templateDescription?: string,
    category?: "business" | "education" | "personal" | "design" | "marketing" | "engineering" | "other",
    isPublic: boolean = false
  ) => {
    const { data, error } = await api.POST("/templates/from-board/{boardId}", {
      params: {
        path: { boardId },
      },
      body: {
        templateName,
        templateDescription,
        category,
        isPublic,
      },
    });

    if (error) {
      throw new Error("Failed to save board as template");
    }

    queryClient.invalidateQueries({ queryKey: ["templates"] });
    return data;
  };

  return {
    saveBoardAsTemplate,
  };
}

// Hook to delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  const deleteTemplate = async (templateId: string) => {
    const { data, error } = await api.DELETE("/templates/{id}", {
      params: {
        path: { id: templateId },
      },
    });

    if (error) {
      throw new Error("Failed to delete template");
    }

    queryClient.invalidateQueries({ queryKey: ["templates"] });
    return data;
  };

  return {
    deleteTemplate,
  };
}
