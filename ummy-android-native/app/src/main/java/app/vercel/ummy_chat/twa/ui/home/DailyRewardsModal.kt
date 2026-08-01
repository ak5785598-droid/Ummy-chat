package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Date

data class RewardDay(val day: Int, val emoji: String, val amount: Int)

val rewardDays = listOf(
    RewardDay(1, "🪙", 5000),
    RewardDay(2, "🪙", 5000),
    RewardDay(3, "💰", 8000),
    RewardDay(4, "💎", 10000),
    RewardDay(5, "💎", 10000),
    RewardDay(6, "👑", 10000),
    RewardDay(7, "🌟", 15000)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyRewardsModal(
    visible: Boolean,
    onClose: () -> Unit
) {
    if (!visible) return

    val firestore = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val currentUser = auth.currentUser

    var streak by remember { mutableStateOf(0) }
    var lastClaimAt by remember { mutableStateOf<Date?>(null) }
    var isClaimedToday by remember { mutableStateOf(false) }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    val scope = rememberCoroutineScope()

    LaunchedEffect(currentUser?.uid) {
        if (currentUser != null) {
            firestore.collection("users").document(currentUser.uid).get()
                .addOnSuccessListener { doc ->
                    streak = doc.getLong("dailyStreak")?.toInt() ?: 0
                    lastClaimAt = doc.getDate("lastDailyClaimAt")
                    
                    if (lastClaimAt != null) {
                        val cal = Calendar.getInstance()
                        val currentDay = cal.get(Calendar.DAY_OF_YEAR)
                        cal.time = lastClaimAt!!
                        val claimDay = cal.get(Calendar.DAY_OF_YEAR)
                        if (currentDay == claimDay) {
                            isClaimedToday = true
                        }
                    }
                    isLoading = false
                }
                .addOnFailureListener {
                    isLoading = false
                }
        } else {
            isLoading = false
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
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "👑 Daily Rewards",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                    IconButton(onClick = onClose) {
                        Text(text = "✕", fontSize = 20.sp, color = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Streak Indicator
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFFFEF3C7))
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "🔥", fontSize = 18.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "$streak day streak!",
                        color = Color(0xFFD97706),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                } else {
                    // Days 1-4
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for (i in 0..3) {
                            DayCard(
                                day = rewardDays[i],
                                isClaimed = i < streak || (i == streak && isClaimedToday),
                                isActive = i == streak && !isClaimedToday,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Days 5-6
                    Row(
                        modifier = Modifier.fillMaxWidth(0.5f),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for (i in 4..5) {
                            DayCard(
                                day = rewardDays[i],
                                isClaimed = i < streak || (i == streak && isClaimedToday),
                                isActive = i == streak && !isClaimedToday,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(if (i == 4) 12.dp else 0.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Day 7
                    DayCard(
                        day = rewardDays[6],
                        isClaimed = 6 < streak || (6 == streak && isClaimedToday),
                        isActive = 6 == streak && !isClaimedToday,
                        isBig = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    if (successMessage != null) {
                        Text(
                            text = successMessage!!,
                            color = Color(0xFF22C55E),
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center
                        )
                    } else if (isClaimedToday) {
                        Text(
                            text = "Already signed in today!",
                            color = Color.Gray,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (!isClaimedToday && currentUser != null) {
                                val currentReward = rewardDays[streak % 7].amount
                                val userRef = firestore.collection("users").document(currentUser.uid)
                                
                                userRef.update(
                                    "wallet.coins", FieldValue.increment(currentReward.toLong()),
                                    "dailyStreak", FieldValue.increment(1),
                                    "lastDailyClaimAt", FieldValue.serverTimestamp()
                                ).addOnSuccessListener {
                                    isClaimedToday = true
                                    streak += 1
                                    successMessage = "+$currentReward Coins! Claimed successfully!"
                                }
                            }
                        },
                        enabled = !isClaimedToday,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(
                                        colors = if (isClaimedToday) listOf(Color.LightGray, Color.LightGray) else listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (isClaimedToday) "Claimed" else "Claim Reward",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DayCard(
    day: RewardDay,
    isClaimed: Boolean,
    isActive: Boolean,
    isBig: Boolean = false,
    modifier: Modifier = Modifier
) {
    val borderColor = when {
        isClaimed -> Color(0xFF86EFAC)
        isActive -> Color(0xFFFBBF24)
        else -> Color(0xFFF3F4F6)
    }
    
    val bgColor = when {
        isClaimed -> Color(0xFFF0FDF4)
        isActive -> Color(0xFFFEF3C7)
        else -> Color.White
    }

    Card(
        modifier = modifier
            .padding(horizontal = 4.dp)
            .height(if (isBig) 90.dp else 100.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = BorderStroke(2.dp, borderColor),
        shape = RoundedCornerShape(12.dp)
    ) {
        if (isBig) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Day ${day.day}",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "Big Rewards",
                        color = Color.Black,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = day.emoji, fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "+${day.amount}",
                        color = Color(0xFFD97706),
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceEvenly
            ) {
                Text(
                    text = "Day ${day.day}",
                    color = Color.Gray,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(text = day.emoji, fontSize = 24.sp)
                Text(
                    text = "+${day.amount}",
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }
    }
}
