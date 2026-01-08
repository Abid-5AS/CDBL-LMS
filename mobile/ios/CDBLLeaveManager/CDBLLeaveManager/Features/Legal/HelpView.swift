//
//  HelpView.swift
//  CDBLLeaveManager
//
//  Help and FAQ section.
//

import SwiftUI

struct HelpView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var expandedSections: Set<String> = []
    
    private let faqs: [(section: String, items: [(q: String, a: String)])] = [
        ("Leave Application", [
            ("How do I apply for leave?", "Navigate to the Leaves section and tap the '+' button. Select your leave type, dates, and provide a reason. Submit for approval."),
            ("Can I apply for half-day leave?", "Yes! When the start and end dates are the same, you'll see an option to apply for half-day leave (morning or afternoon)."),
            ("How long does approval take?", "Most leave requests are processed within 24-48 business hours. You'll receive a notification once your request is reviewed."),
            ("Can I cancel a leave request?", "Pending requests can be cancelled. Approved leaves may require HR approval for cancellation depending on company policy.")
        ]),
        ("Leave Balance", [
            ("How is my leave balance calculated?", "Your balance is based on your leave entitlement minus leaves taken. Earned leave accrues monthly, while casual and medical leaves are credited at the start of the year."),
            ("What happens to unused leave?", "Earned leave can be carried forward or encashed based on company policy. Casual and medical leaves typically don't carry over."),
            ("How do I check my balance?", "Your balance is displayed on your dashboard and in the Balance section accessible from the Leaves screen.")
        ]),
        ("Approvals", [
            ("Who approves my leave?", "Leave requests go through your reporting manager first, then to HR for final approval."),
            ("What if my request is rejected?", "You'll receive a notification with the reason. You can modify and resubmit the request if needed."),
            ("Can I edit an approved leave?", "Approved leaves cannot be edited. You'll need to cancel and submit a new request.")
        ]),
        ("Account & Settings", [
            ("How do I change my password?", "Go to Settings > Security > Change Password. You'll need to verify your current password."),
            ("Can I enable biometric login?", "Yes! Go to Settings > Security and toggle on Face ID or Touch ID."),
            ("How do I update my profile?", "Go to your Profile and tap Edit. Some fields may be restricted and require HR assistance.")
        ])
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Search
                        searchBar
                        
                        // FAQ Sections
                        ForEach(filteredFaqs, id: \.section) { section in
                            faqSection(section)
                        }
                        
                        // Contact Support
                        contactSection
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Help & FAQ")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
        }
    }
    
    private var filteredFaqs: [(section: String, items: [(q: String, a: String)])] {
        if searchText.isEmpty {
            return faqs
        }
        
        return faqs.compactMap { section in
            let filtered = section.items.filter { item in
                item.q.localizedCaseInsensitiveContains(searchText) ||
                item.a.localizedCaseInsensitiveContains(searchText)
            }
            return filtered.isEmpty ? nil : (section.section, filtered)
        }
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.white.opacity(0.5))
            
            TextField("Search FAQs...", text: $searchText)
                .foregroundStyle(.white)
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
        }
        .padding()
        .glassEffect(.transparent, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
    
    // MARK: - FAQ Section
    
    private func faqSection(_ section: (section: String, items: [(q: String, a: String)])) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(section.section)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                ForEach(section.items, id: \.q) { item in
                    FAQItem(
                        question: item.q,
                        answer: item.a,
                        isExpanded: expandedSections.contains(item.q)
                    ) {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            if expandedSections.contains(item.q) {
                                expandedSections.remove(item.q)
                            } else {
                                expandedSections.insert(item.q)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Contact Section
    
    private var contactSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Need More Help?")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                ContactRow(icon: "envelope.fill", title: "Email Support", subtitle: "hr@cdbl.com")
                ContactRow(icon: "phone.fill", title: "Call HR", subtitle: "+880-2-XXXXXXXX")
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - FAQ Item

struct FAQItem: View {
    let question: String
    let answer: String
    let isExpanded: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: isExpanded ? 12 : 0) {
                HStack {
                    Text(question)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                if isExpanded {
                    Text(answer)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                        .multilineTextAlignment(.leading)
                }
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Contact Row

struct ContactRow: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .foregroundStyle(.cyan)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.4))
        }
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    HelpView()
}
