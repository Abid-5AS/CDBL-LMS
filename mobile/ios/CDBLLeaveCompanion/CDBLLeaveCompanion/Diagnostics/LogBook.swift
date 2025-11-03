//
//  LogBook.swift
//  CDBLLeaveCompanion
//
//  Structured logging with OSLog and redaction
//

import Foundation
import OSLog

// MARK: - Log Categories

enum LogCategory: String {
    case policy = "policy"
    case sync = "sync"
    case ui = "ui"
    case security = "security"
}

// MARK: - LogBook

/// Centralized logging with redaction
class LogBook {
    
    static let shared = LogBook()
    private let subsystem = "com.cdbl.leave-companion"
    
    private init() {}
    
    /// Log an event with category and level
    func log(
        _ event: String,
        category: LogCategory,
        level: OSLogType = .info,
        context: [String: Any] = [:]
    ) {
        let logger = Logger(subsystem: subsystem, category: category.rawValue)
        
        // Redact sensitive context
        let redactedContext = redact(context)
        let contextString = redactedContext.map { "\($0.key)=\($0.value)" }.joined(separator: ", ")
        
        let message = contextString.isEmpty ? event : "\(event) | \(contextString)"
        
        logger.log(level: level, "\(message)")
    }
    
    // MARK: - Redaction
    
    /// Redact sensitive fields from context
    private func redact(_ context: [String: Any]) -> [String: Any] {
        let sensitiveKeys = [
            "empCode",
            "email",
            "reason",
            "signingKey",
            "deviceKey",
            "token",
            "password"
        ]
        
        var redacted = context
        for (key, value) in redacted {
            if sensitiveKeys.contains(key.lowercased()) {
                if let str = value as? String {
                    redacted[key] = "***"
                }
            }
        }
        
        return redacted
    }
}

// MARK: - Convenience Logging Functions

extension LogBook {
    
    func logPolicy(_ event: String, context: [String: Any] = [:]) {
        log(event, category: .policy, context: context)
    }
    
    func logSync(_ event: String, context: [String: Any] = [:]) {
        log(event, category: .sync, context: context)
    }
    
    func logUI(_ event: String, context: [String: Any] = [:]) {
        log(event, category: .ui, context: context)
    }
    
    func logSecurity(_ event: String, context: [String: Any] = [:]) {
        log(event, category: .security, level: .error, context: context)
    }
}

