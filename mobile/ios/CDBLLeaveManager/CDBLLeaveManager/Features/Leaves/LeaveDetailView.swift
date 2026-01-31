//
//  LeaveDetailView.swift
//  CDBLLeaveManager
//
//  Detail view for a leave request.
//

import SwiftUI
import Combine
import UniformTypeIdentifiers

struct LeaveDetailView: View {
    let leaveId: Int
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = LeaveDetailViewModel()
    @State private var pendingUploadType: String?
    @State private var showEditSheet = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadLeave(id: leaveId) }
                    }
                } else if let leave = viewModel.leave {
                    leaveContent(leave)
                }
            }
            .navigationTitle("Leave Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(.primary)
                }
            }
            .task {
                await viewModel.loadLeave(id: leaveId)
            }
            .sheet(isPresented: $showEditSheet) {
                if let leave = viewModel.leave {
                    EditLeaveView(leave: leave)
                }
            }
        }
    }
    
    private func leaveContent(_ leave: LeaveRequest) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                // Status Header
                statusHeader(leave)
                
                // Details Card
                detailsCard(leave)

                // Certificates
                certificatesSection(leave)
                
                // Timeline
                timelineSection(leave)
                
                // Actions (if pending)
                if leave.status.uppercased() == "PENDING" {
                    actionsSection(leave)
                }

                if leave.status.uppercased() == "RETURNED" {
                    Button {
                        showEditSheet = true
                    } label: {
                        HStack {
                            Image(systemName: "pencil")
                            Text("Edit & Resubmit")
                        }
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .padding(.horizontal)
                }
                
                Spacer().frame(height: 40)
            }
            .padding(.top, 20)
        }
    }
    
    // MARK: - Status Header
    
    private func statusHeader(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 16) {
            // Status Icon
            ZStack {
                Circle()
                    .fill(leave.statusColor.opacity(0.2))
                    .frame(width: 80, height: 80)
                
                Image(systemName: leave.statusIcon)
                    .font(.system(size: 36))
                    .foregroundStyle(leave.statusColor)
            }
            
            // Status Text
            Text(leave.status.capitalized)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(leave.statusColor)
            
            // Type
            Text(LeaveType(rawValue: leave.type)?.displayName ?? leave.type)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Details Card
    
    private func detailsCard(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 0) {
            DetailRow(label: "Start Date", value: formatDate(leave.startDate))
            Divider()
            DetailRow(label: "End Date", value: formatDate(leave.endDate))
            Divider()
            DetailRow(label: "Total Days", value: "\(totalDays(for: leave)) day(s)")
            
            if leave.isHalfDay == true {
                Divider()
                DetailRow(label: "Half Day", value: leave.halfDayPeriod ?? leave.halfDayType ?? "Yes")
            }
            
            if let reason = leave.reason, !reason.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Reason")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(reason)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
        }
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }

    // MARK: - Certificates Section

    private func certificatesSection(_ leave: LeaveRequest) -> some View {
        let days = totalDays(for: leave)
        let isMedical = leave.type.uppercased() == "MEDICAL"
        let needsMedicalCert = isMedical && days > 3
        let needsFitnessCert = isMedical && days > 7

        if !needsMedicalCert && !needsFitnessCert {
            return AnyView(EmptyView())
        }

        return AnyView(
            VStack(alignment: .leading, spacing: 12) {
                Text("Certificates")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal)

                VStack(spacing: 12) {
                    if needsMedicalCert {
                        certificateCard(
                            title: "Medical Certificate",
                            isUploaded: leave.certificateUrl != nil,
                            actionTitle: "Upload Medical Certificate",
                            uploadType: "medical"
                        )
                    }

                    if needsFitnessCert {
                        certificateCard(
                            title: "Fitness Certificate",
                            isUploaded: leave.fitnessCertificateUrl != nil,
                            actionTitle: "Upload Fitness Certificate",
                            uploadType: "fitness"
                        )
                    }
                }
                .padding(.horizontal)
            }
        )
    }

    private func certificateCard(
        title: String,
        isUploaded: Bool,
        actionTitle: String,
        uploadType: String
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.primary)
            Text(isUploaded ? "Uploaded" : "Missing")
                .font(.caption)
                .foregroundStyle(isUploaded ? .green : .red)

            if !isUploaded {
                Button(action: {
                    pendingUploadType = uploadType
                }) {
                    Text(actionTitle)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        .fileImporter(
            isPresented: Binding(
                get: { pendingUploadType == uploadType },
                set: { if !$0 { pendingUploadType = nil } }
            ),
            allowedContentTypes: [.pdf, .image],
            allowsMultipleSelection: false
        ) { result in
            guard let type = pendingUploadType else { return }
            pendingUploadType = nil
            viewModel.handleCertificateSelection(result, leaveId: leaveId, type: type)
        }
    }
    
    // MARK: - Timeline Section
    
    private func timelineSection(_ leave: LeaveRequest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Timeline")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                TimelineItem(
                    title: "Submitted",
                    subtitle: formatDateTime(leave.createdAt ?? leave.startDate),
                    isCompleted: true,
                    isLast: leave.status.uppercased() == "PENDING"
                )
                
                if leave.status.uppercased() != "PENDING" {
                    TimelineItem(
                        title: leave.status.capitalized,
                        subtitle: leave.updatedAt != nil ? formatDateTime(leave.updatedAt!) : "Recently",
                        isCompleted: true,
                        isLast: true
                    )
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Actions Section
    
    private func actionsSection(_ leave: LeaveRequest) -> some View {
        VStack(spacing: 12) {
            Button(action: {
                Task { await viewModel.cancelLeave(id: leave.id) }
            }) {
                HStack {
                    Image(systemName: "xmark.circle")
                    Text("Cancel Request")
                }
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding()
            }
            .buttonStyle(.bordered)
            .foregroundStyle(.red)
        }
        .padding(.horizontal)
    }
    
    // MARK: - Helpers
    
    private func formatDate(_ dateString: String) -> String {
        if dateString.count >= 10 {
            let dateOnly = String(dateString.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "EEEE, MMM dd, yyyy"
                return formatter.string(from: date)
            }
        }
        return dateString
    }
    
    private func formatDateTime(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "MMM dd, yyyy 'at' h:mm a"
            return outputFormatter.string(from: date)
        }
        return formatDate(dateString)
    }

    private func totalDays(for leave: LeaveRequest) -> Int {
        if let total = leave.totalDays {
            return max(1, Int(total))
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard
            let start = formatter.date(from: String(leave.startDate.prefix(10))),
            let end = formatter.date(from: String(leave.endDate.prefix(10)))
        else {
            return 1
        }
        let days = Calendar.current.dateComponents([.day], from: start, to: end).day ?? 0
        return days + 1
    }
}

// MARK: - Detail Row

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.primary)
        }
        .padding()
    }
}

