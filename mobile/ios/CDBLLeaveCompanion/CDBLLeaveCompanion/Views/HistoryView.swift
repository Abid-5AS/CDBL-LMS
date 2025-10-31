//
//  HistoryView.swift
//  CDBLLeaveCompanion
//
//  Enhanced history view with search, filtering, and sorting
//

import SwiftUI
import CoreData

struct HistoryView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @State private var selectedFilters: Set<HistoryFilter> = []
    @State private var selectedSort: HistorySortOption = .dateNewest
    @State private var searchText = ""
    @State private var selectedRequest: LeaveEntity?
    @State private var showDetail = false
    @State private var showExport = false
    @State private var exportRequest: LeaveRequest?
    
    // Fetch all requests - we'll filter in-memory for search/filter flexibility
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)],
        animation: .default
    ) private var allRequests: FetchedResults<LeaveEntity>
    
    private var filteredAndSortedRequests: [LeaveEntity] {
        var requests = Array(allRequests)
        
        // Apply search
        if !searchText.isEmpty {
            requests = requests.filter { request in
                let type = request.type ?? ""
                let reason = request.reason ?? ""
                let status = request.status ?? ""
                let searchLower = searchText.lowercased()
                
                return type.lowercased().contains(searchLower) ||
                       reason.lowercased().contains(searchLower) ||
                       status.lowercased().contains(searchLower)
            }
        }
        
        // Apply filters
        for filter in selectedFilters {
            switch filter {
            case .status(let status):
                requests = requests.filter { LeaveStatus(rawValue: $0.status ?? "") == status }
            case .type(let type):
                requests = requests.filter { LeaveType(rawValue: $0.type ?? "") == type }
            case .dateRange(let range):
                if let dateRange = range.dateRange() {
                    requests = requests.filter { request in
                        guard let startDate = request.startDate else { return false }
                        return startDate >= dateRange.start && startDate <= dateRange.end
                    }
                }
            case .duration(let duration):
                requests = requests.filter { request in
                    let days = Int(request.workingDays)
                    return duration.matches(days)
                }
            }
        }
        
        // Apply sorting
        let sortDescriptors = selectedSort.sortDescriptors
        requests.sort { a, b in
            for descriptor in sortDescriptors {
                let comparison = compareEntity(a, b, descriptor: descriptor)
                if comparison != .orderedSame {
                    return comparison == .orderedAscending
                }
            }
            return false
        }
        
        return requests
    }
    
    private func compareEntity(_ a: LeaveEntity, _ b: LeaveEntity, descriptor: NSSortDescriptor) -> ComparisonResult {
        guard let keyPath = descriptor.key as? String else { return .orderedSame }
        
        switch keyPath {
        case "createdAt":
            let dateA = a.createdAt ?? Date.distantPast
            let dateB = b.createdAt ?? Date.distantPast
            let result = dateA.compare(dateB)
            if descriptor.ascending {
                return result
            } else {
                switch result {
                case .orderedAscending: return .orderedDescending
                case .orderedDescending: return .orderedAscending
                case .orderedSame: return .orderedSame
                }
            }
        case "type":
            let typeA = a.type ?? ""
            let typeB = b.type ?? ""
            let result = typeA.compare(typeB)
            if descriptor.ascending {
                return result
            } else {
                switch result {
                case .orderedAscending: return .orderedDescending
                case .orderedDescending: return .orderedAscending
                case .orderedSame: return .orderedSame
                }
            }
        case "status":
            let statusA = a.status ?? ""
            let statusB = b.status ?? ""
            let result = statusA.compare(statusB)
            if descriptor.ascending {
                return result
            } else {
                switch result {
                case .orderedAscending: return .orderedDescending
                case .orderedDescending: return .orderedAscending
                case .orderedSame: return .orderedSame
                }
            }
        case "workingDays":
            let daysA = Int(a.workingDays)
            let daysB = Int(b.workingDays)
            if daysA < daysB {
                return descriptor.ascending ? .orderedAscending : .orderedDescending
            } else if daysA > daysB {
                return descriptor.ascending ? .orderedDescending : .orderedAscending
            }
            return .orderedSame
        default:
            return .orderedSame
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filters and Sort
                if !allRequests.isEmpty {
                    VStack(spacing: StyleGuide.Spacing.sm) {
                        // Sort option
                        HStack {
                            HistorySortOptions(selectedSort: $selectedSort)
                            Spacer()
                        }
                        .padding(.horizontal, StyleGuide.Spacing.md)
                        .padding(.top, StyleGuide.Spacing.sm)
                        
                        // Filter chips
                        HistoryFilters(selectedFilters: $selectedFilters)
                    }
                    .background(
                        Group {
                            if #available(iOS 26.0, *) {
                                Color.clear.backgroundExtensionEffect()
                            } else {
                                Color.clear
                            }
                        }
                    )
                    .background(.ultraThinMaterial)
                }
                
                // List
                if filteredAndSortedRequests.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(filteredAndSortedRequests, id: \.objectID) { request in
                            EnhancedLeaveRequestRow(request: request)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    selectedRequest = request
                                    showDetail = true
                                }
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button("Export") {
                                        exportRequest(request)
                                    }
                                    .tint(.blue)
                                    
                                    Button("Duplicate") {
                                        duplicateRequest(request)
                                    }
                                    .tint(.orange)
                                    
                                    Button("Delete", role: .destructive) {
                                        deleteRequest(request)
                                    }
                                }
                        }
                        .onDelete { offsets in
                            let itemsToDelete = offsets.map { filteredAndSortedRequests[$0] }
                            itemsToDelete.forEach(deleteRequest)
                        }
                    }
                    .searchable(text: $searchText, prompt: "Search by type, reason, or status")
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .listStyle(.plain)
                    .listRowBackground(Color.clear)
                    .refreshable {
                        // Refresh data if needed
                    }
                }
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Leave History")
            .navigationBarGlassBackground()
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    if !filteredAndSortedRequests.isEmpty {
                        EditButton()
                    }
                }
            }
            .sheet(isPresented: $showDetail) {
                if let request = selectedRequest {
                    LeaveRequestDetailView(entity: request)
                }
            }
            .sheet(isPresented: $showExport) {
                if let request = exportRequest {
                    ConfirmationView(request: request)
                }
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyStateView: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            Image(systemName: allRequests.isEmpty ? "tray" : "magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            
            Text(allRequests.isEmpty ? "No Leave Requests" : "No Results Found")
                .font(StyleGuide.Typography.title2)
                .foregroundColor(StyleGuide.Colors.foreground)
            
            Text(
                allRequests.isEmpty
                    ? "Create a new leave request to get started"
                    : "Try adjusting your filters or search terms"
            )
            .font(StyleGuide.Typography.body)
            .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            .multilineTextAlignment(.center)
            .padding(.horizontal)
            
            if !allRequests.isEmpty {
                Button("Clear Filters") {
                    selectedFilters.removeAll()
                    searchText = ""
                }
                .glassButton(style: .secondary)
                .padding(.top, StyleGuide.Spacing.sm)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
    
    // MARK: - Actions
    
    private func exportRequest(_ entity: LeaveEntity) {
        guard let type = LeaveType(rawValue: entity.type ?? ""),
              let status = LeaveStatus(rawValue: entity.status ?? "") else {
            return
        }
        
        let request = LeaveRequest(
            id: entity.id,
            type: type,
            startDate: entity.startDate ?? Date(),
            endDate: entity.endDate ?? Date(),
            reason: entity.reason ?? "",
            needsCertificate: entity.needsCertificate,
            status: status
        )
        
        exportRequest = request
        showExport = true
    }
    
    private func duplicateRequest(_ entity: LeaveEntity) {
        let duplicate = LeaveEntity(context: viewContext)
        duplicate.id = UUID()
        duplicate.type = entity.type
        duplicate.startDate = entity.startDate
        duplicate.endDate = entity.endDate
        duplicate.reason = entity.reason
        duplicate.needsCertificate = entity.needsCertificate
        duplicate.status = LeaveStatus.DRAFT.rawValue
        duplicate.workingDays = entity.workingDays
        duplicate.createdAt = Date()
        duplicate.exported = false
        
        do {
            try viewContext.save()
            HapticFeedback.success()
        } catch {
            print("Failed to duplicate: \(error)")
            HapticFeedback.error()
        }
    }
    
    private func deleteRequest(_ entity: LeaveEntity) {
        viewContext.delete(entity)
        
        do {
            try viewContext.save()
            HapticFeedback.success()
        } catch {
            print("Failed to delete: \(error)")
            HapticFeedback.error()
        }
    }
}

// MARK: - Enhanced Leave Request Row

struct EnhancedLeaveRequestRow: View {
    let request: LeaveEntity
    
    var leaveType: LeaveType? {
        LeaveType(rawValue: request.type ?? "")
    }
    
    var status: LeaveStatus? {
        LeaveStatus(rawValue: request.status ?? "")
    }
    
    private var workingDays: Int {
        if request.workingDays > 0 {
            return Int(request.workingDays)
        } else if let startDate = request.startDate, let endDate = request.endDate {
            return LeaveRequest.calculateWorkingDays(from: startDate, to: endDate)
        }
        return 0
    }
    
    var body: some View {
        GlassCard {
            HStack(spacing: StyleGuide.Spacing.md) {
                // Icon
                Group {
                    if #available(iOS 26.0, *) {
                        Image(systemName: iconForType)
                            .font(.title3)
                            .foregroundColor(colorForType)
                            .frame(width: 44, height: 44)
                            .background(colorForType.opacity(0.1))
                            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small))
                    } else {
                        Image(systemName: iconForType)
                            .font(.title3)
                            .foregroundColor(colorForType)
                            .frame(width: 44, height: 44)
                            .background(colorForType.opacity(0.1))
                            .cornerRadius(StyleGuide.CornerRadius.small)
                    }
                }
                
                // Details
                VStack(alignment: .leading, spacing: StyleGuide.Spacing.xs) {
                    HStack {
                        Text(leaveType?.displayName ?? "Unknown")
                            .font(StyleGuide.Typography.bodyBold)
                            .foregroundColor(StyleGuide.Colors.foreground)
                        
                        Spacer()
                        
                        // Status badge
                        if let status = status {
                            ActivityBadge(text: status.displayName, style: badgeStyleForStatus(status))
                        }
                    }
                    
                    if let startDate = request.startDate,
                       let endDate = request.endDate {
                        HStack(spacing: StyleGuide.Spacing.xs) {
                            Image(systemName: "calendar")
                                .font(.caption2)
                                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                            Text(dateRangeString(from: startDate, to: endDate))
                                .font(StyleGuide.Typography.caption)
                                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                        }
                    }
                    
                    HStack(spacing: StyleGuide.Spacing.sm) {
                        Label("\(workingDays) day(s)", systemImage: "clock.fill")
                            .font(StyleGuide.Typography.caption2)
                            .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                        
                        if request.needsCertificate {
                            Label("Certificate", systemImage: "doc.text.fill")
                                .font(StyleGuide.Typography.caption2)
                                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                        }
                    }
                }
            }
        }
    }
    
    private var iconForType: String {
        switch leaveType {
        case .MEDICAL: return "cross.case.fill"
        case .CASUAL: return "calendar"
        case .EARNED: return "star.fill"
        default: return "calendar.badge.clock"
        }
    }
    
    private var colorForType: Color {
        switch leaveType {
        case .MEDICAL: return .red
        case .CASUAL: return .blue
        case .EARNED: return .orange
        default: return .gray
        }
    }
    
    private func badgeStyleForStatus(_ status: LeaveStatus) -> ActivityBadge.BadgeStyle {
        switch status {
        case .APPROVED: return .success
        case .REJECTED: return .error
        case .PENDING, .SUBMITTED: return .warning
        case .DRAFT: return .info
        default: return .info
        }
    }
    
    private func dateRangeString(from start: Date, to end: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
    }
}

// MARK: - Preview

#if DEBUG
struct HistoryView_Previews: PreviewProvider {
    static var previews: some View {
        HistoryView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}
#endif
