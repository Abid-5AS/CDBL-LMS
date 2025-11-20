"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarEvent } from "./CalendarGrid";
import { STATUS_COLORS, LEAVE_TYPE_DOTS } from "./CalendarLegend";
import { cn } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface DayClickModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
}

export function DayClickModal({ isOpen, onClose, date, events }: DayClickModalProps) {
  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format(date, "EEEE, MMMM d, yyyy")}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {events.length} events
            </span>
          </DialogTitle>
          <DialogDescription>
            Leave details for this day.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-2">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No leaves scheduled for this day.
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-3 rounded-lg border flex flex-col gap-2",
                  event.isHoliday 
                    ? "bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800/30" 
                    : "bg-card hover:bg-accent/5 transition-colors"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", LEAVE_TYPE_DOTS[event.type])} />
                    <span className="font-medium text-sm">{event.employeeName || event.title}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                    event.isHoliday ? STATUS_COLORS.HOLIDAY : STATUS_COLORS[event.status]
                  )}>
                    {event.isHoliday ? "Holiday" : event.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground pl-4">
                  <span>{leaveTypeLabel[event.type]}</span>
                  <div className="flex items-center gap-3">
                    <span>
                      {format(new Date(event.startDate), "MMM d")} - {format(new Date(event.endDate), "MMM d")}
                    </span>
                    {!event.isHoliday && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                        <Link href={`/leaves/${event.id}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
