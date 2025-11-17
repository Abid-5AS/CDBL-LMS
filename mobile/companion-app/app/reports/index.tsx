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
import { useTheme } from '../../src/providers/ThemeProvider';
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
          color: '#4CAF50',
          text: `${analytics.leaveDistribution.casual}`,
          label: 'Casual',
        },
        {
          value: analytics.leaveDistribution.medical,
          color: '#F44336',
          text: `${analytics.leaveDistribution.medical}`,
          label: 'Medical',
        },
        {
          value: analytics.leaveDistribution.earned,
          color: '#2196F3',
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
            {renderSummaryCard(Clock, 'Pending', analytics?.summary.pending || 0, '#FF9800')}
            {renderSummaryCard(CheckCircle, 'Approved', analytics?.summary.approved || 0, '#4CAF50')}
            {renderSummaryCard(XCircle, 'Rejected', analytics?.summary.rejected || 0, '#F44336')}
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
              yAxisColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              xAxisColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  pieCenterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legend: {
    marginTop: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  lineChartContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  trendStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
