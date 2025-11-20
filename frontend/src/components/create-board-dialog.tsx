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
import { useRef, useState } from "react";
import { AdvancedColorPicker } from "./color-picker";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // changed: include background color/image in callback
  onCreate: (
    title: string,
    isBackgroundImage: boolean,
    background?: string
  ) => void;
}

export default function CreateBoardDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateBoardDialogProps) {
  // ...existing code...
  const [title, setTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // new: selected background color with a nicer default
  const colorPalette = [
    "#ffffff",
    "#fde68a",
    "#fca5a5",
    "#c7f9cc",
    "#bfdbfe",
    "#e9d5ff",
    "#fef3c7",
    "#d1fae5",
  ];
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff"); // default chosen

  // New: allow choosing between color or image background
  type BackgroundType = "color" | "image";
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("color");

  // Image inputs: either a link or a picked file (from file explorer)
  const [imageLink, setImageLink] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>(""); // object URL or link preview
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePick = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setImageLink("");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFilePick(file);
  };

  const handleImageLinkChange = (value: string) => {
    setImageLink(value);
    setImagePreview(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // decide which background to send
      let background: string | undefined = undefined;
      if (backgroundType === "color") {
        background = selectedColor;
      } else if (backgroundType === "image" && imagePreview) {
        background = imagePreview;
      }

      onCreate(trimmedTitle, backgroundType === "image", background);
      // reset
      setTitle("");
      setSelectedColor("#bfdbfe");
      setBackgroundType("color");
      setImageLink("");
      setImagePreview("");
      setIsSubmitting(false);
    }, 300);
  };

  const closeDialog = async () => {
    onOpenChange(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setImageLink("");
    setImagePreview("");
    setBackgroundType("color");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md min-h-[60vh] max-h-[90vh] overflow-auto">
        <DialogHeader className="h-20">
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Give your board a name and choose a background color or image. You
            can change both later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 pb-8">
            <div className="grid gap-3">
              <Label htmlFor="board-title">Board Title</Label>
              <Input
                id="board-title"
                className="
                    border border-gray-300 rounded-md px-3 py-2
                    focus:outline-none focus:ring-0 focus:border-sky-400
                    [&:focus]:ring-1 [&:focus]:ring-sky-100 
                  "
                placeholder="e.g. Marketing Campaign 2025"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {/* Background type selector */}
            <div className="grid gap-2">
              <Label>Background</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBackgroundType("color")}
                  className={`px-3 py-1 rounded-md border dark:bg-black ${
                    backgroundType === "color"
                      ? "border-sky-400 bg-sky-50"
                      : "border-transparent"
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => setBackgroundType("image")}
                  className={`px-3 py-1 rounded-md border dark:bg-black ${
                    backgroundType === "image"
                      ? "border-sky-400 bg-sky-50"
                      : "border-transparent"
                  }`}
                >
                  Image
                </button>
              </div>

              {backgroundType === "color" ? (
                //#region Color picker
                <div className="grid gap-2 mt-6 ">
                  <AdvancedColorPicker
                    color={selectedColor}
                    onChange={setSelectedColor}
                  />

                  <div className="flex items-center gap-3 mt-6 mb-10 ">
                    <div className="grid grid-cols-9 gap-2">
                      {colorPalette.map((c) => (
                        <button
                          key={c}
                          defaultChecked={c === selectedColor}
                          type="button"
                          aria-label={`Select ${c}`}
                          onClick={() => setSelectedColor(c)}
                          disabled={isSubmitting}
                          className={`w-8 h-8 rounded-md border-1 transform transition 
                                ${
                                  selectedColor === c
                                    ? "border-sky-300 ring-2 ring-sky-200 scale-110 z-10 shadow-lg"
                                    : "border-transparent"
                                }
                                hover:scale-110 hover:z-10 hover:shadow-md`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="ml-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Preview
                      </span>
                      <div
                        className="w-12 h-8 rounded-md border"
                        style={{ backgroundColor: selectedColor }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                //#endregion
                //#region Image picker
                <div className="grid gap-2 mt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image link (https://...)"
                      value={imageLink}
                      className="
                    border border-gray-300 rounded-md px-3 py-2
                    focus:outline-none focus:ring-0 focus:border-sky-400
                    [&:focus]:ring-1 [&:focus]:ring-sky-100 
                  "
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleImageLinkChange(e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      Choose file
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <span className="text-sm text-muted-foreground">
                      Preview
                    </span>
                    <div className="w-34 h-24 rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No image selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
      </DialogContent>
    </Dialog>
  );
}
