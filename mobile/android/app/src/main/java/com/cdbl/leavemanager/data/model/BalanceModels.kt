package com.cdbl.leavemanager.data.model

data class BalanceResponse(
    val year: Int,
    val EARNED: Double = 0.0,
    val CASUAL: Double = 0.0,
    val MEDICAL: Double = 0.0
)
