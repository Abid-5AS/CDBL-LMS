//
//  DashboardView.swift
//  CDBLLeaveCompanion
//
//  Employee dashboard with analytics, charts, and balances
//

import SwiftUI
import CoreData
import Combine

struct DashboardView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject private var balanceService = BalanceServiceViewModel()
    @State private var showReconciliation = false
    @State private var pendingCount = 0
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: StyleGuide.Spacing.lg) {
                    // Pending actions badge (if any)
                    if pendingCount > 0 {
                        PendingActionsBadge(count: pendingCount) {
                            showReconciliation = true
                        }
                        .padding(.horizontal, StyleGuide.Spacing.md)
                    }
                    
                    // Profile Section
                    EmployeeProfileCard()
                        .padding(.horizontal, StyleGuide.Spacing.md)
                    
                    // Balance Cards
                    if let balances = balanceService.balances {
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
                            Text("Leave Balances")
                                .font(StyleGuide.Typography.title3)
                                .foregroundColor(StyleGuide.Colors.foreground)
                            
                            VStack(spacing: StyleGuide.Spacing.sm) {
                                BalanceProgressCard(
                                    leaveType: .CASUAL,
                                    total: balances.CASUAL,
                                    used: 0, // TODO: Calculate from history
                                    remaining: balances.CASUAL
                                )
                                
                                BalanceProgressCard(
                                    leaveType: .MEDICAL,
                                    total: balances.MEDICAL,
                                    used: 0, // TODO: Calculate from history
                                    remaining: balances.MEDICAL
                                )
                                
                                BalanceProgressCard(
                                    leaveType: .EARNED,
                                    total: balances.EARNED,
                                    used: 0, // TODO: Calculate from history
                                    remaining: balances.EARNED
                                )
                            }
                        }
                        .padding(.horizontal, StyleGuide.Spacing.md)
                    }
                    
                    // Charts Section
                    ChartsSection()
                        .padding(.horizontal, StyleGuide.Spacing.md)
                    
                    // Recent History
                    RecentLeaveHistorySection()
                        .padding(.horizontal, StyleGuide.Spacing.md)
                }
                .padding(.vertical, StyleGuide.Spacing.sm)
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Dashboard")
            .navigationBarGlassBackground()
            .refreshable {
                await balanceService.loadBalances()
            }
            .task {
                await balanceService.loadBalances()
                loadPendingCount()
            }
            .sheet(isPresented: $showReconciliation) {
                ReconciliationModal()
            }
        }
    }
    
    private func loadPendingCount() {
        Task {
            do {
                pendingCount = try QueueManager.shared.fetchPendingCount()
            } catch {
                pendingCount = 0
            }
        }
    }
}

// MARK: - Balance Service ViewModel

@MainActor
class BalanceServiceViewModel: ObservableObject {
    @Published var balances: LeaveBalance?
    @Published var isLoading = false
    
    func loadBalances() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            balances = try await BalanceService.fetchBalances()
        } catch {
            print("Failed to load balances: \(error)")
        }
    }
}

// MARK: - Note: EmployeeProfileCard and BalanceProgressCards are in separate component files

struct ChartsSection: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \LeaveEntity.startDate, ascending: true)],
        animation: .default
    ) private var leaveRequests: FetchedResults<LeaveEntity>
    
    private var monthlyTrend: [LeaveTrendPoint] {
        let calendar = Calendar.current
        let now = Date()
        var trendMap: [String: Int] = [:]
        
        // Initialize last 12 months
        for i in 0..<12 {
            if let month = calendar.date(byAdding: .month, value: -i, to: now) {
                let key = month.formatted(.dateTime.month(.abbreviated))
                trendMap[key] = 0
            }
        }
        
                // Count leaves by month
        for request in leaveRequests {
            if let startDate = request.startDate {
                let key = startDate.formatted(.dateTime.month(.abbreviated))
                if trendMap[key] != nil {
                    let days: Int
                    if request.workingDays > 0 {
                        days = Int(request.workingDays)
                    } else if let endDate = request.endDate {
                        days = LeaveRequest.calculateWorkingDays(from: startDate, to: endDate)
                    } else {
                        days = 0
                    }
                    trendMap[key] = (trendMap[key] ?? 0) + days
                }
            }
        }
        
        return trendMap.sorted(by: { $0.key < $1.key }).map { LeaveTrendPoint(month: $0.key, leavesTaken: $0.value) }
    }
    
    private var distribution: [LeaveDistributionSlice] {
        var distributionMap: [String: Int] = [:]
        
        for request in leaveRequests {
            let type = request.type ?? "Unknown"
            let days: Int
            if request.workingDays > 0 {
                days = Int(request.workingDays)
            } else if let startDate = request.startDate, let endDate = request.endDate {
                days = LeaveRequest.calculateWorkingDays(from: startDate, to: endDate)
            } else {
                days = 0
            }
            distributionMap[type] = (distributionMap[type] ?? 0) + days
        }
        
        return distributionMap.map { LeaveDistributionSlice(type: $0.key, value: $0.value) }
    }
    
    var body: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            Text("Analytics")
                .font(StyleGuide.Typography.title3)
                .foregroundColor(StyleGuide.Colors.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            if horizontalSizeClass == .compact {
                VStack(spacing: StyleGuide.Spacing.md) {
                    MonthlyTrendChart(data: monthlyTrend)
                    LeaveDistributionChart(data: distribution)
                }
            } else {
                HStack(spacing: StyleGuide.Spacing.md) {
                    MonthlyTrendChart(data: monthlyTrend)
                    LeaveDistributionChart(data: distribution)
                }
            }
        }
    }
}

struct RecentLeaveHistorySection: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \LeaveEntity.createdAt, ascending: false)],
        animation: .default
    ) private var leaveRequests: FetchedResults<LeaveEntity>
    
    var body: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            Text("Recent History")
                .font(StyleGuide.Typography.title3)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            if leaveRequests.isEmpty {
                GlassCard {
                    Text("No leave requests yet")
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                }
            } else {
                VStack(spacing: StyleGuide.Spacing.sm) {
                    ForEach(Array(leaveRequests.prefix(5)), id: \.objectID) { request in
                        EnhancedLeaveRequestRow(request: request)
                    }
                }
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}
#endif

