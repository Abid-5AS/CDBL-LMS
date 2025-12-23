package com.cdbl.leavemanager.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun FullScreenLoading(message: String = "Loading...") {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(16.dp))
        Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun ShimmerEffect(
    modifier: Modifier = Modifier,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(8.dp),
    color: Color = MaterialTheme.colorScheme.surfaceVariant
) {
    val shimmerColors = listOf(
        color.copy(alpha = 0.6f),
        color.copy(alpha = 0.2f),
        color.copy(alpha = 0.6f),
    )

    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 1000,
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translation"
    )

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = translateAnimation.value, y = translateAnimation.value)
    )

    Box(
        modifier = modifier
            .background(brush, shape)
            .clip(shape)
    )
}

@Composable
fun SkeletonListItem() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .height(80.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        ShimmerEffect(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)))
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            ShimmerEffect(modifier = Modifier.fillMaxWidth(0.6f).height(16.dp))
            Spacer(modifier = Modifier.height(8.dp))
            ShimmerEffect(modifier = Modifier.fillMaxWidth(0.4f).height(12.dp))
        }
    }
}
