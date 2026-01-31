import SwiftUI
import Combine

struct UserManagementView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: UserManagementViewModel

    init(userId: Int? = nil) {
        _viewModel = StateObject(wrappedValue: UserManagementViewModel(userId: userId))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Identity") {
                    TextField("Email", text: $viewModel.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .disabled(viewModel.isEditing)

                    TextField("Name", text: $viewModel.name)

                    TextField("Employee ID", text: $viewModel.employeeId)
                        .disabled(viewModel.isEditing)
                }

                Section("Organization") {
                    TextField("Department", text: $viewModel.department)
                    TextField("Designation", text: $viewModel.designation)

                    Picker("Role", selection: $viewModel.role) {
                        ForEach(UserRole.allCases, id: \.rawValue) { role in
                            Text(role.displayName).tag(role.rawValue)
                        }
                    }
                }

                if !viewModel.isEditing {
                    Section("Credentials") {
                        SecureField("Temporary Password (optional)", text: $viewModel.password)
                    }
                } else {
                    Section("Status") {
                        Toggle("Active", isOn: $viewModel.isActive)
                    }
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle(viewModel.isEditing ? "Edit User" : "New User")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button(viewModel.isEditing ? "Save" : "Create") {
                        Task {
                            let success = await viewModel.saveUser()
                            if success {
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.canSubmit)
                }
            }
            .task {
                await viewModel.loadUserIfNeeded()
            }
        }
    }
}

@MainActor
final class UserManagementViewModel: ObservableObject {
    @Published var email = ""
    @Published var name = ""
    @Published var employeeId = ""
    @Published var department = ""
    @Published var designation = ""
    @Published var role = UserRole.employee.rawValue
    @Published var password = ""
    @Published var isActive = true
    @Published var isLoading = false
    @Published var error: String?

    let userId: Int?
    var isEditing: Bool { userId != nil }

    private let adminService = AdminService.shared

    init(userId: Int?) {
        self.userId = userId
    }

    var canSubmit: Bool {
        !email.isEmpty && !name.isEmpty && !employeeId.isEmpty
    }

    func loadUserIfNeeded() async {
        guard let userId = userId else { return }
        isLoading = true
        error = nil

        do {
            let user = try await adminService.getUser(id: userId)
            email = user.email
            name = user.name ?? ""
            employeeId = user.employeeId ?? ""
            department = user.department ?? ""
            designation = user.designation ?? ""
            role = user.role
            isActive = user.isActive
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    func saveUser() async -> Bool {
        isLoading = true
        error = nil

        do {
            if let userId = userId {
                let request = UpdateUserRequest(
                    name: name,
                    department: department.isEmpty ? nil : department,
                    designation: designation.isEmpty ? nil : designation,
                    role: role,
                    isActive: isActive
                )
                _ = try await adminService.updateUser(id: userId, request)
            } else {
                let request = CreateUserRequest(
                    email: email,
                    name: name,
                    employeeId: employeeId,
                    department: department,
                    designation: designation.isEmpty ? nil : designation,
                    role: role,
                    password: password.isEmpty ? nil : password
                )
                _ = try await adminService.createUser(request)
            }
            isLoading = false
            return true
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }
}

#Preview {
    UserManagementView()
}
