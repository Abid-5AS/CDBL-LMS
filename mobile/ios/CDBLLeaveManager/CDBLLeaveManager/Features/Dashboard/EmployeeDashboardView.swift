import SwiftUI

struct EmployeeDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
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
                    .foregroundStyle(.white)
                
                Text("\(viewModel.needsAttentionCount) request(s) need your attention")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundStyle(.white.opacity(0.5))
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
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(.cyan)
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
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(.cyan)
            }
            .padding(.horizontal)
            
            if viewModel.whosOutToday.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("Everyone is present today!")
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
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
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            GlassEffectContainer(spacing: 12) {
                HStack(spacing: 12) {
                    ActionButton(icon: "plus.circle.fill", title: "Apply Leave", color: .green)
                    ActionButton(icon: "clock.arrow.circlepath", title: "History", color: .blue)
                }
                HStack(spacing: 12) {
                    ActionButton(icon: "banknote.fill", title: "Encashment", color: .orange)
                    ActionButton(icon: "gearshape.fill", title: "Settings", color: .gray)
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
                    .foregroundStyle(.white.opacity(0.8))
                Text(greeting)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "bell.fill")
                    .foregroundStyle(.white)
                    .padding(10)
                    .glassEffect(in: Circle())
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
                    .foregroundStyle(.white.opacity(0.8))
            }
            
            Text("\(balance)")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            
            Text("/ \(total) Days")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
            
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
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 24))
    }
}

struct WhosOutCard: View {
    let member: WhosOutMember
    
    var body: some View {
        VStack {
            Circle()
                .fill(LinearGradient(
                    colors: [Color.cyan.opacity(0.5), Color.purple.opacity(0.5)],
                    startPoint: .top,
                    endPoint: .bottom
                ))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(initials)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                )
                .glassEffect(.regular, in: Circle())
            
            Text(firstName)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.8))
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
    
    var body: some View {
        Button(action: {}) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(color)
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
            }
            .padding(16)
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        EmployeeDashboardView()
            .environmentObject(AppState.shared)
    }
}
