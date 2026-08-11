package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

data class CPPair(
    val id: String = "",
    val participantIds: List<String> = emptyList(),
    val user1Id: String = "",
    val user2Id: String = "",
    val user1Name: String = "",
    val user2Name: String = "",
    val user1Avatar: String? = null,
    val user2Avatar: String? = null,
    val level: Int = 1,
    val cpValue: Long = 0,
    val createdAt: Long = 0L,
    val type: String = "CP"
)

@Composable
fun CPRankingScreen(
    onBack: () -> Unit,
    onGoToMyHouse: () -> Unit
) {
    val fs = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val uid = auth.currentUser?.uid ?: ""

    var pairs by remember { mutableStateOf<List<CPPair>>(emptyList()) }
    var myCp by remember { mutableStateOf<CPPair?>(null) }
    var loading by remember { mutableStateOf(true) }
    var selectedCp by remember { mutableStateOf<CPPair?>(null) }
    var showInfo by remember { mutableStateOf(false) }
    
    DisposableEffect(Unit) {
        // Fetch top 60
        val listener = fs.collection("cpPairs")
            .orderBy("cpValue", Query.Direction.DESCENDING)
            .limit(60)
            .addSnapshotListener { snap, _ ->
                val allPairs = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val type = data["type"] as? String ?: "CP"
                    if (type == "Best Friend" || type == "Besties") return@mapNotNull null

                    val participantIds = (data["participantIds"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                    val cpValueRaw = data["cpValue"]
                    val cpValue = when (cpValueRaw) {
                        is Number -> cpValueRaw.toLong()
                        is String -> cpValueRaw.toLongOrNull() ?: 0L
                        else -> 0L
                    }
                    
                    CPPair(
                        id = doc.id,
                        participantIds = participantIds,
                        user1Id = participantIds.getOrNull(0) ?: "",
                        user2Id = participantIds.getOrNull(1) ?: "",
                        user1Name = data["user1Name"] as? String ?: "User1",
                        user2Name = data["user2Name"] as? String ?: "User2",
                        user1Avatar = data["user1Avatar"] as? String,
                        user2Avatar = data["user2Avatar"] as? String,
                        level = (data["level"] as? Number)?.toInt() ?: 1,
                        cpValue = cpValue,
                        type = type,
                        createdAt = (data["createdAt"] as? com.google.firebase.Timestamp)?.seconds ?: 0L
                    )
                } ?: emptyList()
                
                pairs = allPairs.take(50)
                loading = false
            }

        // Fetch My CP
        val myListener = if (uid.isNotEmpty()) {
            fs.collection("cpPairs")
                .whereArrayContains("participantIds", uid)
                .limit(5)
                .addSnapshotListener { snap, _ ->
                    val myPairs = snap?.documents?.mapNotNull { doc ->
                        val data = doc.data ?: return@mapNotNull null
                        val type = data["type"] as? String ?: "CP"
                        val participantIds = (data["participantIds"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                        CPPair(
                            id = doc.id,
                            participantIds = participantIds,
                            user1Id = participantIds.getOrNull(0) ?: "",
                            user2Id = participantIds.getOrNull(1) ?: "",
                            user1Name = data["user1Name"] as? String ?: "User1",
                            user2Name = data["user2Name"] as? String ?: "User2",
                            user1Avatar = data["user1Avatar"] as? String,
                            user2Avatar = data["user2Avatar"] as? String,
                            level = (data["level"] as? Number)?.toInt() ?: 1,
                            cpValue = when (val cv = data["cpValue"]) {
                                is Number -> cv.toLong()
                                is String -> cv.toLongOrNull() ?: 0L
                                else -> 0L
                            },
                            type = type,
                            createdAt = (data["createdAt"] as? com.google.firebase.Timestamp)?.seconds ?: 0L
                        )
                    } ?: emptyList()
                    myCp = myPairs.firstOrNull { it.type != "Best Friend" && it.type != "Besties" }
                }
        } else null

        onDispose {
            listener.remove()
            myListener?.remove()
        }
    }

    val top7 = pairs.take(7)
    val rest = pairs.drop(7)
    val myRank = pairs.indexOfFirst { it.participantIds.contains(uid) }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF080014))) {
        // Animated Cosmic Background
        AnimatedGalaxyBackground()
        FloatingHearts()

        Box(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize()) {
                Spacer(modifier = Modifier.height(25.dp))
                
                if (top7.isNotEmpty()) {
                    FerrisWheelLeaderboard(top7 = top7) { selectedCp = it }
                }

                Row(
                    modifier = Modifier.fillMaxWidth().offset(y = (-56).dp).padding(start = 24.dp, end = 24.dp, top = 0.dp, bottom = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(Color(0x33FBBF24)))
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFBBF24), modifier = Modifier.size(10.dp))
                        Text("Top Couples", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFBBF24), modifier = Modifier.size(10.dp))
                    }
                    Box(modifier = Modifier.weight(1f).height(1.dp).background(Color(0x33FBBF24)))
                }

                // Scrollable Body for All Pairs
                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f).offset(y = (-56).dp),
                    contentPadding = PaddingValues(bottom = 150.dp)
                ) {
                    if (loading) {
                        item {
                            Column(modifier = Modifier.fillMaxWidth().padding(40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("💞", fontSize = 40.sp)
                                Text("Loading rankings...", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp))
                            }
                        }
                    } else {
                        itemsIndexed(pairs) { idx, cp ->
                            RankRow(rank = idx + 1, cp = cp, isMe = cp.participantIds.contains(uid)) { selectedCp = cp }
                        }
                    }
                }
            }

            // Header (Floating on top)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .offset(y = (-15).dp)
                    .padding(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White.copy(alpha = 0.85f))
                }
                Text("TOP CP", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Brush.horizontalGradient(listOf(Color(0xFFF43F5E), Color(0xFF8B5CF6))))
                            .clickable { onGoToMyHouse() }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("My House", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0x26F43F5E)).clickable { showInfo = true },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(16.dp))
                    }
                }
            }
        }

        // Floating Bottom Overlay
        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
            if (myCp != null) {
                Box(modifier = Modifier.fillMaxWidth().background(Color(0xFF160B24)).windowInsetsPadding(WindowInsets.navigationBars)) {
                    Box(modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter).padding(top = 10.dp).height(2.dp).background(Brush.horizontalGradient(listOf(Color(0x80FBBF24), Color(0x80F97316), Color(0x80FBBF24)))))
                    Box(modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 20.dp)) {
                        MyCpBanner(cp = myCp!!, myUid = uid) { selectedCp = myCp }
                        if (myRank >= 0) {
                            Text(
                                text = "You are ranked #${myRank + 1} globally 🏆",
                                color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Bold,
                                modifier = Modifier.align(Alignment.BottomCenter).offset(y = 18.dp)
                            )
                        }
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF160B24))
                        .windowInsetsPadding(WindowInsets.navigationBars)
                        .padding(16.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter).padding(top = 10.dp).height(2.dp).background(Brush.horizontalGradient(listOf(Color(0x80FBBF24), Color(0x80F97316), Color(0x80FBBF24)))))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Brush.horizontalGradient(listOf(Color(0xFFFBBF24), Color(0xFFF97316), Color(0xFFFBBF24))))
                            .padding(16.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("You don't have a CP yet", color = Color(0xFF451A03), fontSize = 14.sp, fontWeight = FontWeight.Black)
                            Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color.White).clickable { }.padding(horizontal = 16.dp, vertical = 6.dp)) {
                                Text("Invite", color = Color(0xFFF97316), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // CP Modal Profile
        if (selectedCp != null) {
            CpProfileModal(cp = selectedCp!!, rank = pairs.indexOfFirst { it.id == selectedCp!!.id }) { selectedCp = null }
        }

        // Info Modal
        if (showInfo) {
            CpInfoModal(onDismiss = { showInfo = false })
        }
    }
}

