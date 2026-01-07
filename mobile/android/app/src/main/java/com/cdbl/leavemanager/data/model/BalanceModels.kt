package com.cdbl.leavemanager.data.model

data class BalanceResponse(
    val year: Int,
    val EARNED: Double = 0.0,
    val CASUAL: Double = 0.0,
    val MEDICAL: Double = 0.0
)

data class BalanceDetail(
    val type: String,
    val opening: Double,
    val accrued: Double,
    val used: Double,
    val closing: Double
)

data class BalanceDetailResponse(
    val year: Int,
    val balances: List<BalanceDetail>
)
