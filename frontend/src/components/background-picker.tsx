"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdvancedColorPicker } from "./color-picker";
import { cn } from "@/lib/utils";
import React from "react";
import { Divide } from "lucide-react";

interface BoardBackgroundPickerProps {
  type: "color" | "image";
  onTypeChange: (type: "color" | "image") => void;

  // Color
  color: string;
  onColorChange: (color: string) => void;

  // Image
  imageLink: string;
  onImageLinkChange: (value: string) => void;
  imagePreview: string;
  onFileChange: (file: File | null) => void;
  onOpenCropper: () => void;
  disabled?: boolean;
}

export function BoardBackgroundPicker({
  type,
  onTypeChange,
  color,
  onColorChange,
  imageLink,
  onImageLinkChange,
  imagePreview,
  onFileChange,
  onOpenCropper,
  disabled,
}: BoardBackgroundPickerProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  return (
    <div className="grid gap-2">
      {/* Switcher */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onTypeChange("color")}
          className={cn(
            "px-3 py-1 rounded-md border dark:bg-black",
            type === "color" ? "border-sky-400 bg-sky-50" : "border-transparent"
          )}
        >
          Color
        </button>

        <button
          type="button"
          onClick={() => onTypeChange("image")}
          className={cn(
            "px-3 py-1 rounded-md border dark:bg-black",
            type === "image" ? "border-sky-400 bg-sky-50" : "border-transparent"
          )}
        >
          Image
        </button>
      </div>

      {/* COLOR MODE */}
      {type === "color" ? (
        <div className="grid gap-2 mt-6">
          <AdvancedColorPicker color={color} onChange={onColorChange} />

          <div className="flex gap-3 items-center mt-6 mb-10">
            <div className="grid grid-cols-9 gap-2">
              {colorPalette.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select ${c}`}
                  onClick={() => onColorChange(c)}
                  disabled={disabled}
                  className={cn(
                    "w-8 h-8 rounded-md border-1 transition",
                    color === c
                      ? "border-sky-300 ring-2 ring-sky-200 scale-110 z-10 shadow-lg"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2 items-center ml-3">
              <span className="text-sm text-muted-foreground">Preview</span>
              <div
                className="w-12 h-8 rounded-md border"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* IMAGE MODE */
        <div className="grid gap-2 mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Paste image link (https://...)"
              value={imageLink}
              onChange={(e) => onImageLinkChange(e.target.value)}
              disabled={disabled}
              className="border border-gray-300 rounded-md px-3 py-2"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={disabled}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Choose file
            </Button>
          </div>

          <div className="flex gap-3 items-center pt-4">
            <div
              onClick={() => imagePreview && onOpenCropper()}
              className={cn(
                "w-34 h-24 rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center",
                imagePreview && "cursor-pointer hover:opacity-80 transition"
              )}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  No image selected
                </span>
              )}
            </div>
            {imagePreview && (
              <p className="text-xs text-muted-foreground">
                Click preview to crop image
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
