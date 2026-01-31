"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "How do I apply for leave?",
    answer: "Navigate to 'Apply Leave' from the dock navigation or dashboard. Fill in the leave type, dates, and reason. Submit the request and wait for HR approval.",
  },
  {
    question: "What is the difference between Casual and Earned leave?",
    answer: "Casual Leave is for personal matters (max 7 consecutive days). Earned Leave accrues monthly and can be planned. Medical Leave is for health issues (requires certificate if >3 days).",
  },
  {
    question: "Can I cancel a leave request?",
    answer: "Yes, you can cancel leave requests that are in 'Submitted' or 'Pending' status. Once approved or rejected, you cannot cancel them directly.",
  },
  {
    question: "How many days in advance for Earned Leave?",
    answer: "Earned Leave should be submitted at least 15 days in advance for better planning, though policies may vary by department.",
  },
  {
    question: "What happens if my leave is rejected?",
    answer: "You will be notified via email, and the leave days will not be deducted from your leave balance. You can apply again with corrected details or discuss with your manager.",
  },
  {
    question: "Where can I see my leave balance?",
    answer: "Your leave balance is prominently displayed on your Dashboard and the 'My Leaves' page, showing available days for each leave type.",
  },
  {
    question: "Who approves my leave requests?",
    answer: "Typically, your Department Head reviews requests first, followed by HR Admin approval. Super Admins also have approval authority.",
  },
  {
    question: "Can I apply for half-day leave?",
    answer: "Currently, the system supports full-day leave requests. For half-day requirements, please coordinate with your supervisor and HR manually.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full grid gap-4">
      {FAQS.map((faq, index) => (
        <AccordionItem 
          key={index} 
          value={`item-${index}`}
          className="border border-border/40 rounded-lg px-4 bg-card/40 data-[state=open]:bg-card/80 data-[state=open]:border-border/80 transition-all"
        >
          <AccordionTrigger className="text-left font-medium text-base py-4 hover:text-primary transition-colors hover:no-underline gap-4">
              {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pl-0">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
