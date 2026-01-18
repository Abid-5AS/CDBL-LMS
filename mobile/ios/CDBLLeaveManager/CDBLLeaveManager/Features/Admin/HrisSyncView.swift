import SwiftUI
import Combine

struct HrisSyncView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = HrisSyncViewModel()
    @State private var forceSync = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()

                if viewModel.isLoading && viewModel.status == nil {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.status == nil {
                    ErrorView(error) {
                        Task { await viewModel.loadStatus() }
                    }
                } else {
                    content
                }
            }
            .navigationTitle("HRIS Sync")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
            .task {
                await viewModel.loadStatus()
            }
        }
    }

    private var content: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let status = viewModel.status {
                    statusCard(status)
                }

                Toggle("Force Full Sync", isOn: $forceSync)
                    .padding()
                    .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)

                Button("Run Sync") {
                    Task { await viewModel.triggerSync(force: forceSync) }
                }
                .buttonStyle(.borderedProminent)
                .padding(.horizontal)

                if let message = viewModel.successMessage {
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.top, 20)
        }
    }

    private func statusCard(_ status: HrisSyncStatus) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Status")
                .font(.headline)
                .foregroundStyle(.primary)

            Text(status.status)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let lastSync = status.lastSyncAt {
                Text("Last sync: \(lastSync)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let processed = status.recordsProcessed {
                Text("Records processed: \(processed)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let errors = status.errors, !errors.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Errors")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    ForEach(errors, id: \.self) { error in
                        Text(error)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }
}

@MainActor
final class HrisSyncViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var status: HrisSyncStatus?
    @Published var successMessage: String?

    private let adminService = AdminService.shared

    func loadStatus() async {
        isLoading = true
        error = nil
        successMessage = nil

        do {
            status = try await adminService.getHrisSyncStatus()
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    func triggerSync(force: Bool) async {
        isLoading = true
        error = nil
        successMessage = nil

        do {
            let response = try await adminService.triggerHrisSync(force: force)
            status = response.data
            successMessage = response.message ?? "Sync started"
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    HrisSyncView()
}
