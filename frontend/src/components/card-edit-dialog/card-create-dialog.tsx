import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Card, Label, Member, RepeatFrequency } from "@/types/card";
import { X, Tag, UserPlus, Clock, Wallpaper, CheckSquare, Paperclip, FileIcon, Loader2, ChevronDown, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label as UILabel } from "@/components/ui/label";
import { CardLabels } from "./card-labels";
import { CardMembers } from "./card-members";
import { CardDates } from "./card-dates";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useCreateCard } from "@/hooks/use-card";
import { BackgroundPickerProvider, useBackgroundPickerContext } from "@/components/background-picker-provider";
import { BackgroundPicker } from "@/components/background-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUploadImage, useUploadConfig } from "@/hooks/use-image";
import { queryClient } from "@/lib/query-client";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { v7 as uuidv7 } from "uuid";

interface CardCreateDialogProps {
  boardId: string;
  listId: string;
  order: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (card: Card) => void;
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
  const [startDate, setStartDate] = useState<Date | string | null>(null);
  const [dueAt, setDueAt] = useState<Date | string | null>(null);
  const [dueComplete, setDueComplete] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency | null>(null);
  const [repeatInterval, setRepeatInterval] = useState<number | null>(null);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isPillButtonDateOpen, setIsPillButtonDateOpen] = useState(false);
  const [isCoverPopoverOpen, setIsCoverPopoverOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Temporary CheckList state
  interface TempChecklistItem {
    tempId: string;
    name: string;
    completed: boolean;
    order: number;
  }
  const [tempChecklistItems, setTempChecklistItems] = useState<TempChecklistItem[]>([]);
  const [isChecklistPopoverOpen, setIsChecklistPopoverOpen] = useState(false);
  const [newChecklistItemName, setNewChecklistItemName] = useState("");

  // Temporary Attachment state
  interface TempAttachment {
    tempId: string;
    file?: File;
    name: string;
    url?: string;
    type: string;
    size: number;
    preview?: string;
  }
  const [tempAttachments, setTempAttachments] = useState<TempAttachment[]>([]);
  const [isAttachmentPopoverOpen, setIsAttachmentPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);

  // Batch upload progress
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    step: string;
  }>({ current: 0, total: 0, step: "" });

  const { mutate: createCard, isPending } = useCreateCard();
  const { uploadImage } = useUploadImage();
  const { cloudName, uploadPreset } = useUploadConfig();
  const { selectedColor, selectedFile, croppedFile, reset: resetBackground, getBackgroundData } = useBackgroundPickerContext();

  const imageFile = croppedFile || selectedFile;

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
    startDate,
    dueAt,
    dueComplete,
    reminderMinutes,
    repeatFrequency,
    repeatInterval,
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
    if (updates.startDate !== undefined) {
      setStartDate(updates.startDate);
    }
    if (updates.dueAt !== undefined) {
      setDueAt(updates.dueAt);
    }
    if (updates.dueComplete !== undefined) {
      setDueComplete(updates.dueComplete);
    }
    if (updates.reminderMinutes !== undefined) {
      setReminderMinutes(updates.reminderMinutes);
    }
    if (updates.repeatFrequency !== undefined) {
      setRepeatFrequency(updates.repeatFrequency ?? null);
    }
    if (updates.repeatInterval !== undefined) {
      setRepeatInterval(updates.repeatInterval ?? null);
    }
    if (updates.description !== undefined) {
      setDescription(updates.description || "");
    }
  }, []);

  // CheckList Management Functions
  const handleAddTempChecklistItem = (name: string) => {
    if (!name.trim()) return;
    const newItem: TempChecklistItem = {
      tempId: crypto.randomUUID(),
      name: name.trim(),
      completed: false,
      order: tempChecklistItems.length,
    };
    setTempChecklistItems(prev => [...prev, newItem]);
  };

  const handleToggleTempChecklistItem = (tempId: string) => {
    setTempChecklistItems(prev =>
      prev.map(item => item.tempId === tempId ? { ...item, completed: !item.completed } : item)
    );
  };

  const handleRemoveTempChecklistItem = (tempId: string) => {
    setTempChecklistItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  // Attachment Management Functions
  const handleAddTempAttachmentFile = (file: File) => {
    let preview: string | undefined;
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
    }
    const newAttachment: TempAttachment = {
      tempId: crypto.randomUUID(),
      file,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      preview,
    };
    setTempAttachments(prev => [...prev, newAttachment]);
    setIsAttachmentPopoverOpen(false);
  };

  const handleAddTempAttachmentLink = () => {
    if (!linkUrl.trim()) return;
    const newAttachment: TempAttachment = {
      tempId: crypto.randomUUID(),
      url: linkUrl.trim(),
      name: linkName.trim() || linkUrl.trim(),
      type: "link",
      size: 0,
    };
    setTempAttachments(prev => [...prev, newAttachment]);
    setIsAttachmentPopoverOpen(false);
    setLinkUrl("");
    setLinkName("");
  };

  const handleRemoveTempAttachment = (tempId: string) => {
    setTempAttachments(prev => {
      const attachment = prev.find(a => a.tempId === tempId);
      if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
      return prev.filter(a => a.tempId !== tempId);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  useEffect(() => {
    return () => {
      tempAttachments.forEach(attachment => {
        if (attachment.preview) URL.revokeObjectURL(attachment.preview);
      });
    };
  }, [tempAttachments]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);

    const cardData = {
      boardId,
      listId,
      name: title.trim(),
      order,
      description: description || undefined,
      labels: labels.length > 0 ? labels : undefined,
      members: members.length > 0 ? members : undefined,
      deadline: deadline,
      startDate: startDate ? (typeof startDate === "string" ? startDate : startDate.toISOString()) : undefined,
      dueAt: dueAt ? (typeof dueAt === "string" ? dueAt : dueAt.toISOString()) : undefined,
      dueComplete,
      reminderMinutes,
      repeatFrequency,
      repeatInterval,
    };

    try {
      createCard(
        cardData,
        {
          onSuccess: async (newCard) => {
            if (!newCard?.id) {
              setIsCreating(false);
              return;
            }

            const { imageFile: currentImageFile } = getBackgroundData();
            const totalSteps =
              (currentImageFile ? 1 : 0) +
              tempChecklistItems.length +
              tempAttachments.length;

              if (totalSteps === 0) {
                resetForm();
                onCreated?.(newCard as Card);
                onClose();
                return;
              }

            setIsBatchUploading(true);
            let currentStep = 0;
            const errors: Array<{ type: string; item: string; error: string }> = [];

            try {
              if (currentImageFile) {
                try {
                  setUploadProgress({ current: ++currentStep, total: totalSteps, step: "Uploading cover..." });
                  await uploadImage({ file: currentImageFile, type: "card", id: newCard.id });
                } catch (error: any) {
                  console.error("Error uploading cover:", error);
                  errors.push({ type: "cover", item: "Cover image", error: error.message || "Unknown error" });
                }
              }

              for (let i = 0; i < tempChecklistItems.length; i++) {
                const item = tempChecklistItems[i];
                try {
                  setUploadProgress({
                    current: ++currentStep,
                    total: totalSteps,
                    step: `Adding checklist item ${i + 1}/${tempChecklistItems.length}...`,
                  });

                  const { error } = await api.POST("/boards/{boardId}/cards/{cardId}/checklist-items", {
                    params: { path: { boardId, cardId: newCard.id } },
                    body: {
                      id: uuidv7(),
                      name: item.name,
                      completed: item.completed,
                      order: item.order,
                      cardId: newCard.id,
                    },
                  });

                  if (error) throw new Error("Failed to create checklist item");
                } catch (error: any) {
                  console.error(`Error uploading checklist item "${item.name}":`, error);
                  errors.push({ type: "checklist", item: item.name, error: error.message || "Unknown error" });
                }
              }

              for (let i = 0; i < tempAttachments.length; i++) {
                const attachment = tempAttachments[i];
                try {
                  setUploadProgress({
                    current: ++currentStep,
                    total: totalSteps,
                    step: `Uploading attachment ${i + 1}/${tempAttachments.length}...`,
                  });

                  if (attachment.file) {
                    if (!cloudName || !uploadPreset) throw new Error("Cloudinary config not loaded");

                    const form = new FormData();
                    form.append("upload_preset", uploadPreset);
                    form.append("folder", "schedule_management/attachments");
                    form.append("file", attachment.file);

                    const uploadRes = await fetch(
                      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                      { method: "POST", body: form }
                    );

                    if (!uploadRes.ok) throw new Error("Failed to upload to Cloudinary");
                    const uploadData = await uploadRes.json();

                    const { error } = await api.POST("/boards/{boardId}/cards/{cardId}/attachments", {
                      params: { path: { boardId, cardId: newCard.id } },
                      body: {
                        name: attachment.name,
                        url: uploadData.secure_url,
                        publicId: uploadData.public_id,
                        type: attachment.type,
                        size: attachment.size,
                      },
                    });

                    if (error) throw new Error("Failed to create attachment");
                  } else if (attachment.url) {
                    const { error } = await api.POST("/boards/{boardId}/cards/{cardId}/attachments", {
                      params: { path: { boardId, cardId: newCard.id } },
                      body: {
                        name: attachment.name,
                        url: attachment.url,
                        type: attachment.type,
                        size: attachment.size,
                      },
                    });

                    if (error) throw new Error("Failed to create attachment");
                  }
                } catch (error: any) {
                  console.error(`Error uploading attachment "${attachment.name}":`, error);
                  errors.push({ type: "attachment", item: attachment.name, error: error.message || "Unknown error" });
                }
              }

              queryClient.invalidateQueries({ queryKey: ["board", boardId] });

              if (errors.length > 0) {
                toast.error(`Card created, but ${errors.length} item(s) failed to upload`, { duration: 8000 });
              } else {
                toast.success("Card created successfully!");
              }

              resetForm();
              onCreated?.(newCard as Card);
              onClose();
            } catch (error) {
              console.error("Error during batch upload:", error);
              toast.error("Card created, but some items failed. Please edit the card to add them manually.");
              resetForm();
              onCreated?.(newCard as Card);
              onClose();
            } finally {
              setIsBatchUploading(false);
              setIsCreating(false);
            }
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
    setStartDate(null);
    setDueAt(null);
    setDueComplete(false);
    setReminderMinutes(null);
    setRepeatFrequency(null);
    setRepeatInterval(null);
    setIsCreating(false);
    resetBackground();

    setTempChecklistItems([]);
    tempAttachments.forEach(attachment => {
      if (attachment.preview) URL.revokeObjectURL(attachment.preview);
    });
    setTempAttachments([]);

    setIsChecklistPopoverOpen(false);
    setIsAttachmentPopoverOpen(false);
    setNewChecklistItemName("");
    setLinkUrl("");
    setLinkName("");

    setIsBatchUploading(false);
    setUploadProgress({ current: 0, total: 0, step: "" });
  };

  const handleClose = () => {
    if (isBatchUploading) {
      toast.error("Please wait for uploads to complete");
      return;
    }
    resetForm();
    onClose();
  };

  const isSubmitting = isPending || isCreating;

  // Format due date for display in vi-VN locale: "HH:mm D MMM"
  const formatDueDateVN = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const day = d.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    return `${hours}:${minutes} ${day} ${month}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="!flex !flex-col !p-0 !gap-0"
        style={{
          maxWidth: '1200px',
          width: '90vw',
          height: hasCover ? '650px' : '550px',
          minHeight: '500px'
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

        {/* Loading overlay with progress */}
        {(isCreating || isBatchUploading) && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg border">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              {isBatchUploading ? (
                <>
                  <p className="text-sm font-medium">{uploadProgress.step}</p>
                  <p className="text-xs text-muted-foreground">
                    Step {uploadProgress.current} of {uploadProgress.total}
                  </p>
                  <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Creating card...</p>
              )}
            </div>
          </div>
        )}

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
        <div
          className="flex flex-col flex-1 w-full overflow-y-auto overscroll-contain p-6 gap-4"
          style={{
            touchAction: 'auto',
            WebkitOverflowScrolling: 'touch'
          } as React.CSSProperties}
          onWheel={(e) => {
            e.stopPropagation();
          }}
        >
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
            {!startDate && !dueAt && (
              <CardDates
                card={tempCard}
                onUpdate={handleUpdate}
                isOpen={isDatePopoverOpen}
                onOpenChange={setIsDatePopoverOpen}
                createMode={true}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Clock className="h-4 w-4 mr-1" />
                    Dates
                  </Button>
                }
              />
            )}
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
            <Popover open={isChecklistPopoverOpen} onOpenChange={setIsChecklistPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Checklist {tempChecklistItems.length > 0 && `(${tempChecklistItems.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Add Checklist Item</h4>
                  <Input
                    placeholder="Enter item name..."
                    value={newChecklistItemName}
                    onChange={(e) => setNewChecklistItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newChecklistItemName.trim()) {
                        handleAddTempChecklistItem(newChecklistItemName);
                        setNewChecklistItemName("");
                        setIsChecklistPopoverOpen(false);
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsChecklistPopoverOpen(false);
                      setNewChecklistItemName("");
                    }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => {
                      handleAddTempChecklistItem(newChecklistItemName);
                      setNewChecklistItemName("");
                      setIsChecklistPopoverOpen(false);
                    }} disabled={!newChecklistItemName.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Popover open={isAttachmentPopoverOpen} onOpenChange={setIsAttachmentPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attachment {tempAttachments.length > 0 && `(${tempAttachments.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Attach</h4>
                    <Button variant="outline" size="sm" className="w-full justify-start"
                      onClick={() => attachmentFileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Computer
                    </Button>
                    <input ref={attachmentFileInputRef} type="file" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAddTempAttachmentFile(file);
                          e.target.value = "";
                        }
                      }}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <UILabel htmlFor="attach-link-url" className="text-xs">Or attach a link</UILabel>
                    <Input id="attach-link-url" placeholder="Paste a link..."
                      value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTempAttachmentLink()}
                    />
                    <Input placeholder="Link name (optional)"
                      value={linkName} onChange={(e) => setLinkName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTempAttachmentLink()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setIsAttachmentPopoverOpen(false);
                        setLinkUrl("");
                        setLinkName("");
                      }}>Cancel</Button>
                      <Button size="sm" onClick={handleAddTempAttachmentLink} disabled={!linkUrl.trim()}>
                        Attach
                      </Button>
                    </div>
                  </div>
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

          {(startDate || dueAt) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dates</label>
              <div className="flex flex-wrap gap-2">
                {startDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 flex items-center gap-2"
                    onClick={() => setIsPillButtonDateOpen(true)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm">Start: {formatDueDateVN(startDate)}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
                {dueAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 flex items-center gap-2"
                    onClick={() => setIsPillButtonDateOpen(true)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm">Due: {formatDueDateVN(dueAt)}</span>
                    {repeatFrequency && <Repeat className="h-3.5 w-3.5 opacity-70" />}
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Temporary CheckList Display */}
          {tempChecklistItems.length > 0 && (
            <div className="space-y-3 p-4 rounded-md bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Checklist Preview</h3>
                <span className="text-xs text-muted-foreground">
                  {tempChecklistItems.filter(i => i.completed).length}/{tempChecklistItems.length} completed
                </span>
              </div>
              <div className="space-y-2">
                {tempChecklistItems.map((item) => (
                  <div key={item.tempId} className="flex items-center gap-3 py-1">
                    <Checkbox checked={item.completed}
                      onCheckedChange={() => handleToggleTempChecklistItem(item.tempId)}
                    />
                    <span className={item.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                      {item.name}
                    </span>
                    <Button variant="ghost" size="sm"
                      onClick={() => handleRemoveTempChecklistItem(item.tempId)}
                      className="h-6 w-6 p-0">×</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Temporary Attachments Display */}
          {tempAttachments.length > 0 && (
            <div className="space-y-3 p-4 rounded-md bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments Preview
              </h3>
              <div className="space-y-3">
                {tempAttachments.map((attachment) => {
                  const isImage = attachment.type.startsWith("image/");
                  return (
                    <div key={attachment.tempId} className="flex gap-3 group">
                      <div className="flex-shrink-0">
                        {isImage && attachment.preview ? (
                          <div className="w-20 h-14 rounded border overflow-hidden bg-muted">
                            <img src={attachment.preview} alt={attachment.name}
                              className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-14 rounded border flex items-center justify-center bg-muted">
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {attachment.type === "link" ? "Link" : formatFileSize(attachment.size)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm"
                        onClick={() => handleRemoveTempAttachment(attachment.tempId)}
                        className="h-6 w-6 p-0">×</Button>
                    </div>
                  );
                })}
              </div>
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

        {(startDate || dueAt) && (
          <CardDates
            card={tempCard}
            onUpdate={handleUpdate}
            isOpen={isPillButtonDateOpen}
            onOpenChange={setIsPillButtonDateOpen}
            createMode={true}
            triggerButton={null}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
