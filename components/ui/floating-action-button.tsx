"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Clock, FileText, X } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

interface FABAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color?: string;
}

interface FloatingActionButtonProps {
  className?: string;
  actions?: FABAction[];
}

const defaultActions: FABAction[] = [
  {
    icon: Calendar,
    label: "Apply Leave",
    href: "/leaves/apply",
    color: "bg-primary",
  },
  {
    icon: Clock,
    label: "My Leaves",
    href: "/leaves/my",
    color: "bg-accent",
  },
  {
    icon: FileText,
    label: "Leave Balance",
    href: "/balance",
    color: "bg-success",
  },
];

export function FloatingActionButton({
  className,
  actions = defaultActions,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const user = useUser();

  // Hide/show FAB based on scroll direction
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
        setIsOpen(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Don't show FAB if user is not logged in
  if (!user) return null;

  return (
    <div
      className={cn("fixed bottom-6 right-6 z-40 md:hidden", className)}
      suppressHydrationWarning
    >
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
            suppressHydrationWarning
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    y: 20,
                    transition: {
                      delay: (actions.length - 1 - index) * 0.05,
                    },
                  }}
                >
                  <Link
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3"
                  >
                    {/* Label */}
                    <div className="glass-base px-3 py-2 rounded-xl shadow-lg border border-white/20 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">
                        {action.label}
                      </span>
                    </div>

                    {/* Action Button */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg text-white",
                        action.color || "bg-primary"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 focus-ring"
            aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-7 h-7" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
