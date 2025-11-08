"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  ScrollText,
  FileDown,
  Printer,
  Plane,
  HeartPulse,
  CalendarDays,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { policy } from "@/lib/policy";

// Leave type entitlements with accurate policy data
const ENTITLEMENTS = [
  {
    type: "Casual Leave",
    entitlement: `${policy.accrual.CL_PER_YEAR} days / Year`,
    notes: `Max ${policy.clMaxConsecutiveDays} consecutive days`,
    icon: Plane,
    gradient: "from-amber-100 to-orange-100",
    iconColor: "text-orange-600",
  },
  {
    type: "Medical Leave",
    entitlement: `${policy.accrual.ML_PER_YEAR} days / Year`,
    notes: "> 3 days requires medical certificate",
    icon: HeartPulse,
    gradient: "from-rose-100 to-red-100",
    iconColor: "text-red-600",
  },
  {
    type: "Earned Leave",
    entitlement: "Accrues Monthly",
    notes: `Submit ${policy.elMinNoticeDays} days in advance`,
    icon: CalendarDays,
    gradient: "from-indigo-100 to-sky-100",
    iconColor: "text-indigo-600",
    subtext: `Accrues ${policy.elAccrualPerMonth} days/month (${policy.accrual.EL_PER_YEAR} days/year), carry forward up to ${policy.carryForwardCap.EL} days`,
  },
];

// Key rules structured for accordion
const KEY_RULES = [
  {
    title: "Weekends within leave range",
    description:
      "Weekends inside your leave period count as leave days. This is a company directive to ensure accurate leave balance tracking.",
  },
  {
    title: "Earned leave carry forward",
    description: `You can carry forward up to ${policy.carryForwardCap.EL} days of earned leave to the next year. Any excess beyond this limit will be credited to special leave up to 180 days.`,
  },
  {
    title: "Medical certificate requirement",
    description:
      "Any medical leave longer than 3 days requires a medical certificate with prescription. Management may extend medical leave up to 30 days with proper recommendation.",
  },
  {
    title: "Casual leave backdating",
    description:
      "Casual leave cannot be backdated. Applications must be submitted before the leave start date. Only HR Admin can approve exceptions with proper justification.",
  },
  {
    title: "Notice period requirements",
    description: `Earned leave requires at least ${policy.elMinNoticeDays} working days advance notice. Casual leave applications should ideally be submitted ${policy.clMinNoticeDays} days in advance, though this is a soft recommendation.`,
  },
];

