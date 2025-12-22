package com.cdbl.leavemanager.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val BASE_URL = "http://10.0.2.2:3000/api/" // Android Emulator localhost

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

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
    fun provideAnalyticsService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.AnalyticsService {
        return retrofit.create(com.cdbl.leavemanager.data.api.AnalyticsService::class.java)
    }

    @Provides
    @Singleton
    fun provideEncashmentService(retrofit: Retrofit): com.cdbl.leavemanager.data.api.EncashmentService {
        return retrofit.create(com.cdbl.leavemanager.data.api.EncashmentService::class.java)
    }
}
