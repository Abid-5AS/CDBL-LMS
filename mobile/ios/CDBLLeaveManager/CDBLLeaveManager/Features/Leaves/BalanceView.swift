//
//  BalanceView.swift
//  CDBLLeaveManager
//
//  Leave balance overview with detailed breakdown.
//

import SwiftUI
import Combine

struct BalanceView: View {
    @StateObject private var viewModel = BalanceViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadBalance() }
                    }
                } else {
                    balanceContent
                }
            }
            .task {
                await viewModel.loadBalance()
            }
        }
    }
    
    private var balanceContent: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                header
                
                // Total Balance
                totalBalanceCard
                
                // Balance Breakdown
                balanceBreakdown
                
                // Usage Summary
                usageSummary
                
                Spacer().frame(height: 100)
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Balance")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 40)
    }
    
    // MARK: - Total Balance Card
    
    private var totalBalanceCard: some View {
        VStack(spacing: 16) {
            Text("Total Available")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
            
            Text("\(Int(viewModel.totalBalance))")
                .font(.system(size: 64, weight: .bold))
                .foregroundStyle(.white)
            
            Text("Days")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.8))
            
            // Progress towards year
            HStack(spacing: 20) {
                VStack {
                    Text("\(Int(viewModel.usedDays))")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.red)
                    Text("Used")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                }
                
                Rectangle()
                    .fill(Color.white.opacity(0.2))
                    .frame(width: 1, height: 40)
                
                VStack {
                    Text("\(Int(viewModel.totalBalance))")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.green)
                    Text("Remaining")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 28))
        .padding(.horizontal)
    }
    
    // MARK: - Balance Breakdown
    
    private var balanceBreakdown: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Leave Types")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                BalanceTypeCard(
                    type: "Earned Leave",
                    balance: viewModel.balance?.EARNED ?? 0,
                    total: 33,
                    icon: "calendar",
                    color: .indigo
                )
                
                BalanceTypeCard(
                    type: "Casual Leave",
                    balance: viewModel.balance?.CASUAL ?? 0,
                    total: 10,
                    icon: "sun.max.fill",
                    color: .cyan
                )
                
                BalanceTypeCard(
                    type: "Medical Leave",
                    balance: viewModel.balance?.MEDICAL ?? 0,
                    total: 14,
                    icon: "cross.case.fill",
                    color: .red
                )
                
                if let comp = viewModel.balance?.COMPENSATORY, comp > 0 {
                    BalanceTypeCard(
                        type: "Compensatory",
                        balance: comp,
                        total: comp,
                        icon: "arrow.triangle.2.circlepath",
                        color: .orange
                    )
                }
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Usage Summary
    
    private var usageSummary: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("This Year")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                UsageRow(label: "Total Entitlement", value: "\(Int(viewModel.totalEntitlement)) days")
                Divider().background(Color.white.opacity(0.1))
                UsageRow(label: "Leaves Taken", value: "\(Int(viewModel.usedDays)) days")
                Divider().background(Color.white.opacity(0.1))
                UsageRow(label: "Pending Requests", value: "\(viewModel.pendingDays) days")
                Divider().background(Color.white.opacity(0.1))
                UsageRow(label: "Available Balance", value: "\(Int(viewModel.totalBalance)) days", highlight: true)
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
}

// MARK: - Balance Type Card

struct BalanceTypeCard: View {
    let type: String
    let balance: Double
    let total: Double
    let icon: String
    let color: Color
    
    private var progress: Double {
        guard total > 0 else { return 0 }
        return balance / total
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            Circle()
                .fill(color.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: icon)
                        .foregroundStyle(color)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 6) {
                Text(type)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                // Progress Bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.1))
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(color)
                            .frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 6)
            }
            
            Spacer()
            
            // Balance
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(Int(balance))")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(color)
                
                Text("of \(Int(total))")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Usage Row

struct UsageRow: View {
    let label: String
    let value: String
    var highlight: Bool = false
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(highlight ? .bold : .medium)
                .foregroundStyle(highlight ? .green : .white)
        }
        .padding(.vertical, 12)
    }
}

// MARK: - ViewModel

@MainActor
final class BalanceViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var balance: DashboardLeaveBalance?
    @Published var usedDays: Double = 0
    @Published var pendingDays: Int = 0
    
    private let leaveService = LeaveService.shared
    
    var totalBalance: Double {
        guard let b = balance else { return 0 }
        return b.EARNED + b.CASUAL + b.MEDICAL + (b.COMPENSATORY ?? 0)
    }
    
    var totalEntitlement: Double {
        33 + 10 + 14 // Earned + Casual + Medical
    }
    
    func loadBalance() async {
        isLoading = true
        error = nil
        
        do {
            balance = try await leaveService.getBalance()
            
            // Calculate used days
            let detailedBalance = try? await leaveService.getDetailedBalance()
            if let detailed = detailedBalance {
                usedDays = detailed.balances?.reduce(0) { $0 + $1.used } ?? 0
            }
            
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    BalanceView()
}
