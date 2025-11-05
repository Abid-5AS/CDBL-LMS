"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, UserCheck, FileSpreadsheet } from "lucide-react";

export function DeptHeadQuickActions() {

  return (
    <>
      <Card className="rounded-2xl border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[140px] justify-start gap-2"
                    onClick={() => {
                      // TODO: Navigate to team calendar view
                      console.log("View Team Calendar");
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    Team Calendar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View team calendar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[140px] justify-start gap-2"
                    onClick={() => {
                      // TODO: Open acting approver assignment modal
                      console.log("Assign Acting Approver");
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                    Acting Approver
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Assign acting approver</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[140px] justify-start gap-2"
                    onClick={() => {
                      // TODO: Export monthly report
                      console.log("Export Monthly Report");
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Report
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export monthly report</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

