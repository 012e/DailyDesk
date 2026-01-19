import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Card } from "@/types/card";
import { CardCoverModeValue } from "@/types/card";
import { X, Tag, UserPlus, Paperclip, Clock, Wallpaper, Loader2, FileIcon, ExternalLink, Download, ChevronDown, Repeat, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useUpdateCard, useCreateCard } from "@/hooks/use-card";
import { useAddComment } from "@/hooks/use-comments";
import { BackgroundPickerProvider } from "@/components/background-picker-provider";
import { CardCoverPicker } from "@/components/card-edit-dialog/card-cover-picker";
import { useUploadImage, useDeleteImage } from "@/hooks/use-image";
import { useBackgroundPickerContext } from "@/components/background-picker-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queryClient } from "@/lib/query-client";
import CheckList from "../check-list";
import { useUploadAttachment, useCreateAttachmentLink, useDeleteAttachment } from "@/hooks/use-attachment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Label as CardLabel, Member, Attachment } from "@/types/card";


// ... existing imports ...

// Inside InnerDialog
interface CardEditDialogProps {
  card?: Card | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
  onDelete?: (cardId: string) => void;
  // Props for create mode
  listId?: string;
  order?: number;
  onCreated?: (card: Card) => void;
  defaultIsTemplate?: boolean;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
}

export function CardEditDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  listId,
  order,
  onCreated,
  defaultIsTemplate,
  ownerInfo,
}: CardEditDialogProps) {
  const { uploadImage } = useUploadImage();

  const isCreateMode = !card;

  const handleUploadImage = async (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }): Promise<string> => {
    const result = await uploadImage(options);
    return result.secure_url || "";
  };

  // For create mode, use a temporary card object with default values
  const tempCard: Card = card || {
    id: "",
    title: "",
    description: "",
    listId: listId || "",
    position: order || 0,
    order: order || 0,
    labels: [],
    members: [],
    dueDate: new Date(), // Default to today's date
    coverUrl: "",
    coverColor: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    isTemplate: defaultIsTemplate,
  };

  return (
    <BackgroundPickerProvider
      initialData={{
        color: card?.coverColor,
        imageUrl: card?.coverUrl || undefined,
        coverMode: card?.coverMode,
      }}
    >
      <InnerDialog
        card={tempCard}
        boardId={boardId}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
        uploadImage={handleUploadImage}
        isCreateMode={isCreateMode}
        listId={listId}
        order={order}
        onCreated={onCreated}
        ownerInfo={ownerInfo}
      />
    </BackgroundPickerProvider>
  );
}

/* ================= INNER ================= */
interface InnerDialogProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
  uploadImage: (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }) => Promise<string>;
  // Create mode props
  isCreateMode?: boolean;
  listId?: string;
  order?: number;
  onCreated?: (card: Card) => void;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
}

function InnerDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  uploadImage,
  isCreateMode,
  listId,
  order,
  onCreated,
  ownerInfo,
}: InnerDialogProps) {
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isPillButtonDateOpen, setIsPillButtonDateOpen] = useState(false);
  const [isAttachmentPopoverOpen, setIsAttachmentPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showActivities, setShowActivities] = useState(true); // For comments/activities toggle

  // Create mode state - default title to "Untitled Card" for new cards
  // Handle both 'title' (frontend type) and 'name' (backend response) 
  const [title, setTitle] = useState(card.title || (card as any).name || "Untitled Card");
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<CardLabel[]>(card.labels || []);
  const [members, setMembers] = useState<Member[]>(card.members || []);
  
  // Date and Reminder State
  const [startDate, setStartDate] = useState<Date | undefined>(
    card.startDate ? new Date(card.startDate) : undefined
  );
  const [dueAt, setDueAt] = useState<Date | undefined>(
    card.dueAt ? new Date(card.dueAt) : (card.dueDate ? new Date(card.dueDate) : undefined)
  );
  const [dueComplete, setDueComplete] = useState(card.dueComplete || false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(card.reminderMinutes || null);
  const [repeatFrequency, setRepeatFrequency] = useState<"daily" | "weekly" | "monthly" | null>(card.repeatFrequency || null);
  const [repeatInterval, setRepeatInterval] = useState<number | null>(card.repeatInterval || null);

  const [isTemplate, setIsTemplate] = useState(card.isTemplate || false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Pending items for create mode
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [pendingComments, setPendingComments] = useState<string[]>([]);
  const { mutateAsync: addCommentAsync } = useAddComment();
  const { mutate: updateCard } = useUpdateCard();
  const { mutate: createCard, isPending: isCreatePending } = useCreateCard();
  const { deleteImage } = useDeleteImage();
  const uploadAttachmentMutation = useUploadAttachment();
  const createLinkMutation = useCreateAttachmentLink();
  const deleteAttachmentMutation = useDeleteAttachment();
  const { getBackgroundData, selectedColor, selectedFile, croppedFile, reset: resetBackground } = useBackgroundPickerContext();

  const imageFile = croppedFile || selectedFile;

  const formatDueDateVN = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const day = d.getDate();
    const monthNames = ["thg 1", "thg 2", "thg 3", "thg 4", "thg 5", "thg 6", "thg 7", "thg 8", "thg 9", "thg 10", "thg 11", "thg 12"];
    const month = monthNames[d.getMonth()];
    return `${hours}:${minutes} ${day} ${month}`;
  };

  /* ---------- PREVIEW IMAGE ---------- */
  const previewImageUrl = useMemo(() => {
    // If user selected a color, don't show image
    if (selectedColor) return null;
    // If user selected an image file, show it
    if (imageFile) return URL.createObjectURL(imageFile);
    // Otherwise show the current card cover image
    if (card.coverUrl) return card.coverUrl;
    return null;
  }, [imageFile, card.coverUrl, selectedColor]);

  useEffect(() => {
    return () => {
      if (previewImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const previewColor = useMemo(() => {
    // If user selected an image, don't show color
    if (imageFile) return null;
    // If user selected a color, show it
    if (selectedColor) return selectedColor;
    // Otherwise show the current card cover color (only if no image)
    if (!card.coverUrl && card.coverColor) return card.coverColor;
    return null;
  }, [imageFile, selectedColor, card.coverUrl, card.coverColor]);

  // Create a local card state for the UI (used in both modes)
  const localCard: Card = useMemo(() => {
    // Convert pending attachments to Attachment objects for preview
    const previewAttachments: Attachment[] = isCreateMode 
      ? pendingAttachments.map((file, index) => ({
          id: `pending-${index}`,
          name: file.name,
          url: URL.createObjectURL(file), // Create temporary URL for preview
          type: file.type,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: "me", // Placeholder
        }))
      : [];
    
    // Combine existing (if any) and pending attachments
    const displayedAttachments = isCreateMode 
      ? [...(card.attachments || []), ...previewAttachments] 
      : card.attachments;

    return {
      ...card,
      title: isCreateMode ? title : (card.title || (card as any).name || "Untitled Card"),
      description: isCreateMode ? description : card.description,
      labels: isCreateMode ? labels : card.labels,
      members: isCreateMode ? members : card.members,
      dueDate: isCreateMode ? dueAt : card.dueDate,
      startDate: isCreateMode ? startDate : card.startDate,
      dueAt: isCreateMode ? dueAt : card.dueAt,
      dueComplete: isCreateMode ? dueComplete : card.dueComplete,
      reminderMinutes: isCreateMode ? reminderMinutes : card.reminderMinutes,
      repeatFrequency: isCreateMode ? repeatFrequency : card.repeatFrequency,
      repeatInterval: isCreateMode ? repeatInterval : card.repeatInterval,
      isTemplate: isCreateMode ? isTemplate : card.isTemplate,
      attachments: displayedAttachments,
    };
  }, [card, isCreateMode, title, description, labels, members, dueAt, startDate, dueComplete, reminderMinutes, repeatFrequency, repeatInterval, isTemplate, pendingAttachments]);

  const handleUpdate = useCallback(
    (updates: Partial<Card>) => {
      if (isCreateMode) {
        // In create mode, just update local state
        if (updates.title !== undefined) setTitle(updates.title);
        if (updates.description !== undefined) setDescription(updates.description || "");
        if (updates.labels !== undefined) setLabels(updates.labels || []);
        if (updates.members !== undefined) setMembers(updates.members || []);
        
        // Handle Date Updates
        if (updates.startDate !== undefined) setStartDate(updates.startDate ? new Date(updates.startDate) : undefined);
        if (updates.dueAt !== undefined) setDueAt(updates.dueAt ? new Date(updates.dueAt) : undefined);
        // Map dueDate to dueAt if dueAt is missing but dueDate is present (compatibility)
        if (updates.dueDate !== undefined && updates.dueAt === undefined) setDueAt(updates.dueDate);
        
        if (updates.dueComplete !== undefined) setDueComplete(updates.dueComplete);
        if (updates.reminderMinutes !== undefined) setReminderMinutes(updates.reminderMinutes);
        if (updates.repeatFrequency !== undefined) setRepeatFrequency(updates.repeatFrequency);
        if (updates.repeatInterval !== undefined) setRepeatInterval(updates.repeatInterval);
        
        if (updates.isTemplate !== undefined) setIsTemplate(updates.isTemplate);
        return;
      }

      if (!card) return;

      // Update local state immediately for optimistic UI
      onUpdate?.({ ...card, ...updates });

      // Sync with backend if boardId is available
      if (boardId) {
        updateCard({
          boardId,
          cardId: card.id,
          ...updates,
        });
      }
    },
    [card, boardId, onUpdate, updateCard, isCreateMode]
  );

  const handleCreateCard = async () => {
    if (!listId) return;

    setIsCreating(true);

    // Use default name if no title provided
    const cardName = localCard.title?.trim() || "Untitled Card";

    try {
      // Get background data first
      const { color: coverColor, imageFile: currentImageFile } = getBackgroundData();
      
      // Create the card first
      createCard(
        {
          boardId,
          listId,
          name: cardName,
          order: order || 0,
          description: localCard.description || undefined,
          labels: localCard.labels && localCard.labels.length > 0 ? localCard.labels : undefined,
          members: localCard.members && localCard.members.length > 0 ? localCard.members : undefined,
          
          // Date fields
          deadline: localCard.dueAt ? new Date(localCard.dueAt) : undefined,
          startDate: localCard.startDate ? new Date(localCard.startDate).toISOString() : undefined,
          dueAt: localCard.dueAt ? new Date(localCard.dueAt).toISOString() : undefined,
          dueComplete: localCard.dueComplete,
          reminderMinutes: localCard.reminderMinutes,
          repeatFrequency: localCard.repeatFrequency,
          repeatInterval: localCard.repeatInterval,

          // Set cover color if provided (image covers are uploaded separately)
          coverColor: (!currentImageFile && coverColor) ? coverColor : undefined,
          isTemplate: localCard.isTemplate,
        },
        {
          onSuccess: async (newCard) => {
            if (!newCard) return;

            // If there's a cover image, upload it
            if (currentImageFile && newCard.id) {
              try {
                await uploadImage({
                  file: currentImageFile,
                  type: "card",
                  id: newCard.id,
                });
              } catch (error) {
                console.error("Error uploading card cover:", error);
              }
            }
            
            // Handle pending items in parallel
            const promises = [];

            // 1. Upload pending attachments
            if (pendingAttachments.length > 0) {
              const attachmentPromises = pendingAttachments.map(file => 
                uploadAttachmentMutation.mutateAsync({
                  file,
                  boardId,
                  cardId: newCard.id,
                })
              );
              promises.push(...attachmentPromises);
            }

            try {
              // Wait for attachments first
              await Promise.all(promises);

              // 2. Add pending comments sequentially
              if (pendingComments.length > 0) {
                for (const content of pendingComments) {
                   await addCommentAsync({
                      boardId,
                      cardId: newCard.id,
                      content
                   });
                }
              }
            } catch (error) {
               console.error("Error processing pending items:", error);
            }

            // Invalidate to refetch with the new cover (for both color and image covers)
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });

            // Reset form and close
            resetForm();
            onCreated?.(newCard as any);
            onClose();
          },
          onError: () => {
            setIsCreating(false);
          },
        }
      );
    } catch (error) {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("Untitled Card");
    setDescription("");
    setLabels([]);
    setMembers([]);
    
    // Reset dates
    setStartDate(undefined);
    setDueAt(new Date()); // Reset to today's date
    setDueComplete(false);
    setReminderMinutes(null);
    setRepeatFrequency(null);
    setRepeatInterval(null);

    setIsCreating(false);
    resetBackground();
    setPendingAttachments([]);
    setPendingComments([]);
  };

  const handleUpdateCover = async () => {
    const { color: currentColor, imageFile: currentImageFile } = getBackgroundData();

    if (!currentColor && !currentImageFile) {
      return;
    }

    try {
      if (currentImageFile) {
        // Create a temporary preview URL for optimistic update
        const tempPreviewUrl = URL.createObjectURL(currentImageFile);

        // Optimistically update the card with the preview URL immediately
        onUpdate?.({ ...card, coverUrl: tempPreviewUrl, coverColor: "" });

        // Upload the image in the background
        await uploadImage({
          file: currentImageFile,
          type: "card",
          id: card.id,
        });

        // Invalidate board query to get the real URL from the server
        queryClient.invalidateQueries({
          queryKey: ["board", boardId],
        });
      } else if (currentColor) {
        // Update local state and sync with backend
        // Clear coverUrl to null when setting color
        handleUpdate({ coverColor: currentColor, coverUrl: null });
      }
      
      // Reset background context after successful save to prevent duplicate updates
      resetBackground();
    } catch (error) {
      console.error("Error updating card cover:", error);
    }
  };

  const handleRemoveCover = async () => {
    // Optimistically update the card to remove cover immediately
    onUpdate?.({ ...card, coverColor: "", coverUrl: "", coverMode: CardCoverModeValue.NONE });

    // If the card has an existing image cover, delete it from the storage in background
    if (card.coverUrl) {
      try {
        await deleteImage("card", card.id);
        // Invalidate board query to refetch the updated data
        queryClient.invalidateQueries({
          queryKey: ["board", boardId],
        });
      } catch (error) {
        console.error("Error deleting card cover image:", error);
      }
    }
  };

  const handleAddAttachment = async (file: File) => {
    if (isCreateMode) {
      setPendingAttachments(prev => [...prev, file]);
      return;
    }
    if (boardId) {
      const newAttachment = await uploadAttachmentMutation.mutateAsync({
        file,
        boardId,
        cardId: card.id,
      });

      // Update local card state with new attachment
      if (newAttachment) {
        const updatedAttachments = [...(card.attachments || []), newAttachment];
        onUpdate?.({ ...card, attachments: updatedAttachments });
      }
    }
  };

  const handleAddLink = async () => {
    if (linkUrl.trim() && boardId) {
      const newAttachment = await createLinkMutation.mutateAsync({
        boardId,
        cardId: card.id,
        name: linkName.trim() || linkUrl.trim(),
        url: linkUrl.trim(),
        type: "link",
        size: 0,
      });

      // Update local card state with new attachment
      if (newAttachment) {
        const updatedAttachments = [...(card.attachments || []), newAttachment];
        onUpdate?.({ ...card, attachments: updatedAttachments });
      }

      setLinkUrl("");
      setLinkName("");
      setIsAttachmentPopoverOpen(false);
    }
  };

  const handleAttachmentFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleAddAttachment(file);
      event.target.value = "";
      setIsAttachmentPopoverOpen(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (boardId) {
      await deleteAttachmentMutation.mutateAsync({
        boardId,
        cardId: card.id,
        attachmentId,
      });

      // Update local card state by removing the attachment
      const updatedAttachments = (card.attachments || []).filter(
        (att) => att.id !== attachmentId
      );
      onUpdate?.({ ...card, attachments: updatedAttachments });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (url: string, type?: string): boolean => {
    if (type?.startsWith("image/")) return true;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || url;
    } catch {
      return url;
    }
  };

  const handleClose = async () => {
    if (isCreateMode) {
      // In create mode, just reset form and close
      resetForm();
      onClose();
      return;
    }

    // Get latest background data before closing
    const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();

    if (latestImageFile || latestColor) {
      setIsUploading(true);
      try {
        await handleUpdateCover();
      } finally {
        setIsUploading(false);
      }
    }
    // Close the dialog after save completes
    onClose();
  };

  const isSubmitting = isCreatePending || isCreating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="!flex !flex-col !p-0 !gap-0"
        style={{
          maxWidth: '1200px',
          width: '90vw',
          height: '600px',
          minHeight: '600px'
        }}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription>
            Edit card details, labels, members, and cover
          </DialogDescription>
        </VisuallyHidden>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Updating card...</p>
            </div>
          </div>
        )}
        {/* Top-right action buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {/* Edit cover button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCoverPickerOpen(true)}
          >
            <Wallpaper className="h-4 w-4" />
          </Button>

          {/* Close button */}
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cover preview */}
        {(previewImageUrl || previewColor) && (
          <div
            className="relative w-full h-40 shrink-0 group"
            style={{
              backgroundImage: previewImageUrl
                ? `url(${previewImageUrl})`
                : undefined,
              backgroundColor: previewColor ?? undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        )}
        {/* Main content area - Horizontal flex layout */}
        <div className="flex flex-row h-full w-full overflow-hidden">
          {/* Left column - Main content */}
          <div
            className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full overscroll-contain"
            style={{
              minWidth: "500px",
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch'
            } as React.CSSProperties}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header with title */}
            <CardHeader card={localCard} onUpdate={handleUpdate} />

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              <CardLabels
                card={localCard}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isLabelPopoverOpen}
                onOpenChange={setIsLabelPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Tag className="h-4 w-4 mr-1" />
                    Labels {card.labels && isCreateMode && card.labels.length > 0 && `(${card.labels.length})`}
                  </Button>
                }
              />
              <CardMembers
                card={localCard}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isMemberPopoverOpen}
                onOpenChange={setIsMemberPopoverOpen}
                ownerInfo={ownerInfo}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Members {card.members && isCreateMode && card.members.length > 0 && `(${card.members.length})`}
                  </Button>
                }
              />
              {!localCard.startDate && !localCard.dueAt && (
                <CardDates
                  card={localCard}
                  boardId={boardId}
                  onUpdate={handleUpdate}
                  isOpen={isDatePopoverOpen}
                  onOpenChange={setIsDatePopoverOpen}
                  triggerButton={
                    <Button variant="outline" size="sm" className="h-8">
                      <Clock className="h-4 w-4 mr-1" />
                      Dates
                    </Button>
                  }
                />
              )}
              <Popover open={isAttachmentPopoverOpen} onOpenChange={setIsAttachmentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attachment {localCard.attachments && localCard.attachments.length > 0 && `(${localCard.attachments.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Attach</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => attachmentFileInputRef.current?.click()}
                          disabled={uploadAttachmentMutation.isPending}
                        >
                          {uploadAttachmentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Paperclip className="h-4 w-4 mr-2" />
                              Computer
                            </>
                          )}
                        </Button>
                        <input
                          ref={attachmentFileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleAttachmentFileChange}
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor="attach-link-url" className="text-xs">
                          Or attach a link
                        </Label>
                        <Input
                          id="attach-link-url"
                          placeholder="Paste a link..."
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLink();
                          }}
                        />
                        <Input
                          placeholder="Link name (optional)"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLink();
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAttachmentPopoverOpen(false);
                              setLinkUrl("");
                              setLinkName("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddLink}
                            disabled={!linkUrl.trim() || createLinkMutation.isPending}
                          >
                            {createLinkMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Attaching...
                              </>
                            ) : (
                              "Attach"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Template Toggle */}
              <Button
                variant={localCard.isTemplate ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => handleUpdate({ isTemplate: !localCard.isTemplate })}
              >
                <LayoutTemplate className="h-4 w-4 mr-1" />
                {localCard.isTemplate ? "Template" : "Make template"}
              </Button>
            </div>

           

            {/* Labels display - only show if has labels */}
            {localCard.labels && localCard.labels.length > 0 && (
              <CardLabels card={localCard} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Members display - only show if has members */}
            {localCard.members && localCard.members.length > 0 && (
              <CardMembers card={localCard} onUpdate={handleUpdate} boardId={boardId || ""} ownerInfo={ownerInfo} />
            )}

            {(localCard.startDate || localCard.dueAt) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Dates</label>
                <div className="flex flex-wrap gap-2">
                  {localCard.startDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 flex items-center gap-2"
                      onClick={() => setIsPillButtonDateOpen(true)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm">Start: {formatDueDateVN(localCard.startDate)}</span>
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                  {localCard.dueAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 flex items-center gap-2"
                      onClick={() => setIsPillButtonDateOpen(true)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-sm">Due: {formatDueDateVN(localCard.dueAt)}</span>
                      {localCard.repeatFrequency && <Repeat className="h-3.5 w-3.5 opacity-70" />}
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
                <div className="hidden">
                   <CardDates
                      card={localCard}
                      boardId={boardId}
                      onUpdate={handleUpdate}
                      isOpen={isPillButtonDateOpen}
                      onOpenChange={setIsPillButtonDateOpen}
                      createMode={isCreateMode}
                      triggerButton={null} 
                    />
                </div>
              </div>
            )}


            {/* Description */}
            <CardDescription card={localCard} onUpdate={handleUpdate} />

            {/* CheckList */}
            <CheckList card={localCard} boardId={boardId} onUpdate={handleUpdate} ownerInfo={ownerInfo} />

            {/* Attachments */}
            {localCard.attachments && localCard.attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </h3>
                <div className="space-y-3">
                  {localCard.attachments.map((attachment) => {
                    const isImage = isImageFile(attachment.url, attachment.type);
                    const displayName = attachment.name || getFileName(attachment.url);

                    return (
                      <div key={attachment.id} className="flex gap-3 group">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="w-28 h-20 rounded border overflow-hidden bg-muted">
                              <img
                                src={attachment.url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-28 h-20 rounded border flex items-center justify-center bg-muted">
                              <FileIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                          >
                            {displayName}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {attachment.uploadedAt && (
                              <span>
                                Added {new Date(attachment.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                            {attachment.size > 0 && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(attachment.size)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleRemoveAttachment(attachment.id)}
                            >
                              Delete
                            </Button>
                            <a href={attachment.url} download={displayName}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Comments and activity */}
          <div
            className="w-96 flex-shrink-0 border-l bg-muted/30 p-12 overflow-y-auto overscroll-contain"
            style={{
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch'
            } as React.CSSProperties}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Comments and Activity
                </span>
              </div>

              {/* Comments section */}
              <CardComments
                card={localCard}
                boardId={boardId}
                showActivities={showActivities}
                onToggleActivities={() => setShowActivities(!showActivities)}
                isCreateMode={isCreateMode}
                pendingComments={pendingComments}
                onAddPendingComment={(comment) => setPendingComments(prev => [...prev, comment])}
              />

              {/* Footer with Create button for create mode */}
              {isCreateMode && (
                <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCard} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Card"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Cover picker dialog */}
        <Popover
          open={isCoverPickerOpen}
          onOpenChange={async (open) => {
            if (!open) {
              const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();
              if (latestColor || latestImageFile) {
                setIsUploading(true);
                try {
                  await handleUpdateCover();
                } finally {
                  setIsUploading(false);
                }
              }
            }
            setIsCoverPickerOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-12 z-20"
            >
              <Wallpaper className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="right"
            align="start"
            className="w-[400px] p-6 ml-2"
          >
            <CardCoverPicker card={localCard} onRemoveCover={handleRemoveCover} />
          </PopoverContent>
        </Popover>

        {(card.startDate || card.dueAt) && (
          <CardDates
            card={card}
            boardId={boardId}
            onUpdate={handleUpdate}
            isOpen={isPillButtonDateOpen}
            onOpenChange={setIsPillButtonDateOpen}
            triggerButton={null}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
