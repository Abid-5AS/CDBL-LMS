//
//  LegalViews.swift
//  CDBLLeaveManager
//
//  Terms of Service, Privacy Policy, and Feedback views.
//

import SwiftUI
import Combine

// MARK: - Terms View

struct TermsView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        legalSection(
                            title: "1. Acceptance of Terms",
                            content: """
                            By accessing and using the CDBL Connect mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this application.
                            """
                        )
                        
                        legalSection(
                            title: "2. Use of Service",
                            content: """
                            This application is provided for employees of CDBL for the purpose of managing leave requests, viewing schedules, and accessing work-related information. You agree to use this service only for its intended purpose and in compliance with company policies.
                            """
                        )
                        
                        legalSection(
                            title: "3. Account Security",
                            content: """
                            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify IT support immediately of any unauthorized use of your account or any other security breach.
                            """
                        )
                        
                        legalSection(
                            title: "4. Data Accuracy",
                            content: """
                            You agree to provide accurate information when using this application. Submitting false leave requests or providing inaccurate information may result in disciplinary action as per company policy.
                            """
                        )
                        
                        legalSection(
                            title: "5. Modifications",
                            content: """
                            CDBL reserves the right to modify these terms at any time. Continued use of the application after changes constitutes acceptance of the new terms.
                            """
                        )
                        
                        Text("Last updated: January 2026")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal)
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Terms of Service")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
        }
    }
    
    private func legalSection(title: String, content: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)
            
            Text(content)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(4)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }
}

// MARK: - Privacy View

struct PrivacyView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        legalSection(
                            title: "Information We Collect",
                            content: """
                            We collect information you provide directly, including your name, email, employee ID, and leave request details. We also collect usage data to improve the application experience.
                            """
                        )
                        
                        legalSection(
                            title: "How We Use Your Information",
                            content: """
                            Your information is used to process leave requests, provide notifications, generate reports for HR and management, and improve application functionality.
                            """
                        )
                        
                        legalSection(
                            title: "Data Storage & Security",
                            content: """
                            Your data is stored securely on CDBL servers with industry-standard encryption. Access is restricted to authorized personnel only.
                            """
                        )
                        
                        legalSection(
                            title: "Data Sharing",
                            content: """
                            Your leave and attendance data is shared with your manager, HR department, and relevant approvers as part of the leave management workflow. We do not share your data with external parties.
                            """
                        )
                        
                        legalSection(
                            title: "Your Rights",
                            content: """
                            You have the right to access, correct, or request deletion of your personal data. Contact HR for any data-related requests.
                            """
                        )
                        
                        Text("Last updated: January 2026")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal)
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Privacy Policy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
        }
    }
    
    private func legalSection(title: String, content: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)
            
            Text(content)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(4)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }
}

// MARK: - Feedback View

