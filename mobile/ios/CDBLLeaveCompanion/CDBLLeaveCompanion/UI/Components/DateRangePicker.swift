//
//  DateRangePicker.swift
//  CDBLLeaveCompanion
//
//  Modern inline calendar date range picker component
//  Following premium iOS app design patterns
//

import SwiftUI

struct DateRangePicker: View {
    @Binding var startDate: Date
    @Binding var endDate: Date
    
    let minimumDate: Date
    let maximumDate: Date
    
    @State private var selectedMonth: Date
    @State private var selectionMode: SelectionMode = .start
    @State private var hoveredDate: Date?
    
    enum SelectionMode {
        case start
        case end
    }
    
    init(
        startDate: Binding<Date>,
        endDate: Binding<Date>,
        minimumDate: Date,
        maximumDate: Date = .distantFuture
    ) {
        self._startDate = startDate
        self._endDate = endDate
        self.minimumDate = minimumDate
        self.maximumDate = maximumDate
        self._selectedMonth = State(initialValue: startDate.wrappedValue)
    }
    
    /// Check if a date is a weekend (Friday or Saturday in Bangladesh)
    private func isWeekend(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        // Calendar.component(.weekday) returns: 1=Sunday, 2=Monday, ..., 7=Saturday
        // Weekends: Friday(6), Saturday(7)
        return weekday == 6 || weekday == 7
    }
    
