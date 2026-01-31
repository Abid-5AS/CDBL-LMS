package com.cdbl.leavemanager.data.model

data class UserDetailsResponse(
    val id: Int,
    val name: String,
    val email: String,
    val empCode: String?,
    val role: String,
    val department: String?,
    val joinDate: String?,
    val profile: UserProfile?,
    val emergencyContacts: List<EmergencyContact>?,
    val bankDetails: BankDetails?
)

data class UserProfile(
    val id: Int,
    val userId: Int,
    val phone: String?,
    val address: String?,
    val permanentAddress: String?,
    val dob: String?,
    val gender: String?,
    val bloodGroup: String?,
    val maritalStatus: String?,
    val nid: String?,
    val tin: String?
)

data class EmergencyContact(
    val id: Int,
    val userId: Int,
    val name: String,
    val relation: String,
    val phone: String,
    val address: String?
)

data class BankDetails(
    val id: Int,
    val userId: Int,
    val bankName: String,
    val accountNumber: String,
    val branchName: String?,
    val routingNumber: String?
)

data class UpdateProfileRequest(
    val section: String, // "personal", "emergency", "banking"
    val data: Map<String, Any?>
)
