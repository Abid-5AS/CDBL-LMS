package com.cdbl.leavemanager.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.cdbl.leavemanager.ui.CDBLAppState
import com.cdbl.leavemanager.ui.auth.LoginScreen
import com.cdbl.leavemanager.ui.dashboard.EmployeeDashboardScreen
import com.cdbl.leavemanager.ui.leaves.LeaveHistoryScreen
import com.cdbl.leavemanager.ui.profile.ProfileScreen
import com.cdbl.leavemanager.ui.approvals.ApprovalScreen
import com.cdbl.leavemanager.ui.balance.BalanceScreen
import com.cdbl.leavemanager.ui.calendar.TeamCalendarScreen
import com.cdbl.leavemanager.ui.holidays.HolidaysScreen

@Composable
fun CDBLNavHost(
    appState: CDBLAppState,
    modifier: Modifier = Modifier,
    startDestination: String = "login_route"
) {
    val navController = appState.navController
    val tokenState = appState.token.collectAsState()
    val token = tokenState.value ?: ""

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        composable("login_route") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(TopLevelDestination.DASHBOARD.route) {
                        popUpTo("login_route") { inclusive = true }
                    }
                }
            )
        }

        composable(TopLevelDestination.DASHBOARD.route) {
            EmployeeDashboardScreen(
                token = token,
                onNavigateToApply = { navController.navigate("apply_leave_route") },
                onNavigateToApprovals = { navController.navigate(TopLevelDestination.LEAVES.route) },
                onNavigateToEncashment = { navController.navigate("encashment_route") },
                onNavigateToLeaveDetails = { id ->
                    if (id == -1) {
                        navController.navigate(TopLevelDestination.LEAVES.route)
                    } else {
                        navController.navigate("leaves/$id")
                    }
                },
                onNavigateToHolidays = { navController.navigate(TopLevelDestination.HOLIDAYS.route) },
                onNavigateToBalance = { navController.navigate("balance_route") }
            )
        }

        composable(TopLevelDestination.LEAVES.route) {
            LeaveHistoryScreen(
                token = token,
                onApplyClick = { navController.navigate("apply_leave_route") },
                onEncashmentClick = { navController.navigate("encashment_route") },
                onLeaveClick = { id -> navController.navigate("leaves/$id") }
            )
        }

        composable(TopLevelDestination.APPROVALS.route) {
            ApprovalScreen(token = token)
        }

        composable(TopLevelDestination.HOLIDAYS.route) {
            HolidaysScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(TopLevelDestination.PROFILE.route) {
            ProfileScreen(
                token = token,
                onLogout = { appState.logout() },
                onNavigateToHolidays = { navController.navigate(TopLevelDestination.HOLIDAYS.route) },
                onNavigateToChangePassword = { navController.navigate("change_password_route") },
                onNavigateToEditProfile = { navController.navigate("edit_profile_route") },
                onNavigateToPolicies = { navController.navigate("policies_route") },
                onNavigateToHelp = { navController.navigate("help_route") }
            )
        }

        composable("apply_leave_route") {
            com.cdbl.leavemanager.ui.leaves.ApplyLeaveScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }

        composable("balance_route") {
            BalanceScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onNavigateToPolicies = { navController.navigate("policies_route") },
                onNavigateToApply = { navController.navigate("apply_leave_route") }
            )
        }

        composable("policies_route") {
            com.cdbl.leavemanager.ui.policy.PolicyScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("help_route") {
            com.cdbl.leavemanager.ui.help.HelpScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("admin_users_route") {
            com.cdbl.leavemanager.ui.admin.UserListScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onAddClick = { },
                onUserClick = { }
            )
        }

        composable("encashment_route") {
            com.cdbl.leavemanager.ui.encashment.EncashmentScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onRequestClick = { navController.navigate("request_encashment_route") }
            )
        }

        composable("request_encashment_route") {
            com.cdbl.leavemanager.ui.encashment.RequestEncashmentScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("change_password_route") {
            com.cdbl.leavemanager.ui.profile.ChangePasswordScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }

        composable("edit_profile_route") {
            com.cdbl.leavemanager.ui.profile.EditProfileScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }

        composable(
            route = "leaves/{leaveId}",
            arguments = listOf(
                navArgument("leaveId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val leaveId = backStackEntry.arguments?.getInt("leaveId") ?: 0
            com.cdbl.leavemanager.ui.leaves.LeaveDetailScreen(
                token = token,
                leaveId = leaveId,
                isManagerView = false,
                onBackClick = { navController.popBackStack() }
            )
        }

        // Optional: keep calendar screen reachable via deep link
        composable("calendar_route") {
            TeamCalendarScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
