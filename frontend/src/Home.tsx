import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import CreateBoardDialog from "@/components/create-board-dialog";
import type { BoardCardProps as Board } from "@/components/board-card";
import { BoardCard } from "@/components/board-card";
import { Clock, Clipboard } from "lucide-react";

export default function Home() {
  const theme = useTheme();

  const [boards, setBoards] = useState<Board[]>([
    {
      id: 1,
      title: "Project Alpha",
      isBackgroundImage: true,
      background:
        "https://i.pinimg.com/1200x/c0/52/9c/c0529ca16ac269033d672c1a3eb16b97.jpg",
    },
    {
      id: 2,
      title: "Personal Tasks",
      isBackgroundImage: false,
      background: "#e992ffff",
    },
    {
      id: 3,
      title: "Team Collaboration",
      isBackgroundImage: true,
      background:
        "https://i.pinimg.com/1200x/85/c4/f3/85c4f3fb4b0f6ca9d149da89bc7f9528.jpg",
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleCreateBoard = (
    title: string,
    isBackgroundImage: boolean,
    background?: string
  ): void => {
    const newBoard: Board = {
      id: Math.max(...boards.map((b) => b.id)) + 1,
      title,
      isBackgroundImage,
      background,
    };
    setBoards((prev) => [...prev, newBoard]);
    setIsDialogOpen(false);
  };

  return (
    <div className=" container mx-auto p-6 grid grid-rows-4 gap-8 ">
      <div id="all-board" className=" container  flex-col ">
        <header className="mb-8 ">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black ">My Boards</h1>
            <Clipboard className="w-5" />
          </div>
          <p className="text-muted-foreground mt-1  ">
            Organize your work and life
          </p>
        </header>

        {/* Toggle Theme */}
        <div className="mb-6">
          <Button variant="outline" onClick={theme.toggleTheme}>
            Toggle Theme
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              id={board.id}
              title={board.title}
              isBackgroundImage={board.isBackgroundImage}
              background={board.background}
            />
          ))}

          {/* Create New Board Card */}
          <Card
            className="flex flex-col items-center justify-center  border-2 border-dashed border-gray-500 hover:border-gray-400 hover:bg-gray-300/20  cursor-pointer transition-all"
            onClick={() => setIsDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center py-4 ">
              <Plus className="w-8 h-8 text-gray-500 mb-2" />
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
      <div id="recently-viewed" className="container mb-20">
        <header className="flex items-center gap-3 mt-8">
          <h1 className=" text-2xl font-bold text-black  ">Recently Viewed</h1>
          <Clock className="w-5 text-black dark:text-white" />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 my-5 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              id={board.id}
              title={board.title}
              isBackgroundImage={board.isBackgroundImage}
              background={board.background}
            />
          ))}
        </div>
        <hr />
      </div>

      {/* <div id="project" className="container">
        <header className="flex items-center gap-3 ">
          <h1 className=" text-3xl font-bold text-black  ">Your projects</h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 my-5 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard
              id={board.id}
              title={board.title}
              isBackgroundImage={board.isBackgroundImage}
              background={board.background}
            />
          ))}
        </div>
      </div> */}
    </div>
  );
}
