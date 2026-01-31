import SwiftUI
import UniformTypeIdentifiers

struct EditLeaveView: View {
    let leave: LeaveRequest
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = EditLeaveViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    typeSection
                    dateSection
                    
                    if viewModel.isHalfDayEligible {
                        halfDayToggle
                    }
                    
                    reasonSection
                    
                    if leave.type.uppercased() == "SPECIAL_DISABILITY" || viewModel.leaveType.uppercased() == "SPECIAL_DISABILITY" {
                        incidentDateSection
                    }
                    
                    if leave.type.uppercased() == "MEDICAL" {
                        certificateSection
                    }
                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .padding(.horizontal)
                    }
                    submitButton
                }
                .padding(.top, 20)
            }
            .navigationTitle("Edit & Resubmit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
            .onAppear {
                viewModel.configure(with: leave)
            }
        }
    }

    private var typeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Leave Type")
                .font(.headline)
            Text(LeaveType(rawValue: leave.type)?.displayName ?? leave.type)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal)
    }

    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Date Range")
                .font(.headline)
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("From")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    DatePicker(
                        "",
                        selection: $viewModel.startDate,
                        in: Date()...,
                        displayedComponents: .date
                    )
                    .labelsHidden()
                    .colorScheme(.dark)
                    .padding()
                    .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("To")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    DatePicker(
                        "",
                        selection: $viewModel.endDate,
                        in: viewModel.startDate...,
                        displayedComponents: .date
                    )
                    .labelsHidden()
                    .colorScheme(.dark)
                    .padding()
                    .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .padding(.horizontal)
    }

    private var reasonSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Reason")
                .font(.headline)
            TextEditor(text: $viewModel.reason)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 100)
                .padding()
                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 16))
            Text("\(viewModel.reason.count)/500")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal)
    }

    private var halfDayToggle: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Half Day")
                        .font(.headline)
                    Text("Apply for half a day only")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Toggle("", isOn: $viewModel.isHalfDay)
                    .labelsHidden()
                    .tint(.accentColor)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
            
            if viewModel.isHalfDay {
                HStack(spacing: 12) {
                    HalfDayOption(
                        title: "First Half",
                        subtitle: "Morning",
                        isSelected: viewModel.halfDayPeriod == "AM"
                    ) {
                        viewModel.halfDayPeriod = "AM"
                    }
                    
                    HalfDayOption(
                        title: "Second Half",
                        subtitle: "Afternoon",
                        isSelected: viewModel.halfDayPeriod == "PM"
                    ) {
                        viewModel.halfDayPeriod = "PM"
                    }
                }
            }
        }
        .padding(.horizontal)
    }

    private var incidentDateSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Incident Date")
                .font(.headline)
            
            DatePicker(
                "",
                selection: Binding(
                    get: { viewModel.incidentDate ?? viewModel.startDate },
                    set: { viewModel.incidentDate = $0 }
                ),
                in: ...Date(),
                displayedComponents: .date
            )
            .labelsHidden()
            .colorScheme(.dark)
            .padding()
            .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
            
            Text("Incident must be within 3 months before the leave start date.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
    }

    private var certificateSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Medical Certificate")
                .font(.headline)
            if leave.certificateUrl != nil && viewModel.selectedFileName == nil {
                Text("Existing certificate on file")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Button {
                viewModel.showFileImporter = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "paperclip")
                    Text(viewModel.selectedFileName ?? "Upload file")
                    Spacer()
                }
                .padding()
                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .fileImporter(
                isPresented: $viewModel.showFileImporter,
                allowedContentTypes: [.pdf, .image],
                allowsMultipleSelection: false
            ) { result in
                viewModel.handleFileSelection(result)
            }

            if viewModel.requiresCertificate && !viewModel.hasCertificate {
                Text("Medical certificate is required for sick leave over 3 days.")
                    .font(.caption2)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal)
    }

    private var submitButton: some View {
        Button(action: submit) {
            HStack {
                if viewModel.isSubmitting {
                    ProgressView()
                        .tint(.accentColor)
                } else {
                    Image(systemName: "paperplane.fill")
                    Text("Resubmit Request")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.borderedProminent)
        .tint(.green)
        .disabled(!viewModel.isValid || viewModel.isSubmitting)
        .padding(.horizontal)
    }

    private func submit() {
        Task {
            let success = await viewModel.resubmit(leaveId: leave.id, type: leave.type)
            if success {
                dismiss()
            }
        }
    }
}

@MainActor
final class EditLeaveViewModel: ObservableObject {
    @Published var startDate = Date()
    @Published var endDate = Date()
    @Published var reason = ""
    @Published var isSubmitting = false
    @Published var error: String?
    @Published var selectedFileURL: URL?
    @Published var selectedFileName: String?
    @Published var showFileImporter = false
    @Published var existingCertificateUrl: String?
    @Published var leaveType: String = ""
    @Published var isHalfDay = false
    @Published var halfDayPeriod = "AM"
    @Published var incidentDate: Date?
    private var initialIncidentDate: Date?
    private var initialIsHalfDay = false

    private let leaveService = LeaveService.shared

    func configure(with leave: LeaveRequest) {
        if let start = ISO8601DateFormatter().date(from: leave.startDate) ?? dateOnly(leave.startDate) {
            startDate = start
        }
        if let end = ISO8601DateFormatter().date(from: leave.endDate) ?? dateOnly(leave.endDate) {
            endDate = end
        }
        reason = leave.reason ?? ""
        initialStartDate = startDate
        initialEndDate = endDate
        initialReason = reason
        existingCertificateUrl = leave.certificateUrl
        leaveType = leave.type
        
        // Load half-day info
        isHalfDay = leave.isHalfDay ?? false
        initialIsHalfDay = isHalfDay
        if let period = leave.halfDayPeriod {
            halfDayPeriod = period
        }
        
        // Incident Date parsing? (Not typically returned in standard detail but maybe extended)
        // For now, if editing special disability, defaulting incident date might be needed if missing
        if leaveType == "SPECIAL_DISABILITY" {
             // If backend sends it, parse it differently or assume near start date
             // Currently model doesn't store incidentDate explicitly in LeaveRequestDetail?
             // Checking model... LeaveRequest has no incidentDate field in existing swift model?
             // Assuming not available to pre-fill from detail unless added. Feature limitation?
             // Let's safe default to nil or startDate if required.
        }
    }
    
    var isHalfDayEligible: Bool {
        let allowed = leaveType == "EARNED" || leaveType == "CASUAL"
        return !isMultipleDays && allowed
    }
    
    var isMultipleDays: Bool {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: startDate, to: endDate)
        return (components.day ?? 0) > 0
    }

    var requiresCertificate: Bool {
        guard leaveType.uppercased() == "MEDICAL" else { return false }
        let days = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0
        return days + 1 > 3
    }

    var hasCertificate: Bool {
        selectedFileURL != nil || existingCertificateUrl != nil
    }

    var isValid: Bool {
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasChanges = startDate != initialStartDate ||
            endDate != initialEndDate ||
            trimmedReason != initialReason.trimmingCharacters(in: .whitespacesAndNewlines) ||
            selectedFileURL != nil
        return hasChanges && trimmedReason.count >= 10 && trimmedReason.count <= 500 && startDate <= endDate && (!requiresCertificate || hasCertificate)
    }

    func handleFileSelection(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            selectedFileURL = url
            selectedFileName = url.lastPathComponent
        case .failure(let error):
            self.error = error.localizedDescription
        }
    }

    func resubmit(leaveId: Int, type: String) async -> Bool {
        guard isValid else { return false }
        isSubmitting = true
        error = nil

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        // Format incident date if present
        let incidentDateStr = incidentDate.map { formatter.string(from: $0) }

        let request = ApplyLeaveRequest(
            type: type,
            startDate: formatter.string(from: startDate),
            endDate: formatter.string(from: endDate),
            reason: reason,
            needsCertificate: requiresCertificate ? true : nil,
            incidentDate: incidentDateStr,
            isHalfDay: isHalfDay ? true : nil,
            halfDayPeriod: isHalfDay ? halfDayPeriod : nil
        )

        do {
            let file = try makeMultipartFile()
            _ = try await leaveService.resubmitLeave(leaveId: leaveId, request: request, file: file)
            isSubmitting = false
            return true
        } catch {
            isSubmitting = false
            self.error = error.localizedDescription
            return false
        }
    }

    private func makeMultipartFile() throws -> APIClient.MultipartFile? {
        guard let url = selectedFileURL else { return nil }
        let needsAccess = url.startAccessingSecurityScopedResource()
        defer {
            if needsAccess {
                url.stopAccessingSecurityScopedResource()
            }
        }
        let data = try Data(contentsOf: url)
        let mimeType = UTType(filenameExtension: url.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        return APIClient.MultipartFile(
            fieldName: "certificate",
            fileName: url.lastPathComponent,
            mimeType: mimeType,
            data: data
        )
    }

    private func dateOnly(_ dateString: String) -> Date? {
        if dateString.count >= 10 {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.date(from: String(dateString.prefix(10)))
        }
        return nil
    }
}
