//
//  AuthModels.swift
//  CDBLLeaveManager
//
//  Authentication related models matching Android implementation.
//

import Foundation

// MARK: - Login Request

struct LoginRequest: Encodable {
    let email: String
    let password: String
    let skipOtp: Bool
    
    init(email: String, password: String, skipOtp: Bool = false) {
        self.email = email
        self.password = password
        self.skipOtp = skipOtp
    }
}

// MARK: - Login Response

struct LoginResponse: Decodable {
    let success: Bool
    let data: LoginData?
    let error: String?
}

struct LoginData: Decodable {
    let user: AuthUser?
    let token: String?
    let refreshToken: String?
    let expiresIn: Int?
    let requiresOtp: Bool?
    let message: String?
}

// MARK: - OTP Verification

struct VerifyOtpRequest: Encodable {
    let email: String
    let code: String
}

// MARK: - User Model

struct AuthUser: Decodable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let employeeId: String
    let department: String
    let role: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case name
        case employeeId
        case department
        case role
    }
}

// MARK: - User Details Response

struct UserDetailsResponse: Decodable {
    let id: Int
    let email: String
    let name: String?
    let employeeId: String?
    let phone: String?
    let department: String?
    let designation: String?
    let joiningDate: String?
    let address: String?
    let emergencyContact: String?
    let role: String
    let createdAt: String?
    let updatedAt: String?
}

// MARK: - Change Password

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String
    let confirmPassword: String
}

struct ChangePasswordResponse: Decodable {
    let success: Bool
    let message: String?
    let error: String?
}

// MARK: - Update Profile

struct UpdateProfileRequest: Encodable {
    let name: String?
    let phone: String?
    let emergencyContact: String?
    let address: String?
    
    init(name: String? = nil, phone: String? = nil, emergencyContact: String? = nil, address: String? = nil) {
        self.name = name
        self.phone = phone
        self.emergencyContact = emergencyContact
        self.address = address
    }
}

// MARK: - User Role Enum

enum UserRole: String, CaseIterable {
    case employee = "EMPLOYEE"
    case deptHead = "DEPT_HEAD"
    case hrAdmin = "HR_ADMIN"
    case hrHead = "HR_HEAD"
    case ceo = "CEO"
    case systemAdmin = "SYSTEM_ADMIN"
    
    var displayName: String {
        switch self {
        case .employee: return "Employee"
        case .deptHead: return "Department Head"
        case .hrAdmin: return "HR Admin"
        case .hrHead: return "HR Head"
        case .ceo: return "CEO"
        case .systemAdmin: return "System Admin"
        }
    }
    
    var isManager: Bool {
        self == .deptHead
    }
    
    var isHR: Bool {
        self == .hrAdmin || self == .hrHead
    }
    
    var isAdmin: Bool {
        self == .systemAdmin
    }
    
    var canApprove: Bool {
        switch self {
        case .deptHead, .hrAdmin, .hrHead, .ceo:
            return true
        default:
            return false
        }
    }
}
