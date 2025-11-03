"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Users, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

type SearchResult = {
  id: number;
  type: "leave" | "employee" | "holiday";
  title: string;
  subtitle: string;
  url: string;
  metadata: Record<string, any>;
};

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ leaves: SearchResult[]; employees: SearchResult[]; holidays: SearchResult[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          setResults({ leaves: [], employees: [], holidays: [] });
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults({ leaves: [], employees: [], holidays: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (url: string) => {
    router.push(url);
    onOpenChange(false);
    setQuery("");
    setResults(null);
  };

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return results.leaves.length + results.employees.length + results.holidays.length;
  }, [results]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search across leaves, employees, and holidays">
      <CommandInput
        placeholder="Search leaves, employees, holidays..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && query.length >= 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        
        {!isLoading && query.length >= 2 && results && totalResults === 0 && (
          <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
        )}

        {!isLoading && results && (
          <>
            {results.leaves.length > 0 && (
              <CommandGroup heading="Leave Requests">
                {results.leaves.map((result) => (
                  <CommandItem
                    key={`leave-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.employees.length > 0 && (
              <CommandGroup heading="Employees">
                {results.employees.map((result) => (
                  <CommandItem
                    key={`employee-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.holidays.length > 0 && (
              <CommandGroup heading="Holidays">
                {results.holidays.map((result) => (
                  <CommandItem
                    key={`holiday-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="cursor-pointer"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search...
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

