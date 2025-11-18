import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useLeaveApplications } from '@/src/hooks/useLeaveApplications';
import { ThemedCard } from '@/src/components/shared/ThemedCard';
import { SyncStatusBanner } from '@/src/components/shared/SyncStatusBanner';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { X } from 'lucide-react-native';
import { spacing, typography, radius } from '@/src/theme/designTokens';

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const { applications, isLoading } = useLeaveApplications();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  // Create marked dates object for calendar
  const markedDates = useMemo(() => {
    const marks: any = {};

    applications.forEach((app) => {
      // Get all dates in the leave range
      try {
        const startDate = parseISO(app.start_date);
        const endDate = parseISO(app.end_date);
        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

        datesInRange.forEach((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');

          // Color code by status
          let color = colors.primary;
          if (app.status === 'approved') color = colors.success;
          if (app.status === 'pending') color = colors.warning;
          if (app.status === 'rejected') color = colors.error;

          if (!marks[dateKey]) {
            marks[dateKey] = {
              marked: true,
              dotColor: color,
              selectedDotColor: color,
            };
          } else {
            // Multiple leaves on same day
            marks[dateKey] = {
              ...marks[dateKey],
              dots: [
                ...(marks[dateKey].dots || [{ color: marks[dateKey].dotColor }]),
                { color },
              ],
              marked: true,
              dotColor: undefined,
            };
          }
        });
      } catch (error) {
        console.error('Error parsing leave dates:', error);
      }
    });

    // Add selected date styling
    if (selectedDate && marks[selectedDate]) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary + '40',
      };
    } else if (selectedDate) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: colors.primary + '40',
      };
    }

    return marks;
  }, [applications, selectedDate, colors.primary]);

  // Get leaves for selected date
  const leavesOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    return applications.filter((app) => {
      try {
        const startDate = parseISO(app.start_date);
        const endDate = parseISO(app.end_date);
        const selected = parseISO(selectedDate);

        return selected >= startDate && selected <= endDate;
      } catch {
        return false;
      }
    });
  }, [applications, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    if (markedDates[day.dateString]) {
      setModalVisible(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'pending':
        return '⏱';
      case 'rejected':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <>
      <SyncStatusBanner />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: 'text' in colors ? colors.text : colors.onSurface },
            ]}
          >
            Leave Calendar
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
            View your leave schedule
          </Text>
        </View>

        {/* Calendar */}
        <ThemedCard style={styles.calendarCard}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            markingType="multi-dot"
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor:
                'textSecondary' in colors ? colors.textSecondary : colors.onSurfaceVariant,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onPrimary,
              todayTextColor: colors.primary,
              dayTextColor: 'text' in colors ? colors.text : colors.onSurface,
              textDisabledColor: colors.disabled,
              monthTextColor: 'text' in colors ? colors.text : colors.onSurface,
              indicatorColor: colors.primary,
              arrowColor: colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
          />
        </ThemedCard>

        {/* Legend */}
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
            LEGEND
          </Text>

          <ThemedCard style={styles.legendCard}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text
                style={[
                  styles.legendText,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                Approved Leave
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text
                style={[
                  styles.legendText,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                Pending Leave
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text
                style={[
                  styles.legendText,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                Rejected Leave
              </Text>
            </View>
          </ThemedCard>
        </View>

        {/* Stats */}
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
            OVERVIEW
          </Text>

          <ThemedCard style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Total Applications
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {applications.length}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Approved
              </Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {applications.filter((a) => a.status === 'approved').length}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      'textSecondary' in colors
                        ? colors.textSecondary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Pending
              </Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {applications.filter((a) => a.status === 'pending').length}
              </Text>
            </View>
          </ThemedCard>
        </View>
      </ScrollView>

      {/* Day Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: 'text' in colors ? colors.text : colors.onSurface },
                ]}
              >
                {selectedDate && format(parseISO(selectedDate), 'MMMM dd, yyyy')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X
                  size={24}
                  color={'text' in colors ? colors.text : colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {leavesOnSelectedDate.length === 0 ? (
                <Text
                  style={[
                    styles.noLeavesText,
                    {
                      color:
                        'textSecondary' in colors
                          ? colors.textSecondary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  No leaves on this day
                </Text>
              ) : (
                leavesOnSelectedDate.map((leave, index) => (
                  <View
                    key={index}
                    style={[
                      styles.leaveItem,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderLeftColor: getStatusColor(leave.status),
                      },
                    ]}
                  >
                    <View style={styles.leaveHeader}>
                      <Text
                        style={[
                          styles.leaveType,
                          { color: 'text' in colors ? colors.text : colors.onSurface },
                        ]}
                      >
                        {leave.leave_type}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(leave.status) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(leave.status) },
                          ]}
                        >
                          {getStatusIcon(leave.status)} {leave.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.leaveDates,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {format(parseISO(leave.start_date), 'MMM dd')} -{' '}
                      {format(parseISO(leave.end_date), 'MMM dd, yyyy')}
                    </Text>

                    <Text
                      style={[
                        styles.leaveReason,
                        {
                          color:
                            'textSecondary' in colors
                              ? colors.textSecondary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {leave.reason}
                    </Text>

                    <Text
                      style={[
                        styles.leaveDays,
                        { color: colors.primary },
                      ]}
                    >
                      {leave.working_days} {leave.working_days === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: typography.display.fontSize,
    fontWeight: typography.display.fontWeight,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  calendarCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  legendCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.sm,
  },
  legendText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  statsCard: {
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  statValue: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.heading.fontSize,
    fontWeight: typography.display.fontWeight,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  noLeavesText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  leaveItem: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leaveType: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
  leaveDates: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.xs,
  },
  leaveReason: {
    fontSize: radius.md,
    fontWeight: typography.body.fontWeight,
    marginBottom: spacing.sm,
  },
  leaveDays: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.heading.fontWeight,
  },
});
