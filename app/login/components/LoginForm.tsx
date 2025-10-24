"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirectAfterLogin } from "../redirect-after-login";

type LiteUser = { id: string; name: string; email: string; role: string };

export function LoginForm() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<LiteUser[]>([]);
  const [selected, setSelected] = useState<LiteUser | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    try {
      const res = await fetch(`/api/auth/users?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        throw new Error("search failed");
      }
      const data = await res.json();
      setUsers(data.items ?? []);
    } catch {
      toast.error("Unable to fetch users");
    }
  }

  async function onSubmit() {
    if (!selected) {
      toast("Please select your account");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selected.email }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Login failed");
        return;
      }
      await redirectAfterLogin();
      return;
    } catch (err) {
      const anyErr = err as { digest?: string };
      if (anyErr?.digest === "NEXT_REDIRECT") {
        throw err;
      }
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selected ? `${selected.name} (${selected.role})` : "Search your name or email"}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Type name or email..." value={query} onValueChange={(v) => search(v)} />
            <CommandList>
              <CommandEmpty>No users found</CommandEmpty>
              <CommandGroup heading="Users">
                {users.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id}
                    onSelect={() => {
                      setSelected(u);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected?.id === u.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.email} · {u.role}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button className="w-full" onClick={onSubmit} disabled={!selected || loading}>
        {loading ? "Signing in..." : "Login"}
      </Button>
    </div>
  );
}
