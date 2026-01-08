import SwiftUI

struct LeavesListView: View {
    @StateObject private var viewModel = LeaveHistoryViewModel()
    @State private var showFilters = false
    @State private var selectedSegment = 0
    
    private let statusOptions = ["", "PENDING", "APPROVED", "REJECTED", "RETURNED", "CANCELLED"]
    private let typeOptions = ["", "EARNED", "CASUAL", "MEDICAL", "COMPENSATORY"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            header
            
            // Segmented Control
            segmentedControl
            
            // Content
            if viewModel.isLoading && viewModel.leaves.isEmpty {
                LoadingView()
            } else if let error = viewModel.error, viewModel.leaves.isEmpty {
                ErrorView(error) {
                    Task { await viewModel.loadLeaves() }
                }
            } else if viewModel.filteredLeaves.isEmpty {
                EmptyStateView(
                    icon: "doc.text",
                    title: "No Leaves",
                    message: "You haven't applied for any leaves yet.",
                    actionTitle: "Apply Leave"
                ) {
                    // Navigate to apply
                }
            } else {
                leavesList
            }
        }
        .task {
            await viewModel.loadLeaves()
        }
        .sheet(isPresented: $showFilters) {
            filterSheet
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("My Leaves")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            
            Spacer()
            
            Button(action: { showFilters.toggle() }) {
                Image(systemName: "line.3.horizontal.decrease.circle")
                    .font(.title2)
                    .foregroundStyle(.white)
                    .padding(12)
                    .glassEffect(in: Circle())
            }
            
            Button(action: {}) {
                Image(systemName: "plus")
                    .font(.title2)
                    .foregroundStyle(.white)
                    .padding(12)
                    .glassEffect(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Segmented Control
    
    private var segmentedControl: some View {
        HStack(spacing: 0) {
            ForEach(Array(["All", "Pending", "Approved"].enumerated()), id: \.offset) { index, title in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedSegment = index
                        let status = index == 0 ? "" : (index == 1 ? "PENDING" : "APPROVED")
                        viewModel.refreshFilter(status: status, type: viewModel.selectedType)
                    }
                }) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(selectedSegment == index ? .semibold : .regular)
                        .foregroundStyle(selectedSegment == index ? .white : .white.opacity(0.6))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            selectedSegment == index ?
                            AnyShapeStyle(Color.white.opacity(0.2)) :
                            AnyShapeStyle(Color.clear)
                        )
                }
            }
        }
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.bottom, 16)
    }
    
    // MARK: - Leaves List
    
    private var leavesList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredLeaves) { leave in
                    LeaveCard(leave: leave)
                }
                
                // Load more indicator
                if viewModel.hasMore {
                    ProgressView()
                        .tint(.white)
                        .padding()
                        .onAppear {
                            Task { await viewModel.loadMore() }
                        }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
    
    // MARK: - Filter Sheet
    
    private var filterSheet: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 24) {
                    // Status Filter
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Status")
                            .font(.headline)
                            .foregroundStyle(.white)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(statusOptions, id: \.self) { status in
                                Button(action: {
                                    viewModel.selectedStatus = status
                                }) {
                                    Text(status.isEmpty ? "All" : status.capitalized)
                                        .font(.subheadline)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .glassEffect(
                                            viewModel.selectedStatus == status ? .regular : .clear,
                                            in: RoundedRectangle(cornerRadius: 12)
                                        )
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .strokeBorder(
                                                    viewModel.selectedStatus == status ?
                                                    Color.cyan : Color.white.opacity(0.2),
                                                    lineWidth: 1
                                                )
                                        )
                                }
                                .foregroundStyle(.white)
                            }
                        }
                    }
                    
                    // Type Filter
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Leave Type")
                            .font(.headline)
                            .foregroundStyle(.white)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(typeOptions, id: \.self) { type in
                                Button(action: {
                                    viewModel.selectedType = type
                                }) {
                                    Text(type.isEmpty ? "All" : type.capitalized)
                                        .font(.subheadline)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .glassEffect(
                                            viewModel.selectedType == type ? .regular : .clear,
                                            in: RoundedRectangle(cornerRadius: 12)
                                        )
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .strokeBorder(
                                                    viewModel.selectedType == type ?
                                                    Color.cyan : Color.white.opacity(0.2),
                                                    lineWidth: 1
                                                )
                                        )
                                }
                                .foregroundStyle(.white)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Apply Button
                    Button(action: {
                        Task {
                            await viewModel.loadLeaves()
                        }
                        showFilters = false
                    }) {
                        Text("Apply Filters")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding()
                    }
                    .buttonStyle(.glassProminent)
                    .tint(.cyan)
                }
                .padding()
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Reset") {
                        viewModel.selectedStatus = ""
                        viewModel.selectedType = ""
                    }
                    .foregroundStyle(.cyan)
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Leave Card

struct LeaveCard: View {
    let leave: LeaveRequest
    
    var body: some View {
        HStack(spacing: 16) {
            // Type Icon
            Circle()
                .fill(leave.statusColor.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: LeaveType(rawValue: leave.type)?.icon ?? "calendar")
                        .foregroundStyle(leave.statusColor)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 6) {
                Text(LeaveType(rawValue: leave.type)?.displayName ?? leave.type)
                    .font(.headline)
                    .foregroundStyle(.white)
                
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption2)
                    Text(leave.formattedDateRange)
                }
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
            }
            
            Spacer()
            
            // Status
            StatusBadge(leave.status)
        }
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        LeavesListView()
    }
}
