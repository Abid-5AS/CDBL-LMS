"use client";

import * as React from "react";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Mail,
  Settings,
  Shield,
  Stethoscope,
  PenTool,
  Server,
  LifeBuoy
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/providers/UserContext";

// ============================================
// FAQ Data & Configuration
// ============================================

const categoryConfig = {
  general: { label: "General", icon: BookOpen },
  casualLeave: { label: "Casual Leave", icon: Clock },
  earnedLeave: { label: "Earned Leave", icon: Calendar },
  medicalLeave: { label: "Medical Leave", icon: Stethoscope },
  modifications: { label: "Modifications", icon: PenTool },
  technical: { label: "Technical & System", icon: Server },
};

type CategoryKey = keyof typeof categoryConfig;

const faqData: Record<CategoryKey, { question: string; answer: string }[]> = {
  general: [
    {
      question: "How do I apply for leave?",
      answer:
        "Navigate to 'Apply Leave' from the main menu, select your leave type, enter the date range, provide a reason, and submit. Your request will go through the standard approval chain: HR Admin → Dept Head → HR Head → CEO.",
    },
    {
      question: "What is the approval chain for leave requests?",
      answer:
        "All leave requests follow this approval chain: HR Admin → Department Head → HR Head → CEO. Each approver can approve, reject, or forward the request to the next level.",
    },
    {
      question: "How can I check my leave balance?",
      answer:
        "Your current leave balance is displayed on your dashboard. You can also view detailed balance history in the 'My Balance' section, which shows opening balance, accrued days, used days, and closing balance.",
    },
    {
      question: "Can I cancel a leave request?",
      answer:
        "Yes, you can cancel a leave request if it's still pending or if it hasn't started yet. Once the leave has begun, you can use 'Partial Cancel' to cancel the remaining future days. Note: Maternity leave cannot be cancelled once approved.",
    },
    {
      question: "How do I track my leave request status?",
      answer:
        "You'll receive real-time notifications for all status changes. You can also check the 'My Leaves' page to see the current status and approval chain progress of all your requests.",
    },
  ],
  casualLeave: [
    {
      question: "What are the rules for Casual Leave (CL)?",
      answer:
        "CL is limited to maximum 3 consecutive days per spell and 10 days per year. CL cannot be availed before/after holidays or other leaves. If you request more than 3 days, the first 3 will be from CL and the rest automatically converts to EL.",
    },
    {
      question: "Why was my 5-day CL converted to CL+EL?",
      answer:
        "Per Policy 6.20.d, CL is limited to 3 consecutive days maximum. When you request more than 3 days, the system automatically uses 3 days from your CL balance and converts the remaining days to Earned Leave (EL). This ensures policy compliance.",
    },
    {
      question: "Can I take CL before or after a holiday?",
      answer:
        "No. Policy 6.20.e strictly prohibits taking CL immediately before or after any public holiday, weekly holiday, or any other type of leave. This is to prevent abuse of casual leave provisions.",
    },
    {
      question: "Can I combine CL with other leave types?",
      answer:
        "No, CL cannot be combined with any other type of leave (EL, ML, etc.) in the same spell. Each CL spell must be standalone working days only.",
    },
  ],
  earnedLeave: [
    {
      question: "How is Earned Leave (EL) accrued?",
      answer:
        "EL is accrued at 1.5 days per month of service, totaling 18 days per year. Accrual happens automatically at the end of each month.",
    },
    {
      question: "Do I need to give advance notice for EL?",
      answer:
        "For EL of 10 days or less, no specific notice period is required (subject to approval). For EL exceeding 10 consecutive days, you must provide at least 30 days advance notice (Policy 6.21.b).",
    },
    {
      question: "What happens when my EL balance exceeds 60 days?",
      answer:
        "EL can accumulate up to 60 days. When your balance exceeds 60 days, the excess automatically overflows to a 'Special EL' bucket, which can store up to 180 days total. You can encash leave from the Special EL bucket only.",
    },
    {
      question: "Can I encash my EL?",
      answer:
        "You can only encash EL from the overflow balance (Special EL bucket), not from your regular 60-day EL balance. Submit an encashment request through the system, which requires approval from the same chain.",
    },
  ],
  medicalLeave: [
    {
      question: "When do I need a fitness certificate for Medical Leave?",
      answer:
        "A fitness certificate is required for Medical Leave exceeding 7 consecutive working days (Policy 6.14). The certificate must be approved by HR Admin → HR Head → CEO before you can return to duty.",
    },
    {
      question: "How do I upload a fitness certificate?",
      answer:
        "When your ML exceeds 7 days, you'll see an upload button in your leave details page. Upload a PDF, JPG, or PNG file (max 5MB). The certificate will go through the approval chain before you're cleared to return.",
    },
    {
      question: "What happens if I take more than 14 days ML?",
      answer:
        "The first 14 days are deducted from your ML balance. Any excess days are automatically converted to EL, Special EL, or Extraordinary Leave, depending on your available balances (Policy 6.21.c).",
    },
    {
      question: "Can I return to work without fitness certificate approval?",
      answer:
        "No. If your ML exceeds 7 days, return to duty is blocked until your fitness certificate is fully approved. This is a policy requirement for employee health and safety.",
    },
  ],
  modifications: [
    {
      question: "Can I extend my leave after it's approved?",
      answer:
        "Yes, you can request an extension by clicking 'Extend Leave' on your leave details page. This creates a new linked leave request that goes through the approval chain. Your original leave remains intact.",
    },
    {
      question: "Can I shorten my approved leave?",
      answer:
        "Yes, you can shorten your leave before it ends by using the 'Shorten Leave' feature. The unused days will be restored to your balance. The change requires approval.",
    },
    {
      question: "What is 'Partial Cancel' and when can I use it?",
      answer:
        "Partial Cancel allows you to cancel only the future portion of an ongoing leave. For example, if your leave is from Dec 1-10 and today is Dec 5, you can cancel Dec 6-10 while keeping Dec 1-5 as taken. The future days (Dec 6-10) will be restored to your balance.",
    },
    {
      question: "Why can't I cancel my maternity leave?",
      answer:
        "Per policy, maternity leave cannot be cancelled or modified once approved. This is to ensure proper maternity leave utilization and compliance with labor regulations.",
    },
  ],
  technical: [
    {
      question: "Why was my leave request rejected automatically?",
      answer:
        "Automatic rejections occur when your request violates policy rules: insufficient balance, CL adjacency violations, missing notice period for long EL, or invalid date ranges. Check the rejection reason for specific details.",
    },
    {
      question: "How are working days calculated?",
      answer:
        "The system automatically calculates working days by excluding weekends (Friday-Saturday) and public holidays from your date range. Only actual working days count toward your leave balance.",
    },
    {
      question: "What notifications will I receive?",
      answer:
        "You'll receive notifications for: leave request submissions, approvals/rejections at each chain level, leave cancellations, fitness certificate status updates, and balance updates. Notifications appear in real-time in the notification dropdown.",
    },
    {
      question: "Can I apply for backdated leave?",
      answer:
        "Generally, backdated leave requests require special approval and valid justification. Contact HR Admin for guidance on backdated requests.",
    },
  ],
};

