package com.cdbl.leavemanager.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.cdbl.leavemanager.ui.CDBLAppState
import com.cdbl.leavemanager.ui.auth.LoginScreen
import com.cdbl.leavemanager.ui.dashboard.EmployeeDashboardScreen
import com.cdbl.leavemanager.ui.leaves.LeaveHistoryScreen
import com.cdbl.leavemanager.ui.profile.ProfileScreen
import com.cdbl.leavemanager.ui.approvals.ApprovalScreen
// Import other screens as needed

@Composable
fun CDBLNavHost(
    appState: CDBLAppState,
    modifier: Modifier = Modifier,
    startDestination: String = "login_route"
) {
    val navController = appState.navController
    // Get the current token from the app state
    val tokenState = appState.token.collectAsState()
    val token = tokenState.value ?: ""

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Login Graph
        composable("login_route") {
            LoginScreen(
                onLoginSuccess = { newToken ->
                     // Token is automatically updated in TokenManager by LoginViewModel (assuming)
                     // or we can manually update it if LoginScreen callback passes it
                     // Assuming LoginScreen callback passes it:
                     // We probably don't need to do anything if TokenManager is singleton and updated.
                     // But for safety let's navigate.
                     navController.navigate(TopLevelDestination.DASHBOARD.route) {
                        popUpTo("login_route") { inclusive = true }
                    }
                }
            )
        }

        // Dashboard Graph
        composable(TopLevelDestination.DASHBOARD.route) {
             EmployeeDashboardScreen(
                token = token,
                onNavigateToApply = { navController.navigate("apply_leave_route") },
                onNavigateToApprovals = { navController.navigate(TopLevelDestination.APPROVALS.route) },
                onNavigateToEncashment = { navController.navigate("encashment_route") },
                onNavigateToLeaveDetails = { id -> 
                    // If -1, go to list, else detail
                    if (id == -1) {
                        navController.navigate(TopLevelDestination.LEAVES.route)
                    } else {
                        navController.navigate("leaves/$id") 
                    }
                },
                onNavigateToHolidays = { navController.navigate("holidays_route") }
             )
        }

        // Leaves Graph
        composable(TopLevelDestination.LEAVES.route) {
             LeaveHistoryScreen(
                token = token,
                onApplyClick = { navController.navigate("apply_leave_route") },
                onEncashmentClick = { navController.navigate("encashment_route") },
                onLeaveClick = { id -> navController.navigate("leaves/$id") }
             )
        }
        
        // Approvals Graph
        composable(TopLevelDestination.APPROVALS.route) {
            ApprovalScreen(token = token)
        }

        // Profile Graph
        composable(TopLevelDestination.PROFILE.route) {
            ProfileScreen(
                token = token,
                onLogout = { appState.logout() },
                onNavigateToHolidays = { navController.navigate("holidays_route") },
                onNavigateToChangePassword = { navController.navigate("change_password_route") },
                onNavigateToEditProfile = { navController.navigate("edit_profile_route") },
                onNavigateToPolicies = { navController.navigate("policies_route") },
                onNavigateToHelp = { navController.navigate("help_route") }
            )
        }
        
        // Other routes...
        composable("apply_leave_route") {
             com.cdbl.leavemanager.ui.leaves.ApplyLeaveScreen(
                token = token,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
             )
        }
        
        composable("holidays_route") {
            com.cdbl.leavemanager.ui.holidays.HolidaysScreen(
                token = token,
                onBackClick = { navController.popBackStack() }
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
        
        // Admin
         composable("admin_users_route") {
              com.cdbl.leavemanager.ui.admin.UserListScreen(
                   token = token,
                   onBackClick = { navController.popBackStack() },
                   onAddClick = { /* Navigate to add user */ },
                   onUserClick = { /* Navigate to edit user */ }
              )
         }
         
         // Encashment
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
                 androidx.navigation.navArgument("leaveId") { type = androidx.navigation.NavType.IntType }
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

    }
}
