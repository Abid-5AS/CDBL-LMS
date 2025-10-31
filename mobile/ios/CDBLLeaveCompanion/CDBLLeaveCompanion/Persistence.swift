//
//  Persistence.swift
//  CDBLLeaveCompanion
//
//  Created by Md.Abid Shahriar on 31/10/25.
//

import CoreData
import OSLog

struct PersistenceController {
    static let shared = PersistenceController()
    private static let logger = Logger(subsystem: "com.cdbl.leavecompanion", category: "Persistence")

    @MainActor
    static let preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        // Preview data with sample leave requests
        let sample1 = LeaveEntity(context: viewContext)
        sample1.id = UUID()
        sample1.type = LeaveType.CASUAL.rawValue
        sample1.startDate = Date()
        sample1.endDate = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()
        sample1.reason = "Family event"
        sample1.needsCertificate = false
        sample1.status = LeaveStatus.DRAFT.rawValue
        sample1.createdAt = Date()
        sample1.exported = false
        
        let sample2 = LeaveEntity(context: viewContext)
        sample2.id = UUID()
        sample2.type = LeaveType.MEDICAL.rawValue
        sample2.startDate = Calendar.current.date(byAdding: .day, value: -10, to: Date()) ?? Date()
        sample2.endDate = Calendar.current.date(byAdding: .day, value: -6, to: Date()) ?? Date()
        sample2.reason = "Medical treatment"
        sample2.needsCertificate = true
        sample2.status = LeaveStatus.SUBMITTED.rawValue
        sample2.createdAt = Calendar.current.date(byAdding: .day, value: -12, to: Date()) ?? Date()
        sample2.exported = true
        
        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            Self.logger.error("Preview context save failed: \(nsError.localizedDescription, privacy: .public)")
        }
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "CDBLLeaveCompanion")
        if inMemory {
            if let description = container.persistentStoreDescriptions.first {
                description.url = URL(fileURLWithPath: "/dev/null")
            } else {
                Self.logger.error("Missing persistent store description for in-memory configuration.")
            }
        }
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                Self.logger.error("Persistent store load failed: \(error.localizedDescription, privacy: .public)")
            }
        })
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}
