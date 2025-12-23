package com.cdbl.leavemanager.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.cdbl.leavemanager.data.local.entity.PolicyEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PolicyDao {
    @Query("SELECT * FROM policies")
    fun getAllPolicies(): Flow<List<PolicyEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPolicies(policies: List<PolicyEntity>)

    @Query("DELETE FROM policies")
    suspend fun clearPolicies()
}
