//
//  BalanceProgressCard.swift
//  CDBLLeaveCompanion
//
//  Progress indicator card for leave balances
//

import SwiftUI

struct BalanceProgressCard: View {
    let leaveType: LeaveType
    let total: Int
    let used: Int
    let remaining: Int
    
    private var percentage: Double {
        guard total > 0 else { return 0 }
        return min(Double(used) / Double(total), 1.0)
    }
    
    private var color: Color {
        switch leaveType {
        case .CASUAL: return .blue
        case .MEDICAL: return .orange
        case .EARNED: return .green
        default: return .gray
        }
    }
    
    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                HStack {
                    Text(leaveType.displayName)
                        .font(StyleGuide.Typography.bodyBold)
                        .foregroundColor(StyleGuide.Colors.foreground)
                    
                    Spacer()
                    
                    Text("\(used)/\(total)")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                }
                
                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // Background
                        RoundedRectangle(cornerRadius: 4)
                            .fill(color.opacity(0.2))
                            .frame(height: 8)
                        
                        // Progress
                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [color, color.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * percentage, height: 8)
                            .animation(.spring(response: 0.5, dampingFraction: 0.8), value: percentage)
                    }
                }
                .frame(height: 8)
                
                Text("\(remaining) days remaining")
                    .font(StyleGuide.Typography.caption2)
                    .foregroundColor(StyleGuide.Colors.foregroundTertiary)
            }
        }
    }
}

// Note: BalanceProgressCards container removed - use BalanceProgressCard directly

// MARK: - Preview

#if DEBUG
struct BalanceProgressCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack {
            BalanceProgressCard(
                leaveType: .CASUAL,
                total: 10,
                used: 3,
                remaining: 7
            )
            .padding()
        }
        .background(StyleGuide.Colors.background)
    }
}
#endif

