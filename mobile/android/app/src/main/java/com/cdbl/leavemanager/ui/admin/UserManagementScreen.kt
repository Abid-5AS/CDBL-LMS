package com.cdbl.leavemanager.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.cdbl.leavemanager.data.model.User

// TODO: UserAdminViewModel not implemented yet, using stub
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    token: String,
    userToEdit: User?, // If null, we are creating a new user
    onBackClick: () -> Unit,
    onSuccess: () -> Unit
    // viewModel: UserAdminViewModel = hiltViewModel() // TODO: Not implemented yet
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (userToEdit != null) "Edit User" else "Create User") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Rounded.Person,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "User Management",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "This feature is not yet implemented",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
