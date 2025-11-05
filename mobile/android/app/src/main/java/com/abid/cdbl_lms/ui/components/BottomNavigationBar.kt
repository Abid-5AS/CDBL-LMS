package com.abid.cdbl_lms.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import com.abid.cdbl_lms.ui.navigation.Screen

@Composable
fun BottomNavigationBar(
    navController: NavController,
    currentRoute: String?,
    modifier: Modifier = Modifier
) {
    NavigationBar(modifier = modifier) {
        NavigationBarItem(
            icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
            label = { Text("Dashboard") },
            selected = currentRoute == Screen.Dashboard.route,
            onClick = {
                navController.navigate(Screen.Dashboard.route) {
                    popUpTo(Screen.Dashboard.route) { inclusive = true }
                }
            }
        )
        NavigationBarItem(
            icon = { Icon(Icons.AutoMirrored.Filled.List, contentDescription = "History") },
            label = { Text("History") },
            selected = currentRoute == Screen.LeaveHistory.route,
            onClick = {
                navController.navigate(Screen.LeaveHistory.route) {
                    popUpTo(Screen.Dashboard.route) { inclusive = false }
                }
            }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Add, contentDescription = "Apply Leave") },
            label = { Text("Apply") },
            selected = currentRoute == Screen.ApplyLeave.route,
            onClick = {
                navController.navigate(Screen.ApplyLeave.route) {
                    popUpTo(Screen.Dashboard.route) { inclusive = false }
                }
            }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Sync, contentDescription = "Sync") },
            label = { Text("Sync") },
            selected = currentRoute == Screen.PairSync.route,
            onClick = {
                navController.navigate(Screen.PairSync.route) {
                    popUpTo(Screen.Dashboard.route) { inclusive = false }
                }
            }
        )
        NavigationBarItem(
            icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
            label = { Text("Settings") },
            selected = currentRoute == Screen.Settings.route,
            onClick = {
                navController.navigate(Screen.Settings.route) {
                    popUpTo(Screen.Dashboard.route) { inclusive = false }
                }
            }
        )
    }
}

