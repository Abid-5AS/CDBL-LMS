"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import clsx from "clsx";

type ApprovalStage = {
  name: string;
  status: "completed" | "active" | "pending" | "rejected";
  completedAt?: string;
  approver?: string;
};

type LeaveTimelineProps = {
  requestId: number;
  variant?: "compact" | "detailed";
};

// Mock approval stages - in real implementation, fetch from API
const getApprovalStages = (requestId: number): ApprovalStage[] => {
  // This would be fetched from an API endpoint
  // For now, return mock data
  return [
    { name: "Submitted", status: "completed", completedAt: "2025-01-15T10:00:00Z" },
    { name: "HR Admin", status: "completed", completedAt: "2025-01-15T11:00:00Z", approver: "HR Admin Name" },
    { name: "Dept Head", status: "active" },
    { name: "HR Head", status: "pending" },
    { name: "CEO", status: "pending" },
    { name: "Approved", status: "pending" },
  ];
};

export function LeaveTimeline({ requestId, variant = "compact" }: LeaveTimelineProps) {
  const stages = getApprovalStages(requestId);
  
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle2;
      case "active":
        return Clock;
      case "rejected":
        return XCircle;
      default:
        return Circle;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "active":
        return "text-indigo-600 bg-indigo-100 animate-pulse";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-400 bg-gray-100";
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {stages.map((stage, index) => {
        const Icon = getStageIcon(stage.status);
        const isActive = stage.status === "active";
        
        return (
          <StageItem
            key={index}
            stage={stage}
            Icon={Icon}
            isActive={isActive}
            variant={variant}
            isLast={index === stages.length - 1}
          />
        );
      })}
    </div>
  );
}

function StageItem({ 
  stage, 
  Icon, 
  isActive, 
  variant, 
  isLast 
}: { 
  stage: ApprovalStage;
  Icon: typeof CheckCircle2;
  isActive: boolean;
  variant: "compact" | "detailed";
  isLast: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div 
        className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium",
          getStageColor(stage.status),
          stage.approver && "cursor-help"
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon className={clsx("h-4 w-4", isActive && "animate-pulse")} />
        {variant === "detailed" && stage.approver && (
          <span className="text-xs opacity-75">{stage.approver}</span>
        )}
        <span>{stage.name}</span>
      </div>
      
      {/* Tooltip for approver info */}
      {showTooltip && stage.approver && variant === "compact" && (
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-12 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-20">
          <div className="font-medium">Approved by</div>
          <div className="text-gray-300">{stage.approver}</div>
          {stage.completedAt && (
            <div className="text-gray-400 mt-1">
              {new Date(stage.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
      
      {!isLast && (
        <div className={clsx("h-0.5 w-8", stage.status === "completed" ? "bg-green-300" : "bg-gray-200")} />
      )}
    </div>
  );

