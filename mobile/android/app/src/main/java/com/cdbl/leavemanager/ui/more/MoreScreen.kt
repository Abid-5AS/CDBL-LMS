package com.cdbl.leavemanager.ui.more

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Help
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import com.cdbl.leavemanager.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoreScreen(
    onNavigateToProfile: () -> Unit,
    onNavigateToLeaves: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToHolidays: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onNavigateToPolicies: () -> Unit,
    onNavigateToHelp: () -> Unit,
    onNavigateToFeedback: () -> Unit,
    onNavigateToTerms: () -> Unit,
    onNavigateToPrivacy: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.more_title)) })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            MoreItem(Icons.Rounded.Person, stringResource(R.string.profile_title), onNavigateToProfile)
            MoreItem(Icons.Rounded.History, stringResource(R.string.nav_leaves), onNavigateToLeaves)
            MoreItem(Icons.Rounded.Notifications, stringResource(R.string.notifications), onNavigateToNotifications)
            MoreItem(Icons.Rounded.Settings, stringResource(R.string.settings), onNavigateToSettings)
            MoreItem(Icons.Rounded.CalendarMonth, stringResource(R.string.holidays), onNavigateToHolidays)
            MoreItem(Icons.Rounded.CalendarMonth, stringResource(R.string.calendar_integration), onNavigateToCalendar)
            MoreItem(Icons.Rounded.Description, stringResource(R.string.policies), onNavigateToPolicies)
            MoreItem(Icons.Rounded.Help, stringResource(R.string.help_support), onNavigateToHelp)
            MoreItem(Icons.Rounded.Email, stringResource(R.string.feedback), onNavigateToFeedback)
            MoreItem(Icons.Rounded.Description, stringResource(R.string.terms), onNavigateToTerms)
            MoreItem(Icons.Rounded.Lock, stringResource(R.string.privacy), onNavigateToPrivacy)
        }
    }
}

@Composable
private fun MoreItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Card(onClick = onClick) {
        Row(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null)
            Spacer(modifier = Modifier.width(12.dp))
            Text(title, style = MaterialTheme.typography.titleMedium)
        }
    }
}