@Composable
fun CpInfoModal(onDismiss: () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x99000000))
                .clickable { onDismiss() },
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = 400.dp)
                    .fillMaxWidth(0.9f)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .clickable(enabled = false) {}
                    .padding(24.dp)
            ) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "CP Ranking Info",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF1E293B),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.align(Alignment.Center)
                    )
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF1F5F9))
                            .clickable { onDismiss() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFFEF2F2))
                        .padding(14.dp)
                ) {
                    Text("🏅 CP Ranking", fontWeight = FontWeight.Bold, color = Color(0xFFE11D48), fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ranking is determined by your CP Value — the total gifts exchanged between partners.",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        lineHeight = 18.sp
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFFFF1F2))
                        .border(1.dp, Color(0xFFFDA4AF), RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Text("🎁 Ranking Rewards", fontWeight = FontWeight.Bold, color = Color(0xFFBE123C), fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Top 3: Exclusive Frames + Coins\nRank 4 - 7: Coins\nRank 8 - 10: Coins\n\nWeekly and Monthly rewards are 3x of Daily.",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B),
                        lineHeight = 18.sp
                    )
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF0F172A))
                        .clickable { onDismiss() }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Got it", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun AnimatedGalaxyBackground() {
    val infiniteTransition = rememberInfiniteTransition(label = "bg")
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.94f, targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(2200, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glow"
    )

    // Gradients
    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF080014), Color(0xFF120020), Color(0xFF1E0038), Color(0xFF120020), Color(0xFF080014)))))
    Box(modifier = Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Color.Transparent, Color(0x1AF43F5E), Color(0x1EA855F7), Color.Transparent))))

    // Glow Orbs
    Box(modifier = Modifier.offset(x = (100).dp, y = (-80).dp).size(220.dp).scale(glowPulse).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0x8CF43F5E), Color.Transparent))))
    Box(modifier = Modifier.offset(x = 180.dp, y = 100.dp).size(240.dp).scale(glowPulse).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0x8C8B5CF6), Color.Transparent))))
    Box(modifier = Modifier.offset(x = (-60).dp, y = 300.dp).size(160.dp).scale(glowPulse).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0x66EC4899), Color.Transparent))))

    // Starry BG Image (Placed ON TOP of Glow Orbs)
    Box(modifier = Modifier.fillMaxWidth().height(650.dp)) {
        AsyncImage(
            model = R.drawable.haza_bg,
            contentDescription = null,
            modifier = Modifier.fillMaxSize().graphicsLayer { alpha = 0.9f },
            contentScale = ContentScale.FillBounds
        )
        Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x330D0019), Color(0xFF120020)))))
    }

    // Meteors
    val m1 by infiniteTransition.animateFloat(initialValue = 0f, targetValue = 1f, animationSpec = infiniteRepeatable(tween(1600, delayMillis = 0, easing = FastOutLinearInEasing)), label = "m1")
    val m2 by infiniteTransition.animateFloat(initialValue = 0f, targetValue = 1f, animationSpec = infiniteRepeatable(tween(1600, delayMillis = 1400, easing = FastOutLinearInEasing)), label = "m2")
    val m3 by infiniteTransition.animateFloat(initialValue = 0f, targetValue = 1f, animationSpec = infiniteRepeatable(tween(1600, delayMillis = 2800, easing = FastOutLinearInEasing)), label = "m3")

    val screenWidth = LocalDensity.current.density * 400
    DrawMeteor(m1, 30.dp, (-20).dp, screenWidth)
    DrawMeteor(m2, 110.dp, 60.dp, screenWidth)
    DrawMeteor(m3, 70.dp, 140.dp, screenWidth)
}

