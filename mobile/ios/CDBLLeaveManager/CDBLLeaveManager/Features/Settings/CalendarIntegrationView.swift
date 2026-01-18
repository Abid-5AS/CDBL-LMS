import SwiftUI
import Combine

struct CalendarIntegrationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CalendarIntegrationViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()

                if viewModel.isLoading && viewModel.providers.isEmpty {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.providers.isEmpty {
                    ErrorView(error) {
                        Task { await viewModel.loadStatus() }
                    }
                } else if viewModel.providers.isEmpty {
                    EmptyStateView(
                        icon: "calendar",
                        title: "No Integrations",
                        message: "No calendar providers available."
                    )
                } else {
                    providerList
                }
            }
            .navigationTitle("Calendar Integration")
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

    private var providerList: some View {
        List(viewModel.providers) { provider in
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(provider.provider)
                        .font(.headline)
                        .foregroundStyle(.primary)

                    if let lastSync = provider.lastSyncAt {
                        Text("Last sync: \(lastSync)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Not synced yet")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: provider.isActive ? "checkmark.circle.fill" : "xmark.circle")
                    .foregroundStyle(provider.isActive ? Color.accentColor : .secondary)
            }
        }
        .listStyle(.insetGrouped)
    }
}

@MainActor
final class CalendarIntegrationViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var providers: [CalendarIntegrationStatus] = []

    private let service = IntegrationService.shared

    func loadStatus() async {
        isLoading = true
        error = nil

        do {
            providers = try await service.getCalendarStatus()
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    CalendarIntegrationView()
}
