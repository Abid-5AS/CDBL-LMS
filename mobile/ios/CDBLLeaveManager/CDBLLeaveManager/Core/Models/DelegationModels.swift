import Foundation
import Combine

struct DelegationsResponse: Decodable {
    let delegations: [DelegationEntry]?
    let items: [DelegationEntry]?

    var allDelegations: [DelegationEntry] {
        delegations ?? items ?? []
    }
}

struct DelegationEntry: Decodable, Identifiable {
    let id: Int
    let delegatorId: Int?
    let delegatorName: String?
    let delegateId: Int?
    let delegateName: String?
    let startDate: String
    let endDate: String
    let reason: String?
    let createdAt: String?
}
