import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Card } from "@/types/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { useState } from "react";

interface CardEditDialogProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete?: (cardId: string) => void;
}

export function CardEditDialog({
  card,
  isOpen,
  onClose,
  onUpdate,
}: CardEditDialogProps) {
  const [showDetails, setShowDetails] = useState(true);

  if (!card) return null;

  const handleUpdate = (updates: Partial<Card>) => {
    onUpdate({ ...card, ...updates });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!flex !flex-col max-w-[1200px] w-[95vw] h-[90vh] p-0 gap-0"
        showCloseButton={false}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Main content area - Horizontal flex layout */}
        <div className="flex flex-row h-full w-full overflow-hidden">
          {/* Left column - Main content */}
          <div className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full" style={{ minWidth: '500px' }}>
            {/* Header với checkbox và title */}
            <CardHeader card={card} onUpdate={handleUpdate} />

            {/* Labels */}
            <CardLabels card={card} onUpdate={handleUpdate} />

            {/* Members */}
            <CardMembers card={card} onUpdate={handleUpdate} />

            {/* Dates */}
            <CardDates card={card} onUpdate={handleUpdate} />

            {/* Description */}
            <CardDescription card={card} onUpdate={handleUpdate} />
          </div>

          {/* Right column - Comments and activity */}
          <div className="w-80 flex-shrink-0 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Comments and activity</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "Show details"}
                </Button>
              </div>

              {/* Comments section */}
              <CardComments card={card} onUpdate={handleUpdate} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
