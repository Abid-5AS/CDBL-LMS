package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.AuthService
import com.cdbl.leavemanager.data.model.LoginRequest
import com.cdbl.leavemanager.data.model.LoginResponse
import com.cdbl.leavemanager.data.model.VerifyOtpRequest
import javax.inject.Inject
import javax.inject.Singleton

import com.cdbl.leavemanager.data.local.dao.UserDao
import com.cdbl.leavemanager.data.local.entity.UserEntity
import com.cdbl.leavemanager.data.model.User
import kotlinx.coroutines.flow.firstOrNull

@Singleton
class AuthRepository @Inject constructor(
    private val authService: AuthService,
    private val userDao: UserDao
) {
    suspend fun login(
        email: String,
        password: String,
        skipOtp: Boolean = com.cdbl.leavemanager.BuildConfig.DEBUG
    ): Result<LoginResponse> {
        return try {
            val response = authService.login(LoginRequest(email, password, skipOtp = skipOtp))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                // Cache user if login successful and user data provided
                loginResponse.data?.user?.let { user ->
                    userDao.insertUser(user.toEntity())
                }
                Result.success(loginResponse)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(email: String, code: String): Result<LoginResponse> {
        return try {
            val response = authService.verifyOtp(VerifyOtpRequest(email, code))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "OTP Verification failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProfile(token: String): Result<com.cdbl.leavemanager.data.model.User> {
        return try {
            val response = authService.getCurrentUser("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val user = response.body()!!
                userDao.insertUser(user.toEntity())
                Result.success(user)
            } else {
                // Try cache on API failure
                val cachedUser = userDao.getUser().firstOrNull()
                if (cachedUser != null) {
                    Result.success(cachedUser.toModel())
                } else {
                     Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch profile"))
                }
            }
        } catch (e: Exception) {
             // Try cache on Exception (Network error)
            val cachedUser = userDao.getUser().firstOrNull()
            if (cachedUser != null) {
                Result.success(cachedUser.toModel())
            } else {
                Result.failure(e)
            }
        }
    }

    private fun User.toEntity() = UserEntity(
        id = id,
        email = email,
        name = name,
        employeeId = employeeId,
        department = department,
        role = role
    )

    private fun UserEntity.toModel() = User(
        id = id,
        email = email,
        name = name,
        employeeId = employeeId,
        department = department,
        role = role
    )

    suspend fun changePassword(token: String, request: com.cdbl.leavemanager.data.model.ChangePasswordRequest): Result<String> {
        return try {
            val response = authService.changePassword("Bearer $token", request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("Password updated successfully")
            } else {
                val errorBody = response.errorBody()?.string()
                // Simple parsing of error message
                val message = if (errorBody != null && errorBody.contains("error")) {
                    errorBody.substringAfter("error\":\"").substringBefore("\"")
                } else {
                    "Failed to update password"
                }
                Result.failure(Exception(message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProfileDetails(token: String): Result<com.cdbl.leavemanager.data.model.UserDetailsResponse> {
        return try {
            val response = authService.getUserProfile("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch profile details"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePersonalProfile(token: String, data: Map<String, Any?>): Result<String> {
        return try {
            val request = com.cdbl.leavemanager.data.model.UpdateProfileRequest("personal", data)
            val response = authService.updateProfile("Bearer $token", request)
            if (response.isSuccessful) {
                Result.success("Profile updated successfully")
            } else {
                 val errorBody = response.errorBody()?.string()
                // Simple parsing or default message
                Result.failure(Exception("Failed to update profile: $errorBody"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
