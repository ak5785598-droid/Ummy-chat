package app.vercel.ummy_chat.twa.ui.home

import android.graphics.Typeface
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Calendar

// ============================================================
// React Native daily-rewards-modal.tsx → Kotlin Compose (EXACT PARITY)
// ============================================================

data class RewardDay(val day: Int, val emoji: String, val amount: Int, val isBig: Boolean = false)

val rewardDays = listOf(
    RewardDay(1, "🪙", 5000),
    RewardDay(2, "🪙", 5000),
    RewardDay(3, "💰", 8000),
    RewardDay(4, "💎", 10000),
    RewardDay(5, "💎", 10000),
    RewardDay(6, "👑", 10000),
    RewardDay(7, "🌟", 15000, isBig = true)
)

// React Native golden-coin.tsx — ported
@Composable
fun GoldenCoin(size: Dp = 18.dp) {
    Canvas(modifier = Modifier.size(size)) {
        val s = size.toPx()
        val c = Offset(s / 2f, s / 2f)

        // Rim gradient (rimGrad): #ffe57f #ffb300 #8d6e63 #ffca28 #5d4037
        drawCircle(
            brush = Brush.linearGradient(
                colors = listOf(
                    Color(0xFFFFE57F), Color(0xFFFFB300), Color(0xFF8D6E63),
                    Color(0xFFFFCA28), Color(0xFF5D4037)
                ),
                start = Offset(0f, 0f),
                end = Offset(s, s)
            ),
            radius = s / 2f,
            center = c
        )
        // Bevel (bevelGrad)
        drawCircle(
            brush = Brush.linearGradient(
                colors = listOf(Color(0xFFE6A800), Color(0xFF8D6E63), Color(0xFFFFCA28), Color(0xFF7B6E42)),
                start = Offset(0f, 0f),
                end = Offset(s, s)
            ),
            radius = s * 0.42f,
            center = c
        )
        // Face (faceGrad) radial: #fff9c4 #fdd835 #f57f17
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color(0xFFFFF9C4), Color(0xFFFDD835), Color(0xFFF57F17)),
                center = c,
                radius = s / 2f
            ),
            radius = s * 0.36f,
            center = c
        )
        // "$" symbol
        drawContext.canvas.nativeCanvas.apply {
            val paint = android.graphics.Paint().apply {
                isAntiAlias = true
                color = android.graphics.Color.parseColor("#7A4A00")
                textAlign = android.graphics.Paint.Align.CENTER
                textSize = s * 0.38f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            }
            val baseline = c.y - (paint.ascent() + paint.descent()) / 2f
            drawText("$", c.x, baseline, paint)
        }
    }
}

