import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function AlertDialogDemo() {
  const theme = useTheme();
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Button variant="outline" onClick={theme.toggleTheme}>
        Toggle Theme
      </Button>
    </div>
  );
}