@Composable
fun DrawMeteor(progress: Float, top: androidx.compose.ui.unit.Dp, left: androidx.compose.ui.unit.Dp, screenWidth: Float) {
    val translateX = -80f + (progress * screenWidth * 1.5f)
    val translateY = -80f + (progress * 500f)
    val opacity = if (progress < 0.15f) progress / 0.15f else if (progress > 0.8f) (1f - progress) / 0.2f else 1f

    Box(
        modifier = Modifier.offset(x = left, y = top).size(width = 80.dp, height = 2.dp)
            .graphicsLayer {
                this.translationX = translateX
                this.translationY = translateY
                this.rotationZ = 45f
                this.alpha = opacity
            }
            .background(Brush.horizontalGradient(listOf(Color(0xF2FFFFFF), Color(0x4DEC4899), Color.Transparent)))
    )
}

@Composable
fun FloatingHearts() {
    val infiniteTransition = rememberInfiniteTransition(label = "hearts")
    val emojis = listOf("💖", "💕", "💗", "❤️", "💓", "💝", "🌹", "✨")
    
    Box(modifier = Modifier.fillMaxSize()) {
        for (i in 0 until 8) {
            val delay = remember { Random.nextInt(0, 4000) }
            val duration = remember { Random.nextInt(4000, 7000) }
            val startX = remember { Random.nextInt(12, 350).dp }
            val size = remember { Random.nextInt(10, 26).sp }
            
            val progress by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = 1f,
                animationSpec = infiniteRepeatable(tween(duration, delayMillis = delay, easing = FastOutLinearInEasing)),
                label = "p$i"
            )
            
            val ty = progress * -800f
            val alpha = if (progress < 0.08f) progress / 0.08f else if (progress > 0.85f) (1f - progress) / 0.15f else 1f
            
            Text(
                emojis[i % emojis.size],
                fontSize = size,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = startX)
                    .graphicsLayer {
                        translationY = ty
                        this.alpha = alpha
                    }
            )
        }
    }
}

