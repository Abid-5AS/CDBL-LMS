package com.cdbl.leavemanager.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Home", Icons.Filled.Home)
    object Leaves : Screen("leaves", "Leaves", Icons.Filled.DateRange)
    object Approvals : Screen("approvals", "Approvals", Icons.Filled.Assignment)
    object Profile : Screen("profile", "Profile", Icons.Filled.Person)
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

    NavigationBar {
        items.forEach { screen ->
            NavigationBarItem(
                icon = { Icon(screen.icon, contentDescription = screen.title) },
                label = { Text(screen.title) },
                selected = currentRoute?.startsWith(screen.route) == true,
                onClick = {
                    onNavigate(screen.route)
                }
            )
        }
    }
}
