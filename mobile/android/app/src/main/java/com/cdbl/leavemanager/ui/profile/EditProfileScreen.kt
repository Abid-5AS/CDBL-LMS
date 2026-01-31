package com.cdbl.leavemanager.ui.profile

import android.app.DatePickerDialog
import android.content.Context
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    token: String,
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var isLoading by remember { mutableStateOf(false) } // Local loading state for initial fetch/save
    
    // Form fields
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var permanentAddress by remember { mutableStateOf("") }
    var dob by remember { mutableStateOf("") }
    var bloodGroup by remember { mutableStateOf("") }
    var maritalStatus by remember { mutableStateOf("") }
    var nid by remember { mutableStateOf("") }
    var tin by remember { mutableStateOf("") }
    
    // Load initial data
    LaunchedEffect(Unit) {
        viewModel.loadProfileDetails(token)
    }

    LaunchedEffect(uiState.userDetails) {
        uiState.userDetails?.profile?.let { profile ->
            phone = profile.phone ?: ""
            address = profile.address ?: ""
            permanentAddress = profile.permanentAddress ?: ""
            dob = profile.dob?.substringBefore("T") ?: "" // specific to YYYY-MM-DD
            bloodGroup = profile.bloodGroup ?: ""
            maritalStatus = profile.maritalStatus ?: ""
            nid = profile.nid ?: ""
            tin = profile.tin ?: ""
        }
    }
    
    LaunchedEffect(uiState.isLoading) {
        isLoading = uiState.isLoading
    }

    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit Personal Info") },
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
            
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone Number") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("Current Address") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 4,
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = permanentAddress,
                onValueChange = { permanentAddress = it },
                label = { Text("Permanent Address") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 4,
                shape = RoundedCornerShape(12.dp)
            )

            // Date Picker for DOB
            val interactionSource = remember { MutableInteractionSource() }
            OutlinedTextField(
                value = dob,
                onValueChange = { },
                label = { Text("Date of Birth (YYYY-MM-DD)") },
                modifier = Modifier.fillMaxWidth()
                    .clickable(
                        interactionSource = interactionSource,
                        indication = null,
                        onClick = {
                            showDatePicker(context) { date -> dob = date }
                        }
                    ),
                readOnly = true,
                trailingIcon = {
                    IconButton(onClick = { showDatePicker(context) { date -> dob = date } }) {
                        Icon(Icons.Rounded.CalendarToday, contentDescription = "Select Date")
                    }
                },
                enabled = false, // user click handled by clickable modifier
                colors = OutlinedTextFieldDefaults.colors(
                    disabledTextColor = MaterialTheme.colorScheme.onSurface,
                    disabledBorderColor = MaterialTheme.colorScheme.outline,
                    disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                ),
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = bloodGroup,
                onValueChange = { bloodGroup = it },
                label = { Text("Blood Group") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = maritalStatus,
                onValueChange = { maritalStatus = it },
                label = { Text("Marital Status") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            
            OutlinedTextField(
                value = nid,
                onValueChange = { nid = it },
                label = { Text("National ID (NID)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            
            OutlinedTextField(
                value = tin,
                onValueChange = { tin = it },
                label = { Text("TIN") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    val data = mapOf(
                        "phone" to phone,
                        "address" to address,
                        "permanentAddress" to permanentAddress,
                        "dob" to dob.takeIf { it.isNotBlank() },
                        "bloodGroup" to bloodGroup,
                        "maritalStatus" to maritalStatus,
                        "nid" to nid,
                        "tin" to tin
                    )
                    
                    viewModel.updatePersonalProfile(
                        token, 
                        data, 
                        onSuccess = onSuccess,
                        onError = { /* ViewModel handles error state, can show toast here if passed back */ }
                    )
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = !isLoading,
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Icon(Icons.Rounded.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Changes")
                }
            }
        }
    }
}

fun showDatePicker(context: Context, onDateSelected: (String) -> Unit) {
    val calendar = Calendar.getInstance()
    DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formattedDate = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            onDateSelected(formattedDate)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    ).show()
}
