package com.cdbl.leavemanager.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.User
import com.cdbl.leavemanager.ui.dashboard.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserListScreen(
    token: String,
    onBackClick: () -> Unit,
    onUserClick: (User) -> Unit,
    onAddClick: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val usersResult by viewModel.users.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.fetchUsers(token)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Manage Users") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddClick) {
                Icon(Icons.Rounded.Add, contentDescription = "Add User")
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search by name or email") },
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                singleLine = true
            )

            // Content
            if (usersResult == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                usersResult!!.onSuccess { users ->
                     val filteredUsers = users.filter { 
                        it.name?.contains(searchQuery, ignoreCase = true) == true || 
                        it.email.contains(searchQuery, ignoreCase = true)
                    }

                    LazyColumn {
                        items(filteredUsers) { user ->
                            ListItem(
                                headlineContent = { Text(user.name ?: "Unknown") },
                                supportingContent = { Text("${user.email} • ${user.role}") },
                                leadingContent = {
                                    Icon(Icons.Rounded.Person, contentDescription = null)
                                },
                                modifier = Modifier.clickable { onUserClick(user) }
                            )
                            HorizontalDivider()
                        }
                        if (filteredUsers.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
                                    Text("No users found", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }.onFailure {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                        Text("Failed to load users: ${it.message}", color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}
