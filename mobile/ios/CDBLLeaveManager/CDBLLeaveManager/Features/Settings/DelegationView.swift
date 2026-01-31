import SwiftUI
import Combine

struct DelegationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = DelegationViewModel()
    @State private var includeInactive = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()

                if viewModel.isLoading && viewModel.delegations.isEmpty {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.delegations.isEmpty {
                    ErrorView(error) {
                        Task { await viewModel.loadDelegations(includeInactive: includeInactive) }
                    }
                } else if viewModel.delegations.isEmpty {
                    EmptyStateView(
                        icon: "person.crop.circle.badge.checkmark",
                        title: "No Delegations",
                        message: "You do not have any active delegation." )
                } else {
                    delegationList
                }
            }
            .navigationTitle("Delegation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Toggle("Include Inactive", isOn: $includeInactive)
                        .labelsHidden()
                        .tint(.accentColor)
                }
            }
            .onChange(of: includeInactive) { _, newValue in
                Task { await viewModel.loadDelegations(includeInactive: newValue) }
            }
            .task {
                await viewModel.loadDelegations(includeInactive: includeInactive)
            }
        }
    }

    private var delegationList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.delegations) { delegation in
                    DelegationCard(
                        delegation: delegation,
                        onRevoke: {
                            Task { await viewModel.revokeDelegation(id: delegation.id) }
                        }
                    )
                }
            }
            .padding()
        }
    }
}

struct DelegationCard: View {
    let delegation: DelegationEntry
    let onRevoke: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(delegation.delegateName ?? "Delegate")
                    .font(.headline)
                    .foregroundStyle(.primary)

                Spacer()

                Button("Revoke", action: onRevoke)
                    .font(.caption)
                    .buttonStyle(.bordered)
            }

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Start")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(delegation.startDate)
                        .font(.caption)
                        .foregroundStyle(.primary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("End")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(delegation.endDate)
                        .font(.caption)
                        .foregroundStyle(.primary)
                }

                Spacer()
            }

            if let reason = delegation.reason, !reason.isEmpty {
                Text(reason)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

@MainActor
final class DelegationViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var delegations: [DelegationEntry] = []

    private let service = DelegationService.shared

    func loadDelegations(includeInactive: Bool) async {
        isLoading = true
        error = nil

        do {
            let response = try await service.getDelegations(includeInactive: includeInactive)
            delegations = response.allDelegations
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    func revokeDelegation(id: Int) async {
        do {
            _ = try await service.revokeDelegation(id: id)
            delegations.removeAll { $0.id == id }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    DelegationView()
}
