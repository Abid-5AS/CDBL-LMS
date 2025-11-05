package com.abid.cdbl_lms.util

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.nio.charset.StandardCharsets

/**
 * QR Code generation utility
 * Equivalent to iOS QRGenerator.swift
 */
object QRCodeGenerator {
    /**
     * Generate QR code bitmap from string data
     * Supports up to 120KB data by splitting into multiple QR codes
     */
    fun generateQRCode(
        data: String,
        width: Int = 512,
        height: Int = 512,
        errorCorrectionLevel: ErrorCorrectionLevel = ErrorCorrectionLevel.M
    ): Bitmap? {
        return try {
            val hints = hashMapOf<EncodeHintType, Any>().apply {
                put(EncodeHintType.ERROR_CORRECTION, errorCorrectionLevel)
                put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name())
                put(EncodeHintType.MARGIN, 1)
            }

            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, width, height, hints)

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(
                        x, y,
                        if (bitMatrix[x, y]) Color.BLACK else Color.WHITE
                    )
                }
            }
            bitmap
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Generate QR code from byte array
     */
    fun generateQRCode(
        data: ByteArray,
        width: Int = 512,
        height: Int = 512
    ): Bitmap? {
        val dataString = data.toString(StandardCharsets.UTF_8)
        return generateQRCode(dataString, width, height)
    }

    /**
     * Split large data into chunks for multi-segment QR codes
     * Each segment can be up to ~2KB (with error correction level M)
     */
    fun splitDataForQR(data: String, maxChunkSize: Int = 2000): List<String> {
        val chunks = mutableListOf<String>()
        var index = 0
        val totalChunks = (data.length / maxChunkSize) + 1

        while (index < data.length) {
            val chunkSize = minOf(maxChunkSize, data.length - index)
            val chunk = data.substring(index, index + chunkSize)
            chunks.add("$index/$totalChunks:$chunk")
            index += chunkSize
        }

        return chunks
    }
}

