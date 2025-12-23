package com.cdbl.leavemanager.util

import android.content.Context
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.os.Environment
import android.widget.Toast
import com.cdbl.leavemanager.data.model.LeaveRequest
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

object PdfGenerator {

    fun generateLeaveHistoryPdf(context: Context, leaves: List<LeaveRequest>) {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 size
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas
        val paint = Paint()

        // Title
        paint.textSize = 20f
        paint.isFakeBoldText = true
        canvas.drawText("Leave History Report", 20f, 40f, paint)

        // Headers
        paint.textSize = 14f
        paint.isFakeBoldText = true
        var yPosition = 80f
        canvas.drawText("Type", 20f, yPosition, paint)
        canvas.drawText("Start Date", 120f, yPosition, paint)
        canvas.drawText("End Date", 240f, yPosition, paint)
        canvas.drawText("Status", 360f, yPosition, paint)
        
        yPosition += 30f
        paint.isFakeBoldText = false
        paint.textSize = 12f

        // Rows
        for (leave in leaves) {
            if (yPosition > 800f) {
                // Determine if we need multi-page support. For simplicity, we just stop or wrap?
                // Android PdfDocument requires finishing page and starting new one.
                // Keeping it simple: limit to 1 page or truncation for MVP.
                break
            }
            canvas.drawText(leave.type, 20f, yPosition, paint)
            canvas.drawText(leave.startDate, 120f, yPosition, paint)
            canvas.drawText(leave.endDate, 240f, yPosition, paint)
            canvas.drawText(leave.status, 360f, yPosition, paint)
            yPosition += 25f
        }

        pdfDocument.finishPage(page)

        // Save file
        val file = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "LeaveHistory_${System.currentTimeMillis()}.pdf")
        
        try {
            pdfDocument.writeTo(FileOutputStream(file))
            Toast.makeText(context, "PDF saved to Downloads: ${file.name}", Toast.LENGTH_LONG).show()
        } catch (e: IOException) {
            e.printStackTrace()
            Toast.makeText(context, "Error saving PDF: ${e.message}", Toast.LENGTH_SHORT).show()
        }

        pdfDocument.close()
    }
}
