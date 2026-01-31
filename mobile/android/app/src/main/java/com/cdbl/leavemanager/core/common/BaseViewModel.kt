package com.cdbl.leavemanager.core.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Base ViewModel with common functionality.
 * Following Now in Android's ViewModel pattern.
 */
abstract class BaseViewModel<T> : ViewModel() {
    
    protected val _uiState = MutableStateFlow<UiState<T>>(UiState.Idle)
    val uiState: StateFlow<UiState<T>> = _uiState.asStateFlow()
    
    /**
     * Global error handler for coroutines
     */
    protected val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
        handleError(throwable)
    }
    
    /**
     * Execute a suspend function with error handling
     */
    protected fun execute(
        onLoading: () -> Unit = { _uiState.value = UiState.Loading },
        onError: (Throwable) -> Unit = { handleError(it) },
        block: suspend () -> Unit
    ) {
        viewModelScope.launch(exceptionHandler) {
            try {
                onLoading()
                block()
            } catch (e: Exception) {
                onError(e)
            }
        }
    }
    
    /**
     * Handle errors and update UI state
     */
    protected open fun handleError(throwable: Throwable) {
        val message = when (throwable) {
            is java.net.UnknownHostException -> "No internet connection"
            is java.net.SocketTimeoutException -> "Request timeout"
            else -> throwable.message ?: "An error occurred"
        }
        _uiState.value = UiState.Error(message)
    }
    
    /**
     * Reset UI state to idle
     */
    fun resetState() {
        _uiState.value = UiState.Idle
    }
}
