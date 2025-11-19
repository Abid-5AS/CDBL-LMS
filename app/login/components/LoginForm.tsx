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
  Loader2,
  AlertCircle,
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

// Label Component (Clean & Professional)
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Input Component (Soft Zinc Theme)
const inputVariants = cva(
  [
    "flex w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm",
    "transition-all duration-200 ease-out outline-none",
    "placeholder:text-zinc-400",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200",
    "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:border-zinc-700 dark:focus-visible:ring-zinc-800",
  ],
  {
    variants: {
      hasIcon: {
        true: "pl-10",
      },
    },
  }
);

interface InputProps
  extends Omit<ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasIcon, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ hasIcon, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Button Component (Soft Zinc Theme)
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
          "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
        ],
        ghost: "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
        link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100 p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
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

// CDBL Logo Component (Simplified)
function CDBLLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
        <div className="h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        </div>
    </div>
  );
}

// Login Illustration Component (Kept but not used in LoginForm)
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
      {/* Removed specific icons as they are not part of the new design */}
      <div className="relative z-10 w-full h-auto text-text-secondary/90" />
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
  // const [rememberDevice, setRememberDevice] = useState(true); // Removed as per instructions
  const [skipOtp, setSkipOtp] = useState(true); // Default to true for easier testing

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
        body: JSON.stringify({ email, password, skipOtp }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = data.error || "Login failed";
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);

        // Removed shake animation
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

      // Direct login flow
      toast.success(skipOtp ? "Login successful! (OTP Skipped)" : "Login successful!");
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

        // Removed shake animation
        return;
      }

      toast.success("Login successful!");

      // Role-based redirect
      const role = data?.user?.role;
      if (typeof window !== "undefined") {
        const destination = getHomePageForRole(role as any) || "/dashboard";
        window.location.assign(destination);
      } else {
        // Removed router.replace fallback as per instructions
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

  // Removed getAnimationDelay and authSteps as per instructions

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="lg:hidden mb-4">
             <CDBLLogo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {showOtpStep ? "Verify your identity" : "Welcome back"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {showOtpStep 
                ? `Enter the code sent to ${email}` 
                : "Enter your credentials to access your account"}
          </p>
        </div>

        {/* Form */}
        {!showOtpStep ? (
          // Email & Password Step
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@cdbl.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  hasIcon
                  ref={emailInputRef}
                  autoComplete="username"
                  className="bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="text-xs font-normal text-zinc-500 hover:text-zinc-900"
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
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
                  className="bg-white dark:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400"
                >
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="skip-otp"
                  checked={skipOtp}
                  onCheckedChange={setSkipOtp}
                />
                <Label htmlFor="skip-otp" className="mb-0 cursor-pointer">
                  Skip OTP <span className="text-xs text-zinc-400 font-normal">(Testing)</span>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>
        ) : (
          // OTP Verification Step
          <form onSubmit={onVerifyOtp} className="space-y-6">
            <div className="flex justify-center py-4">
                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    ref={otpInputRef}
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <div className="w-4" />
                    <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400"
                >
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || otp.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Verify & Sign in
                </Button>
                
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={resendingOtp || otpExpiry > 0}
                        className="text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {resendingOtp ? (
                            "Sending code..."
                        ) : otpExpiry > 0 ? (
                            `Resend code in ${formatTime(otpExpiry)}`
                        ) : (
                            "Resend verification code"
                        )}
                    </button>
                </div>
            </div>
            
            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setShowOtpStep(false)}
                    className="text-sm text-zinc-400 hover:text-zinc-600"
                >
                    Back to login
                </button>
            </div>
          </form>
        )}

        {/* Quick Login for Testing (Dev Only) */}
        {!showOtpStep && (
            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 text-center">
                    Quick Login (Dev Only)
                </p>
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("sysadmin@cdbl.local");
                            setPassword("demo123");
                        }}
                    >
                        Admin
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("hradmin@demo.local");
                            setPassword("demo123");
                        }}
                    >
                        HR Admin
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("hrhead@demo.local");
                            setPassword("demo123");
                        }}
                    >
                        HR Head
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("manager@demo.local");
                            setPassword("demo123");
                        }}
                    >
                        Dept Head
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("ceo@demo.local");
                            setPassword("demo123");
                        }}
                    >
                        CEO
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs border border-zinc-200 dark:border-zinc-800"
                        onClick={() => {
                            setEmail("employee1@demo.local");
                            setPassword("demo123");
                        }}
                    >
                        Employee
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// Export illustration for use in page
export { LoginIllustration };
