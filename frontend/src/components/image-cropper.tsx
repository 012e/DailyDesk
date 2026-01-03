"use client";

import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
} from "@/components/ui/shadcn-io/image-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  onCropComplete?: (croppedImage: string) => void;
  onCancel?: () => void;
  file?: File | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ASPECT_RATIOS = [
  { label: "Free", value: undefined },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "2:1", value: 2 },
] as const;

const ImageCropper = ({
  onCropComplete,
  onCancel,
  file,
  open = true,
  onOpenChange,
}: ImageCropperProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

  const handleImageLoaded = () => {
    setIsImageLoading(false);
  };

  const handleReset = () => {
    setCroppedImage(null);
    setIsImageLoading(true);
  };

  const handleClose = () => {
    onOpenChange?.(false);
    onCancel?.();
    handleReset();
    setAspectRatio(undefined);
  };

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspectRatio(newAspect);
  };

  useEffect(() => {
    if (file) {
      setSelectedFile(file);
      setCroppedImage(null);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setSelectedFile(null);
      setImageUrl(null);
    }
  }, [file]);

  // Preload image to avoid flicker
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = handleImageLoaded;
      img.src = imageUrl;
    }
  }, [imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust and crop your image to fit perfectly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!selectedFile || !imageUrl ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No image selected
            </p>
          ) : isImageLoading ? (
            <div className="flex flex-col items-center space-y-4 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading image...
              </p>
            </div>
          ) : !croppedImage ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Aspect Ratio Selector */}
              <div className="flex flex-wrap justify-center gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.label}
                    variant={aspectRatio === ratio.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAspectChange(ratio.value)}
                    className={cn(
                      "text-xs",
                      aspectRatio === ratio.value && "ring-2 ring-primary"
                    )}
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>

              <ImageCrop aspect={aspectRatio} file={selectedFile} onCrop={setCroppedImage}>
                <div className="flex flex-col items-center space-y-4">
                  <ImageCropContent className="max-h-[40vh] w-auto" />
                  <div className="flex justify-center gap-3 w-full">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <ImageCropApply asChild>
                      <Button>Apply Crop</Button>
                    </ImageCropApply>
                  </div>
                </div>
              </ImageCrop>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <p className="text-sm font-medium">Cropped Preview</p>
              <img
                src={croppedImage}
                alt="Cropped"
                className="rounded-lg border max-h-[40vh] max-w-full"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Start Over
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onCropComplete?.(croppedImage);
                    handleClose();
                  }}
                >
                  Use This Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;

