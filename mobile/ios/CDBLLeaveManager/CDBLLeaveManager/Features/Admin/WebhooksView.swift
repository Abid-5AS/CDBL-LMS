import SwiftUI
import Combine

struct WebhooksView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = WebhooksViewModel()
    @State private var showCreate = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()

                if viewModel.isLoading && viewModel.webhooks.isEmpty {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.webhooks.isEmpty {
                    ErrorView(error) {
                        Task { await viewModel.loadWebhooks() }
                    }
                } else if viewModel.webhooks.isEmpty {
                    EmptyStateView(
                        icon: "link",
                        title: "No Webhooks",
                        message: "Create a webhook to receive events."
                    )
                } else {
                    webhookList
                }
            }
            .navigationTitle("Webhooks")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showCreate = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreate) {
                CreateWebhookView { request in
                    Task { await viewModel.createWebhook(request) }
                }
            }
            .task {
                await viewModel.loadWebhooks()
            }
        }
    }

    private var webhookList: some View {
        List {
            ForEach(viewModel.webhooks) { webhook in
                WebhookRow(
                    webhook: webhook,
                    onTest: { Task { await viewModel.testWebhook(id: webhook.id) } },
                    onDelete: { Task { await viewModel.deleteWebhook(id: webhook.id) } }
                )
            }
        }
        .listStyle(.insetGrouped)
    }
}

struct WebhookRow: View {
    let webhook: Webhook
    let onTest: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(webhook.name)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Spacer()

                Menu {
                    Button("Test", action: onTest)
                    Button("Delete", role: .destructive, action: onDelete)
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(.secondary)
                }
            }

            Text(webhook.url)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("Events: \(webhook.events.joined(separator: ", "))")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct CreateWebhookView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var url = ""
    @State private var events = ""
    @State private var secret = ""

    let onSave: (CreateWebhookRequest) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    TextField("URL", text: $url)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                }

                Section("Events") {
                    TextField("Comma-separated events", text: $events)
                }

                Section("Secret") {
                    TextField("Secret (optional)", text: $secret)
                }
            }
            .navigationTitle("New Webhook")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        let eventList = events
                            .split(separator: ",")
                            .map { $0.trimmingCharacters(in: .whitespaces) }
                            .filter { !$0.isEmpty }
                        let request = CreateWebhookRequest(
                            name: name,
                            url: url,
                            events: eventList,
                            secret: secret.isEmpty ? nil : secret
                        )
                        onSave(request)
                        dismiss()
                    }
                    .disabled(name.isEmpty || url.isEmpty)
                }
            }
        }
    }
}

@MainActor
final class WebhooksViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var webhooks: [Webhook] = []

    private let adminService = AdminService.shared

    func loadWebhooks() async {
        isLoading = true
        error = nil

        do {
            let response = try await adminService.getWebhooks()
            webhooks = response.allWebhooks
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    func createWebhook(_ request: CreateWebhookRequest) async {
        do {
            _ = try await adminService.createWebhook(request)
            await loadWebhooks()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func deleteWebhook(id: Int) async {
        do {
            _ = try await adminService.deleteWebhook(id: id)
            webhooks.removeAll { $0.id == id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func testWebhook(id: Int) async {
        do {
            _ = try await adminService.testWebhook(id: id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    WebhooksView()
}
