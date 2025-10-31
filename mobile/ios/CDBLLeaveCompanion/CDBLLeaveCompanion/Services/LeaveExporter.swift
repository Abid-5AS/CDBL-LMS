//
//  LeaveExporter.swift
//  CDBLLeaveCompanion
//
//  Export service for creating JSON files from leave requests
//

import Foundation

// MARK: - Leave Exporter

class LeaveExporter {
    static let shared = LeaveExporter()
    
    private init() {}
    
    /// Export a leave request to signed JSON data
    func exportToJSON(_ request: LeaveRequest) throws -> Data {
        // Sign the request
        let signedPackage = try LeaveSigner.shared.signLeaveRequest(request)
        
        // Encode to JSON
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        
        return try encoder.encode(signedPackage)
    }
    
    /// Save JSON data to a temporary file
    func saveToTemporaryFile(_ data: Data) throws -> URL {
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "leave-request-\(UUID().uuidString).json"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        try data.write(to: fileURL)
        
        return fileURL
    }
    
    /// Export leave request and save to temporary file
    func exportAndSaveToFile(_ request: LeaveRequest) throws -> URL {
        let jsonData = try exportToJSON(request)
        return try saveToTemporaryFile(jsonData)
    }
    
    /// Generate a human-readable filename for the export
    func generateFileName(for request: LeaveRequest) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: request.startDate)
        let typeString = request.type.rawValue.lowercased()
        
        return "cdbl-leave-\(typeString)-\(dateString).json"
    }
}

