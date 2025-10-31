//
//  HistorySortOptions.swift
//  CDBLLeaveCompanion
//
//  Sort options component for leave history
//

import SwiftUI

enum HistorySortOption: String, CaseIterable {
    case dateNewest = "date_newest"
    case dateOldest = "date_oldest"
    case type = "type"
    case status = "status"
    case durationShortest = "duration_shortest"
    case durationLongest = "duration_longest"
    
    var displayName: String {
        switch self {
        case .dateNewest: return "Date (Newest)"
        case .dateOldest: return "Date (Oldest)"
        case .type: return "Type"
        case .status: return "Status"
        case .durationShortest: return "Duration (Shortest)"
        case .durationLongest: return "Duration (Longest)"
        }
    }
    
    var sortDescriptors: [NSSortDescriptor] {
        switch self {
        case .dateNewest:
            return [NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)]
        case .dateOldest:
            return [NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: true)]
        case .type:
            return [NSSortDescriptor(keyPath: \LeaveEntity.type, ascending: true),
                    NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)]
        case .status:
            return [NSSortDescriptor(keyPath: \LeaveEntity.status, ascending: true),
                    NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)]
        case .durationShortest:
            return [NSSortDescriptor(keyPath: \LeaveEntity.workingDays, ascending: true),
                    NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)]
        case .durationLongest:
            return [NSSortDescriptor(keyPath: \LeaveEntity.workingDays, ascending: false),
                    NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)]
        }
    }
}

struct HistorySortOptions: View {
    @Binding var selectedSort: HistorySortOption
    @State private var showSortPicker = false
    
    var body: some View {
        Menu {
            ForEach(HistorySortOption.allCases, id: \.self) { option in
                Button(action: {
                    selectedSort = option
                    HapticFeedback.selection()
                }) {
                    HStack {
                        Text(option.displayName)
                        if selectedSort == option {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: StyleGuide.Spacing.xs) {
                Image(systemName: "arrow.up.arrow.down")
                    .font(.caption)
                Text("Sort")
                    .font(StyleGuide.Typography.caption)
                Text(selectedSort.displayName)
                    .font(StyleGuide.Typography.caption)
                    .fontWeight(.semibold)
            }
            .padding(.horizontal, StyleGuide.Spacing.sm)
            .padding(.vertical, StyleGuide.Spacing.xs)
            .background(.ultraThinMaterial)
            .background(StyleGuide.Colors.elevatedSurface.opacity(0.55))
            .foregroundColor(StyleGuide.Colors.foreground)
            .cornerRadius(StyleGuide.CornerRadius.small)
            .overlay(
                RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small)
                    .stroke(
                        LinearGradient(
                            colors: [
                                StyleGuide.Colors.accentGradientStart.opacity(0.3),
                                StyleGuide.Colors.accentGradientEnd.opacity(0.25)
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

