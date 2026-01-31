//
//  ApplyLeaveView.swift
//  CDBLLeaveManager
//
//  Apply leave form with system materials.
//

import SwiftUI
import Combine
import UniformTypeIdentifiers

struct ApplyLeaveView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = ApplyLeaveViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Leave Type Picker
                        leaveTypePicker
                        
                        // Date Selection
                        dateSection
                        
                        // Half Day Option
                        if viewModel.isHalfDayEligible {
                            halfDayToggle
                        }
                        
                        // Reason
                        reasonSection

                        // Incident Date (Special Disability Leave)
                        if viewModel.selectedType == .specialDisability {
                            incidentDateSection
                        }

                        // Supporting Documents
                        documentsSection
                        
                        // Balance Info
                        if let balance = viewModel.selectedTypeBalance {
                            balanceInfo(balance)
                        }
                        
                        // Error
                        if let error = viewModel.error {
                            HStack(spacing: 12) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundStyle(.red)
                                Text(error)
                                    .font(.subheadline)
                                    .foregroundStyle(.primary)
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.15))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .strokeBorder(Color.red.opacity(0.3), lineWidth: 1)
                            )
                            .padding(.horizontal)
                        }
                        
                        // Submit Button
                        submitButton
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Apply Leave")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: viewModel.endDate) { _ in
                if viewModel.isMultipleDays {
                    viewModel.isHalfDay = false
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }
    
    // MARK: - Leave Type Picker
    
    private var leaveTypePicker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Leave Type")
                .font(.headline)
                .foregroundStyle(.primary)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(LeaveType.allCases, id: \.self) { type in
                    LeaveTypeOption(
                        type: type,
                        isSelected: viewModel.selectedType == type
                    ) {
                        viewModel.selectType(type)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Date Section
    
    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Date Range")
                .font(.headline)
                .foregroundStyle(.primary)
            
            HStack(spacing: 16) {
                // Start Date
                VStack(alignment: .leading, spacing: 6) {
                    Text("From")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    DatePicker(
                        "",
                        selection: $viewModel.startDate,
                        in: viewModel.minSelectableDate...,
                        displayedComponents: .date
                    )
                    .labelsHidden()
                    .colorScheme(.dark)
                    .padding()
                    .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
                }
                
                // End Date
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
            
            // Total Days
            HStack {
                Image(systemName: "calendar.badge.clock")
                Text("Total: \(viewModel.totalDays) day(s)")
                    .font(.subheadline)
            }
            .foregroundStyle(Color.accentColor)
        }
        .padding(.horizontal)
    }
    
    // MARK: - Half Day Toggle
    
    private var halfDayToggle: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Half Day")
                        .font(.headline)
                        .foregroundStyle(.primary)
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
    
    // MARK: - Reason Section
    
    private var reasonSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Reason")
                .font(.headline)
                .foregroundStyle(.primary)
            
            TextEditor(text: $viewModel.reason)
                .scrollContentBackground(.hidden)
                .foregroundStyle(.primary)
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

    // MARK: - Incident Date

    private var incidentDateSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Incident Date")
                .font(.headline)
                .foregroundStyle(.primary)

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

    // MARK: - Documents Section

    private var documentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Supporting Documents")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                if viewModel.requiresCertificate {
                    Text("Required")
                        .font(.caption)
                        .foregroundStyle(.red)
                } else {
                    Text("Optional")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Button {
                viewModel.showFileImporter = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "paperclip")
                        .foregroundStyle(.secondary)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(viewModel.selectedFileName ?? "Add document")
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                        Text(viewModel.selectedFileName == nil ? "PDF or image" : "Tap to change file")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if viewModel.selectedFileName != nil {
                        Button {
                            viewModel.clearSelectedFile()
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
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
        }
        .padding(.horizontal)
    }
    
    // MARK: - Balance Info
    
    private func balanceInfo(_ balance: Double) -> some View {
        HStack {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(Color.accentColor)
            
            Text("Available balance: \(Int(balance)) days")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            Spacer()
        }
        .padding()
        .background(Color.accentColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color.accentColor.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal)
    }
    
    // MARK: - Submit Button
    
    private var submitButton: some View {
        Button(action: submit) {
            HStack {
                if viewModel.isSubmitting {
                    ProgressView()
                        .tint(.accentColor)
                } else {
                    Image(systemName: "paperplane.fill")
                    Text("Submit Request")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.borderedProminent)
        .tint(.green)
        .disabled(viewModel.isSubmitting || !viewModel.isValid)
        .padding(.horizontal)
    }
    
    private func submit() {
        Task {
            let success = await viewModel.submitLeave()
            if success {
                dismiss()
            }
        }
    }
}

// MARK: - Leave Type Option

struct LeaveTypeOption: View {
    let type: LeaveType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: type.icon)
                    .foregroundStyle(type.color)
                
                Text(type.displayName)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.accentColor)
                }
            }
            .padding()
            .surfaceBackground(
                isSelected ? .regular : .clear,
                in: RoundedRectangle(cornerRadius: 12)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isSelected ? Color.accentColor : Color.white.opacity(0.2),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
    }
}

