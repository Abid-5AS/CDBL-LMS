package com.abid.cdbl_lms.data.model

/**
 * Employee model
 */
data class Employee(
    val id: String,
    val name: String,
    val email: String,
    val employeeId: String,
    val department: String,
    val role: EmployeeRole
)

enum class EmployeeRole {
    EMPLOYEE,
    DEPT_HEAD,
    HR_ADMIN,
    HR_HEAD,
    CEO
}

