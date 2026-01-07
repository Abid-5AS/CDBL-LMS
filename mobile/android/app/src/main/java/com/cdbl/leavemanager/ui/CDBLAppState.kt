package com.cdbl.leavemanager.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.navigation.NavDestination
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navOptions
import com.cdbl.leavemanager.ui.navigation.TopLevelDestination
import kotlinx.coroutines.CoroutineScope
import com.cdbl.leavemanager.data.local.TokenManager
import com.cdbl.leavemanager.util.NetworkMonitor
import com.cdbl.leavemanager.util.JwtUtils
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

@Composable
fun rememberCDBLAppState(
    networkMonitor: NetworkMonitor,
    tokenManager: TokenManager,
    coroutineScope: CoroutineScope = rememberCoroutineScope(),
    navController: NavHostController = rememberNavController(),
): CDBLAppState {
    return remember(
        navController,
        coroutineScope,
        networkMonitor,
        tokenManager
    ) {
        CDBLAppState(
            navController,
            coroutineScope,
            networkMonitor,
            tokenManager
        )
    }
}

@Stable
class CDBLAppState(
    val navController: NavHostController,
    val coroutineScope: CoroutineScope,
    networkMonitor: NetworkMonitor,
    private val tokenManager: TokenManager
) {
    val currentDestination: NavDestination?
        @Composable get() = navController
            .currentBackStackEntryAsState().value?.destination

    val currentTopLevelDestination: TopLevelDestination?
        @Composable get() = when (currentDestination?.route) {
            TopLevelDestination.DASHBOARD.route -> TopLevelDestination.DASHBOARD
            TopLevelDestination.LEAVES.route -> TopLevelDestination.LEAVES
            TopLevelDestination.HOLIDAYS.route -> TopLevelDestination.HOLIDAYS
            TopLevelDestination.APPROVALS.route -> TopLevelDestination.APPROVALS
            TopLevelDestination.PROFILE.route -> TopLevelDestination.PROFILE
            else -> null
        }

    val isOnline = networkMonitor.isOnline
        .map { it }
        .stateIn(
            scope = coroutineScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = true
        )
        
    val token = tokenManager.tokenFlow // Assuming TokenManager has a flow, or we create one
        .stateIn(
            scope = coroutineScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = tokenManager.getToken() ?: ""
        )

    val userRole = token
        .map { JwtUtils.getUserRole(it ?: "") }
        .stateIn(
            scope = coroutineScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = JwtUtils.getUserRole(tokenManager.getToken() ?: "")
        )

    fun topLevelDestinationsForRole(role: String?): List<TopLevelDestination> {
        return if (role == null || role == "EMPLOYEE") {
            listOf(
                TopLevelDestination.DASHBOARD,
                TopLevelDestination.LEAVES,
                TopLevelDestination.HOLIDAYS,
                TopLevelDestination.PROFILE
            )
        } else {
            listOf(
                TopLevelDestination.DASHBOARD,
                TopLevelDestination.LEAVES,
                TopLevelDestination.APPROVALS,
                TopLevelDestination.PROFILE
            )
        }
    }

    fun navigateToTopLevelDestination(topLevelDestination: TopLevelDestination) {
        val topLevelNavOptions = navOptions {
            // Pop up to the start destination of the graph to
            // avoid building up a large stack of destinations
            // on the back stack as users select items
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            // Avoid multiple copies of the same destination when
            // reselecting the same item
            launchSingleTop = true
            // Restore state when reselecting a previously selected item
            restoreState = true
        }

        when (topLevelDestination) {
            TopLevelDestination.DASHBOARD -> navController.navigate(topLevelDestination.route, topLevelNavOptions)
            TopLevelDestination.LEAVES -> navController.navigate(topLevelDestination.route, topLevelNavOptions)
            TopLevelDestination.HOLIDAYS -> navController.navigate(topLevelDestination.route, topLevelNavOptions)
            TopLevelDestination.APPROVALS -> navController.navigate(topLevelDestination.route, topLevelNavOptions)
            TopLevelDestination.PROFILE -> navController.navigate(topLevelDestination.route, topLevelNavOptions)
        }
    }
    
    fun logout() {
        tokenManager.clearToken()
        navController.navigate("login_route") {
            popUpTo(0) { inclusive = true }
        }
    }
}
