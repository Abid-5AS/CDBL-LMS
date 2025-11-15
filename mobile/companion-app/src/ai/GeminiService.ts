/**
 * Gemini AI Service
 *
 * Interfaces with Google's Gemini API for intelligent leave suggestions
 */

import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import {
  AIMessage,
  AILeaveSuggestion,
  AIPolicyResponse,
  AIDateSuggestion,
  AIQueryType,
} from './types';
import {
  SYSTEM_PROMPT,
  generateLeaveSuggestionPrompt,
  generatePolicyQuestionPrompt,
  generateDateSelectionPrompt,
  generateReasonPrompt,
} from './prompts';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private chatSession: ChatSession | null = null;
  private apiKey: string | null = null;

  /**
   * Initialize the Gemini service with API key
   */
  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.genAI !== null;
  }

  /**
   * Start a new chat session
   */
  startChat(): ChatSession {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    this.chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Initialize as CDBL Leave Management Assistant' }],
        },
        {
          role: 'model',
          parts: [
            {
              text: SYSTEM_PROMPT + '\n\nI am ready to assist with leave management queries.',
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    return this.chatSession;
  }

  /**
   * Send a message in the current chat session
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      this.startChat();
    }

    try {
      const result = await this.chatSession!.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[GeminiService] Error sending message:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Get leave suggestion based on user input
   */
  async getLeaveSuggestion(
    userInput: string,
    balances: Array<{ leaveType: string; available: number }>,
    currentDate: string = new Date().toISOString().split('T')[0]
  ): Promise<AILeaveSuggestion> {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generateLeaveSuggestionPrompt(userInput, balances, currentDate);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const suggestion = JSON.parse(jsonMatch[0]);
      return suggestion as AILeaveSuggestion;
    } catch (error) {
      console.error('[GeminiService] Error getting leave suggestion:', error);
      throw new Error('Failed to generate leave suggestion');
    }
  }

  /**
   * Answer policy-related questions
   */
  async answerPolicyQuestion(question: string): Promise<AIPolicyResponse> {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generatePolicyQuestionPrompt(question);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const policyResponse = JSON.parse(jsonMatch[0]);
      return policyResponse as AIPolicyResponse;
    } catch (error) {
      console.error('[GeminiService] Error answering policy question:', error);
      throw new Error('Failed to answer policy question');
    }
  }

  /**
   * Suggest optimal dates for leave
   */
  async suggestDates(
    userInput: string,
    currentDate: string = new Date().toISOString().split('T')[0],
    holidays: Array<{ date: string; name: string }> = []
  ): Promise<AIDateSuggestion> {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generateDateSelectionPrompt(userInput, currentDate, holidays);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const dateSuggestion = JSON.parse(jsonMatch[0]);
      return dateSuggestion as AIDateSuggestion;
    } catch (error) {
      console.error('[GeminiService] Error suggesting dates:', error);
      throw new Error('Failed to suggest dates');
    }
  }

  /**
   * Generate professional leave reasons
   */
  async generateReasons(
    leaveType: string,
    context?: string
  ): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini service not initialized');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = generateReasonPrompt(leaveType, context);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const reasonsResponse = JSON.parse(jsonMatch[0]);
      return reasonsResponse.reasons || [];
    } catch (error) {
      console.error('[GeminiService] Error generating reasons:', error);
      throw new Error('Failed to generate reasons');
    }
  }

  /**
   * Classify the type of user query
   */
  classifyQuery(query: string): AIQueryType {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes('suggest') ||
      lowerQuery.includes('plan') ||
      lowerQuery.includes('need leave')
    ) {
      return 'leave_suggestion';
    }

    if (
      lowerQuery.includes('policy') ||
      lowerQuery.includes('rule') ||
      lowerQuery.includes('can i')
    ) {
      return 'policy_question';
    }

    if (
      lowerQuery.includes('date') ||
      lowerQuery.includes('when') ||
      lowerQuery.includes('vacation')
    ) {
      return 'date_selection';
    }

    if (
      lowerQuery.includes('reason') ||
      lowerQuery.includes('why')
    ) {
      return 'reason_generation';
    }

    return 'general';
  }

  /**
   * Clear current chat session
   */
  clearSession() {
    this.chatSession = null;
  }
}

// Singleton instance
export const geminiService = new GeminiService();
