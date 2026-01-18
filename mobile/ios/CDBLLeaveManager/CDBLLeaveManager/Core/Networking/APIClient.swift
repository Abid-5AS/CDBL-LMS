//
//  APIClient.swift
//  CDBLLeaveManager
//
//  Core networking client with URLSession and JWT token injection.
//

import Foundation
import Combine

// MARK: - API Configuration

enum APIConfiguration {
    #if DEBUG
    static let baseURL = "https://choosing-jamie-real-operators.trycloudflare.com/api/"
    #else
    static let baseURL = "https://choosing-jamie-real-operators.trycloudflare.com/api/"
    #endif
    
    static let timeoutInterval: TimeInterval = 30
}

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case networkError(Error)
    case serverError(Int, String?)
    case unauthorized
    case forbidden
    case notFound
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return message ?? "Server error (code: \(code))"
        case .unauthorized:
            return "Session expired. Please login again."
        case .forbidden:
            return "You don't have permission to access this resource."
        case .notFound:
            return "Resource not found"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - API Client

final class APIClient: Sendable {
    static let shared = APIClient()
    
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    // isLoading removed as it shouldn't be global state
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = APIConfiguration.timeoutInterval
        config.timeoutIntervalForResource = APIConfiguration.timeoutInterval * 2
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
        
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Request Methods
    
    /// Perform a request with automatic token injection
    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        headers: [String: String]? = nil,
        requiresAuth: Bool = true,
        encoder: JSONEncoder? = nil // Optional custom encoder
    ) async throws -> T {
        guard let url = URL(string: APIConfiguration.baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add custom headers
        headers?.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        
        // Add auth token if required
        if requiresAuth, let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Encode body if present
        if let body = body {
            // Use provided encoder or default (snake_case)
            let bodyEncoder = encoder ?? self.encoder
            request.httpBody = try bodyEncoder.encode(body)
        }
        
        // Perform request
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }
        
        // Handle HTTP status codes
        switch httpResponse.statusCode {
        case 200...299:
            break // Success
        case 401:
            TokenManager.shared.clearToken()
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        default:
            let errorMessage = try? decoder.decode(ErrorResponse.self, from: data).error
            throw APIError.serverError(httpResponse.statusCode, errorMessage)
        }
        
        // Decode response
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    /// Request with raw Data response
    func requestData(
        _ endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        headers: [String: String]? = nil,
        requiresAuth: Bool = true
    ) async throws -> Data {
        guard let url = URL(string: APIConfiguration.baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        headers?.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        
        if requiresAuth, let token = TokenManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError((response as? HTTPURLResponse)?.statusCode ?? 0, nil)
        }
        
        return data
    }
}

// MARK: - Error Response

struct ErrorResponse: Decodable {
    let error: String?
    let message: String?
    let success: Bool?
}

// MARK: - Generic API Response

struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: String?
    let message: String?
}
