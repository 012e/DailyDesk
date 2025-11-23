import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router";

export interface BoardCardProps {
  id: number;
  title: string;
  isBackgroundImage: boolean;
  background?: string;
}

export function BoardCard({
  id,
  title,
  isBackgroundImage,
  background,
}: BoardCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/kanban/${id}`);
  };

  return (
    <Card
      key={id}
      onClick={handleClick}
      className="cursor-pointer pt-4 pb-14 bg-cover bg-center bg-no-repeat overflow-hidden gap-0 relative transition-all hover:shadow-md dark:hover:shadow-md-white  hover:scale-[1.02] border-0"
      style={
        isBackgroundImage
          ? {
              backgroundImage: `url(${background})`,
              backgroundSize: "center",
            }
          : { backgroundColor: background }
      }
    >
      <div className="absolute inset-0 mb-16 backdrop-blur-sm  dark:bg-black/25  pointer-events-none" />

      <CardHeader className="flex items-center justify-between p-4 py-0 z-5">
        <CardTitle className="text-md font-medium overflow-hidden text-ellipsis max-w-[80%] z-10 text-">
          {title}
        </CardTitle>
        <div
          className="top-4 right-4 h-4 w-4 rounded-full  pointer-events-none"
          style={
            isBackgroundImage
              ? theme.theme === "dark"
                ? { backgroundColor: "white" }
                : { backgroundColor: "black" }
              : { backgroundColor: background, backgroundSize: "cover" }
          }
        />
      </CardHeader>
      <CardContent className="p-4 pt-0 z-10 ">
        <p className="text-sm text-muted-foreground text-black dark:text-gray-200">
          Click to open board
        </p>
      </CardContent>
    </Card>
  );
}
