import Foundation
import SwiftUI

// MARK: - Mock Models (for UI previews only)
// These are separate from API models to avoid type conflicts

struct MockUser: Identifiable {
    let id = UUID()
    let name: String
    let role: String // "Employee", "Manager", "HR"
    let avatarColor: Color
}

struct MockLeaveBalance: Identifiable {
    let id = UUID()
    let type: String
    let used: Int
    let total: Int
    let color: Color
}

struct MockActivity: Identifiable {
    let id = UUID()
    let title: String
    let date: String
    let status: String // "Approved", "Pending", "Rejected"
    let icon: String
    let color: Color
}

// MARK: - Mock Data Container

class MockData {
    static let shared = MockData()
    
    // Current User
    let currentUser = MockUser(name: "Abid Shahriar", role: "Employee", avatarColor: .blue)
    
    // Balances
    let balances: [MockLeaveBalance] = [
        MockLeaveBalance(type: "Casual", used: 2, total: 14, color: .cyan),
        MockLeaveBalance(type: "Sick", used: 1, total: 14, color: .purple),
        MockLeaveBalance(type: "Annual", used: 5, total: 20, color: .orange),
        MockLeaveBalance(type: "Compensatory", used: 0, total: 5, color: .green)
    ]
    
    // Who's Out
    let whoIsOut: [MockUser] = [
        MockUser(name: "Sarah K.", role: "Manager", avatarColor: .pink),
        MockUser(name: "John D.", role: "Developer", avatarColor: .indigo),
        MockUser(name: "Mike R.", role: "Designer", avatarColor: .teal),
        MockUser(name: "Emily W.", role: "HR", avatarColor: .yellow),
        MockUser(name: "David L.", role: "Analyst", avatarColor: .red)
    ]
    
    // Recent Activity
    let recentActivity: [MockActivity] = [
        MockActivity(title: "Sick Leave Application", date: "Today, 9:30 AM", status: "Pending", icon: "cross.case.fill", color: .purple),
        MockActivity(title: "Casual Leave Request", date: "Yesterday", status: "Approved", icon: "sun.max.fill", color: .cyan),
        MockActivity(title: "Annual Leave Plan", date: "Last Week", status: "Rejected", icon: "airplane", color: .orange)
    ]
}
