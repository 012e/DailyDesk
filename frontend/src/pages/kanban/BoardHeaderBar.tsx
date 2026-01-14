import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BoardFilterPopover, type FilterState } from "@/components/board-filter-popover";
import { BoardSortPopover } from "@/components/board-sort-popover";
import { BoardMembersManager } from "@/components/board-members-manager";
import { LabelManager } from "@/components/label-manager";
import { useDeleteBoard } from "@/hooks/use-board";

import { 
  Tags,
  MoreHorizontal, 
  Share2, 
  Pencil, 
  Copy, 
  Settings, 
  Trash2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  name: string;
  avatar?: string | null;
}

interface BoardHeaderBarProps {
  boardId: string;
  boardName: string;
  members: Member[];
  isOwner: boolean;
  creatorId: string;
  currentUserId: string;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onEditBoard: () => void;
}

// Avatar colors for members
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-cyan-500",
];

// Get initials from name
function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function BoardHeaderBar({
  boardId,
  boardName,
  members,
  isOwner,
  creatorId,
  currentUserId,
  filters,
  onFiltersChange,
  onEditBoard,
}: BoardHeaderBarProps) {
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [isLabelsSheetOpen, setIsLabelsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const { deleteBoard } = useDeleteBoard();

  // Handle copy board link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!", { position: "bottom-left" });
  };

  // Handle delete board
  const handleDeleteBoard = async () => {
    if (!isOwner) {
      toast.error("Only the board owner can delete this board", { position: "bottom-left" });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBoard(boardId);
      toast.success("Board deleted successfully!", { position: "bottom-left" });
      setIsDeleteDialogOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error("Failed to delete board. Please try again.", { position: "bottom-left" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="sticky top-1 z-10 flex items-center justify-between mb-4 bg-card/80 dark:bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 mr-4  border border-border/50">
        {/* Left Section - Board Name */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{boardName}</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-foreground/70 hover:text-foreground hover:bg-muted"
                onClick={onEditBoard}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Board</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section - Members, Actions, Share */}
        <div className="flex items-center gap-3">
          {/* Member Avatars */}
          <TooltipProvider>
            <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
              <SheetTrigger asChild>
                <div className="flex items-center cursor-pointer group">
                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((member, index) => {
                      const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
                      const initials = getInitials(member.name);
                      return (
                        <Tooltip key={member.id}>
                          <TooltipTrigger asChild>
                            <Avatar
                              className={`h-8 w-8 border-2 border-black/30 ring-2 ring-transparent group-hover:ring-white/30 transition-all ${colorClass}`}
                            >
                              {member.avatar ? (
                                <AvatarImage src={member.avatar} alt={member.name} />
                              ) : null}
                              <AvatarFallback
                                className={`${colorClass} text-white text-xs font-semibold`}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{member.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {members.length > 5 && (
                      <Avatar className="h-8 w-8 border-2 border-black/30 bg-gray-600">
                        <AvatarFallback className="bg-gray-600 text-white text-xs font-semibold">
                          +{members.length - 5}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  {/* Progress Bar under avatars */}
                  <div className="ml-1 h-1 w-12 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Manage Board Members</SheetTitle>
                  <SheetDescription>
                    Add or remove members from <b>{boardName}</b>
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 p-4">
                  <BoardMembersManager boardId={boardId} isOwner={isOwner} />
                </div>
              </SheetContent>
            </Sheet>
          </TooltipProvider>

          {/* Separator */}
          <div className="h-6 w-px bg-border" />

          {/* Action Icons */}
          <TooltipProvider>
            <div className="flex items-center gap-1">

              {/* Search Bar - Always visible, compact */}
              <div className="flex items-center gap-1.5 bg-transparent rounded-md px-2 py-1 border border-border">
                <Search className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={filters.searchQuery}
                  onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                  className="h-5 w-40 bg-transparent border-none text-foreground placeholder:text-muted-foreground text-xs focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />
                {filters.searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-foreground/60 hover:text-foreground hover:bg-muted rounded-sm shrink-0"
                    onClick={() => onFiltersChange({ ...filters, searchQuery: "" })}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>

              {/* Filter Popover */}
              <BoardFilterPopover
                boardId={boardId}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />

              {/* Sort Popover */}
              <BoardSortPopover
                sortBy={filters.sortBy}
                onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
              />

              {/* Labels Manager */}
              <Sheet open={isLabelsSheetOpen} onOpenChange={setIsLabelsSheetOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-muted"
                      >
                        <Tags className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Labels</TooltipContent>
                </Tooltip>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Board Labels</SheetTitle>
                    <SheetDescription>
                      Create and manage labels for <b>{boardName}</b>
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <LabelManager 
                      members={members}
                      creatorId={creatorId}
                      currentUserId={currentUserId}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* More Options Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>More</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Board Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEditBoard}>
                    <Settings className="h-4 w-4 mr-2" />
                    Board Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!isOwner}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>

          {/* Share Button */}
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8 px-3"
            onClick={() => setIsMembersSheetOpen(true)}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{boardName}"</strong>? This action cannot be undone. 
              All lists, cards, and data in this board will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Board
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
