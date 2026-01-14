import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, LayoutTemplate } from "lucide-react";
import { Suspense, useState } from "react";
import CreateBoardDialog from "@/components/create-board-dialog";
import TemplateGalleryDialog from "@/components/template-gallery-dialog";
import { BoardCard } from "@/components/board-card";
import { DeleteBoardDialog } from "@/components/delete-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { Clipboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState<boolean>(false);
  const [boardToEdit, setBoardToEdit] = useState<BoardToEdit>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardToDelete>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col w-full h-full p-6 gap-8 dark:bg-black">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex gap-3 items-center">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  My Boards
                </h1>
                <Clipboard className="w-5" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateGalleryOpen(true)}
                  className="ml-2 flex items-center gap-2"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  Browse Templates
                </Button>
              </div>
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



          <div className="max-h-100vh overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/70">
            <div className="grid  gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              
          {/* Create New Board Card - Always visible */}
          <Card
            className="flex flex-col justify-center items-start border-2 border-gray-500 border-dashed transition-all cursor-pointer hover:border-gray-400 hover:bg-gray-300/20 w-full "
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <CardContent className=" w-full flex flex-col items-center gap-2">
              <Plus className="mb-2 w-8 h-8 text-gray-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-white">
                Create new board
              </p>
            </CardContent>
          </Card>

              {filteredBoards.map((board) => (
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

          {/* Template Gallery Dialog */}
          <TemplateGalleryDialog
            open={isTemplateGalleryOpen}
            onOpenChange={setIsTemplateGalleryOpen}
          />

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
