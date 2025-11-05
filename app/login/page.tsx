import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole } from "@/lib/navigation";
import { LoginForm, LoginIllustration } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <LoginStyles />
      <Suspense fallback={<LoginFallback />}>
        <LoginGate />
      </Suspense>
    </>
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
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Panel (40%) - Illustration */}
      <div className="hidden lg:flex lg:w-2/5 bg-gray-50/70 p-12 relative items-center justify-center overflow-hidden">
        <LoginIllustration />
      </div>

      {/* Right Panel (60%) - Form */}
      <div className="flex-1 lg:w-3/5 flex flex-col items-center justify-center p-8 relative">
        <div className="flex-1 flex items-center justify-center w-full">
          <LoginForm />
        </div>
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            v2.0 © CDBL HRD
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return <div className="min-h-screen w-full bg-white" />;
}

// Styles component for animations and gradients
function LoginStyles() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Gradient label style */
        .text-gradient-label {
          background: linear-gradient(to right, #3730a3, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }

        /* Animation utilities */
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-shake-x {
          animation: shake-x 0.5s ease-out;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake-x {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-10px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(10px);
          }
        }

        .animate-duration-500ms {
          animation-duration: 500ms;
        }

        .animate-duration-700ms {
          animation-duration: 700ms;
        }

        .animate-delay-100ms {
          animation-delay: 100ms;
        }

        .animate-delay-200ms {
          animation-delay: 200ms;
        }

        .animate-delay-300ms {
          animation-delay: 300ms;
        }

        .animate-delay-400ms {
          animation-delay: 400ms;
        }

        .animate-delay-500ms {
          animation-delay: 500ms;
        }

        .animate-ease-out {
          animation-timing-function: ease-out;
        }
      `
    }} />
  );
}
