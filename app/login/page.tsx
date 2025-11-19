import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole } from "@/lib/navigation";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginGate />
    </Suspense>
  );
}

async function LoginGate() {
  noStore();
  const user = await getCurrentUser();
  if (user) {
    const role = user.role as any;
    const destination = getHomePageForRole(role) || "/dashboard";
    redirect(destination);
  }

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-zinc-950">
      {/* Left Side - Brand / Aesthetic */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-900 to-zinc-950" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="mb-8">
             <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
             </div>
             <h1 className="text-4xl font-bold tracking-tight mb-4">CDBL Leave Management</h1>
             <p className="text-zinc-400 text-lg leading-relaxed">
               Streamline your workforce management with our secure and efficient leave approval system.
             </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span>Secure Enterprise Access</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span>Real-time Approval Workflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <LoginForm />
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Central Depository Bangladesh Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950" />;
}
