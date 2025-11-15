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
            backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
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
            <MessageCircle size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Conversation</Text>
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
    paddingTop: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sparkleContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  examplesCard: {
    padding: 16,
    gap: 12,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  noteCard: {
    padding: 16,
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
