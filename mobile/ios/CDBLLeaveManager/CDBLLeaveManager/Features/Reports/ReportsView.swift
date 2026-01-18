//
//  ReportsView.swift
//  CDBLLeaveManager
//
//  Reports and analytics view for HR and management.
//

import SwiftUI

struct ReportsView: View {
    @State private var selectedReportType = 0
    
    private let reportTypes = ["Leave Summary", "Team Analytics", "Trends"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            header
            
            // Report Type Selector
            reportTypeSelector
            
            // Content
            ScrollView {
                VStack(spacing: 24) {
                    switch selectedReportType {
                    case 0:
                        leaveSummaryReport
                    case 1:
                        teamAnalyticsReport
                    default:
                        trendsReport
                    }
                    
                    Spacer().frame(height: 100)
                }
                .padding(.top, 16)
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Reports")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "square.and.arrow.up")
                    .foregroundStyle(.primary)
                    .padding(10)
                    .surfaceBackground(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Report Type Selector
    
    private var reportTypeSelector: some View {
        HStack(spacing: 0) {
            ForEach(Array(reportTypes.enumerated()), id: \.offset) { index, title in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedReportType = index
                    }
                }) {
                    Text(title)
                        .font(.caption)
                        .fontWeight(selectedReportType == index ? .semibold : .regular)
                        .foregroundStyle(selectedReportType == index ? .white : .white.opacity(0.6))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            selectedReportType == index ?
                            AnyShapeStyle(Color.white.opacity(0.2)) :
                            AnyShapeStyle(Color.clear)
                        )
                }
            }
        }
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
    
    // MARK: - Leave Summary Report
    
    private var leaveSummaryReport: some View {
        VStack(spacing: 16) {
            // Summary Cards
            HStack(spacing: 12) {
                ReportCard(
                    title: "Total Leaves",
                    value: "156",
                    subtitle: "This Year",
                    color: .blue
                )
                
                ReportCard(
                    title: "Approved",
                    value: "142",
                    subtitle: "91%",
                    color: .green
                )
            }
            .padding(.horizontal)
            
            HStack(spacing: 12) {
                ReportCard(
                    title: "Pending",
                    value: "8",
                    subtitle: "Current",
                    color: .orange
                )
                
                ReportCard(
                    title: "Rejected",
                    value: "6",
                    subtitle: "4%",
                    color: .red
                )
            }
            .padding(.horizontal)
            
            // Leave Type Breakdown
            VStack(alignment: .leading, spacing: 12) {
                Text("Leave Type Breakdown")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                VStack(spacing: 8) {
                    LeaveTypeBar(type: "Earned Leave", count: 78, total: 156, color: .indigo)
                    LeaveTypeBar(type: "Casual Leave", count: 45, total: 156, color: .cyan)
                    LeaveTypeBar(type: "Medical Leave", count: 28, total: 156, color: .red)
                    LeaveTypeBar(type: "Other", count: 5, total: 156, color: .gray)
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Team Analytics Report
    
    private var teamAnalyticsReport: some View {
        VStack(spacing: 16) {
            // Team Stats
            HStack(spacing: 12) {
                ReportCard(
                    title: "Team Size",
                    value: "24",
                    subtitle: "Active",
                    color: .blue
                )
                
                ReportCard(
                    title: "Avg Balance",
                    value: "18.5",
                    subtitle: "Days",
                    color: .green
                )
            }
            .padding(.horizontal)
            
            // Utilization Chart Placeholder
            VStack(alignment: .leading, spacing: 12) {
                Text("Leave Utilization by Team Member")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                ForEach(0..<5) { index in
                    HStack {
                        Text("Team Member \(index + 1)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .frame(width: 100, alignment: .leading)
                        
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.white.opacity(0.1))
                                
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.accentColor)
                                    .frame(width: geo.size.width * CGFloat.random(in: 0.3...0.9))
                            }
                        }
                        .frame(height: 12)
                        
                        Text("\(Int.random(in: 30...90))%")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(width: 30)
                    }
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Trends Report
    
    private var trendsReport: some View {
        VStack(spacing: 16) {
            // Monthly Trend
            VStack(alignment: .leading, spacing: 12) {
                Text("Monthly Leave Trend")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                // Simple bar chart
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(["J", "F", "M", "A", "M", "J"], id: \.self) { month in
                        VStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(width: 30, height: CGFloat.random(in: 40...120))
                            
                            Text(month)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 160)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
            
            // Key Insights
            VStack(alignment: .leading, spacing: 12) {
                Text("Key Insights")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                InsightRow(icon: "arrow.up.right", text: "15% increase in leave requests vs last quarter", color: .green)
                InsightRow(icon: "clock", text: "Average approval time improved to 4.2 hours", color: .cyan)
                InsightRow(icon: "calendar", text: "Peak leave period: December holidays", color: .orange)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
}

// MARK: - Report Card

struct ReportCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(color)
            
            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Leave Type Bar

struct LeaveTypeBar: View {
    let type: String
    let count: Int
    let total: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(type)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(count)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
            }
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.1))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geo.size.width * CGFloat(count) / CGFloat(total))
                }
            }
            .frame(height: 8)
        }
    }
}

// MARK: - Insight Row

struct InsightRow: View {
    let icon: String
    let text: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 20)
            
            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        ReportsView()
    }
}
