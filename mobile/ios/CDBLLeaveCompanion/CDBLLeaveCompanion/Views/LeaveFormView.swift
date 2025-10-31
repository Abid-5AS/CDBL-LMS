//
//  LeaveFormView.swift
//  CDBLLeaveCompanion
//
//  Redesigned leave application form - information-dense, web-aligned
//

import SwiftUI
import CoreData
import UniformTypeIdentifiers

struct LeaveFormView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.dismiss) var dismiss
    
    // Navigation
    @State private var showHistory = false
    
    // Form state
    @State private var selectedType: LeaveType = .CASUAL
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var reason = ""
    @State private var selectedFile: URL?
    @State private var showFilePicker = false
    
    // Balance state
    @State private var balances: LeaveBalance?
    @State private var isLoadingBalances = false
    @State private var balanceError: Error?
    
    // Validation
    @State private var errors: [String: String] = [:]
    @State private var isFormValid = false
    
    // UI state
    @State private var isSubmitting = false
    @State private var showConfirmation = false
    @State private var exportedRequest: LeaveRequest?
    
    // Reason templates
    private let reasonTemplates = [
        "Family event",
        "Medical follow-up",
        "Personal errand",
        "Meeting family obligations"
    ]
    
    // Computed properties
    private var workingDays: Int {
        LeaveRequest.calculateWorkingDays(from: startDate, to: endDate)
    }
    
    private var requiresCertificate: Bool {
        selectedType == .MEDICAL && workingDays > 3
    }
    
    private var minimumSelectableStartDate: Date {
        selectedType.minimumSelectableDate(referenceDate: Date())
    }
    
    private var daysUntilStart: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: calendar.startOfDay(for: Date()), to: calendar.startOfDay(for: startDate))
        return components.day ?? 0
    }
    
    private var trimmedReasonCount: Int {
        reason.trimmingCharacters(in: .whitespacesAndNewlines).count
    }
    
    private var currentBalance: Int? {
        guard let balances = balances else { return nil }
        return BalanceService.balance(for: selectedType, in: balances)
    }
    
    private var remainingBalance: Int? {
        guard let current = currentBalance else { return nil }
        return max(0, current - workingDays)
    }
    
    private var policyWarnings: [String] {
        var warnings: [String] = []
        
        if let maxDays = selectedType.maximumConsecutiveDays, workingDays > maxDays {
            warnings.append("\(selectedType.displayName) cannot exceed \(maxDays) consecutive days.")
        }
        
        if selectedType == .EARNED && daysUntilStart < 15 {
            warnings.append("Earned Leave requires 15 days' advance notice.")
        }
        
        if requiresCertificate && selectedFile == nil {
            warnings.append("Attach medical certificate for Sick Leave over 3 days.")
        }
        
        if let current = currentBalance, remainingBalance ?? 0 < 0 {
            warnings.append("Insufficient balance for this leave type.")
        }
        
        return warnings
    }
    
    private var primaryCTALabel: String {
        if !isFormValid {
            return "Save Draft"
        }
        return "Submit Application"
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Single scrollable card with subsections
                    VStack(spacing: StyleGuide.Spacing.lg) {
                        // Leave Details Section
                        sectionHeader("Leave Details")
                        
                        // Leave Type with inline policy chips
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                            GlassFormField(label: "Leave Type", isRequired: true, errorMessage: errors["type"]) {
                                Picker("Leave Type", selection: $selectedType) {
                                    ForEach(LeaveType.primaryTypes) { type in
                                        Text(type.displayName).tag(type)
                                    }
                                }
                                .pickerStyle(.menu)
                                .onChange(of: selectedType) { _ in
                                    validateForm()
                                    loadBalances()
                                    if selectedType != .MEDICAL {
                                        selectedFile = nil
                                    }
                                }
                            }
                            
                            // Policy chips inline
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: StyleGuide.Spacing.sm) {
                                    ForEach(selectedType.policyTips, id: \.self) { tip in
                                        PolicyChip(tip, icon: iconForTip(tip))
                                    }
                                }
                                .padding(.horizontal, StyleGuide.Spacing.md)
                            }
                            .padding(.top, -StyleGuide.Spacing.xs)
                        }
                        
                        Divider()
                            .padding(.vertical, StyleGuide.Spacing.xs)
                        
                        // Modern Date Range Picker
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                            HStack {
                                Text("Date Range")
                                    .font(StyleGuide.Typography.callout)
                                    .foregroundColor(StyleGuide.Colors.foreground)
                                Text("*")
                                    .foregroundColor(StyleGuide.Colors.error)
                                
                                Spacer()
                                
                                if let startError = errors["startDate"] {
                                    Text(startError)
                                        .font(StyleGuide.Typography.caption)
                                        .foregroundColor(StyleGuide.Colors.error)
                                } else if let endError = errors["endDate"] {
                                    Text(endError)
                                        .font(StyleGuide.Typography.caption)
                                        .foregroundColor(StyleGuide.Colors.error)
                                }
                            }
                            
                            DateRangePicker(
                                startDate: $startDate,
                                endDate: $endDate,
                                minimumDate: minimumSelectableStartDate,
                                maximumDate: .distantFuture
                            )
                            
                            // Helper text
                            Text(helperTextForStartDate)
                                .font(StyleGuide.Typography.caption2)
                                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                                .padding(.top, -StyleGuide.Spacing.xs)
                        }
                        
                        Divider()
                            .padding(.vertical, StyleGuide.Spacing.xs)
                        
                        // Reason with templates and character count
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                            GlassFormField(label: "Reason", isRequired: true, errorMessage: errors["reason"]) {
                                VStack(alignment: .leading, spacing: StyleGuide.Spacing.xs) {
                                    TextEditor(text: $reason)
                                        .frame(minHeight: 100)
                                        .scrollContentBackground(.hidden)
                                        .foregroundColor(StyleGuide.Colors.foreground)
                                        .onChange(of: reason) { _ in
                                            validateForm()
                                        }
                                    
                                    // Quick templates
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(spacing: StyleGuide.Spacing.xs) {
                                            ForEach(reasonTemplates, id: \.self) { template in
                                                Button(action: {
                                                    reason = template
                                                    validateForm()
                                                    HapticFeedback.selection()
                                                }) {
                                                    Text(template)
                                                        .font(StyleGuide.Typography.caption2)
                                                        .padding(.horizontal, StyleGuide.Spacing.sm)
                                                        .padding(.vertical, StyleGuide.Spacing.xs)
                                                        .background(.ultraThinMaterial)
                                                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                                                        .cornerRadius(StyleGuide.CornerRadius.small)
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Character count
                                    HStack {
                                        Spacer()
                                        Text("\(trimmedReasonCount) / 10 min characters")
                                            .font(StyleGuide.Typography.caption2)
                                            .foregroundColor(
                                                trimmedReasonCount >= 10
                                                    ? StyleGuide.Colors.success
                                                    : StyleGuide.Colors.foregroundTertiary
                                            )
                                    }
                                }
                            }
                        }
                        
                        Divider()
                            .padding(.vertical, StyleGuide.Spacing.xs)
                        
                        // Attachment - always shown
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.xs) {
                            HStack {
                                Text("Medical Certificate")
                                    .font(StyleGuide.Typography.callout)
                                    .foregroundColor(StyleGuide.Colors.foreground)
                                if requiresCertificate {
                                    Text("*")
                                        .foregroundColor(StyleGuide.Colors.error)
                                }
                            }
                            
                            if let fileURL = selectedFile {
                                // File selected state
                                HStack(spacing: StyleGuide.Spacing.sm) {
                                    Image(systemName: "doc.fill")
                                        .foregroundColor(StyleGuide.Colors.accentGradientStart)
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(fileURL.lastPathComponent)
                                            .font(StyleGuide.Typography.body)
                                            .lineLimit(1)
                                        
                                        if let fileSize = fileSize(for: fileURL) {
                                            Text(fileSize)
                                                .font(StyleGuide.Typography.caption2)
                                                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                                        }
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        selectedFile = nil
                                        validateForm()
                                        HapticFeedback.selection()
                                    }) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(StyleGuide.Colors.error)
                                    }
                                }
                                .padding(StyleGuide.Spacing.sm)
                                .background(.ultraThinMaterial)
                                .background(StyleGuide.Colors.fieldBackground)
                                .cornerRadius(StyleGuide.CornerRadius.small)
                            } else {
                                // No file state
                                Button(action: {
                                    showFilePicker = true
                                }) {
                                    HStack {
                                        Image(systemName: "paperclip")
                                        Text("Attach File")
                                            .font(StyleGuide.Typography.body)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, StyleGuide.Spacing.sm)
                                    .background(.ultraThinMaterial)
                                    .background(StyleGuide.Colors.fieldBackground)
                                    .foregroundColor(StyleGuide.Colors.foreground)
                                    .cornerRadius(StyleGuide.CornerRadius.small)
                                }
                            }
                            
                            // File type hints
                            Text("Accepted: PDF, JPG, PNG • Max size 5 MB")
                                .font(StyleGuide.Typography.caption2)
                                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                            
                            if let error = errors["certificate"] {
                                HStack(spacing: 4) {
                                    Image(systemName: "exclamationmark.circle.fill")
                                        .font(.caption)
                                        .foregroundColor(StyleGuide.Colors.error)
                                    Text(error)
                                        .font(StyleGuide.Typography.caption)
                                        .foregroundColor(StyleGuide.Colors.error)
                                }
                            }
                        }
                        
                        // Warning banners
                        if !policyWarnings.isEmpty {
                            VStack(alignment: .leading, spacing: StyleGuide.Spacing.xs) {
                                ForEach(policyWarnings, id: \.self) { warning in
                                    HStack(alignment: .top, spacing: StyleGuide.Spacing.sm) {
                                        Image(systemName: "exclamationmark.triangle.fill")
                                            .foregroundColor(StyleGuide.Colors.warning)
                                            .font(.caption)
                                        Text(warning)
                                            .font(StyleGuide.Typography.caption)
                                            .foregroundColor(StyleGuide.Colors.warning)
                                    }
                                    .padding(StyleGuide.Spacing.sm)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(
                                        RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                                            .fill(StyleGuide.Colors.warning.opacity(0.12))
                                    )
                                }
                            }
                        }
                        
                        Divider()
                            .padding(.vertical, StyleGuide.Spacing.xs)
                        
                        // Summary Section
                        sectionHeader("Summary")
                        
                        VStack(spacing: StyleGuide.Spacing.sm) {
                            summaryRow(label: "Leave Type", value: selectedType.displayName)
                            summaryRow(label: "Duration", value: "\(workingDays) day(s)")
                            
                            if let startDate = Optional(startDate), let endDate = Optional(endDate) {
                                summaryRow(
                                    label: "Date Range",
                                    value: "\(formattedDate(startDate)) → \(formattedDate(endDate))"
                                )
                            }
                            
                            // Balance badges
                            if let current = currentBalance {
                                HStack {
                                    summaryRow(
                                        label: "Current Balance",
                                        value: "\(current) day(s)"
                                    )
                                    
                                    if let remaining = remainingBalance {
                                        summaryRow(
                                            label: "Remaining",
                                            value: "\(remaining) day(s)",
                                            valueColor: remaining < 0 ? StyleGuide.Colors.error : StyleGuide.Colors.success
                                        )
                                    }
                                }
                            }
                            
                            summaryRow(
                                label: "Certificate",
                                value: requiresCertificate
                                    ? (selectedFile != nil ? "Attached" : "Required")
                                    : "Not required"
                            )
                        }
                        
                        // Submit button
                        Button(action: handleSubmit) {
                            Text(primaryCTALabel)
                                .font(StyleGuide.Typography.bodyBold)
                                .foregroundColor(isFormValid ? StyleGuide.Colors.primaryForeground : StyleGuide.Colors.foregroundSecondary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 44)
                                .glassButton(style: isFormValid ? .primary : .secondary)
                        }
                        .disabled(isSubmitting || !isFormValid)
                        .padding(.top, StyleGuide.Spacing.md)
                    }
                    .padding(StyleGuide.Spacing.md)
                    .glassCard()
                    .padding(.horizontal, StyleGuide.Spacing.md)
                    .padding(.vertical, StyleGuide.Spacing.sm)
                }
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Apply Leave")
            .navigationBarGlassBackground()
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: {
                        showHistory = true
                    }) {
                        Label("History", systemImage: "clock.fill")
                    }
                }
            }
            .sheet(isPresented: $showFilePicker) {
                DocumentPicker(selectedURL: $selectedFile)
            }
            .sheet(isPresented: $showConfirmation) {
                if let request = exportedRequest {
                    ConfirmationView(request: request)
                }
            }
            .navigationDestination(isPresented: $showHistory) {
                HistoryView()
            }
            .onAppear {
                adjustDatesForSelectedType()
                loadBalances()
                validateForm()
            }
            .onChange(of: startDate) { _ in
                adjustDatesForSelectedType()
                validateForm()
            }
            .onChange(of: endDate) { _ in
                validateForm()
            }
            .onChange(of: selectedFile) { _ in
                validateForm()
            }
        }
    }
    
    // MARK: - Helpers
    
    @ViewBuilder
    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(StyleGuide.Typography.title3)
                .foregroundColor(StyleGuide.Colors.foreground)
            Spacer()
        }
        .padding(.bottom, StyleGuide.Spacing.xs)
    }
    
    @ViewBuilder
    private func summaryRow(label: String, value: String, valueColor: Color? = nil) -> some View {
        HStack {
            Text(label)
                .font(StyleGuide.Typography.body)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            Spacer()
            Text(value)
                .font(StyleGuide.Typography.bodyBold)
                .foregroundColor(valueColor ?? StyleGuide.Colors.foreground)
        }
    }
    
    private var helperTextForStartDate: String {
        if selectedType == .EARNED {
            return "Earliest start: \(formattedDate(minimumSelectableStartDate)) • 15 days advance notice required"
        } else if selectedType == .MEDICAL {
            return "Earliest start: \(formattedDate(minimumSelectableStartDate)) • Backdating allowed up to 30 days"
        } else {
            return "Earliest start: \(formattedDate(minimumSelectableStartDate))"
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        date.formatted(.dateTime.month(.abbreviated).day().year())
    }
    
    private func iconForTip(_ tip: String) -> String {
        if tip.contains("days") || tip.contains("advance") {
            return "clock.fill"
        } else if tip.contains("balance") {
            return "checkmark.shield.fill"
        } else if tip.contains("certificate") {
            return "doc.text.fill"
        } else {
            return "info.circle.fill"
        }
    }
    
    private func fileSize(for url: URL) -> String? {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              let size = attributes[.size] as? Int64 else {
            return nil
        }
        
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
    
    private func adjustDatesForSelectedType() {
        let minimum = minimumSelectableStartDate
        if startDate < minimum {
            startDate = minimum
        }
        if endDate < startDate {
            endDate = startDate
        }
    }
    
    private func loadBalances() {
        Task {
            isLoadingBalances = true
            do {
                balances = try await BalanceService.fetchBalances()
                balanceError = nil
                validateForm()
            } catch {
                balanceError = error
                // Balance errors are non-blocking, so we continue without balance data
            }
            isLoadingBalances = false
        }
    }
    
    private func validateForm() {
        errors.removeAll()
        
        // Date validation
        if startDate > endDate {
            errors["endDate"] = "End date must be on or after start date"
        }
        
        // Weekend validation
        if LeaveRequest.isWeekend(startDate) {
            errors["startDate"] = "Leave cannot start on a weekend (Friday or Saturday)"
        }
        
        if LeaveRequest.isWeekend(endDate) {
            errors["endDate"] = "Leave cannot end on a weekend (Friday or Saturday)"
        }
        
        if workingDays <= 0 {
            errors["endDate"] = "Invalid date range"
        }
        
        // Reason validation
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedReason.isEmpty {
            errors["reason"] = "Reason is required"
        } else if trimmedReason.count < 10 {
            errors["reason"] = "Reason must be at least 10 characters"
        }
        
        // Type-specific validation
        if let maxDays = selectedType.maximumConsecutiveDays, workingDays > maxDays {
            errors["general"] = "\(selectedType.displayName) cannot exceed \(maxDays) consecutive day(s)"
        }
        
        if requiresCertificate && selectedFile == nil {
            errors["certificate"] = "Medical certificate is required for sick leave over 3 days"
        }
        
        // Balance validation (if available)
        if let current = currentBalance, workingDays > current {
            errors["general"] = "Insufficient balance for this leave type"
        }
        
        // Advance notice validation
        if selectedType == .EARNED && daysUntilStart < 15 {
            errors["startDate"] = "Earned Leave requires 15 days' advance notice"
        }
        
        isFormValid = errors.isEmpty && !trimmedReason.isEmpty && trimmedReason.count >= 10 && workingDays > 0 && (!requiresCertificate || selectedFile != nil)
    }
    
    // MARK: - Actions
    
    private func handleSubmit() {
        HapticFeedback.impact(style: .medium)
        
        validateForm()
        
        if !isFormValid {
            HapticFeedback.error()
            return
        }
        
        // Create leave request
        let request = LeaveRequest(
            type: selectedType,
            startDate: startDate,
            endDate: endDate,
            reason: reason.trimmingCharacters(in: .whitespacesAndNewlines),
            needsCertificate: requiresCertificate
        )
        
        // Save to Core Data
        saveToCoreData(request)
        
        // Export and show confirmation
        HapticFeedback.success()
        isSubmitting = true
        exportedRequest = request
        showConfirmation = true
        isSubmitting = false
        
        // Clear form
        clearForm()
    }
    
    private func clearForm() {
        reason = ""
        selectedFile = nil
        startDate = Date()
        endDate = Date()
        errors.removeAll()
        isFormValid = false
    }
    
    private func saveToCoreData(_ request: LeaveRequest) {
        let entity = LeaveEntity(context: viewContext)
        entity.id = UUID()
        entity.type = request.type.rawValue
        entity.startDate = request.startDate
        entity.endDate = request.endDate
        entity.reason = request.reason
        entity.needsCertificate = request.needsCertificate
        entity.status = request.status.rawValue
        entity.workingDays = Int16(request.workingDays)
        entity.createdAt = Date()
        entity.exported = false
        
        if let fileURL = selectedFile,
           let fileData = try? Data(contentsOf: fileURL) {
            entity.certificateData = fileData
        }
        
        do {
            try viewContext.save()
        } catch {
            print("Failed to save to Core Data: \(error)")
        }
    }
}

// MARK: - Document Picker

struct DocumentPicker: UIViewControllerRepresentable {
    @Binding var selectedURL: URL?
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf, .image], asCopy: true)
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = false
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker
        
        init(_ parent: DocumentPicker) {
            self.parent = parent
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.selectedURL = urls.first
            parent.dismiss()
        }
        
        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            parent.dismiss()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct LeaveFormView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LeaveFormView()
                .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
                .previewDisplayName("iPhone 14")
            
            LeaveFormView()
                .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
                .preferredColorScheme(.dark)
                .previewDisplayName("iPhone 14 Dark")
            
            LeaveFormView()
                .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
                .previewDevice("iPhone 15 Pro")
                .previewDisplayName("iPhone 15 Pro")
        }
    }
}
#endif
