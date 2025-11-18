"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Settings, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAnnotations, useAnnotationEnabled } from "@/hooks/useAnnotations";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { toggleAllAnnotations } from "@/lib/annotations/config";

/**
 * AnnotationsToggle Component
 *
 * Development-mode toggle for annotations system
 * Shows next to dark mode toggle in navbar
 * Available to all roles during development
 */
export function AnnotationsToggle() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const { config, getStats } = useAnnotations();

  const stats = getStats();
  const allEnabled = stats.disabled === 0;

  // Check if development mode and mount on client
  useEffect(() => {
    setMounted(true);
    setIsDev(process.env.NODE_ENV === "development");

    // Cleanup function
    return () => {
      // No specific cleanup needed for this component
      // The state will be handled by React's unmounting process
    };
  }, []);

  const handleToggleAll = () => {
    // Toggle all annotations at once
    toggleAllAnnotations(!allEnabled);
  };

  const handleNavigateToAdmin = () => {
    router.push("/admin/annotations");
  };

  // Only show in development mode
  if (!mounted || !isDev) {
    return null;
  }

  return (
    <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/60 transition-all duration-300 bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-purple-500/40"
            title="Annotations Manager (Development Mode)"
            aria-label="Toggle annotations menu"
          >
            <BookOpen size={18} strokeWidth={1.5} />
            {stats.enabled > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 h-2 w-2 bg-purple-500 rounded-full"
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Annotations</span>
            <Badge variant={allEnabled ? "default" : "secondary"} className="text-xs">
              {stats.enabled}/{stats.total}
            </Badge>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleToggleAll}
            className="cursor-pointer flex items-center gap-2"
          >
            {allEnabled ? (
              <>
                <EyeOff size={16} />
                <span>Hide All Annotations</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Show All Annotations</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleNavigateToAdmin}
            className="cursor-pointer flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Manage Annotations</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-2 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Accessibility:</span>
              <span className="font-medium">{stats.byCategory.accessibility}</span>
            </div>
            <div className="flex justify-between">
              <span>Performance:</span>
              <span className="font-medium">{stats.byCategory.performance}</span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className="font-medium">{stats.byCategory.quality}</span>
            </div>
            <div className="flex justify-between">
              <span>Security:</span>
              <span className="font-medium">{stats.byCategory.security}</span>
            </div>
            <div className="flex justify-between">
              <span>Deployment:</span>
              <span className="font-medium">{stats.byCategory.deployment}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          <div className="px-2 py-2 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Development Mode</p>
            <p>
              Annotations help you follow best practices. Toggle on/off anytime without code changes.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
