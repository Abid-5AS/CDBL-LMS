//
//  APIEndpoints.swift
//  CDBLLeaveCompanion
//
//  API endpoint definitions
//
//  TODO: Implement actual networking layer
//

import Foundation

enum APIEndpoints {
    static let baseURL = "https://lms.cdbl.com.bd" // TODO: Move to AppConfig
    
    // MARK: - Mobile Pairing
    case pair(deviceInfo: PairDeviceRequest)
    
    // MARK: - Balance
    case getBalance
    
    // MARK: - Leave Requests
    case getLeaves(status: String?, type: String?, limit: Int, offset: Int)
    case createLeave(_ request: LeaveRequest)
    case getLeave(_ id: UUID)
    case cancelLeave(_ id: UUID, reason: String)
    
    // MARK: - Holidays
    case getHolidays(year: Int)
    
    // MARK: - File Upload
    case uploadCertificate(leaveId: UUID, file: Data, type: String)
    
    // MARK: - URL Construction
    var url: URL? {
        let path: String
        
        switch self {
        case .pair:
            path = "/api/mobile/pair"
        case .getBalance:
            path = "/api/balance/mine"
        case .getLeaves(let status, let type, let limit, let offset):
            var components = URLComponents(string: APIEndpoints.baseURL + "/api/leaves")
            var queryItems: [URLQueryItem] = []
            if let status = status {
                queryItems.append(URLQueryItem(name: "status", value: status))
            }
            if let type = type {
                queryItems.append(URLQueryItem(name: "type", value: type))
            }
            queryItems.append(URLQueryItem(name: "limit", value: String(limit)))
            queryItems.append(URLQueryItem(name: "offset", value: String(offset)))
            components?.queryItems = queryItems
            return components?.url
        case .createLeave:
            path = "/api/leaves"
        case .getLeave(let id):
            path = "/api/leaves/\(id.uuidString)"
        case .cancelLeave(let id, _):
            path = "/api/leaves/\(id.uuidString)/cancel"
        case .getHolidays(let year):
            path = "/api/holidays?year=\(year)"
        case .uploadCertificate(let leaveId, _, _):
            path = "/api/leaves/\(leaveId.uuidString)/certificate"
        }
        
        return URL(string: APIEndpoints.baseURL + path)
    }
}

// MARK: - Pair Device Request

struct PairDeviceRequest: Codable {
    let pairToken: String
    let devicePublicKey: String
    let deviceInfo: DeviceInfo
}

struct DeviceInfo: Codable {
    let model: String
    let osVersion: String
    let appVersion: String
}

// MARK: - TODO List

/*
 * TODO Implementation Tasks:
 * 1. Create APIClient.swift with URLSession-based networking
 * 2. Add request/response serialization
 * 3. Implement token refresh flow
 * 4. Add retry logic with exponential backoff
 * 5. Create mock API client for development
 * 6. Add request interceptors for auth headers
 * 7. Implement file upload with progress tracking
 */

