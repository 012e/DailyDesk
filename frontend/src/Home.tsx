import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Suspense, useState } from "react";
import CreateBoardDialog from "@/components/create-board-dialog";
import { BoardCard } from "@/components/board-card";
import { DeleteBoardDialog } from "@/components/delete-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { Clipboard } from "lucide-react";
import {
  useBoards,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "@/hooks/use-board";
import PageLoader from "./components/full-page-loader";
import { useUploadImage } from "@/hooks/use-image";

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

export default function Home() {
  const { createBoard } = useCreateBoard();
  const { updateBoard } = useUpdateBoard();
  const { deleteBoard } = useDeleteBoard();
  const { uploadImage } = useUploadImage();

  const boards = useBoards();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [boardToEdit, setBoardToEdit] = useState<BoardToEdit>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardToDelete>(null);

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

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="container grid grid-rows-4 gap-8 p-6 mx-auto">
        <div id="all-board" className="container flex-col">
          <header className="mb-8">
            <div className="flex gap-3 items-center">
              <h1 className="text-2xl font-bold text-black dark:text-white">
                My Boards
              </h1>
              <Clipboard className="w-5" />
            </div>
            <p className="mt-1 text-muted-foreground">
              Organize your work and life
            </p>
          </header>


          {/* Scrollable board grid - max 2 rows visible */}
          <div className="max-h-[310px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/70 pr-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map((board) => (
                <BoardCard
                  key={board.id}
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
              ))}
            </div>
          </div>
          
          {/* Create New Board Card - Always visible */}
          <Card
            className="flex flex-col justify-center items-center border-2 border-gray-500 border-dashed transition-all cursor-pointer hover:border-gray-400 hover:bg-gray-300/20 h-[160px] w-full max-w-[280px] my-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center py-4">
              <Plus className="mb-2 w-8 h-8 text-gray-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-white">
                Create new board
              </p>
            </CardContent>
          </Card>

          {/* Create Board Dialog */}
          <CreateBoardDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onCreate={handleCreateBoard}
          />

          {/* Edit Board Dialog */}
          <EditBoardDialog
            open={!!boardToEdit}
            onOpenChange={(open) => !open && setBoardToEdit(null)}
            initialName={boardToEdit?.name ?? ""}
            initialBackgroundUrl={boardToEdit?.backgroundUrl}
            initialBackgroundColor={boardToEdit?.backgroundColor}
            onSave={handleEditBoard}
          />

          {/* Delete Board Dialog */}
          <DeleteBoardDialog
            open={!!boardToDelete}
            onOpenChange={(open) => !open && setBoardToDelete(null)}
            boardName={boardToDelete?.name ?? ""}
            onConfirm={handleDeleteBoard}
          />
        </div>
      </div>
    </Suspense>
  );
}
