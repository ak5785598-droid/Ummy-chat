package app.vercel.ummy_chat.twa.ui.auth

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.data.model.COUNTRIES_LIST
import coil.compose.AsyncImage
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.ApiException

// ============================================================
// React Native login.tsx → Kotlin Compose (1-to-1 Line Match)
// Source: src/app/(auth)/login.tsx (580 lines)
// ============================================================

@Composable
fun LoginScreen(
    onNavigateHome: () -> Unit,
    onNavigateOnboarding: () -> Unit,
    viewModel: LoginViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedCountry by viewModel.selectedCountry.collectAsState()
    val context = LocalContext.current
    val activity = context as? Activity

    // Phone Login State (React Native L132-136)
    var showPhonePopup by remember { mutableStateOf(false) }
    var phoneLoginStep by remember { mutableStateOf("number") } // "number" or "code"
    var phoneNumberInput by remember { mutableStateOf("") }
    var otpInput by remember { mutableStateOf("") }

    // Country Picker (React Native L139-141)
    var showCountryPicker by remember { mutableStateOf(false) }
    var countrySearchQuery by remember { mutableStateOf("") }

    // ============================================================
    // ⚡ GOOGLE SIGN-IN (React Native L14-24, L252-289) ⚡
    // ============================================================
    val webClientId = "373109833688-655nmcl2juhrn5kop38geb4khuu3dsl5.apps.googleusercontent.com"
    val googleSignInClient: GoogleSignInClient = remember {
        GoogleSignIn.getClient(
            context,
            GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .build()
        )
    }
    val googleLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            if (account.isSuccessful) {
                val idToken = account.result.idToken
                if (idToken != null) {
                    // React Native: accessToken || 'placeholder_access_token'
                    val accessToken = account.result.serverAuthCode ?: "placeholder_access_token"
                    viewModel.loginWithGoogleCredential(idToken, accessToken)
                } else {
                    viewModel.showError("Google Sign In succeeded but ID Token is missing.")
                }
            } else {
                // React Native: ignore SIGN_IN_CANCELLED (12501)
                val statusCode = (account.exception as? ApiException)?.statusCode
                android.util.Log.d(
                    "UmmyLogin",
                    "Google sign-in failed: code=$statusCode msg=${account.exception?.message}"
                )
                if (statusCode != GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
                    viewModel.showError(
                        account.exception?.message ?: "Google Sign In failed. Please try again."
                    )
                }
            }
        }
    }

    // ============================================================
    // ⚡ FACEBOOK SIGN-IN (React Native L294-311) ⚡
    // ============================================================
    val callbackManager = remember { CallbackManager.Factory.create() }
    LaunchedEffect(Unit) {
        LoginManager.getInstance().registerCallback(
            callbackManager,
            object : FacebookCallback<LoginResult> {
                override fun onSuccess(result: LoginResult) {
                    viewModel.loginWithFacebookCredential(result.accessToken.token)
                }

                override fun onCancel() {
                    // React Native: result.isCancelled → just reset
                }

                override fun onError(error: FacebookException) {
                    viewModel.showError("Facebook Sign In failed. Please try again.")
                }
            }
        )
    }

    // Navigate on success (React Native handlePostAuth → router.replace)
    LaunchedEffect(uiState) {
        when (uiState) {
            is LoginUiState.Success -> {
                showPhonePopup = false
                onNavigateHome()
            }
            is LoginUiState.OnboardingRequired -> {
                showPhonePopup = false
                onNavigateOnboarding()
            }
            is LoginUiState.OtpSent -> phoneLoginStep = "code"
            else -> {}
        }
    }

    val isSigningIn = uiState is LoginUiState.Loading

    // ============================================================
    // ⚡ UI RENDER (React Native L366-578) ⚡
    // ============================================================
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black) // React Native: bg-black (L367)
    ) {
        // 1. Gradient Backdrop (React Native L370): colors={['#0a0026', '#B027FF', '#6b0643']}
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF0A0026),
                            Color(0xFFB027FF),
                            Color(0xFF6B0643)
                        )
                    )
                )
        )

        // 2. LoginBackground particles overlay (React Native L371): <LoginBackground floatAnim={floatAnim}/>
        LoginBackgroundParticles()

        // 3. Dark overlay (React Native L373): bg-black/35
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.35f))
        )

        // 4. Main Card (React Native L376-440)
        // flex-1 justify-center items-center px-5
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp), // px-5 = 20dp
            contentAlignment = Alignment.Center
        ) {
            // w-full max-w-md rounded-3xl bg-white/10 border border-white/20 shadow-2xl p-6 items-center
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp)) // rounded-3xl
                    .background(Color.White.copy(alpha = 0.1f)) // bg-white/10
                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp)) // border-white/20
                    .padding(24.dp), // p-6
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ── Logo (React Native L378-385) ──
                // h-20 w-20 rounded-2xl overflow-hidden bg-white/20 items-center justify-center mb-6
                Box(
                    modifier = Modifier
                        .size(80.dp) // h-20 w-20
                        .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                        .background(Color.White.copy(alpha = 0.2f)), // bg-white/20
                    contentAlignment = Alignment.Center
                ) {
                    // source={require('ummy-logon.png')} h-16 w-16 contentFit="contain"
                    Image(
                        painter = painterResource(id = R.drawable.ummy_logon),
                        contentDescription = "Ummy Logo",
                        modifier = Modifier.size(64.dp), // h-16 w-16
                        contentScale = ContentScale.Fit // contentFit="contain"
                    )
                }

                Spacer(modifier = Modifier.height(24.dp)) // mb-6

                // ── Title (React Native L388-391) ──
                // text-3xl font-bold text-white mb-1
                Text(
                    text = "Ummy",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 30.sp // text-3xl
                )
                Spacer(modifier = Modifier.height(4.dp)) // mb-1
                // text-sm text-white/80 font-medium
                Text(
                    text = "Find your vibe. Connect with your Tribe",
                    color = Color.White.copy(alpha = 0.8f), // text-white/80
                    fontSize = 14.sp, // text-sm
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(24.dp)) // mb-6

                // ── Auth Buttons (React Native L394-405) ──
                // w-full space-y-3
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp) // space-y-3
                ) {
                    // Facebook Button (React Native L396-398)
                    // React Native L294-311: handleFacebookSignIn → fbsdk login
                    Button(
                        onClick = {
                            val registryOwner = context as? androidx.activity.result.ActivityResultRegistryOwner
                            if (registryOwner != null) {
                                LoginManager.getInstance().logInWithReadPermissions(
                                    registryOwner,
                                    callbackManager,
                                    listOf("public_profile", "email")
                                )
                            }
                        },
                        enabled = !isSigningIn,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp), // h-12
                        shape = RoundedCornerShape(12.dp), // rounded-xl
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)) // bg-blue-600
                    ) {
                        // text-white font-bold text-base
                        Text(
                            text = "Continue with Facebook",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp // text-base
                        )
                    }

                    // Google Button (React Native L401-404)
                    // React Native L252-289: handleGoogleSignIn
                    Button(
                        onClick = {
                            // Force signOut before signIn so the Account Picker ALWAYS pops up
                            if (activity != null) {
                                googleSignInClient.signOut().addOnCompleteListener {
                                    // hasPlayServices (React Native: hasPlayServices({ showPlayServicesUpdateDialog: true }))
                                    val availability = GoogleApiAvailability.getInstance()
                                        .isGooglePlayServicesAvailable(context)
                                    if (availability != ConnectionResult.SUCCESS) {
                                        GoogleApiAvailability.getInstance().getErrorDialog(
                                            activity, availability, 9001
                                        )?.show()
                                    } else {
                                        googleLauncher.launch(googleSignInClient.signInIntent)
                                    }
                                }
                            }
                        },
                        enabled = !isSigningIn,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp), // h-12
                        shape = RoundedCornerShape(12.dp), // rounded-xl
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White) // bg-white
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // React Native: <Image source={{ uri: 'g-logo.png' }} w-5 h-5 mr-2 />
                            AsyncImage(
                                model = "https://developers.google.com/static/identity/images/g-logo.png",
                                contentDescription = "Google logo",
                                modifier = Modifier.size(20.dp), // w-5 h-5
                                contentScale = ContentScale.Fit
                            )
                            Spacer(modifier = Modifier.width(8.dp)) // mr-2
                            // text-black font-bold text-base
                            Text(
                                text = "Sign in with Google",
                                color = Color.Black,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp // text-base
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp)) // my-6

                // ── Divider (React Native L408-412) ──
                // flex-row items-center w-full
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // flex-1 h-px bg-white/30
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(1.dp)
                            .background(Color.White.copy(alpha = 0.3f))
                    )
                    // text-xs text-white/70 mx-3 uppercase font-medium
                    Text(
                        text = "OR",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 12.sp, // text-xs
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 12.dp) // mx-3
                    )
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(1.dp)
                            .background(Color.White.copy(alpha = 0.3f))
                    )
                }

                Spacer(modifier = Modifier.height(24.dp)) // my-6 bottom half

                // ── Phone Button (React Native L415-417) ──
                // w-20 h-12 rounded-xl bg-white/20 border border-white/30 items-center justify-center
                Box(
                    modifier = Modifier
                        .width(80.dp) // w-20
                        .height(48.dp) // h-12
                        .clip(RoundedCornerShape(12.dp)) // rounded-xl
                        .background(Color.White.copy(alpha = 0.2f)) // bg-white/20
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(12.dp)) // border-white/30
                        .clickable { showPhonePopup = true },
                    contentAlignment = Alignment.Center
                ) {
                    // React Native: <Phone size={22} color="white"/>
                    Icon(
                        Icons.Filled.Phone,
                        contentDescription = "Phone",
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp)) // mt-6

                // ── Terms (React Native L420-422) ──
                // text-[11px] text-white/70 leading-snug text-center
                Text(
                    text = "By continuing you agree to the User Agreement & Privacy Policy",
                    color = Color.White.copy(alpha = 0.7f), // text-white/70
                    fontSize = 11.sp, // text-[11px]
                    textAlign = TextAlign.Center,
                    lineHeight = 14.sp // leading-snug
                )

                // ── Loading Indicator (React Native L425-438) ──
                if (isSigningIn) {
                    Spacer(modifier = Modifier.height(14.dp)) // marginTop: 14
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp) // gap: 8
                    ) {
                        // ActivityIndicator size="small" color="#fbbf24"
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = Color(0xFFFBBF24),
                            strokeWidth = 2.dp
                        )
                        // color: rgba(255,255,255,0.9) fontSize: 12 fontWeight: '600'
                        Text(
                            text = "Signing in, please wait...",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // ── Error Message ──
                if (uiState is LoginUiState.Error) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = (uiState as LoginUiState.Error).message,
                        color = Color(0xFFFF6B6B),
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // ============================================================
        // ⚡ PHONE LOGIN MODAL (React Native L445-527) ⚡
        // ============================================================
        if (showPhonePopup) {
            Dialog(onDismissRequest = {
                showPhonePopup = false
                phoneLoginStep = "number" // React Native L449: setPhoneLoginStep('number')
            }) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        // React Native L447: rounded-[32px] bg-gradient-to-b from-[#FF91B5] to-[#f472b6]
                        .clip(RoundedCornerShape(32.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFFFF91B5), Color(0xFFF472B6))
                            )
                        )
                        // border border-white/20
                        .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(32.dp))
                        .padding(24.dp) // p-6
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // ── Close (X) Button (React Native L449-451) ──
                        // absolute top-4 right-4 p-2 bg-white/10 rounded-full
                        Box(modifier = Modifier.fillMaxWidth()) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.1f))
                                    .clickable {
                                        showPhonePopup = false
                                        phoneLoginStep = "number"
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                // React Native: <X size={20} color="rgba(255,255,255,0.7)"/>
                                Icon(
                                    Icons.Filled.Close,
                                    contentDescription = "Close",
                                    tint = Color.White.copy(alpha = 0.7f),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // ── Phone Icon Container (React Native L454-456) ──
                        // h-16 w-16 bg-white/10 rounded-3xl items-center justify-center mb-6 shadow-inner
                        Box(
                            modifier = Modifier
                                .size(64.dp) // h-16 w-16
                                .clip(RoundedCornerShape(24.dp)) // rounded-3xl
                                .background(Color.White.copy(alpha = 0.1f)), // bg-white/10
                            contentAlignment = Alignment.Center
                        ) {
                            // React Native: <Phone size={28} color="#FFCC00"/>
                            Icon(
                                Icons.Filled.Phone,
                                contentDescription = "Phone",
                                tint = Color(0xFFFFCC00),
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp)) // mb-6

                        // ── Title (React Native L458-460) ──
                        // text-2xl font-bold text-white mb-2 text-center tracking-tight
                        Text(
                            text = if (phoneLoginStep == "number") "Enter Phone Number" else "Enter OTP Code",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp, // text-2xl
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp)) // mb-2

                        // ── Subtitle (React Native L461-466) ──
                        // text-sm font-medium text-white/60 text-center mb-8 px-2
                        Text(
                            text = if (phoneLoginStep == "number")
                                "We will send you a verification code to authenticate your account securely."
                            else "A 6-digit code was sent to $phoneNumberInput",
                            color = Color.White.copy(alpha = 0.6f), // text-white/60
                            fontSize = 14.sp, // text-sm
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 8.dp) // px-2
                        )

                        Spacer(modifier = Modifier.height(32.dp)) // mb-8

                        if (phoneLoginStep == "number") {
                            // ── Phone Number Input Section (React Native L468-489) ──
                            // flex-row gap-2 w-full
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp) // gap-2
                            ) {
                                // Country Picker Button (React Native L471-475)
                                // h-14 w-[85px] bg-black/20 border-white/10 rounded-2xl px-2
                                Row(
                                    modifier = Modifier
                                        .height(56.dp) // h-14
                                        .width(85.dp) // w-[85px]
                                        .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                                        .background(Color.Black.copy(alpha = 0.2f)) // bg-black/20
                                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp)) // border-white/10
                                        .clickable { showCountryPicker = true }
                                        .padding(horizontal = 8.dp), // px-2
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(selectedCountry.flag, fontSize = 20.sp) // text-xl
                                    Text(selectedCountry.code, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp) // text-xs font-bold
                                    // React Native: <ChevronDown size={12} color="rgba(255,255,255,0.5)"/>
                                    Icon(
                                        Icons.Filled.ArrowDropDown,
                                        contentDescription = null,
                                        tint = Color.White.copy(alpha = 0.5f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                // Phone Number TextField (React Native L476-483)
                                // flex-1 h-14 bg-black/20 border-white/10 rounded-2xl px-4 text-white text-lg font-bold
                                OutlinedTextField(
                                    value = phoneNumberInput,
                                    onValueChange = { phoneNumberInput = it },
                                    placeholder = { Text("Number", color = Color.White.copy(alpha = 0.3f)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(56.dp), // h-14
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedBorderColor = Color(0xFFFFCC00),
                                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                        focusedContainerColor = Color.Black.copy(alpha = 0.2f),
                                        unfocusedContainerColor = Color.Black.copy(alpha = 0.2f)
                                    ),
                                    shape = RoundedCornerShape(16.dp) // rounded-2xl
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp)) // space-y-4

                            // Send Code Button (React Native L486-488)
                            // w-full h-14 rounded-2xl bg-[#FFCC00]
                            Button(
                                onClick = {
                                    // React Native: handleSendCode → auth.signInWithPhoneNumber
                                    if (activity != null) {
                                        viewModel.sendOtp(phoneNumberInput, activity)
                                    }
                                },
                                enabled = !isSigningIn && phoneNumberInput.isNotBlank(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp), // h-14
                                shape = RoundedCornerShape(16.dp), // rounded-2xl
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFCC00)) // bg-[#FFCC00]
                            ) {
                                // text-black font-bold text-lg
                                Text(
                                    text = if (isSigningIn) "Sending..." else "Send Code",
                                    color = Color.Black,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp // text-lg
                                )
                            }
                        } else {
                            // ── OTP Verification Section (React Native L490-524) ──

                            // Segmented OTP Input (React Native L493-507)
                            // 6 individual boxes: w-11 h-14 rounded-2xl border
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally) // gap-2.5
                            ) {
                                for (index in 0..5) {
                                    val char = otpInput.getOrNull(index)?.toString() ?: ""
                                    val isFocused = otpInput.length == index

                                    Box(
                                        modifier = Modifier
                                            .width(44.dp) // w-11
                                            .height(56.dp) // h-14
                                            .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                                            .background(Color.Black.copy(alpha = if (isFocused) 0.3f else 0.2f)) // bg-black/20 or bg-black/30
                                            .border(
                                                1.dp,
                                                when {
                                                    isFocused -> Color(0xFFFFCC00) // border-[#FFCC00]
                                                    char.isNotEmpty() -> Color.White.copy(alpha = 0.3f) // border-white/30
                                                    else -> Color.White.copy(alpha = 0.1f) // border-white/10
                                                },
                                                RoundedCornerShape(16.dp)
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (char.isNotEmpty()) {
                                            // text-white text-xl font-black
                                            Text(char, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                                        } else if (isFocused) {
                                            // Blinking cursor: w-1 h-5 bg-[#FFCC00] rounded-full animate-pulse
                                            val infiniteTransition = rememberInfiniteTransition(label = "CursorBlink")
                                            val cursorAlpha by infiniteTransition.animateFloat(
                                                initialValue = 1f,
                                                targetValue = 0f,
                                                animationSpec = infiniteRepeatable(
                                                    animation = tween(600),
                                                    repeatMode = RepeatMode.Reverse
                                                ),
                                                label = "CursorAlpha"
                                            )
                                            Box(
                                                modifier = Modifier
                                                    .width(4.dp) // w-1
                                                    .height(20.dp) // h-5
                                                    .clip(RoundedCornerShape(50))
                                                    .background(Color(0xFFFFCC00).copy(alpha = cursorAlpha))
                                            )
                                        }
                                    }
                                }
                            }

                            // Hidden actual text input to capture keyboard (React Native L508-515)
                            // absolute w-full h-full opacity-0 autoFocus
                            val focusRequester = remember { FocusRequester() }
                            OutlinedTextField(
                                value = otpInput,
                                onValueChange = { if (it.length <= 6) otpInput = it },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(1.dp) // effectively hidden
                                    .focusRequester(focusRequester),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.Transparent,
                                    unfocusedTextColor = Color.Transparent,
                                    focusedContainerColor = Color.Transparent,
                                    unfocusedContainerColor = Color.Transparent,
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent
                                )
                            )
                            LaunchedEffect(Unit) { focusRequester.requestFocus() }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Verify & Login Button (React Native L517-519)
                            // w-full h-14 rounded-2xl bg-white
                            Button(
                                onClick = { viewModel.verifyOtp(otpInput) },
                                enabled = !isSigningIn && otpInput.length == 6,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp), // h-14
                                shape = RoundedCornerShape(16.dp), // rounded-2xl
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White) // bg-white
                            ) {
                                // text-[#140028] font-bold text-lg
                                Text(
                                    text = if (isSigningIn) "Verifying..." else "Verify & Login",
                                    color = Color(0xFF140028),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // "Change Phone Number" link (React Native L521-523)
                            // text-white/50 text-sm font-semibold
                            Text(
                                text = "Change Phone Number",
                                color = Color.White.copy(alpha = 0.5f), // text-white/50
                                fontSize = 14.sp, // text-sm
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.clickable {
                                    phoneLoginStep = "number"
                                    otpInput = ""
                                }
                            )
                        }
                    }
                }
            }
        }

        // ============================================================
        // ⚡ COUNTRY PICKER MODAL (React Native L533-577) ⚡
        // ============================================================
        if (showCountryPicker) {
            Dialog(onDismissRequest = { showCountryPicker = false }) {
                // React Native L535: w-full max-w-sm h-[80vh] bg-[#1a1a1a] border-white/10 rounded-[40px]
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(500.dp) // h-[80vh] approximation
                        .clip(RoundedCornerShape(40.dp)) // rounded-[40px]
                        .background(Color(0xFF1A1A1A)) // bg-[#1a1a1a]
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(40.dp))
                ) {
                    Column {
                        // Header (React Native L537-554)
                        // p-6 border-b border-white/5
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp) // p-6
                        ) {
                            // flex-row items-center justify-between mb-6
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // text-xl font-bold text-white
                                Text(
                                    text = "Select Country",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp // text-xl
                                )

                                // Close (X) button (React Native L540-542)
                                // p-2 bg-white/10 rounded-full
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape) // rounded-full
                                        .background(Color.White.copy(alpha = 0.1f)) // bg-white/10
                                        .clickable { showCountryPicker = false },
                                    contentAlignment = Alignment.Center
                                ) {
                                    // React Native: <X size={20} color="rgba(255,255,255,0.7)"/>
                                    Icon(
                                        Icons.Filled.Close,
                                        contentDescription = "Close",
                                        tint = Color.White.copy(alpha = 0.7f),
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(24.dp)) // mb-6

                            // Search Field (React Native L545-553)
                            // w-full h-12 bg-white/5 border-white/10 rounded-2xl pl-12 pr-4
                            OutlinedTextField(
                                value = countrySearchQuery,
                                onValueChange = { countrySearchQuery = it },
                                placeholder = { Text("Search country/code", color = Color.White.copy(alpha = 0.2f)) },
                                leadingIcon = {
                                    // React Native: <Search size={16} color="rgba(255,255,255,0.4)"/>
                                    Icon(
                                        Icons.Filled.Search,
                                        contentDescription = "Search",
                                        tint = Color.White.copy(alpha = 0.4f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp), // h-12
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedBorderColor = Color.White.copy(alpha = 0.1f),
                                    unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                    focusedContainerColor = Color.White.copy(alpha = 0.05f),
                                    unfocusedContainerColor = Color.White.copy(alpha = 0.05f)
                                ),
                                shape = RoundedCornerShape(16.dp) // rounded-2xl
                            )
                        }

                        // Divider line (border-b border-white/5)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(Color.White.copy(alpha = 0.05f))
                        )

                        // Country List (React Native L558-573)
                        // flex-1 p-2
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 8.dp) // p-2
                        ) {
                            val filteredCountries = COUNTRIES_LIST.filter { country ->
                                country.name.lowercase().contains(countrySearchQuery.lowercase()) ||
                                        country.code.contains(countrySearchQuery)
                            }
                            items(filteredCountries) { countryItem ->
                                // React Native L563: w-full h-16 px-4 flex-row items-center justify-between rounded-3xl
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(64.dp) // h-16
                                        .clip(RoundedCornerShape(24.dp)) // rounded-3xl
                                        .clickable {
                                            viewModel.selectCountry(countryItem)
                                            showCountryPicker = false
                                            countrySearchQuery = "" // React Native: setCountrySearchQuery('')
                                        }
                                        .padding(horizontal = 16.dp), // px-4
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Left side: flag + name + id
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(16.dp) // gap-4
                                    ) {
                                        // text-2xl w-8 text-center
                                        Text(countryItem.flag, fontSize = 24.sp)

                                        Column {
                                            // text-white font-bold text-sm
                                            Text(
                                                text = countryItem.name,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp // text-sm
                                            )
                                            // text-white/50 text-xs (React Native L568)
                                            Text(
                                                text = countryItem.id,
                                                color = Color.White.copy(alpha = 0.5f),
                                                fontSize = 12.sp // text-xs
                                            )
                                        }
                                    }

                                    // Right side: country code
                                    // text-white/70 font-bold text-sm
                                    Text(
                                        text = countryItem.code,
                                        color = Color.White.copy(alpha = 0.7f),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp // text-sm
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
