"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Calendar,
  Loader2,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getHomePageForRole } from "@/lib/navigation";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

// Label Component (Upgraded with gradient text)
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-sm font-medium mb-1.5 text-gradient-label",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Input Component (Enhanced)
const inputVariants = cva(
  [
    "flex w-full min-w-0 rounded-xl border bg-bg-secondary/70 px-4 py-1 text-base shadow-xs",
    "transition-all duration-200 ease-out outline-none",
    "placeholder:text-text-secondary",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-card-action",
    "focus-visible:ring-4 focus-visible:ring-card-action/20",
  ],
  {
    variants: {
      size: {
        default: "h-12 text-sm",
        lg: "h-14 text-base",
      },
      hasIcon: {
        true: "pl-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface InputProps
  extends Omit<ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasIcon, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, hasIcon, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Button Component (Enhanced)
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2.5 whitespace-nowrap",
    "rounded-xl text-sm font-semibold",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-60",
    "[&_svg:not([class*='size-'])]:size-5",
    "outline-none",
    "focus-visible:ring-4 focus-visible:ring-card-action/30",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "hover:shadow-lg",
  ],
  {
    variants: {
      variant: {
        gradient: [
          "text-text-inverted shadow-lg shadow-indigo-500/30",
          "bg-gradient-to-r from-card-action to-data-info",
          "hover:from-card-action hover:to-data-info",
        ],
        outline:
          "border border-border-strong bg-bg-primary text-text-secondary shadow-sm hover:bg-bg-secondary",
        ghost: "hover:bg-bg-secondary shadow-none",
        link: "text-card-action hover:text-card-action shadow-none p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 py-2",
        lg: "h-12 rounded-xl px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "default",
    },
  }
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// CDBL Logo Component
function CDBLLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-12 h-12", className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
      <path
        d="M14 14H24V16H16V32H24V34H14V14Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M26 14H36V23C36 24.1046 35.1046 25 34 25H28C26.8954 25 26 24.1046 26 23V14Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path d="M26 27H36V34H26V27Z" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Login Illustration Component
function LoginIllustration() {
  return (
    <motion.div
      className="relative w-full max-w-lg"
      animate={{
        y: [0, -15, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <CheckSquare
        className="absolute -top-16 -left-16 size-32 text-text-secondary/80 -rotate-12"
        strokeWidth={1}
      />
      <Calendar
        className="relative z-10 w-full h-auto text-text-secondary/90"
        strokeWidth={1}
      />
      <div className="absolute -bottom-16 -right-16 size-40 bg-data-info/10 rounded-full blur-3xl" />
      <div className="absolute top-0 -left-16 size-40 bg-card-action/10 rounded-full blur-3xl" />
    </motion.div>
  );
}

// Main Login Form Component
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Step State
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number>(600); // 10 minutes in seconds
  const [resendingOtp, setResendingOtp] = useState(false);

  // Countdown timer for OTP expiry
  React.useEffect(() => {
    if (!showOtpStep || otpExpiry <= 0) return;

    const timer = setInterval(() => {
      setOtpExpiry((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpStep, otpExpiry]);

  // Format countdown timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = data.error || "Login failed";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);

        // Add shake animation
        const form = e.currentTarget;
        if (form && form instanceof HTMLFormElement) {
          form.classList.add("animate-shake-x", "animate-duration-500ms");
          setTimeout(() => {
            form.classList.remove("animate-shake-x", "animate-duration-500ms");
          }, 500);
        }
        return;
      }

      // Check if OTP is required
      if (data.requiresOtp) {
        setShowOtpStep(true);
        setOtpExpiry(data.expiresIn || 600);
        toast.success("Verification code sent to your email!");
        setLoading(false);
        return;
      }

      // Old flow (shouldn't happen with 2FA enabled)
      toast.success("Login successful!");
      const role = data?.user?.role;
      if (typeof window !== "undefined") {
        const destination = getHomePageForRole(role as any) || "/dashboard";
        window.location.assign(destination);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = data.error || "Invalid verification code";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);

        // Add shake animation
        const form = e.currentTarget;
        if (form && form instanceof HTMLFormElement) {
          form.classList.add("animate-shake-x", "animate-duration-500ms");
          setTimeout(() => {
            form.classList.remove("animate-shake-x", "animate-duration-500ms");
          }, 500);
        }
        return;
      }

      toast.success("Login successful!");

      // Role-based redirect
      const role = data?.user?.role;
      if (typeof window !== "undefined") {
        const destination = getHomePageForRole(role as any) || "/dashboard";
        window.location.assign(destination);
      } else {
        const destination = "/dashboard";
        router.replace(destination);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  }

  async function onResendOtp() {
    setResendingOtp(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to resend code");
        setResendingOtp(false);
        return;
      }

      setOtpExpiry(data.expiresIn || 600);
      setOtp(""); // Clear the OTP input
      toast.success("New verification code sent!");
      setResendingOtp(false);
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
      setResendingOtp(false);
    }
  }

  const getAnimationDelay = (index: number) => ({
    animationDelay: `${index * 100}ms`,
  });

  return (
    <div className="w-full max-w-md p-8 md:p-10 animate-fade-in-up animate-duration-700ms animate-ease-out">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div
          className="flex flex-col items-center text-center space-y-4 animate-fade-in animate-duration-500ms"
          style={getAnimationDelay(1)}
        >
          <CDBLLogo />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r bg-bg-secondary bg-bg-secondary">
            Welcome Back
          </h2>
          <p className="text-lg text-text-secondary">
            Sign in to your CDBL account
          </p>
        </div>

        {/* Form */}
        {!showOtpStep ? (
          // Email & Password Step
          <form onSubmit={onSubmit} className="space-y-6">
            <div
              className="space-y-2 animate-fade-in-up animate-duration-500ms"
              style={getAnimationDelay(2)}
            >
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-text-secondary"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@cdbl.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  hasIcon
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  aria-required="true"
                />
              </div>
            </div>

            <div
              className="space-y-2 animate-fade-in-up animate-duration-500ms"
              style={getAnimationDelay(3)}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm font-medium"
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-text-secondary"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  hasIcon
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  id="login-error"
                  role="alert"
                  aria-live="polite"
                  className="flex items-center gap-2 text-sm text-data-error bg-data-error/10 border border-data-error p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="size-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="animate-fade-in-up animate-duration-500ms"
              style={getAnimationDelay(4)}
            >
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
                aria-busy={loading}
              >
                {loading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="size-5" aria-hidden="true" />}
              </Button>
            </div>
          </form>
        ) : (
          // OTP Verification Step
          <motion.form
            onSubmit={onVerifyOtp}
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <p className="text-sm text-text-secondary">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                className="text-center text-2xl tracking-widest font-bold"
                aria-invalid={!!error}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  Code expires in: <strong className={otpExpiry < 60 ? "text-data-error" : "text-data-success"}>{formatTime(otpExpiry)}</strong>
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm font-medium"
                  onClick={onResendOtp}
                  disabled={resendingOtp || otpExpiry > 540} // Allow resend after 1 minute
                >
                  {resendingOtp ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-2 text-sm text-data-error bg-data-error/10 border border-data-error p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="size-5 animate-spin" />}
                {loading ? "Verifying..." : "Verify & Login"}
                {!loading && <ArrowRight className="size-5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowOtpStep(false);
                  setOtp("");
                  setError(null);
                }}
              >
                Back to Login
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}

// Export illustration for use in page
export { LoginIllustration };
