import { Search } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useGroupedSearch } from "@/hooks/use-search";
import { useDebounce } from "use-debounce"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  const { data, isLoading, groupedResults, error } = useGroupedSearch({
    query: debouncedQuery,
    enabled: open && debouncedQuery.length > 0,
  });

  const handleSelect = useCallback(
    (type: string, id: string, boardId?: string) => {
      setOpen(false);
      setSearchQuery("");

      // Navigate based on result type
      if (type === "board") {
        navigate(`/kanban/${id}`);
      } else if (type === "card" && boardId) {
        navigate(`/kanban/${boardId}?cardId=${id}`);
      } else if (type === "list" && boardId) {
        navigate(`/kanban/${boardId}?listId=${id}`);
      } else if (type === "comment" && boardId) {
        navigate(`/kanban/${boardId}?cardId=${id}`);
      } else if (type === "checklist" && boardId) {
        navigate(`/kanban/${boardId}?cardId=${id}`);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = data && data.results && data.results.length > 0;

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex-1 max-w-2xl h-10 px-3 py-2 text-sm bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Search for boards, cards, lists...
          </span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </button>

      {/* Command Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shouldFilter={false}
        title="Search"
        description="Search for boards, cards, lists, and more"
      >
        <CommandInput
          placeholder="Search for boards, cards, lists..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Searching...</span>
              </div>
            </div>
          )}

          {!isLoading && !hasResults && debouncedQuery && (
            <CommandEmpty>No results found</CommandEmpty>
          )}

          {!isLoading && hasResults && (
            <>
            {/* Boards */}
            {groupedResults.board && groupedResults.board.length > 0 && (
              <CommandGroup heading="Boards">
                {groupedResults.board.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("board", result.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {result.background && (
                        <div
                          className="w-8 h-6 rounded shrink-0"
                          style={{
                            background: result.background.startsWith("#")
                              ? result.background
                              : `url(${result.background})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                      <span className="flex-1 truncate">{result.name}</span>
                      {result.isFavorite && <Badge variant="secondary">★</Badge>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Cards */}
            {groupedResults.card && groupedResults.card.length > 0 && (
              <CommandGroup heading="Cards">
                {groupedResults.card.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("card", result.id, result.boardId)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.title}</span>
                        {result.labels && result.labels.length > 0 && (
                          <div className="flex gap-1">
                            {result.labels.slice(0, 3).map((label: any) => (
                              <div
                                key={label.id}
                                className="w-8 h-2 rounded"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.boardName} • {result.listName}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Lists */}
            {groupedResults.list && groupedResults.list.length > 0 && (
              <CommandGroup heading="Lists">
                {groupedResults.list.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("list", result.id, result.boardId)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium truncate">{result.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.boardName} • {result.cardCount} cards
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Comments */}
            {groupedResults.comment && groupedResults.comment.length > 0 && (
              <CommandGroup heading="Comments">
                {groupedResults.comment.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("comment", result.cardId, result.boardId)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <span className="truncate line-clamp-2">{result.content}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.authorName} • {result.cardTitle} • {result.boardName}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Labels */}
            {groupedResults.label && groupedResults.label.length > 0 && (
              <CommandGroup heading="Labels">
                {groupedResults.label.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("label", result.id, result.boardId)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="w-12 h-6 rounded"
                        style={{ backgroundColor: result.color }}
                      />
                      <span className="flex-1 truncate">{result.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.cardCount} cards
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Checklist Items */}
            {groupedResults.checklist && groupedResults.checklist.length > 0 && (
              <CommandGroup heading="Checklist Items">
                {groupedResults.checklist.map((result: any) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect("checklist", result.cardId, result.boardId)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className={cn(result.isChecked && "line-through text-muted-foreground")}>
                          {result.text}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.cardTitle} • {result.boardName}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
