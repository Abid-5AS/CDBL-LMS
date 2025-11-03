//
//  QueueManager.swift
//  CDBLLeaveCompanion
//
//  CoreData queue management for queued actions
//

import Foundation
import CoreData

// MARK: - Queue Status

enum QueueStatus: String {
    case queued
    case sent
    case confirmed
    case partial
    case failed
}

// MARK: - QueueManager

/// Manages queued actions in CoreData
class QueueManager {
    
    static let shared = QueueManager()
    private let context: NSManagedObjectContext
    
    private init() {
        // Initialize with PersistenceController context
        let persistence = PersistenceController.shared
        self.context = persistence.container.viewContext
    }
    
    /// Create a queued action
    func createAction(
        type: String,
        payloadHash: String,
        attachments: [AttachmentRef]
    ) throws {
        let action = NSEntityDescription.insertNewObject(forEntityName: "QueuedAction", into: context)
        action.setValue(UUID(), forKey: "id")
        action.setValue(type, forKey: "type")
        action.setValue(payloadHash, forKey: "payloadHash")
        action.setValue(Date(), forKey: "createdAt")
        action.setValue(QueueStatus.queued.rawValue, forKey: "status")
        action.setValue(0, forKey: "retryCount")
        
        // Add attachments
        let attachmentRefs = try attachments.map { attRef -> NSManagedObject in
            let ref = NSEntityDescription.insertNewObject(forEntityName: "AttachmentRef", into: context)
            ref.setValue(attRef.name, forKey: "name")
            ref.setValue(attRef.sha256, forKey: "sha256")
            ref.setValue(attRef.size, forKey: "size")
            ref.setValue(attRef.mime, forKey: "mime")
            ref.setValue(attRef.localUrl, forKey: "localUrl")
            return ref
        }
        action.mutableSetValue(forKey: "attachmentRefs").addObjects(from: attachmentRefs)
        
        try context.save()
    }
    
    /// Fetch pending actions count
    func fetchPendingCount() throws -> Int {
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: "QueuedAction")
        request.predicate = NSPredicate(format: "status == %@", QueueStatus.queued.rawValue)
        return try context.count(for: request)
    }
    
    /// Fetch pending actions
    func fetchPendingActions() throws -> [NSManagedObject] {
        let request = NSFetchRequest<NSManagedObject>(entityName: "QueuedAction")
        request.predicate = NSPredicate(format: "status == %@", QueueStatus.queued.rawValue)
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: true)]
        return try context.fetch(request)
    }
    
    /// Mark action as sent
    func markAsSent(actionId: UUID) throws {
        let action = try findAction(id: actionId)
        action.setValue(QueueStatus.sent.rawValue, forKey: "status")
        try context.save()
    }
    
    /// Mark action as confirmed
    func markAsConfirmed(actionId: UUID) throws {
        let action = try findAction(id: actionId)
        action.setValue(QueueStatus.confirmed.rawValue, forKey: "status")
        try context.save()
    }
    
    /// Mark action as failed
    func markAsFailed(actionId: UUID, incrementRetry: Bool = true) throws {
        let action = try findAction(id: actionId)
        action.setValue(QueueStatus.failed.rawValue, forKey: "status")
        if incrementRetry {
            let retryCount = (action.value(forKey: "retryCount") as? Int16 ?? 0) + 1
            action.setValue(retryCount, forKey: "retryCount")
        }
        try context.save()
    }
    
    /// Mark action as partial (missing attachments)
    func markAsPartial(actionId: UUID, missingBlobs: [String]) throws {
        let action = try findAction(id: actionId)
        action.setValue(QueueStatus.partial.rawValue, forKey: "status")
        // TODO: Store missing blobs in context
        try context.save()
    }
    
    /// Delete action
    func deleteAction(actionId: UUID) throws {
        let action = try findAction(id: actionId)
        context.delete(action)
        try context.save()
    }
    
    // MARK: - Private Helpers
    
    private func findAction(id: UUID) throws -> NSManagedObject {
        let request = NSFetchRequest<NSManagedObject>(entityName: "QueuedAction")
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        request.fetchLimit = 1
        
        guard let action = try context.fetch(request).first else {
            throw QueueError.actionNotFound
        }
        
        return action
    }
}

// MARK: - Queue Errors

enum QueueError: LocalizedError {
    case actionNotFound
    case saveFailed
    
    var errorDescription: String? {
        switch self {
        case .actionNotFound:
            return "Queued action not found"
        case .saveFailed:
            return "Failed to save to queue"
        }
    }
}

