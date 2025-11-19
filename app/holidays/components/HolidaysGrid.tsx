"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar, Star, Clock, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, cn } from "@/lib/utils";
import type { Holiday } from "../hooks/useHolidaysData";

type HolidaysGridProps = {
  holidays: Holiday[];
  role?: Role;
  onHolidayUpdated?: () => void;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

function HolidayCard({
  holiday,
  isAdmin,
  onDelete,
}: {
  holiday: Holiday;
  isAdmin: boolean;
  onDelete?: (id: number) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const holidayDate = new Date(holiday.date);
  holidayDate.setHours(0, 0, 0, 0);

  const isToday = holidayDate.getTime() === today.getTime();
  const isPast = holidayDate < today;
  const daysUntil = Math.ceil(
    (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/holidays/${holiday.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(holiday.id);
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "neo-card p-4 h-full flex flex-col group relative",
            isPast && "opacity-75"
          )}
        >
          {/* Header with actions */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "p-2 rounded-lg",
              isPast
                ? "bg-slate-500/10"
                : !holiday.isOptional
                ? "bg-red-500/10"
                : "bg-blue-500/10"
            )}>
              <Calendar className={cn(
                "w-5 h-5",
                isPast
                  ? "text-slate-600 dark:text-slate-400"
                  : !holiday.isOptional
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              )} />
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="flex gap-1 flex-wrap justify-end">
                {isToday && (
                  <Badge variant="default" className="text-xs bg-purple-500 hover:bg-purple-600 animate-pulse">
                    Today
                  </Badge>
                )}
                {!holiday.isOptional && !isPast && !isToday && (
                  <Badge variant="default" className="text-xs bg-red-500 hover:bg-red-600">
                    Mandatory
                  </Badge>
                )}
                {holiday.isOptional && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Optional
                  </Badge>
                )}
                {isPast && (
                  <Badge variant="secondary" className="text-xs">
                    Past
                  </Badge>
                )}
                {!isPast && !isToday && daysUntil <= 7 && daysUntil > 0 && (
                  <Badge variant="default" className="text-xs bg-orange-500 hover:bg-orange-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntil}d
                  </Badge>
                )}
              </div>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem disabled className="text-xs opacity-60">
                      Edit (coming soon)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
              {holiday.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {formatDate(holiday.date)}
            </p>

            {/* Day of week */}
            <p className="text-xs text-muted-foreground">
              {holidayDate.toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </p>
          </div>

          {/* Footer */}
          {!isPast && daysUntil > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{holiday.name}"? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function HolidaysGrid({ holidays, role, onHolidayUpdated }: HolidaysGridProps) {
  const isAdmin = role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO";

  if (holidays.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground mb-2">No holidays found</p>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          {isAdmin
            ? "Add holidays to the calendar to display them here"
            : "No holidays match the current filters. Try adjusting your search criteria."}
        </p>
        {isAdmin && (
          <p className="text-xs text-muted-foreground">
            Use the admin panel above to add new holidays
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {holidays.map((holiday) => (
        <HolidayCard
          key={holiday.id}
          holiday={holiday}
          isAdmin={isAdmin}
          onDelete={() => onHolidayUpdated?.()}
        />
      ))}
    </div>
  );
}
