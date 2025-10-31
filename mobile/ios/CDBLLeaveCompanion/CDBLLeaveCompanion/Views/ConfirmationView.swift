//
//  ConfirmationView.swift
//  CDBLLeaveCompanion
//
//  Confirmation screen after leave request export with QR code preview
//

import SwiftUI
import MessageUI

struct ConfirmationView: View {
    let request: LeaveRequest
    @Environment(\.dismiss) var dismiss
    
    @State private var qrImage: UIImage?
    @State private var jsonFileURL: URL?
    @State private var qrFileURL: URL?
    @State private var showEmailComposer = false
    @State private var showShareSheet = false
    @State private var isExporting = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: StyleGuide.Spacing.xl) {
                    // Success animation/icon with Liquid Glass
                    if #available(iOS 26.0, *) {
                        GlassEffectContainer {
                            VStack(spacing: StyleGuide.Spacing.md) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 80))
                                    .foregroundColor(StyleGuide.Colors.success)
                                    .glassEffect(.regular, in: Circle())
                                    .glassEffectID("success-icon", in: "confirmation")
                                    .symbolEffect(.bounce, value: showEmailComposer)
                                
                                Text("Leave Request Created")
                                    .font(StyleGuide.Typography.largeTitle)
                                    .glassEffectID("success-title", in: "confirmation")
                                
                                Text("Your leave request has been exported successfully")
                                    .font(StyleGuide.Typography.body)
                                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                                    .multilineTextAlignment(.center)
                                    .glassEffectID("success-message", in: "confirmation")
                            }
                            .padding(.top, StyleGuide.Spacing.xxl)
                        }
                    } else {
                        VStack(spacing: StyleGuide.Spacing.md) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 80))
                                .foregroundColor(StyleGuide.Colors.success)
                                .symbolEffect(.bounce, value: showEmailComposer)
                            
                            Text("Leave Request Created")
                                .font(StyleGuide.Typography.largeTitle)
                            
                            Text("Your leave request has been exported successfully")
                                .font(StyleGuide.Typography.body)
                                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding(.top, StyleGuide.Spacing.xxl)
                    }
                    
                    // QR Code Preview
                    if let qrImage = qrImage {
                        GlassCard {
                            VStack(spacing: StyleGuide.Spacing.md) {
                                Text("QR Code")
                                    .font(StyleGuide.Typography.title3)
                                Image(uiImage: qrImage)
                                    .resizable()
                                    .interpolation(.none)
                                    .scaledToFit()
                                    .frame(width: 200, height: 200)
                                    .cornerRadius(StyleGuide.CornerRadius.small)
                                    .padding()
                                    .background(Color.white)
                                    .cornerRadius(StyleGuide.CornerRadius.medium)
                            }
                        }
                    }
                    
                    // Request Details
                    GlassCard {
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
                            Text("Request Details")
                                .font(StyleGuide.Typography.title3)
                            Divider()
                            DetailRow(label: "Type", value: request.type.displayName)
                            DetailRow(label: "Duration", value: "\(request.workingDays) day(s)")
                            DetailRow(label: "Start", value: request.startDate.formatted(date: .abbreviated, time: .omitted))
                            DetailRow(label: "End", value: request.endDate.formatted(date: .abbreviated, time: .omitted))
                        }
                    }
                    
                    // Action Buttons
                    VStack(spacing: StyleGuide.Spacing.md) {
                        GlassButton("Email to CDBL HR", style: .primary) {
                            handleEmail()
                        }
                        .disabled(isExporting)
                        
                        GlassButton("Save to Files", style: .secondary) {
                            handleSaveToFiles()
                        }
                        .disabled(isExporting)
                        
                        GlassButton("Share", style: .secondary) {
                            handleShare()
                        }
                        .disabled(isExporting)
                    }
                    .padding(.horizontal, StyleGuide.Spacing.md)
                    .padding(.bottom, StyleGuide.Spacing.xl)
                }
                .padding(.horizontal, StyleGuide.Spacing.md)
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Export Complete")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                #if DEBUG
                if ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PLAYGROUNDS"] == "1" { return }
                #endif
                generateExport()
            }
            .sheet(isPresented: $showEmailComposer) {
                if MFMailComposeViewController.canSendMail(),
                   let jsonURL = jsonFileURL,
                   let mailComposer = EmailComposer.shared.composeEmail(
                    attachments: [jsonURL] + (qrFileURL.map { [$0] } ?? []),
                    for: request
                   ) {
                    MailComposerView(composer: mailComposer)
                } else {
                    FallbackMailUnavailableView()
                }
            }
            .sheet(isPresented: $showShareSheet) {
                ShareSheet(activityItems: [jsonFileURL, qrFileURL].compactMap { $0 })
            }
        }
        .modifier(NavigationGlassBackgroundIfAvailable())
    }
    
    // MARK: - Actions
    
    private func generateExport() {
        isExporting = true
        
        Task {
            do {
                // Export JSON
                let jsonData = try LeaveExporter.shared.exportToJSON(request)
                let jsonURL = try LeaveExporter.shared.saveToTemporaryFile(jsonData)
                await MainActor.run { self.jsonFileURL = jsonURL }
                
                // Generate QR code
                let generatedQRImage = QRGenerator.shared.generateQRCode(fromJSONData: jsonData)
                if let qrImage = generatedQRImage {
                    let qrURL = try QRGenerator.shared.saveQRCodeToFile(qrImage)
                    await MainActor.run {
                        self.qrImage = qrImage
                        self.qrFileURL = qrURL
                    }
                }
                
                await MainActor.run {
                    isExporting = false
                }
            } catch {
                print("Export failed: \(error)")
                await MainActor.run {
                    isExporting = false
                }
            }
        }
    }
    
    private func handleEmail() {
        guard jsonFileURL != nil else { return }
        showEmailComposer = true
    }
    
    private func handleSaveToFiles() {
        // Use system share sheet to save to Files app
        showShareSheet = true
    }
    
    private func handleShare() {
        showShareSheet = true
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(StyleGuide.Typography.body)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            Spacer()
            Text(value)
                .font(StyleGuide.Typography.bodyBold)
        }
    }
}

// MARK: - Mail Composer View

struct MailComposerView: UIViewControllerRepresentable {
    let composer: MFMailComposeViewController
    
    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        return composer
    }
    
    func updateUIViewController(_ uiViewController: MFMailComposeViewController, context: Context) {}
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        if let popover = controller.popoverPresentationController {
            popover.sourceView = UIApplication.shared.connectedScenes
                .compactMap { ($0 as? UIWindowScene)?.keyWindow }
                .first
        }
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Additional Views & Modifiers

private struct NavigationGlassBackgroundIfAvailable: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.navigationBarGlassBackground()
        } else {
            content
        }
    }
}

private struct FallbackMailUnavailableView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            Image(systemName: "envelope.badge")
                .font(.system(size: 60))
                .foregroundColor(StyleGuide.Colors.warning)
            Text("Mail services are not available on this device.")
                .font(StyleGuide.Typography.title3)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button("Dismiss") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

// MARK: - Preview

#Preview("ConfirmationView") {
    ConfirmationView(
        request: LeaveRequest(
            type: .MEDICAL,
            startDate: Date(),
            endDate: Calendar.current.date(byAdding: .day, value: 5, to: Date()) ?? Date(),
            reason: "Medical treatment required"
        )
    )
}
