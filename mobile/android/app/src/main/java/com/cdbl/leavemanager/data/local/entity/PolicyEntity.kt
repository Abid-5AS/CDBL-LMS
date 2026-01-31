package com.cdbl.leavemanager.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.cdbl.leavemanager.data.model.PolicyRule
import com.cdbl.leavemanager.data.model.PolicyExample
import com.google.gson.Gson
import androidx.room.TypeConverter

@Entity(tableName = "policies")
data class PolicyEntity(
    @PrimaryKey
    val code: String,
    val title: String,
    val availability: String,
    val summary: String,
    val rulesJson: String, // Store complex objects as JSON string
    val examplesJson: String, // Store complex objects as JSON string
    val lastUpdated: Long = System.currentTimeMillis()
)

class PolicyTypeConverters {
    private val gson = Gson()

    @TypeConverter
    fun fromRulesList(rules: List<PolicyRule>): String {
        return gson.toJson(rules)
    }

    @TypeConverter
    fun toRulesList(rulesString: String): List<PolicyRule> {
        return gson.fromJson(rulesString, Array<PolicyRule>::class.java).toList()
    }
    
    @TypeConverter
    fun fromExamplesList(examples: List<PolicyExample>): String {
        return gson.toJson(examples)
    }

    @TypeConverter
    fun toExamplesList(examplesString: String): List<PolicyExample> {
        return gson.fromJson(examplesString, Array<PolicyExample>::class.java).toList()
    }
}
