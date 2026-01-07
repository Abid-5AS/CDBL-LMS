package com.cdbl.leavemanager.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CacheManager @Inject constructor(
    @ApplicationContext context: Context,
    private val gson: Gson
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("app_cache", Context.MODE_PRIVATE)

    fun <T> save(key: String, data: T) {
        val json = gson.toJson(data)
        prefs.edit().putString(key, json).apply()
    }

    fun <T> get(key: String, clazz: Class<T>): T? {
        val json = prefs.getString(key, null) ?: return null
        return try {
            gson.fromJson(json, clazz)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    // For lists or complex types using TypeToken
    fun <T> get(key: String, typeToken: TypeToken<T>): T? {
        val json = prefs.getString(key, null) ?: return null
        return try {
            gson.fromJson(json, typeToken.type)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
    
    companion object {
        const val KEY_DASHBOARD_BALANCE = "dashboard_balance"
        const val KEY_DASHBOARD_TEAM = "dashboard_team"
        const val KEY_LEAVE_HISTORY = "leave_history"
        const val KEY_BALANCE_DETAILED = "balance_detailed"
    }
}
