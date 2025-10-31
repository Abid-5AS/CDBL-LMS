//
//  MonthlyTrendChart.swift
//  CDBLLeaveCompanion
//
//  Line chart showing monthly leave trends using Swift Charts
//

import SwiftUI
#if canImport(Charts)
import Charts
#endif

struct LeaveTrendPoint: Identifiable {
    let id = UUID()
    let month: String
    let leavesTaken: Int
}

struct MonthlyTrendChart: View {
    let data: [LeaveTrendPoint]
    
    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
                Text("Monthly Leave Trend")
                    .font(StyleGuide.Typography.title3)
                    .foregroundColor(StyleGuide.Colors.foreground)
                
                if data.isEmpty {
                    Text("No data available")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                        .frame(maxWidth: .infinity, minHeight: 180)
                } else {
                    #if canImport(Charts)
                    Chart(data) { point in
                        LineMark(
                            x: .value("Month", point.month),
                            y: .value("Days", point.leavesTaken)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart,
                                    StyleGuide.Colors.accentGradientEnd
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .lineStyle(StrokeStyle(lineWidth: 3))
                        
                        PointMark(
                            x: .value("Month", point.month),
                            y: .value("Days", point.leavesTaken)
                        )
                        .foregroundStyle(StyleGuide.Colors.accentGradientStart)
                        .symbolSize(60)
                    }
                    .chartXAxis {
                        AxisMarks(values: .automatic) { _ in
                            AxisGridLine()
                                .foregroundStyle(StyleGuide.Colors.foregroundTertiary.opacity(0.3))
                            AxisValueLabel()
                                .foregroundStyle(StyleGuide.Colors.foregroundSecondary)
                                .font(StyleGuide.Typography.caption2)
                        }
                    }
                    .chartYAxis {
                        AxisMarks { _ in
                            AxisGridLine()
                                .foregroundStyle(StyleGuide.Colors.foregroundTertiary.opacity(0.3))
                            AxisValueLabel()
                                .foregroundStyle(StyleGuide.Colors.foregroundSecondary)
                                .font(StyleGuide.Typography.caption2)
                        }
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
}

// MARK: - Preview

#if DEBUG
struct MonthlyTrendChart_Previews: PreviewProvider {
    static var previews: some View {
        MonthlyTrendChart(data: [
            LeaveTrendPoint(month: "Jan", leavesTaken: 2),
            LeaveTrendPoint(month: "Feb", leavesTaken: 5),
            LeaveTrendPoint(month: "Mar", leavesTaken: 3),
            LeaveTrendPoint(month: "Apr", leavesTaken: 1),
            LeaveTrendPoint(month: "May", leavesTaken: 4),
            LeaveTrendPoint(month: "Jun", leavesTaken: 2)
        ])
        .padding()
        .background(StyleGuide.Colors.background)
    }
}
#endif

