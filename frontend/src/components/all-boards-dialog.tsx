import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { BoardCard } from "@/components/board-card";

interface Board {
  id: string;
  name: string;
  backgroundUrl?: string | null;
  backgroundColor?: string | null;
}

interface AllBoardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: Board[];
  title: string;
  onBoardClick?: (boardId: string) => void;
  onEdit?: (board: Board) => void;
  onDelete?: (board: Board) => void;
}

export function AllBoardsDialog({
  open,
  onOpenChange,
  boards,
  title,
  onBoardClick,
  onEdit,
  onDelete,
}: AllBoardsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBoards = useMemo(() => {
    if (!searchTerm.trim()) return boards;
    return boards.filter((board) =>
      board.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [boards, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60vw] h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search boards..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Board Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 py-2">
            {filteredBoards.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No boards found
              </div>
            ) : (
              filteredBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => onBoardClick?.(board.id)}
                >
                  <BoardCard
                    id={board.id}
                    name={board.name}
                    backgroundUrl={board.backgroundUrl ?? undefined}
                    backgroundColor={board.backgroundColor ?? undefined}
                    onEdit={() => onEdit?.(board)}
                    onDelete={() => onDelete?.({
                      ...board,
                    })}
                    compact
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