struct FeedbackView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var feedbackType = 0
    @State private var feedbackText = ""
    @State private var rating = 4
    @State private var isSubmitting = false
    @State private var showSuccess = false
    
    private let feedbackTypes = ["Bug Report", "Feature Request", "General Feedback"]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Type Selector
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Feedback Type")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            
                            Picker("Type", selection: $feedbackType) {
                                ForEach(0..<feedbackTypes.count, id: \.self) { index in
                                    Text(feedbackTypes[index]).tag(index)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        .padding(.horizontal)
                        
                        // Rating
                        VStack(alignment: .leading, spacing: 12) {
                            Text("How's your experience?")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            
                            HStack(spacing: 16) {
                                ForEach(1...5, id: \.self) { star in
                                    Button(action: { rating = star }) {
                                        Image(systemName: star <= rating ? "star.fill" : "star")
                                            .font(.title)
                                            .foregroundStyle(star <= rating ? .yellow : .white.opacity(0.3))
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding()
                        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
                        .padding(.horizontal)
                        
                        // Feedback Text
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Tell us more")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            
                            TextEditor(text: $feedbackText)
                                .scrollContentBackground(.hidden)
                                .foregroundStyle(.primary)
                                .frame(minHeight: 150)
                                .padding()
                                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 16))
                            
                            Text("\(feedbackText.count)/1000")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        .padding(.horizontal)
                        
                        // Submit Button
                        Button(action: submitFeedback) {
                            HStack {
                                if isSubmitting {
                                    ProgressView()
                                        .tint(.accentColor)
                                } else {
                                    Image(systemName: "paperplane.fill")
                                    Text("Send Feedback")
                                }
                            }
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.accentColor)
                        .disabled(feedbackText.isEmpty || isSubmitting)
                        .padding(.horizontal)
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
                
                // Success Overlay
                if showSuccess {
                    successOverlay
                }
            }
            .navigationTitle("Send Feedback")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
        }
    }
    
    private var successOverlay: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.green)
            
            Text("Thank You!")
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Text("Your feedback has been submitted successfully.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Done") {
                dismiss()
            }
            .buttonStyle(.borderedProminent)
            .tint(.accentColor)
            .padding(.horizontal, 60)
        }
        .padding(40)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 28))
        .padding(40)
    }
    
    private func submitFeedback() {
        isSubmitting = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isSubmitting = false
            showSuccess = true
        }
    }
}

// MARK: - Policy View

struct PolicyView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = PolicyViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                if viewModel.isLoading {
                    LoadingView()
                } else {
                    policyContent
                }
            }
            .navigationTitle("Leave Policies")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
        }
    }
    
    private var policyContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                ForEach(viewModel.policies, id: \.name) { policy in
                    PolicyCard(policy: policy)
                }
                
                Spacer().frame(height: 40)
            }
            .padding(.top, 20)
            .padding(.horizontal)
        }
    }
}

struct PolicyCard: View {
    let policy: LeavePolicy
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(policy.name)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                Text("\(policy.totalDays) days/year")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.accentColor.opacity(0.2))
                    .clipShape(Capsule())
                    .foregroundStyle(Color.accentColor)
            }
            
            if let description = policy.description {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            HStack(spacing: 16) {
                PolicyFeature(icon: "arrow.right.arrow.left", text: policy.carryForward ? "Carry Forward" : "No Carry Forward")
                PolicyFeature(icon: "banknote", text: policy.encashable ? "Encashable" : "Not Encashable")
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct PolicyFeature: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
            Text(text)
                .font(.caption2)
        }
        .foregroundStyle(.secondary)
    }
}

// MARK: - Policy ViewModel

struct LeavePolicy: Identifiable {
    let id = UUID()
    let name: String
    let totalDays: Int
    let description: String?
    let carryForward: Bool
    let encashable: Bool
}

@MainActor
final class PolicyViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var policies: [LeavePolicy] = [
        LeavePolicy(name: "Earned Leave", totalDays: 33, description: "Accrues monthly based on service. Can be carried forward up to 90 days.", carryForward: true, encashable: true),
        LeavePolicy(name: "Casual Leave", totalDays: 10, description: "For personal matters and short absences. Cannot be taken for more than 3 consecutive days.", carryForward: false, encashable: false),
        LeavePolicy(name: "Medical Leave", totalDays: 14, description: "For illness or medical appointments. Medical certificate required for absences over 3 days.", carryForward: true, encashable: false),
        LeavePolicy(name: "Maternity Leave", totalDays: 120, description: "Available for female employees. 4 months with full pay.", carryForward: false, encashable: false),
        LeavePolicy(name: "Paternity Leave", totalDays: 10, description: "Available for male employees on birth of child.", carryForward: false, encashable: false),
        LeavePolicy(name: "Compensatory Leave", totalDays: 0, description: "Earned for working on holidays or overtime. Must be availed within 30 days.", carryForward: false, encashable: false)
    ]
}

#Preview("Terms") {
    TermsView()
}

#Preview("Privacy") {
    PrivacyView()
}

#Preview("Feedback") {
    FeedbackView()
}

#Preview("Policy") {
    PolicyView()
}
