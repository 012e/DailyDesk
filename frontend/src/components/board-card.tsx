import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import type { HTMLAttributes } from "react";
import { Link } from "react-router";

export interface BoardCardProps {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
}

export function BoardCard({
  id,
  name: title,
  backgroundUrl,
  backgroundColor,
}: BoardCardProps) {
  let backgroundStyle: HTMLAttributes<HTMLDivElement>["style"];
  if (backgroundUrl) {
    backgroundStyle = {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: "center",
    };
  } else {
    backgroundStyle = { backgroundColor };
  }
  return (
    <Link to={`/board/${id}`}>
      <Card
        key={id}
        className="overflow-hidden relative gap-0 pt-4 pb-14 bg-center bg-no-repeat bg-cover border-0 transition-all cursor-pointer hover:shadow-md dark:hover:shadow-md-white hover:scale-[1.02]"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 mb-16 pointer-events-none backdrop-blur-sm dark:bg-black/25" />

        <CardHeader className="flex justify-between items-center p-4 py-0 z-5">
          <CardTitle className="text-md font-medium overflow-hidden text-ellipsis max-w-[80%] z-10 text-">
            {title}
          </CardTitle>
          <div
            className="top-4 right-4 w-4 h-4 rounded-full pointer-events-none"
            style={backgroundStyle}
          />
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
