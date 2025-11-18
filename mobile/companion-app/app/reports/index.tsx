import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedCard } from '../../src/components/shared/ThemedCard';
import { useTheme } from '@/src/providers/ThemeProvider';
import { apiClient } from '../../src/api/client';
import { API_ENDPOINTS } from '../../src/api/endpoints';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import {
  ChevronLeft,
  TrendingUp,
  FileText,
  XCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { spacing, radius, typography } from '../../src/theme/designTokens';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;

interface AnalyticsData {
  summary: {
    totalLeaves: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  leaveDistribution: {
    casual: number;
    medical: number;
    earned: number;
  };
  trends: {
    month: string;
    requests: number;
  }[];
}

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.get<AnalyticsData>(
        API_ENDPOINTS.REPORTS.ANALYTICS
      );

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        // Mock data for demonstration
        setAnalytics({
          summary: {
            totalLeaves: 124,
            pending: 12,
            approved: 98,
            rejected: 14,
          },
          leaveDistribution: {
            casual: 45,
            medical: 28,
            earned: 51,
          },
          trends: [
            { month: 'Jul', requests: 18 },
            { month: 'Aug', requests: 22 },
            { month: 'Sep', requests: 19 },
            { month: 'Oct', requests: 25 },
            { month: 'Nov', requests: 21 },
            { month: 'Dec', requests: 19 },
          ],
        });
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      // Use mock data on error
      setAnalytics({
        summary: {
          totalLeaves: 124,
          pending: 12,
          approved: 98,
          rejected: 14,
        },
        leaveDistribution: {
          casual: 45,
          medical: 28,
          earned: 51,
        },
        trends: [
          { month: 'Jul', requests: 18 },
          { month: 'Aug', requests: 22 },
          { month: 'Sep', requests: 19 },
          { month: 'Oct', requests: 25 },
          { month: 'Nov', requests: 21 },
          { month: 'Dec', requests: 19 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare pie chart data
  const pieData = analytics
    ? [
        {
          value: analytics.leaveDistribution.casual,
          color: colors.success,
          text: `${analytics.leaveDistribution.casual}`,
          label: 'Casual',
        },
        {
          value: analytics.leaveDistribution.medical,
          color: colors.error,
          text: `${analytics.leaveDistribution.medical}`,
          label: 'Medical',
        },
        {
          value: analytics.leaveDistribution.earned,
          color: colors.primary,
          text: `${analytics.leaveDistribution.earned}`,
          label: 'Earned',
        },
      ]
    : [];

  // Prepare line chart data
  const lineData = analytics
    ? analytics.trends.map((item) => ({
        value: item.requests,
        label: item.month,
        dataPointText: `${item.requests}`,
      }))
    : [];

  const renderSummaryCard = (
    icon: React.ComponentType<any>,
    label: string,
    value: number,
    color: string
  ) => {
    const Icon = icon;
    return (
      <ThemedCard style={[styles.summaryCard, { minWidth: (width - 64) / 3 }]}>
        <View style={[styles.summaryIcon, { backgroundColor: color + '20' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text
          style={[
            styles.summaryValue,
            { color: 'text' in colors ? colors.text : colors.onSurface },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.summaryLabel,
            {
              color:
                'textSecondary' in colors
                  ? colors.textSecondary
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
      </ThemedCard>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text
            style={[
              styles.title,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
          >
            Analytics Dashboard
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Leave insights and trends
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryScroll}
          >
            {renderSummaryCard(FileText, 'Total Leaves', analytics?.summary.totalLeaves || 0, colors.primary)}
            {renderSummaryCard(Clock, 'Pending', analytics?.summary.pending || 0, colors.warning)}
            {renderSummaryCard(CheckCircle, 'Approved', analytics?.summary.approved || 0, colors.success)}
            {renderSummaryCard(XCircle, 'Rejected', analytics?.summary.rejected || 0, colors.error)}
          </ScrollView>
        </View>

        {/* Leave Distribution - Pie Chart */}
        <ThemedCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text
              style={[
                styles.chartTitle,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              Leave Distribution
            </Text>
            <Text
              style={[
                styles.chartSubtitle,
                {
                  color:
                    'textSecondary' in colors
                      ? colors.textSecondary
                      : colors.onSurfaceVariant,
                },
              ]}
            >
              By leave type
            </Text>
          </View>

          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={50}
              centerLabelComponent={() => (
                <View style={styles.pieCenter}>
                  <Text
                    style={[
                      styles.pieCenterValue,
                      { color: 'text' in colors ? colors.text : colors.onSurface },
                    ]}
                  >
                    {(analytics?.leaveDistribution.casual || 0) +
                      (analytics?.leaveDistribution.medical || 0) +
                      (analytics?.leaveDistribution.earned || 0)}
                  </Text>
                  <Text
                    style={[
                      styles.pieCenterLabel,
                      {
                        color:
                          'textSecondary' in colors
                            ? colors.textSecondary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Total
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text
                  style={[
                    styles.legendLabel,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.legendValue,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </ThemedCard>

        {/* Trend Line - Line Chart */}
        <ThemedCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartHeaderLeft}>
              <TrendingUp size={24} color={colors.primary} />
              <View>
                <Text
                  style={[
                    styles.chartTitle,
                    { color: 'text' in colors ? colors.text : colors.onSurface },
                  ]}
                >
                  Leave Request Trends
                </Text>
                <Text
                  style={[
                    styles.chartSubtitle,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Last 6 months
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.lineChartContainer}>
            <LineChart
              data={lineData}
              width={CHART_WIDTH - 40}
              height={200}
              spacing={(CHART_WIDTH - 40) / (lineData.length + 1)}
              initialSpacing={20}
              color={colors.primary}
              thickness={3}
              startFillColor={colors.primary + '40'}
              endFillColor={colors.primary + '10'}
              startOpacity={0.4}
              endOpacity={0.1}
              areaChart
              curved
              yAxisColor={colors.border}
              xAxisColor={colors.border}
              yAxisTextStyle={{
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
                fontSize: 10,
                fontWeight: '500',
              }}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              textColor={
                'text' in colors ? colors.text : colors.onSurface
              }
              textFontSize={10}
              textShiftY={-8}
              hideRules
              hideDataPoints={false}
            />
          </View>

          {/* Stats */}
          <View style={styles.trendStats}>
            <View style={styles.trendStat}>
              <Text
                style={[
                  styles.trendStatLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Average
              </Text>
              <Text
                style={[
                  styles.trendStatValue,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {analytics
                  ? Math.round(
                      analytics.trends.reduce((sum, item) => sum + item.requests, 0) /
                        analytics.trends.length
                    )
                  : 0}
              </Text>
            </View>
            <View style={styles.trendStat}>
              <Text
                style={[
                  styles.trendStatLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Peak Month
              </Text>
              <Text
                style={[
                  styles.trendStatValue,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {analytics
                  ? analytics.trends.reduce((max, item) =>
                      item.requests > max.requests ? item : max
                    ).month
                  : '-'}
              </Text>
            </View>
            <View style={styles.trendStat}>
              <Text
                style={[
                  styles.trendStatLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Total
              </Text>
              <Text
                style={[
                  styles.trendStatValue,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {analytics
                  ? analytics.trends.reduce((sum, item) => sum + item.requests, 0)
                  : 0}
              </Text>
            </View>
          </View>
        </ThemedCard>

        {/* Additional Info Card */}
        <ThemedCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text
              style={[
                styles.infoTitle,
                { color: 'text' in colors ? colors.text : colors.onSurface },
              ]}
            >
              Report Period
            </Text>
          </View>
          <Text
            style={[
              styles.infoText,
              {
                color:
                  'textSecondary' in colors
                    ? colors.textSecondary
                    : colors.onSurfaceVariant,
              },
            ]}
          >
            Data shown is for the last 6 months. Analytics are updated in real-time as
            leave requests are processed.
          </Text>
        </ThemedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: radius.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: radius.xl,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: typography.display.lineHeight,
  },
  summaryContainer: {
    marginBottom: radius.lg,
  },
  summaryScroll: {
    paddingHorizontal: radius.lg,
    gap: spacing.md,
  },
  summaryCard: {
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 100,
  },
  summaryIcon: {
    width: typography.display.lineHeight,
    height: typography.display.lineHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontSize: spacing.lg,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: typography.body.fontWeight,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: radius.lg,
    marginBottom: radius.lg,
    padding: radius.lg,
  },
  chartHeader: {
    marginBottom: radius.lg,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chartTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: radius.lg,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterValue: {
    fontSize: spacing.lg,
    fontWeight: typography.display.fontWeight,
  },
  pieCenterLabel: {
    fontSize: 12,
    fontWeight: typography.body.fontWeight,
  },
  legend: {
    marginTop: radius.lg,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
    flex: 1,
  },
  legendValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  lineChartContainer: {
    marginVertical: radius.lg,
    alignItems: 'center',
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: radius.lg,
    paddingTop: radius.lg,
    borderTopWidth: 1,
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatLabel: {
    fontSize: 12,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.xs,
  },
  trendStatValue: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  infoCard: {
    marginHorizontal: radius.lg,
    padding: spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: radius.md,
    fontWeight: typography.heading.fontWeight,
  },
  infoText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.heading.lineHeight,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
});
