package app.vercel.ummy_chat.twa.ui.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.vercel.ummy_chat.twa.data.repository.AuthRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class SplashState {
    object Loading : SplashState()
    object Authenticated : SplashState()
    object Unauthenticated : SplashState()
}

class SplashViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _splashState = MutableStateFlow<SplashState>(SplashState.Loading)
    val splashState: StateFlow<SplashState> = _splashState.asStateFlow()

    init {
        checkAuthStatus()
    }

    private fun checkAuthStatus() {
        viewModelScope.launch {
            // Keep splash branding visible for minimum 1.5 seconds for premium entry feel
            delay(1500)
            val isLoggedIn = authRepository.isUserLoggedIn()
            if (isLoggedIn) {
                _splashState.value = SplashState.Authenticated
            } else {
                _splashState.value = SplashState.Unauthenticated
            }
        }
    }
}
