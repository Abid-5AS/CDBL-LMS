package com.abid.cdbl_lms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.abid.cdbl_lms.ui.navigation.NavGraph
import com.abid.cdbl_lms.ui.theme.CDBL_LMSTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        val app = applicationContext as Application
        
        setContent {
            CDBL_LMSTheme {
                val navController = rememberNavController()
                NavGraph(
                    navController = navController,
                    leaveRepository = app.leaveRepository,
                    balanceRepository = app.balanceRepository
                )
            }
        }
    }
}
