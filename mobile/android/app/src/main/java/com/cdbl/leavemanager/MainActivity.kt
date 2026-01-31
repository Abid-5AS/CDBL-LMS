/**
 * CDBL Leave Manager - Android Application
 *
 * Main entry point for the Android app. This activity serves as the single-activity
 * host for all Jetpack Compose screens.
 *
 * ## Architecture
 * - Uses Hilt for dependency injection
 * - Edge-to-edge display enabled
 * - Compose-based UI with [CDBLApp] as root composable
 *
 * ## Injected Dependencies
 * - [NetworkMonitor]: Observes network connectivity changes
 * - [TokenManager]: Manages JWT token storage
 *
 * @see CDBLApp Main composable that handles navigation and theming
 * @see CDBLAppState State holder for app-wide state
 */
package com.cdbl.leavemanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.cdbl.leavemanager.ui.CDBLApp
import com.cdbl.leavemanager.ui.rememberCDBLAppState
import com.cdbl.leavemanager.util.NetworkMonitor
import com.cdbl.leavemanager.data.local.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var networkMonitor: NetworkMonitor

    @Inject
    lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val appState = rememberCDBLAppState(
                networkMonitor = networkMonitor,
                tokenManager = tokenManager
            )
            
            CDBLApp(appState = appState)
        }
    }
}
