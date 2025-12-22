package com.cdbl.leavemanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.cdbl.leavemanager.ui.auth.LoginScreen
import com.cdbl.leavemanager.ui.dashboard.DashboardScreen
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
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CDBLLeaveManagerTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                // Manage token state at top level
                var token by remember { mutableStateOf("") }
                
                val role = com.cdbl.leavemanager.util.JwtUtils.getUserRole(token)
                val isApprover = role in listOf("DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN")

                // Determine if we should show bottom bar
                val showBottomBar = currentRoute in listOf(
                    Screen.Dashboard.route,
                    Screen.Leaves.route,
                    Screen.Approvals.route,
                    Screen.Profile.route
                )

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            BottomNavigationBar(
                                currentRoute = currentRoute,
                                showApprovals = isApprover,
                                onNavigate = { route ->
                                    navController.navigate(route) {
                                        popUpTo(Screen.Dashboard.route) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "login",
                        modifier = Modifier.padding(innerPadding)
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
                            DashboardScreen(
                                token = token,
                                onNavigateToApply = { navController.navigate("apply-leave") },
                                onNavigateToEncashment = { navController.navigate("encashment") },
                                onNavigateToApprovals = { navController.navigate(Screen.Approvals.route) },
                                onNavigateToLeaveDetails = { leaveId -> navController.navigate("leaves/$leaveId") }
                            )
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
                                onLogout = {
                                    token = ""
                                    navController.navigate("login") {
                                        popUpTo(0) // Clear backstack
                                    }
                                }
                            )
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
                            route = "leaves/{leaveId}",
                            arguments = listOf(androidx.navigation.navArgument("leaveId") { type = androidx.navigation.NavType.IntType })
                        ) { backStackEntry ->
                            val leaveId = backStackEntry.arguments?.getInt("leaveId") ?: 0
                            com.cdbl.leavemanager.ui.leaves.LeaveDetailScreen(
                                token = token,
                                leaveId = leaveId,
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
                    }
                }
            }
        }
    }
}