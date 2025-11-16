import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { MouseEventHandler } from "react";

export default function PleaseLogin({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div className="flex flex-col gap-5 justify-center items-center w-screen h-screen">
      <img
        src="/henta.webp"
        className="rounded-4xl"
        width={1000}
        height={1000}
      />
      <Button onClick={onClick}>
        You are very cute UwU, please login
        <Heart fill="red" />
      </Button>
    </div>
  );
}
