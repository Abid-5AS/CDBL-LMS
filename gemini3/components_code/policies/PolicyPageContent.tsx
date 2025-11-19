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
  HelpCircle,
  CalendarPlus,
  Settings,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { EmployeePageHero } from "@/components/employee/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";

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
    summary:
      "Short personal leave for errands or emergencies, limited to three consecutive working days per spell.",
    rules: [
      {
        title: "Maximum Duration",
        description:
          "CL is limited to a maximum of 3 (three) consecutive working days per spell.",
        type: "critical",
        policyRef: "6.20.a",
      },
      {
        title: "Annual Quota",
        description:
          "An employee can apply for a maximum of 10 (ten) days of CL in a calendar year.",
        type: "info",
        policyRef: "6.20.b",
      },
      {
        title: "No Advance Accrual",
        description:
          "CL cannot be accrued in advance. It must be utilized within the calendar year.",
        type: "warning",
        policyRef: "6.20.c",
      },
      {
        title: "Auto-Conversion to EL",
        description:
          "If more than 3 consecutive days are requested, the first 3 days will be deducted from CL balance and the remaining days will automatically be converted to Earned Leave (EL).",
        type: "info",
        policyRef: "6.20.d",
      },
      {
        title: "No Holiday Adjacency",
        description:
          "CL cannot be availed immediately before or after a public holiday, weekly holiday, or any other type of leave.",
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
    summary:
      "Accrued leave that can be carried forward, with advance notice required for long breaks.",
    rules: [
      {
        title: "Accrual Rate",
        description:
          "EL is accrued at 1.5 days per month of service, totaling 18 days per year.",
        type: "info",
        policyRef: "6.21.a",
      },
      {
        title: "Notice Period",
        description:
          "For EL exceeding 10 consecutive days, at least 30 days advance notice is required.",
        type: "warning",
        policyRef: "6.21.b",
      },
      {
        title: "Maximum Accumulation",
        description:
          "EL can be accumulated up to a maximum of 60 days. Excess days overflow to Special EL bucket (up to 180 days total).",
        type: "info",
        policyRef: "6.21.c",
      },
      {
        title: "Encashment",
        description:
          "Employees can encash EL from the overflow balance (Special EL) only.",
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
    summary:
      "Sick leave that needs medical and fitness certificates after certain durations, with overflow converting to EL.",
    rules: [
      {
        title: "Annual Quota",
        description:
          "Employees are entitled to 14 days of ML per calendar year.",
        type: "info",
        policyRef: "6.14.a",
      },
      {
        title: "Fitness Certificate (>7 days)",
        description:
          "ML exceeding 7 consecutive working days requires a fitness certificate for return to duty.",
        type: "critical",
        policyRef: "6.14.b",
      },
      {
        title: "Auto-Conversion (>14 days)",
        description:
          "If ML exceeds 14 days, the first 14 days are deducted from ML balance, and the excess is converted to EL/Special EL/Extraordinary Leave.",
        type: "warning",
        policyRef: "6.21.c",
      },
      {
        title: "Return to Duty",
        description:
          "Return to duty is blocked until the fitness certificate is approved by HR Admin → HR Head → CEO.",
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
    summary:
      "Ninety days of protected leave split around delivery with strict notice and no cancellation once approved.",
    rules: [
      {
        title: "Duration",
        description:
          "Female employees are entitled to 90 days of paid maternity leave.",
        type: "info",
        policyRef: "6.15.a",
      },
      {
        title: "Advance Notice",
        description:
          "At least 30 days advance notice should be given before the expected delivery date.",
        type: "warning",
        policyRef: "6.15.b",
      },
      {
        title: "Cannot Be Cancelled",
        description:
          "Maternity leave, once approved, cannot be cancelled or modified.",
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
    summary:
      "Seven days of partner leave to be used within thirty days of the child's birth.",
    rules: [
      {
        title: "Duration",
        description:
          "Male employees are entitled to 7 days of paid paternity leave.",
        type: "info",
        policyRef: "6.16.a",
      },
      {
        title: "Timing",
        description:
          "Paternity leave must be availed within 30 days of the child's birth.",
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
  policy: PolicySection;
}

function PolicyCard({ policy }: PolicyCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = policy.icon;

  return (
    <div className="neo-card p-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-muted", policy.color)}>
              <Icon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{policy.title}</CardTitle>
              <CardDescription>Policy {policy.code}</CardDescription>
              {policy.summary && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {policy.summary}
                </p>
              )}
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
          <Accordion type="multiple" className="space-y-2">
            {policy.rules.map((rule, index) => {
              const severityClass =
                rule.type === "critical"
                  ? "border-red-500/40 bg-red-50/60 dark:bg-red-900/10"
                  : rule.type === "warning"
                  ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10"
                  : "border-border/60 bg-muted/30 dark:bg-muted/20";
              const LeadingIcon =
                rule.type === "critical"
                  ? XCircle
                  : rule.type === "warning"
                  ? AlertCircle
                  : CheckCircle2;

              return (
                <AccordionItem
                  key={`${policy.code}-${index}`}
                  value={`${policy.code}-${index}`}
                  className="border-none"
                >
                  <AccordionTrigger
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left hover:no-underline focus:ring-0",
                      severityClass
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <LeadingIcon className="size-4 shrink-0" />
                        {rule.title}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rule.policyRef}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      {rule.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Examples */}
        {policy.examples && policy.examples.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between gap-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors w-full"
            >
              <span>
                Examples ({policy.examples.length})
              </span>
              <span className="flex items-center gap-2 text-xs font-medium normal-case text-muted-foreground">
                {!expanded && (
                  <span className="line-clamp-1">
                    {policy.examples[0]?.scenario}
                  </span>
                )}
                {expanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </span>
            </button>

            {expanded && (
              <div className="space-y-2">
                {policy.examples.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-md border border-border bg-muted/30 dark:bg-muted/50"
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
                        <p className="font-medium text-sm">
                          {example.scenario}
                        </p>
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
    </div>
  );
}

// ============================================
// Main Policy Page Component
// ============================================

type PolicySection = typeof policyData.casualLeave;
const policySections: PolicySection[] = Object.values(policyData);
const totalRules = policySections.reduce((sum, policy) => sum + policy.rules.length, 0);
const criticalRules = policySections.reduce(
  (sum, policy) => sum + policy.rules.filter((rule) => rule.type === "critical").length,
  0
);
const totalExamples = policySections.reduce((sum, policy) => sum + policy.examples.length, 0);

export function PolicyPageContent() {
  const router = useRouter();
  const user = useUser();
  const canManagePolicies =
    !!user && ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"].includes(user.role);
  const [policySearch, setPolicySearch] = React.useState("");
  const normalizedSearch = policySearch.trim().toLowerCase();
  const matchesPolicy = React.useCallback(
    (policy: PolicySection) => {
      if (!normalizedSearch) return true;
      const summaryText = policy.summary?.toLowerCase() ?? "";
      if (
        policy.title.toLowerCase().includes(normalizedSearch) ||
        policy.code.toLowerCase().includes(normalizedSearch) ||
        summaryText.includes(normalizedSearch)
      ) {
        return true;
      }
      return policy.rules.some(
        (rule) =>
          rule.title.toLowerCase().includes(normalizedSearch) ||
          rule.description.toLowerCase().includes(normalizedSearch)
      );
    },
    [normalizedSearch]
  );
  const filteredPolicies = React.useMemo(
    () => policySections.filter((section) => matchesPolicy(section)),
    [matchesPolicy]
  );
  const hasSearch = normalizedSearch.length > 0;
  const heroStats = [
    { label: "Policy Sections", value: policySections.length },
    { label: "Rules Documented", value: totalRules },
    { label: "Critical Alerts", value: criticalRules, state: criticalRules ? "danger" : "default" },
  ];

  return (
    <div className="space-y-6 py-6">
      <EmployeePageHero
        eyebrow="Policies"
        title="Leave Policies & Guidance"
        description="Understand every leave type, escalation rule, and compliance requirement before you apply."
        stats={heroStats}
        actions={
          <>
            {canManagePolicies && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Settings className="size-4" aria-hidden="true" />}
                onClick={() => router.push("/admin")}
              >
                Manage Policies
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HelpCircle className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/faq")}
            >
              FAQ
            </Button>
            <Button
              size="sm"
              leftIcon={<CalendarPlus className="size-4" aria-hidden="true" />}
              onClick={() => router.push("/leaves/apply")}
            >
              Apply Leave
            </Button>
          </>
        }
      />

      {/* Quick Reference */}
      <Alert className="surface-card border border-border/70">
        <FileText className="size-4" />
        <AlertTitle>Quick Reference</AlertTitle>
        <AlertDescription>
          All leave policies follow CDBL Personnel Policy Manual Chapter 6. Each
          leave request goes through the standard approval chain: HR Admin →
          Dept Head → HR Head → CEO.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="surface-card p-4 rounded-3xl space-y-2">
        <label className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Search policies
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={policySearch}
            onChange={(e) => setPolicySearch(e.target.value)}
            placeholder="Search by title, rule, or code"
            className="pl-10"
          />
        </div>
        {hasSearch && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredPolicies.length} of {policySections.length} policy sections
          </p>
        )}
      </div>

      {/* Tabs for Organization */}
      <Tabs defaultValue="all" className="w-full surface-card p-4 rounded-3xl">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-muted/50 rounded-2xl">
          <TabsTrigger value="all">All Policies</TabsTrigger>
          <TabsTrigger value="cl">CL</TabsTrigger>
          <TabsTrigger value="el">EL</TabsTrigger>
          <TabsTrigger value="ml">ML</TabsTrigger>
          <TabsTrigger value="maternity">Maternity</TabsTrigger>
          <TabsTrigger value="paternity">Paternity</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {filteredPolicies.length > 0 ? (
            filteredPolicies.map((policy) => (
              <PolicyCard key={policy.code} policy={policy} />
            ))
          ) : (
            <Alert variant="default">
              <AlertTitle>No matches</AlertTitle>
              <AlertDescription>
                No policies match 
                <span className="font-semibold">“{policySearch}”</span>.
                Try another keyword.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="cl" className="mt-6">
          {matchesPolicy(policyData.casualLeave) ? (
            <PolicyCard policy={policyData.casualLeave} />
          ) : (
            hasSearch && (
              <Alert variant="default">
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Casual Leave rules do not match “{policySearch}”.
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>

        <TabsContent value="el" className="mt-6">
          {matchesPolicy(policyData.earnedLeave) ? (
            <PolicyCard policy={policyData.earnedLeave} />
          ) : (
            hasSearch && (
              <Alert variant="default">
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Earned Leave rules do not match “{policySearch}”.
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>

        <TabsContent value="ml" className="mt-6">
          {matchesPolicy(policyData.medicalLeave) ? (
            <PolicyCard policy={policyData.medicalLeave} />
          ) : (
            hasSearch && (
              <Alert variant="default">
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Medical Leave rules do not match “{policySearch}”.
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>

        <TabsContent value="maternity" className="mt-6">
          {matchesPolicy(policyData.maternityLeave) ? (
            <PolicyCard policy={policyData.maternityLeave} />
          ) : (
            hasSearch && (
              <Alert variant="default">
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Maternity Leave rules do not match “{policySearch}”.
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>

        <TabsContent value="paternity" className="mt-6">
          {matchesPolicy(policyData.paternityLeave) ? (
            <PolicyCard policy={policyData.paternityLeave} />
          ) : (
            hasSearch && (
              <Alert variant="default">
                <AlertTitle>No matches</AlertTitle>
                <AlertDescription>
                  Paternity Leave rules do not match “{policySearch}”.
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>Need more information?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push("/faq")}
              className="neo-card group block p-6 text-left cursor-pointer"
            >
              <h4 className="font-semibold mb-2 text-foreground">
                Frequently Asked Questions
              </h4>
              <p className="text-sm text-muted-foreground">
                Common questions about leave policies and procedures
              </p>
            </button>
            <button
              type="button"
              onClick={() => router.push("/leaves/apply")}
              className="neo-card group block p-6 text-left cursor-pointer"
            >
              <h4 className="font-semibold mb-2 text-foreground">
                Apply for Leave
              </h4>
              <p className="text-sm text-muted-foreground">
                Start a new leave request following these policies
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
