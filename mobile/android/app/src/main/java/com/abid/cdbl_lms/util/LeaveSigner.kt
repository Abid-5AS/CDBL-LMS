package com.abid.cdbl_lms.util

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.google.gson.Gson
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * HMAC-SHA256 signing service for leave requests
 * Equivalent to iOS LeaveSigner.swift
 */
class LeaveSigner(private val context: Context) {
    private val algorithm = "HmacSHA256"

    /**
     * Get or create device-specific signing key
     */
    private fun getOrCreateSigningKey(): ByteArray {
        val prefs = getEncryptedPrefs()
        val storedKey = prefs.getString(KEY_PREF_NAME, null)

        if (storedKey != null) {
            return Base64.getDecoder().decode(storedKey)
        }

        // Generate new key
        val newKey = ByteArray(32).apply {
            Random().nextBytes(this)
        }

        // Store encrypted
        prefs.edit().putString(KEY_PREF_NAME, Base64.getEncoder().encodeToString(newKey)).apply()
        return newKey
    }

    private fun getEncryptedPrefs(): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            context,
            "leave_signer_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    /**
     * Sign a leave request and create a signed package with 24h expiry
     */
    fun signLeaveRequest(request: LeaveRequest): SignedLeavePackage {
        val key = getOrCreateSigningKey()
        val secretKey = SecretKeySpec(key, algorithm)
        val mac = Mac.getInstance(algorithm).apply {
            init(secretKey)
        }

        // Encode request to JSON for signing
        val gson = Gson()
        val requestJson = gson.toJson(request)
        val requestData = requestJson.toByteArray(StandardCharsets.UTF_8)

        // Generate HMAC-SHA256 signature
        val signatureBytes = mac.doFinal(requestData)
        val signatureHex = signatureBytes.joinToString("") { "%02x".format(it) }

        // Create timestamps
        val now = Date()
        val expiry = Date(now.time + (24 * 60 * 60 * 1000)) // 24 hours

        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ENGLISH).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        return SignedLeavePackage(
            data = request,
            signature = signatureHex,
            timestamp = formatter.format(now),
            expiry = formatter.format(expiry)
        )
    }

    /**
     * Verify a signed package's signature
     */
    fun verifySignature(signedPackage: SignedLeavePackage): Boolean {
        val key = getOrCreateSigningKey()
        val secretKey = SecretKeySpec(key, algorithm)
        val mac = Mac.getInstance(algorithm).apply {
            init(secretKey)
        }

        val gson = Gson()
        val requestJson = gson.toJson(signedPackage.data)
        val requestData = requestJson.toByteArray(StandardCharsets.UTF_8)

        val computedSignatureBytes = mac.doFinal(requestData)
        val computedSignatureHex = computedSignatureBytes.joinToString("") { "%02x".format(it) }

        return computedSignatureHex == signedPackage.signature
    }

    companion object {
        private const val KEY_PREF_NAME = "signing_key"
    }
}

data class SignedLeavePackage(
    val data: LeaveRequest,
    val signature: String,
    val timestamp: String,
    val expiry: String
)

