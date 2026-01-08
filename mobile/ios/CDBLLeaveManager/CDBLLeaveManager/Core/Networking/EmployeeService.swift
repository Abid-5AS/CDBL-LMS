//
//  EmployeeService.swift
//  CDBLLeaveManager
//
//  Employee and team management API service.
//

import Foundation

actor EmployeeService {
    static let shared = EmployeeService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - Team Members
    
    func getTeamMembers(page: Int = 1, pageSize: Int = 50) async throws -> EmployeeListResponse {
        return try await client.request("employees/team?page=\(page)&pageSize=\(pageSize)")
    }
    
    // MARK: - All Employees (HR/Admin)
    
    func getAllEmployees(
        page: Int = 1,
        pageSize: Int = 50,
        search: String? = nil,
        department: String? = nil
    ) async throws -> EmployeeListResponse {
        var endpoint = "employees?page=\(page)&pageSize=\(pageSize)"
        
        if let search = search, !search.isEmpty {
            endpoint += "&search=\(search.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? search)"
        }
        if let department = department, !department.isEmpty {
            endpoint += "&department=\(department)"
        }
        
        return try await client.request(endpoint)
    }
    
    // MARK: - Employee Detail
    
    func getEmployeeDetail(id: Int) async throws -> EmployeeDetail {
        return try await client.request("employees/\(id)")
    }
    
    // MARK: - Employee Leaves
    
    func getEmployeeLeaves(id: Int, limit: Int = 10) async throws -> LeaveListResponse {
        return try await client.request("employees/\(id)/leaves?limit=\(limit)")
    }
    
    // MARK: - Employee Balance
    
    func getEmployeeBalance(id: Int) async throws -> DashboardLeaveBalance {
        return try await client.request("employees/\(id)/balance")
    }
    
    // MARK: - Departments
    
    func getDepartments() async throws -> [String] {
        let response: APIResponse<[String]> = try await client.request("employees/departments")
        return response.data ?? []
    }
}
