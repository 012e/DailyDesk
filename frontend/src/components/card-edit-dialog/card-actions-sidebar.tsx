import {
  User,
  Tag,
  Clock,
  Paperclip,
  Image,
  ArrowRight,
  Copy,
  Archive,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CardActionsSidebarProps {
  onMembersClick?: () => void;
  onLabelsClick?: () => void;
  onDatesClick?: () => void;
  onAttachmentClick?: () => void;
  onCoverClick?: () => void;
  onMoveClick?: () => void;
  onCopyClick?: () => void;
  onArchiveClick?: () => void;
  onDeleteClick?: () => void;
  onMakeTemplateClick?: () => void;
  isTemplate?: boolean;
}

export function CardActionsSidebar({
  onMembersClick,
  onLabelsClick,
  onDatesClick,
  onAttachmentClick,
  onCoverClick,
  onMoveClick,
  onCopyClick,
  onArchiveClick,
  onDeleteClick,
  onMakeTemplateClick,
  isTemplate,
}: CardActionsSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Add to card section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Add to card
        </p>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onMembersClick}
          >
            <User className="w-4 h-4 mr-2" />
            Members
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onLabelsClick}
          >
            <Tag className="w-4 h-4 mr-2" />
            Labels
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onDatesClick}
          >
            <Clock className="w-4 h-4 mr-2" />
            Dates
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onAttachmentClick}
            disabled
            title="Coming soon"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Attachment
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onCoverClick}
            disabled
            title="Coming soon"
          >
            <Image className="w-4 h-4 mr-2" />
            Cover
          </Button>
        </div>
      </div>

      <Separator />

      {/* Actions section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Actions</p>

        <div className="space-y-1">
          <Button
             variant={isTemplate ? "secondary" : "ghost"}
             size="sm"
             className="w-full justify-start"
             onClick={onMakeTemplateClick}
          >
            <LayoutTemplate className="w-4 h-4 mr-2" />
            {isTemplate ? "Template" : "Make template"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onMoveClick}
            disabled
            title="Coming soon"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Move
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onCopyClick}
            disabled
            title="Coming soon"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onArchiveClick}
            disabled
            title="Coming soon"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>

          <Separator className="my-2" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDeleteClick}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
