"use client";

import * as React from "react";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Mail,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmployeePageHero } from "@/components/employee/PageHero";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ============================================
// FAQ Data
// ============================================

const faqData = {
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
        "The system automatically calculates working days by excluding weekends (Saturday-Sunday) and public holidays from your date range. Only actual working days count toward your leave balance.",
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

const totalFaqCount = Object.values(faqData).reduce(
  (sum, faqs) => sum + faqs.length,
  0
);

// ============================================
// FAQ Accordion Component
// ============================================

interface FAQAccordionProps {
  faqs: { question: string; answer: string }[];
  category: string;
}

function FAQAccordion({ faqs, category }: FAQAccordionProps) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={`${category}-${index}`}
          value={`${category}-${index}`}
          className="border rounded-lg px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <span className="text-left font-medium">{faq.question}</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ============================================
// Main FAQ Page Component
// ============================================

export function FAQPageContent() {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter FAQs based on search
  const filteredFAQs = React.useMemo(() => {
    if (!searchTerm) return faqData;

    const term = searchTerm.toLowerCase();
    const filtered: any = {};

    Object.entries(faqData).forEach(([category, faqs]) => {
      const matchedFAQs = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) ||
          faq.answer.toLowerCase().includes(term)
      );
      if (matchedFAQs.length > 0) {
        filtered[category] = matchedFAQs;
      }
    });

    return filtered;
  }, [searchTerm]);

  const totalResults = Object.values(filteredFAQs).reduce(
    (sum: number, faqs: any) => sum + faqs.length,
    0 as number
  );

  const heroStats = [
    { label: "FAQ Categories", value: Object.keys(faqData).length },
    { label: "Answers Documented", value: totalFaqCount },
    { label: "Support SLA", value: "< 2 hrs", helper: "HR response window" },
  ];

  return (
    <div className="space-y-6 py-6">
      <EmployeePageHero
        eyebrow="Help Center"
        title="Frequently Asked Questions"
        description="Search curated answers about applying for leave, balances, policy compliance, and troubleshooting."
        stats={heroStats}
        actions={
          <Button asChild size="sm">
            <Link href="/help">Contact Support</Link>
          </Button>
        }
      />

      {/* Search */}
      <div className="surface-card p-4 rounded-3xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Search Results Count */}
      {searchTerm && (
        <Alert className="surface-card border border-border/70">
          <Search className="size-4" />
          <AlertDescription>
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for
            &quot;
            {searchTerm}&quot;
          </AlertDescription>
        </Alert>
      )}

      {/* FAQ Categories */}
      <Tabs defaultValue="general" className="w-full surface-card p-4 rounded-3xl">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-muted/50 rounded-2xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="casual">Casual Leave</TabsTrigger>
          <TabsTrigger value="earned">Earned Leave</TabsTrigger>
          <TabsTrigger value="medical">Medical Leave</TabsTrigger>
          <TabsTrigger value="modifications">Modifications</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.general?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.general && filteredFAQs.general.length > 0 ? (
            <FAQAccordion faqs={filteredFAQs.general} category="general" />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>

        <TabsContent value="casual" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.casualLeave?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.casualLeave && filteredFAQs.casualLeave.length > 0 ? (
            <FAQAccordion
              faqs={filteredFAQs.casualLeave}
              category="casualLeave"
            />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>

        <TabsContent value="earned" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.earnedLeave?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.earnedLeave && filteredFAQs.earnedLeave.length > 0 ? (
            <FAQAccordion
              faqs={filteredFAQs.earnedLeave}
              category="earnedLeave"
            />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>

        <TabsContent value="medical" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.medicalLeave?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.medicalLeave && filteredFAQs.medicalLeave.length > 0 ? (
            <FAQAccordion
              faqs={filteredFAQs.medicalLeave}
              category="medicalLeave"
            />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>

        <TabsContent value="modifications" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.modifications?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.modifications &&
          filteredFAQs.modifications.length > 0 ? (
            <FAQAccordion
              faqs={filteredFAQs.modifications}
              category="modifications"
            />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>

        <TabsContent value="technical" className="mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {filteredFAQs.technical?.length || 0} Questions
            </Badge>
          </div>
          {filteredFAQs.technical && filteredFAQs.technical.length > 0 ? (
            <FAQAccordion faqs={filteredFAQs.technical} category="technical" />
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No questions found in this category
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription>Additional resources and support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/policies"
              className="neo-card group block p-6 cursor-pointer"
            >
              <BookOpen className="size-6 mb-3 text-primary" />
              <h4 className="font-semibold mb-2 text-foreground">
                Leave Policies
              </h4>
              <p className="text-sm text-muted-foreground">
                Complete policy documentation
              </p>
            </Link>
            <Link
              href="/leaves/apply"
              className="neo-card group block p-6 cursor-pointer"
            >
              <Calendar className="size-6 mb-3 text-primary" />
              <h4 className="font-semibold mb-2 text-foreground">
                Apply for Leave
              </h4>
              <p className="text-sm text-muted-foreground">
                Start a new leave request
              </p>
            </Link>
            <a
              href="mailto:hr@cdbl.com"
              className="neo-card group block p-6 cursor-pointer"
            >
              <Mail className="size-6 mb-3 text-primary" />
              <h4 className="font-semibold mb-2 text-foreground">Contact HR</h4>
              <p className="text-sm text-muted-foreground">
                Email us for specific queries
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
