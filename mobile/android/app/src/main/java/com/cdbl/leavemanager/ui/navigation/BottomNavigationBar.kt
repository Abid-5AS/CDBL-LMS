package com.cdbl.leavemanager.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Assignment
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Home", Icons.Rounded.Dashboard)
    object Leaves : Screen("leaves", "Leaves", Icons.Rounded.History)
    object Approvals : Screen("approvals", "Approvals", Icons.Rounded.Assignment)
    object Profile : Screen("profile", "Profile", Icons.Rounded.Person)
}

@Composable
fun BottomNavigationBar(
    currentRoute: String?,
    showApprovals: Boolean,
    onNavigate: (String) -> Unit
) {
    val items = mutableListOf(
        Screen.Dashboard,
        Screen.Leaves
    )

    if (showApprovals) {
        items.add(Screen.Approvals)
    }

    items.add(Screen.Profile)

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        items.forEach { screen ->
            val selected = currentRoute?.startsWith(screen.route) == true
            NavigationBarItem(
                icon = { Icon(screen.icon, contentDescription = screen.title) },
                label = { Text(screen.title) },
                selected = selected,
                onClick = {
                    onNavigate(screen.route)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
}
