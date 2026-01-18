//
//  ApplyLeaveView.swift
//  CDBLLeaveManager
//
//  Apply leave form with system materials.
//

import SwiftUI
import Combine

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
                        if !viewModel.isMultipleDays {
                            halfDayToggle
                        }
                        
                        // Reason
                        reasonSection
                        
                        // Balance Info
                        if let balance = viewModel.selectedTypeBalance {
                            balanceInfo(balance)
                        }
                        
                        // Error
                        if let error = viewModel.error {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
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
                        viewModel.selectedType = type
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
                        in: Date()...,
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
                        isSelected: viewModel.halfDayType == "FIRST_HALF"
                    ) {
                        viewModel.halfDayType = "FIRST_HALF"
                    }
                    
                    HalfDayOption(
                        title: "Second Half",
                        subtitle: "Afternoon",
                        isSelected: viewModel.halfDayType == "SECOND_HALF"
                    ) {
                        viewModel.halfDayType = "SECOND_HALF"
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
    @Published var halfDayType = "FIRST_HALF"
    @Published var isSubmitting = false
    @Published var error: String?
    @Published var balance: DashboardLeaveBalance?
    
    private let leaveService = LeaveService.shared
    
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
    
    var selectedTypeBalance: Double? {
        guard let balance = balance else { return nil }
        switch selectedType {
        case .earned: return balance.EARNED
        case .casual: return balance.CASUAL
        case .medical: return balance.MEDICAL
        case .compensatory: return balance.COMPENSATORY ?? 0
        case .maternity: return balance.MATERNITY ?? 0
        case .paternity: return balance.PATERNITY ?? 0
        case .special: return balance.SPECIAL ?? 0
        }
    }
    
    var isValid: Bool {
        !reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        reason.count <= 500 &&
        startDate <= endDate
    }
    
    init() {
        Task {
            await loadBalance()
        }
    }
    
    func loadBalance() async {
        do {
            balance = try await leaveService.getBalance()
        } catch {
            print("Failed to load balance: \(error)")
        }
    }
    
    func submitLeave() async -> Bool {
        guard isValid else {
            error = "Please fill in all required fields"
            return false
        }
        
        isSubmitting = true
        error = nil
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        let request = ApplyLeaveRequest(
            type: selectedType.rawValue,
            startDate: formatter.string(from: startDate),
            endDate: formatter.string(from: endDate),
            reason: reason,
            isHalfDay: isHalfDay ? true : nil,
            halfDayType: isHalfDay ? halfDayType : nil
        )
        
        do {
            _ = try await leaveService.applyLeave(request)
            isSubmitting = false
            return true
        } catch {
            isSubmitting = false
            self.error = error.localizedDescription
            return false
        }
    }
}

#Preview {
    ApplyLeaveView()
}
