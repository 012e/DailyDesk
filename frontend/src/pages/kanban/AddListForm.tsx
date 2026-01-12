import { kanbanBoardColumnClassNames } from "@/components/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { isAddingListAtom, newListTitleAtom } from "./atoms";

interface AddListFormProps {
  onAddList: (title: string) => void;
}

export function AddListForm({ onAddList }: AddListFormProps) {
  const [isAddingList, setIsAddingList] = useAtom(isAddingListAtom);
  const [newListTitle, setNewListTitle] = useAtom(newListTitleAtom);
  const addListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAddingList &&
        addListRef.current &&
        !addListRef.current.contains(event.target as Node)
      ) {
        setIsAddingList(false);
        setNewListTitle("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddingList, setIsAddingList, setNewListTitle]);

  const handleAdd = () => {
    if (newListTitle.trim()) {
      onAddList(newListTitle);
      setNewListTitle("");
      setIsAddingList(false);
    }
  };

  const handleCancel = () => {
    setIsAddingList(false);
    setNewListTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isAddingList) {
    return (
      <div ref={addListRef} className={kanbanBoardColumnClassNames}>
        <div className="px-2 space-y-2">
          <Input
            autoFocus
            placeholder="Enter list title..."
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newListTitle.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="ml-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className="justify-start py-2 px-3 h-fit shrink-0 w-64 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition-all"
      onClick={() => setIsAddingList(true)}
    >
      <PlusIcon className="mr-2 size-4 " />
      Add List
    </Button>
  );
}
