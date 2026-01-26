package com.cdbl.leavemanager.ui.theme

import android.os.Build
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.surfaceColorAtElevation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

private val LightDefaultColorScheme = lightColorScheme(
    primary = Indigo600,
    onPrimary = Color.White,
    primaryContainer = Indigo100,
    onPrimaryContainer = Indigo900,
    secondary = Teal40,
    onSecondary = Color.White,
    secondaryContainer = Teal90,
    onSecondaryContainer = Teal10,
    tertiary = Blue40,
    onTertiary = Color.White,
    tertiaryContainer = Blue90,
    onTertiaryContainer = Blue10,
    error = Red40,
    onError = Color.White,
    errorContainer = Red90,
    onErrorContainer = Red10,
    background = BackgroundLight,
    onBackground = Slate900,
    surface = SurfaceLight,
    onSurface = Slate900,
    surfaceVariant = Slate100,
    onSurfaceVariant = Slate600,
    inverseSurface = Slate800,
    inverseOnSurface = Slate50,
    outline = Slate300,
)

private val DarkDefaultColorScheme = darkColorScheme(
    primary = Indigo500,
    onPrimary = Slate950,
    primaryContainer = Indigo900,
    onPrimaryContainer = Indigo100,
    secondary = Teal80,
    onSecondary = Teal20,
    secondaryContainer = Teal30,
    onSecondaryContainer = Teal90,
    tertiary = Orange80,
    onTertiary = Orange20,
    tertiaryContainer = Orange30,
    onTertiaryContainer = Orange90,
    error = Red80,
    onError = Red20,
    errorContainer = Red30,
    onErrorContainer = Red90,
    background = BackgroundDark,
    onBackground = Slate100,
    surface = SurfaceDark,
    onSurface = Slate100,
    surfaceVariant = Slate700,
    onSurfaceVariant = Slate300,
    inverseSurface = Slate100,
    inverseOnSurface = Slate900,
    outline = Slate600,
)

private val LightAndroidColorScheme = lightColorScheme(
    primary = Green40,
    onPrimary = Color.White,
    primaryContainer = Green90,
    onPrimaryContainer = Green10,
    secondary = DarkGreen40,
    onSecondary = Color.White,
    secondaryContainer = DarkGreen90,
    onSecondaryContainer = DarkGreen10,
    tertiary = Teal40,
    onTertiary = Color.White,
    tertiaryContainer = Teal90,
    onTertiaryContainer = Teal10,
    error = Red40,
    onError = Color.White,
    errorContainer = Red90,
    onErrorContainer = Red10,
    background = DarkGreenGray99,
    onBackground = DarkGreenGray10,
    surface = DarkGreenGray99,
    onSurface = DarkGreenGray10,
    surfaceVariant = GreenGray90,
    onSurfaceVariant = GreenGray30,
    inverseSurface = DarkGreenGray20,
    inverseOnSurface = DarkGreenGray95,
    outline = GreenGray50,
)

private val DarkAndroidColorScheme = darkColorScheme(
    primary = Green80,
    onPrimary = Green20,
    primaryContainer = Green30,
    onPrimaryContainer = Green90,
    secondary = DarkGreen80,
    onSecondary = DarkGreen20,
    secondaryContainer = DarkGreen30,
    onSecondaryContainer = DarkGreen90,
    tertiary = Teal80,
    onTertiary = Teal20,
    tertiaryContainer = Teal30,
    onTertiaryContainer = Teal90,
    error = Red80,
    onError = Red20,
    errorContainer = Red30,
    onErrorContainer = Red90,
    background = DarkGreenGray10,
    onBackground = DarkGreenGray90,
    surface = DarkGreenGray10,
    onSurface = DarkGreenGray90,
    surfaceVariant = GreenGray30,
    onSurfaceVariant = GreenGray80,
    inverseSurface = DarkGreenGray90,
    inverseOnSurface = DarkGreenGray10,
    outline = GreenGray60,
)

private val LightAndroidGradientColors = GradientColors(container = DarkGreenGray95)
private val DarkAndroidGradientColors = GradientColors(container = Color.Black)

private val LightAndroidBackgroundTheme = BackgroundTheme(color = DarkGreenGray95)
private val DarkAndroidBackgroundTheme = BackgroundTheme(color = Color.Black)

@Composable
fun CDBLLeaveManagerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    androidTheme: Boolean = false,
    disableDynamicTheming: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        androidTheme -> if (darkTheme) DarkAndroidColorScheme else LightAndroidColorScheme
        !disableDynamicTheming && supportsDynamicTheming() -> {
            val context = LocalContext.current
            val dynamicScheme = if (darkTheme) {
                dynamicDarkColorScheme(context)
            } else {
                dynamicLightColorScheme(context)
            }
            stabilizeDynamicScheme(dynamicScheme, darkTheme)
        }
        else -> if (darkTheme) DarkDefaultColorScheme else LightDefaultColorScheme
    }

    val emptyGradientColors = GradientColors(container = colorScheme.surfaceColorAtElevation(2.dp))
    val defaultGradientColors = GradientColors(
        top = colorScheme.inverseOnSurface,
        bottom = colorScheme.primaryContainer,
        container = colorScheme.surface,
    )
    val gradientColors = when {
        androidTheme -> if (darkTheme) DarkAndroidGradientColors else LightAndroidGradientColors
        !disableDynamicTheming && supportsDynamicTheming() -> GradientColors(
            top = colorScheme.primary.copy(alpha = 0.08f),
            bottom = colorScheme.secondary.copy(alpha = 0.06f),
            container = colorScheme.surface,
        )
        else -> defaultGradientColors
    }
    val defaultBackgroundTheme = BackgroundTheme(
        color = colorScheme.surface,
        tonalElevation = 2.dp,
    )
    val backgroundTheme = when {
        androidTheme -> if (darkTheme) DarkAndroidBackgroundTheme else LightAndroidBackgroundTheme
        else -> defaultBackgroundTheme
    }
    val tintTheme = when {
        androidTheme -> TintTheme()
        !disableDynamicTheming && supportsDynamicTheming() -> TintTheme(colorScheme.primary)
        else -> TintTheme()
    }

    CompositionLocalProvider(
        LocalGradientColors provides gradientColors,
        LocalBackgroundTheme provides backgroundTheme,
        LocalTintTheme provides tintTheme,
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content,
        )
    }
}

@ChecksSdkIntAtLeast(api = Build.VERSION_CODES.S)
fun supportsDynamicTheming() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

private fun stabilizeDynamicScheme(
    colorScheme: androidx.compose.material3.ColorScheme,
    darkTheme: Boolean
): androidx.compose.material3.ColorScheme {
    val neutralScheme = if (darkTheme) DarkDefaultColorScheme else LightDefaultColorScheme
    return colorScheme.copy(
        background = neutralScheme.background,
        onBackground = neutralScheme.onBackground,
        surface = neutralScheme.surface,
        onSurface = neutralScheme.onSurface,
        surfaceVariant = neutralScheme.surfaceVariant,
        onSurfaceVariant = neutralScheme.onSurfaceVariant,
        inverseSurface = neutralScheme.inverseSurface,
        inverseOnSurface = neutralScheme.inverseOnSurface,
        outline = neutralScheme.outline,
    )
}
