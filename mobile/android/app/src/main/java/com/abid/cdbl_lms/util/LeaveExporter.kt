package com.abid.cdbl_lms.util

import android.content.Context
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

/**
 * Export service for creating JSON files from leave requests
 * Equivalent to iOS LeaveExporter.swift
 */
class LeaveExporter(private val context: Context, private val signer: LeaveSigner) {
    private val gson: Gson = GsonBuilder()
        .setPrettyPrinting()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    /**
     * Export a leave request to signed JSON data
     */
    fun exportToJSON(request: LeaveRequest): ByteArray {
        val signedPackage = signer.signLeaveRequest(request)
        return gson.toJson(signedPackage).toByteArray(Charsets.UTF_8)
    }

    /**
     * Save JSON data to a temporary file
     */
    fun saveToTemporaryFile(data: ByteArray): File {
        val tempDir = File(context.cacheDir, "leave_exports")
        if (!tempDir.exists()) {
            tempDir.mkdirs()
        }
        
        val fileName = "leave-request-${UUID.randomUUID()}.json"
        val file = File(tempDir, fileName)
        
        FileOutputStream(file).use { it.write(data) }
        return file
    }

    /**
     * Export leave request and save to temporary file
     */
    fun exportAndSaveToFile(request: LeaveRequest): File {
        val jsonData = exportToJSON(request)
        return saveToTemporaryFile(jsonData)
    }

    /**
     * Generate a human-readable filename for the export
     */
    fun generateFileName(request: LeaveRequest): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH)
        val dateString = formatter.format(request.startDate)
        val typeString = request.type.name.lowercase()
        return "cdbl-leave-$typeString-$dateString.json"
    }
}

