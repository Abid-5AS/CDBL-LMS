import { Suspense } from "react";
import { UserProvider } from "@/lib/user-context";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { getCurrentUser } from "@/lib/auth";

async function LayoutContent({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <UserProvider user={user}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </UserProvider>
  );
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen w-full bg-background"
          aria-busy="true"
          aria-live="polite"
        />
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
