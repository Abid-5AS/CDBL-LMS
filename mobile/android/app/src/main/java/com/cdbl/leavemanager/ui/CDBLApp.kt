package com.cdbl.leavemanager.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.cdbl.leavemanager.ui.navigation.CDBLBottomBar
import com.cdbl.leavemanager.ui.navigation.CDBLNavHost
import com.cdbl.leavemanager.ui.theme.CDBLLeaveManagerTheme
import com.cdbl.leavemanager.util.JwtUtils

@Composable
fun CDBLApp(
    appState: CDBLAppState,
    startDestination: String = "login_route"
) {
    CDBLLeaveManagerTheme {
        val snackbarHostState = remember { SnackbarHostState() }
        
        // Check if current route requires bottom bar
        val currentDestination = appState.currentDestination
        val currentRoute = currentDestination?.route
        
        val showBottomBar = currentRoute in appState.topLevelDestinations.map { it.route }
        
        // Determine role for bottom bar visibility (Approvals)
        val token = appState.currentTopLevelDestination // This logic needs to access token from somewhere or we pass it down
        // For now, simpler logic for bottom bar: defined in TopLevelDestination
        
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            bottomBar = {
                if (showBottomBar) {
                    CDBLBottomBar(
                        destinations = appState.topLevelDestinations,
                        onNavigateToDestination = appState::navigateToTopLevelDestination,
                        currentDestination = currentDestination,
                        modifier = Modifier
                    )
                }
            }
        ) { padding ->
            CDBLNavHost(
                appState = appState,
                modifier = Modifier.padding(padding),
                startDestination = startDestination
            )
        }
    }
}
