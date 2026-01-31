package com.cdbl.leavemanager.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import com.cdbl.leavemanager.data.model.MonthlyTrendItem
import com.cdbl.leavemanager.ui.theme.Indigo500
import android.graphics.Paint

@Composable
fun TrendsChart(
    data: List<MonthlyTrendItem>,
    modifier: Modifier = Modifier
) {
    if (data.isEmpty()) return

    val primaryColor = Indigo500
    val transparentColor = primaryColor.copy(alpha = 0f)
    val textPaint = Paint().apply {
        color = android.graphics.Color.GRAY
        textSize = 32f
        textAlign = Paint.Align.CENTER
    }

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp)
    ) {
        val width = size.width
        val height = size.height
        val maxLeaves = data.maxOfOrNull { it.leaves }?.toFloat() ?: 1f
        val points = data.mapIndexed { index, item ->
            val x = (index.toFloat() / (data.size - 1)) * width
            val y = height - ((item.leaves / maxLeaves) * height)
            Offset(x, y)
        }

        val path = Path().apply {
            moveTo(points.first().x, points.first().y)
            points.drop(1).forEach {
                lineTo(it.x, it.y)
            }
        }

        val fillPath = Path().apply {
            addPath(path)
            lineTo(width, height)
            lineTo(0f, height)
            close()
        }

        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(primaryColor.copy(alpha = 0.3f), transparentColor)
            )
        )

        drawPath(
            path = path,
            color = primaryColor,
            style = Stroke(width = 4.dp.toPx())
        )

        points.drop(1).dropLast(1).forEachIndexed { index, point ->
            if (index % 2 == 0) { // Draw labels for every other point to avoid crowding
               drawContext.canvas.nativeCanvas.drawText(
                   data[index + 1].month,
                   point.x,
                   height + 40f,
                   textPaint
               )
            }
        }
        
        // Always draw first and last label
        drawContext.canvas.nativeCanvas.drawText(data.first().month, points.first().x, height + 40f, textPaint)
        drawContext.canvas.nativeCanvas.drawText(data.last().month, points.last().x, height + 40f, textPaint)
    }
}
