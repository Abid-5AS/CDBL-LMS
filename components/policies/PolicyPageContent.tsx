"use client";

import * as React from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ============================================
// Policy Data
// ============================================

const policyData = {
  casualLeave: {
    title: "Casual Leave (CL)",
    code: "6.20",
    icon: Calendar,
    color: "text-blue-600",
    availability: "10 days per year",
    rules: [
      {
        title: "Maximum Duration",
        description: "CL is limited to a maximum of 3 (three) consecutive working days per spell.",
        type: "critical",
        policyRef: "6.20.a",
      },
      {
        title: "Annual Quota",
        description: "An employee can apply for a maximum of 10 (ten) days of CL in a calendar year.",
        type: "info",
        policyRef: "6.20.b",
      },
      {
        title: "No Advance Accrual",
        description: "CL cannot be accrued in advance. It must be utilized within the calendar year.",
        type: "warning",
        policyRef: "6.20.c",
      },
      {
        title: "Auto-Conversion to EL",
        description: "If more than 3 consecutive days are requested, the first 3 days will be deducted from CL balance and the remaining days will automatically be converted to Earned Leave (EL).",
        type: "info",
        policyRef: "6.20.d",
      },
      {
        title: "No Holiday Adjacency",
        description: "CL cannot be availed immediately before or after a public holiday, weekly holiday, or any other type of leave.",
        type: "critical",
        policyRef: "6.20.e",
      },
    ],
    examples: [
      {
        scenario: "Requesting 2 days CL",
        result: "Approved from CL balance (within 3-day limit)",
        valid: true,
      },
      {
        scenario: "Requesting 5 days CL",
        result: "First 3 days from CL, remaining 2 days auto-converted to EL",
        valid: true,
      },
      {
        scenario: "Requesting CL adjacent to a holiday",
        result: "Rejected - violates policy 6.20.e",
        valid: false,
      },
    ],
  },
  earnedLeave: {
    title: "Earned Leave (EL)",
    code: "6.21",
    icon: CheckCircle2,
    color: "text-green-600",
    availability: "1.5 days per month (18 days/year)",
    rules: [
      {
        title: "Accrual Rate",
        description: "EL is accrued at 1.5 days per month of service, totaling 18 days per year.",
        type: "info",
        policyRef: "6.21.a",
      },
      {
        title: "Notice Period",
        description: "For EL exceeding 10 consecutive days, at least 30 days advance notice is required.",
        type: "warning",
        policyRef: "6.21.b",
      },
      {
        title: "Maximum Accumulation",
        description: "EL can be accumulated up to a maximum of 60 days. Excess days overflow to Special EL bucket (up to 180 days total).",
        type: "info",
        policyRef: "6.21.c",
      },
      {
        title: "Encashment",
        description: "Employees can encash EL from the overflow balance (Special EL) only.",
        type: "info",
        policyRef: "6.21.d",
      },
    ],
    examples: [
      {
        scenario: "5 days EL with 2 weeks notice",
        result: "Approved (no 30-day notice required for ≤10 days)",
        valid: true,
      },
      {
        scenario: "15 days EL with 2 weeks notice",
        result: "Rejected - requires 30 days advance notice",
        valid: false,
      },
      {
        scenario: "EL balance reaches 65 days",
        result: "60 days in regular EL, 5 days overflow to Special EL",
        valid: true,
      },
    ],
  },
  medicalLeave: {
    title: "Medical Leave (ML)",
    code: "6.14",
    icon: AlertCircle,
    color: "text-red-600",
    availability: "14 days per year",
    rules: [
      {
        title: "Annual Quota",
        description: "Employees are entitled to 14 days of ML per calendar year.",
        type: "info",
        policyRef: "6.14.a",
      },
      {
        title: "Fitness Certificate (>7 days)",
        description: "ML exceeding 7 consecutive working days requires a fitness certificate for return to duty.",
        type: "critical",
        policyRef: "6.14.b",
      },
      {
        title: "Auto-Conversion (>14 days)",
        description: "If ML exceeds 14 days, the first 14 days are deducted from ML balance, and the excess is converted to EL/Special EL/Extraordinary Leave.",
        type: "warning",
        policyRef: "6.21.c",
      },
      {
        title: "Return to Duty",
        description: "Return to duty is blocked until the fitness certificate is approved by HR Admin → HR Head → CEO.",
        type: "critical",
        policyRef: "6.14.c",
      },
    ],
    examples: [
      {
        scenario: "3 days ML for flu",
        result: "Approved from ML balance, no certificate needed",
        valid: true,
      },
      {
        scenario: "10 days ML for surgery",
        result: "Approved, fitness certificate required before return",
        valid: true,
      },
      {
        scenario: "20 days ML",
        result: "First 14 days from ML, remaining 6 days from EL/Special",
        valid: true,
      },
    ],
  },
  maternityLeave: {
    title: "Maternity Leave",
    code: "6.15",
    icon: Users,
    color: "text-pink-600",
    availability: "90 days (with pay)",
    rules: [
      {
        title: "Duration",
        description: "Female employees are entitled to 90 days of paid maternity leave.",
        type: "info",
        policyRef: "6.15.a",
      },
      {
        title: "Advance Notice",
        description: "At least 30 days advance notice should be given before the expected delivery date.",
        type: "warning",
        policyRef: "6.15.b",
      },
      {
        title: "Cannot Be Cancelled",
        description: "Maternity leave, once approved, cannot be cancelled or modified.",
        type: "critical",
        policyRef: "6.15.c",
      },
    ],
    examples: [
      {
        scenario: "Request 90 days maternity leave with 45 days notice",
        result: "Approved",
        valid: true,
      },
      {
        scenario: "Attempt to cancel maternity leave",
        result: "Rejected - maternity leave cannot be cancelled",
        valid: false,
      },
    ],
  },
  paternityLeave: {
    title: "Paternity Leave",
    code: "6.16",
    icon: Users,
    color: "text-indigo-600",
    availability: "7 days (with pay)",
    rules: [
      {
        title: "Duration",
        description: "Male employees are entitled to 7 days of paid paternity leave.",
        type: "info",
        policyRef: "6.16.a",
      },
      {
        title: "Timing",
        description: "Paternity leave must be availed within 30 days of the child's birth.",
        type: "warning",
        policyRef: "6.16.b",
      },
    ],
    examples: [
      {
        scenario: "Request 7 days paternity leave within 2 weeks of birth",
        result: "Approved",
        valid: true,
      },
    ],
  },
};

