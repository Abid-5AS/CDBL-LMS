package com.cdbl.leavemanager.core.common

/**
 * A generic wrapper for handling API/data operation results.
 * Follows Now in Android's result pattern for clean error handling.
 */
sealed interface Result<out T> {
    data class Success<T>(val data: T) : Result<T>
    data class Error(val exception: Throwable) : Result<Nothing>
    data object Loading : Result<Nothing>
}

/**
 * Extension to convert Result to UiState
 */
fun <T> Result<T>.asUiState(): UiState<T> = when (this) {
    is Result.Success -> UiState.Success(data)
    is Result.Error -> UiState.Error(exception.message ?: "Unknown error")
    is Result.Loading -> UiState.Loading
}

/**
 * Map Result data transformation
 */
inline fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> {
    return when (this) {
        is Result.Success -> Result.Success(transform(data))
        is Result.Error -> Result.Error(exception)
        is Result.Loading -> Result.Loading
    }
}

/**
 * Execute action on success
 */
inline fun <T> Result<T>.onSuccess(action: (T) -> Unit): Result<T> {
    if (this is Result.Success) {
        action(data)
    }
    return this
}

/**
 * Execute action on error
 */
inline fun <T> Result<T>.onError(action: (Throwable) -> Unit): Result<T> {
    if (this is Result.Error) {
        action(exception)
    }
    return this
}
