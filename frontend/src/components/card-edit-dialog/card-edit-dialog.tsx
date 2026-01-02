import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Card } from "@/types/card";
import { CardCoverModeValue } from "@/types/card";
import { X, Tag, CheckSquare, UserPlus, Paperclip, Clock, Wallpaper, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useUpdateCard } from "@/hooks/use-card";
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

interface CardEditDialogProps {
  card: Card | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete?: (cardId: string) => void;
}

export function CardEditDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
}: CardEditDialogProps) {
  const [showDetails, setShowDetails] = useState(true);
  const { uploadImage } = useUploadImage();

  if (!card) return null;

  const handleUploadImage = async (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }): Promise<string> => {
    const result = await uploadImage(options);
    return result.secure_url || "";
  };

  return (
    <BackgroundPickerProvider
      initialData={{
        color: card.coverColor,
        imageUrl: card.coverUrl,
        coverMode: card.coverMode,
      }}
    >
      <InnerDialog
        card={card}
        boardId={boardId}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
        uploadImage={handleUploadImage}
        showDetails={showDetails}
        setShowDetails={setShowDetails}
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
  onUpdate: (card: Card) => void;
  uploadImage: (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }) => Promise<string>;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}

function InnerDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  uploadImage,
  showDetails,
  setShowDetails,
}: InnerDialogProps) {
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const { mutate: updateCard } = useUpdateCard();
  const { deleteImage } = useDeleteImage();
  const { getBackgroundData, selectedColor, selectedFile, croppedFile } = useBackgroundPickerContext();

  // Get the effective image file (cropped or original)
  const imageFile = croppedFile || selectedFile;

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

  const handleUpdate = useCallback(
    (updates: Partial<Card>) => {
      if (!card) return;

      // Update local state immediately for optimistic UI
      onUpdate({ ...card, ...updates });

      // Sync with backend if boardId is available
      if (boardId) {
        updateCard({
          boardId,
          cardId: card.id,
          ...updates,
        });
      }
    },
    [card, boardId, onUpdate, updateCard]
  );

  const handleUpdateCover = async () => {
    // Get latest values from context
    const { color: currentColor, imageFile: currentImageFile } = getBackgroundData();

    if (!currentColor && !currentImageFile) {
      return;
    }

    try {
      if (currentImageFile) {
        // Create a temporary preview URL for optimistic update
        const tempPreviewUrl = URL.createObjectURL(currentImageFile);

        // Optimistically update the card with the preview URL immediately
        onUpdate({ ...card, coverUrl: tempPreviewUrl, coverColor: "" });

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
    } catch (error) {
      console.error("Error updating card cover:", error);
    }
  };

  const handleRemoveCover = async () => {
    // Optimistically update the card to remove cover immediately
    onUpdate({ ...card, coverColor: "", coverUrl: "", coverMode: CardCoverModeValue.NONE });

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

  const handleClose = async () => {
    // Get latest background data before closing
    const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();

    // Check if there are any cover changes to save
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
              <p className="text-sm text-muted-foreground">Uploading cover image...</p>
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
            className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full"
            style={{ minWidth: "500px" }}
          >
            {/* Header với checkbox và title */}
            <CardHeader card={card} onUpdate={handleUpdate} />

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              <CardLabels
                card={card}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isLabelPopoverOpen}
                onOpenChange={setIsLabelPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Tag className="h-4 w-4 mr-1" />
                    Nhãn
                  </Button>
                }
              />
              <CardMembers
                card={card}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isMemberPopoverOpen}
                onOpenChange={setIsMemberPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Thành viên
                  </Button>
                }
              />
              <CardDates
                card={card}
                onUpdate={handleUpdate}
                isOpen={isDatePopoverOpen}
                onOpenChange={setIsDatePopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Clock className="h-4 w-4 mr-1" />
                    Ngày hết hạn
                  </Button>
                }
              />
              <Button variant="outline" size="sm" className="h-8">
                <CheckSquare className="h-4 w-4 mr-1" />
                Việc cần làm
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Paperclip className="h-4 w-4 mr-1" />
                Đính kèm
              </Button>
            </div>

            {/* Labels display - only show if has labels */}
            {card.labels && card.labels.length > 0 && (
              <CardLabels card={card} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Members display - only show if has members */}
            {card.members && card.members.length > 0 && (
              <CardMembers card={card} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Description */}
            <CardDescription card={card} onUpdate={handleUpdate} />

            {/* CheckList */}
            <CheckList card={card} boardId={boardId} onUpdate={handleUpdate} />
          </div>

          {/* Right column - Comments and activity */}
          <div className="w-96 flex-shrink-0 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Nhận xét và hoạt động
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  Hiện chi tiết
                </Button>
              </div>

              {/* Comments section */}
              {showDetails && <CardComments card={card} onUpdate={handleUpdate} />}
            </div>
          </div>
        </div>
        {/* Cover picker dialog */}
        <Popover
          open={isCoverPickerOpen}
          onOpenChange={async (open) => {
            // When closing the popover, save any cover changes immediately
            if (!open) {
              setIsUploading(true);
              try {
                const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();
                if (latestColor || latestImageFile) {
                  await handleUpdateCover();
                }
              } finally {
                setIsUploading(false);
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
            <CardCoverPicker card={card} onRemoveCover={handleRemoveCover} />
          </PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>
  );
}
