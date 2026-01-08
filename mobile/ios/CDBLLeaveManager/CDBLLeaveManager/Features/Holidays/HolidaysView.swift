//
//  HolidaysView.swift
//  CDBLLeaveManager
//
//  Holiday calendar view.
//

import SwiftUI
import Combine

struct HolidaysView: View {
    @StateObject private var viewModel = HolidaysViewModel()
    @State private var selectedYear = Calendar.current.component(.year, from: Date())
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            header
            
            // Year Selector
            yearSelector
            
            // Content
            if viewModel.isLoading {
                LoadingView()
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task { await viewModel.loadHolidays(year: selectedYear) }
                }
            } else if viewModel.holidays.isEmpty {
                EmptyStateView(
                    icon: "calendar",
                    title: "No Holidays",
                    message: "No holidays listed for \(selectedYear)"
                )
            } else {
                holidaysList
            }
        }
        .task {
            await viewModel.loadHolidays(year: selectedYear)
        }
        .onChange(of: selectedYear) { _, newYear in
            Task { await viewModel.loadHolidays(year: newYear) }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Holidays")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            
            Spacer()
            
            Text("\(viewModel.holidays.count) holidays")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Year Selector
    
    private var yearSelector: some View {
        HStack(spacing: 16) {
            Button(action: { selectedYear -= 1 }) {
                Image(systemName: "chevron.left")
                    .foregroundStyle(.white)
                    .padding(8)
                    .glassEffect(in: Circle())
            }
            
            Text("\(selectedYear)")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(.white)
                .frame(width: 80)
            
            Button(action: { selectedYear += 1 }) {
                Image(systemName: "chevron.right")
                    .foregroundStyle(.white)
                    .padding(8)
                    .glassEffect(in: Circle())
            }
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
        .padding(.bottom, 16)
    }
    
    // MARK: - Holidays List
    
    private var holidaysList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.groupedHolidays, id: \.0) { month, holidays in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(month)
                            .font(.headline)
                            .foregroundStyle(.white.opacity(0.8))
                            .padding(.horizontal)
                        
                        ForEach(holidays) { holiday in
                            HolidayCard(holiday: holiday)
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

// MARK: - Holiday Card

struct HolidayCard: View {
    let holiday: Holiday
    
    var body: some View {
        HStack(spacing: 16) {
            // Date Display
            VStack(spacing: 2) {
                Text(dayOfMonth)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                
                Text(dayOfWeek)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.6))
            }
            .frame(width: 50)
            .padding()
            .background(holiday.isOptional ? Color.orange.opacity(0.2) : Color.cyan.opacity(0.2))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(holiday.name)
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    if holiday.isOptional {
                        Text("Optional")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.3))
                            .clipShape(Capsule())
                            .foregroundStyle(.orange)
                    }
                }
                
                if let description = holiday.description, !description.isEmpty {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                        .lineLimit(2)
                }
            }
            
            Spacer()
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private var dayOfMonth: String {
        let components = holiday.date.split(separator: "-")
        if components.count >= 3 {
            return String(components[2])
        }
        return ""
    }
    
    private var dayOfWeek: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: holiday.date) {
            formatter.dateFormat = "EEE"
            return formatter.string(from: date)
        }
        return ""
    }
}

// MARK: - ViewModel

@MainActor
final class HolidaysViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var holidays: [Holiday] = []
    
    private let dashboardService = DashboardService.shared
    
    var groupedHolidays: [(String, [Holiday])] {
        let grouped = Dictionary(grouping: holidays) { holiday -> String in
            let components = holiday.date.split(separator: "-")
            if components.count >= 2 {
                let month = Int(components[1]) ?? 1
                let formatter = DateFormatter()
                formatter.dateFormat = "MMMM"
                var dateComponents = DateComponents()
                dateComponents.month = month
                if let date = Calendar.current.date(from: dateComponents) {
                    return formatter.string(from: date)
                }
            }
            return "Unknown"
        }
        
        return grouped.sorted { 
            monthOrder($0.key) < monthOrder($1.key)
        }
    }
    
    private func monthOrder(_ monthName: String) -> Int {
        let months = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        return months.firstIndex(of: monthName) ?? 12
    }
    
    func loadHolidays(year: Int) async {
        isLoading = true
        error = nil
        
        do {
            let response = try await dashboardService.getHolidays(year: year)
            holidays = response.holidays
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    ZStack {
        FluidBackground()
        HolidaysView()
    }
}
