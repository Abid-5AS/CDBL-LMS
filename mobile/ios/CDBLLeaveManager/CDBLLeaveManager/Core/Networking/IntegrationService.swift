import Foundation

actor IntegrationService {
    static let shared = IntegrationService()

    private let client = APIClient.shared

    private init() {}

    func getCalendarStatus() async throws -> [CalendarIntegrationStatus] {
        return try await client.request("integrations/calendar/status")
    }
}
