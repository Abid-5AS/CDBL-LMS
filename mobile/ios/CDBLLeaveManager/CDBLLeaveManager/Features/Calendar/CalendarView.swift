//
//  CalendarView.swift
//  CDBLLeaveManager
//
//  Team calendar showing who's out.
//

import SwiftUI
import Combine

struct CalendarView: View {
    @State private var selectedDate = Date()
    @State private var currentMonth = Date()
    @StateObject private var viewModel = CalendarViewModel()
    
    private let calendar = Calendar.current
    private let daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Month Navigation
                        monthNavigation
                        
                        // Days of Week Header
                        daysHeader
                        
                        // Calendar Grid
                        calendarGrid
                        
                        // Events for Selected Date
                        eventsSection
                        
                        Spacer().frame(height: 100)
                    }
                    .padding(.top, 60)
                }
            }
            .task {
                await viewModel.loadEvents(for: currentMonth)
            }
            .onChange(of: currentMonth) { _, newMonth in
                Task { await viewModel.loadEvents(for: newMonth) }
            }
        }
    }
    
    // MARK: - Month Navigation
    
    private var monthNavigation: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left")
                    .foregroundStyle(.white)
                    .padding(12)
                    .glassEffect(in: Circle())
            }
            
            Spacer()
            
            Text(monthYearString)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.white)
            
            Spacer()
            
            Button(action: nextMonth) {
                Image(systemName: "chevron.right")
                    .foregroundStyle(.white)
                    .padding(12)
                    .glassEffect(in: Circle())
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Days Header
    
    private var daysHeader: some View {
        HStack(spacing: 0) {
            ForEach(daysOfWeek, id: \.self) { day in
                Text(day)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.white.opacity(0.6))
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Calendar Grid
    
    private var calendarGrid: some View {
        let days = generateDaysForMonth()
        let rows = days.chunked(into: 7)
        
        return VStack(spacing: 8) {
            ForEach(0..<rows.count, id: \.self) { rowIndex in
                HStack(spacing: 4) {
                    ForEach(0..<rows[rowIndex].count, id: \.self) { colIndex in
                        let day = rows[rowIndex][colIndex]
                        DayCell(
                            date: day.date,
                            isCurrentMonth: day.isCurrentMonth,
                            isSelected: isSameDay(day.date, selectedDate),
                            isToday: isSameDay(day.date, Date()),
                            hasEvents: viewModel.hasEvents(for: day.date)
                        ) {
                            selectedDate = day.date
                        }
                    }
                }
            }
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Events Section
    
    private var eventsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(formattedSelectedDate)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            let events = viewModel.events(for: selectedDate)
            
            if events.isEmpty {
                HStack {
                    Image(systemName: "calendar.badge.checkmark")
                        .foregroundStyle(.white.opacity(0.5))
                    Text("No events for this day")
                        .foregroundStyle(.white.opacity(0.6))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
            } else {
                VStack(spacing: 8) {
                    ForEach(0..<events.count, id: \.self) { index in
                        let event = events[index]
                        CalendarEventCard(event: event)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Helpers
    
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: currentMonth)
    }
    
    private var formattedSelectedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter.string(from: selectedDate)
    }
    
    private func previousMonth() {
        currentMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
    }
    
    private func nextMonth() {
        currentMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
    }
    
    private func isSameDay(_ date1: Date, _ date2: Date) -> Bool {
        calendar.isDate(date1, inSameDayAs: date2)
    }
    
    private func generateDaysForMonth() -> [CalendarDay] {
        var days: [CalendarDay] = []
        
        let firstOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: currentMonth))!
        let firstWeekday = calendar.component(.weekday, from: firstOfMonth) - 1
        
        // Previous month days
        for _ in 0..<firstWeekday {
            let date = calendar.date(byAdding: .day, value: -(firstWeekday - days.count), to: firstOfMonth)!
            days.append(CalendarDay(date: date, isCurrentMonth: false))
        }
        
        // Current month days
        let range = calendar.range(of: .day, in: .month, for: currentMonth)!
        for day in range {
            let date = calendar.date(byAdding: .day, value: day - 1, to: firstOfMonth)!
            days.append(CalendarDay(date: date, isCurrentMonth: true))
        }
        
        // Fill remaining cells
        while days.count < 42 && days.count % 7 != 0 {
            let date = calendar.date(byAdding: .day, value: 1, to: days.last!.date)!
            days.append(CalendarDay(date: date, isCurrentMonth: false))
        }
        
        return days
    }
}

// MARK: - Calendar Day Model

struct CalendarDay {
    let date: Date
    let isCurrentMonth: Bool
}

// MARK: - Day Cell

struct DayCell: View {
    let date: Date
    let isCurrentMonth: Bool
    let isSelected: Bool
    let isToday: Bool
    let hasEvents: Bool
    let action: () -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text("\(calendar.component(.day, from: date))")
                    .font(.subheadline)
                    .fontWeight(isToday ? .bold : .regular)
                    .foregroundStyle(textColor)
                
                if hasEvents {
                    Circle()
                        .fill(Color.cyan)
                        .frame(width: 6, height: 6)
                }
            }
            .frame(width: 40, height: 44)
            .background(
                isSelected ? Color.cyan.opacity(0.3) :
                isToday ? Color.white.opacity(0.1) :
                Color.clear
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
    
    private var textColor: Color {
        if isSelected {
            return .cyan
        } else if !isCurrentMonth {
            return .white.opacity(0.3)
        } else if isToday {
            return .cyan
        } else {
            return .white
        }
    }
}

// MARK: - Calendar Event Card

struct CalendarEventCard: View {
    let event: CalendarEvent
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(event.color.opacity(0.3))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(event.initials)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(event.color)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(event.employeeName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                Text(event.leaveType.capitalized)
                    .font(.caption)
                    .foregroundStyle(event.color)
            }
            
            Spacer()
            
            Text(event.duration)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Calendar Event Model

struct CalendarEvent: Identifiable {
    let id = UUID()
    let employeeName: String
    let leaveType: String
    let date: Date
    let duration: String
    let color: Color
    
    var initials: String {
        let parts = employeeName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return employeeName.prefix(2).uppercased()
    }
}

// MARK: - ViewModel

@MainActor
final class CalendarViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var calendarEvents: [CalendarEvent] = []
    
    private let dashboardService = DashboardService.shared
    private let calendar = Calendar.current
    
    func loadEvents(for month: Date) async {
        isLoading = true
        
        do {
            let response = try await dashboardService.getTeamCalendar(
                month: calendar.component(.month, from: month),
                year: calendar.component(.year, from: month)
            )
            
            calendarEvents = response.entries.map { entry in
                CalendarEvent(
                    employeeName: entry.employeeName,
                    leaveType: entry.leaveType,
                    date: parseDate(entry.date),
                    duration: entry.isHalfDay ? "Half Day" : "Full Day",
                    color: colorForType(entry.leaveType)
                )
            }
            
            isLoading = false
        } catch {
            isLoading = false
        }
    }
    
    func hasEvents(for date: Date) -> Bool {
        calendarEvents.contains { calendar.isDate($0.date, inSameDayAs: date) }
    }
    
    func events(for date: Date) -> [CalendarEvent] {
        calendarEvents.filter { calendar.isDate($0.date, inSameDayAs: date) }
    }
    
    private func parseDate(_ dateString: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: dateString) ?? Date()
    }
    
    private func colorForType(_ type: String) -> Color {
        switch type.uppercased() {
        case "EARNED": return .indigo
        case "CASUAL": return .cyan
        case "MEDICAL": return .red
        case "COMPENSATORY": return .orange
        default: return .purple
        }
    }
}

// MARK: - Array Extension

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}

#Preview {
    CalendarView()
}
