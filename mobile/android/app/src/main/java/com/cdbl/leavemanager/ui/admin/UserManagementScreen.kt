package com.cdbl.leavemanager.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.CreateUserRequest
import com.cdbl.leavemanager.data.model.UpdateUserRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    token: String,
    userId: Int?, // If null, we are creating a new user
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: AdminUsersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isEditing = userId != null
    val selectedUser = uiState.users.firstOrNull { it.id == userId }

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var empCode by remember { mutableStateOf("") }
    var department by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("EMPLOYEE") }

    LaunchedEffect(Unit) {
        if (uiState.users.isEmpty()) {
            viewModel.loadUsers(token)
        }
    }

    LaunchedEffect(selectedUser) {
        if (selectedUser != null) {
            name = selectedUser.name
            email = selectedUser.email
            empCode = selectedUser.empCode ?: ""
            department = selectedUser.department ?: ""
            role = selectedUser.role
        }
    }

    val roleOptions = if (isEditing) {
        listOf("EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN")
    } else {
        listOf("EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditing) "Edit User" else "Create User") },
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
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (isEditing && selectedUser == null && !uiState.isLoading) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text("Unable to load user details", color = MaterialTheme.colorScheme.error)
                }
            }

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Name") },
                enabled = !isEditing
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                enabled = !isEditing
            )
            OutlinedTextField(
                value = empCode,
                onValueChange = { empCode = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Employee Code") },
                enabled = !isEditing
            )
            OutlinedTextField(
                value = department,
                onValueChange = { department = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Department") }
            )

            var roleExpanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(expanded = roleExpanded, onExpandedChange = { roleExpanded = !roleExpanded }) {
                OutlinedTextField(
                    value = role,
                    onValueChange = {},
                    modifier = Modifier.fillMaxWidth().menuAnchor(),
                    label = { Text("Role") },
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = roleExpanded) }
                )
                ExposedDropdownMenu(expanded = roleExpanded, onDismissRequest = { roleExpanded = false }) {
                    roleOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option) },
                            onClick = {
                                role = option
                                roleExpanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    if (isEditing) {
                        viewModel.updateUser(
                            token,
                            userId.toString(),
                            UpdateUserRequest(role = role, department = department.ifBlank { null })
                        )
                    } else {
                        viewModel.createUser(
                            token,
                            CreateUserRequest(
                                name = name,
                                email = email,
                                empCode = empCode,
                                department = department.ifBlank { null },
                                role = role
                            )
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = !uiState.isLoading
            ) {
                Text(if (isEditing) "Update User" else "Create User")
            }

            uiState.message?.let {
                Text(it, color = MaterialTheme.colorScheme.primary)
                LaunchedEffect(it) { viewModel.clearMessage(); onSuccess() }
            }
            uiState.error?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
