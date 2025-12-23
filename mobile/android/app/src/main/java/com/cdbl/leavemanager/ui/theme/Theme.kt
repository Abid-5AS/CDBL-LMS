package com.cdbl.leavemanager.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Indigo500,
    onPrimary = Color.White,
    primaryContainer = Indigo900,
    onPrimaryContainer = Indigo100,
    secondary = Slate700,
    onSecondary = Color.White,
    background = BackgroundDark,
    onBackground = Slate50,
    surface = SurfaceDark,
    onSurface = Slate50,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate400,
    error = StatusRedTextDark,
    onError = Color.Black,
    outline = Slate700
)

private val LightColorScheme = lightColorScheme(
    primary = Indigo600,
    onPrimary = Color.White,
    primaryContainer = Indigo50,
    onPrimaryContainer = Indigo900,
    secondary = Slate200,
    onSecondary = Slate900,
    background = BackgroundLight,
    onBackground = Slate900,
    surface = SurfaceLight,
    onSurface = Slate900,
    surfaceVariant = Slate100,
    onSurfaceVariant = Slate600,
    error = StatusRedText,
    onError = Color.White,
    outline = Slate300
)

@Composable
fun CDBLLeaveManagerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // We default dynamicColor to FALSE to enforce our brand identity
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}