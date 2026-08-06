package app.vercel.ummy_chat.twa.ui.bonus

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// React Native bonus/index.tsx → Kotlin Compose (EXACT PARITY)

private data class RateTier(val rate: String, val range: String)

private val RATE_TIERS = listOf(
    RateTier("1x", "Lv.1-10"),
    RateTier("1.1x", "Lv.11-20"),
    RateTier("1.2x", "Lv.21-30"),
    RateTier("1.3x", "Lv.31-40"),
    RateTier("1.4x", "Lv.41-50"),
    RateTier("1.5x", "Lv.51-70"),
    RateTier("2x", "Lv.71-100")
)

private fun getRoomLevel(totalSpent: Long): Int {
    return when {
        totalSpent >= 5000000L -> 71
        totalSpent >= 2000000L -> 51
        totalSpent >= 1000000L -> 41
        totalSpent >= 500000L -> 31
        totalSpent >= 200000L -> 21
        totalSpent >= 50000L -> 11
        else -> 1
    }
}

private fun getRewardRate(level: Int): Double {
    return when {
        level >= 71 -> 2.0
        level >= 51 -> 1.5
        level >= 41 -> 1.4
        level >= 31 -> 1.3
        level >= 21 -> 1.2
        level >= 11 -> 1.1
        else -> 1.0
    }
}

private fun calculateBonus(points: Int, level: Int): Int {
    val rate = getRewardRate(level)
    return (points * rate).toInt()
}

