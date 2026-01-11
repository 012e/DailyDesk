import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { HTMLAttributes, MouseEvent } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";

export interface BoardCardProps {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BoardCard({
  id,
  name: title,
  backgroundUrl,
  backgroundColor,
  onEdit,
  onDelete,
}: BoardCardProps) {
  // Image takes priority over color
  let backgroundStyle: HTMLAttributes<HTMLDivElement>["style"];
  if (backgroundUrl) {
    backgroundStyle = {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  } else if (backgroundColor) {
    backgroundStyle = { backgroundColor };
  } else {
    backgroundStyle = { backgroundColor: "#6366f1" }; // Default indigo color
  }

  const handleMenuClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEdit = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Link to={`/board/${id}`}>
      <Card
        key={id}
        className="group overflow-hidden relative gap-0 pb-14 bg-center bg-no-repeat bg-cover border-0 transition-all cursor-pointer hover:shadow-md min-h-[120px]"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 mb-16 pointer-events-none backdrop-blur-sm dark:bg-black/25 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-colors" />

        <CardHeader className="flex flex-row justify-between items-start p-4 py-0 z-5">
          <CardTitle className="text-md font-medium overflow-hidden text-ellipsis max-w-[70%] z-10">
            {title}
          </CardTitle>

          {/* Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={handleMenuClick}>
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="z-10 p-4 pt-0">
          <p className="text-sm dark:text-gray-200 text-muted-foreground">
            Click to open board
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
