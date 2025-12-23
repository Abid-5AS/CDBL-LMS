package com.cdbl.leavemanager.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.CreateUserRequest
import com.cdbl.leavemanager.data.model.UpdateUserRequest
import com.cdbl.leavemanager.data.model.User
import com.cdbl.leavemanager.ui.dashboard.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    token: String,
    userToEdit: User?, // If null, we are creating a new user
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    var name by remember { mutableStateOf(userToEdit?.name ?: "") }
    var email by remember { mutableStateOf(userToEdit?.email ?: "") }
    var empCode by remember { mutableStateOf(userToEdit?.employeeId ?: "") }
    var department by remember { mutableStateOf(userToEdit?.department ?: "") }
    var role by remember { mutableStateOf(userToEdit?.role ?: "EMPLOYEE") }
    
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    val isEditMode = userToEdit != null
    val roles = listOf("EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN")
    
    // Dropdown state
    var expanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditMode) "Edit User" else "Create User") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            
            // Name (Read-only in edit mode typically for many systems, but let's allow edit if Create. 
            // Actually API Update only allows role/dept. So if Edit Mode, disable Name/Email/EmpCode)
            
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Full Name") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isEditMode
            )
            
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isEditMode
            )

            OutlinedTextField(
                value = empCode,
                onValueChange = { empCode = it },
                label = { Text("Employee ID") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isEditMode
            )

            OutlinedTextField(
                value = department,
                onValueChange = { department = it },
                label = { Text("Department") },
                modifier = Modifier.fillMaxWidth()
            )

            // Role Dropdown
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = it }
            ) {
                OutlinedTextField(
                    value = role,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Role") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    roles.forEach { r ->
                        DropdownMenuItem(
                            text = { Text(r) },
                            onClick = {
                                role = r
                                expanded = false
                            }
                        )
                    }
                }
            }
            
            if (isEditMode) {
                Text(
                    "Note: Only Role and Department can be updated for existing users.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (error != null) {
                Text(error!!, color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = {
                    isLoading = true
                    error = null
                    
                    if (isEditMode) {
                        val request = UpdateUserRequest(
                            role = role,
                            department = department
                        )
                        viewModel.updateUser(token, userToEdit!!.id, request, 
                            onSuccess = onSuccess,
                            onError = { 
                                isLoading = false
                                error = it
                            }
                        )
                    } else {
                        val request = CreateUserRequest(
                            name = name,
                            email = email,
                            empCode = empCode,
                            department = department,
                            role = role
                        )
                        viewModel.createUser(token, request,
                            onSuccess = onSuccess,
                            onError = { 
                                isLoading = false
                                error = it
                            }
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text(if (isEditMode) "Save Changes" else "Create User")
                }
            }
        }
    }
}
