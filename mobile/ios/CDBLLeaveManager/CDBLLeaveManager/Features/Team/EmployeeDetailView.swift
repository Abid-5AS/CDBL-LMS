//
//  EmployeeDetailView.swift
//  CDBLLeaveManager
//
//  Detail view for an employee profile.
//

import SwiftUI
import Combine

struct EmployeeDetailView: View {
    let employeeId: Int
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = EmployeeDetailViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadEmployee(id: employeeId) }
                    }
                } else if let employee = viewModel.employee {
                    employeeContent(employee)
                }
            }
            .navigationTitle("Employee")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
            .task {
                await viewModel.loadEmployee(id: employeeId)
            }
        }
    }
    
    private func employeeContent(_ employee: Employee) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                profileHeader(employee)
                
                // Info Card
                infoCard(employee)
                
                // Leave Balance
                if let balance = viewModel.balance {
                    balanceSection(balance)
                }
                
                // Recent Leaves
                if !viewModel.recentLeaves.isEmpty {
                    recentLeavesSection
                }
                
                Spacer().frame(height: 40)
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - Profile Header
    
    private func profileHeader(_ employee: Employee) -> some View {
        VStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(employee.avatarColor.opacity(0.3))
                .frame(width: 80, height: 80)
                .overlay(
                    Text(employee.initials)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundStyle(employee.avatarColor)
                )
                .glassEffect(in: Circle())
            
            // Name & Role
            VStack(spacing: 4) {
                Text(employee.displayName)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                
                if let designation = employee.designation {
                    Text(designation)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                }
                
                // Status Badge
                if employee.isActive == true {
                    Text("Active")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .clipShape(Capsule())
                        .foregroundStyle(.green)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Info Card
    
    private func infoCard(_ employee: Employee) -> some View {
        VStack(spacing: 0) {
            DetailRow(label: "Email", value: employee.email)
            Divider().background(Color.white.opacity(0.1))
            
            if let employeeId = employee.employeeId {
                DetailRow(label: "Employee ID", value: employeeId)
                Divider().background(Color.white.opacity(0.1))
            }
            
            if let department = employee.department {
                DetailRow(label: "Department", value: department)
                Divider().background(Color.white.opacity(0.1))
            }
            
            if let phone = employee.phone {
                DetailRow(label: "Phone", value: phone)
                Divider().background(Color.white.opacity(0.1))
            }
            
            if let role = employee.role {
                DetailRow(label: "Role", value: role.capitalized)
                Divider().background(Color.white.opacity(0.1))
            }
            
            if let managerName = employee.managerName {
                DetailRow(label: "Reports To", value: managerName)
            }
        }
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }
    
    // MARK: - Balance Section
    
    private func balanceSection(_ balance: DashboardLeaveBalance) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Leave Balance")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                BalanceCard(title: "Earned", value: Int(balance.EARNED), total: 33, color: .indigo)
                BalanceCard(title: "Casual", value: Int(balance.CASUAL), total: 10, color: .cyan)
                BalanceCard(title: "Medical", value: Int(balance.MEDICAL), total: 14, color: .red)
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Recent Leaves Section
    
    private var recentLeavesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Leaves")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                ForEach(viewModel.recentLeaves.prefix(5)) { leave in
                    HStack {
                        Text(leave.type.capitalized)
                            .font(.caption)
                            .foregroundStyle(.white)
                        
                        Spacer()
                        
                        Text(leave.formattedDateRange)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.6))
                        
                        StatusBadge(leave.status)
                    }
                    .padding()
                    .glassEffect(.clear, in: RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Balance Card

struct BalanceCard: View {
    let title: String
    let value: Int
    let total: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text("\(value)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(color)
            
            Text(title)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - ViewModel

@MainActor
final class EmployeeDetailViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var employee: Employee?
    @Published var balance: DashboardLeaveBalance?
    @Published var recentLeaves: [LeaveRequest] = []
    
    private let employeeService = EmployeeService.shared
    
    func loadEmployee(id: Int) async {
        isLoading = true
        error = nil
        
        do {
            async let employeeTask = employeeService.getEmployeeDetail(id: id)
            async let balanceTask = employeeService.getEmployeeBalance(id: id)
            async let leavesTask = employeeService.getEmployeeLeaves(id: id)
            
            let (detail, balance, leaves) = try await (employeeTask, balanceTask, leavesTask)
            
            employee = Employee(
                id: detail.id,
                email: detail.email,
                name: detail.name,
                employeeId: detail.employeeId,
                designation: detail.designation,
                department: detail.department,
                phone: detail.phone,
                joiningDate: detail.joiningDate,
                role: detail.role,
                isActive: detail.isActive,
                managerId: detail.manager?.id,
                managerName: detail.manager?.name
            )
            self.balance = balance
            recentLeaves = leaves.allLeaves
            
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    EmployeeDetailView(employeeId: 1)
}
