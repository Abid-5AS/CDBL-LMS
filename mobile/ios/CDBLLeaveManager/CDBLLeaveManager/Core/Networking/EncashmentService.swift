//
//  EncashmentService.swift
//  CDBLLeaveManager
//
//  API service for leave encashment.
//

import Foundation

actor EncashmentService {
    static let shared = EncashmentService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Get Encashments
    
    func getEncashments(page: Int = 1, pageSize: Int = 20) async throws -> EncashmentListResponse {
        return try await apiClient.request(
            "encashments?page=\(page)&pageSize=\(pageSize)",
            method: .get
        )
    }
    
    func getEncashmentDetail(id: Int) async throws -> Encashment {
        return try await apiClient.request(
            "encashments/\(id)",
            method: .get
        )
    }
    
    // MARK: - Eligibility
    
    func checkEligibility() async throws -> EncashmentEligibility {
        return try await apiClient.request(
            "encashments/eligibility",
            method: .get
        )
    }
    
    // MARK: - Request Encashment
    
    func requestEncashment(_ request: EncashmentRequest) async throws -> Encashment {
        return try await apiClient.request(
            "encashments",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Cancel Encashment
    
    func cancelEncashment(id: Int) async throws {
        let _: EmptyResponse = try await apiClient.request(
            "encashments/\(id)/cancel",
            method: .patch
        )
    }
    
    // MARK: - Admin Actions
    
    func approveEncashment(id: Int) async throws -> Encashment {
        return try await apiClient.request(
            "encashments/\(id)/approve",
            method: .patch
        )
    }
    
    func rejectEncashment(id: Int, reason: String) async throws -> Encashment {
        struct Request: Encodable {
            let reason: String
        }
        return try await apiClient.request(
            "encashments/\(id)/reject",
            method: .patch,
            body: Request(reason: reason)
        )
    }
    
    func processEncashment(id: Int, transactionId: String) async throws -> Encashment {
        struct Request: Encodable {
            let transactionId: String
        }
        return try await apiClient.request(
            "encashments/\(id)/process",
            method: .patch,
            body: Request(transactionId: transactionId)
        )
    }
}
