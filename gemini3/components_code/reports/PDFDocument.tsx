import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Register fonts (optional - using system fonts for now)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: 30,
    borderRadius: 12,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.95,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    fontSize: 11,
    opacity: 0.9,
  },
  kpiGrid: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  kpiTitle: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: "bold",
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: "2px solid #e5e7eb",
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  table: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    flexDirection: "row",
    padding: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 10,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: "#1f2937",
  },
  badge: {
    padding: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeApproved: {
    backgroundColor: "#d1fae5",
  },
  badgePending: {
    backgroundColor: "#fef3c7",
  },
  badgeSubmitted: {
    backgroundColor: "#dbeafe",
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
  },
  statBoxTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "bold",
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 10,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
  },
});

type PDFDocumentProps = {
  title: string;
  duration: string;
  generatedAt: string;
  kpis: {
    pendingApprovals: number;
    approvedLeaves: number;
    avgApprovalTime: number;
    totalEmployees: number;
    utilizationRate: number;
  };
  charts: {
    monthlyTrend: Array<{ month: string; leaves: number }>;
    typeDistribution: Array<{ name: string; value: number }>;
    departmentSummary: Array<{ name: string; count: number }>;
  };
  leaves: Array<{
    requester: { name: string; email: string; department: string | null };
    type: string;
    startDate: Date | string;
    endDate: Date | string;
    workingDays: number;
    status: string;
  }>;
  filters: {
    department: string | null;
    leaveType: string | null;
  };
};

export function PDFDocument({
  title,
  duration,
  generatedAt,
  kpis,
  charts,
  leaves,
  filters,
}: PDFDocumentProps) {
  // Guard against null/undefined props
  if (!title || !duration || !generatedAt) {
    throw new Error("PDFDocument: Missing required props");
  }

  // Provide defaults for optional data
  const safeKpis = kpis || {
    pendingApprovals: 0,
    approvedLeaves: 0,
    avgApprovalTime: 0,
    totalEmployees: 0,
    utilizationRate: 0,
  };

  const safeCharts = charts || {
    monthlyTrend: [],
    typeDistribution: [],
    departmentSummary: [],
  };

  const safeLeaves = leaves || [];
  const safeFilters = filters || { department: null, leaveType: null };

  const getBadgeStyle = (status: string) => {
    if (status === "APPROVED") return styles.badgeApproved;
    if (status === "PENDING") return styles.badgePending;
    if (status === "SUBMITTED") return styles.badgeSubmitted;
    return styles.badgePending;
  };

  const getBadgeTextColor = (status: string): string => {
    if (status === "APPROVED") return "#059669"; // green-600
    if (status === "PENDING") return "#d97706"; // amber-600
    if (status === "SUBMITTED") return "#2563eb"; // blue-600
    if (status === "REJECTED") return "#dc2626"; // red-600
    if (status === "CANCELLED") return "#6b7280"; // gray-500
    return "#6b7280"; // default gray
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            Leave Management Analytics & Report
          </Text>
          <View style={styles.meta}>
            <Text>Period: {duration}</Text>
            <Text>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Pending</Text>
            <Text style={styles.kpiValue}>{safeKpis.pendingApprovals}</Text>
            <Text style={styles.kpiLabel}>{duration}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Approved</Text>
            <Text style={styles.kpiValue}>{safeKpis.approvedLeaves}</Text>
            <Text style={styles.kpiLabel}>{duration}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Avg Time</Text>
            <Text style={styles.kpiValue}>{safeKpis.avgApprovalTime}</Text>
            <Text style={styles.kpiLabel}>Days</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Employees</Text>
            <Text style={styles.kpiValue}>{safeKpis.totalEmployees}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Utilization</Text>
            <Text style={styles.kpiValue}>{safeKpis.utilizationRate}%</Text>
            <Text style={styles.kpiLabel}>{duration}</Text>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Leave Trend</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              Approved Leaves per Month ({new Date().getFullYear()})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Month</Text>
                <Text style={styles.tableHeaderCell}>Days</Text>
              </View>
              {safeCharts.monthlyTrend.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.month}</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                    {item.leaves}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxTitle}>Leave Type Distribution</Text>
            {safeCharts.typeDistribution.map((item, idx) => (
              <View key={idx} style={styles.statItem}>
                <Text>{item.name}</Text>
                <Text style={{ fontWeight: "bold" }}>{item.value} days</Text>
              </View>
            ))}
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxTitle}>Top Departments</Text>
            {safeCharts.departmentSummary.slice(0, 5).map((item, idx) => (
              <View key={idx} style={styles.statItem}>
                <Text>{item.name}</Text>
                <Text style={{ fontWeight: "bold" }}>{item.count} days</Text>
              </View>
            ))}
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxTitle}>Applied Filters</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, marginBottom: 4 }}>
                <Text style={{ fontWeight: "bold" }}>Duration:</Text> {duration}
              </Text>
              {safeFilters.department && (
                <Text style={{ fontSize: 10, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>Department:</Text>{" "}
                  {safeFilters.department}
                </Text>
              )}
              {safeFilters.leaveType && (
                <Text style={{ fontSize: 10, marginBottom: 4 }}>
                  <Text style={{ fontWeight: "bold" }}>Leave Type:</Text>{" "}
                  {safeFilters.leaveType}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Leave Requests Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Requests Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>
                Employee
              </Text>
              <Text style={styles.tableHeaderCell}>Type</Text>
              <Text style={styles.tableHeaderCell}>Start</Text>
              <Text style={styles.tableHeaderCell}>End</Text>
              <Text style={styles.tableHeaderCell}>Days</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            {safeLeaves.slice(0, 20).map((leave, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: "bold" }]}>
                  {leave.requester.name}
                </Text>
                <Text style={styles.tableCell}>{leave.type}</Text>
                <Text style={styles.tableCell}>{formatDate(leave.startDate)}</Text>
                <Text style={styles.tableCell}>{formatDate(leave.endDate)}</Text>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
                  {leave.workingDays}
                </Text>
                <View style={[styles.tableCell, { alignItems: "center", justifyContent: "center" }]}>
                  <View style={getBadgeStyle(leave.status)}>
                    <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", color: getBadgeTextColor(leave.status) }}>{leave.status}</Text>
                  </View>
                </View>
              </View>
            ))}
            {safeLeaves.length > 20 && (
              <View style={[styles.tableRow, { backgroundColor: "#f9fafb" }]}>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 6, textAlign: "center", fontStyle: "italic" },
                  ]}
                >
                  ... and {safeLeaves.length - 20} more requests
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>CDBL Leave Management System - Confidential Report</Text>
          <Text style={{ marginTop: 4 }}>Generated on {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}

