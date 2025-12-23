package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.PolicyService
import com.cdbl.leavemanager.data.model.PolicySection
import javax.inject.Inject
import javax.inject.Singleton

import com.cdbl.leavemanager.data.local.dao.PolicyDao
import com.cdbl.leavemanager.data.local.entity.PolicyEntity
import com.cdbl.leavemanager.data.model.PolicyExample
import com.cdbl.leavemanager.data.model.PolicyRule
import com.google.gson.Gson
import kotlinx.coroutines.flow.firstOrNull
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PolicyRepository @Inject constructor(
    private val policyService: PolicyService,
    private val policyDao: PolicyDao,
    private val gson: Gson
) {
    suspend fun fetchPolicies(): Result<List<PolicySection>> {
        return try {
            val response = policyService.getPolicies()
            if (response.isSuccessful && response.body()?.success == true) {
                val policies = response.body()!!.data
                // Cache policies
                val entities = policies.map { it.toEntity() }
                policyDao.insertPolicies(entities)
                Result.success(policies)
            } else {
                // Try offline cache
                fetchFromCache(response.message())
            }
        } catch (e: Exception) {
            // Try offline cache on network error
            fetchFromCache(e.message)
        }
    }

    private suspend fun fetchFromCache(errorMessage: String?): Result<List<PolicySection>> {
        val cachedEntities = policyDao.getAllPolicies().firstOrNull()
        return if (!cachedEntities.isNullOrEmpty()) {
            Result.success(cachedEntities.map { it.toDomain() })
        } else {
            Result.failure(Exception("Failed to fetch policies: $errorMessage"))
        }
    }

    private fun PolicySection.toEntity(): PolicyEntity {
        return PolicyEntity(
            code = code,
            title = title,
            availability = availability,
            summary = summary,
            rulesJson = gson.toJson(rules),
            examplesJson = gson.toJson(examples)
        )
    }

    private fun PolicyEntity.toDomain(): PolicySection {
        val rulesList = try {
            gson.fromJson(rulesJson, Array<PolicyRule>::class.java).toList()
        } catch (e: Exception) { emptyList() }
        
        val examplesList = try {
            gson.fromJson(examplesJson, Array<PolicyExample>::class.java).toList()
        } catch (e: Exception) { emptyList() }

        return PolicySection(
            title = title,
            code = code,
            availability = availability,
            summary = summary,
            rules = rulesList,
            examples = examplesList
        )
    }
}
