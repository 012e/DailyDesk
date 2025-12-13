// components/card-cover-picker.tsx
import { BackgroundPicker } from "@/components/background-picker";
import { useBackgroundPickerContext } from "@/components/background-picker-provider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CardCoverModeValue,
  type Card,
  type CardCoverMode,
} from "@/types/card";

import { Wallpaper } from "lucide-react";

interface CardCoverPickerProps {
  card: Card;
  onUpdate: (coverMode: CardCoverMode) => void;
}

export function CardCoverPicker({ card, onUpdate }: CardCoverPickerProps) {
  const { coverMode, setCoverMode, reset, getBackgroundData } =
    useBackgroundPickerContext();
  const { color, imageFile } = getBackgroundData();

  const handleUpdate = async (v: CardCoverModeValue) => {
    if (!color && !imageFile) return;
    onUpdate(v);
  };

  const handleRemoveCover = () => {
    reset();
    onUpdate(CardCoverModeValue.NONE);
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

      <div className="flex items-center gap-3">
        <Label className="w-20">Display</Label>
        <Select
          value={
            coverMode !== CardCoverModeValue.NONE
              ? coverMode
              : CardCoverModeValue.TOP
          }
          onValueChange={(v) => {
            setCoverMode(v);
            handleUpdate(v);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top only</SelectItem>
            <SelectItem value="cover">Full cover</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        disabled={!color && !imageFile}
        onClick={handleRemoveCover}
        className="w-full rounded-dm bg-white hover:bg-white/80 cursor-pointer select-none shadow-sm"
      >
        Remove Cover
      </Button>
    </div>
  );
}
