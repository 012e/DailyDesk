import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Card } from "@/types/card";
import { X, Tag, CheckSquare, UserPlus, Paperclip, MoreHorizontal, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { useState, useCallback } from "react";
import { useUpdateCard } from "@/hooks/use-card";

interface CardEditDialogProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete?: (cardId: string) => void;
  boardId?: string;
}

export function CardEditDialog({
  card,
  isOpen,
  onClose,
  onUpdate,
  boardId,
}: CardEditDialogProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [currentList, setCurrentList] = useState("Backlog");
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const { mutate: updateCard } = useUpdateCard();

  const handleUpdate = useCallback(
    (updates: Partial<Card>) => {
      if (!card) return;

      // Update local state immediately for optimistic UI
      onUpdate({ ...card, ...updates });

      // Sync with backend if boardId is available
      if (boardId) {
        updateCard({
          boardId,
          cardId: card.id,
          ...updates,
        });
      }
    },
    [card, boardId, onUpdate, updateCard]
  );

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!flex !flex-col !p-0 !gap-0"
        style={{
          maxWidth: '1200px',
          width: '90vw',
          height: '600px',
          minHeight: '600px'
        }}
        showCloseButton={false}
      >
        {/* Top header bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <Select value={currentList} onValueChange={setCurrentList}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="Doing">Doing</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <CreditCard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content area - Horizontal flex layout */}
        <div className="flex flex-row h-full w-full overflow-hidden">
          {/* Left column - Main content */}
          <div className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full min-w-0">
            {/* Header với checkbox và title */}
            <CardHeader card={card} onUpdate={handleUpdate} />

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              <CardLabels
                card={card}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isLabelPopoverOpen}
                onOpenChange={setIsLabelPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Tag className="h-4 w-4 mr-1" />
                    Nhãn
                  </Button>
                }
              />
              <CardMembers
                card={card}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isMemberPopoverOpen}
                onOpenChange={setIsMemberPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Thành viên
                  </Button>
                }
              />
              <CardDates
                card={card}
                onUpdate={handleUpdate}
                isOpen={isDatePopoverOpen}
                onOpenChange={setIsDatePopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Clock className="h-4 w-4 mr-1" />
                    Ngày hết hạn
                  </Button>
                }
              />
              <Button variant="outline" size="sm" className="h-8">
                <CheckSquare className="h-4 w-4 mr-1" />
                Việc cần làm
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Paperclip className="h-4 w-4 mr-1" />
                Đính kèm
              </Button>
            </div>

            {/* Labels display - only show if has labels */}
            {card.labels && card.labels.length > 0 && (
              <CardLabels card={card} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Members display - only show if has members */}
            {card.members && card.members.length > 0 && (
              <CardMembers card={card} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Description */}
            <CardDescription card={card} onUpdate={handleUpdate} />
          </div>

          {/* Right column - Comments and activity */}
          <div className="w-96 flex-shrink-0 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Nhận xét và hoạt động</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  Hiện chi tiết
                </Button>
              </div>

              {/* Comments section */}
              {showDetails && <CardComments card={card} onUpdate={handleUpdate} />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
