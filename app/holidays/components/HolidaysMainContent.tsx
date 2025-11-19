"use client";

import { motion, type Variants } from "framer-motion";
import { Calendar as CalendarIcon, Grid3X3, List } from "lucide-react";
import type { Role } from "@prisma/client";
import { HolidaysFilters } from "./HolidaysFilters";
import { HolidaysGrid } from "./HolidaysGrid";
import { HolidaysList } from "./HolidaysList";
import { HolidaysCalendarView } from "./HolidaysCalendarView";
import type { Holiday, HolidayFilters } from "../hooks/useHolidaysData";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HolidaysMainContentProps = {
  holidays: Holiday[];
  filters: HolidayFilters;
  onFiltersChange: (filters: Partial<HolidayFilters>) => void;
  onClearFilters: () => void;
  availableYears: number[];
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

export function HolidaysMainContent({
  holidays,
  filters,
  onFiltersChange,
  onClearFilters,
  availableYears,
  role,
  onHolidayUpdated,
}: HolidaysMainContentProps) {
  const subtitle =
    holidays.length === 0
      ? "No holidays match the current filters"
      : filters.showPast
      ? `${holidays.length} holidays`
      : `${holidays.length} upcoming holidays`;

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <Card className="shadow-sm border border-border bg-card">
        <CardHeader className="pb-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-semibold text-foreground">
                Company Holidays
              </CardTitle>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <HolidaysFilters
              variant="inline"
              filters={filters}
              onFiltersChange={onFiltersChange}
              onClearFilters={onClearFilters}
              availableYears={availableYears}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs
            value={filters.viewMode}
            onValueChange={(tab) =>
              onFiltersChange({
                viewMode: tab as HolidayFilters["viewMode"],
              })
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <TabsList className="flex h-auto rounded-full bg-muted/70 p-1 text-xs sm:text-sm">
                {[
                  { id: "grid", label: "Grid", icon: Grid3X3 },
                  { id: "list", label: "List", icon: List },
                  { id: "calendar", label: "Calendar", icon: CalendarIcon },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = filters.viewMode === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                          : 'data-[state=active]:bg-background data-[state=active]:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {holidays.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {holidays.length} {holidays.length === 1 ? 'holiday' : 'holidays'}
                </Badge>
              )}
            </div>

            <TabsContent value="grid" className="mt-0">
              <HolidaysGrid
                holidays={holidays}
                role={role}
                onHolidayUpdated={onHolidayUpdated}
              />
            </TabsContent>
            <TabsContent value="list" className="mt-0">
              <HolidaysList
                holidays={holidays}
                role={role}
                onHolidayUpdated={onHolidayUpdated}
              />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <HolidaysCalendarView holidays={holidays} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
