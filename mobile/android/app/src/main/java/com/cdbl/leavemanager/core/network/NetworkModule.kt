package com.cdbl.leavemanager.core.network

import com.cdbl.leavemanager.BuildConfig
import com.cdbl.leavemanager.data.local.TokenManager
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthInterceptorOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class LoggingInterceptorOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class ErrorInterceptorOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setLenient()
            .create()
    }

    /**
     * Auth interceptor to add JWT token to requests
     */
    @AuthInterceptorOkHttpClient
    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenManager: TokenManager): Interceptor {
        return Interceptor { chain ->
            val token = tokenManager.getToken()
            val request = chain.request()

            val newRequest = if (token != null) {
                request.newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else {
                request
            }

            chain.proceed(newRequest)
        }
    }

    /**
     * Logging interceptor for debugging
     */
    @LoggingInterceptorOkHttpClient
    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
    }

    /**
     * Error handling interceptor
     */
    @ErrorInterceptorOkHttpClient
    @Provides
    @Singleton
    fun provideErrorInterceptor(): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            val response = chain.proceed(request)

            // Handle specific error codes
            when (response.code) {
                401 -> {
                    // Token expired - could emit event to refresh
                    // For now, just pass through
                }
                403 -> {
                    // Forbidden - insufficient permissions
                }
                500, 502, 503 -> {
                    // Server errors
                }
            }

            response
        }
    }

    /**
     * OkHttpClient with all interceptors
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(
        @AuthInterceptorOkHttpClient authInterceptor: Interceptor,
        @LoggingInterceptorOkHttpClient loggingInterceptor: HttpLoggingInterceptor,
        @ErrorInterceptorOkHttpClient errorInterceptor: Interceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .addInterceptor(errorInterceptor)
            .addInterceptor(loggingInterceptor)
            .retryOnConnectionFailure(true)
            .build()
    }

    /**
     * Retrofit instance
     */
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        gson: Gson
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    // API Services

    @Provides
    @Singleton
    fun provideAuthService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.AuthService {
        return retrofit.create(com.cdbl.leavemanager.data.api.AuthService::class.java)
    }

    @Provides
    @Singleton
    fun provideDashboardService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.DashboardService {
        return retrofit.create(com.cdbl.leavemanager.data.api.DashboardService::class.java)
    }

    @Provides
    @Singleton
    fun provideLeaveService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.LeaveService {
        return retrofit.create(com.cdbl.leavemanager.data.api.LeaveService::class.java)
    }

    @Provides
    @Singleton
    fun provideApprovalApiService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.ApprovalApiService {
        return retrofit.create(com.cdbl.leavemanager.data.api.ApprovalApiService::class.java)
    }

    @Provides
    @Singleton
    fun providePolicyService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.PolicyService {
        return retrofit.create(com.cdbl.leavemanager.data.api.PolicyService::class.java)
    }

    @Provides
    @Singleton
    fun provideAnalyticsService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.AnalyticsService {
        return retrofit.create(com.cdbl.leavemanager.data.api.AnalyticsService::class.java)
    }

    @Provides
    @Singleton
    fun provideEncashmentService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.EncashmentService {
        return retrofit.create(com.cdbl.leavemanager.data.api.EncashmentService::class.java)
    }
}
