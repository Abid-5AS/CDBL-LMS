package com.abid.cdbl_lms.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.ui.features.dashboard.DashboardScreen
import com.abid.cdbl_lms.ui.features.apply.ApplyLeaveScreen
import com.abid.cdbl_lms.ui.features.history.LeaveHistoryScreen
import com.abid.cdbl_lms.ui.features.balance.LeaveBalanceScreen
import com.abid.cdbl_lms.ui.features.settings.SettingsScreen
import com.abid.cdbl_lms.ui.features.pairsync.PairSyncHubScreen
import com.abid.cdbl_lms.ui.components.BottomNavigationBar

sealed class Screen(val route: String) {
    object Dashboard : Screen("dashboard")
    object ApplyLeave : Screen("apply_leave")
    object LeaveHistory : Screen("leave_history")
    object LeaveBalance : Screen("leave_balance")
    object Settings : Screen("settings")
    object PairSync : Screen("pair_sync")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    leaveRepository: LeaveRepository,
    balanceRepository: LeaveBalanceRepository
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            BottomNavigationBar(
                navController = navController,
                currentRoute = currentRoute
            )
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                navController = navController,
                leaveRepository = leaveRepository,
                balanceRepository = balanceRepository
            )
        }
        composable(Screen.ApplyLeave.route) {
            ApplyLeaveScreen(
                navController = navController,
                leaveRepository = leaveRepository,
                balanceRepository = balanceRepository
            )
        }
        composable(Screen.LeaveHistory.route) {
            LeaveHistoryScreen(
                navController = navController,
                leaveRepository = leaveRepository,
                balanceRepository = balanceRepository
            )
        }
        composable(Screen.LeaveBalance.route) {
            LeaveBalanceScreen(
                navController = navController,
                balanceRepository = balanceRepository
            )
        }
        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController)
        }
        composable(Screen.PairSync.route) {
            PairSyncHubScreen(navController = navController)
        }
        }
    }
}