const categoryPolicyLink: Record<string, { href: string; label: string }> = {
  casualLeave: { href: "/policies?tab=cl", label: "Casual Leave policy" },
  earnedLeave: { href: "/policies?tab=el", label: "Earned Leave policy" },
  medicalLeave: { href: "/policies?tab=ml", label: "Medical Leave policy" },
  modifications: { href: "/policies", label: "Policy handbook" },
};

// ============================================
// Main Component
// ============================================

export function FAQPageContent() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<CategoryKey>("general");
  const user = useUser();
  const canManageFaq = !!user && ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"].includes(user.role);

  // Search Logic
  const filteredFAQs = React.useMemo(() => {
    if (!searchTerm) {
      if (activeTab === "general" && !searchTerm) return faqData[activeTab]; // Show only active tab when not searching? No, searching should search global.
      return faqData[activeTab];
    }

    const term = searchTerm.toLowerCase();
    // When searching, we search across ALL categories
    const allFaqs = Object.values(faqData).flat();
    return allFaqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term)
    );
  }, [searchTerm, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 pb-20">
      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-16 px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <Badge variant="secondary" className="mb-2">Help Center</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            How can we help you?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Browse through common questions or search for specific topics related to leave management.
          </p>

          <div className="relative max-w-lg mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search for answers..."
              className="pl-11 h-12 rounded-full shadow-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3 space-y-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 px-3">Categories</h3>
              <nav className="space-y-1">
                {(Object.keys(categoryConfig) as CategoryKey[]).map((key) => {
                  const config = categoryConfig[key];
                  const Icon = config.icon;
                  const isActive = activeTab === key && !searchTerm;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        setSearchTerm("");
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                      {config.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {canManageFaq && (
              <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Admin Controls</p>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/admin/tools")}
                  >
                    <Settings className="w-4 h-4" />
                    Manage FAQs
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mobile Category Selector */}
          <div className="lg:hidden col-span-1">
            <select
              className="w-full p-3 rounded-lg border bg-background"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as CategoryKey)}
            >
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-10">
            {searchTerm ? (
              <div>
                <h2 className="text-xl font-semibold mb-6">Search Results</h2>
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
                    <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No matching answers found for "{searchTerm}"</p>
                    <Button variant="link" onClick={() => setSearchTerm("")}>Clear search</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFAQs.map((faq, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-base">{faq.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm">
                          {faq.answer}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    {React.createElement(categoryConfig[activeTab].icon, { className: "w-6 h-6 text-primary" })}
                    {categoryConfig[activeTab].label}
                  </h2>
                  <Badge variant="outline" className="text-slate-500">
                    {faqData[activeTab].length} articles
                  </Badge>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqData[activeTab].map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-6 data-[state=open]:shadow-sm"
                    >
                      <AccordionTrigger className="hover:no-underline py-4 text-base font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
                        {faq.answer}
                        {categoryPolicyLink[activeTab] && (
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                            <Link
                              href={categoryPolicyLink[activeTab].href}
                              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3" />
                              Read full {categoryPolicyLink[activeTab].label}
                            </Link>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Support Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-200 dark:border-slate-800 mt-12">
              <div className="group rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 transition-colors hover:bg-white hover:shadow-md border border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => router.push("/policies")}>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Policy Handbook</h3>
                <p className="text-sm text-slate-500 mt-2">Read detailed documentation about all leave policies.</p>
              </div>

              <div className="group rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 transition-colors hover:bg-white hover:shadow-md border border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => router.push("/leaves/apply")}>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Apply for Leave</h3>
                <p className="text-sm text-slate-500 mt-2">Ready to take time off? Start your request here.</p>
              </div>

              <div className="group rounded-2xl bg-slate-50 dark:bg-slate-900 p-6 transition-colors hover:bg-white hover:shadow-md border border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => router.push("/help")}>
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Contact HR</h3>
                <p className="text-sm text-slate-500 mt-2">Need personal assistance? Reach out to the HR team.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
