import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { UserProvider } from "@/lib/user-context";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

async function AuthLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await getCurrentUser();
    return (
      <UserProvider user={user}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </UserProvider>
    );
  } catch (error) {
    // Handle prerendering errors or auth errors gracefully
    return (
      <UserProvider user={null}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </UserProvider>
    );
  }
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <UserProvider user={null}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </UserProvider>
    }>
      <AuthLayout>{children}</AuthLayout>
    </Suspense>
  );
}

