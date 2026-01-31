package com.cdbl.leavemanager.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*

data class AdminMenuItem(
    val icon: ImageVector,
    val title: String,
    val subtitle: String,
    val color: Color,
    val onClick: () -> Unit
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminHomeScreen(
    token: String,
    onNavigateToUsers: () -> Unit,
    onNavigateToAuditLogs: () -> Unit,
    onNavigateToWorkflowPolicies: () -> Unit,
    onNavigateToHris: () -> Unit,
    onNavigateToWebhooks: () -> Unit,
    onNavigateToSystemTools: () -> Unit
) {
    val menuItems = listOf(
        AdminMenuItem(
            icon = Icons.Rounded.People,
            title = stringResource(R.string.admin_users),
            subtitle = "Manage all users",
            color = Indigo600,
            onClick = onNavigateToUsers
        ),
        AdminMenuItem(
            icon = Icons.Rounded.ListAlt,
            title = stringResource(R.string.audit_log_title),
            subtitle = "View activity logs",
            color = Blue500,
            onClick = onNavigateToAuditLogs
        ),
        AdminMenuItem(
            icon = Icons.Rounded.Settings,
            title = stringResource(R.string.workflow_policies),
            subtitle = "Configure workflows",
            color = SuccessGreen,
            onClick = onNavigateToWorkflowPolicies
        ),
        AdminMenuItem(
            icon = Icons.Rounded.CloudSync,
            title = stringResource(R.string.hris_sync),
            subtitle = "Sync employee data",
            color = WarningAmber,
            onClick = onNavigateToHris
        ),
        AdminMenuItem(
            icon = Icons.Rounded.Webhook,
            title = stringResource(R.string.webhooks),
            subtitle = "Integration hooks",
            color = Purple600,
            onClick = onNavigateToWebhooks
        ),
        AdminMenuItem(
            icon = Icons.Rounded.AdminPanelSettings,
            title = stringResource(R.string.system_admin_tools),
            subtitle = "System configuration",
            color = ErrorRed,
            onClick = onNavigateToSystemTools
        )
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.admin_tools)) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Header Stats
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    AdminStatItem("Users", "156", Icons.Rounded.People)
                    AdminStatItem("Active", "142", Icons.Rounded.CheckCircle)
                    AdminStatItem("Pending", "8", Icons.Rounded.Pending)
                }
            }

            // Admin Menu Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(menuItems) { item ->
                    AdminMenuCard(item)
                }
            }
        }
    }
}

@Composable
private fun AdminStatItem(
    label: String,
    value: String,
    icon: ImageVector
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
            icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminMenuCard(item: AdminMenuItem) {
    Card(
        onClick = item.onClick,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(item.color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    item.icon,
                    contentDescription = null,
                    tint = item.color,
                    modifier = Modifier.size(24.dp)
                )
            }
            Column {
                Text(
                    item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1
                )
                Text(
                    item.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
        }
    }
}