@Composable
fun BonusScreen(onBack: () -> Unit) {
    val goldBg = Color(0xFFF59E0B)
    val goldDark = Color(0xFFD97706)
    val amber100 = Color(0xFFFEF3C7)
    val amber800 = Color(0xFF92400E)
    val white = Color.White

    val scope = rememberCoroutineScope()
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    var isClaiming by remember { mutableStateOf(false) }
    var dailyPoints by remember { mutableIntStateOf(0) }
    var roomLevel by remember { mutableIntStateOf(1) }
    var lastResetDate by remember { mutableStateOf("") }
    var expiryText by remember { mutableStateOf("23h : 59m : 59s") }

    // Countdown timer
    LaunchedEffect(Unit) {
        while (true) {
            val now = java.util.Calendar.getInstance()
            val midnight = java.util.Calendar.getInstance().apply {
                add(java.util.Calendar.DAY_OF_MONTH, 1)
                set(java.util.Calendar.HOUR_OF_DAY, 0)
                set(java.util.Calendar.MINUTE, 0)
                set(java.util.Calendar.SECOND, 0)
                set(java.util.Calendar.MILLISECOND, 0)
            }
            val diff = midnight.timeInMillis - now.timeInMillis
            val h = diff / 3600000
            val m = (diff % 3600000) / 60000
            val s = (diff % 60000) / 1000
            expiryText = "${h}h : ${m}m : ${s}s"
            delay(1000)
        }
    }

    // Load data
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        val fs = FirebaseFirestore.getInstance()

        // User profile for dailyActivityPoints
        fs.collection("users").document(uid).collection("profile").document(uid).get()
            .addOnSuccessListener { doc ->
                dailyPoints = (doc.getLong("dailyActivityPoints") ?: 0L).toInt()
                lastResetDate = doc.getString("dailyActivityPointsDate") ?: ""
            }

        // Room for level
        fs.collection("chatRooms").document(uid).get()
            .addOnSuccessListener { doc ->
                val lp = doc.getLong("levelPoints") ?: 0L
                roomLevel = getRoomLevel(lp)
            }
    }

    // Check expiry
    val today = java.text.SimpleDateFormat("yyyy-M-d", java.util.Locale.US).format(java.util.Date())
    val isExpired = lastResetDate.isNotEmpty() && lastResetDate != today
    val effectivePoints = if (isExpired) 0 else dailyPoints
    val effectiveBonus = calculateBonus(effectivePoints, roomLevel)

    // Auto-reset if expired
    LaunchedEffect(isExpired) {
        if (isExpired && uid != null) {
            val fs = FirebaseFirestore.getInstance()
            val profileRef = fs.collection("users").document(uid).collection("profile").document(uid)
            profileRef.update(
                mapOf(
                    "dailyActivityPoints" to 0,
                    "dailyActivityPointsDate" to today
                )
            )
        }
    }

    fun handleClaimBonus() {
        if (uid == null || effectiveBonus <= 0 || isClaiming) return
        isClaiming = true
        val fs = FirebaseFirestore.getInstance()
        val userRef = fs.collection("users").document(uid)
        val profileRef = userRef.collection("profile").document(uid)

        profileRef.update(
            mapOf(
                "wallet.coins" to FieldValue.increment(effectiveBonus.toLong()),
                "dailyActivityPoints" to 0,
                "dailyActivityPointsDate" to today,
                "totalBonusClaimed" to FieldValue.increment(effectiveBonus.toLong()),
                "lastBonusClaimDate" to today,
                "updatedAt" to FieldValue.serverTimestamp()
            )
        )
        userRef.update("wallet.coins", FieldValue.increment(effectiveBonus.toLong()))

        dailyPoints = 0
        scope.launch {
            delay(500)
            isClaiming = false
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L10-18)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(CircleShape)
                        .clickable { onBack() }
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF475569), modifier = Modifier.size(24.dp))
                }
                Text("Bonus", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.weight(1f))
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 80.dp)
            ) {
                // Gold Card (React Native L22-47)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(12.dp, RoundedCornerShape(24.dp), ambientColor = goldDark.copy(alpha = 0.4f))
                        .clip(RoundedCornerShape(24.dp))
                        .background(goldBg)
                        .padding(24.dp)
                ) {
                    Box {
                        // Decorative circles
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .offset(x = 80.dp, y = (-20).dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.12f))
                        )
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .offset(y = 60.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.08f))
                        )

                        Column {
                            Text("Bonus you can get today", fontSize = 13.sp, color = Color.White.copy(alpha = 0.92f))
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "$effectiveBonus",
                                    fontSize = 52.sp,
                                    fontWeight = FontWeight.Black,
                                    color = white,
                                    letterSpacing = (-1).sp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("coins", fontSize = 18.sp, color = Color.White.copy(alpha = 0.7f))
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            // Claim Button (React Native L42-46)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(50))
                                    .background(if (effectiveBonus > 0) white else white.copy(alpha = 0.45f))
                                    .clickable(enabled = effectiveBonus > 0 && !isClaiming) { handleClaimBonus() }
                                    .padding(vertical = 14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isClaiming) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = goldDark, strokeWidth = 2.dp)
                                } else {
                                    Text("Get", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = goldDark)
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))

                // Expiry Row (React Native L49-55)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(white)
                        .border(1.dp, amber100, RoundedCornerShape(12.dp))
                        .padding(vertical = 10.dp)
                        .padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Expires in  ", fontSize = 12.sp, color = amber800)
                    Text(expiryText, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = goldDark)
                }

                // Stats Row (React Native L57-73)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(white)
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                        .padding(vertical = 16.dp)
                ) {
                    StatCell(modifier = Modifier.weight(1f), value = "$effectivePoints", label = "POINTS TODAY")
                    Box(modifier = Modifier.width(1.dp).height(40.dp).background(Color(0xFFF1F5F9)))
                    StatCell(modifier = Modifier.weight(1f), value = "${getRewardRate(roomLevel)}x", label = "REWARD RATE", valueColor = goldDark)
                    Box(modifier = Modifier.width(1.dp).height(40.dp).background(Color(0xFFF1F5F9)))
                    StatCell(modifier = Modifier.weight(1f), value = "$effectiveBonus", label = "BONUS")
                }
                Spacer(modifier = Modifier.height(20.dp))

                // Bonus Calculation Section (React Native L75-82)
                Text("BONUS CALCULATION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B), letterSpacing = 1.5.sp)
                Spacer(modifier = Modifier.height(8.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(white)
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            "Your bonus is calculated based on your daily activity points and room level. Higher level = higher reward rate!",
                            fontSize = 12.sp,
                            color = Color(0xFF475569),
                            lineHeight = 18.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        // Rate Table (React Native L93-115)
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFF8FAFC))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text("RATE", modifier = Modifier.weight(1f), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            Text("LEVEL RANGE", modifier = Modifier.weight(1f), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                        }
                        RATE_TIERS.forEach { tier ->
                            val isActive = tier.range.contains("$roomLevel")
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .then(if (isActive) Modifier.background(amber100) else Modifier)
                                    .padding(horizontal = 12.dp, vertical = 10.dp)
                            ) {
                                Text(tier.rate, modifier = Modifier.weight(1f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = goldDark)
                                Text(tier.range, modifier = Modifier.weight(1f), fontSize = 12.sp, fontWeight = if (isActive) FontWeight.ExtraBold else FontWeight.SemiBold, color = if (isActive) Color(0xFF0F172A) else Color(0xFF475569))
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        // Current Level Badge (React Native L117-121)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(amber100)
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text("Current Level: Lv.$roomLevel", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = amber800)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))

                // Bonus Pay Time Section (React Native L124-130)
                Text("BONUS PAY TIME", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B), letterSpacing = 1.5.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(white)
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Text(
                        "Bonus is calculated daily based on your activity. Points reset at midnight IST. Claim your bonus before the day ends!",
                        fontSize = 12.sp,
                        color = Color(0xFF475569),
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun StatCell(modifier: Modifier = Modifier, value: String, label: String, valueColor: Color = Color(0xFF0F172A)) {
    Column(modifier = modifier.padding(horizontal = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.Black, color = valueColor)
        Spacer(modifier = Modifier.height(2.dp))
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
    }
}
