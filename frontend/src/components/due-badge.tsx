import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Repeat } from "lucide-react";
import { getDueStatus, formatDueDate } from "@/lib/due-status";
import { cn } from "@/lib/utils";
import type { Card } from "@/types/card";

interface DueBadgeProps {
  card: Card;
  onClick?: () => void;
  className?: string;
}

export function DueBadge({ card, onClick, className }: DueBadgeProps) {
  const { dueAt, dueComplete } = card;

  if (!dueAt) return null;

  const { status, label, color } = getDueStatus(dueAt, dueComplete);
  const formattedDate = formatDueDate(dueAt);

  const getBadgeClassName = () => {
    switch (color) {
      case "success":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200";
      case "destructive":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";
      case "secondary":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant={color === "default" ? "outline" : "secondary"}
      className={cn(
        "flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
        getBadgeClassName(),
        className
      )}
      onClick={onClick}
    >
      {dueComplete ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      <span>{label || formattedDate}</span>
      {label && formattedDate && (
        <span className="ml-1 opacity-80">{formattedDate}</span>
      )}
      {card.repeatFrequency && (
        <Repeat className="w-3 h-3 opacity-70" />
      )}
    </Badge>
  );
}
