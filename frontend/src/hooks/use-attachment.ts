import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useUploadConfig } from "@/hooks/use-image";

type UploadAttachmentInput = {
  file: File;
  boardId: string;
  cardId: string;
};

type CreateAttachmentInput = {
  boardId: string;
  cardId: string;
  name: string;
  url: string;
  publicId?: string;
  type: string;
  size: number;
};

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const { cloudName, uploadPreset } = useUploadConfig();

  return useMutation({
    mutationFn: async ({ file, boardId, cardId }: UploadAttachmentInput) => {
      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary config not loaded");
      }

      const folder = `schedule_management/attachments`;
      const form = new FormData();
      form.append("upload_preset", uploadPreset);
      form.append("folder", folder);
      form.append("file", file);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload to Cloudinary");
      }

      const uploadData = await uploadRes.json();

      const { data, error } = await api.POST(
        "/boards/{boardId}/cards/{cardId}/attachments",
        {
          params: {
            path: {
              boardId,
              cardId,
            },
          },
          body: {
            name: file.name,
            url: uploadData.secure_url,
            publicId: uploadData.public_id,
            type: file.type || "application/octet-stream",
            size: file.size,
          },
        }
      );

      if (error) {
        throw new Error("Failed to create attachment");
      }

      console.log("[UPLOAD ATTACHMENT] Backend response:", data);
      return data;
    },

    onSuccess: async (data, variables) => {
      console.log("[UPLOAD ATTACHMENT] Success, refetching board query:", variables.boardId);
      console.log("[UPLOAD ATTACHMENT] Attachment data:", data);
      // Use refetchQueries to force immediate refetch instead of just invalidating
      await queryClient.refetchQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to upload attachment:", err);
    },
  });
}

export function useCreateAttachmentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAttachmentInput) => {
      const { data, error } = await api.POST(
        "/boards/{boardId}/cards/{cardId}/attachments",
        {
          params: {
            path: {
              boardId: params.boardId,
              cardId: params.cardId,
            },
          },
          body: {
            name: params.name,
            url: params.url,
            publicId: params.publicId,
            type: params.type,
            size: params.size,
          },
        }
      );

      if (error) {
        throw new Error("Failed to create attachment");
      }

      return data;
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to create attachment:", err);
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      boardId: string;
      cardId: string;
      attachmentId: string;
    }) => {
      const { error } = await api.DELETE(
        "/boards/{boardId}/cards/{cardId}/attachments/{id}",
        {
          params: {
            path: {
              boardId: params.boardId,
              cardId: params.cardId,
              id: params.attachmentId,
            },
          },
        }
      );

      if (error) {
        throw new Error("Failed to delete attachment");
      }
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
    },

    onError: (err) => {
      console.error("Failed to delete attachment:", err);
    },
  });
}
