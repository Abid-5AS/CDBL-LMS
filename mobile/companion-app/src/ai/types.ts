/**
 * AI Service Types
 */

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AILeaveRequest {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  workingDays?: number;
}

export interface AILeaveSuggestion {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  workingDays?: number;
  confidence: number;
  explanation?: string;
}

export interface AIPolicyResponse {
  answer: string;
  relevant: boolean;
  rules?: string[];
  suggestions?: string[];
}

export interface AIDateSuggestion {
  dates: {
    startDate: string;
    endDate: string;
  }[];
  explanation: string;
  avoidDates?: string[];
}

export type AIQueryType =
  | 'leave_suggestion'
  | 'policy_question'
  | 'date_selection'
  | 'reason_generation'
  | 'general';
