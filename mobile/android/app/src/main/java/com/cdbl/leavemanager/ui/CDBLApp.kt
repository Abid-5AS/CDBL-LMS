package com.cdbl.leavemanager.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.local.DarkThemeConfig
import com.cdbl.leavemanager.ui.designsystem.component.CDBLBackground
import com.cdbl.leavemanager.ui.designsystem.component.CDBLGradientBackground
import com.cdbl.leavemanager.ui.navigation.CDBLBottomBar
import com.cdbl.leavemanager.ui.navigation.CDBLNavHost
import com.cdbl.leavemanager.ui.theme.CDBLLeaveManagerTheme

@Composable
fun CDBLApp(
    appState: CDBLAppState,
    startDestination: String = "login_route",
    mainViewModel: MainViewModel = hiltViewModel()
) {
    val userPreferences = mainViewModel.userPreferences.collectAsState().value
    
    val isDarkTheme = when (userPreferences.darkThemeConfig) {
        DarkThemeConfig.FOLLOW_SYSTEM -> isSystemInDarkTheme()
        DarkThemeConfig.LIGHT -> false
        DarkThemeConfig.DARK -> true
    }

    CDBLLeaveManagerTheme(
        darkTheme = isDarkTheme,
        androidTheme = userPreferences.useDynamicColor
    ) {
        val snackbarHostState = remember { SnackbarHostState() }
        val roleState = appState.userRole.collectAsState()
        val role = roleState.value
        val destinations = appState.topLevelDestinationsForRole(role)
        
        // Check if current route requires bottom bar
        val currentDestination = appState.currentDestination
        val currentRoute = currentDestination?.route
        
        val showBottomBar = destinations.any { destination ->
            currentRoute?.contains(destination.route, ignoreCase = true) == true
        }
        
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            bottomBar = {
                if (showBottomBar) {
                    CDBLBottomBar(
                        destinations = destinations,
                        onNavigateToDestination = appState::navigateToTopLevelDestination,
                        currentDestination = currentDestination,
                        modifier = Modifier
                    )
                }
            }
        ) { padding ->
            CDBLBackground {
                CDBLGradientBackground {
                    CDBLNavHost(
                        appState = appState,
                        modifier = Modifier.padding(padding),
                        startDestination = startDestination
                    )
                }
            }
        }
    }
}

