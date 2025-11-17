import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole } from "@/lib/navigation";
import { LoginForm, LoginIllustration } from "./components/LoginForm";

const stats = [
  { label: "Employees onboarded", value: "3.4K+" },
  { label: "Leaves processed monthly", value: "28K" },
  { label: "Avg. approval time", value: "2m" },
];

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
    <div className="relative min-h-screen bg-[#040916] text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,73,255,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(23,173,173,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col gap-8 lg:flex-row">
        {/* Inspiration / Highlights Panel */}
        <section className="relative flex flex-1 flex-col justify-between px-8 py-12 lg:px-14">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
              <span className="inline-flex size-2 rounded-full bg-emerald-300 animate-pulse" />
              Secure Access
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Seamless leave management for every role at{" "}
                <span className="text-card-action">CDBL</span>
              </h1>
              <p className="text-base text-white/70 md:text-lg">
                Centralize approvals, real-time balances, and policy insights in one secure
                dashboard. Continue where you left off with confidence.
              </p>
            </div>

            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-2 rounded-full bg-card-action" />
                Unified login for HR, Department Heads, and Executives with contextual dashboards.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-2 rounded-full bg-data-info" />
                MFA-backed security with device trust indicators and audit-friendly reporting.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-2 rounded-full bg-amber-400" />
                Built-in OTP verification ensures payroll-sensitive flows stay protected.
              </li>
            </ul>

            <dl className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                >
                  <dt className="text-xs uppercase tracking-wide text-white/60">{stat.label}</dt>
                  <dd className="text-2xl font-semibold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-3xl lg:mt-0">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Live system pulse</p>
              <p className="text-xl font-semibold text-white">
                99.9% uptime and real-time policy alerts
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1 text-white/70 text-sm">
                Monitor approvals, blackout periods, and SLA adherence while your teams stay in sync.
              </div>
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-white/10 p-4 backdrop-blur-xl">
                <LoginIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* Form Panel */}
        <section className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:max-w-xl lg:px-10 lg:py-20">
          <div className="w-full">
            <LoginForm />
            <div className="mt-8 text-center text-xs text-muted-foreground">
              v2.1 · Secure by CDBL HRD
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LoginFallback() {
  return <div className="min-h-screen w-full bg-bg-primary" />;
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
