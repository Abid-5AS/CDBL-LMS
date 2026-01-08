//
//  LeaveDetailView.swift
//  CDBLLeaveManager
//
//  Detail view for a leave request.
//

import SwiftUI
import Combine

struct LeaveDetailView: View {
    let leaveId: Int
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = LeaveDetailViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadLeave(id: leaveId) }
                    }
                } else if let leave = viewModel.leave {
                    leaveContent(leave)
                }
            }
            .navigationTitle("Leave Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
            .task {
                await viewModel.loadLeave(id: leaveId)
            }
        }
    }
    
    private func leaveContent(_ leave: LeaveRequest) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                // Status Header
                statusHeader(leave)
                
                // Details Card
                detailsCard(leave)
                
                // Timeline
                timelineSection(leave)
                
                // Actions (if pending)
                if leave.status.uppercased() == "PENDING" {
                    actionsSection(leave)
                }
                
                Spacer().frame(height: 40)
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - Status Header
    
    private func statusHeader(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 16) {
            // Status Icon
            ZStack {
                Circle()
                    .fill(leave.statusColor.opacity(0.2))
                    .frame(width: 80, height: 80)
                
                Image(systemName: leave.statusIcon)
                    .font(.system(size: 36))
                    .foregroundStyle(leave.statusColor)
            }
            
            // Status Text
            Text(leave.status.capitalized)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(leave.statusColor)
            
            // Type
            Text(LeaveType(rawValue: leave.type)?.displayName ?? leave.type)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Details Card
    
    private func detailsCard(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 0) {
            DetailRow(label: "Start Date", value: formatDate(leave.startDate))
            Divider().background(Color.white.opacity(0.1))
            DetailRow(label: "End Date", value: formatDate(leave.endDate))
            Divider().background(Color.white.opacity(0.1))
            DetailRow(label: "Total Days", value: leave.totalDays != nil ? "\(Int(leave.totalDays!)) day(s)" : "-")
            
            if leave.isHalfDay == true {
                Divider().background(Color.white.opacity(0.1))
                DetailRow(label: "Half Day", value: leave.halfDayType ?? "Yes")
            }
            
            if let reason = leave.reason, !reason.isEmpty {
                Divider().background(Color.white.opacity(0.1))
                VStack(alignment: .leading, spacing: 8) {
                    Text("Reason")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                    Text(reason)
                        .font(.subheadline)
                        .foregroundStyle(.white)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
        }
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }
    
    // MARK: - Timeline Section
    
    private func timelineSection(_ leave: LeaveRequest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Timeline")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                TimelineItem(
                    title: "Submitted",
                    subtitle: formatDateTime(leave.createdAt ?? leave.startDate),
                    isCompleted: true,
                    isLast: leave.status.uppercased() == "PENDING"
                )
                
                if leave.status.uppercased() != "PENDING" {
                    TimelineItem(
                        title: leave.status.capitalized,
                        subtitle: leave.updatedAt != nil ? formatDateTime(leave.updatedAt!) : "Recently",
                        isCompleted: true,
                        isLast: true
                    )
                }
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Actions Section
    
    private func actionsSection(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 12) {
            Button(action: {
                Task { await viewModel.cancelLeave(id: leave.id) }
            }) {
                HStack {
                    Image(systemName: "xmark.circle")
                    Text("Cancel Request")
                }
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding()
            }
            .buttonStyle(.glass(.frosted))
            .foregroundStyle(.red)
        }
        .padding(.horizontal)
    }
    
    // MARK: - Helpers
    
    private func formatDate(_ dateString: String) -> String {
        if dateString.count >= 10 {
            let dateOnly = String(dateString.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "EEEE, MMM dd, yyyy"
                return formatter.string(from: date)
            }
        }
        return dateString
    }
    
    private func formatDateTime(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "MMM dd, yyyy 'at' h:mm a"
            return outputFormatter.string(from: date)
        }
        return formatDate(dateString)
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.6))
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.white)
        }
        .padding()
    }
}

// MARK: - Timeline Item

struct TimelineItem: View {
    let title: String
    let subtitle: String
    let isCompleted: Bool
    let isLast: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Indicator
            VStack(spacing: 0) {
                Circle()
                    .fill(isCompleted ? Color.green : Color.white.opacity(0.3))
                    .frame(width: 12, height: 12)
                
                if !isLast {
                    Rectangle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 2, height: 40)
                }
            }
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
            }
            
            Spacer()
        }
    }
}

// MARK: - ViewModel

@MainActor
final class LeaveDetailViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var leave: LeaveRequest?
    
    private let leaveService = LeaveService.shared
    
    func loadLeave(id: Int) async {
        isLoading = true
        error = nil
        
        do {
            leave = try await leaveService.getLeaveDetail(id: id)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func cancelLeave(id: Int) async {
        do {
            let response = try await leaveService.cancelLeave(id: id)
            if let updatedLeave = response.data {
                leave = updatedLeave
            } else {
                leave?.status = "CANCELLED"
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    LeaveDetailView(leaveId: 1)
}
