package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random
import app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon

// ─────────────────────────────────────────────────────────────────────────────
// GiftBattleCanvas — mirrors RN gift-battle-canvas.tsx
// Fullscreen overlay showing real-time gift battle between 2 teams
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun GiftBattleCanvas(
    visible: Boolean,
    leftTeamName: String = "Team A",
    rightTeamName: String = "Team B",
    scoreLeft: Int = 0,
    scoreRight: Int = 0
) {
    if (!visible) return

    val total = maxOf(scoreLeft + scoreRight, 1).toFloat()
    val leftPct = (scoreLeft / total)
    val rightPct = (scoreRight / total)

    val leftAnim by animateFloatAsState(
        targetValue = leftPct,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 100f),
        label = "left"
    )
    val rightAnim by animateFloatAsState(
        targetValue = rightPct,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 100f),
        label = "right"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "GIFT BATTLE",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(24.dp))

            // Score bars
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(192.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally),
                verticalAlignment = Alignment.Bottom
            ) {
                // Left team
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        leftTeamName.uppercase(),
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 10.sp, fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "$scoreLeft",
                        color = Color(0xFF8B5CF6),
                        fontSize = 18.sp, fontWeight = FontWeight.Black
                    )
                    Spacer(Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(leftAnim.coerceAtLeast(0.02f))
                            .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                            .background(Color(0xFF8B5CF6).copy(alpha = 0.7f))
                    )
                }

                // VS
                Text(
                    "VS",
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(bottom = 32.dp)
                )

                // Right team
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        rightTeamName.uppercase(),
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 10.sp, fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "$scoreRight",
                        color = Color(0xFFEC4899),
                        fontSize = 18.sp, fontWeight = FontWeight.Black
                    )
                    Spacer(Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight(rightAnim.coerceAtLeast(0.02f))
                            .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                            .background(Color(0xFFEC4899).copy(alpha = 0.7f))
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(
                "Battle in progress...",
                color = Color.White.copy(alpha = 0.4f),
                fontSize = 10.sp, textAlign = TextAlign.Center
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomGoldenChestDialog — mirrors RN room-golden-chest-dialog.tsx
// 24h cooldown chest with shake+glow animation, loot pool 100–2500 coins
// ─────────────────────────────────────────────────────────────────────────────

private data class ChestReward(val label: String, val value: Int, val emoji: String)
private val LOOT_POOL = listOf(
    ChestReward("100 Coins", 100, "🪙"),
    ChestReward("250 Coins", 250, "💰"),
    ChestReward("500 Coins", 500, "💎"),
    ChestReward("1000 Coins", 1000, "👑"),
    ChestReward("2500 Coins", 2500, "🌟")
)
private const val COOLDOWN_MS = 24 * 60 * 60 * 1000L

@Composable
fun RoomGoldenChestDialog(
    visible: Boolean,
    roomId: String,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var chestState by remember { mutableStateOf("closed") } // closed/shaking/open/cooldown
    var reward by remember { mutableStateOf<ChestReward?>(null) }
    var cooldownSecs by remember { mutableIntStateOf(0) }

    // Check cooldown on open
    LaunchedEffect(visible) {
        if (!visible) return@LaunchedEffect
        val uid = com.google.firebase.ktx.Firebase.auth.currentUser?.uid ?: return@LaunchedEffect
        try {
            val doc = com.google.firebase.ktx.Firebase.firestore.collection("users").document(uid).get().await()
            val lastOpen = doc.getTimestamp("lastRoomChestOpen")?.toDate()?.time ?: 0L
            val elapsed = System.currentTimeMillis() - lastOpen
            if (elapsed < COOLDOWN_MS) {
                cooldownSecs = ((COOLDOWN_MS - elapsed) / 1000).toInt()
                chestState = "cooldown"
            } else {
                chestState = "closed"
                reward = null
            }
        } catch (_: Exception) {}
    }

    // Cooldown countdown
    LaunchedEffect(chestState) {
        if (chestState == "cooldown") {
            while (cooldownSecs > 0) {
                delay(1000)
                cooldownSecs--
            }
            if (cooldownSecs <= 0) {
                chestState = "closed"
                reward = null
            }
        }
    }

    // Animations
    val shakeAnim = remember { Animatable(0f) }
    val glowAnim = rememberInfiniteTransition(label = "glow").animateFloat(
        initialValue = 0.3f, targetValue = 0.7f,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
        label = "glow"
    )
    val flashAnim = remember { Animatable(0f) }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color(0xFF1E293B))
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Close button
                Row(modifier = Modifier.fillMaxWidth().offset(x = 16.dp, y = (-16).dp), horizontalArrangement = Arrangement.End) {
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp).background(Color.Black.copy(alpha = 0.2f), CircleShape)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(20.dp))
                    }
                }

                Text(
                    "Golden Chest",
                    color = Color(0xFFFBBF24),
                    fontSize = 18.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                // Chest box
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .graphicsLayer { translationX = shakeAnim.value }
                        .clip(RoundedCornerShape(24.dp))
                        .background(if (chestState == "open") Color(0xFFFBBF24).copy(alpha = 0.3f) else Color(0xFFEAB308).copy(alpha = 0.15f))
                        .border(
                            2.dp,
                            if (chestState == "open") Color(0xFFFBBF24) else Color(0xFFD97706),
                            RoundedCornerShape(24.dp)
                        )
                        .padding(bottom = 16.dp), // To adjust vertical center
                    contentAlignment = Alignment.Center
                ) {
                    if (chestState == "open" && reward != null) {
                        Text(reward!!.emoji, fontSize = 48.sp, modifier = Modifier.offset(y = 8.dp))
                    } else {
                        // Using Text("🎁") since Gift icon in RN is equivalent to emoji
                        Text("🎁", fontSize = 48.sp, modifier = Modifier.offset(y = 8.dp))
                    }
                }
                
                // Flash overlay (simulating RN's flashAnim)
                if (flashAnim.value > 0f) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .alpha(flashAnim.value)
                            .background(Color.White)
                    )
                }

                Spacer(Modifier.height(16.dp))

                // State-based content
                if (chestState == "open" && reward != null) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(bottom = 16.dp)) {
                        Text(
                            "+${reward!!.value}",
                            color = Color(0xFFFBBF24),
                            fontSize = 28.sp, fontWeight = FontWeight.Black
                        )
                        Text(
                            reward!!.label,
                            color = Color(0xFFFCD34D),
                            fontSize = 12.sp, fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (chestState == "cooldown") {
                    val h = cooldownSecs / 3600
                    val m = (cooldownSecs % 3600) / 60
                    val s = cooldownSecs % 60
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(bottom = 16.dp)) {
                        Text(
                            "Opens in",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp, fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        Text(
                            "${if (h > 0) "${h}h " else ""}${m}m ${s}s",
                            color = Color(0xFFFBBF24),
                            fontSize = 22.sp, fontWeight = FontWeight.Black
                        )
                    }
                }

                // Action button
                if (chestState == "closed") {
                    Button(
                        onClick = {
                            scope.launch {
                                chestState = "shaking"
                                // Shake animation
                                listOf(12f, -12f, 8f, -8f, 5f, -5f, 0f).forEach { x ->
                                    shakeAnim.animateTo(x, tween(80))
                                }
                                
                                launch {
                                    flashAnim.animateTo(0.6f, tween(150))
                                    flashAnim.animateTo(0f, tween(300))
                                }
                                
                                val win = LOOT_POOL.random()
                                reward = win
                                chestState = "open"
                                // Firestore update
                                try {
                                    val uid = com.google.firebase.ktx.Firebase.auth.currentUser?.uid ?: return@launch
                                    val db = com.google.firebase.ktx.Firebase.firestore
                                    val batch = db.batch()
                                    val inc = com.google.firebase.firestore.FieldValue.increment(win.value.toLong())
                                    
                                    batch.update(
                                        db.collection("users").document(uid),
                                        mapOf(
                                            "wallet.coins" to inc,
                                            "lastRoomChestOpen" to com.google.firebase.Timestamp.now()
                                        )
                                    )
                                    batch.update(
                                        db.collection("users").document(uid).collection("profile").document(uid),
                                        "wallet.coins", inc
                                    )
                                    batch.commit().await()
                                } catch (_: Exception) {}
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Open Chest", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomLuckySpinDialog — mirrors RN room-lucky-spin-dialog.tsx
// Spin wheel: 8 multiplier segments (x1-x50), costs 100 coins
// ─────────────────────────────────────────────────────────────────────────────

private data class SpinReward(val label: String, val multiplier: Int, val color: Color)
private val SPIN_REWARDS = listOf(
    SpinReward("x1",  1,  Color(0xFF6366F1)),
    SpinReward("x2",  2,  Color(0xFF8B5CF6)),
    SpinReward("x5",  5,  Color(0xFFEC4899)),
    SpinReward("x10", 10, Color(0xFFF43F5E)),
    SpinReward("x20", 20, Color(0xFFF97316)),
    SpinReward("x50", 50, Color(0xFFF59E0B)),
    SpinReward("x3",  3,  Color(0xFF10B981)),
    SpinReward("x25", 25, Color(0xFF06B6D4))
)
private const val SPIN_COST = 100

@Composable
fun RoomLuckySpinDialog(
    visible: Boolean,
    roomId: String,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var spinning by remember { mutableStateOf(false) }
    var winIndex by remember { mutableIntStateOf(-1) }
    var netChange by remember { mutableIntStateOf(0) }

    val rotation = remember { Animatable(0f) }

    val glowAnim = rememberInfiniteTransition(label = "win_glow").animateFloat(
        initialValue = 0.6f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(500), RepeatMode.Reverse),
        label = "glow"
    )

    var userCoins by remember { mutableLongStateOf(0L) }

    DisposableEffect(Unit) {
        val uid = com.google.firebase.ktx.Firebase.auth.currentUser?.uid
        val listener = if (uid != null) {
            com.google.firebase.ktx.Firebase.firestore.collection("users").document(uid)
                .collection("profile").document(uid)
                .addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        val wallet = snap.get("wallet") as? Map<*, *>
                        val coins = wallet?.get("coins")
                        userCoins = when (coins) {
                            is Number -> coins.toLong()
                            is String -> coins.toLongOrNull() ?: 0L
                            else -> 0L
                        }
                    }
                }
        } else null

        onDispose { listener?.remove() }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.88f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF1E293B))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Close button
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f),
                            modifier = Modifier.size(16.dp))
                    }
                }

                Text("Lucky Spin", color = Color(0xFFFBBF24), fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text("x1 - x50 Multiplier", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                Spacer(Modifier.height(4.dp))
                Text("Balance: $userCoins coins", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)

                Spacer(Modifier.height(16.dp))

                // Spin wheel
                Box(
                    modifier = Modifier
                        .size(220.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0F172A))
                        .rotate(rotation.value),
                    contentAlignment = Alignment.Center
                ) {
                    // Segments as positioned text
                    SPIN_REWARDS.forEachIndexed { i, reward ->
                        val angle = i * 45f
                        val radians = Math.toRadians(angle.toDouble())
                        val radius = 80f
                        val x = (radius * sin(radians)).toFloat()
                        val y = (-radius * cos(radians)).toFloat()
                        Box(
                            modifier = Modifier
                                .offset(x = x.dp, y = y.dp)
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(reward.color.copy(alpha = 0.8f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(reward.label, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black)
                        }
                    }
                    // Center hub
                    Box(
                        modifier = Modifier.size(36.dp).clip(CircleShape)
                            .background(Color(0xFF4F46E5)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("✨", fontSize = 16.sp)
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Win announcement
                if (winIndex >= 0) {
                    val r = SPIN_REWARDS[winIndex]
                    val net = r.multiplier * SPIN_COST - SPIN_COST
                    Text(
                        "You won ${r.label}! ${if (net >= 0) "+$net" else "$net"} coins",
                        color = Color(0xFFFBBF24),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.alpha(glowAnim.value)
                    )
                    Spacer(Modifier.height(8.dp))
                }

                // Spin button
                val canSpin = userCoins >= SPIN_COST && !spinning
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            if (canSpin) Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)))
                            else Brush.linearGradient(listOf(Color(0xFF334155), Color(0xFF334155)))
                        )
                        .clickable(enabled = canSpin) {
                            scope.launch {
                                spinning = true
                                winIndex = -1
                                val selectedIdx = Random.nextInt(SPIN_REWARDS.size)
                                val extraRotations = (3 + Random.nextInt(5)) * 360f
                                val targetAngle = extraRotations + (selectedIdx * 45f + 22.5f)
                                rotation.animateTo(
                                    rotation.value + targetAngle,
                                    animationSpec = tween(3000, easing = FastOutSlowInEasing)
                                )
                                winIndex = selectedIdx
                                val reward = SPIN_REWARDS[selectedIdx]
                                netChange = reward.multiplier * SPIN_COST - SPIN_COST
                                // Firestore
                                try {
                                    val uid = com.google.firebase.ktx.Firebase.auth.currentUser?.uid ?: return@launch
                                    val db = com.google.firebase.ktx.Firebase.firestore
                                    val batch = db.batch()
                                    val inc = com.google.firebase.firestore.FieldValue.increment(netChange.toLong())
                                    batch.update(db.collection("users").document(uid), "wallet.coins", inc)
                                    batch.update(db.collection("users").document(uid).collection("profile").document(uid), "wallet.coins", inc)
                                    batch.commit().await()
                                } catch (_: Exception) {}
                                spinning = false
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        when {
                            spinning -> "Spinning..."
                            !canSpin -> "Not Enough Coins"
                            else -> "Spin (${SPIN_COST} coins)"
                        },
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}
