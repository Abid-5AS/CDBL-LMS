//
//  EmailComposer.swift
//  CDBLLeaveCompanion
//
//  Email composition service using MessageUI
//

import Foundation
import Combine
import MessageUI
import SwiftUI

// MARK: - Email Composer

class EmailComposer: NSObject, ObservableObject {
    static let shared = EmailComposer()
    
    // Default CDBL HR email (configurable)
    let defaultRecipient = "hr@cdbl.com.bd"
    
    @Published var canSendMail = false
    
    override init() {
        super.init()
        canSendMail = MFMailComposeViewController.canSendMail()
    }
    
    /// Create email subject for leave request
    func generateSubject(for request: LeaveRequest) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        let dateRange = "\(formatter.string(from: request.startDate)) - \(formatter.string(from: request.endDate))"
        return "Leave Request - \(request.type.displayName) - \(dateRange)"
    }
    
    /// Create email body for leave request
    func generateBody(for request: LeaveRequest) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        
        return """
        Dear HR Team,
        
        Please find attached my leave request details.
        
        Leave Type: \(request.type.displayName)
        Start Date: \(formatter.string(from: request.startDate))
        End Date: \(formatter.string(from: request.endDate))
        Duration: \(request.workingDays) day(s)
        Reason: \(request.reason)
        
        The leave request package (JSON file) and QR code are attached for your reference.
        
        Thank you.
        """
    }
    
    /// Get mail compose view controller configured for leave request
    func composeEmail(
        recipient: String? = nil,
        subject: String? = nil,
        body: String? = nil,
        attachments: [URL] = [],
        for request: LeaveRequest
    ) -> MFMailComposeViewController? {
        guard canSendMail else {
            return nil
        }
        
        let composer = MFMailComposeViewController()
        composer.mailComposeDelegate = self
        
        // Recipient
        composer.setToRecipients([recipient ?? defaultRecipient])
        
        // Subject
        composer.setSubject(subject ?? generateSubject(for: request))
        
        // Body
        composer.setMessageBody(body ?? generateBody(for: request), isHTML: false)
        
        // Attachments
        for attachmentURL in attachments {
            do {
                let attachmentData = try Data(contentsOf: attachmentURL)
                let fileName = attachmentURL.lastPathComponent
                let mimeType = fileName.hasSuffix(".json") ? "application/json" : "image/png"
                composer.addAttachmentData(attachmentData, mimeType: mimeType, fileName: fileName)
            } catch {
                print("EmailComposer: Failed to load attachment \(attachmentURL.lastPathComponent): \(error)")
            }
        }
        
        return composer
    }
}

// MARK: - MFMailComposeViewControllerDelegate

extension EmailComposer: MFMailComposeViewControllerDelegate {
    func mailComposeController(
        _ controller: MFMailComposeViewController,
        didFinishWith result: MFMailComposeResult,
        error: Error?
    ) {
        controller.dismiss(animated: true)
        
        // Handle result if needed
        switch result {
        case .sent:
            print("Email sent successfully")
        case .saved:
            print("Email saved to drafts")
        case .cancelled:
            print("Email composition cancelled")
        case .failed:
            print("Email failed: \(error?.localizedDescription ?? "Unknown error")")
        @unknown default:
            break
        }
    }
}
