"use client";

import { AdvancedColorPicker } from "./color-picker";
import { cn, imageUrlToFile } from "@/lib/utils";
import React, { useState } from "react";
import { BackgroundTypeValue } from "@/hooks/use-background-picker";
import ImageCropper from "./image-cropper";
import { useBackgroundPickerContext } from "./background-picker-provider";
import { Card, CardContent } from "./ui/card";

export function BackgroundPicker() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedBGIndex, setSelectedBGIndex] = useState<number | null>(null); // State to track selected  pre-Existing background index

  const colorPalette = [
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
    "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&q=80",
    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=80",
    "https://images.unsplash.com/photo-1557682268-e3955ed5d83f?w=400&q=80",
    "https://images.unsplash.com/photo-1557682257-2f9c37a3a5f3?w=400&q=80",
    "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  ];
  const preExistingImages = [
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610459/japan-background-digital-art_ftw16m.jpg",
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/anime-style-cozy-home-interior-with-furnishings_w64pvh.jpg",
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/anime-moon-landscape_xpl8tc.jpg",
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/japan-background-digital-art_1_v64imy.jpg",
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610457/japan-background-digital-art_2_t9ezt8.jpg",
    "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610797/japan-background-digital-art_nzenvh.jpg",
  ];

  const {
    backgroundType,
    setBackgroundType,
    selectedColor,
    imagePreview,
    selectedFile,
    showCropper,
    setShowCropper,
    handleFilePick,
    handleCropComplete,
    handleColorPick,
  } = useBackgroundPickerContext();

  return (
    <div className="grid gap-2">
      <ImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        file={selectedFile}
        onCropComplete={handleCropComplete}
        onCancel={() => setShowCropper(false)}
      />
      {/* Switcher */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setBackgroundType(BackgroundTypeValue.COLOR)}
          className={cn(
            "px-3 py-1 rounded-md border dark:bg-black",
            backgroundType === BackgroundTypeValue.COLOR
              ? "border-sky-400 bg-sky-50"
              : "border-transparent"
          )}
        >
          Color
        </button>

        <button
          type="button"
          onClick={() => setBackgroundType(BackgroundTypeValue.IMAGE)}
          className={cn(
            "px-3 py-1 rounded-md border dark:bg-black",
            backgroundType === BackgroundTypeValue.IMAGE
              ? "border-sky-400 bg-sky-50"
              : "border-transparent"
          )}
        >
          Image
        </button>
      </div>

      {/* COLOR MODE */}
      {backgroundType === BackgroundTypeValue.COLOR ? (
        <div className="flex w-full gap-4 my-4 items-start">
          <div className="grid gap-6 w-full flex-[2]">
            <AdvancedColorPicker
              className="w-full"
              color={selectedColor}
              onChange={(color) => {
                handleColorPick(color);
              }}
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(0.5rem,1fr))] w-[250] ">
              {colorPalette.map((c, index) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select background ${index + 1}`}
                  onClick={async () => {
                    handleFilePick(await imageUrlToFile(c));
                  }}
                  className={cn(
                    "aspect-square w-full rounded-md border transition cursor-pointer select-none bg-center bg-cover bg-no-repeat",
                    selectedColor === c
                      ? "border-sky-300 ring-1 ring-sky-200 scale-105 z-10 shadow-lg"
                      : "border-transparent"
                  )}
                  style={{ backgroundImage: `url(${c})` }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center ml-3 flex-[1]">
            <span className="text-sm text-muted-foreground">Preview</span>
            <div
              className="w-full h-9 rounded-md border"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>
      ) : (
        /* IMAGE MODE */
        <div className="grid gap-2 mt-2">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleFilePick(e.target.files?.[0] ?? null);
                setSelectedBGIndex(null);
              }}
              className="hidden"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 w-full">
            {preExistingImages.map((c, index) => {
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Select ${c}`}
                  onClick={async () => {
                    setSelectedBGIndex(index);
                    handleFilePick(await imageUrlToFile(c));
                  }}
                  className={cn(
                    "h-12 rounded-md transition overflow-hidden bg-center bg-cover bg-no-repeat  cursor-pointer select-none ",
                    selectedBGIndex === index
                      ? " ring-1 ring-sky-200 scale-105 z-10 shadow-lg"
                      : "border-transparent"
                  )}
                  style={{
                    backgroundImage: `url(${c})`,
                  }}
                />
              );
            })}
            <Card
              className="flex flex-col justify-center py-0 items-center border-2 border-gray-500 border-dashed rounded-sm transition-all cursor-pointer hover:border-gray-400 hover:bg-gray-300/20"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <CardContent className="w-full p-0 pb-1 flex items-center justify-center ">
                <p className="text-sm font-medium text-gray-700 dark:text-white  ">
                  Custom
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3 items-center pt-4">
            <div
              onClick={async () => {
                if (!imagePreview) return;
                
                // If we have an imagePreview URL but no selectedFile, convert the URL to a File first
                if (!selectedFile) {
                  const file = await imageUrlToFile(imagePreview);
                  handleFilePick(file);
                }
                setShowCropper(true);
              }}
              className={cn(
                "w-[57%] h-32 rounded-md  bg-gray-50 bg-cover bg-center  overflow-hidden flex items-center justify-center",
                imagePreview && "cursor-pointer hover:opacity-80 transition"
              )}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="object-cover w-full h-full cursor-pointer "
                />
              ) : (
                <span className="text-xs text-muted-foreground select-none">
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
