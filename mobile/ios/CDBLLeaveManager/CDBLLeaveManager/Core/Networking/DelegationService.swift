import Foundation

actor DelegationService {
    static let shared = DelegationService()

    private let client = APIClient.shared

    private init() {}

    func getDelegations(type: String = "mine", includeInactive: Bool = false) async throws -> DelegationsResponse {
        let endpoint = "approvals/delegate?type=\(type)&includeInactive=\(includeInactive)"
        return try await client.request(endpoint)
    }

    func revokeDelegation(id: Int) async throws -> APIResponse<Bool> {
        return try await client.request(
            "approvals/delegate?id=\(id)",
            method: .delete
        )
    }
}
