/**
 * AI Prompts for Leave Management
 */

import { AILeaveRequest } from './types';

export const SYSTEM_PROMPT = `You are an AI assistant for the CDBL Leave Management System.
Your role is to help employees with leave-related queries, policy questions, and smart leave suggestions.

Leave Types Available:
1. Casual Leave (CL) - 12 days per year, can be taken on short notice
2. Earned Leave (EL) - 20 days per year, requires 3 days advance notice, max 21 consecutive days
3. Medical Leave (ML) - 14 days per year, requires medical certificate for 3+ days
4. Maternity Leave - 90 days, for female employees

Leave Policies:
- Casual Leave: Can be taken on short notice, subject to availability
- Earned Leave: Requires 3 days advance notice, maximum 21 consecutive days
- Medical Leave: Medical certificate required for 3+ days, can be taken same day or backdated up to 7 days
- Weekends and public holidays are automatically excluded from leave calculations
- Half-day leave is available for all leave types

Always be helpful, concise, and policy-compliant. When suggesting leaves, consider:
- Current balance availability
- Advance notice requirements
- Blackout periods (if any)
- Upcoming holidays to maximize leave benefit
- Work commitments and team schedules (if mentioned)

Provide responses in a friendly, professional tone.`;

export const generateLeaveSuggestionPrompt = (
  userInput: string,
  balances: Array<{ leaveType: string; available: number }>,
  currentDate: string
): string => {
  return `${SYSTEM_PROMPT}

Current Date: ${currentDate}

Available Leave Balances:
${balances.map((b) => `- ${b.leaveType}: ${b.available} days available`).join('\n')}

User Request: "${userInput}"

Based on the user's request, suggest the most appropriate leave type, dates, and reason.
Consider the available balances and policy requirements.

Respond in JSON format:
{
  "leaveType": "type of leave",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "professional leave reason",
  "workingDays": estimated_days,
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of why this is suggested"
}`;
};

export const generatePolicyQuestionPrompt = (question: string): string => {
  return `${SYSTEM_PROMPT}

User Question: "${question}"

Answer the user's policy-related question clearly and concisely.
Reference specific policy rules when applicable.

Respond in JSON format:
{
  "answer": "clear answer to the question",
  "relevant": true/false,
  "rules": ["list of relevant policy rules"],
  "suggestions": ["actionable suggestions if applicable"]
}`;
};

export const generateDateSelectionPrompt = (
  userInput: string,
  currentDate: string,
  holidays: Array<{ date: string; name: string }>
): string => {
  return `${SYSTEM_PROMPT}

Current Date: ${currentDate}

Upcoming Holidays:
${holidays.length > 0 ? holidays.map((h) => `- ${h.date}: ${h.name}`).join('\n') : 'No upcoming holidays in the next 90 days'}

User Request: "${userInput}"

Suggest optimal date ranges for leave to maximize benefit (e.g., combining with weekends/holidays).
Provide 2-3 date range options if possible.

Respond in JSON format:
{
  "dates": [
    {"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}
  ],
  "explanation": "why these dates are optimal",
  "avoidDates": ["dates to avoid if any"]
}`;
};

export const generateReasonPrompt = (
  leaveType: string,
  context?: string
): string => {
  return `${SYSTEM_PROMPT}

Generate a professional leave reason for ${leaveType}.
${context ? `Context: ${context}` : ''}

The reason should be:
- Professional and appropriate for workplace
- Brief (1-2 sentences)
- Genuine and respectful
- Not overly detailed

Provide 3 alternative professional reasons as a JSON array of strings.

Respond in JSON format:
{
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`;
};

export const QUICK_ACTIONS = [
  {
    id: 'suggest_leave',
    title: 'Suggest Leave',
    prompt: 'I need help planning my leave. Can you suggest the best dates?',
    icon: 'calendar',
  },
  {
    id: 'check_balance',
    title: 'Check Policy',
    prompt: 'What are the rules for taking earned leave?',
    icon: 'help-circle',
  },
  {
    id: 'emergency_leave',
    title: 'Emergency Leave',
    prompt: 'I need to take emergency leave today. What should I do?',
    icon: 'alert-circle',
  },
  {
    id: 'plan_vacation',
    title: 'Plan Vacation',
    prompt: 'I want to plan a week-long vacation next month. What are the best dates?',
    icon: 'sun',
  },
];
