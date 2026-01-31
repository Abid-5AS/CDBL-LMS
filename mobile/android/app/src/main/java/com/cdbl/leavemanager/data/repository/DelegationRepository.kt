package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.DelegationService
import com.cdbl.leavemanager.data.model.DelegationEntry
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DelegationRepository @Inject constructor(
    private val delegationService: DelegationService
) {
    suspend fun getDelegations(
        token: String,
        type: String = "mine",
        includeInactive: Boolean = false
    ): Result<List<DelegationEntry>> {
        return try {
            val response = delegationService.getDelegations(
                "Bearer $token",
                type = type,
                includeInactive = includeInactive
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.delegations)
            } else {
                Result.failure(Exception("Failed to fetch delegations: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun revokeDelegation(token: String, id: Int): Result<Unit> {
        return try {
            val response = delegationService.revokeDelegation("Bearer $token", id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to revoke delegation: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
