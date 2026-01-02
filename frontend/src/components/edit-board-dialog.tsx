"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Spinner } from "./ui/spinner";
import { BackgroundPicker } from "@/components/background-picker";
import {
  BackgroundPickerProvider,
  useBackgroundPickerContext,
} from "@/components/background-picker-provider";

interface EditBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialBackgroundUrl?: string;
  initialBackgroundColor?: string;
  onSave: (
    name: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => Promise<void>;
}

export function EditBoardDialog({
  open,
  onOpenChange,
  initialName,
  initialBackgroundUrl,
  initialBackgroundColor,
  onSave,
}: EditBoardDialogProps) {
  const [title, setTitle] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset title when dialog opens with new board
  useEffect(() => {
    if (open) {
      setTitle(initialName);
    }
  }, [open, initialName]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md min-h-[60vh] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <BackgroundPickerProvider
          initialData={{
            color: initialBackgroundColor,
            imageUrl: initialBackgroundUrl,
          }}
        >
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <Spinner className="size-10" />
              <p className="text-xl font-semibold">Updating board...</p>
            </div>
          ) : (
            <EditDialogForm
              title={title}
              setTitle={setTitle}
              onSave={onSave}
              onClose={handleClose}
              setIsSubmitting={setIsSubmitting}
            />
          )}
        </BackgroundPickerProvider>
      </DialogContent>
    </Dialog>
  );
}

function EditDialogForm({
  title,
  setTitle,
  onSave,
  onClose,
  setIsSubmitting,
}: {
  title: string;
  setTitle: (t: string) => void;
  onSave: (title: string, color?: string, file?: File) => Promise<void>;
  onClose: () => void;
  setIsSubmitting: (v: boolean) => void;
}) {
  const { getBackgroundData, reset } = useBackgroundPickerContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const { color, imageFile } = getBackgroundData();

    if (imageFile?.type === "image/gif" && imageFile.size > 5 * 1024 * 1024) {
      alert(
        "File too large (>5MB). Please reduce the size or switch to WebP/MP4."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(trimmed, color, imageFile);
      onClose();
      setTimeout(() => {
        setIsSubmitting(false);
        reset();
      }, 500);
    } catch (error) {
      console.error("Failed to update board:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Board</DialogTitle>
        <DialogDescription>
          Update your board's name and background. Changes will be saved
          immediately.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-8 pb-8">
        <div className="grid gap-4">
          <Label htmlFor="board-title">Board Title</Label>
          <Input
            id="board-title"
            placeholder="e.g. Marketing Campaign 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid gap-4">
          <Label>Background</Label>
          <BackgroundPicker />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
