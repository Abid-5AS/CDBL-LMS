package com.abid.cdbl_lms.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Date utilities for Asia/Dhaka timezone
 * Policy Reference: docs/Policy Logic/08-Date Time and Display Logic.md
 */
object DateUtils {
    private val dhakaTimeZone = TimeZone.getTimeZone("Asia/Dhaka")
    private val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.ENGLISH).apply {
        timeZone = dhakaTimeZone
    }

    /**
     * Normalize date to Dhaka midnight
     */
    fun normalizeToDhakaMidnight(date: Date): Date {
        val calendar = Calendar.getInstance(dhakaTimeZone).apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return calendar.time
    }

    /**
     * Format date as dd/mm/yyyy (Bangladesh standard)
     */
    fun formatDDMMYYYY(date: Date): String {
        return dateFormat.format(date)
    }

    /**
     * Format date as "dd MMM yyyy" (e.g., "15 Jan 2024")
     */
    fun formatDate(date: Date): String {
        val formatter = SimpleDateFormat("dd MMM yyyy", Locale.ENGLISH).apply {
            timeZone = dhakaTimeZone
        }
        return formatter.format(date)
    }

    /**
     * Get current year
     */
    fun getCurrentYear(): Int {
        return Calendar.getInstance(dhakaTimeZone).get(Calendar.YEAR)
    }

    /**
     * Get start of year
     */
    fun getYearStart(year: Int): Date {
        val calendar = Calendar.getInstance(dhakaTimeZone).apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, Calendar.JANUARY)
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return calendar.time
    }

    /**
     * Get end of year
     */
    fun getYearEnd(year: Int): Date {
        val calendar = Calendar.getInstance(dhakaTimeZone).apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, Calendar.DECEMBER)
            set(Calendar.DAY_OF_MONTH, 31)
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }
        return calendar.time
    }

    /**
     * Get today's date normalized to Dhaka midnight
     */
    fun today(): Date {
        return normalizeToDhakaMidnight(Date())
    }
}

