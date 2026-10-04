package in.nizhal.app.ui.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import in.nizhal.app.data.SessionManager
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface AuthState {
    object Loading : AuthState
    object Unauthenticated : AuthState
    data class Authenticated(val role: String) : AuthState
}

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val sessionManager = SessionManager(application)

    val authState: StateFlow<AuthState> = sessionManager.userSessionFlow
        .map { session ->
            if (!session.isLoggedIn) {
                AuthState.Unauthenticated
            } else {
                AuthState.Authenticated(role = session.role)
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = AuthState.Loading
        )

    fun login(role: String) {
        viewModelScope.launch {
            sessionManager.saveSession(isLoggedIn = true, role = role)
        }
    }

    fun logout() {
        viewModelScope.launch {
            sessionManager.clearSession()
        }
    }
}
