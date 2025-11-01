"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "How do I apply for leave?",
    answer: "Navigate to 'Apply Leave' from the dock navigation or dashboard. Fill in the leave type, dates, and reason. Submit the request and wait for HR approval.",
  },
  {
    question: "What is the difference between Casual, Earned, and Medical leave?",
    answer: "Casual Leave is for personal matters (max 7 consecutive days). Earned Leave accrues monthly and can be planned. Medical Leave is for health issues (requires certificate if >3 days).",
  },
  {
    question: "Can I cancel a leave request?",
    answer: "Yes, you can cancel leave requests that are in 'Submitted' or 'Pending' status. Once approved or rejected, you cannot cancel them.",
  },
  {
    question: "How many days in advance should I apply for Earned Leave?",
    answer: "Earned Leave should be submitted at least 15 days in advance for better planning.",
  },
  {
    question: "What happens if my leave is rejected?",
    answer: "You will be notified, and the leave days will not be deducted from your balance. You can apply again if needed.",
  },
  {
    question: "Can I view my leave balance?",
    answer: "Yes, your leave balance is displayed on the dashboard showing available Casual, Medical, and Earned Leave days.",
  },
  {
    question: "Who approves my leave requests?",
    answer: "HR Admin reviews and approves all leave requests. Super Admins can also approve requests.",
  },
  {
    question: "What if I need to backdate a leave request?",
    answer: "Casual leave can be backdated only with HR Admin approval. Contact HR for assistance.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

