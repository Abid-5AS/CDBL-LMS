import { Suspense } from "react";
import { UserProvider } from "@/lib/user-context";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

async function UserFetcher({ children }: { children: React.ReactNode }) {
  const { getCurrentUser } = await import("@/lib/auth");
  const user = await getCurrentUser();
  return (
    <UserProvider user={user}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </UserProvider>
  );
}

function AuthFallback({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider user={null}>
      <LayoutWrapper>{children}</LayoutWrapper>
    </UserProvider>
  );
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthFallback>{children}</AuthFallback>}>
      <UserFetcher>{children}</UserFetcher>
    </Suspense>
  );
}
