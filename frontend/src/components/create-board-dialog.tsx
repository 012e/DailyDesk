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
import ImageCropper from "./image-cropper";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import { BoardBackgroundPicker } from "./background-picker";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    title: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => void;
}

export default function CreateBoardDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
  type BackgroundType = "color" | "image";
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("color");

  const [imageLink, setImageLink] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState<boolean>(false);

  useEffect(() => {
    const checkImage = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Image not accessible");
      } catch (err) {
        console.error("CORS or fetch error:", err);
        alert(
          "Không thể tải hình ảnh này. " +
            "Vui lòng nhập URL khác hoặc upload file trực tiếp."
        );
        setImageLink("");
        setImagePreview("");
      }
    };
    checkImage(imageLink);
  }, [imageLink]);

  const handleFilePick = (file: File | null | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setSelectedFile(file); // gán trực tiếp file cục bộ
    setImageLink("");
  };

  const handleCropComplete = (croppedImage: string) => {
    setImagePreview(croppedImage);
    setShowCropper(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    if (
      selectedFile &&
      selectedFile.type === "image/gif" &&
      selectedFile.size / 1024 / 1024 > 5
    ) {
      alert(
        "File quá lớn (>5MB). Vui lòng giảm kích thước hoặc chuyển sang WebP/MP4."
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    await onCreate(trimmedTitle, selectedColor, selectedFile || undefined);
    setTimeout(() => {
      setTitle("");
      setSelectedColor("#bfdbfe");
      setBackgroundType("color");
      setImageLink("");
      setImagePreview("");
      setIsSubmitting(false);
      setShowCropper(false);
    }, 300);
  };

  const closeDialog = async () => {
    onOpenChange(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setImageLink("");
    setImagePreview("");
    setBackgroundType("color");
    setShowCropper(false);
  };

  // CHỈNH SỬA PHẦN fetch link → tạo File
  useEffect(() => {
    if (!imagePreview) return;

    const fetchFileFromLink = async () => {
      try {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const filename = imagePreview.split("/").pop() || "image.jpg";
        const file = new File([blob], filename, { type: blob.type });
        setSelectedFile(file);
      } catch (err) {
        console.error("Cannot fetch image", err);
        setSelectedFile(null);
      }
    };

    fetchFileFromLink();
  }, [imagePreview, selectedFile]);

  //#region Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-auto sm:max-w-md min-h-[60vh] max-h-[90vh]"
        showCloseButton={false}
      >
        {isSubmitting ? (
          <div className="flex flex-col gap-3 justify-center items-center w-full h-full">
            <Spinner className={cn("size-10")} />
            <h2 className="text-xl font-bold tracking-tight">Creating...</h2>
          </div>
        ) : (
          <>
            <DialogHeader className="h-20">
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>
                Give your board a name and choose a background color or image.
                You can change both later.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-8 pb-8">
                <div className="grid gap-4">
                  <Label htmlFor="board-title">Board Title</Label>
                  <Input
                    id="board-title"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-sky-400 [&:focus]:ring-1 [&:focus]:ring-sky-100"
                    placeholder="e.g. Marketing Campaign 2025"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>

                {/* Background Picker */}
                <div className="grid gap-4">
                  <Label>Background</Label>

                  <BoardBackgroundPicker
                    type={backgroundType}
                    onTypeChange={setBackgroundType}
                    // Color
                    color={selectedColor}
                    onColorChange={setSelectedColor}
                    // Image
                    imageLink={imageLink}
                    onImageLinkChange={(v) => {
                      setImageLink(v);
                      setImagePreview(v);
                      setSelectedFile(null);
                    }}
                    imagePreview={imagePreview}
                    onFileChange={(file) => handleFilePick(file)}
                    onOpenCropper={() => setShowCropper(true)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeDialog()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!title.trim() || isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Board"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>

      <ImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        file={selectedFile}
        onCropComplete={handleCropComplete}
        onCancel={() => setShowCropper(false)}
      />
    </Dialog>
  );
}
