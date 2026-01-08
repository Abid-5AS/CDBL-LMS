//
//  EncashmentListView.swift
//  CDBLLeaveManager
//
//  Leave encashment requests list.
//

import SwiftUI
import Combine

struct EncashmentListView: View {
    @StateObject private var viewModel = EncashmentViewModel()
    @State private var showRequestSheet = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                VStack(spacing: 0) {
                    // Header
                    header
                    
                    // Eligibility Card
                    if let eligibility = viewModel.eligibility {
                        eligibilityCard(eligibility)
                    }
                    
                    // Content
                    if viewModel.isLoading && viewModel.encashments.isEmpty {
                        LoadingView()
                    } else if let error = viewModel.error, viewModel.encashments.isEmpty {
                        ErrorView(error) {
                            Task { await viewModel.loadEncashments() }
                        }
                    } else if viewModel.encashments.isEmpty {
                        EmptyStateView(
                            icon: "banknote",
                            title: "No Encashments",
                            message: "You haven't requested any leave encashments yet.",
                            actionTitle: "Request Encashment"
                        ) {
                            showRequestSheet = true
                        }
                    } else {
                        encashmentsList
                    }
                }
            }
            .task {
                await viewModel.loadEncashments()
                await viewModel.checkEligibility()
            }
            .sheet(isPresented: $showRequestSheet) {
                RequestEncashmentView()
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Encashment")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            
            Spacer()
            
            Button(action: { showRequestSheet = true }) {
                Image(systemName: "plus")
                    .foregroundStyle(.white)
                    .padding(10)
                    .glassEffect(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Eligibility Card
    
    private func eligibilityCard(_ eligibility: EncashmentEligibility) -> some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Eligible Balance")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    
                    Text("\(Int(eligibility.eligibleDays)) days")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.green)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Max Encashable")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    
                    Text("\(Int(eligibility.maxEncashable)) days")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.cyan)
                }
            }
            
            if eligibility.estimatedAmount > 0 {
                HStack {
                    Image(systemName: "banknote.fill")
                        .foregroundStyle(.green)
                    
                    Text("Estimated Value")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    
                    Spacer()
                    
                    Text(formatCurrency(eligibility.estimatedAmount))
                        .font(.headline)
                        .foregroundStyle(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
        .padding(.bottom, 16)
    }
    
    // MARK: - Encashments List
    
    private var encashmentsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.encashments) { encashment in
                    EncashmentCard(encashment: encashment)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "৳"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "৳0"
    }
}

// MARK: - Encashment Card

struct EncashmentCard: View {
    let encashment: Encashment
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            Circle()
                .fill(encashment.statusColor.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: "banknote.fill")
                        .foregroundStyle(encashment.statusColor)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text("\(encashment.days) Days")
                    .font(.headline)
                    .foregroundStyle(.white)
                
                Text(encashment.formattedAmount)
                    .font(.subheadline)
                    .foregroundStyle(.green)
                
                Text(encashment.formattedDate)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.5))
            }
            
            Spacer()
            
            // Status
            StatusBadge(encashment.status)
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Request Encashment View

struct RequestEncashmentView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var days: Double = 1
    @State private var maxDays: Double = 15
    @State private var estimatedAmount: Double = 0
    @State private var isSubmitting = false
    @State private var error: String?
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Days Selector
                        VStack(spacing: 16) {
                            Text("\(Int(days)) Days")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundStyle(.white)
                            
                            Slider(value: $days, in: 1...maxDays, step: 1)
                                .tint(.cyan)
                                .padding(.horizontal)
                        }
                        .padding()
                        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
                        .padding(.horizontal)
                        
                        // Estimated Amount
                        HStack {
                            Text("Estimated Amount")
                                .foregroundStyle(.white.opacity(0.7))
                            
                            Spacer()
                            
                            Text(formatCurrency(estimatedAmount * days))
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundStyle(.green)
                        }
                        .padding()
                        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
                        .padding(.horizontal)
                        
                        // Info
                        HStack {
                            Image(systemName: "info.circle.fill")
                                .foregroundStyle(.cyan)
                            
                            Text("Encashment will be processed in the next payroll cycle.")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                        .padding(.horizontal)
                        
                        // Error
                        if let error = error {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .padding(.horizontal)
                        }
                        
                        // Submit Button
                        Button(action: submit) {
                            HStack {
                                if isSubmitting {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "paperplane.fill")
                                    Text("Submit Request")
                                }
                            }
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                        }
                        .buttonStyle(.glassProminent)
                        .tint(.green)
                        .disabled(isSubmitting)
                        .padding(.horizontal)
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Request Encashment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
        }
    }
    
    private func submit() {
        isSubmitting = true
        // TODO: Implement encashment API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isSubmitting = false
            dismiss()
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "৳"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "৳0"
    }
}

// MARK: - ViewModel

@MainActor
final class EncashmentViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var encashments: [Encashment] = []
    @Published var eligibility: EncashmentEligibility?
    
    // TODO: Create EncashmentService
    
    func loadEncashments() async {
        isLoading = true
        error = nil
        
        // TODO: Implement API call
        await MainActor.run {
            isLoading = false
        }
    }
    
    func checkEligibility() async {
        // TODO: Implement eligibility check
    }
}

#Preview {
    EncashmentListView()
}