// MARK: - Timeline Item

struct TimelineItem: View {
    let title: String
    let subtitle: String
    let isCompleted: Bool
    let isLast: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Indicator
            VStack(spacing: 0) {
                Circle()
                    .fill(isCompleted ? Color.green : Color.white.opacity(0.3))
                    .frame(width: 12, height: 12)
                
                if !isLast {
                    Rectangle()
                        .fill(Color.white.opacity(0.2))
                        .frame(width: 2, height: 40)
                }
            }
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
        }
    }
}

// MARK: - ViewModel

@MainActor
final class LeaveDetailViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var leave: LeaveRequest?
    
    private let leaveService = LeaveService.shared
    
    func loadLeave(id: Int) async {
        isLoading = true
        error = nil
        
        do {
            leave = try await leaveService.getLeaveDetail(id: id)
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func cancelLeave(id: Int) async {
        do {
            let response = try await leaveService.cancelLeave(id: id)
            if let updatedLeave = response.data {
                leave = updatedLeave
            } else {
                leave?.status = "CANCELLED"
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func handleCertificateSelection(
        _ result: Result<[URL], Error>,
        leaveId: Int,
        type: String
    ) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            Task { await uploadCertificate(leaveId: leaveId, type: type, fileURL: url) }
        case .failure(let error):
            self.error = error.localizedDescription
        }
    }

    private func uploadCertificate(leaveId: Int, type: String, fileURL: URL) async {
        do {
            let needsAccess = fileURL.startAccessingSecurityScopedResource()
            defer {
                if needsAccess {
                    fileURL.stopAccessingSecurityScopedResource()
                }
            }
            let data = try Data(contentsOf: fileURL)
            let mimeType = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            let file = APIClient.MultipartFile(
                fieldName: "certificate",
                fileName: fileURL.lastPathComponent,
                mimeType: mimeType,
                data: data
            )
            let response = try await leaveService.uploadCertificate(leaveId: leaveId, type: type, file: file)
            if let updatedLeave = response.data {
                leave = updatedLeave
            } else {
                await loadLeave(id: leaveId)
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    LeaveDetailView(leaveId: 1)
}
