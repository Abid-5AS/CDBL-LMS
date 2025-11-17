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
  Sparkles,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getHomePageForRole } from "@/lib/navigation";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";

// Label Component (Upgraded with gradient text and better hierarchy)
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-sm font-semibold mb-2 bg-gradient-to-r from-foreground to-card-action/90 bg-clip-text text-transparent tracking-tight",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Input Component (Enhanced with Glassmorphic Styling)
const inputVariants = cva(
  [
    "flex w-full min-w-0 rounded-xl border border-border/40 bg-bg-secondary/50 px-4 py-1 text-base shadow-sm",
    "backdrop-blur-md",
    "transition-all duration-200 ease-out outline-none",
    "placeholder:text-text-secondary",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-card-action focus-visible:border-opacity-100",
    "focus-visible:ring-4 focus-visible:ring-card-action/20",
    "hover:border-border/60 hover:bg-bg-secondary/60",
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

// Button Component (Enhanced with Glassmorphic Styling)
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
    "hover:shadow-xl",
  ],
  {
    variants: {
      variant: {
        gradient: [
          "text-text-inverted shadow-lg shadow-card-action/40",
          "bg-gradient-to-r from-card-action to-data-info",
          "hover:from-card-action/90 hover:to-data-info/90",
        ],
        outline:
          "border border-border-strong/40 backdrop-blur-md bg-bg-secondary/40 text-text-secondary shadow-sm hover:bg-bg-secondary/60 hover:border-border-strong/60",
        ghost: "hover:bg-bg-secondary/40 backdrop-blur-sm shadow-none",
        link: "text-card-action hover:text-card-action/80 shadow-none p-0 h-auto transition-colors",
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
  const [rememberDevice, setRememberDevice] = useState(true);
  const [skipOtp, setSkipOtp] = useState(false); // Testing toggle

  // OTP Step State
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number>(600); // 10 minutes in seconds
  const [resendingOtp, setResendingOtp] = useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const otpInputRef = React.useRef<React.ElementRef<typeof InputOTP>>(null);
  const focusOtpInput = React.useCallback(() => {
    if (!otpInputRef.current) return;
    requestAnimationFrame(() => otpInputRef.current?.focus());
  }, []);

  // Countdown timer for OTP expiry
  React.useEffect(() => {
    if (!showOtpStep || otpExpiry <= 0) return;

    const timer = setInterval(() => {
      setOtpExpiry((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpStep, otpExpiry]);

  // Auto-focus OTP input when OTP step is shown
  React.useEffect(() => {
    if (!showOtpStep) return;
    focusOtpInput();
  }, [showOtpStep, focusOtpInput]);

  // Auto-focus email field on initial render
  React.useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

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

      // Check if OTP is required (skip if testing toggle is enabled)
      if (data.requiresOtp && !skipOtp) {
        setShowOtpStep(true);
        setOtpExpiry(data.expiresIn || 600);
        toast.success("Verification code sent to your email!");
        setLoading(false);
        return;
      }

      // Direct login flow (when OTP is skipped or not required)
      toast.success(
        "Login successful!" + (skipOtp ? " (OTP verification skipped)" : "")
      );
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
      focusOtpInput();
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
      setResendingOtp(false);
    }
  }

  const getAnimationDelay = (index: number) => ({
    animationDelay: `${index * 100}ms`,
  });
  const authSteps = React.useMemo(
    () => [
      {
        label: "Credentials",
        description: "Email & password",
        state: showOtpStep ? "completed" : "active",
      },
      {
        label: "Verification",
        description: "OTP security",
        state: showOtpStep ? "active" : "upnext",
      },
    ],
    [showOtpStep]
  );

  return (
    <div className="w-full max-w-md p-8 md:p-10 animate-fade-in-up animate-duration-700ms animate-ease-out rounded-2xl border border-border/30 bg-bg-secondary/40 backdrop-blur-xl shadow-2xl shadow-card-action/10">
      {/* Decorative Background Gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -right-1/2 size-96 bg-gradient-to-br from-card-action/20 to-data-info/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 size-96 bg-gradient-to-tr from-data-info/20 to-card-action/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="flex flex-col space-y-8 relative">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <CDBLLogo />
          </motion.div>
          <motion.h2
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-card-action to-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Sign in to your CDBL account
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {authSteps.map((step) => {
            const stateStyles =
              step.state === "active"
                ? "border-card-action/60 bg-card-action/10 text-card-action"
                : step.state === "completed"
                ? "border-data-success/50 bg-data-success/10 text-data-success"
                : "border-border/40 bg-bg-secondary/40 text-muted-foreground";
            const stateLabel =
              step.state === "completed"
                ? "Completed"
                : step.state === "active"
                ? "In progress"
                : "Up next";
            return (
              <div
                key={step.label}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition-all duration-200",
                  "shadow-inner shadow-background/30 backdrop-blur-md",
                  stateStyles
                )}
              >
                <p className="text-[10px] uppercase tracking-[0.3em]">
                  {stateLabel}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Form */}
        {!showOtpStep ? (
          // Email & Password Step
          <motion.form
            onSubmit={onSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="space-y-2 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors group-focus-within:text-card-action"
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
                  ref={emailInputRef}
                  autoComplete="username"
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  aria-required="true"
                  className="transition-all hover:border-card-action/50"
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-2 group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm font-medium hover:scale-105 transition-transform"
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors group-focus-within:text-card-action"
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
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                  aria-required="true"
                  className="transition-all hover:border-card-action/50"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 }}
            >
              <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-bg-secondary/40 px-4 py-3 backdrop-blur-md">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Trust this device
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rememberDevice
                      ? "We will minimize OTP prompts for 30 days."
                      : "OTP will be requested for every new sign-in."}
                  </p>
                </div>
                <Switch
                  checked={rememberDevice}
                  onCheckedChange={setRememberDevice}
                  aria-label="Toggle trusted device"
                  className="data-[state=checked]:bg-card-action data-[state=unchecked]:bg-border"
                />
              </div>
            </motion.div>

            {/* Testing Toggle - Skip OTP */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.76 }}
            >
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 backdrop-blur-md">
                <div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Skip OTP (Testing Mode)
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                    {skipOtp
                      ? "⚠️ OTP verification disabled - for testing only"
                      : "Enable to bypass email verification"}
                  </p>
                </div>
                <Switch
                  checked={skipOtp}
                  onCheckedChange={setSkipOtp}
                  aria-label="Toggle OTP skip for testing"
                  className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-border"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-border/40 bg-bg-secondary/40 p-4 text-left backdrop-blur-md"
            >
              <ShieldCheck className="size-5 text-data-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Session protected
                </p>
                <p className="text-xs text-muted-foreground">
                  Codes are valid for a single attempt and never shared via SMS.
                  Keep your inbox handy.
                </p>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  id="login-error"
                  role="alert"
                  aria-live="polite"
                  className="flex items-center gap-2 text-sm text-data-error bg-data-error/10 border border-data-error/40 backdrop-blur-sm p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle
                    className="size-4 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                type="submit"
                className="w-full relative overflow-hidden group"
                size="lg"
                disabled={loading}
                aria-busy={loading}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                  }}
                />
                {loading && (
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                )}
                <span className="relative z-10">
                  {loading ? "Signing in..." : "Sign In"}
                </span>
                {!loading && (
                  <ArrowRight
                    className="size-5 relative z-10"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-start gap-3 rounded-2xl border border-border/40 bg-bg-secondary/40 px-4 py-3 text-left backdrop-blur-md"
            >
              <Smartphone className="size-5 text-card-action" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Corporate email only
                </p>
                <p className="text-xs text-muted-foreground">
                  OTPs are issued to your official mailbox. Keep it open so you
                  can verify instantly.
                </p>
              </div>
            </motion.div>
          </motion.form>
        ) : (
          // OTP Verification Step
          <motion.form
            onSubmit={onVerifyOtp}
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              {/* Header with Sparkle Effect */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="size-5 text-data-info animate-pulse" />
                  <Label className="text-xl font-bold">
                    Verify Your Identity
                  </Label>
                  <Sparkles className="size-5 text-data-info animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">
                  A 6-digit verification code has been sent to:
                </p>
                <p className="text-sm font-semibold text-foreground bg-gradient-to-r from-card-action/10 to-data-info/10 border border-card-action/30 backdrop-blur-sm rounded-lg px-4 py-2.5 inline-block">
                  {email}
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  📧 Check your email and enter the code below
                </p>
              </motion.div>

              {/* OTP Input with Animation */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <InputOTP
                  ref={otpInputRef}
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={loading}
                  autoFocus
                  inputMode="numeric"
                  aria-label="One-time password code"
                  className="gap-3"
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={0}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                    <InputOTPSlot
                      index={1}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                    <InputOTPSlot
                      index={2}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                  </InputOTPGroup>
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={3}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                    <InputOTPSlot
                      index={4}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                    <InputOTPSlot
                      index={5}
                      className="size-12 text-lg font-bold rounded-xl border-2 border-border/60 focus:border-card-action backdrop-blur-md transition-all duration-200 bg-bg-secondary/50"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </motion.div>

              {/* Timer and Resend */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between text-sm px-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-2 rounded-full animate-pulse",
                      otpExpiry < 60 ? "bg-data-error" : "bg-data-success"
                    )}
                  />
                  <span className="text-muted-foreground">
                    Expires in:{" "}
                    <strong
                      className={
                        otpExpiry < 60 ? "text-data-error" : "text-data-success"
                      }
                    >
                      {formatTime(otpExpiry)}
                    </strong>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm font-medium"
                  onClick={onResendOtp}
                  disabled={resendingOtp || otpExpiry > 540} // Allow resend after 1 minute
                >
                  {resendingOtp && (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  )}
                  {resendingOtp ? "Sending..." : "Resend Code"}
                </Button>
              </motion.div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center gap-2 text-sm text-data-error bg-data-error/10 border border-data-error/40 backdrop-blur-sm p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full relative overflow-hidden"
                size="lg"
                disabled={loading || otp.length !== 6}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                  }}
                />
                {loading && (
                  <Loader2 className="size-5 animate-spin relative z-10" />
                )}
                <span className="relative z-10">
                  {loading ? "Verifying..." : "Verify & Login"}
                </span>
                {!loading && <ArrowRight className="size-5 relative z-10" />}
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowOtpStep(false);
                    setOtp("");
                    setError(null);
                    setTimeout(() => emailInputRef.current?.focus(), 200);
                  }}
                >
                  Back to Login
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        )}
      </div>
    </div>
  );
}

// Export illustration for use in page
export { LoginIllustration };
