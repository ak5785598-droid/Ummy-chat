package app.vercel.ummy_chat.twa.ui.onboarding

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Public
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.launch
import java.util.Date
import kotlin.math.roundToInt

// ============================================================
// React Native (auth)/onboarding.tsx → Kotlin Compose (1-to-1)
// Source: src/app/(auth)/onboarding.tsx (237 lines)
// ============================================================

private data class PresetAvatar(val id: String, val emoji: String, val color: String)

private val PRESET_AVATARS = listOf(
    PresetAvatar("a1", "🦁", "#fbbf24"),
    PresetAvatar("a2", "🐯", "#f97316"),
    PresetAvatar("a3", "🦊", "#ef4444"),
    PresetAvatar("a4", "🐼", "#64748b"),
    PresetAvatar("a5", "🐸", "#22c55e"),
    PresetAvatar("a6", "🐨", "#8b5cf6"),
    PresetAvatar("a7", "🦋", "#ec4899"),
    PresetAvatar("a8", "🦅", "#3b82f6"),
    PresetAvatar("a9", "🐙", "#14b8a6"),
    PresetAvatar("a10", "🦄", "#a855f7")
)

private val GENDER_OPTIONS = listOf("Male", "Female")

private val COUNTRY_OPTIONS = listOf(
    "India", "Pakistan", "Bangladesh", "United Arab Emirates", "Saudi Arabia",
    "United States", "United Kingdom", "Canada", "Australia", "Other"
)

