//
//  LeaveDistributionChart.swift
//  CDBLLeaveCompanion
//
//  Donut chart showing leave type distribution using Swift Charts
//

import SwiftUI
#if canImport(Charts)
import Charts
#endif

struct LeaveDistributionSlice: Identifiable {
    let id = UUID()
    let type: String
    let value: Int
}

struct LeaveDistributionChart: View {
    let data: [LeaveDistributionSlice]
    
    private var total: Int {
        data.reduce(0) { $0 + $1.value }
    }
    
    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
                Text("Leave Type Distribution")
                    .font(StyleGuide.Typography.title3)
                    .foregroundColor(StyleGuide.Colors.foreground)
                
                if data.isEmpty {
                    Text("No data available")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                        .frame(maxWidth: .infinity, minHeight: 180)
                } else {
                    #if canImport(Charts)
                    HStack(spacing: StyleGuide.Spacing.lg) {
                        // Chart
                        Chart(data) { slice in
                            SectorMark(
                                angle: .value("Days", slice.value),
                                innerRadius: .ratio(0.6),
                                angularInset: 2
                            )
                            .foregroundStyle(colorForType(slice.type))
                            .annotation(position: .overlay) {
                                if slice.value > 0 {
                                    Text("\(Int((Double(slice.value) / Double(total)) * 100))%")
                                        .font(StyleGuide.Typography.caption2)
                                        .foregroundColor(.white)
                                        .fontWeight(.semibold)
                                }
                            }
                        }
                        .frame(width: 150, height: 150)
                        
                        // Legend
                        VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                            ForEach(data) { slice in
                                HStack(spacing: StyleGuide.Spacing.sm) {
                                    Circle()
                                        .fill(colorForType(slice.type))
                                        .frame(width: 12, height: 12)
                                    
                                    Text(slice.type)
                                        .font(StyleGuide.Typography.caption)
                                        .foregroundColor(StyleGuide.Colors.foreground)
                                    
                                    Spacer()
                                    
                                    Text("\(slice.value)")
                                        .font(StyleGuide.Typography.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(height: 180)
                    #else
                    // Fallback if Charts not available
                    Text("Charts require iOS 16+")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                        .frame(maxWidth: .infinity, minHeight: 180)
                    #endif
                }
            }
        }
    }
    
    private func colorForType(_ type: String) -> Color {
        switch type.lowercased() {
        case "casual": return .blue
        case "medical", "sick": return .orange
        case "earned": return .green
        default: return .gray
        }
    }
}

// MARK: - Preview

#if DEBUG
struct LeaveDistributionChart_Previews: PreviewProvider {
    static var previews: some View {
        LeaveDistributionChart(data: [
            LeaveDistributionSlice(type: "Casual", value: 5),
            LeaveDistributionSlice(type: "Medical", value: 8),
            LeaveDistributionSlice(type: "Earned", value: 12)
        ])
        .padding()
        .background(StyleGuide.Colors.background)
    }
}
#endif

