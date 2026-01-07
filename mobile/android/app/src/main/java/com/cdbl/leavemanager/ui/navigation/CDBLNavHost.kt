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
import com.cdbl.leavemanager.ui.dashboard.AdminDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.CEODashboardScreen
import com.cdbl.leavemanager.ui.dashboard.EmployeeDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.HRDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.HRHeadDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.ManagerDashboardScreen
import com.cdbl.leavemanager.ui.leaves.LeaveHistoryScreen
import com.cdbl.leavemanager.ui.profile.ProfileScreen
import com.cdbl.leavemanager.ui.approvals.ApprovalScreen
import com.cdbl.leavemanager.ui.balance.BalanceScreen
import com.cdbl.leavemanager.ui.calendar.TeamCalendarScreen
import com.cdbl.leavemanager.ui.holidays.HolidaysScreen
import com.cdbl.leavemanager.ui.employees.EmployeeDetailScreen
import com.cdbl.leavemanager.ui.employees.EmployeeListScreen
import com.cdbl.leavemanager.ui.notifications.NotificationsScreen
import com.cdbl.leavemanager.ui.reports.ReportsScreen
import com.cdbl.leavemanager.ui.admin.AdminHomeScreen
import com.cdbl.leavemanager.ui.admin.AuditLogsScreen
import com.cdbl.leavemanager.ui.admin.HrisSyncScreen
import com.cdbl.leavemanager.ui.admin.WebhooksScreen
import com.cdbl.leavemanager.ui.admin.WorkflowPoliciesScreen
import com.cdbl.leavemanager.ui.legal.FeedbackScreen
import com.cdbl.leavemanager.ui.legal.PrivacyScreen
import com.cdbl.leavemanager.ui.legal.TermsScreen
import com.cdbl.leavemanager.ui.more.MoreScreen
import com.cdbl.leavemanager.ui.settings.CalendarIntegrationScreen
import com.cdbl.leavemanager.ui.settings.DelegationScreen
import com.cdbl.leavemanager.ui.settings.SettingsScreen

@Composable
fun CDBLNavHost(
    appState: CDBLAppState,
    modifier: Modifier = Modifier,
    startDestination: String = "login_route"
) {
    val navController = appState.navController
    val tokenState = appState.token.collectAsState()
    val token = tokenState.value ?: ""
    val roleState = appState.userRole.collectAsState()
    val role = roleState.value

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
            when (role) {
                "DEPT_HEAD" -> ManagerDashboardScreen(
                    token = token,
                    onNavigateToApprovals = { navController.navigate(TopLevelDestination.APPROVALS.route) },
                    onNavigateToDetail = { id -> navController.navigate("leaves/$id") }
                )
                "HR_ADMIN" -> HRDashboardScreen(token = token)
                "HR_HEAD" -> HRHeadDashboardScreen(token = token)
                "CEO" -> CEODashboardScreen(token = token)
                "SYSTEM_ADMIN" -> AdminDashboardScreen(
                    token = token,
                    onNavigateToUsers = { navController.navigate("admin_users_route") }
                )
                else -> EmployeeDashboardScreen(
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

        composable(TopLevelDestination.TEAM.route) {
            EmployeeListScreen(
                token = token,
                onEmployeeClick = { id -> navController.navigate("employees/$id") }
            )
        }

        composable(TopLevelDestination.REPORTS.route) {
            ReportsScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(TopLevelDestination.ADMIN.route) {
            AdminHomeScreen(
                token = token,
                onNavigateToUsers = { navController.navigate("admin_users_route") },
                onNavigateToAuditLogs = { navController.navigate("audit_logs_route") },
                onNavigateToWorkflowPolicies = { navController.navigate("workflow_policies_route") },
                onNavigateToHris = { navController.navigate("hris_sync_route") },
                onNavigateToWebhooks = { navController.navigate("webhooks_route") }
            )
        }

        composable(TopLevelDestination.MORE.route) {
            MoreScreen(
                onNavigateToProfile = { navController.navigate(TopLevelDestination.PROFILE.route) },
                onNavigateToLeaves = { navController.navigate(TopLevelDestination.LEAVES.route) },
                onNavigateToNotifications = { navController.navigate("notifications_route") },
                onNavigateToSettings = { navController.navigate("settings_route") },
                onNavigateToHolidays = { navController.navigate(TopLevelDestination.HOLIDAYS.route) },
                onNavigateToCalendar = { navController.navigate("calendar_route") },
                onNavigateToPolicies = { navController.navigate("policies_route") },
                onNavigateToHelp = { navController.navigate("help_route") },
                onNavigateToFeedback = { navController.navigate("feedback_route") },
                onNavigateToTerms = { navController.navigate("terms_route") },
                onNavigateToPrivacy = { navController.navigate("privacy_route") }
            )
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
                onNavigateToHelp = { navController.navigate("help_route") },
                onNavigateToNotifications = { navController.navigate("notifications_route") },
                onNavigateToSettings = { navController.navigate("settings_route") }
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

        composable("feedback_route") {
            FeedbackScreen(onBackClick = { navController.popBackStack() })
        }

        composable("terms_route") {
            TermsScreen(onBackClick = { navController.popBackStack() })
        }

        composable("privacy_route") {
            PrivacyScreen(onBackClick = { navController.popBackStack() })
        }

        composable("admin_users_route") {
            com.cdbl.leavemanager.ui.admin.UserListScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onAddClick = { navController.navigate("admin_user_create_route") },
                onUserClick = { user -> navController.navigate("admin_users/${user.id}") }
            )
        }

        composable("admin_user_create_route") {
            com.cdbl.leavemanager.ui.admin.UserManagementScreen(
                token = token,
                userId = null,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }

        composable(
            route = "admin_users/{userId}",
            arguments = listOf(navArgument("userId") { type = NavType.IntType })
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getInt("userId") ?: 0
            com.cdbl.leavemanager.ui.admin.UserManagementScreen(
                token = token,
                userId = userId,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
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

        composable(
            route = "employees/{employeeId}",
            arguments = listOf(navArgument("employeeId") { type = NavType.IntType })
        ) { backStackEntry ->
            val employeeId = backStackEntry.arguments?.getInt("employeeId") ?: 0
            EmployeeDetailScreen(
                token = token,
                employeeId = employeeId,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("notifications_route") {
            NotificationsScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("settings_route") {
            SettingsScreen(
                onNavigateToDelegation = { navController.navigate("delegation_route") },
                onNavigateToCalendarIntegration = { navController.navigate("calendar_integration_route") },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("delegation_route") {
            DelegationScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("calendar_integration_route") {
            CalendarIntegrationScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("audit_logs_route") {
            AuditLogsScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("workflow_policies_route") {
            WorkflowPoliciesScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("hris_sync_route") {
            HrisSyncScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("webhooks_route") {
            WebhooksScreen(
                token = token,
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