    /// Check if a date is selectable (not weekend and within range)
    private func isDateSelectable(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let dateDay = calendar.startOfDay(for: date)
        let minDay = calendar.startOfDay(for: minimumDate)
        let maxDay = calendar.startOfDay(for: maximumDate)
        
        return dateDay >= minDay && dateDay <= maxDay && !isWeekend(date)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
            // Month navigation
            monthNavigation
            
            // Calendar grid
            calendarGrid
            
            // Selected dates summary
            selectedDatesSummary
        }
        .padding(StyleGuide.Spacing.md)
        .background(.ultraThinMaterial)
        .background(
            RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium, style: .continuous)
                .fill(StyleGuide.Colors.fieldBackground)
        )
        .cornerRadius(StyleGuide.CornerRadius.medium)
        .overlay(
            RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [
                            StyleGuide.Colors.accentGradientStart.opacity(0.3),
                            StyleGuide.Colors.accentGradientEnd.opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
    }
    
    // MARK: - Month Navigation
    
    private var monthNavigation: some View {
        HStack {
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedMonth = Calendar.current.date(byAdding: .month, value: -1, to: selectedMonth) ?? selectedMonth
                }
                HapticFeedback.selection()
            }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(StyleGuide.Colors.foreground)
                    .frame(width: 32, height: 32)
                    .background(.ultraThinMaterial)
                    .cornerRadius(8)
            }
            
            Spacer()
            
            Text(selectedMonth.formatted(.dateTime.month(.wide).year()))
                .font(StyleGuide.Typography.title3)
                .foregroundColor(StyleGuide.Colors.foreground)
            
            Spacer()
            
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedMonth = Calendar.current.date(byAdding: .month, value: 1, to: selectedMonth) ?? selectedMonth
                }
                HapticFeedback.selection()
            }) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(StyleGuide.Colors.foreground)
                    .frame(width: 32, height: 32)
                    .background(.ultraThinMaterial)
                    .cornerRadius(8)
            }
        }
    }
    
    // MARK: - Calendar Grid
    
    private var calendarGrid: some View {
        VStack(spacing: StyleGuide.Spacing.xs) {
            // Weekday headers
            HStack(spacing: 0) {
                ForEach(Calendar.current.shortWeekdaySymbols, id: \.self) { weekday in
                    Text(weekday)
                        .font(StyleGuide.Typography.caption2)
                        .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.bottom, StyleGuide.Spacing.xs)
            
            // Calendar days
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(calendarDays, id: \.self) { date in
                    calendarDayView(for: date)
                }
            }
        }
    }
    
    private var calendarDays: [Date] {
        let calendar = Calendar.current
        guard let monthInterval = calendar.dateInterval(of: .month, for: selectedMonth),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfYear, for: monthInterval.start),
              let monthLastWeek = calendar.dateInterval(of: .weekOfYear, for: monthInterval.end - 1) else {
            return []
        }
        
        var days: [Date] = []
        var currentDate = monthFirstWeek.start
        
        while currentDate <= monthLastWeek.end {
            days.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return days
    }
    
    @ViewBuilder
    private func calendarDayView(for date: Date) -> some View {
        let calendar = Calendar.current
        let day = calendar.component(.day, from: date)
        let isToday = calendar.isDateInToday(date)
        let isInRange = date >= startDate && date <= endDate
        let isStart = calendar.isDate(date, inSameDayAs: startDate)
        let isEnd = calendar.isDate(date, inSameDayAs: endDate)
        let isSelectable = isDateSelectable(date)
        let isInCurrentMonth = calendar.isDate(date, equalTo: selectedMonth, toGranularity: .month)
        let isHovered = hoveredDate != nil && calendar.isDate(date, inSameDayAs: hoveredDate!)
        
        let isInRangeBetween = date > startDate && date < endDate
        
        Button(action: {
            selectDate(date)
        }) {
            ZStack {
                // Background
                if isStart || isEnd {
                    // Start/End date circle
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart,
                                    StyleGuide.Colors.accentGradientEnd
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 36, height: 36)
                } else if isInRangeBetween {
                    // Range fill
                    Rectangle()
                        .fill(StyleGuide.Colors.accentGradientStart.opacity(0.15))
                        .frame(height: 36)
                } else if isHovered && isSelectable {
                    // Hover state
                    Circle()
                        .fill(StyleGuide.Colors.accentGradientStart.opacity(0.2))
                        .frame(width: 36, height: 36)
                }
                
                // Day number
                Text("\(day)")
                    .font(isToday ? StyleGuide.Typography.bodyBold : StyleGuide.Typography.body)
                    .foregroundColor(
                        isSelectable
                            ? (isStart || isEnd
                                ? StyleGuide.Colors.primaryForeground
                                : (isInRangeBetween
                                    ? StyleGuide.Colors.accentGradientStart
                                    : StyleGuide.Colors.foreground))
                            : StyleGuide.Colors.foregroundTertiary.opacity(0.4)
                    )
                    .frame(width: 36, height: 36)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 36)
        }
        .disabled(!isSelectable || !isInCurrentMonth)
        .opacity(isInCurrentMonth ? 1 : 0.3)
        #if os(macOS)
        .onHover { hovering in
            hoveredDate = hovering ? date : nil
        }
        #endif
    }
    
    // MARK: - Selected Dates Summary
    
    private var selectedDatesSummary: some View {
        VStack(alignment: .leading, spacing: StyleGuide.Spacing.xs) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Start Date")
                        .font(StyleGuide.Typography.caption2)
                        .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                    Text(startDate.formatted(.dateTime.month(.abbreviated).day().year()))
                        .font(StyleGuide.Typography.bodyBold)
                        .foregroundColor(StyleGuide.Colors.foreground)
                }
                
                Spacer()
                
                Image(systemName: "arrow.right")
                    .font(.caption)
                    .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("End Date")
                        .font(StyleGuide.Typography.caption2)
                        .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                    Text(endDate.formatted(.dateTime.month(.abbreviated).day().year()))
                        .font(StyleGuide.Typography.bodyBold)
                        .foregroundColor(StyleGuide.Colors.foreground)
                }
            }
            .padding(.top, StyleGuide.Spacing.xs)
        }
    }
    
    // MARK: - Actions
    
    private func selectDate(_ date: Date) {
        // Prevent selection of weekends
        guard isDateSelectable(date) else {
            HapticFeedback.error()
            return
        }
        
        HapticFeedback.selection()
        
        let calendar = Calendar.current
        
        switch selectionMode {
        case .start:
            startDate = calendar.startOfDay(for: date)
            if startDate > endDate {
                endDate = startDate
            }
            // If end date is on weekend, adjust to next working day
            if LeaveRequest.isWeekend(endDate) {
                endDate = nextWorkingDay(after: endDate)
            }
            selectionMode = .end
        case .end:
            if date < startDate {
                startDate = calendar.startOfDay(for: date)
                endDate = startDate
                // If start date is on weekend, adjust to next working day
                if LeaveRequest.isWeekend(startDate) {
                    startDate = nextWorkingDay(after: startDate)
                    endDate = startDate
                }
                selectionMode = .end
            } else {
                endDate = calendar.startOfDay(for: date)
                selectionMode = .start
            }
        }
        
        // Auto-advance month if selected date is outside current month
        if !calendar.isDate(date, equalTo: selectedMonth, toGranularity: .month) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                selectedMonth = calendar.dateInterval(of: .month, for: date)?.start ?? selectedMonth
            }
        }
    }
    
    /// Find the next working day (non-weekend) after the given date
    private func nextWorkingDay(after date: Date) -> Date {
        let calendar = Calendar.current
        var nextDate = calendar.date(byAdding: .day, value: 1, to: date) ?? date
        
        // Skip weekends
        while LeaveRequest.isWeekend(nextDate) {
            nextDate = calendar.date(byAdding: .day, value: 1, to: nextDate) ?? nextDate
        }
        
        return calendar.startOfDay(for: nextDate)
    }
}

// MARK: - Preview

#if DEBUG
struct DateRangePicker_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            DateRangePicker(
                startDate: .constant(Date()),
                endDate: .constant(Calendar.current.date(byAdding: .day, value: 5, to: Date()) ?? Date()),
                minimumDate: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            )
            .padding()
        }
        .background(StyleGuide.Colors.background)
        .previewDisplayName("Date Range Picker")
    }
}
#endif