@Composable
fun OnboardingScreen(
    onNavigateHome: () -> Unit,
    firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    val user = FirebaseAuth.getInstance().currentUser
    var step by remember { mutableStateOf(0) }
    var selectedAvatar by remember { mutableStateOf(PRESET_AVATARS[0]) }
    var username by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf<String?>(null) }
    var country by remember { mutableStateOf(COUNTRY_OPTIONS[0]) }
    var isSubmitting by remember { mutableStateOf(false) }
    var showWelcomeGift by remember { mutableStateOf(false) }

    // React Native L43-50: slideAnim toValue -newStep*width, duration 300
    val slideAnim = remember { Animatable(0f) }
    val density = LocalDensity.current
    val scope = rememberCoroutineScope()

    // ============================================================
    // ⚡ HANDLE COMPLETE (React Native L52-99) ⚡
    // ============================================================
    fun handleComplete() {
        if (user == null) return
        if (username.isBlank()) {
            // Alert.alert('Error', 'Please enter a username')
            return
        }
        if (gender == null) {
            // Alert.alert('Error', 'Please select your gender')
            return
        }
        isSubmitting = true
        val userRef = firestore.collection("users").document(user.uid)
        val profileRef = firestore.collection("users").document(user.uid).collection("profile").document(user.uid)

        val avatarUrl = "https://api.dicebear.com/9.x/initials/svg?seed=${selectedAvatar.emoji}&backgroundColor=${selectedAvatar.color.replace("#", "")}"

        val updates = hashMapOf<String, Any?>(
            "username" to username.trim(),
            "avatarUrl" to avatarUrl,
            "gender" to gender,
            "country" to country,
            "onboardingComplete" to true,
            "wallet" to hashMapOf(
                "coins" to 5000,
                "dailySpent" to 0,
                "totalSpent" to 0
            ),
            "inventory" to hashMapOf(
                "activeFrame" to "aristocracy_knight_frame",
                "activeFrameMediaUrl" to "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/frames%2Faristocracy_knight_frame.png?alt=media",
                "expiries" to hashMapOf(
                    "aristocracy_knight_frame" to com.google.firebase.Timestamp(Date(System.currentTimeMillis() + 3 * 24 * 60 * 60 * 1000))
                ),
                "ownedItems" to arrayListOf("aristocracy_knight_frame")
            ),
            "updatedAt" to FieldValue.serverTimestamp()
        )

        userRef.set(updates, SetOptions.merge())
            .addOnSuccessListener {
                profileRef.set(updates, SetOptions.merge())
                    .addOnSuccessListener { showWelcomeGift = true }
                    .addOnFailureListener { isSubmitting = false }
            }
            .addOnFailureListener { isSubmitting = false }
    }

    // Welcome Gift Alert (React Native L89-93)
    if (showWelcomeGift) {
        Dialog(onDismissRequest = { showWelcomeGift = false }) {
            Card {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Welcome Gift! 🎉", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "We have added 5,000 coins and a 3-day Knight avatar frame to your account as a welcome bonus!",
                        fontSize = 14.sp
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = {
                            showWelcomeGift = false
                            onNavigateHome()
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Great!")
                    }
                }
            }
        }
    }

    // React Native L192-195: if (!user) router.replace('/(auth)/login')
    if (user == null) {
        return
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0026)) // bg-[#0a0026]
    ) {
        // Gradient (React Native L199): colors={['#0a0026', '#B027FF', '#6b0643']}
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF0A0026), Color(0xFFB027FF), Color(0xFF6B0643))
                    )
                )
        )
        // Overlay (React Native L200): bg-black/30
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.3f))
        )

        val screenWidth = maxWidth

        Column(modifier = Modifier.fillMaxSize()) {
            // ── Step Progress Bars (React Native L202-206) ──
            // flex-row justify-center gap-2 pt-16 pb-6
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 64.dp, bottom = 24.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                for (i in 0..3) {
                    // h-1.5 rounded-full, width 40; white if i <= step else white/30
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .height(6.dp)
                            .padding(horizontal = 4.dp)
                            .clip(RoundedCornerShape(50))
                            .background(if (i <= step) Color.White else Color.White.copy(alpha = 0.3f))
                    )
                }
            }

            // ── Sliding Steps (React Native L208-216) ──
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
            ) {
                // Animated.View flex-row, translateX: slideAnim, width: width*4
                Box(
                    modifier = Modifier.offset {
                        IntOffset(slideAnim.value.roundToInt(), 0)
                    }
                ) {
                    Row(modifier = Modifier.width(screenWidth * 4)) {
                        for (stepIndex in 0..3) {
                            Box(
                                modifier = Modifier
                                    .width(screenWidth)
                                    .padding(top = 32.dp) // pt-8
                            ) {
                                renderStep(
                                    stepIndex = stepIndex,
                                    selectedAvatar = selectedAvatar,
                                    onSelectAvatar = { selectedAvatar = it },
                                    username = username,
                                    onUsernameChange = { if (it.length <= 24) username = it },
                                    gender = gender,
                                    onGenderSelect = { gender = it },
                                    country = country,
                                    onCountrySelect = { country = it }
                                )
                            }
                        }
                    }
                }
            }

            // ── Bottom Buttons (React Native L218-234) ──
            Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 48.dp)) {
                if (step > 0) {
                    // Back (React Native L220-223)
                    Text(
                        text = "Back",
                        color = Color.White.copy(alpha = 0.7f),
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .clickable {
                                scope.launch {
                                    step -= 1
                                    slideAnim.animateTo(-step * with(density) { screenWidth.toPx() }, tween(300))
                                }
                            }
                    )
                }
                // Continue / Complete (React Native L224-233)
                Button(
                    onClick = {
                        if (step < 3) {
                            step += 1
                            scope.launch {
                                slideAnim.animateTo(-step * with(density) { screenWidth.toPx() }, tween(300))
                            }
                        } else {
                            handleComplete()
                        }
                    },
                    enabled = !isSubmitting &&
                            !(step == 1 && username.isBlank()) &&
                            !(step == 2 && gender == null),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp), // h-14
                    shape = RoundedCornerShape(16.dp), // rounded-2xl
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White) // bg-white
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // text-[#140028] font-bold text-lg
                        Text(
                            text = if (isSubmitting) "Saving..." else if (step < 3) "Continue" else "Complete Setup",
                            color = Color(0xFF140028),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        if (step < 3) {
                            Spacer(Modifier.width(8.dp)) // gap-2
                            Icon(
                                Icons.Filled.ChevronRight,
                                contentDescription = null,
                                tint = Color(0xFF140028),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// ⚡ STEP RENDERER (React Native L101-190) ⚡
// ============================================================
@Composable
private fun renderStep(
    stepIndex: Int,
    selectedAvatar: PresetAvatar,
    onSelectAvatar: (PresetAvatar) -> Unit,
    username: String,
    onUsernameChange: (String) -> Unit,
    gender: String?,
    onGenderSelect: (String) -> Unit,
    country: String,
    onCountrySelect: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp), // px-6
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        when (stepIndex) {
            // ── Step 0: Avatar (React Native L103-126) ──
            0 -> {
                Text(
                    text = "Choose Your Avatar",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp, // text-2xl
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp) // mb-2
                )
                Text(
                    text = "Pick an avatar that represents you",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 32.dp) // mb-8
                )
                // flex-row flex-wrap justify-center gap-3 mb-8
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    PRESET_AVATARS.chunked(5).forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            rowItems.forEach { a ->
                                val isSelected = selectedAvatar.id == a.id
                                // w-16 h-16 rounded-2xl border-2 border-white bg-white/25, bg a.color+'40'
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .padding(6.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(
                                            parseHexColor(a.color).copy(alpha = 0.25f) // +'40'
                                        )
                                        .border(
                                            2.dp,
                                            if (isSelected) Color.White else Color.White.copy(alpha = 0.25f),
                                            RoundedCornerShape(16.dp)
                                        )
                                        .clickable { onSelectAvatar(a) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(a.emoji, fontSize = 30.sp) // text-3xl
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(32.dp)) // mb-8
                // Preview: w-28 h-28 rounded-full, bg selectedAvatar.color+'80', border-2 white/40
                Box(
                    modifier = Modifier
                        .size(112.dp)
                        .clip(RoundedCornerShape(50))
                        .background(parseHexColor(selectedAvatar.color).copy(alpha = 0.5f))
                        .border(2.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(50)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(selectedAvatar.emoji, fontSize = 60.sp) // text-6xl
                }
            }

            // ── Step 1: Username (React Native L128-147) ──
            1 -> {
                Text(
                    text = "Your Username",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = "This is how others will see you",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 32.dp)
                )
                // w-full max-w-sm: bg-black/30 border-white/30 rounded-2xl px-4
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black.copy(alpha = 0.3f))
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.Person,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.7f),
                        modifier = Modifier.size(20.dp)
                    )
                    OutlinedTextField(
                        value = username,
                        onValueChange = onUsernameChange,
                        placeholder = { Text("Enter username", color = Color.White.copy(alpha = 0.5f)) },
                        singleLine = true,
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                            .padding(start = 12.dp), // ml-3
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        )
                    )
                }
                // x/24 characters counter (React Native L145)
                Text(
                    text = "${username.length}/24 characters",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp, start = 4.dp)
                )
            }

            // ── Step 2: Gender (React Native L150-164) ──
            2 -> {
                Text(
                    text = "Your Gender",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = "Cannot be changed later",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                // flex-row gap-4 w-full max-w-sm
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    GENDER_OPTIONS.forEach { g ->
                        val isSelected = gender == g
                        // flex-1 h-20 rounded-2xl border-2
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(80.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    if (isSelected) Color.White.copy(alpha = 0.25f) // bg-white/25
                                    else Color.Black.copy(alpha = 0.2f) // bg-black/20
                                )
                                .border(
                                    2.dp,
                                    if (isSelected) Color.White else Color.White.copy(alpha = 0.2f),
                                    RoundedCornerShape(16.dp)
                                )
                                .clickable { onGenderSelect(g) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = g,
                                color = if (isSelected) Color.White else Color.White.copy(alpha = 0.6f),
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        }
                    }
                }
            }

            // ── Step 3: Country (React Native L168-187) ──
            3 -> {
                Text(
                    text = "Your Country",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = "Help us personalize your experience",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(bottom = 32.dp)
                )
                // w-full max-w-sm max-h-80
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 320.dp) // max-h-80
                ) {
                    COUNTRY_OPTIONS.forEach { c ->
                        val isSelected = country == c
                        // w-full h-14 px-4 rounded-xl mb-2
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp)
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isSelected) Color.White.copy(alpha = 0.25f)
                                    else Color.Black.copy(alpha = 0.2f)
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) Color.White.copy(alpha = 0.4f)
                                    else Color.White.copy(alpha = 0.15f),
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { onCountrySelect(c) }
                                .padding(horizontal = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Filled.Public,
                                    contentDescription = null,
                                    tint = if (isSelected) Color.White else Color.White.copy(alpha = 0.5f),
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = c,
                                    color = if (isSelected) Color.White else Color.White.copy(alpha = 0.7f),
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(start = 12.dp)
                                )
                            }
                            if (isSelected) {
                                Icon(
                                    Icons.Filled.Check,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// Convert "#fbbf24" → Color
private fun parseHexColor(hex: String): Color {
    return try {
        Color(android.graphics.Color.parseColor(hex))
    } catch (e: Exception) {
        Color.White
    }
}
