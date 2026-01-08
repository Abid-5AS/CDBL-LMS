//
//  AdminService.swift
//  CDBLLeaveManager
//
//  Admin and system management API service.
//

import Foundation

actor AdminService {
    static let shared = AdminService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - User Management
    
    func getUsers(page: Int = 1, pageSize: Int = 50) async throws -> UserListResponse {
        return try await client.request("admin/users?page=\(page)&pageSize=\(pageSize)")
    }
    
    func getUser(id: Int) async throws -> UserAdmin {
        return try await client.request("admin/users/\(id)")
    }
    
    func createUser(_ request: CreateUserRequest) async throws -> APIResponse<UserAdmin> {
        return try await client.request(
            "admin/users",
            method: .post,
            body: request
        )
    }
    
    func updateUser(id: Int, _ request: UpdateUserRequest) async throws -> APIResponse<UserAdmin> {
        return try await client.request(
            "admin/users/\(id)",
            method: .put,
            body: request
        )
    }
    
    func deleteUser(id: Int) async throws -> APIResponse<Bool> {
        return try await client.request(
            "admin/users/\(id)",
            method: .delete
        )
    }
    
    func toggleUserStatus(id: Int, isActive: Bool) async throws -> APIResponse<UserAdmin> {
        return try await client.request(
            "admin/users/\(id)/status",
            method: .patch,
            body: ["isActive": isActive]
        )
    }
    
    // MARK: - Audit Logs
    
    func getAuditLogs(
        page: Int = 1,
        pageSize: Int = 50,
        action: String? = nil
    ) async throws -> AuditLogsResponse {
        var endpoint = "admin/audit-logs?page=\(page)&pageSize=\(pageSize)"
        if let action = action {
            endpoint += "&action=\(action)"
        }
        return try await client.request(endpoint)
    }
    
    // MARK: - Workflow Policies
    
    func getWorkflowPolicies() async throws -> WorkflowPolicyListResponse {
        return try await client.request("admin/workflow-policies")
    }
    
    func updateWorkflowPolicy(id: Int, policy: WorkflowPolicy) async throws -> APIResponse<WorkflowPolicy> {
        return try await client.request(
            "admin/workflow-policies/\(id)",
            method: .put,
            body: policy
        )
    }
    
    // MARK: - HRIS Sync
    
    func getHrisSyncStatus() async throws -> HrisSyncStatus {
        return try await client.request("admin/hris/status")
    }
    
    func triggerHrisSync(force: Bool = false) async throws -> APIResponse<HrisSyncStatus> {
        return try await client.request(
            "admin/hris/sync",
            method: .post,
            body: HrisSyncRequest(force: force)
        )
    }
    
    // MARK: - Webhooks
    
    func getWebhooks() async throws -> WebhookListResponse {
        return try await client.request("admin/webhooks")
    }
    
    func createWebhook(_ request: CreateWebhookRequest) async throws -> APIResponse<Webhook> {
        return try await client.request(
            "admin/webhooks",
            method: .post,
            body: request
        )
    }
    
    func deleteWebhook(id: Int) async throws -> APIResponse<Bool> {
        return try await client.request(
            "admin/webhooks/\(id)",
            method: .delete
        )
    }
    
    func testWebhook(id: Int) async throws -> APIResponse<Bool> {
        return try await client.request(
            "admin/webhooks/\(id)/test",
            method: .post
        )
    }
}
