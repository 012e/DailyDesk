import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Suspense, useState } from "react";
import CreateBoardDialog from "@/components/create-board-dialog";
import { BoardCard } from "@/components/board-card";
import { Clipboard } from "lucide-react";
import { useBoards, useCreateboard } from "@/hooks/use-board";
import PageLoader from "./components/full-page-loader";

export default function Home() {
  const { createBoard } = useCreateboard();

  const boards = useBoards();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleCreateBoard = async (
    title: string,
    backgroundColor?: string,
    backgroundUrl?: string,
  ) => {
    createBoard({
      name: title,
      backgroundColor,
      backgroundUrl,
    });
    setIsDialogOpen(false);
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="container grid grid-rows-4 gap-8 p-6 mx-auto">
        <div id="all-board" className="container flex-col">
          <header className="mb-8">
            <div className="flex gap-3 items-center">
              <h1 className="text-2xl font-bold text-black">My Boards</h1>
              <Clipboard className="w-5" />
            </div>
            <p className="mt-1 text-muted-foreground">
              Organize your work and life
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                id={board.id}
                name={board.name}
                backgroundUrl={board.backgroundUrl}
                backgroundColor={board.backgroundColor}
              />
            ))}

            {/* Create New Board Card */}
            <Card
              className="flex flex-col justify-center items-center border-2 border-gray-500 border-dashed transition-all cursor-pointer hover:border-gray-400 hover:bg-gray-300/20"
              onClick={() => setIsDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center py-4">
                <Plus className="mb-2 w-8 h-8 text-gray-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-white">
                  Create new board
                </p>
              </CardContent>
            </Card>
          </div>

          <CreateBoardDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onCreate={handleCreateBoard}
          />
        </div>
        {/* <div id="recently-viewed" className="container mb-20"> */}
        {/*   <header className="flex gap-3 items-center mt-8"> */}
        {/*     <h1 className="text-2xl font-bold text-black">Recently Viewed</h1> */}
        {/*     <Clock className="w-5 text-black dark:text-white" /> */}
        {/*   </header> */}
        {/**/}
        {/*   <div className="grid grid-cols-1 gap-4 my-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> */}
        {/*     {boards.map((board) => ( */}
        {/*       <BoardCard */}
        {/*         id={board.id} */}
        {/*         name={board.name} */}
        {/*         isBackgroundImage={board.isBackgroundImage} */}
        {/*         background={board.background} */}
        {/*       /> */}
        {/*     ))} */}
        {/*   </div> */}
        {/*   <hr /> */}
        {/* </div> */}
      </div>
    </Suspense>
  );
}
