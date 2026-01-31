package com.cdbl.leavemanager.core.common

/**
 * Represents the state of data in the UI layer.
 * Following Now in Android pattern for consistent UI state management.
 */
sealed interface UiState<out T> {
    /**
     * Initial state before any data loading
     */
    data object Idle : UiState<Nothing>
    
    /**
     * Loading state while fetching data
     */
    data object Loading : UiState<Nothing>
    
    /**
     * Success state with data
     */
    data class Success<T>(val data: T) : UiState<T>
    
    /**
     * Error state with message
     */
    data class Error(val message: String) : UiState<Nothing>
}

/**
 * Check if current state is loading
 */
fun <T> UiState<T>.isLoading(): Boolean = this is UiState.Loading

/**
 * Check if current state is success
 */
fun <T> UiState<T>.isSuccess(): Boolean = this is UiState.Success

/**
 * Check if current state is error
 */
fun <T> UiState<T>.isError(): Boolean = this is UiState.Error

/**
 * Get data if success, null otherwise
 */
fun <T> UiState<T>.dataOrNull(): T? = when (this) {
    is UiState.Success -> data
    else -> null
}

/**
 * Get error message if error, null otherwise
 */
fun <T> UiState<T>.errorOrNull(): String? = when (this) {
    is UiState.Error -> message
    else -> null
}
