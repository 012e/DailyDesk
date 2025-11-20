import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";

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
  return (
    <Card
      key={id}
      className="cursor-pointer pt-4 pb-14 overflow-hidden gap-0 relative transition-all hover:shadow-md dark:hover:shadow-md-white  hover:scale-[1.02] "
      style={
        isBackgroundImage
          ? {
              backgroundImage: `url(${background})`,
              backgroundSize: "cover",
            }
          : { backgroundColor: background }
      }
    >
      <div className="absolute inset-0 mb-8 bg-white/5  backdrop-blur-md dark:bg-black/20  pointer-events-none" />

      <CardHeader className="flex items-center justify-between p-4 py-0 z-5">
        <CardTitle className="text-md font-medium overflow-hidden text-ellipsis max-w-[80%] z-10">
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
        <p className="text-sm text-muted-foreground dark:text-gray-200">
          Click to open board
        </p>
      </CardContent>
    </Card>
  );
}
