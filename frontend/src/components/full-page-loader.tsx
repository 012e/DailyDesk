import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export default function PageLoader({
  className,
  text = "Loading",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div className="flex flex-col gap-3 justify-center items-center w-full h-full">
      <Spinner className={cn("size-10", className)} />
      <h2 className="text-2xl font-bold tracking-tight">{text}</h2>
    </div>
  );
}
