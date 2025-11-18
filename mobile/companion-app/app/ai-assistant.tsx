import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemedCard } from '@/src/components/shared/ThemedCard';
import { AIAssistantModal } from '@/src/components/ai/AIAssistantModal';
import {
  Sparkles,
  MessageCircle,
  Calendar,
  HelpCircle,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react-native';

export default function AIAssistantScreen() {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const features = [
    {
      icon: MessageCircle,
      title: 'Smart Conversations',
      description: 'Chat naturally about your leave needs and get instant help',
    },
    {
      icon: Calendar,
      title: 'Date Optimization',
      description: 'Get suggestions for the best leave dates based on holidays and weekends',
    },
    {
      icon: HelpCircle,
      title: 'Policy Guidance',
      description: 'Ask questions about leave policies and get clear answers',
    },
    {
      icon: Lightbulb,
      title: 'Professional Reasons',
      description: 'Generate appropriate leave reasons for your applications',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft
            size={24}
            color={'text' in colors ? colors.text : colors.onSurface}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            {
              color: 'text' in colors ? colors.text : colors.onSurface,
            },
          ]}
        >
          AI Leave Assistant
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View
            style={[
              styles.sparkleContainer,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Sparkles size={48} color={colors.primary} />
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                color: 'text' in colors ? colors.text : colors.onSurface,
              },
            ]}
          >
            Your Intelligent Leave Assistant
          </Text>

          <Text
            style={[
              styles.heroSubtitle,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Powered by Google Gemini AI, I can help you plan leaves, understand
            policies, and make better decisions about your time off.
          </Text>

          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={colors.onPrimary} />
            <Text style={[styles.startButtonText, { color: colors.onPrimary }]}>Start Conversation</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            WHAT I CAN DO
          </Text>

          {features.map((feature, index) => (
            <ThemedCard key={index} style={styles.featureCard}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
              >
                <feature.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text
                  style={[
                    styles.featureTitle,
                    {
                      color: 'text' in colors ? colors.text : colors.onSurface,
                    },
                  ]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {feature.description}
                </Text>
              </View>
            </ThemedCard>
          ))}
        </View>

        {/* Examples */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            EXAMPLE QUESTIONS
          </Text>

          <ThemedCard style={styles.examplesCard}>
            {[
              'I need leave for a family wedding next month',
              'What are the rules for taking earned leave?',
              'Suggest the best dates for a week-long vacation',
              'Can I take 5 days casual leave in December?',
              'Help me write a professional leave reason',
            ].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleItem}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.exampleText,
                    {
                      color: 'text' in colors ? colors.text : colors.onSurface,
                    },
                  ]}
                >
                  "{example}"
                </Text>
                <MessageCircle
                  size={16}
                  color={
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant
                  }
                />
              </TouchableOpacity>
            ))}
          </ThemedCard>
        </View>

        {/* Note */}
        <ThemedCard style={styles.noteCard}>
          <Text
            style={[
              styles.noteText,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            <Text style={{ fontWeight: '600' }}>Note:</Text> AI suggestions are
            helpful but should be reviewed. Always verify leave policies and
            availability before submitting applications.
          </Text>
        </ThemedCard>
      </ScrollView>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

import { spacing, radius, typography } from '@/src/theme/designTokens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.xxl + spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  placeholder: {
    width: spacing.xl,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: radius.lg,
    paddingBottom: spacing.xxl * 2 + spacing.sm,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sparkleContainer: {
    width: spacing.xxl * 3,
    height: spacing.xxl * 3,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: radius.lg,
  },
  heroTitle: {
    fontSize: typography.display.fontSize - 4,
    fontWeight: typography.display.fontWeight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  startButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  featureCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  featureIcon: {
    width: spacing.xxl + spacing.sm,
    height: spacing.xxl + spacing.sm,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.heading.lineHeight,
  },
  examplesCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  exampleText: {
    flex: 1,
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
    fontStyle: 'italic',
  },
  noteCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.body.lineHeight - 2,
  },
});
