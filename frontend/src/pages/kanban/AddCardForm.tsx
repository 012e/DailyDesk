import {
  KanbanBoardColumnButton,
  KanbanBoardColumnFooter,
} from "@/components/kanban";
import { CardEditDialog } from "@/components/card-edit-dialog";
import { PlusIcon, LayoutTemplate, Loader2 } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { addingCardColumnIdAtom } from "./atoms";
import { boardIdAtom } from "./atoms";
import { useBoard } from "@/hooks/use-board";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCreateCard } from "@/hooks/use-card";
import { toast } from "sonner";
import { useState } from "react";

interface AddCardFormProps {
  columnId: string;
  cardsCount: number;
}

export function AddCardForm({ columnId, cardsCount }: AddCardFormProps) {
  const [addingCardColumnId, setAddingCardColumnId] = useAtom(
    addingCardColumnIdAtom
  );
  const boardId = useAtomValue(boardIdAtom);
  const board = useBoard({ boardId: boardId || "" });
  const { mutate: createCard } = useCreateCard();
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);

  const isDialogOpen = addingCardColumnId === columnId;

  const openDialog = () => {
    setAddingCardColumnId(columnId);
  };

  const closeDialog = () => {
    setAddingCardColumnId(null);
  };

  // Filter templates from all cards in the board
  // We use 'any' type cast here because the useBoard hook return type might not have been fully updated in the frontend code
  // to reflect the 'isTemplate' property we just added to the type definition.
  const templates = (board?.lists?.flatMap(l => l.cards) || []).filter((c: any) => c.isTemplate);

  const handleCreateFromTemplate = (template: any) => {
    if (!boardId) return;
    setIsCreatingFromTemplate(true);
    
    // Create new card copying properties from template but excluding specific fields like dates/comments
    createCard(
      {
        boardId,
        listId: columnId,
        name: template.name || template.title, // Handle both 'name' (backend) and 'title' (frontend) property names
        order: cardsCount,
        description: template.description || undefined,
        labels: template.labels || undefined,
        members: template.members || undefined,
        coverColor: template.coverColor || undefined,
        // We don't copy dates or comments/activity
      },
      {
        onSuccess: () => {
          toast.success("Card created from template");
          setIsCreatingFromTemplate(false);
        },
        onError: () => {
          toast.error("Failed to create card from template");
          setIsCreatingFromTemplate(false);
        }
      }
    );
  };

  return (
    <>
      <KanbanBoardColumnFooter className="flex gap-1">
        <KanbanBoardColumnButton onClick={openDialog} className="flex-1">
          <PlusIcon className="mr-2 size-4" />
          Add Card
        </KanbanBoardColumnButton>
        
        {templates.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" disabled={isCreatingFromTemplate}>
                 {isCreatingFromTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                    <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                 )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <div className="text-sm font-medium mb-2 px-2 text-muted-foreground">Create from template</div>
              <div className="grid gap-1 max-h-[300px] overflow-y-auto">
                {templates.map(card => (
                  <Button 
                    key={card.id} 
                    variant="ghost" 
                    className="justify-start font-normal h-auto py-2 px-2 text-left" 
                    onClick={() => handleCreateFromTemplate(card)}
                  >
                    <div className="flex flex-col gap-1 items-start overflow-hidden w-full">
                       <span className="truncate w-full font-medium">{card.name || (card as any).title}</span>
                       {card.labels && card.labels.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {card.labels.slice(0, 3).map(l => (
                               <div key={l.id} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: l.color }}></div>
                            ))}
                          </div>
                       )}
                    </div>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </KanbanBoardColumnFooter>

      {boardId && (
        <CardEditDialog
          boardId={boardId}
          listId={columnId}
          order={cardsCount}
          isOpen={isDialogOpen}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