// ============================================
// Policy Card Component
// ============================================

interface PolicyCardProps {
  policy: typeof policyData.casualLeave;
}

function PolicyCard({ policy }: PolicyCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = policy.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", policy.color)}>
              <Icon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{policy.title}</CardTitle>
              <CardDescription>Policy {policy.code}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {policy.availability}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rules */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Policy Rules
          </h4>
          {policy.rules.map((rule, index) => (
            <Alert
              key={index}
              variant={
                rule.type === "critical"
                  ? "destructive"
                  : rule.type === "warning"
                  ? "default"
                  : "default"
              }
              className={cn(
                rule.type === "warning" && "border-yellow-500/50 bg-yellow-50/50",
                rule.type === "info" && "border-blue-500/50 bg-blue-50/50"
              )}
            >
              {rule.type === "critical" && <XCircle className="size-4" />}
              {rule.type === "warning" && <AlertCircle className="size-4" />}
              {rule.type === "info" && <CheckCircle2 className="size-4" />}
              <div>
                <AlertTitle className="flex items-center justify-between">
                  {rule.title}
                  <Badge variant="outline" className="text-xs">
                    {rule.policyRef}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{rule.description}</AlertDescription>
              </div>
            </Alert>
          ))}
        </div>

        {/* Examples */}
        {policy.examples && policy.examples.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            >
              Examples
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {expanded && (
              <div className="space-y-2">
                {policy.examples.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-md border border-border bg-muted/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {example.valid ? (
                          <CheckCircle2 className="size-5 text-green-600" />
                        ) : (
                          <XCircle className="size-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{example.scenario}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {example.result}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Policy Page Component
// ============================================

export function PolicyPageContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="size-8 text-primary" />
          Leave Policies
        </h1>
        <p className="text-muted-foreground text-lg">
          Complete guide to CDBL leave policies, rules, and requirements
        </p>
      </div>

      {/* Quick Reference */}
      <Alert>
        <FileText className="size-4" />
        <AlertTitle>Quick Reference</AlertTitle>
        <AlertDescription>
          All leave policies follow CDBL Personnel Policy Manual Chapter 6. Each
          leave request goes through the standard approval chain: HR Admin → Dept
          Head → HR Head → CEO.
        </AlertDescription>
      </Alert>

      {/* Tabs for Organization */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="all">All Policies</TabsTrigger>
          <TabsTrigger value="cl">CL</TabsTrigger>
          <TabsTrigger value="el">EL</TabsTrigger>
          <TabsTrigger value="ml">ML</TabsTrigger>
          <TabsTrigger value="maternity">Maternity</TabsTrigger>
          <TabsTrigger value="paternity">Paternity</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          <PolicyCard policy={policyData.casualLeave} />
          <PolicyCard policy={policyData.earnedLeave} />
          <PolicyCard policy={policyData.medicalLeave} />
          <PolicyCard policy={policyData.maternityLeave} />
          <PolicyCard policy={policyData.paternityLeave} />
        </TabsContent>

        <TabsContent value="cl" className="mt-6">
          <PolicyCard policy={policyData.casualLeave} />
        </TabsContent>

        <TabsContent value="el" className="mt-6">
          <PolicyCard policy={policyData.earnedLeave} />
        </TabsContent>

        <TabsContent value="ml" className="mt-6">
          <PolicyCard policy={policyData.medicalLeave} />
        </TabsContent>

        <TabsContent value="maternity" className="mt-6">
          <PolicyCard policy={policyData.maternityLeave} />
        </TabsContent>

        <TabsContent value="paternity" className="mt-6">
          <PolicyCard policy={policyData.paternityLeave} />
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>Need more information?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/faq"
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <h4 className="font-semibold mb-2">Frequently Asked Questions</h4>
              <p className="text-sm text-muted-foreground">
                Common questions about leave policies and procedures
              </p>
            </a>
            <a
              href="/leaves/apply"
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <h4 className="font-semibold mb-2">Apply for Leave</h4>
              <p className="text-sm text-muted-foreground">
                Start a new leave request following these policies
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
