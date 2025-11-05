package com.abid.cdbl_lms.data.model

import java.util.Date

/**
 * Holiday model
 * Policy Reference: docs/Policy Logic/03-Holiday and Weekend Handling.md
 */
data class Holiday(
    val id: String,
    val date: Date,
    val name: String,
    val isOptional: Boolean = false
)