// MARK: - Half Day Option

struct HalfDayOption: View {
    let title: String
    let subtitle: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .surfaceBackground(
                isSelected ? .regular : .clear,
                in: RoundedRectangle(cornerRadius: 12)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isSelected ? Color.accentColor : Color.white.opacity(0.2),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .foregroundStyle(.primary)
    }
}

// MARK: - ViewModel

@MainActor
final class ApplyLeaveViewModel: ObservableObject {
    @Published var selectedType: LeaveType = .casual
    @Published var startDate = Date()
    @Published var endDate = Date()
    @Published var reason = ""
    @Published var isHalfDay = false
    @Published var halfDayPeriod = "AM"
    @Published var isSubmitting = false
    @Published var error: String?
    @Published var balance: DashboardLeaveBalance?
    @Published var incidentDate: Date?
    @Published var selectedFileURL: URL?
    @Published var selectedFileName: String?
    @Published var showFileImporter = false
    @Published var holidays: [Holiday] = []
    
    private let leaveService = LeaveService.shared
    private let dashboardService = DashboardService.shared
    
    var totalDays: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: startDate, to: endDate)
        let days = (components.day ?? 0) + 1
        return isHalfDay ? max(1, days) : days
    }
    
    var isMultipleDays: Bool {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: startDate, to: endDate)
        return (components.day ?? 0) > 0
    }

    var isHalfDayEligible: Bool {
        let allowed = selectedType == .earned || selectedType == .casual
        return !isMultipleDays && allowed
    }

    var minSelectableDate: Date {
        if selectedType == .medical || selectedType == .earned || selectedType == .quarantine {
            return Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        }
        return Date()
    }

    var requiresCertificate: Bool {
        selectedType == .medical && totalDays > 3
    }
    
    var selectedTypeBalance: Double? {
        guard let balance = balance else { return nil }
        switch selectedType {
        case .earned: return balance.EARNED
        case .casual: return balance.CASUAL
        case .medical: return balance.MEDICAL
        case .compensatory: return balance.COMPENSATORY ?? 0
        case .maternity: return balance.MATERNITY ?? 0
        case .paternity: return balance.PATERNITY ?? 0
        case .extraWithPay: return balance.EXTRAWITHPAY ?? 0
        case .extraWithoutPay: return balance.EXTRAWITHOUTPAY ?? 0
        case .study: return balance.STUDY ?? 0
        case .specialDisability: return balance.SPECIAL_DISABILITY ?? 0
        case .quarantine: return balance.QUARANTINE ?? 0
        case .special: return balance.SPECIAL ?? 0
        }
    }
    
    var isValid: Bool {
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasReason = trimmedReason.count >= 10 && trimmedReason.count <= 500
        let datesOk = startDate <= endDate && startDate >= minSelectableDate
        let fileOk = !requiresCertificate || selectedFileURL != nil
        return hasReason && datesOk && fileOk
    }
    
    init() {
        Task {
            await loadBalance()
            await loadHolidays()
        }
    }

    func selectType(_ type: LeaveType) {
        selectedType = type
        isHalfDay = false
        halfDayPeriod = "AM"
        clearSelectedFile()
        if selectedType != .specialDisability {
            incidentDate = nil
        }
        if startDate < minSelectableDate {
            startDate = minSelectableDate
            endDate = minSelectableDate
        }
        error = nil
    }
    
    func loadBalance() async {
        do {
            balance = try await leaveService.getBalance()
        } catch {
            print("Failed to load balance: \(error)")
        }
    }

    func loadHolidays() async {
        do {
            let response = try await dashboardService.getHolidays()
            holidays = response.holidays
        } catch {
            print("Failed to load holidays: \(error)")
        }
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

    func clearSelectedFile() {
        selectedFileURL = nil
        selectedFileName = nil
    }
    
    func submitLeave() async -> Bool {
        guard validateForm() else { return false }
        
        isSubmitting = true
        error = nil
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let needsCertificate = requiresCertificate
        let incidentDateValue = selectedType == .specialDisability
            ? incidentDate.map { formatter.string(from: $0) }
            : nil

        let request = ApplyLeaveRequest(
            type: selectedType.rawValue,
            startDate: formatter.string(from: startDate),
            endDate: formatter.string(from: endDate),
            reason: reason,
            needsCertificate: needsCertificate ? true : nil,
            incidentDate: incidentDateValue,
            isHalfDay: isHalfDay ? true : nil,
            halfDayPeriod: isHalfDay ? halfDayPeriod : nil
        )
        
        do {
            let file = try makeMultipartFile()
            _ = try await leaveService.applyLeave(request, file: file)
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

    private func validateForm() -> Bool {
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)

        if startDate < minSelectableDate {
            error = "Selected dates are not allowed for this leave type."
            return false
        }

        if startDate > endDate {
            error = "End date must be on or after start date."
            return false
        }

        if trimmedReason.isEmpty {
            error = "Reason is required."
            return false
        }

        if trimmedReason.count < 10 {
            error = "Reason must be at least 10 characters."
            return false
        }

        if trimmedReason.count > 500 {
            error = "Reason must be 500 characters or less."
            return false
        }

        if selectedType == .casual {
            if totalDays > 3 {
                error = "Casual Leave cannot exceed 3 consecutive days."
                return false
            }
            if isWeekendOrHoliday(startDate) || isWeekendOrHoliday(endDate) {
                error = "Casual Leave cannot start or end on Friday, Saturday, or a company holiday."
                return false
            }
        }

        if selectedType == .earned {
            let workingDaysUntil = workingDaysUntilStart()
            if workingDaysUntil >= 0 && workingDaysUntil < 5 {
                error = "Earned Leave requires at least 5 working days advance notice."
                return false
            }
        }

        if selectedType == .extraWithPay || selectedType == .extraWithoutPay {
            if hasExtraordinaryLeaveViolation() {
                error = "Cannot apply for Extraordinary Leave while other leave balances remain (Policy 6.26)."
                return false
            }
        }

        if requiresCertificate && selectedFileURL == nil {
            error = "Medical certificate is required for sick leave over 3 days."
            return false
        }

        if selectedType == .specialDisability {
            guard let incidentDate else {
                error = "Incident date is required for Special Disability Leave."
                return false
            }

            if incidentDate > Date() {
                error = "Incident date cannot be in the future."
                return false
            }
            let threeMonthsAgo = Calendar.current.date(byAdding: .day, value: -90, to: startDate) ?? startDate
            if incidentDate < threeMonthsAgo {
                error = "Incident must have occurred within 3 months of leave start date."
                return false
            }
            if incidentDate > startDate {
                error = "Incident date cannot be after leave start date."
                return false
            }
        }

        if let balanceForType = selectedTypeBalance {
            if Double(totalDays) > balanceForType {
                error = "Insufficient balance for this leave type."
                return false
            }
        }

        error = nil
        return true
    }

    private func isWeekendOrHoliday(_ date: Date) -> Bool {
        let weekday = Calendar.current.component(.weekday, from: date)
        let isWeekend = weekday == 6 || weekday == 7
        let dateString = formattedDateOnly(date)
        let isHoliday = holidays.contains { $0.date.hasPrefix(dateString) }
        return isWeekend || isHoliday
    }

    private func workingDaysUntilStart() -> Int {
        let today = startOfDay(Date())
        let start = startOfDay(startDate)
        if start <= today {
            return 0
        }

        var count = 0
        var cursor = today
        while cursor < start {
            cursor = Calendar.current.date(byAdding: .day, value: 1, to: cursor) ?? cursor
            if !isWeekendOrHoliday(cursor) && cursor <= start {
                count += 1
            }
        }
        return count
    }

    private func hasExtraordinaryLeaveViolation() -> Bool {
        guard let balance = balance else { return false }
        let casual = balance.CASUAL
        let earned = balance.EARNED
        let medical = balance.MEDICAL
        return casual > 2 || earned > 0 || medical > 5
    }

    private func startOfDay(_ date: Date) -> Date {
        Calendar.current.startOfDay(for: date)
    }

    private func formattedDateOnly(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

#Preview {
    ApplyLeaveView()
}
