"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleLogout = async () => {
    if (loading || pending) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error("logout_failed");
      }
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || pending;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={disabled}
      className={className}
    >
      {disabled ? "Signing out..." : "Log out"}
    </Button>
  );
}
