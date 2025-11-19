"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar, Star, Clock, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
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

type HolidaysListProps = {
  holidays: Holiday[];
  role?: Role;
  onHolidayUpdated?: () => void;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

function HolidayListItem({
  holiday,
  index,
  isAdmin,
  onDelete,
}: {
  holiday: Holiday;
  index: number;
  isAdmin: boolean;
  onDelete?: () => void;
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
        onDelete();
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
        transition={{ delay: index * 0.05 }}
        className={cn(
          "neo-card group flex items-center justify-between p-4",
          isPast && "opacity-75"
        )}
      >
        {/* Left side - Holiday info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            isPast
              ? "bg-slate-500/10"
              : !holiday.isOptional
              ? "bg-red-500/10"
              : "bg-blue-500/10"
          )}>
            <Calendar
              className={cn(
                "size-5",
                isPast
                  ? "text-slate-600 dark:text-slate-400"
                  : !holiday.isOptional
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              )}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">
                {holiday.name}
              </h3>
              {isToday && (
                <Badge variant="default" className="text-xs shrink-0 bg-purple-500 hover:bg-purple-600 animate-pulse">
                  Today
                </Badge>
              )}
              {!holiday.isOptional && !isPast && !isToday && (
                <Badge variant="default" className="text-xs shrink-0 bg-red-500 hover:bg-red-600">
                  Mandatory
                </Badge>
              )}
              {holiday.isOptional && (
                <Badge variant="outline" className="text-xs shrink-0">
                  <Star className="size-3 mr-1" aria-hidden="true" />
                  Optional
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{formatDate(holiday.date)}</span>
              <span>•</span>
              <span>
                {holidayDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                })}
              </span>

              {!isPast && daysUntil > 0 && (
                <>
                  <span>•</span>
                  <span className="text-data-warning">
                    {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Status and actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isPast && (
            <Badge variant="secondary" className="text-xs">
              Past
            </Badge>
          )}

          {!isPast && !isToday && daysUntil <= 7 && daysUntil > 0 && (
            <Badge
              variant="default"
              className="text-xs bg-data-warning/90 text-white"
            >
              <Clock className="size-3 mr-1" aria-hidden="true" />
              {daysUntil}d
            </Badge>
          )}

          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
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
          ) : (
            <ChevronRight
              className="size-4 text-muted-foreground group-hover:text-foreground transition-colors"
              aria-hidden="true"
            />
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

export function HolidaysList({ holidays, role, onHolidayUpdated }: HolidaysListProps) {
  const isAdmin = role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO";

  if (holidays.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
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
    <div className="space-y-3">
      {holidays.map((holiday, index) => (
        <HolidayListItem
          key={holiday.id}
          holiday={holiday}
          index={index}
          isAdmin={isAdmin}
          onDelete={onHolidayUpdated}
        />
      ))}
    </div>
  );
}
