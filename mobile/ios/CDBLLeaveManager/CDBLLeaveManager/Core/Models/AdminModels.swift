//
//  AdminModels.swift
//  CDBLLeaveManager
//
//  Admin and system management models.
//

import Foundation

// MARK: - User Admin (for user management)

struct UserAdmin: Decodable, Identifiable {
    let id: Int
    let email: String
    let name: String?
    let employeeId: String?
    let department: String?
    let designation: String?
    let role: String
    let isActive: Bool
    let createdAt: String?
    let lastLogin: String?
}

struct UserListResponse: Decodable {
    let users: [UserAdmin]?
    let items: [UserAdmin]?
    let total: Int?
    
    var allUsers: [UserAdmin] {
        users ?? items ?? []
    }
}

// MARK: - Create/Update User

struct CreateUserRequest: Encodable {
    let email: String
    let name: String
    let employeeId: String
    let department: String
    let designation: String?
    let role: String
    let password: String?
}

struct UpdateUserRequest: Encodable {
    let name: String?
    let department: String?
    let designation: String?
    let role: String?
    let isActive: Bool?
}

// MARK: - Workflow Policy

struct WorkflowPolicy: Codable, Identifiable {
    let id: Int
    let name: String
    let description: String?
    let leaveType: String?
    let minDays: Int?
    let maxDays: Int?
    let requiresApproval: Bool
    let approverRoles: [String]?
    let isActive: Bool
    let createdAt: String?
    
    // Computed properties for UI
    var leaveTypes: [String]? {
        if let type = leaveType {
            return [type]
        }
        return nil
    }
    
    var approvalLevels: Int {
        approverRoles?.count ?? 1
    }
    
    var rules: [String]? {
        var ruleList: [String] = []
        if let min = minDays {
            ruleList.append("Minimum \(min) days")
        }
        if let max = maxDays {
            ruleList.append("Maximum \(max) days")
        }
        if requiresApproval {
            ruleList.append("Requires approval")
        }
        return ruleList.isEmpty ? nil : ruleList
    }
}

struct WorkflowPolicyListResponse: Decodable {
    let policies: [WorkflowPolicy]?
    let items: [WorkflowPolicy]?
    
    var allPolicies: [WorkflowPolicy] {
        policies ?? items ?? []
    }
}

// MARK: - HRIS Sync

struct HrisSyncStatus: Decodable {
    let lastSyncAt: String?
    let status: String // "IDLE", "SYNCING", "ERROR"
    let recordsProcessed: Int?
    let errors: [String]?
}

struct HrisSyncRequest: Encodable {
    let force: Bool
}

// MARK: - Webhook

struct Webhook: Decodable, Identifiable {
    let id: Int
    let name: String
    let url: String
    let events: [String]
    let isActive: Bool
    let secret: String?
    let createdAt: String?
    let lastTriggeredAt: String?
}

struct WebhookListResponse: Decodable {
    let webhooks: [Webhook]?
    let items: [Webhook]?
    
    var allWebhooks: [Webhook] {
        webhooks ?? items ?? []
    }
}

struct CreateWebhookRequest: Encodable {
    let name: String
    let url: String
    let events: [String]
    let secret: String?
}
