//
//  ApprovalService.swift
//  CDBLLeaveManager
//
//  Approval workflow API service.
//

import Foundation

actor ApprovalService {
    static let shared = ApprovalService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - Pending Approvals
    
    func getPendingApprovals(page: Int = 1, pageSize: Int = 20) async throws -> ApprovalListResponse {
        return try await client.request("approvals/pending?page=\(page)&pageSize=\(pageSize)")
    }
    
    // MARK: - Approval History
    
    func getApprovalHistory(page: Int = 1, pageSize: Int = 20) async throws -> ApprovalListResponse {
        return try await client.request("approvals/history?page=\(page)&pageSize=\(pageSize)")
    }
    
    // MARK: - Approval Detail
    
    func getApprovalDetail(id: Int) async throws -> ApprovalDetail {
        return try await client.request("approvals/\(id)")
    }
    
    // MARK: - Approve Leave
    
    func approveLeave(id: Int, comments: String? = nil) async throws -> APIResponse<LeaveRequest> {
        let request = ApprovalActionRequest(action: "APPROVE", comments: comments)
        return try await client.request(
            "approvals/\(id)/action",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Reject Leave
    
    func rejectLeave(id: Int, comments: String) async throws -> APIResponse<LeaveRequest> {
        let request = ApprovalActionRequest(action: "REJECT", comments: comments)
        return try await client.request(
            "approvals/\(id)/action",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Return Leave
    
    func returnLeave(id: Int, comments: String) async throws -> APIResponse<LeaveRequest> {
        let request = ApprovalActionRequest(action: "RETURN", comments: comments)
        return try await client.request(
            "approvals/\(id)/action",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Bulk Actions
    
    func bulkApprove(ids: [Int], comments: String? = nil) async throws -> APIResponse<[LeaveRequest]> {
        struct BulkRequest: Encodable {
            let ids: [Int]
            let action: String
            let comments: String?
        }
        
        return try await client.request(
            "approvals/bulk-action",
            method: .post,
            body: BulkRequest(ids: ids, action: "APPROVE", comments: comments)
        )
    }
    
    // MARK: - Approval Count
    
    func getPendingCount() async throws -> Int {
        struct CountResponse: Decodable {
            let count: Int
        }
        let response: CountResponse = try await client.request("approvals/pending/count")
        return response.count
    }
}
