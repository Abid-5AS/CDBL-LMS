//
//  WorkflowPoliciesView.swift
//  CDBLLeaveManager
//
//  Workflow policies management for admin.
//

import SwiftUI
import Combine

struct WorkflowPoliciesView: View {
    @StateObject private var viewModel = WorkflowPoliciesViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    header
                    
                    // Content
                    if viewModel.isLoading {
                        LoadingView()
                    } else if let error = viewModel.error {
                        ErrorView(error) {
                            Task { await viewModel.loadPolicies() }
                        }
                    } else {
                        policiesList
                    }
                }
            }
            .task {
                await viewModel.loadPolicies()
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Workflow Policies")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            
            Spacer()
            
            Button(action: {
                Task { await viewModel.loadPolicies() }
            }) {
                Image(systemName: "arrow.clockwise")
                    .foregroundStyle(.primary)
                    .padding(10)
                    .surfaceBackground(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Policies List
    
    private var policiesList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.policies) { policy in
                    WorkflowPolicyCard(policy: policy)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

// MARK: - Workflow Policy Card

struct WorkflowPolicyCard: View {
    let policy: WorkflowPolicy
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(policy.name)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    
                    if let description = policy.description {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
                
                // Status
                Circle()
                    .fill(policy.isActive ? Color.green : Color.gray)
                    .frame(width: 12, height: 12)
            }
            
            // Policy Details
            HStack(spacing: 16) {
                PolicyDetail(
                    icon: "person.3.fill",
                    label: "Applies To",
                    value: policy.leaveTypes?.joined(separator: ", ") ?? "All"
                )
                
                PolicyDetail(
                    icon: "arrow.triangle.branch",
                    label: "Approvers",
                    value: "\(policy.approvalLevels) levels"
                )
            }
            
            // Rules Summary
            if let rules = policy.rules, !rules.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Rules")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                    
                    ForEach(rules.prefix(3), id: \.self) { rule in
                        HStack(spacing: 8) {
                            Circle()
                                .fill(Color.accentColor)
                                .frame(width: 4, height: 4)
                            
                            Text(rule)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Policy Detail

struct PolicyDetail: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(Color.accentColor)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.caption)
                    .foregroundStyle(.primary)
            }
        }
    }
}

// MARK: - ViewModel

@MainActor
final class WorkflowPoliciesViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var policies: [WorkflowPolicy] = []
    
    private let adminService = AdminService.shared
    
    func loadPolicies() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await adminService.getWorkflowPolicies()
            policies = response.allPolicies
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    WorkflowPoliciesView()
}
