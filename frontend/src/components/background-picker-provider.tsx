// background-picker-provider.tsx
import React, { createContext, useContext, type ReactNode } from "react";
import {
  BackgroundTypeValue,
  useBackgroundPicker,
} from "@/hooks/use-background-picker";
import { CardCoverModeValue, type CardCoverMode } from "@/types/card";

interface BackgroundPickerContextValue {
  backgroundType: BackgroundTypeValue;
  setBackgroundType: (type: BackgroundTypeValue) => void;
  selectedColor: string | undefined;
  setSelectedColor: (color: string) => void;
  coverMode: CardCoverModeValue;
  setCoverMode: (mode: CardCoverModeValue) => void;
  imagePreview: string | null;
  selectedFile: File | null;
  croppedFile: File | null;
  showCropper: boolean;
  setShowCropper: (open: boolean) => void;
  handleFilePick: (file: File | null) => void;
  handleCropComplete: (croppedImage: string) => void;
  handleColorPick: (color: string) => void;
  reset: () => void;
  getBackgroundData: () => {
    color?: string;
    imageFile?: File;
  };
}

const BackgroundPickerContext = createContext<
  BackgroundPickerContextValue | undefined
>(undefined);

export const BackgroundPickerProvider = ({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: {
    color?: string;
    imageUrl?: string;
    coverMode?: CardCoverMode;
  };
}) => {
  const picker = useBackgroundPicker(initialData);

  const getBackgroundData = () => ({
    color: picker.selectedColor || undefined,
    imageFile: picker.croppedFile || picker.selectedFile || undefined,
  });

  const value: BackgroundPickerContextValue = {
    ...picker,
    getBackgroundData,
  };

  return (
    <BackgroundPickerContext.Provider value={value}>
      {children}
    </BackgroundPickerContext.Provider>
  );
};

// Hook để dùng Context
export const useBackgroundPickerContext = (): BackgroundPickerContextValue => {
  const context = useContext(BackgroundPickerContext);
  if (!context) {
    throw new Error(
      "useBackgroundPickerContext must be used within BackgroundPickerProvider"
    );
  }
  return context;
};
