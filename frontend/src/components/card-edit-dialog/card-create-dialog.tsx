import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Card, Label, Member } from "@/types/card";
import { X, Tag, UserPlus, Clock, Save, Wallpaper, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardLabels } from "./card-labels";
import { CardMembers } from "./card-members";
import { CardDates } from "./card-dates";
import { CardRecurrence } from "./card-recurrence";
import { useState, useCallback, useMemo } from "react";
import { useCreateCard } from "@/hooks/use-card";
import { BackgroundPickerProvider, useBackgroundPickerContext } from "@/components/background-picker-provider";
import { BackgroundPicker } from "@/components/background-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUploadImage } from "@/hooks/use-image";
import { queryClient } from "@/lib/query-client";

interface CardCreateDialogProps {
  boardId: string;
  listId: string;
  order: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CardCreateDialog(props: CardCreateDialogProps) {
  return (
    <BackgroundPickerProvider initialData={{}}>
      <InnerCardCreateDialog {...props} />
    </BackgroundPickerProvider>
  );
}

function InnerCardCreateDialog({
  boardId,
  listId,
  order,
  isOpen,
  onClose,
  onCreated,
}: CardCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isCoverPopoverOpen, setIsCoverPopoverOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { mutate: createCard, isPending } = useCreateCard();
  const { uploadImage } = useUploadImage();
  const { selectedColor, selectedFile, croppedFile, reset: resetBackground, getBackgroundData } = useBackgroundPickerContext();

  // Get the effective image file (cropped or original)
  const imageFile = croppedFile || selectedFile;

  // Preview for cover
  const previewImageUrl = useMemo(() => {
    if (selectedColor) return null;
    if (imageFile) return URL.createObjectURL(imageFile);
    return null;
  }, [imageFile, selectedColor]);

  const previewColor = useMemo(() => {
    if (imageFile) return null;
    if (selectedColor) return selectedColor;
    return null;
  }, [imageFile, selectedColor]);

  const hasCover = previewColor || previewImageUrl;

  // Create a temporary card object for the sub-components
  const tempCard: Card = {
    id: "",
    title: title,
    description: description,
    listId: listId,
    position: order,
    order: order,
    labels: labels,
    members: members,
    dueDate: deadline,
    coverUrl: "",
    coverColor: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleUpdate = useCallback((updates: Partial<Card>) => {
    if (updates.labels !== undefined) {
      setLabels(updates.labels || []);
    }
    if (updates.members !== undefined) {
      setMembers(updates.members || []);
    }
    if (updates.dueDate !== undefined) {
      setDeadline(updates.dueDate);
    }
    if (updates.description !== undefined) {
      setDescription(updates.description || "");
    }
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);

    try {
      // Create the card first
      createCard(
        {
          boardId,
          listId,
          name: title.trim(),
          order,
          description: description || undefined,
          labels: labels.length > 0 ? labels : undefined,
          members: members.length > 0 ? members : undefined,
          deadline: deadline,
        },
        {
          onSuccess: async (newCard) => {
            // If there's a cover image, upload it
            const { imageFile: currentImageFile } = getBackgroundData();
            
            if (currentImageFile && newCard?.id) {
              try {
                await uploadImage({
                  file: currentImageFile,
                  type: "card",
                  id: newCard.id,
                });
                // Invalidate to refetch with the new cover
                queryClient.invalidateQueries({ queryKey: ["board", boardId] });
              } catch (error) {
                console.error("Error uploading card cover:", error);
              }
            }

            // Reset form
            resetForm();
            onCreated?.();
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
    setTitle("");
    setDescription("");
    setLabels([]);
    setMembers([]);
    setDeadline(undefined);
    setIsCreating(false);
    resetBackground();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isSubmitting = isPending || isCreating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="!flex !flex-col !p-0 !gap-0"
        style={{
          maxWidth: '900px',
          width: '80vw',
          height: hasCover ? '600px' : '500px',
          minHeight: '400px'
        }}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Create Card</DialogTitle>
          <DialogDescription>
            Create a new card with title, description, labels, members, due date, and cover
          </DialogDescription>
        </VisuallyHidden>

        {/* Top-right action buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cover preview */}
        {hasCover && (
          <div
            className="relative w-full h-32 shrink-0"
            style={{
              backgroundImage: previewImageUrl
                ? `url(${previewImageUrl})`
                : undefined,
              backgroundColor: previewColor ?? undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        {/* Main content area */}
        <div className="flex flex-col h-full w-full overflow-hidden p-6 gap-4 overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Card Title *</label>
            <Input
              autoFocus
              placeholder="Enter card title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            <CardLabels
              card={tempCard}
              onUpdate={handleUpdate}
              boardId={boardId}
              isOpen={isLabelPopoverOpen}
              onOpenChange={setIsLabelPopoverOpen}
              triggerButton={
                <Button variant="outline" size="sm" className="h-8">
                  <Tag className="h-4 w-4 mr-1" />
                  Labels {labels.length > 0 && `(${labels.length})`}
                </Button>
              }
            />
            <CardMembers
              card={tempCard}
              onUpdate={handleUpdate}
              boardId={boardId}
              isOpen={isMemberPopoverOpen}
              onOpenChange={setIsMemberPopoverOpen}
              triggerButton={
                <Button variant="outline" size="sm" className="h-8">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Members {members.length > 0 && `(${members.length})`}
                </Button>
              }
            />
            <CardDates
              card={tempCard}
              onUpdate={handleUpdate}
              isOpen={isDatePopoverOpen}
              onOpenChange={setIsDatePopoverOpen}
              triggerButton={
                <Button variant="outline" size="sm" className="h-8">
                  <Clock className="h-4 w-4 mr-1" />
                  Due Date {deadline && "(set)"}
                </Button>
              }
            />
            <CardRecurrence
              card={tempCard}
              onUpdate={handleUpdate}
              triggerButton={
                <Button variant="outline" size="sm" className="h-8">
                  <Repeat className="h-4 w-4 mr-1" />
                  Recurrence
                </Button>
              }
            />
            <Popover open={isCoverPopoverOpen} onOpenChange={setIsCoverPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Wallpaper className="h-4 w-4 mr-1" />
                  Cover {hasCover && "(set)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-[400px] p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wallpaper className="w-5 h-5" />
                    <h3 className="font-semibold">Cover</h3>
                  </div>
                  <BackgroundPicker />
                  {hasCover && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetBackground()}
                      className="w-full"
                    >
                      Remove Cover
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Labels display */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Members display */}
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs"
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                      {member.initials}
                    </div>
                  )}
                  {member.name}
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 resize-none min-h-[100px]"
            />
          </div>

          {/* Footer with Create button */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
