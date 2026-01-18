//
//  TeamListView.swift
//  CDBLLeaveManager
//
//  Team members list for managers and HR.
//

import SwiftUI
import Combine

struct TeamListView: View {
    @StateObject private var viewModel = TeamViewModel()
    @State private var searchText = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            header
            
            // Search Bar
            searchBar
            
            // Content
            if viewModel.isLoading && viewModel.employees.isEmpty {
                LoadingView()
            } else if let error = viewModel.error, viewModel.employees.isEmpty {
                ErrorView(error) {
                    Task { await viewModel.loadTeam() }
                }
            } else if viewModel.filteredEmployees.isEmpty {
                EmptyStateView(
                    icon: "person.3",
                    title: "No Team Members",
                    message: searchText.isEmpty ? 
                        "No team members to display." :
                        "No results for '\(searchText)'"
                )
            } else {
                teamList
            }
        }
        .task {
            await viewModel.loadTeam()
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Team")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            
            Spacer()
            
            Text("\(viewModel.employees.count) members")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            
            TextField("Search team members...", text: $searchText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .foregroundStyle(.primary)
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.bottom, 16)
        .onChange(of: searchText) { _, newValue in
            viewModel.searchQuery = newValue
        }
    }
    
    // MARK: - Team List
    
    private var teamList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredEmployees) { employee in
                    TeamMemberCard(employee: employee)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

// MARK: - Team Member Card

struct TeamMemberCard: View {
    let employee: Employee
    
    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(employee.avatarColor.opacity(0.3))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(employee.initials)
                        .font(.headline)
                        .foregroundStyle(employee.avatarColor)
                )
                .surfaceBackground(in: Circle())
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(employee.displayName)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                if let designation = employee.designation {
                    Text(designation)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                if let department = employee.department {
                    HStack(spacing: 4) {
                        Image(systemName: "building.2")
                            .font(.caption2)
                        Text(department)
                    }
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            // Status or Action
            VStack(alignment: .trailing, spacing: 4) {
                if employee.isActive == true {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                }
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - ViewModel

@MainActor
final class TeamViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var employees: [Employee] = []
    @Published var searchQuery = ""
    
    private let employeeService = EmployeeService.shared
    
    var filteredEmployees: [Employee] {
        if searchQuery.isEmpty {
            return employees
        }
        return employees.filter { employee in
            employee.displayName.localizedCaseInsensitiveContains(searchQuery) ||
            (employee.email.localizedCaseInsensitiveContains(searchQuery)) ||
            (employee.department?.localizedCaseInsensitiveContains(searchQuery) ?? false)
        }
    }
    
    func loadTeam() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await employeeService.getTeamMembers()
            employees = response.allEmployees
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        TeamListView()
    }
}
