package com.abid.cdbl_lms.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.abid.cdbl_lms.data.model.LeaveRequest
import java.text.SimpleDateFormat
import java.util.*

/**
 * Email composition service using Android Intent
 * Equivalent to iOS EmailComposer.swift
 */
object EmailComposer {
    private const val DEFAULT_RECIPIENT = "hr@cdbl.com.bd"

    /**
     * Generate email subject for leave request
     */
    fun generateSubject(request: LeaveRequest): String {
        val formatter = SimpleDateFormat("MMM d", Locale.ENGLISH)
        val dateRange = "${formatter.format(request.startDate)} - ${formatter.format(request.endDate)}"
        return "Leave Request - ${request.type.name} - $dateRange"
    }

    /**
     * Generate email body for leave request
     */
    fun generateBody(request: LeaveRequest): String {
        val formatter = SimpleDateFormat("MMM d, yyyy", Locale.ENGLISH)
        
        return """
            Dear HR Team,
            
            Please find attached my leave request details.
            
            Leave Type: ${request.type.name}
            Start Date: ${formatter.format(request.startDate)}
            End Date: ${formatter.format(request.endDate)}
            Duration: ${request.workingDays} day(s)
            Reason: ${request.reason}
            
            The leave request package (JSON file) and QR code are attached for your reference.
            
            Thank you.
        """.trimIndent()
    }

    /**
     * Create email intent with attachments
     */
    fun createEmailIntent(
        context: Context,
        recipient: String = DEFAULT_RECIPIENT,
        subject: String? = null,
        body: String? = null,
        attachments: List<Uri> = emptyList(),
        request: LeaveRequest
    ): Intent {
        val intent = Intent(Intent.ACTION_SEND_MULTIPLE).apply {
            type = "message/rfc822"
            putExtra(Intent.EXTRA_EMAIL, arrayOf(recipient))
            putExtra(Intent.EXTRA_SUBJECT, subject ?: generateSubject(request))
            putExtra(Intent.EXTRA_TEXT, body ?: generateBody(request))
            
            if (attachments.isNotEmpty()) {
                putParcelableArrayListExtra(Intent.EXTRA_STREAM, ArrayList(attachments))
            }
            
            // Allow user to choose email app
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        
        return Intent.createChooser(intent, "Send Leave Request via Email")
    }
}

