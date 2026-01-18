import Foundation

struct CalendarIntegrationStatus: Decodable, Identifiable {
    var id: String { provider }
    let provider: String
    let isActive: Bool
    let lastSyncAt: String?
}
