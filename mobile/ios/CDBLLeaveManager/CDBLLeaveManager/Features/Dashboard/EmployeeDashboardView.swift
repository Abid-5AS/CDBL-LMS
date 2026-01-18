import SwiftUI

struct EmployeeDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    @State private var showApplyLeave = false
    @State private var showLeaveHistory = false
    @State private var showEncashment = false
    @State private var showSettings = false
    @State private var showBalance = false
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .frame(height: 400)
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task {
                        await viewModel.loadDashboard(for: .employee)
                    }
                }
                .frame(height: 400)
            } else {
                dashboardContent
            }
        }
        .task {
            await viewModel.loadDashboard(for: .employee)
        }
        .sheet(isPresented: $showApplyLeave) {
            ApplyLeaveView()
        }
        .sheet(isPresented: $showLeaveHistory) {
            LeavesListView()
        }
        .sheet(isPresented: $showEncashment) {
            EncashmentListView()
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .sheet(isPresented: $showBalance) {
            BalanceView()
        }
    }
    
    // MARK: - Dashboard Content
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            DashboardHeader()
            
            // Action Required Alert
            if viewModel.needsAttentionCount > 0 {
                actionRequiredCard
            }
            
            // KPI Grid
            kpiGrid
            
            // Balance Cards
            balanceSection
            
            // Who's Out Today
            whosOutSection
            
            // Quick Actions
            quickActionsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Action Required Card
    
    private var actionRequiredCard: some View {
        HStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundStyle(.red)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Action Required")
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text("\(viewModel.needsAttentionCount) request(s) need your attention")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.red.opacity(0.2))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(Color.red.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal)
    }
    
    // MARK: - KPI Grid
    
    private var kpiGrid: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                KPICard(
                    title: "Needs Attention",
                    value: "\(viewModel.needsAttentionCount)",
                    subtitle: "Returned/Rejected",
                    color: viewModel.needsAttentionCount > 0 ? .red : .gray
                )
                
                KPICard(
                    title: "Under Review",
                    value: "\(viewModel.underReviewCount)",
                    subtitle: "Pending requests",
                    color: viewModel.underReviewCount > 0 ? .orange : .gray
                )
            }
            
            HStack(spacing: 12) {
                KPICard(
                    title: "Total Balance",
                    value: "\(Int(viewModel.balance?.EARNED ?? 0))",
                    subtitle: "Earned Leave",
                    color: .indigo
                )
                
                KPICard(
                    title: "Next Leave",
                    value: viewModel.nextApprovedLeave?.formattedDateRange ?? "-",
                    subtitle: viewModel.nextApprovedLeave?.type ?? "None booked",
                    color: .green
                )
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Balance Section
    
    private var balanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Leave Balance")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(Color.accentColor)
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(viewModel.balanceCards) { item in
                        LeaveBalanceCard(
                            type: item.title,
                            balance: item.remaining,
                            total: item.total,
                            color: item.color
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Who's Out Section
    
    private var whosOutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Who's Out Today")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(Color.accentColor)
            }
            .padding(.horizontal)
            
            if viewModel.whosOutToday.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("Everyone is present today!")
                        .foregroundStyle(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(viewModel.whosOutToday) { member in
                            WhosOutCard(member: member)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
            }
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    ActionButton(icon: "plus.circle.fill", title: "Apply Leave", color: .green) {
                        showApplyLeave = true
                    }
                    ActionButton(icon: "clock.arrow.circlepath", title: "History", color: .blue) {
                        showLeaveHistory = true
                    }
                }
                HStack(spacing: 12) {
                    ActionButton(icon: "banknote.fill", title: "Encashment", color: .orange) {
                        showEncashment = true
                    }
                    ActionButton(icon: "chart.pie.fill", title: "Balance", color: .purple) {
                        showBalance = true
                    }
                }
                HStack(spacing: 12) {
                    ActionButton(icon: "gearshape.fill", title: "Settings", color: .gray) {
                        showSettings = true
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Subcomponents

struct DashboardHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(greeting)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "bell.fill")
                    .foregroundStyle(.primary)
                    .padding(10)
                    .surfaceBackground(in: Circle())
            }
        }
        .padding(.horizontal)
    }
    
    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM dd"
        return formatter.string(from: Date())
    }
    
    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good Morning"
        case 12..<17: return "Good Afternoon"
        default: return "Good Evening"
        }
    }
}

struct LeaveBalanceCard: View {
    let type: String
    let balance: Int
    let total: Int
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(color.opacity(0.8))
                    .frame(width: 8, height: 8)
                Text(type)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
            }
            
            Text("\(balance)")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
            
            Text("/ \(total) Days")
                .font(.caption2)
                .foregroundStyle(.secondary)
            
            // Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 4)
                    
                    Capsule()
                        .fill(color)
                        .frame(width: geo.size.width * CGFloat(balance) / CGFloat(total), height: 4)
                }
            }
            .frame(height: 4)
        }
        .frame(width: 140)
        .padding(16)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 24))
    }
}

struct WhosOutCard: View {
    let member: WhosOutMember
    
    var body: some View {
        VStack {
            Circle()
                .fill(Color(.tertiarySystemBackground))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(initials)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundStyle(.primary)
                )
                .surfaceBackground(.regular, in: Circle())
            
            Text(firstName)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(width: 60)
        }
    }
    
    private var initials: String {
        let parts = member.employeeName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return member.employeeName.prefix(2).uppercased()
    }
    
    private var firstName: String {
        member.employeeName.split(separator: " ").first.map(String.init) ?? member.employeeName
    }
}

struct ActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    init(icon: String, title: String, color: Color, action: @escaping () -> Void = {}) {
        self.icon = icon
        self.title = title
        self.color = color
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(.primary)
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                
                Spacer()
            }
            .padding(16)
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        EmployeeDashboardView()
            .environmentObject(AppState.shared)
    }
}
