package com.cdbl.leavemanager.ui.encashment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestEncashmentScreen(
    token: String,
    onBackClick: () -> Unit,
    viewModel: EncashmentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var days by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    // Handle success effect
    LaunchedEffect(uiState.requestSuccess) {
        uiState.requestSuccess?.let {
            snackbarHostState.showSnackbar(it)
            delay(1500) // Wait for snackbar
            viewModel.clearSuccessMessage()
            onBackClick() // Go back after success
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Request Encashment") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Apply for Earned Leave Encashment",
                style = MaterialTheme.typography.titleMedium
            )

            OutlinedTextField(
                value = days,
                onValueChange = { if (it.all { char -> char.isDigit() }) days = it },
                label = { Text("Days to Encash") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it },
                label = { Text("Reason (Optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )

            if (uiState.error != null) {
                Text(
                    text = uiState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = {
                    val daysInt = days.toIntOrNull()
                    if (daysInt != null && daysInt > 0) {
                        viewModel.submitRequest(token, daysInt, reason)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = days.isNotBlank() && !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Submit Request")
                }
            }
        }
    }
}
