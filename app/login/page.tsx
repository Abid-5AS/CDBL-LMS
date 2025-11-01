import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./components/LoginForm";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

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
    const role = user.role as string;
    const redirectMap: Record<string, string> = {
      EMPLOYEE: "/dashboard",
      DEPT_HEAD: "/manager/dashboard",
      HR_ADMIN: "/admin",
      HR_HEAD: "/hr-head/dashboard",
      CEO: "/ceo/dashboard",
    };
    const destination = redirectMap[role] || "/dashboard";
    redirect(destination);
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/brand/office-fallback.jpg"
            alt="Office workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/95 to-[#1E40AF]/95" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl">CDBL</h2>
                <p className="text-sm text-white/80">Leave Management</p>
              </div>
            </div>
            <div className="max-w-md mt-12">
              <h3 className="text-3xl mb-4">Central Depository Bangladesh Limited</h3>
              <p className="text-white/90 text-lg leading-relaxed">
                Streamline your leave requests and approvals with our comprehensive internal management system.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-sm text-white/70">
              <span>Internal Use Only</span><span>•</span><span>v1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <LoginForm />
          <div className="mt-8 text-center">
            <p className="text-[#64748B] text-xs">© 2025 Central Depository Bangladesh Limited. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Mobile Logo */}
      <div className="lg:hidden absolute top-8 left-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div><h2 className="text-[#0F172A]">CDBL</h2></div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return <div className="min-h-screen w-full bg-[#F8FAFC]" />;
}
