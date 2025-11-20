"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarHeader, CalendarViewMode } from "@/components/calendar/CalendarHeader";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { CalendarGrid, CalendarEvent } from "@/components/calendar/CalendarGrid";
import { TimelineGrid } from "@/components/calendar/TimelineGrid";
import { DayClickModal } from "@/components/calendar/DayClickModal";
import { TeamCalendarView } from "@/components/calendar/TeamCalendarView";
import { DepartmentHeatmap } from "@/components/calendar/DepartmentHeatmap";
import { format, addMonths, subMonths, startOfMonth, addDays } from "date-fns";
import { Loader2, CalendarDays, Clock, Wallet, LayoutGrid, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaveTypeLabel } from "@/lib/ui";

type LeaveCalendarViewProps = {
  currentUserRole: string;
};

export function LeaveCalendarView({ currentUserRole }: LeaveCalendarViewProps) {
  const isAdmin = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(currentUserRole);
  const isManager = ["DEPT_HEAD", "MANAGER"].includes(currentUserRole);
  const isEmployee = !isAdmin && !isManager;
  
  const getDefaultTab = () => {
    if (isAdmin) return "heatmap";
    if (isManager) return "team";
    return "my";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(isEmployee ? "2-week" : "timeline");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (activeTab === "my") {
      fetchCalendarData();
    }
  }, [currentDate, activeTab]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      // Employees only see their own data
      const response = await fetch(
        `/api/calendar/leaves?month=${month}&year=${year}&view=my`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      
      // Transform and filter: employees ONLY see their own leaves
      const transformedEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
        id: event.id,
        title: leaveTypeLabel[event.leaveType] || event.leaveType,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        type: event.leaveType,
        status: event.status,
        employeeName: event.employeeName,
        isHoliday: false
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
    setModalOpen(true);
  };

  const timelineRows = [
    {
      id: "me",
      label: "My Leave Schedule",
      avatar: "",
      events: events
    }
  ];
  
  const nextLeave = events.find(e => new Date(e.startDate) > new Date() && e.status === "APPROVED");
  const pendingCount = events.filter(e => e.status === "PENDING").length;
  const upcomingEvents = events.filter(e => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    const now = new Date();
    const twoWeeks = addDays(now, 14);
    return start <= twoWeeks && end >= now;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {(isAdmin || isManager) && (
          <div className="flex justify-center sm:justify-start mb-6">
            <TabsList className="inline-grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-1">
              <TabsTrigger value="my" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Calendar</span>
                <span className="sm:hidden">Mine</span>
              </TabsTrigger>
              {(isManager || isAdmin) && (
                <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Team View</span>
                  <span className="sm:hidden">Team</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="heatmap" className="gap-1.5 text-xs sm:text-sm px-3 sm:px-4 col-span-2 sm:col-span-1">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Overview
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        )}

        <TabsContent value="my" className="space-y-4 sm:space-y-6 mt-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Next Leave</p>
                  <p className="text-sm font-semibold truncate">
                    {nextLeave 
                      ? `${format(nextLeave.startDate, "MMM d")} (${leaveTypeLabel[nextLeave.type]})`
                      : "None scheduled"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  <p className="text-sm font-semibold">{pendingCount} Request{pendingCount !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Balance</p>
                  <p className="text-sm font-semibold truncate">View Details →</p>
                </div>
              </CardContent>
            </Card>
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

              <div className={cn("transition-opacity duration-200", loading && "opacity-50")}>
                {viewMode === "month" && (
                  <div className="p-2 sm:p-0">
                    <CalendarGrid
                      currentDate={currentDate}
                      events={events}
                      onDayClick={handleDayClick}
                      className="h-[500px] sm:h-[600px]"
                    />
                  </div>
                )}

                {(viewMode === "2-week" || viewMode === "timeline") && (
                  <div className="p-3 sm:p-4 space-y-6">
                    <TimelineGrid
                      startDate={viewMode === "2-week" ? new Date() : startOfMonth(currentDate)}
                      daysToShow={viewMode === "2-week" ? 14 : 30}
                      rows={timelineRows}
                      className="pb-4"
                    />
                    
                    {upcomingEvents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-primary"></span>
                          Upcoming Leaves
                        </h3>
                        <div className="space-y-2">
                          {upcomingEvents.map(event => (
                            <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "capitalize shrink-0",
                                    event.status === 'APPROVED' && 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
                                    event.status === 'PENDING' && 'border-amber-500 bg-amber-500/10 text-amber-700',
                                    event.status === 'REJECTED' && 'border-rose-500 bg-rose-500/10 text-rose-700'
                                  )}
                                >
                                  {event.status}
                                </Badge>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{event.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(event.startDate, "MMM d")} - {format(event.endDate, "MMM d")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            <div className="px-3 sm:px-4 py-3 bg-muted/20 border-t">
              <CalendarLegend />
            </div>
          </Card>

          <DayClickModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            date={selectedDate}
            events={selectedEvents}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <TeamCalendarView currentUserRole={currentUserRole} />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-0">
          <DepartmentHeatmap currentUserRole={currentUserRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
