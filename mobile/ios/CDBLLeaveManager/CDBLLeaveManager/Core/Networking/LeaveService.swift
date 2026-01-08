//
//  LeaveService.swift
//  CDBLLeaveManager
//
//  Leave management API service.
//

import Foundation

actor LeaveService {
    static let shared = LeaveService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - Leave History
    
    func getLeaveHistory(
        status: String? = nil,
        type: String? = nil,
        page: Int = 1,
        pageSize: Int = 20
    ) async throws -> LeaveListResponse {
        var endpoint = "leaves?page=\(page)&pageSize=\(pageSize)"
        
        if let status = status, !status.isEmpty {
            endpoint += "&status=\(status)"
        }
        if let type = type, !type.isEmpty {
            endpoint += "&type=\(type)"
        }
        
        return try await client.request(endpoint)
    }
    
    // MARK: - Leave Detail
    
    func getLeaveDetail(id: Int) async throws -> LeaveRequest {
        return try await client.request("leaves/\(id)")
    }
    
    // MARK: - Apply Leave
    
    func applyLeave(_ request: ApplyLeaveRequest) async throws -> APIResponse<LeaveRequest> {
        return try await client.request(
            "leaves",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Cancel Leave
    
    func cancelLeave(id: Int) async throws -> APIResponse<LeaveRequest> {
        return try await client.request(
            "leaves/\(id)/cancel",
            method: .post
        )
    }
    
    // MARK: - Withdraw Leave
    
    func withdrawLeave(id: Int) async throws -> APIResponse<LeaveRequest> {
        return try await client.request(
            "leaves/\(id)/withdraw",
            method: .post
        )
    }
    
    // MARK: - Balance
    
    func getBalance() async throws -> DashboardLeaveBalance {
        return try await client.request("leave/balance")
    }
    
    func getDetailedBalance() async throws -> BalanceResponse {
        return try await client.request("leave/balance/detailed")
    }
    
    // MARK: - Leave Types
    
    func getLeaveTypes() async throws -> [String] {
        let response: APIResponse<[String]> = try await client.request("leave/types")
        return response.data ?? LeaveType.allCases.map { $0.rawValue }
    }
    
    // MARK: - Check Availability
    
    func checkAvailability(
        type: String,
        startDate: String,
        endDate: String
    ) async throws -> APIResponse<Bool> {
        struct CheckRequest: Encodable {
            let type: String
            let startDate: String
            let endDate: String
        }
        
        return try await client.request(
            "leave/check-availability",
            method: .post,
            body: CheckRequest(type: type, startDate: startDate, endDate: endDate)
        )
    }
}
