//
//  LeaveHistoryViewModel.swift
//  CDBLLeaveManager
//
//  ViewModel for leave history and management.
//

import SwiftUI
import Combine

@MainActor
final class LeaveHistoryViewModel: ObservableObject {
    // MARK: - Published State
    
    @Published var isLoading = false
    @Published var error: String?
    @Published var leaves: [LeaveRequest] = []
    @Published var selectedStatus: String = ""
    @Published var selectedType: String = ""
    @Published var searchQuery = ""
    
    // Balance
    @Published var balance: DashboardLeaveBalance?
    @Published var detailedBalances: [BalanceDetail] = []
    
    // Pagination
    @Published var currentPage = 1
    @Published var hasMore = true
    private let pageSize = 20
    
    // MARK: - Services
    
    private let leaveService = LeaveService.shared
    
    // MARK: - Computed
    
    var filteredLeaves: [LeaveRequest] {
        var result = leaves
        
        if !searchQuery.isEmpty {
            result = result.filter {
                ($0.reason?.localizedCaseInsensitiveContains(searchQuery) ?? false) ||
                $0.type.localizedCaseInsensitiveContains(searchQuery)
            }
        }
        
        return result
    }
    
    var groupedLeaves: [(String, [LeaveRequest])] {
        let grouped = Dictionary(grouping: filteredLeaves) { leave -> String in
            // Group by month-year
            if leave.startDate.count >= 7 {
                let yearMonth = String(leave.startDate.prefix(7))
                return formatMonthYear(yearMonth)
            }
            return "Other"
        }
        
        return grouped.sorted { $0.key > $1.key }
    }
    
    private func formatMonthYear(_ yearMonth: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        if let date = formatter.date(from: yearMonth) {
            formatter.dateFormat = "MMMM yyyy"
            return formatter.string(from: date)
        }
        return yearMonth
    }
    
    // MARK: - Load Data
    
    func loadLeaves() async {
        isLoading = true
        error = nil
        currentPage = 1
        
        do {
            let response = try await leaveService.getLeaveHistory(
                status: selectedStatus.isEmpty ? nil : selectedStatus,
                type: selectedType.isEmpty ? nil : selectedType,
                page: currentPage,
                pageSize: pageSize
            )
            
            leaves = response.allLeaves
            hasMore = response.allLeaves.count == pageSize
            isLoading = false
        } catch {
            isLoading = false
            self.error = error.localizedDescription
        }
    }
    
    func loadMore() async {
        guard !isLoading && hasMore else { return }
        
        currentPage += 1
        
        do {
            let response = try await leaveService.getLeaveHistory(
                status: selectedStatus.isEmpty ? nil : selectedStatus,
                type: selectedType.isEmpty ? nil : selectedType,
                page: currentPage,
                pageSize: pageSize
            )
            
            let newLeaves = response.allLeaves
            leaves.append(contentsOf: newLeaves)
            hasMore = newLeaves.count == pageSize
        } catch {
            currentPage -= 1
            self.error = error.localizedDescription
        }
    }
    
    func loadBalance() async {
        do {
            balance = try await leaveService.getBalance()
        } catch {
            print("Failed to load balance: \(error)")
        }
    }
    
    // MARK: - Actions
    
    func cancelLeave(_ leave: LeaveRequest) async -> Bool {
        do {
            _ = try await leaveService.cancelLeave(id: leave.id)
            // Remove from list
            leaves.removeAll { $0.id == leave.id }
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }
    
    func refreshFilter(status: String, type: String) {
        selectedStatus = status
        selectedType = type
        Task {
            await loadLeaves()
        }
    }
}
