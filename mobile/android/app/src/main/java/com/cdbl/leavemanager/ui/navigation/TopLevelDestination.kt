package com.cdbl.leavemanager.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.FlightTakeoff
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.ui.graphics.vector.ImageVector
import com.cdbl.leavemanager.R

/**
 * Type for the top level destinations in the application. Each of these destinations
 * can contain one or more screens (based on the window size). Navigation from one
 * screen to the next within a single destination will be handled directly in composables.
 */
enum class TopLevelDestination(
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val iconTextId: Int,
    val titleTextId: Int,
    val route: String
) {
    DASHBOARD(
        selectedIcon = Icons.Rounded.Dashboard,
        unselectedIcon = Icons.Rounded.Dashboard,
        iconTextId = R.string.nav_dashboard, // Ensure these strings exist or use placeholders
        titleTextId = R.string.nav_dashboard,
        route = "dashboard_route"
    ),
    LEAVES(
        selectedIcon = Icons.Rounded.History,
        unselectedIcon = Icons.Rounded.History,
        iconTextId = R.string.nav_leaves,
        titleTextId = R.string.nav_leaves,
        route = "leaves_route"
    ),
    HOLIDAYS(
        selectedIcon = Icons.Rounded.CalendarMonth,
        unselectedIcon = Icons.Rounded.CalendarMonth,
        iconTextId = R.string.nav_holidays,
        titleTextId = R.string.nav_holidays,
        route = "holidays_route"
    ),
    APPROVALS(
        selectedIcon = Icons.Rounded.FlightTakeoff, // Placeholder icon
        unselectedIcon = Icons.Rounded.FlightTakeoff,
        iconTextId = R.string.nav_approvals,
        titleTextId = R.string.nav_approvals,
        route = "approvals_route"
    ),
    PROFILE(
        selectedIcon = Icons.Rounded.Person,
        unselectedIcon = Icons.Rounded.Person,
        iconTextId = R.string.nav_profile,
        titleTextId = R.string.nav_profile,
        route = "profile_route"
    )
}
