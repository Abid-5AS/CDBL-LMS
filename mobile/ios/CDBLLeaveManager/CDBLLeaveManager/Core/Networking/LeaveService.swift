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
    
    func applyLeave(
        _ request: ApplyLeaveRequest,
        file: APIClient.MultipartFile? = nil
    ) async throws -> APIResponse<LeaveRequest> {
        if let file = file {
            var fields: [String: String] = [
                "type": request.type,
                "startDate": request.startDate,
                "endDate": request.endDate,
                "reason": request.reason
            ]
            if let needsCertificate = request.needsCertificate {
                fields["needsCertificate"] = String(needsCertificate)
            }
            if let incidentDate = request.incidentDate {
                fields["incidentDate"] = incidentDate
            }
            if let isHalfDay = request.isHalfDay {
                fields["isHalfDay"] = String(isHalfDay)
            }
            if let halfDayPeriod = request.halfDayPeriod {
                fields["halfDayPeriod"] = halfDayPeriod
            }

            return try await client.requestMultipart(
                "leaves",
                method: .post,
                fields: fields,
                file: file
            )
        }

        return try await client.request(
            "leaves",
            method: .post,
            body: request
        )
    }

    // MARK: - Upload Certificate

    func uploadCertificate(
        leaveId: Int,
        type: String,
        file: APIClient.MultipartFile
    ) async throws -> APIResponse<LeaveRequest> {
        return try await client.requestMultipart(
            "leaves/\(leaveId)/certificate",
            method: .post,
            fields: ["type": type],
            file: file
        )
    }

    // MARK: - Resubmit Leave

    func resubmitLeave(
        leaveId: Int,
        request: ApplyLeaveRequest,
        file: APIClient.MultipartFile? = nil
    ) async throws -> APIResponse<LeaveRequest> {
        if let file = file {
            var fields: [String: String] = [
                "type": request.type,
                "startDate": request.startDate,
                "endDate": request.endDate,
                "reason": request.reason
            ]
            if let needsCertificate = request.needsCertificate {
                fields["needsCertificate"] = String(needsCertificate)
            }
            if let incidentDate = request.incidentDate {
                 fields["incidentDate"] = incidentDate
            }
            if let isHalfDay = request.isHalfDay {
                 fields["isHalfDay"] = String(isHalfDay)
            }
            if let halfDayPeriod = request.halfDayPeriod {
                 fields["halfDayPeriod"] = halfDayPeriod
            }
            return try await client.requestMultipart(
                "leaves/\(leaveId)/resubmit",
                method: .post,
                fields: fields,
                file: file
            )
        }

        return try await client.request(
            "leaves/\(leaveId)/resubmit",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Cancel Leave
    
    func cancelLeave(id: Int) async throws -> APIResponse<LeaveRequest> {
        return try await client.request(
            "leaves/\(id)",
            method: .patch,
            body: ["reason": "Cancelled by user"]
        )
    }
    
    // MARK: - Withdraw Leave
    
    func withdrawLeave(id: Int) async throws -> APIResponse<LeaveRequest> {
        // Withdraw usually implies same as cancel in this system context if early
        return try await client.request(
            "leaves/\(id)",
            method: .patch,
            body: ["reason": "Withdrawn by user"]
        )
    }
    
    // MARK: - Balance
    
    func getBalance() async throws -> DashboardLeaveBalance {
        // Use the correct backend endpoint: /api/balance/mine
        return try await client.request("balance/mine")
    }
    
    func getDetailedBalance() async throws -> BalanceResponse {
        return try await client.request("balance/mine?detailed=true")
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
