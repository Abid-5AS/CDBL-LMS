package com.cdbl.leavemanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import com.cdbl.leavemanager.ui.auth.LoginScreen
import com.cdbl.leavemanager.ui.dashboard.EmployeeDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.ManagerDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.HRDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.AdminDashboardScreen
import com.cdbl.leavemanager.ui.dashboard.CEODashboardScreen
import com.cdbl.leavemanager.ui.dashboard.HRHeadDashboardScreen
import com.cdbl.leavemanager.ui.profile.ChangePasswordScreen
import com.cdbl.leavemanager.ui.profile.EditProfileScreen
import com.cdbl.leavemanager.ui.admin.UserListScreen
import com.cdbl.leavemanager.ui.admin.UserManagementScreen
import com.cdbl.leavemanager.ui.policy.PolicyScreen
import com.cdbl.leavemanager.ui.help.HelpScreen
import com.cdbl.leavemanager.ui.leaves.LeaveHistoryScreen
import com.cdbl.leavemanager.ui.leaves.ApplyLeaveScreen
import com.cdbl.leavemanager.ui.approvals.ApprovalScreen
import com.cdbl.leavemanager.ui.profile.ProfileScreen
import com.cdbl.leavemanager.ui.navigation.BottomNavigationBar
import com.cdbl.leavemanager.ui.navigation.Screen
import com.cdbl.leavemanager.ui.theme.CDBLLeaveManagerTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @javax.inject.Inject
    lateinit var networkMonitor: com.cdbl.leavemanager.util.NetworkMonitor

    @javax.inject.Inject
    lateinit var tokenManager: com.cdbl.leavemanager.data.local.TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CDBLLeaveManagerTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                // Manage token state at top level
                var token by remember { mutableStateOf(tokenManager.getToken() ?: "") }
                
                // Monitor network
                val isOnline by networkMonitor.isOnline.collectAsState(initial = true)
                
                val role = com.cdbl.leavemanager.util.JwtUtils.getUserRole(token)
                val isApprover = role in listOf("DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN")
                // ... (abbreviated for tool call, assuming surrounding code matches)

                // Determine if we should show bottom bar
                val showBottomBar = currentRoute in listOf(
                    Screen.Dashboard.route,
                    Screen.Leaves.route,
                    Screen.Approvals.route,
                    Screen.Profile.route
                )

                androidx.compose.foundation.layout.Column(
                    modifier = Modifier.androidx.compose.foundation.layout.fillMaxSize()
                ) {
                     com.cdbl.leavemanager.ui.components.OfflineIndicator(isOnline = isOnline)
                     
                     Scaffold(
                        bottomBar = {
                            if (showBottomBar) {
                                BottomNavigationBar(
                                    currentRoute = currentRoute,
                                    showApprovals = isApprover,
                                    onNavigate = { route ->
                                        if (token.isNotEmpty()) {
                                            navController.navigate(route) {
                                                popUpTo(Screen.Dashboard.route) {
                                                    saveState = true
                                                }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    ) { innerPadding ->
                        NavHost(
                            navController = navController,
                            startDestination = if (token.isNotEmpty()) Screen.Dashboard.route else "login",
                            modifier = Modifier.padding(innerPadding),
                            enterTransition = { slideInHorizontally(initialOffsetX = { 1000 }, animationSpec = tween(500)) + fadeIn(animationSpec = tween(500)) },
                            exitTransition = { slideOutHorizontally(targetOffsetX = { -1000 }, animationSpec = tween(500)) + fadeOut(animationSpec = tween(500)) },
                            popEnterTransition = { slideInHorizontally(initialOffsetX = { -1000 }, animationSpec = tween(500)) + fadeIn(animationSpec = tween(500)) },
                            popExitTransition = { slideOutHorizontally(targetOffsetX = { 1000 }, animationSpec = tween(500)) + fadeOut(animationSpec = tween(500)) }
                        ) {
                        composable("login") {
                            LoginScreen(onLoginSuccess = { newToken ->
                                token = newToken
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo("login") { inclusive = true }
                                }
                            })
                        }

                        composable(Screen.Dashboard.route) {
                            when (role) {
                                "DEPT_HEAD" -> ManagerDashboardScreen(
                                    token = token,
                                    onNavigateToApprovals = { navController.navigate(Screen.Approvals.route) },
                                    onNavigateToDetail = { leaveId -> navController.navigate("leaves/$leaveId?isManager=true") }
                                )
                                "HR_ADMIN" -> HRDashboardScreen(token = token)
                                "HR_HEAD" -> HRHeadDashboardScreen(token = token)
                                "SYSTEM_ADMIN" -> AdminDashboardScreen(
                                    token = token,
                                    onNavigateToUsers = { navController.navigate("admin/users") }
                                )
                                "CEO" -> CEODashboardScreen(token = token)
                                else -> EmployeeDashboardScreen(
                                    token = token,
                                    onNavigateToApply = { navController.navigate("apply-leave") },
                                    onNavigateToEncashment = { navController.navigate("encashment") },
                                    onNavigateToApprovals = { navController.navigate(Screen.Approvals.route) },
                                    onNavigateToLeaveDetails = { leaveId -> navController.navigate("leaves/$leaveId") }
                                )
                            }
                        }

                        composable(Screen.Leaves.route) {
                            LeaveHistoryScreen(
                                token = token,
                                onBackClick = null,
                                onApplyClick = { navController.navigate("apply-leave") },
                                onEncashmentClick = { navController.navigate("encashment") },
                                onLeaveClick = { leaveId -> navController.navigate("leaves/$leaveId") }
                            )
                        }

                        composable(Screen.Approvals.route) {
                            ApprovalScreen(
                                token = token,
                                onBackClick = null
                            )
                        }

                        composable(Screen.Profile.route) {
                            ProfileScreen(
                            token = token,
                            onLogout = {
                                tokenManager.clearToken()
                                token = ""
                                role = ""
                                navController.navigate("login") { popUpTo(0) }
                            },
                            onNavigateToHolidays = { navController.navigate("holidays") },
                            onNavigateToChangePassword = { navController.navigate("change-password") },
                            onNavigateToEditProfile = { navController.navigate("edit-profile") },
                            onNavigateToPolicies = { navController.navigate("policies") },
                            onNavigateToHelp = { navController.navigate("help") }
                        )
                    }
                    composable("policies") {
                        PolicyScreen(onBackClick = { navController.popBackStack() })
                    }
                    composable("help") {
                        HelpScreen(onBackClick = { navController.popBackStack() })
                    }
                    composable("edit-profile") {
                         if (token.isEmpty()) {
                            navController.navigate("login") { popUpTo(0) }
                        } else {
                            EditProfileScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() },
                                onSuccess = {
                                    android.widget.Toast.makeText(this@MainActivity, "Profile updated successfully", android.widget.Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                    composable("holidays") {
                        if (token.isEmpty()) {
                            navController.navigate("login") { popUpTo(0) }
                        } else {
                            HolidaysScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() }
                            )
                        }
                    }
                    composable("change-password") {
                        if (token.isEmpty()) {
                            navController.navigate("login") { popUpTo(0) }
                        } else {
                            ChangePasswordScreen(
                                token,
                                onBackClick = { navController.popBackStack() },
                                onSuccess = {
                                    android.widget.Toast.makeText(this@MainActivity, "Password changed successfully", android.widget.Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }
                    }    
                        composable("apply-leave") {
                            ApplyLeaveScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() },
                                onSuccess = { 
                                    navController.popBackStack() 
                                }
                            )
                        }

                        composable(
                            route = "leaves/{leaveId}?isManager={isManager}",
                            arguments = listOf(
                                androidx.navigation.navArgument("leaveId") { type = androidx.navigation.NavType.IntType },
                                androidx.navigation.navArgument("isManager") { 
                                    type = androidx.navigation.NavType.BoolType
                                    defaultValue = false
                                }
                            )
                        ) { backStackEntry ->
                            val leaveId = backStackEntry.arguments?.getInt("leaveId") ?: 0
                            val isManager = backStackEntry.arguments?.getBoolean("isManager") ?: false
                            com.cdbl.leavemanager.ui.leaves.LeaveDetailScreen(
                                token = token,
                                leaveId = leaveId,
                                isManagerView = isManager,
                                onBackClick = { navController.popBackStack() }
                            )
                        }
                        
                        composable("encashment") {
                            com.cdbl.leavemanager.ui.encashment.EncashmentScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() },
                                onRequestClick = { navController.navigate("request_encashment") }
                            )
                        }
                        
                        composable("request_encashment") {
                            com.cdbl.leavemanager.ui.encashment.RequestEncashmentScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() }
                            )
                        }

                        composable("admin/users") {
                            com.cdbl.leavemanager.ui.admin.UserListScreen(
                                token = token,
                                onBackClick = { navController.popBackStack() },
                                onAddClick = { navController.navigate("admin/users/manage") },
                                onUserClick = { user ->
                                    val userJson = android.net.Uri.encode(com.google.gson.Gson().toJson(user))
                                    navController.navigate("admin/users/manage?user=$userJson")
                                }
                            )
                        }

                        composable(
                            route = "admin/users/manage?user={user}",
                            arguments = listOf(
                                androidx.navigation.navArgument("user") { 
                                    type = androidx.navigation.NavType.StringType 
                                    nullable = true
                                    defaultValue = null
                                }
                            )
                        ) { backStackEntry ->
                            val userJson = backStackEntry.arguments?.getString("user")
                            val userToEdit = if (userJson != null) {
                                com.google.gson.Gson().fromJson(userJson, com.cdbl.leavemanager.data.model.User::class.java)
                            } else null

                            com.cdbl.leavemanager.ui.admin.UserManagementScreen(
                                token = token,
                                userToEdit = userToEdit,
                                onBackClick = { navController.popBackStack() },
                                onSuccess = {
                                    android.widget.Toast.makeText(this@MainActivity, "User saved successfully", android.widget.Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}