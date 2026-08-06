package app.vercel.ummy_chat.twa.ui.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.vercel.ummy_chat.twa.data.DeviceSessionManager
import app.vercel.ummy_chat.twa.data.model.COUNTRIES_LIST
import app.vercel.ummy_chat.twa.data.model.Country
import app.vercel.ummy_chat.twa.data.repository.UserRepository
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class OtpSent(val verificationId: String) : LoginUiState()
    object Success : LoginUiState()
    object OnboardingRequired : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val userRepository: UserRepository = UserRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val _selectedCountry = MutableStateFlow(COUNTRIES_LIST[0])
    val selectedCountry: StateFlow<Country> = _selectedCountry.asStateFlow()

    private var verificationIdSaved: String? = null

    fun selectCountry(country: Country) {
        _selectedCountry.value = country
    }

    fun showError(message: String) {
        _uiState.value = LoginUiState.Error(message)
    }

    // ============================================================
    // ⚡ PHONE AUTH ERROR MESSAGES (React Native login.tsx L74-94) ⚡
    // ============================================================
    companion object {
        private val PHONE_AUTH_ERRORS = mapOf(
            "auth/missing-verification-code" to "Missing OTP code. Please enter the code received via SMS.",
            "auth/invalid-verification-code" to "Invalid or expired OTP. Please request a new code.",
            "auth/missing-phone-number" to "Please enter a valid phone number.",
            "auth/invalid-phone-number" to "Invalid phone number format. Please check and try again.",
            "auth/quota-exceeded" to "Too many OTP requests. Please wait a few minutes and try again.",
            "auth/too-many-requests" to "Too many attempts. Please try again later.",
            "auth/missing-verification-id" to "Verification session expired. Please start again.",
            "auth/invalid-verification-id" to "Invalid verification session. Please restart.",
            "auth/session-expired" to "OTP session expired. Please request a new code.",
            "auth/app-not-authorized" to "Firebase Phone Auth not configured in this app. Please check:\n1. SHA-1 fingerprint in Firebase Console\n2. SafetyNet/Play Integrity enabled\n3. App is signed with correct certificate",
            "auth/captcha-check-failed" to "Security check failed. Enable SafetyNet in Firebase Console > Project Settings > App Check.",
            "auth/invalid-cert-hash" to "Invalid certificate hash. The SHA-1 in Firebase Console does not match this build.",
            "default" to "Phone authentication failed. Please try again or use Google/Facebook login."
        )

        // Native Android error codes are ERROR_INVALID_VERIFICATION_CODE etc.
        // React Native normalizes them to auth/invalid-verification-code form.
        private fun getPhoneAuthErrorMessage(e: Exception): String {
            val code = (e as? FirebaseAuthException)?.errorCode ?: ""
            val normalized = code
                .removePrefix("ERROR_")
                .lowercase()
                .replace("_", "-")
            return PHONE_AUTH_ERRORS["auth/$normalized"]
                ?: e.message
                ?: PHONE_AUTH_ERRORS["default"]!!
        }
    }

    // ============================================================
    // ⚡ PHONE AUTH - SEND OTP (React Native login.tsx L316-338) ⚡
    // ============================================================
    fun sendOtp(phoneNumber: String, activity: Activity) {
        val cleanNumber = phoneNumber.filter { it.isDigit() }
        if (cleanNumber.length < 10) {
            _uiState.value = LoginUiState.Error("Enter a valid phone number (min 10 digits).")
            return
        }
        val formattedNumber = "${_selectedCountry.value.code}$cleanNumber"

        _uiState.value = LoginUiState.Loading
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(formattedNumber)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                    signInWithPhoneCredential(credential)
                }

                override fun onVerificationFailed(e: FirebaseException) {
                    _uiState.value = LoginUiState.Error(getPhoneAuthErrorMessage(e))
                }

                override fun onCodeSent(
                    verificationId: String,
                    token: PhoneAuthProvider.ForceResendingToken
                ) {
                    verificationIdSaved = verificationId
                    _uiState.value = LoginUiState.OtpSent(verificationId)
                }
            })
            .build()

        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    // ============================================================
    // ⚡ PHONE AUTH - VERIFY OTP (React Native login.tsx L344-361) ⚡
    // ============================================================
    fun verifyOtp(otpCode: String) {
        val verId = verificationIdSaved
        if (verId == null || otpCode.length < 6) {
            _uiState.value = LoginUiState.Error("Please enter the complete 6-digit OTP.")
            return
        }
        _uiState.value = LoginUiState.Loading
        val credential = PhoneAuthProvider.getCredential(verId, otpCode)
        signInWithPhoneCredential(credential)
    }

    // ============================================================
    // ⚡ GOOGLE SIGN-IN (React Native login.tsx L252-289) ⚡
    // ============================================================
    fun loginWithGoogleCredential(idToken: String, accessToken: String?) {
        _uiState.value = LoginUiState.Loading
        val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(idToken, accessToken)
        auth.signInWithCredential(credential).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val user = auth.currentUser
                if (user != null) {
                    viewModelScope.launch {
                        handlePostAuth(user.uid, user.email, user.displayName)
                    }
                } else {
                    _uiState.value = LoginUiState.Error("Google Sign In failed.")
                }
            } else {
                _uiState.value = LoginUiState.Error(
                    task.exception?.localizedMessage ?: "Google Sign In failed. Please try again."
                )
            }
        }
    }

    // ============================================================
    // ⚡ FACEBOOK SIGN-IN (React Native login.tsx L294-311) ⚡
    // ============================================================
    fun loginWithFacebookCredential(accessToken: String) {
        _uiState.value = LoginUiState.Loading
        val credential = com.google.firebase.auth.FacebookAuthProvider.getCredential(accessToken)
        auth.signInWithCredential(credential).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val user = auth.currentUser
                if (user != null) {
                    viewModelScope.launch {
                        handlePostAuth(user.uid, user.email, user.displayName)
                    }
                } else {
                    _uiState.value = LoginUiState.Error("Facebook Sign In failed.")
                }
            } else {
                _uiState.value = LoginUiState.Error(
                    task.exception?.localizedMessage ?: "Facebook Sign In failed. Please try again."
                )
            }
        }
    }

    private fun signInWithPhoneCredential(credential: PhoneAuthCredential) {
        auth.signInWithCredential(credential).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val user = auth.currentUser
                if (user != null) {
                    viewModelScope.launch {
                        handlePostAuth(user.uid, user.email, user.displayName)
                    }
                } else {
                    _uiState.value = LoginUiState.Error("Authentication failed.")
                }
            } else {
                _uiState.value = LoginUiState.Error(
                    getPhoneAuthErrorMessage(task.exception ?: Exception())
                )
            }
        }
    }

    // ============================================================
    // ⚡ POST-AUTH NAVIGATION (React Native login.tsx L219-247) ⚡
    // ============================================================
    private suspend fun handlePostAuth(uid: String, email: String?, displayName: String?) {
        try {
            if (userRepository.userExists(uid)) {
                if (userRepository.isBanned(uid)) {
                    _uiState.value = LoginUiState.Error("Your account is banned.")
                    return
                }
                DeviceSessionManager.registerDeviceSession(firestore, uid)
                if (userRepository.hasOnboardingComplete(uid)) {
                    _uiState.value = LoginUiState.Success
                } else {
                    _uiState.value = LoginUiState.OnboardingRequired
                }
            } else {
                userRepository.syncUserIdentity(uid, email, displayName)
                DeviceSessionManager.registerDeviceSession(firestore, uid)
                _uiState.value = LoginUiState.OnboardingRequired
            }
        } catch (e: Exception) {
            _uiState.value = LoginUiState.Success
        }
    }
}
