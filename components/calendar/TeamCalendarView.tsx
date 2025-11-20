"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarHeader, CalendarViewMode } from "@/components/calendar/CalendarHeader";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { TimelineGrid } from "@/components/calendar/TimelineGrid";
import { CalendarGrid, CalendarEvent } from "@/components/calendar/CalendarGrid";
import { DayClickModal } from "@/components/calendar/DayClickModal";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { Loader2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface TeamCalendarViewProps {
  currentUserRole: string;
}

export function TeamCalendarView({ currentUserRole }: TeamCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("timeline");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    fetchTeamData();
  }, [currentDate]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      const response = await fetch(
        `/api/calendar/leaves?month=${month}&year=${year}&view=team`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      
      const transformedEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
        id: event.id,
        title: event.leaveType,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        type: event.leaveType,
        status: event.status,
        employeeName: event.employeeName,
        isHoliday: false
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
      toast.error("Failed to load team calendar");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === "PENDING") {
      setSelectedEvent(event);
      setActionDialogOpen(true);
    }
  };

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(date);
    setSelectedDayEvents(dayEvents);
    setDayModalOpen(true);
  };

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedEvent) return;

    try {
      setProcessingAction(true);
      // Real API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Leave request ${action.toLowerCase()}ed`);
      setActionDialogOpen(false);
      fetchTeamData();
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setProcessingAction(false);
    }
  };

  const employeeMap = new Map<string, CalendarEvent[]>();
  events.forEach(event => {
    const name = event.employeeName || "Unknown";
    if (!employeeMap.has(name)) {
      employeeMap.set(name, []);
    }
    employeeMap.get(name)?.push(event);
  });

  const timelineRows = Array.from(employeeMap.entries()).map(([name, employeeEvents]) => ({
    id: name,
    label: name,
    avatar: "",
    events: employeeEvents
  }));

  const pendingCount = events.filter(e => e.status === "PENDING").length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Team Calendar
        </h2>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-sm font-medium border border-amber-200 self-start sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b bg-muted/30">
          <CalendarHeader
            currentDate={currentDate}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        <CardContent className="p-0 min-h-[400px] sm:min-h-[500px] relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {viewMode === "month" && (
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              className="h-[500px] sm:h-[600px]"
            />
          )}

          {(viewMode === "2-week" || viewMode === "timeline") && (
            <div className="p-3 sm:p-4">
              <TimelineGrid
                startDate={viewMode === "2-week" ? new Date() : startOfMonth(currentDate)}
                daysToShow={viewMode === "2-week" ? 14 : 30}
                rows={timelineRows}
                onEventClick={handleEventClick}
                className="pb-4"
              />
            </div>
          )}
        </CardContent>
        
        <div className="px-3 sm:px-4 py-3 bg-muted/20 border-t">
          <CalendarLegend />
        </div>
      </Card>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
            <DialogDescription>
              {selectedEvent?.employeeName} - {selectedEvent?.type}
              <br />
              {selectedEvent && format(selectedEvent.startDate, "MMM d")} - {selectedEvent && format(selectedEvent.endDate, "MMM d")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Textarea 
              placeholder="Add a note (optional)..." 
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => handleAction("REJECT")}
              disabled={processingAction}
            >
              Reject
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleAction("APPROVE")}
              disabled={processingAction}
            >
              {processingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DayClickModal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        date={selectedDate}
        events={selectedDayEvents}
      />
    </div>
  );
}
