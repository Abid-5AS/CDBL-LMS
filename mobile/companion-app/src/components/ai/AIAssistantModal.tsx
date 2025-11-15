import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { geminiService } from '../../ai/GeminiService';
import { AIMessage, AILeaveSuggestion } from '../../ai/types';
import { AIMessageBubble } from './AIMessageBubble';
import { AIQuickActions } from './AIQuickActions';
import { useLeaveBalances } from '../../hooks/useLeaveBalances';
import { X, Send, Sparkles } from 'lucide-react-native';

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: AILeaveSuggestion) => void;
}

export function AIAssistantModal({
  visible,
  onClose,
  onApplySuggestion,
}: AIAssistantModalProps) {
  const { colors, isDark } = useTheme();
  const { balances } = useLeaveBalances();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize AI service with API key
  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (apiKey && !geminiService.isInitialized()) {
      geminiService.initialize(apiKey);
    }
  }, []);

  // Add welcome message on mount
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            'Hello! I\'m your AI Leave Assistant. I can help you with:\n\n• Leave suggestions and planning\n• Policy questions\n• Optimal date selection\n• Professional leave reasons\n\nHow can I help you today?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [visible]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    // Check if AI is initialized
    if (!geminiService.isInitialized()) {
      Alert.alert(
        'AI Not Configured',
        'Please add your Gemini API key to environment variables (EXPO_PUBLIC_GEMINI_API_KEY) to use AI features.'
      );
      return;
    }

    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Classify query type
      const queryType = geminiService.classifyQuery(messageText);

      let response = '';
      let suggestion: AILeaveSuggestion | null = null;

      // Handle different query types
      if (queryType === 'leave_suggestion') {
        // Get leave suggestion
        const balanceData = balances.map((b) => ({
          leaveType: b.leave_type,
          available: b.available_days,
        }));

        suggestion = await geminiService.getLeaveSuggestion(
          messageText,
          balanceData
        );

        response = `I suggest taking **${suggestion.leaveType}** from ${suggestion.startDate} to ${suggestion.endDate}.

**Reason**: ${suggestion.reason}

**Working Days**: ~${suggestion.workingDays} days

**Explanation**: ${suggestion.explanation}

Would you like me to fill the leave application form with these details?`;
      } else if (queryType === 'policy_question') {
        // Answer policy question
        const policyResponse = await geminiService.answerPolicyQuestion(
          messageText
        );
        response = policyResponse.answer;

        if (policyResponse.suggestions && policyResponse.suggestions.length > 0) {
          response += '\n\n**Suggestions**:\n';
          policyResponse.suggestions.forEach((s, i) => {
            response += `${i + 1}. ${s}\n`;
          });
        }
      } else {
        // General chat
        response = await geminiService.sendMessage(messageText);
      }

      // Add assistant message
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there's a suggestion and callback provided, store it for user action
      if (suggestion && onApplySuggestion) {
        // User can manually tap on the suggestion to apply it
        // For now, we'll just provide the text response
      }
    } catch (error) {
      console.error('[AIAssistantModal] Error:', error);

      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClose = () => {
    geminiService.clearSession();
    setMessages([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
              borderBottomColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.sparkleIcon,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Sparkles size={20} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.headerTitle,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              AI Leave Assistant
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X
              size={24}
              color={'text' in colors ? colors.text : colors.onSurface}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 1 && (
            <AIQuickActions onActionPress={handleQuickAction} />
          )}

          {messages.map((message) => (
            <AIMessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                AI is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                color: 'text' in colors ? colors.text : colors.onSurface,
              },
            ]}
            placeholder="Ask me anything about leave..."
            placeholderTextColor={
              'textSecondary' in colors
                ? colors.textSecondary
                : colors.onSurfaceVariant
            }
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send
              size={20}
              color={inputText.trim() ? '#FFFFFF' : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
