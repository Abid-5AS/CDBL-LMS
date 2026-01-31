import SwiftUI
import Combine

struct ApprovalDetailView: View {
    let approvalId: Int
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = ApprovalDetailViewModel()

    @State private var showActionSheet = false
    @State private var selectedAction: ApprovalActionType?
    @State private var comments = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()

                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadDetail(id: approvalId) }
                    }
                } else if let detail = viewModel.detail {
                    content(detail)
                }
            }
            .navigationTitle("Approval Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
            .task {
                await viewModel.loadDetail(id: approvalId)
            }
            .sheet(isPresented: $showActionSheet) {
                actionSheet
            }
        }
    }

    private func content(_ detail: ApprovalDetail) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                header(detail)
                leaveDetails(detail.leave)
                if let timeline = detail.timeline, !timeline.isEmpty {
                    timelineSection(timeline)
                }
                actionButtons
                Spacer().frame(height: 20)
            }
            .padding(.top, 20)
        }
    }

    private func header(_ detail: ApprovalDetail) -> some View {
        VStack(spacing: 12) {
            Text(detail.employee?.name ?? "Employee")
                .font(.title2.bold())
            Text(detail.employee?.department ?? "")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }

    private func leaveDetails(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 0) {
            DetailRow(label: "Type", value: LeaveType(rawValue: leave.type)?.displayName ?? leave.type)
            Divider()
            DetailRow(label: "Start Date", value: formatDate(leave.startDate))
            Divider()
            DetailRow(label: "End Date", value: formatDate(leave.endDate))
            Divider()
            DetailRow(label: "Status", value: leave.status.capitalized)
            if let reason = leave.reason, !reason.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Reason")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(reason)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
        }
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }

    private func timelineSection(_ timeline: [ApprovalTimelineItem]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Timeline")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)

            VStack(spacing: 12) {
                ForEach(timeline) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: item.actionIcon)
                            .foregroundStyle(item.actionColor)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.action.capitalized)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text(item.actorName)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let comments = item.comments, !comments.isEmpty {
                                Text(comments)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                    }
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }

    private var actionButtons: some View {
        HStack(spacing: 8) {
            Button("Reject") {
                selectedAction = .reject
                showActionSheet = true
            }
            .buttonStyle(.bordered)
            .foregroundStyle(.red)

            Button("Return") {
                selectedAction = .returnBack
                showActionSheet = true
            }
            .buttonStyle(.bordered)
            .foregroundStyle(.orange)

            Button("Forward") {
                selectedAction = .forward
                showActionSheet = true
            }
            .buttonStyle(.bordered)
            .foregroundStyle(.orange)

            Button("Approve") {
                Task { await viewModel.approve(id: approvalId) }
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
        }
        .padding(.horizontal)
    }

    private var actionSheet: some View {
        NavigationStack {
            Form {
                Section("Comments") {
                    TextField("Add a comment", text: $comments)
                }
            }
            .navigationTitle(selectedAction?.title ?? "Action")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        comments = ""
                        showActionSheet = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Submit") {
                        Task {
                            await submitAction()
                        }
                    }
                    .disabled(selectedAction?.requiresComment == true && comments.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func submitAction() async {
        guard let action = selectedAction else { return }
        let commentText = comments.trimmingCharacters(in: .whitespacesAndNewlines)

        switch action {
        case .reject:
            await viewModel.reject(id: approvalId, comments: commentText)
        case .returnBack:
            await viewModel.returnLeave(id: approvalId, comments: commentText)
        case .forward:
            await viewModel.forward(id: approvalId, comments: commentText.isEmpty ? nil : commentText)
        }

        comments = ""
        showActionSheet = false
        dismiss()
    }

    private func formatDate(_ dateString: String) -> String {
        if dateString.count >= 10 {
            let dateOnly = String(dateString.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "MMM dd, yyyy"
                return formatter.string(from: date)
            }
        }
        return dateString
    }
}

enum ApprovalActionType {
    case reject
    case returnBack
    case forward

    var title: String {
        switch self {
        case .reject: return "Reject"
        case .returnBack: return "Return"
        case .forward: return "Forward"
        }
    }

    var requiresComment: Bool {
        switch self {
        case .reject, .returnBack: return true
        case .forward: return false
        }
    }
}

@MainActor
final class ApprovalDetailViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var detail: ApprovalDetail?

    private let approvalService = ApprovalService.shared

    func loadDetail(id: Int) async {
        isLoading = true
        error = nil
        do {
            detail = try await approvalService.getApprovalDetail(id: id)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    func approve(id: Int) async {
        do {
            _ = try await approvalService.approveLeave(id: id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func reject(id: Int, comments: String) async {
        do {
            _ = try await approvalService.rejectLeave(id: id, comments: comments)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func forward(id: Int, comments: String?) async {
        do {
            _ = try await approvalService.forwardLeave(id: id, comments: comments)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func returnLeave(id: Int, comments: String) async {
        do {
            _ = try await approvalService.returnLeave(id: id, comments: comments)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
