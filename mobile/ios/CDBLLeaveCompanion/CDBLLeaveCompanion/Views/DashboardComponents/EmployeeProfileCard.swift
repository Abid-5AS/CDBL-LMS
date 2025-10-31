//
//  EmployeeProfileCard.swift
//  CDBLLeaveCompanion
//
//  Employee profile information card
//

import SwiftUI

struct EmployeeProfileCard: View {
    @State private var profile: EmployeeProfile?
    @State private var isLoading = true
    
    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
                Text("Employee Profile")
                    .font(StyleGuide.Typography.title3)
                    .foregroundColor(StyleGuide.Colors.foreground)
                
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding()
                } else if let profile = profile {
                    VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                        profileRow(label: "Name", value: profile.name)
                        profileRow(label: "Email", value: profile.email)
                        
                        if let department = profile.department {
                            profileRow(label: "Department", value: department)
                        }
                        
                        if let designation = profile.designation {
                            profileRow(label: "Designation", value: designation)
                        }
                        
                        if let joiningDate = profile.joiningDate {
                            profileRow(
                                label: "Joining Date",
                                value: joiningDate.formatted(.dateTime.month(.wide).day().year())
                            )
                        }
                    }
                } else {
                    Text("Profile information not available")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                }
            }
        }
        .task {
            await loadProfile()
        }
    }
    
    @ViewBuilder
    private func profileRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(StyleGuide.Typography.body)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            Spacer()
            Text(value)
                .font(StyleGuide.Typography.bodyBold)
                .foregroundColor(StyleGuide.Colors.foreground)
        }
    }
    
    private func loadProfile() async {
        // TODO: Load from Core Data or sync service
        isLoading = false
        // For now, use placeholder
        profile = nil
    }
}

// MARK: - Preview

#if DEBUG
struct EmployeeProfileCard_Previews: PreviewProvider {
    static var previews: some View {
        EmployeeProfileCard()
            .padding()
            .background(StyleGuide.Colors.background)
    }
}
#endif

