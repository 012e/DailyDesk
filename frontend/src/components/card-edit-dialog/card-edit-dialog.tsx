import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Card } from "@/types/card";
import { CardCoverModeValue } from "@/types/card";
import { Wallpaper, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { useEffect, useMemo, useState } from "react";
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

  const { deleteImage } = useDeleteImage();
  const { getBackgroundData } = useBackgroundPickerContext();
  const { color, imageFile } = getBackgroundData();

  /* ---------- PREVIEW IMAGE ---------- */
  const previewImageUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (card.coverUrl) return card.coverUrl;
    return null;
  }, [imageFile, card.coverUrl]);

  useEffect(() => {
    return () => {
      if (previewImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const previewColor =
    !imageFile && color
      ? color
      : !imageFile && !card.coverUrl
      ? card.coverUrl
      : null;

  const handleUpdate = (updates: Partial<Card>) => {
    onUpdate({ ...card, ...updates });
  };

  const handleUpdateCover = async () => {
    if (!color && !imageFile) {
      return;
    }

    try {
      if (imageFile) {
        // Create a temporary preview URL for optimistic update
        const tempPreviewUrl = URL.createObjectURL(imageFile);
        
        // Optimistically update the card with the preview URL immediately
        onUpdate({ ...card, coverUrl: tempPreviewUrl, coverColor: "" });
        
        // Upload the image in the background
        await uploadImage({
          file: imageFile,
          type: "card",
          id: card.id,
        });
        
        // Invalidate board query to get the real URL from the server
        queryClient.invalidateQueries({
          queryKey: ["board", boardId],
        });
      } else if (color) {
        onUpdate({ ...card, coverColor: color, coverUrl: "" });
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
    // If there's a new image to upload, show loading and wait for upload
    if (imageFile) {
      setIsUploading(true);
      try {
        await handleUpdateCover();
      } finally {
        setIsUploading(false);
      }
    } else {
      // For color changes, just update immediately
      handleUpdateCover();
    }
    // Close the dialog after upload completes
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="!flex !flex-col max-w-[1200px] w-[95vw] h-[90vh] p-0 gap-0"
        showCloseButton={false}
      >
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

            {/* Labels */}
            <CardLabels card={card} onUpdate={handleUpdate} />

            {/* Members */}
            <CardMembers card={card} onUpdate={handleUpdate} />

            {/* Dates */}
            <CardDates card={card} onUpdate={handleUpdate} />

            {/* Description */}
            <CardDescription card={card} onUpdate={handleUpdate} />
          </div>

          {/* Right column - Comments and activity */}
          <div className="w-80 flex-shrink-0 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Comments and activity
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </Button>
              </div>

              {/* Comments section */}
              <CardComments card={card} onUpdate={handleUpdate} />
            </div>
          </div>
        </div>
        {/* Cover picker dialog */}
        <Popover>
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
