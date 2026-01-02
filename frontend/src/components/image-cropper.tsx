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

interface ImageCropperProps {
  onCropComplete?: (croppedImage: string) => void;
  onCancel?: () => void;
  file?: File | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

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
  };

  useEffect(() => {
    if (file) {
      setSelectedFile(file);
      setCroppedImage(null);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Dọn dẹp URL cũ để tránh memory leak
      return () => URL.revokeObjectURL(url);
    } else {
      setSelectedFile(null);
      setImageUrl(null);
    }
  }, [file, isImageLoading]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange || handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust and crop your image to fit perfectly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="hidden loader"
              className="hidden"
              onLoad={handleImageLoaded}
            />
          )}
          {!selectedFile || !imageUrl ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No image selected
            </p>
          ) : !croppedImage ? (
            <ImageCrop aspect={2} file={selectedFile} onCrop={setCroppedImage}>
              <div className="flex flex-col items-center space-y-8">
                {isImageLoading && (
                  <div className="flex flex-col items-center space-y-4 py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Loading image...
                    </p>
                  </div>
                )}

                {!isImageLoading && (
                  <>
                    <ImageCropContent className="max-h-[45vh] w-auto" />

                    <div className="flex justify-center gap-3 w-full">
                      <Button variant="outline" onClick={handleClose}>
                        Cancel
                      </Button>
                      <ImageCropApply asChild>
                        <Button>Apply Crop</Button>
                      </ImageCropApply>
                    </div>
                  </>
                )}
              </div>
            </ImageCrop>
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
