"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  username: string;
  role: string;
};

export function DashboardHeader({ username, role }: DashboardHeaderProps) {
  const router = useRouter();
  const name = username || "User";
  const roleLabel = role
    ? role
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : "";

  async function handleLogout() {
    const res = await fetch("/api/logout", { method: "POST" });
    if (!res.ok) return;
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b bg-bg-primary">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-[#0F172A]">Dashboard</h1>
        <span className="text-sm text-muted-foreground">Welcome, {name}</span>
        {roleLabel && <span className="text-xs text-muted-foreground">{roleLabel}</span>}
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