@Composable
fun DailyRewardsModal(
    visible: Boolean,
    onClose: () -> Unit
) {
    if (!visible) return

    val firestore = FirebaseFirestore.getInstance()
    val currentUser = FirebaseAuth.getInstance().currentUser

    var streak by remember { mutableStateOf(0) }
    var lastClaimAt by remember { mutableStateOf<Calendar?>(null) }
    var alreadyClaimed by remember { mutableStateOf(false) }
    var claimedReward by remember { mutableStateOf<RewardDay?>(null) }
    var loading by remember { mutableStateOf(true) }

    val scope = rememberCoroutineScope()

    // React Native L28-43: load user streak from users/{uid}
    LaunchedEffect(currentUser?.uid) {
        if (currentUser == null) {
            loading = false
            return@LaunchedEffect
        }
        firestore.collection("users").document(currentUser.uid).get()
            .addOnSuccessListener { doc ->
                streak = doc.getLong("dailyStreak")?.toInt() ?: 0
                lastClaimAt = doc.getDate("lastDailyClaimAt")?.let { d ->
                    Calendar.getInstance().apply { time = d }
                }
                if (lastClaimAt != null && isSameDay(lastClaimAt!!, Calendar.getInstance())) {
                    alreadyClaimed = true
                }
                loading = false
            }
            .addOnFailureListener { loading = false }
    }

    // React Native L51-52: currentDay + currentReward (cycle every 7 days)
    val currentDay = if (streak > 0) ((streak - 1) % 7) + 1 else 1
    val currentReward = rewardDays.firstOrNull { it.day == currentDay } ?: rewardDays[0]

    // React Native L69-88: handleClaim — dual-doc non-blocking write, auto close 1.5s
    fun handleClaim() {
        val uid = currentUser?.uid ?: return
        if (alreadyClaimed) return
        val userRef = firestore.collection("users").document(uid)
        val profileRef = firestore.collection("users").document(uid).collection("profile").document(uid)

        userRef.update(
            "wallet.coins", FieldValue.increment(currentReward.amount.toLong()),
            "lastDailyClaimAt", FieldValue.serverTimestamp(),
            "dailyStreak", streak.toLong()
        )
        profileRef.update("wallet.coins", FieldValue.increment(currentReward.amount.toLong()))

        claimedReward = currentReward
        alreadyClaimed = true
        scope.launch {
            delay(1500)
            onClose()
        }
    }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable { onClose() },
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp))
                    .background(Color.White)
                    .clickable(enabled = false) {}
                    .padding(24.dp)
                    .padding(bottom = 40.dp)
            ) {
                // Header (React Native L105-124): Crown icon + title + close
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("👑", fontSize = 22.sp) // Crown lucide #8B5CF6 → emoji
                        Text(
                            "Daily Rewards",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF0F172A)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .clickable { onClose() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("✕", fontSize = 16.sp, color = Color(0xFF64748B))
                    }
                }

                // Streak chip (React Native L126-141): only when streak > 0
                if (streak > 0) {
                    Row(
                        modifier = Modifier
                            .padding(top = 12.dp, bottom = 12.dp)
                            .clip(RoundedCornerShape(50))
                            .background(if (alreadyClaimed) Color(0xFFF0FDF4) else Color(0xFFFEF3C7))
                            .border(1.dp, if (alreadyClaimed) Color(0xFFBBF7D0) else Color(0xFFFDE68A), RoundedCornerShape(50))
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text("🔥", fontSize = 14.sp)
                        Text(
                            "$streak day streak!",
                            color = if (alreadyClaimed) Color(0xFF16A34A) else Color(0xFFD97706),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }

                // Subtitle (React Native L143)
                Text(
                    "Sign in daily to earn rewards!",
                    fontSize = 13.sp,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                if (loading) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(24.dp)
                    )
                } else {
                    // Row 1: Days 1-4 (React Native L152-174)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        rewardDays.take(4).forEach { day ->
                            DayRewardCard(
                                day = day,
                                isDone = day.day <= streak,
                                isActive = !alreadyClaimed && day.day == currentDay,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    // Row 2: Days 5-6 (React Native L176-194)
                    Row(
                        modifier = Modifier.fillMaxWidth(0.5f),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        rewardDays[4].let { day ->
                            DayRewardCard(
                                day = day,
                                isDone = day.day <= streak,
                                isActive = !alreadyClaimed && day.day == currentDay,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        rewardDays[5].let { day ->
                            DayRewardCard(
                                day = day,
                                isDone = day.day <= streak,
                                isActive = !alreadyClaimed && day.day == currentDay,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    // Day 7 Big card (React Native L196-224)
                    DayRewardCard(
                        day = rewardDays[6],
                        isDone = rewardDays[6].day <= streak,
                        isActive = !alreadyClaimed && rewardDays[6].day == currentDay,
                        isBig = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Bottom action (React Native L227-258)
                    when {
                        claimedReward != null -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFF0FDF4))
                                    .border(1.dp, Color(0xFF86EFAC), RoundedCornerShape(20.dp))
                                    .padding(vertical = 16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        "+${claimedReward!!.amount} Coins!",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 16.sp,
                                        color = Color(0xFF16A34A)
                                    )
                                    Text(
                                        "Claimed successfully!",
                                        fontSize = 12.sp,
                                        color = Color(0xFF22C55E)
                                    )
                                }
                            }
                        }
                        alreadyClaimed -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        "Already signed in today!",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color(0xFF64748B)
                                    )
                                    Text(
                                        "Come back tomorrow for more",
                                        fontSize = 11.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }
                            }
                        }
                        else -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            colors = listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))
                                        )
                                    )
                                    .clickable { handleClaim() },
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        "Sign in Today",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Text(
                                        "  ·  +${currentReward.amount} coins",
                                        fontSize = 11.sp,
                                        color = Color.White.copy(alpha = 0.8f)
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

private fun Modifier.borderBorder(claimed: Boolean) = this

@Composable
fun DayRewardCard(
    day: RewardDay,
    isDone: Boolean,
    isActive: Boolean,
    isBig: Boolean = false,
    modifier: Modifier = Modifier
) {
    val borderColor = when {
        isActive -> Color(0xFFFBBF24)
        isDone -> Color(0xFF86EFAC)
        else -> Color(0xFFE2E8F0)
    }
    val alpha = if (isDone && !isActive) 0.6f else 1f

    val cardBgModifier = if (isActive) {
        Modifier.background(Color(0xFFFEF3C7))
    } else if (isBig) {
        Modifier.background(Brush.verticalGradient(listOf(Color(0xFFF8FAFC), Color(0xFFF1F5F9))))
    } else {
        Modifier.background(Color(0xFFF8FAFC))
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .then(cardBgModifier)
            .border(2.dp, borderColor, RoundedCornerShape(16.dp))
            .padding(if (isBig) 14.dp else 10.dp),
        contentAlignment = Alignment.Center
    ) {
        if (isBig) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "DAY ${day.day} - BIG REWARDS",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp,
                    color = Color(0xFFD97706)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(day.emoji, fontSize = 28.sp, color = Color.White.copy(alpha = alpha))
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "+${day.amount} Coins",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF92400E)
                )
            }
        } else {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        "DAY ${day.day}",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        color = if (isActive) Color(0xFFD97706) else Color(0xFF94A3B8),
                        modifier = Modifier.alpha(alpha)
                    )
                    if (day.emoji == "🪙") {
                        // React Native: GoldenCoin (size 32) for coin rewards
                        GoldenCoin(size = 32.dp)
                    } else {
                        Text(day.emoji, fontSize = 18.sp, modifier = Modifier.alpha(alpha))
                    }
                    Text(
                        "+${day.amount}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isActive) Color(0xFF92400E) else Color(0xFF475569),
                        modifier = Modifier.alpha(alpha)
                    )
                }
                // Check mark for done days (React Native: ✓ absolute top-1 right-1.5)
                if (isDone && !isActive) {
                    Text(
                        "✓",
                        fontSize = 12.sp,
                        color = Color(0xFF22C55E),
                        modifier = Modifier.align(Alignment.TopEnd)
                    )
                }
            }
        }
    }
}

// React Native date-fns getDayKey / isToday / isYesterday (YYYY-M-D)
private fun isSameDay(a: Calendar, b: Calendar): Boolean =
    a.get(Calendar.YEAR) == b.get(Calendar.YEAR) &&
        a.get(Calendar.MONTH) == b.get(Calendar.MONTH) &&
        a.get(Calendar.DAY_OF_MONTH) == b.get(Calendar.DAY_OF_MONTH)
