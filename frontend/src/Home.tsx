import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Clipboard, Users, Clock } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import CreateBoardDialog from "@/components/create-board-dialog";
import { BoardCard } from "@/components/board-card";
import { DeleteBoardDialog } from "@/components/delete-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useBoards,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "@/hooks/use-board";
import PageLoader from "./components/full-page-loader";
import { useUploadImage } from "@/hooks/use-image";
import { useAuth0 } from "@auth0/auth0-react";

type BoardToEdit = {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
} | null;

type BoardToDelete = {
  id: string;
  name: string;
  hasImage: boolean;
} | null;

const RECENT_BOARDS_KEY_PREFIX = "dailydesk-recent-boards-";
const MAX_RECENT_BOARDS = 5;

// Helper to get recently accessed boards from localStorage (user-specific)
function getRecentBoards(userId: string): string[] {
  try {
    const stored = localStorage.getItem(RECENT_BOARDS_KEY_PREFIX + userId);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to add a board to recently accessed (user-specific)
function addToRecentBoards(userId: string, boardId: string) {
  try {
    let recent = getRecentBoards(userId).filter(id => id !== boardId);
    recent.unshift(boardId);
    recent = recent.slice(0, MAX_RECENT_BOARDS);
    localStorage.setItem(RECENT_BOARDS_KEY_PREFIX + userId, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors
  }
}

export default function Home() {
  const { user } = useAuth0();
  const { createBoard } = useCreateBoard();
  const { updateBoard } = useUpdateBoard();
  const { deleteBoard } = useDeleteBoard();
  const { uploadImage } = useUploadImage();

  const { ownedBoards, invitedBoards } = useBoards();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [boardToEdit, setBoardToEdit] = useState<BoardToEdit>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardToDelete>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentBoardIds, setRecentBoardIds] = useState<string[]>([]);

  const userId = user?.sub || "";

  // Debug logging
  console.log("DEBUG - userId:", userId);
  console.log("DEBUG - ownedBoards:", ownedBoards);
  console.log("DEBUG - invitedBoards:", invitedBoards);

  // Load recent boards from localStorage on mount and when userId changes
  useEffect(() => {
    if (userId) {
      setRecentBoardIds(getRecentBoards(userId));
    } else {
      setRecentBoardIds([]);
    }
  }, [userId]);

  // Combine all boards for search
  const allBoards = [...ownedBoards, ...invitedBoards];

  // Filter boards by search term
  const filteredOwnedBoards = ownedBoards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvitedBoards = invitedBoards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get recent boards that exist
  const recentBoards = recentBoardIds
    .map(id => allBoards.find(b => b.id === id))
    .filter(Boolean)
    .slice(0, MAX_RECENT_BOARDS);

  const handleCreateBoard = async (
    title: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => {
    const newBoard = await createBoard({
      name: title,
      backgroundColor,
      backgroundUrl: "",
    });

    if (backgroundImage) {
      try {
        await uploadImage({
          file: backgroundImage,
          type: "board",
          id: newBoard.id,
        });
      } catch (err) {
        console.error("Upload thất bại", err);
      }
    }
    setIsCreateDialogOpen(false);
  };

  const handleEditBoard = async (
    name: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => {
    if (!boardToEdit) return;

    await updateBoard(boardToEdit.id, {
      id: boardToEdit.id,
      name,
      backgroundColor,
      lists: [],
    });

    if (backgroundImage) {
      try {
        await uploadImage({
          file: backgroundImage,
          type: "board",
          id: boardToEdit.id,
        });
      } catch (err) {
        console.error("Upload thất bại", err);
      }
    }

    setBoardToEdit(null);
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    await deleteBoard(boardToDelete.id, boardToDelete.hasImage);
    setBoardToDelete(null);
  };

  const handleBoardClick = (boardId: string) => {
    if (userId) {
      addToRecentBoards(userId, boardId);
      setRecentBoardIds(getRecentBoards(userId));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "member":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "viewer":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="flex flex-col w-full h-full p-6 pb-20 gap-6 dark:bg-black overflow-y-auto">
        {/* Header with Search */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Organize your work and life
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boards..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Recent Boards Section (only show if there are recent boards) */}
        {!searchTerm && recentBoards.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Recent Boards
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent">
              {recentBoards.map((board: any) => (
                <div key={board.id} className="shrink-0 w-[25%]" onClick={() => handleBoardClick(board.id)}>
                  <BoardCard
                    id={board.id}
                    name={board.name}
                    backgroundUrl={board.backgroundUrl ?? undefined}
                    backgroundColor={board.backgroundColor ?? undefined}
                    onEdit={() =>
                      setBoardToEdit({
                        id: board.id,
                        name: board.name,
                        backgroundUrl: board.backgroundUrl ?? undefined,
                        backgroundColor: board.backgroundColor ?? undefined,
                      })
                    }
                    onDelete={() =>
                      setBoardToDelete({
                        id: board.id,
                        name: board.name,
                        hasImage: !!board.backgroundUrl,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Boards Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clipboard className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-black dark:text-white">
              My Boards
            </h2>
            <Badge variant="secondary" className="ml-1">
              {filteredOwnedBoards.length}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Create New Board Card - Always visible */}
            <Card
              className="flex flex-col justify-center items-start border-2 border-gray-500 border-dashed transition-all cursor-pointer hover:border-gray-400 hover:bg-gray-300/20 w-full min-h-[120px]"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <CardContent className="w-full flex flex-col items-center gap-2">
                <Plus className="mb-2 w-8 h-8 text-gray-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-white">
                  Create new board
                </p>
              </CardContent>
            </Card>

            {filteredOwnedBoards.map((board) => (
              <div key={board.id} onClick={() => handleBoardClick(board.id)}>
                <BoardCard
                  id={board.id}
                  name={board.name}
                  backgroundUrl={board.backgroundUrl ?? undefined}
                  backgroundColor={board.backgroundColor ?? undefined}
                  onEdit={() =>
                    setBoardToEdit({
                      id: board.id,
                      name: board.name,
                      backgroundUrl: board.backgroundUrl ?? undefined,
                      backgroundColor: board.backgroundColor ?? undefined,
                    })
                  }
                  onDelete={() =>
                    setBoardToDelete({
                      id: board.id,
                      name: board.name,
                      hasImage: !!board.backgroundUrl,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Invited Boards Section */}
        {filteredInvitedBoards.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Invited Boards
              </h2>
              <Badge variant="secondary" className="ml-1">
                {filteredInvitedBoards.length}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredInvitedBoards.map((board: any) => (
                <div key={board.id} className="relative" onClick={() => handleBoardClick(board.id)}>
                  <BoardCard
                    id={board.id}
                    name={board.name}
                    backgroundUrl={board.backgroundUrl ?? undefined}
                    backgroundColor={board.backgroundColor ?? undefined}
                    onEdit={() =>
                      setBoardToEdit({
                        id: board.id,
                        name: board.name,
                        backgroundUrl: board.backgroundUrl ?? undefined,
                        backgroundColor: board.backgroundColor ?? undefined,
                      })
                    }
                    onDelete={() =>
                      setBoardToDelete({
                        id: board.id,
                        name: board.name,
                        hasImage: !!board.backgroundUrl,
                      })
                    }
                  />
                  {/* Role Badge */}
                  <Badge
                    className={`absolute top-2 right-2 text-xs capitalize ${getRoleBadgeColor(board.role)}`}
                  >
                    {board.role}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for invited boards when searching */}
        {searchTerm && filteredInvitedBoards.length === 0 && invitedBoards.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Invited Boards
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">No matching invited boards found.</p>
          </section>
        )}

        {/* Dialogs */}
        <CreateBoardDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={handleCreateBoard}
        />

        <EditBoardDialog
          open={!!boardToEdit}
          onOpenChange={(open) => !open && setBoardToEdit(null)}
          initialName={boardToEdit?.name ?? ""}
          initialBackgroundUrl={boardToEdit?.backgroundUrl}
          initialBackgroundColor={boardToEdit?.backgroundColor}
          onSave={handleEditBoard}
        />

        <DeleteBoardDialog
          open={!!boardToDelete}
          onOpenChange={(open) => !open && setBoardToDelete(null)}
          boardName={boardToDelete?.name ?? ""}
          onConfirm={handleDeleteBoard}
        />
      </div>
    </Suspense>
  );
}