@Composable
fun FerrisWheelLeaderboard(top7: List<CPPair>, onSelect: (CPPair) -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "wheel")
    val spin by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(8000, easing = LinearEasing)), label = "spin"
    )

    Box(
        modifier = Modifier.fillMaxWidth().height(420.dp),
        contentAlignment = Alignment.Center
    ) {
        // Soft cosmic background glow
        Box(modifier = Modifier.fillMaxSize().background(Brush.radialGradient(listOf(Color(0x14EC4899), Color(0x14F43F5E), Color.Transparent))))

        // Physical Wheel Stands
        Box(modifier = Modifier.offset(x = (-32).dp, y = 67.dp).size(width = 6.dp, height = 202.dp).graphicsLayer { rotationZ = 20f }.background(Brush.verticalGradient(listOf(Color(0xFFFFD700), Color(0xFFFFA500), Color(0xFFFF8C00)))))
        Box(modifier = Modifier.offset(x = 32.dp, y = 67.dp).size(width = 6.dp, height = 202.dp).graphicsLayer { rotationZ = -20f }.background(Brush.verticalGradient(listOf(Color(0xFFFFD700), Color(0xFFFFA500), Color(0xFFFF8C00)))))
        
        // Base Platform
        Box(modifier = Modifier.align(Alignment.BottomCenter).offset(y = (-34).dp).size(width = 160.dp, height = 16.dp).clip(RoundedCornerShape(8.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFFFD700), Color(0xFFFFA500), Color(0xFFFF8C00), Color(0xFFFFD700)))))

        // Clouds at bottom
        Box(modifier = Modifier.align(Alignment.BottomStart).offset(x = 20.dp, y = (-20).dp).size(width = 140.dp, height = 80.dp).clip(CircleShape).background(Color(0x52EC4899)))
        Box(modifier = Modifier.align(Alignment.BottomEnd).offset(x = (-20).dp, y = (-25).dp).size(width = 140.dp, height = 80.dp).clip(CircleShape).background(Color(0x52EC4899)))
        Box(modifier = Modifier.align(Alignment.BottomCenter).offset(y = (-10).dp).size(width = 200.dp, height = 85.dp).clip(CircleShape).background(Color(0x5CF43F5E)))

        // Rotating Wheel Rim
        Box(
            modifier = Modifier.size(280.dp).graphicsLayer { rotationZ = spin },
            contentAlignment = Alignment.Center
        ) {
            // Inner rim circle
            Box(modifier = Modifier.size(264.dp).clip(CircleShape).border(2.dp, Color(0x4DFBBF24), CircleShape))
            // Outer rim circle
            Box(modifier = Modifier.size(280.dp).clip(CircleShape).border(4.dp, Color(0x80FBBF24), CircleShape))

            // 12 Spokes
            for (i in 0 until 12) {
                Box(
                    modifier = Modifier.size(width = 280.dp, height = 2.8.dp).graphicsLayer { rotationZ = (i * 30f) },
                    contentAlignment = Alignment.CenterEnd
                ) {
                    Box(modifier = Modifier.size(width = 140.dp, height = 2.8.dp).background(Color(0xFFFBBF24)))
                }
            }

            // Outer Seats (Ranks 2 to 7)
            val outerSeats = top7.drop(1)
            outerSeats.forEachIndexed { idx, cp ->
                val angle = (idx * 60)
                val x = 115f * cos(Math.toRadians(angle.toDouble())).toFloat()
                val y = 115f * sin(Math.toRadians(angle.toDouble())).toFloat()

                Box(
                    modifier = Modifier.offset(x = x.dp, y = y.dp).graphicsLayer { rotationZ = -spin },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onSelect(cp) }) {
                        Box(
                            modifier = Modifier.size(56.dp).clip(CircleShape).background(Color(0xFF1E0A2A)).border(2.dp, Color(0xFFFBBF24), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy((-12).dp)) {
                                AsyncImage(model = CdnUtils.toCdn(cp.user1Avatar) ?: "https://picsum.photos/60", contentDescription = null, modifier = Modifier.size(34.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
                                AsyncImage(model = CdnUtils.toCdn(cp.user2Avatar) ?: "https://picsum.photos/61", contentDescription = null, modifier = Modifier.size(34.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
                            }
                        }
                        Box(modifier = Modifier.offset(y = (-8).dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF43F5E)).padding(horizontal = 6.dp, vertical = 2.dp)) {
                            Text("TOP${idx + 2}", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }

        // Stationary Center TOP1
        if (top7.isNotEmpty()) {
            val top1 = top7[0]
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onSelect(top1) }) {
                Icon(Icons.Default.Star, contentDescription = "Crown", tint = Color(0xFFFFD700), modifier = Modifier.size(22.dp).offset(y = 6.dp))
                Box(
                    modifier = Modifier.size(80.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFF8B5CF6), Color(0xFF1E0A2A)))).border(3.dp, Color(0xFFFFD700), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy((-4).dp)) {
                        AsyncImage(model = CdnUtils.toCdn(top1.user1Avatar) ?: "https://picsum.photos/80", contentDescription = null, modifier = Modifier.size(38.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
                        Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(14.dp))
                        AsyncImage(model = CdnUtils.toCdn(top1.user2Avatar) ?: "https://picsum.photos/81", contentDescription = null, modifier = Modifier.size(38.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
                    }
                }
                Box(modifier = Modifier.offset(y = (-10).dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFD700)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                    Text("TOP1", color = Color(0xFF451A03), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
fun RankRow(rank: Int, cp: CPPair, isMe: Boolean, onClick: () -> Unit) {
    val bgColor = if (isMe) Color(0x33F43F5E) else Color(0xFF2A0B38)
    val borderColor = if (isMe) Color(0x4DF43F5E) else Color.Transparent

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("#$rank", color = if (isMe) Color(0xFFF43F5E) else Color(0xFF94A3B8), fontSize = 16.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(36.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy((-8).dp)) {
            AsyncImage(model = CdnUtils.toCdn(cp.user1Avatar) ?: "https://picsum.photos/60", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape).border(2.dp, Color(0xFF1E0A2A), CircleShape), contentScale = ContentScale.Crop)
            AsyncImage(model = CdnUtils.toCdn(cp.user2Avatar) ?: "https://picsum.photos/61", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape).border(2.dp, Color(0xFF1E0A2A), CircleShape), contentScale = ContentScale.Crop)
        }

        Column(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text("${cp.user1Name} & ${cp.user2Name}", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("Lv.${cp.level} CP", color = Color(0x99FFFFFF), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(10.dp))
            Text(formatCpValue(cp.cpValue), color = Color(0xFFF43F5E), fontSize = 14.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
fun MyCpBanner(cp: CPPair, myUid: String, onClick: () -> Unit) {
    val isUser1 = cp.user1Id == myUid
    val partnerName = if (isUser1) cp.user2Name else cp.user1Name
    val myAvatar = if (isUser1) cp.user1Avatar else cp.user2Avatar
    val partnerAvatar = if (isUser1) cp.user2Avatar else cp.user1Avatar
    
    val days = if (cp.createdAt > 0) ((System.currentTimeMillis() / 1000 - cp.createdAt) / 86400).toInt() else 0

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .clip(RoundedCornerShape(20.dp))
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.matchParentSize().background(Brush.linearGradient(listOf(Color(0x2EF43F5E), Color(0x248B5CF6), Color(0x14F43F5E)))))
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = CdnUtils.toCdn(myAvatar) ?: "https://picsum.photos/80", contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
                Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(16.dp))
                AsyncImage(model = CdnUtils.toCdn(partnerAvatar) ?: "https://picsum.photos/81", contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape).border(1.dp, Color.White, CircleShape), contentScale = ContentScale.Crop)
            }
            
            Column(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
                Text("You & $partnerName", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("💖 ${formatCpValue(cp.cpValue)}", color = Color(0xFFF43F5E), fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    Text("·", color = Color.Gray, fontSize = 10.sp)
                    Text("${days}d", color = Color(0xFFF43F5E), fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                }
            }
            
            Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0x33F43F5E)).padding(horizontal = 6.dp, vertical = 4.dp)) {
                Text("Lv.${cp.level}", color = Color(0xFFF43F5E), fontSize = 11.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
fun CpProfileModal(cp: CPPair, rank: Int, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xD9080014))
                .clickable { onDismiss() },
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .width(320.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF160B24))
                    .border(1.5.dp, Color(0x4DF43F5E), RoundedCornerShape(24.dp))
                    .clickable(enabled = false) {}
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                IconButton(onClick = onDismiss, modifier = Modifier.align(Alignment.TopEnd).offset(x = 12.dp, y = (-12).dp).size(28.dp).background(Color(0x0FFFFFFF), CircleShape)) {
                    Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xB3FFFFFF), modifier = Modifier.size(16.dp))
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFBBF24), modifier = Modifier.size(14.dp))
                        Text("CP PROFILE", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFBBF24), modifier = Modifier.size(14.dp))
                    }
                    Spacer(modifier = Modifier.height(20.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                            Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(Color(0x1AF43F5E)).border(2.dp, Color(0xFFF43F5E), CircleShape).padding(2.dp)) {
                                AsyncImage(model = CdnUtils.toCdn(cp.user1Avatar) ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(cp.user1Name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, textAlign = TextAlign.Center)
                        }
                        
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 10.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Brush.horizontalGradient(listOf(Color(0x73F43F5E), Color(0x4D8B5CF6))))
                                    .border(1.dp, Color(0x1AFFFFFF), RoundedCornerShape(16.dp))
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFF43F5E), modifier = Modifier.size(14.dp).padding(bottom = 4.dp))
                                    Text(java.text.NumberFormat.getInstance(java.util.Locale.US).format(cp.cpValue), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                }
                            }
                            Text("CP Points", color = Color(0x66FFFFFF), fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 6.dp))
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                            Box(modifier = Modifier.size(72.dp).clip(CircleShape).background(Color(0x1A8B5CF6)).border(2.dp, Color(0xFF8B5CF6), CircleShape).padding(2.dp)) {
                                AsyncImage(model = CdnUtils.toCdn(cp.user2Avatar) ?: "https://picsum.photos/101", contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(cp.user2Name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1, textAlign = TextAlign.Center)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0x08FFFFFF)).padding(horizontal = 12.dp, vertical = 8.dp), contentAlignment = Alignment.Center) {
                        Text("CP Relationship Level: Lv.${cp.level}", color = Color(0x99FFFFFF), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                    }

                    if (rank in 0..9) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0x14FBBF24))
                                .border(1.dp, Color(0x4DFBBF24), RoundedCornerShape(14.dp))
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🏆 TOP ${rank + 1} COUPLE REWARD", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Black)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(if (rank < 3) "Exclusive Frame + Coins" else "Coins", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                }
            }
        }
    }
}

fun formatCpValue(valToFormat: Long): String {
    if (valToFormat == 0L) return "0"
    if (valToFormat >= 1_000_000_000_000) return String.format(java.util.Locale.US, "%.1fT", valToFormat / 1_000_000_000_000.0)
    if (valToFormat >= 1_000_000_000) return String.format(java.util.Locale.US, "%.1fB", valToFormat / 1_000_000_000.0)
    if (valToFormat >= 1_000_000) return String.format(java.util.Locale.US, "%.1fM", valToFormat / 1_000_000.0)
    if (valToFormat >= 1_000) return String.format(java.util.Locale.US, "%.1fK", valToFormat / 1_000.0)
    return valToFormat.toString()
}
