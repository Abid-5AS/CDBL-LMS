package com.cdbl.leavemanager.data.model

data class TeamOnLeaveResponse(
    val date: String,
    val count: Int,
    val members: List<TeamMemberOnLeave>
)

data class TeamMemberOnLeave(
    val id: Int,
    val employeeName: String,
    val type: String,
    val startDate: String,
    val endDate: String,
    // Optional legacy fields if needed, but we should prefer standard ones
    // val start: String,
    // val end: String
)
