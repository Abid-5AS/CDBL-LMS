import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useLeaveApplications } from '@/src/hooks/useLeaveApplications';
import { ThemedCard } from '@/src/components/shared/ThemedCard';
import { SyncStatusBanner } from '@/src/components/shared/SyncStatusBanner';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { X } from 'lucide-react-native';

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
          if (app.status === 'approved') color = '#4CAF50';
          if (app.status === 'pending') color = '#FF9800';
          if (app.status === 'rejected') color = '#F44336';

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
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
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
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary,
              dayTextColor: 'text' in colors ? colors.text : colors.onSurface,
              textDisabledColor: isDark ? '#4A4A4A' : '#D1D1D6',
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
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
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
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
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
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
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
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
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
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
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
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
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
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarCard: {
    padding: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  legendCard: {
    padding: 16,
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
  legendText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsCard: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  noLeavesText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 40,
  },
  leaveItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaveDates: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  leaveReason: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  leaveDays: {
    fontSize: 13,
    fontWeight: '600',
  },
});
