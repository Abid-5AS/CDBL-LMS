//
//  HistoryFilters.swift
//  CDBLLeaveCompanion
//
//  Filter chips component for leave history
//

import SwiftUI

enum HistoryFilter: Identifiable, Hashable {
    case status(LeaveStatus)
    case type(LeaveType)
    case dateRange(DateRangeFilter)
    case duration(DurationFilter)
    
    var id: String {
        switch self {
        case .status(let status): return "status_\(status.rawValue)"
        case .type(let type): return "type_\(type.rawValue)"
        case .dateRange(let range): return "date_\(range.rawValue)"
        case .duration(let duration): return "duration_\(duration.rawValue)"
        }
    }
    
    var displayName: String {
        switch self {
        case .status(let status): return status.displayName
        case .type(let type): return type.displayName
        case .dateRange(let range): return range.displayName
        case .duration(let duration): return duration.displayName
        }
    }
}

enum DateRangeFilter: String, CaseIterable {
    case thisMonth = "this_month"
    case thisYear = "this_year"
    case lastYear = "last_year"
    case custom = "custom"
    
    var displayName: String {
        switch self {
        case .thisMonth: return "This Month"
        case .thisYear: return "This Year"
        case .lastYear: return "Last Year"
        case .custom: return "Custom Range"
        }
    }
    
    func dateRange() -> (start: Date, end: Date)? {
        let calendar = Calendar.current
        let now = Date()
        
        switch self {
        case .thisMonth:
            if let interval = calendar.dateInterval(of: .month, for: now) {
                return (interval.start, interval.end)
            }
        case .thisYear:
            if let interval = calendar.dateInterval(of: .year, for: now) {
                return (interval.start, interval.end)
            }
        case .lastYear:
            if let lastYear = calendar.date(byAdding: .year, value: -1, to: now),
               let interval = calendar.dateInterval(of: .year, for: lastYear) {
                return (interval.start, interval.end)
            }
        case .custom:
            return nil
        }
        
        return nil
    }
}

enum DurationFilter: String, CaseIterable {
    case oneToThree = "1-3"
    case fourToSeven = "4-7"
    case eightPlus = "8+"
    
    var displayName: String {
        switch self {
        case .oneToThree: return "1-3 days"
        case .fourToSeven: return "4-7 days"
        case .eightPlus: return "8+ days"
        }
    }
    
    func matches(_ days: Int) -> Bool {
        switch self {
        case .oneToThree: return days >= 1 && days <= 3
        case .fourToSeven: return days >= 4 && days <= 7
        case .eightPlus: return days >= 8
        }
    }
}

struct HistoryFilters: View {
    @Binding var selectedFilters: Set<HistoryFilter>
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: StyleGuide.Spacing.sm) {
                // Status filters
                ForEach(LeaveStatus.allCases) { status in
                    FilterChip(
                        title: status.displayName,
                        isSelected: selectedFilters.contains(.status(status)),
                        action: {
                            if selectedFilters.contains(.status(status)) {
                                selectedFilters.remove(.status(status))
                            } else {
                                // Remove other status filters first
                                selectedFilters = selectedFilters.filter { !($0.id.starts(with: "status_")) }
                                selectedFilters.insert(.status(status))
                            }
                        }
                    )
                }
                
                // Type filters
                ForEach(LeaveType.primaryTypes) { type in
                    FilterChip(
                        title: type.displayName,
                        isSelected: selectedFilters.contains(.type(type)),
                        action: {
                            if selectedFilters.contains(.type(type)) {
                                selectedFilters.remove(.type(type))
                            } else {
                                selectedFilters.insert(.type(type))
                            }
                        }
                    )
                }
                
                // Date range filters
                ForEach(DateRangeFilter.allCases, id: \.self) { range in
                    FilterChip(
                        title: range.displayName,
                        isSelected: selectedFilters.contains(.dateRange(range)),
                        action: {
                            if selectedFilters.contains(.dateRange(range)) {
                                selectedFilters.remove(.dateRange(range))
                            } else {
                                // Remove other date range filters
                                selectedFilters = selectedFilters.filter { !($0.id.starts(with: "date_")) }
                                selectedFilters.insert(.dateRange(range))
                            }
                        }
                    )
                }
                
                // Duration filters
                ForEach(DurationFilter.allCases, id: \.self) { duration in
                    FilterChip(
                        title: duration.displayName,
                        isSelected: selectedFilters.contains(.duration(duration)),
                        action: {
                            if selectedFilters.contains(.duration(duration)) {
                                selectedFilters.remove(.duration(duration))
                            } else {
                                selectedFilters.insert(.duration(duration))
                            }
                        }
                    )
                }
            }
            .padding(.horizontal, StyleGuide.Spacing.md)
        }
        .padding(.vertical, StyleGuide.Spacing.sm)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            HapticFeedback.selection()
            action()
        }) {
            Text(title)
                .font(StyleGuide.Typography.caption)
                .padding(.horizontal, StyleGuide.Spacing.md)
                .padding(.vertical, StyleGuide.Spacing.sm)
                .background(
                    Group {
                        if isSelected {
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart.opacity(0.5),
                                    StyleGuide.Colors.accentGradientEnd.opacity(0.35)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        } else {
                            StyleGuide.Colors.elevatedSurface.opacity(0.55)
                        }
                    }
                )
                .foregroundColor(isSelected ? StyleGuide.Colors.primaryForeground : StyleGuide.Colors.foreground)
                .cornerRadius(StyleGuide.CornerRadius.small)
                .overlay(
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart.opacity(isSelected ? 0.55 : 0.3),
                                    StyleGuide.Colors.accentGradientEnd.opacity(isSelected ? 0.35 : 0.25)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            lineWidth: 1
                        )
                )
        }
    }
}

