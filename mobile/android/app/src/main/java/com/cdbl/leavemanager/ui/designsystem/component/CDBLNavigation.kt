package com.cdbl.leavemanager.ui.designsystem.component

import androidx.compose.foundation.layout.RowScope
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * CDBL navigation bar with generic content slot. Wraps Material 3 [NavigationBar].
 *
 * @param modifier Modifier to be applied to the navigation bar
 * @param content The destination items
 */
@Composable
fun CDBLNavigationBar(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    NavigationBar(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.surface, // Or NavigationBarDefaults.containerColor
        contentColor = MaterialTheme.colorScheme.onSurface,
        tonalElevation = 0.dp,
        content = content
    )
}

/**
 * CDBL navigation bar item with icon and label content slots. Wraps Material 3 [NavigationBarItem].
 *
 * @param selected Whether this item is selected
 * @param onClick The callback to be invoked when this item is selected
 * @param icon The item icon content
 * @param modifier Modifier to be applied to this item
 * @param selectedIcon The item icon content when selected
 * @param enabled Controls the enabled state of this item
 * @param label The item text label content
 * @param alwaysShowLabel Whether to always show the label for this item
 */
@Composable
fun RowScope.CDBLNavigationBarItem(
    selected: Boolean,
    onClick: () -> Unit,
    icon: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    selectedIcon: @Composable () -> Unit = icon,
    enabled: Boolean = true,
    label: @Composable (() -> Unit)? = null,
    alwaysShowLabel: Boolean = true
) {
    NavigationBarItem(
        selected = selected,
        onClick = onClick,
        icon = if (selected) selectedIcon else icon,
        modifier = modifier,
        enabled = enabled,
        label = label,
        alwaysShowLabel = alwaysShowLabel,
        colors = NavigationBarItemDefaults.colors(
            selectedIconColor = MaterialTheme.colorScheme.onSecondaryContainer,
            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
            selectedTextColor = MaterialTheme.colorScheme.onSurface,
            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
            indicatorColor = MaterialTheme.colorScheme.secondaryContainer
        )
    )
}