// FAQ questions
const FAQ_ITEMS = [
  {
    question: "Can I apply for leave retroactively?",
    answer:
      "Earned Leave and Medical Leave can be backdated up to 30 days from the application date, but Casual Leave cannot be backdated. All retroactive applications require HR Admin approval and supporting documents.",
  },
  {
    question: "How much leave can I carry forward?",
    answer: `You can carry forward up to ${policy.carryForwardCap.EL} days of Earned Leave to the next year. Casual Leave and Medical Leave do not carry forward and will lapse at year-end.`,
  },
  {
    question: "When is a medical certificate required?",
    answer:
      "A medical certificate with prescription is required for any Medical Leave longer than 3 consecutive days. The certificate must be attached when submitting your leave application.",
  },
  {
    question: "What happens if I exceed my leave balance?",
    answer:
      "The system will prevent you from applying for leave if you don't have sufficient balance. If you have an exceptional circumstance, contact HR Admin for special leave arrangements.",
  },
  {
    question: "Can I cancel an approved leave?",
    answer:
      "Yes, you can request cancellation of approved leave. The system will restore your leave balance upon approval of the cancellation request. Partial cancellations are also supported.",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export function PoliciesContent() {
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <>
      {/* Print-optimized layout - only visible when printing */}
      <div className="hidden print:block bg-white text-black text-sm leading-relaxed p-8 max-w-4xl mx-auto">
        <header className="mb-8 text-center border-b pb-4">
          <h1 className="text-2xl font-semibold mb-2">CDBL Leave Policy</h1>
          <p className="text-xs text-text-secondary">
            Central Depository Bangladesh Limited - Leave Management System
          </p>
          <p className="text-xs text-text-muted mt-1">
            Policy Version {policy.version} | Effective Date:{" "}
            {new Date().getFullYear()}
          </p>
        </header>

        <section className="mb-6">
          <h2 className="font-semibold text-lg mb-3 border-b border-gray-300 pb-2">
            Annual Entitlements
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Casual Leave:</strong> {policy.accrual.CL_PER_YEAR}{" "}
              days/year, max {policy.clMaxConsecutiveDays} consecutive days
            </li>
            <li>
              <strong>Medical Leave:</strong> {policy.accrual.ML_PER_YEAR}{" "}
              days/year, medical certificate required if &gt;3 days
            </li>
            <li>
              <strong>Earned Leave:</strong> Accrues {policy.elAccrualPerMonth}{" "}
              days/month ({policy.accrual.EL_PER_YEAR} days/year), carry forward
              up to {policy.carryForwardCap.EL} days
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold text-lg mb-3 border-b border-gray-300 pb-2">
            Key Rules
          </h2>
          <ul className="space-y-2">
            {KEY_RULES.map((rule, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <div>
                  <strong>{rule.title}:</strong> {rule.description}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold text-lg mb-3 border-b border-gray-300 pb-2">
            Frequently Asked Questions
          </h2>
          <ul className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <li key={index}>
                <strong className="block mb-1">Q: {item.question}</strong>
                <p className="ml-4 text-gray-700">A: {item.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-10 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Central Depository Bangladesh Limited
          </p>
          <p className="mt-1">
            For the complete policy document, please contact HR or refer to the
            internal documentation portal.
          </p>
        </footer>
      </div>

      {/* Screen layout - hidden when printing */}
      <div className="print:hidden mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <ScrollText
              className="w-7 h-7 text-indigo-600 flex-shrink-0"
              aria-hidden="true"
              aria-label=""
            />
            <div>
              <h1 className="text-3xl font-semibold text-text-primary flex items-center gap-2">
                Leave Policy Overview
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Explore your annual leave entitlements and key company policies
                below. Each section highlights essential information with
                visuals and animation for quick understanding.
              </p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={handleExportPDF}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white no-print"
            aria-label="Export policies as PDF"
          >
            <Printer className="w-4 h-4 mr-2" aria-hidden="true" />
            Export Policy as PDF
          </Button>
        </motion.header>

        {/* Annual Entitlements - Card Grid */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-4"
          aria-labelledby="entitlements-heading"
        >
          <h2
            id="entitlements-heading"
            className="text-xl font-semibold text-text-primary"
          >
            Annual Entitlements
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ENTITLEMENTS.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.type}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl p-6 shadow-sm bg-gradient-to-br ${item.gradient} border border-white/50 hover:shadow-md transition-shadow`}
                >
                  <Icon
                    className={`w-7 h-7 ${item.iconColor} mb-3`}
                    aria-hidden="true"
                    aria-label=""
                  />
                  <h3 className="font-semibold text-lg text-text-primary mb-1">
                    {item.type}
                  </h3>
                  <p className="text-sm font-medium text-text-primary mt-2">
                    {item.entitlement}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {item.notes}
                  </p>
                  {item.subtext && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      {item.subtext}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Separator */}
        <Separator className="my-10" />

        {/* Key Rules Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
          aria-labelledby="rules-heading"
        >
          <h2
            id="rules-heading"
            className="text-xl font-semibold flex items-center gap-2 text-gray-900"
          >
            <ShieldCheck
              className="w-5 h-5 text-indigo-600"
              aria-hidden="true"
            />
            Key Rules
          </h2>
          <Card className="bg-white/70 backdrop-blur-md rounded-xl border">
            <Accordion type="multiple" className="w-full">
              {KEY_RULES.map((rule, index) => (
                <AccordionItem
                  key={rule.title}
                  value={`rule-${index}`}
                  className="px-6"
                >
                  <AccordionTrigger className="text-base font-medium text-gray-900 hover:no-underline">
                    {rule.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {rule.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </motion.section>

        {/* Separator */}
        <Separator className="my-10" />

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="text-xl font-semibold flex items-center gap-2 text-gray-900"
          >
            <HelpCircle
              className="w-5 h-5 text-indigo-600"
              aria-hidden="true"
            />
            Frequently Asked Questions
          </h2>
          <Card className="bg-white/70 backdrop-blur-md rounded-xl border">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="px-6"
                >
                  <AccordionTrigger className="text-base font-medium text-gray-900 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </motion.section>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50"
        >
          <p className="text-sm text-muted-foreground text-center">
            For the complete policy document, please contact HR or refer to the
            internal documentation portal.
          </p>
        </motion.div>
      </div>
    </>
  );
}
