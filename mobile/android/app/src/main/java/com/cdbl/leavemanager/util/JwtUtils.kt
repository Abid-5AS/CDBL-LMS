package com.cdbl.leavemanager.util

import android.util.Base64
import org.json.JSONObject

object JwtUtils {
    fun getUserRole(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size != 3) return null
            
            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE))
            val json = JSONObject(payload)
            return json.optString("role")
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
