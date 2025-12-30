// components/card-cover-picker.tsx
import { BackgroundPicker } from "@/components/background-picker";
import { useBackgroundPickerContext } from "@/components/background-picker-provider";
import { Button } from "@/components/ui/button";
import type { Card } from "@/types/card";

import { Wallpaper } from "lucide-react";

interface CardCoverPickerProps {
  card: Card;
  onRemoveCover?: () => Promise<void> | void;
}

export function CardCoverPicker({ card, onRemoveCover }: CardCoverPickerProps) {
  const { reset, getBackgroundData } = useBackgroundPickerContext();
  const { color, imageFile } = getBackgroundData();

  // Check if there's a cover to display or remove
  const hasCover = color || imageFile || card.coverColor || card.coverUrl;

  const handleRemoveCover = async () => {
    reset();
    // Call the onRemoveCover callback to handle image deletion if needed
    if (onRemoveCover) {
      await onRemoveCover();
    }
  };

  return (
    <div className="space-y-4 mb-5">
      <div className="flex items-center gap-2">
        <Wallpaper className="w-5 h-5" />
        <h3 className="font-semibold">Cover</h3>
      </div>

      <div className="flex-1">
        <BackgroundPicker />
      </div>

      <Button
        size="sm"
        disabled={!hasCover}
        onClick={handleRemoveCover}
        className="w-full rounded-dm bg-white hover:bg-white/80 cursor-pointer select-none shadow-sm"
      >
        Remove Cover
      </Button>
    </div>
  );
}

