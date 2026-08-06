package app.vercel.ummy_chat.twa.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlinx.coroutines.delay
import java.text.NumberFormat

data class RealtimeCpPair(
    val id: String = "",
    val participantIds: List<String> = emptyList(),
    val cpValue: Long = 0L,
    val user1Name: String = "User1",
    val u1Avatar: String? = null,
    val user2Name: String = "User2",
    val u2Avatar: String? = null
)

@Composable
fun RealtimeCpCard(
    onPress: () -> Unit
) {
    var topCpPairs by remember { mutableStateOf<List<RealtimeCpPair>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var activeIndex by remember { mutableIntStateOf(0) }
    var mode by remember { mutableStateOf("podium") }

    DisposableEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        val listener = fs.collection("cpPairs")
            .orderBy("cpValue", Query.Direction.DESCENDING)
            .limit(10)
            .addSnapshotListener { snapshot, _ ->
                topCpPairs = snapshot?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val type = data["type"] as? String
                    if (type == "Best Friend" || type == "Besties") return@mapNotNull null
                    RealtimeCpPair(
                        id = doc.id,
                        participantIds = (data["participantIds"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                        cpValue = (data["cpValue"] as? Number)?.toLong() ?: 0L,
                        user1Name = data["user1Name"] as? String ?: "User1",
                        u1Avatar = data["user1Avatar"] as? String,
                        user2Name = data["user2Name"] as? String ?: "User2",
                        u2Avatar = data["user2Avatar"] as? String
                    )
                }?.take(3) ?: emptyList()
                isLoading = false
            }
        onDispose { listener.remove() }
    }

    // ── Mode Switching Logic (RN Parity: Carousel 3s each → Podium 10s → repeat) ──
    LaunchedEffect(topCpPairs.size) {
        if (topCpPairs.isEmpty()) return@LaunchedEffect
        while (true) {
            for (i in topCpPairs.indices) {
                activeIndex = i
                mode = "carousel"
                delay(3000)
            }
            mode = "podium"
            delay(10000)
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "cp_card_motion")
    val sheenX by infiniteTransition.animateFloat(
        initialValue = -120f, targetValue = 240f,
        animationSpec = infiniteRepeatable(tween(2500, easing = LinearEasing), RepeatMode.Restart),
        label = "sheen"
    )
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.95f, targetValue = 1.15f,
        animationSpec = infiniteRepeatable(tween(2000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "glow_pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1.33f)
            .clip(RoundedCornerShape(24.dp))
            .background(Color(0x08FFFFFF))
            .border(1.5.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(24.dp))
            .clickable { onPress() }
    ) {
        // Background and effects
        Image(
            painter = painterResource(id = R.drawable.bg_card_cp),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.linearGradient(listOf(Color(0x809D174D), Color(0xA6000000)))
            )
        )
        Box(
            modifier = Modifier
                .offset(x = (-10).dp, y = (-10).dp)
                .size(80.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x26F43F5E))
        )
        Box(
            modifier = Modifier
                .offset(x = 140.dp, y = 160.dp)
                .size(90.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x1FF43F5E))
        )
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(30.dp)
                .offset(x = sheenX.dp)
                .graphicsLayer(rotationZ = -25f)
                .background(Color.White.copy(alpha = 0.06f))
        )

        // Content
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 8.dp, bottom = 10.dp, start = 8.dp, end = 8.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    Icons.Default.Favorite,
                    contentDescription = null,
                    tint = Color(0xFFF43F5E),
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    "CP Pair",
                    color = Color(0xFFF43F5E),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
            }

            Box(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentAlignment = Alignment.Center
            ) {
                AnimatedContent(
                    targetState = mode,
                    transitionSpec = { fadeIn(tween(250)) togetherWith fadeOut(tween(250)) },
                    label = "ModeSwitch"
                ) { currentMode ->
                    if (currentMode == "podium") {
                        Row(
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
                            verticalAlignment = Alignment.Bottom
                        ) {
                            // #2 Silver
                            LiveCpPodiumItem(topCpPairs.getOrNull(1), 24.dp, Color(0xFFCBD5E1))
                            // #1 Gold
                            Box(modifier = Modifier.offset(y = (-14).dp)) {
                                LiveCpPodiumItem(topCpPairs.getOrNull(0), 32.dp, Color(0xFFFBBF24))
                            }
                            // #3 Bronze
                            LiveCpPodiumItem(topCpPairs.getOrNull(2), 24.dp, Color(0xFFD97706))
                        }
                    } else {
                        val cp = topCpPairs.getOrNull(activeIndex)
                        val heartEmoji = when (activeIndex) {
                            0 -> "💖"
                            1 -> "❤️"
                            else -> "💕"
                        }
                        if (cp != null) {
                            LiveCpCarouselItem(cp = cp, heartEmoji = heartEmoji)
                        } else {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy((-8).dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.05f))
                                            .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("💖", fontSize = 10.sp)
                                    }
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.05f))
                                            .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("💖", fontSize = 10.sp)
                                    }
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    "Top Couple",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                                Text(
                                    "Waiting...",
                                    color = Color(0xFFF43F5E),
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LiveCpCarouselItem(
    cp: RealtimeCpPair,
    heartEmoji: String
) {
    var u1Name by remember(cp.id) { mutableStateOf(cp.user1Name) }
    var u2Name by remember(cp.id) { mutableStateOf(cp.user2Name) }
    var u1Avatar by remember(cp.id) { mutableStateOf(cp.u1Avatar) }
    var u2Avatar by remember(cp.id) { mutableStateOf(cp.u2Avatar) }

    DisposableEffect(cp.id) {
        val fs = FirebaseFirestore.getInstance()
        val uid1 = cp.participantIds.getOrNull(0) ?: ""
        val uid2 = cp.participantIds.getOrNull(1) ?: ""

        val listener1 = if (uid1.isNotEmpty()) {
            fs.collection("users").document(uid1).addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    u1Name = snap.getString("username") ?: snap.getString("name") ?: "User1"
                    u1Avatar = snap.getString("avatarUrl") ?: snap.getString("photoURL")
                }
            }
        } else null

        val listener2 = if (uid2.isNotEmpty()) {
            fs.collection("users").document(uid2).addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    u2Name = snap.getString("username") ?: snap.getString("name") ?: "User2"
                    u2Avatar = snap.getString("photoURL") ?: snap.getString("avatarUrl")
                }
            }
        } else null

        onDispose {
            listener1?.remove()
            listener2?.remove()
        }
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy((-8).dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .border(2.dp, Color.White, CircleShape)
            ) {
                AsyncImage(
                    model = CdnUtils.toCdn(u1Avatar) ?: "https://picsum.photos/100",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .border(2.dp, Color.White, CircleShape)
            ) {
                AsyncImage(
                    model = CdnUtils.toCdn(u2Avatar) ?: "https://picsum.photos/100",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
        }

        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = "$u1Name & $u2Name",
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.fillMaxWidth(0.9f)
        )
        Text(
            text = "$heartEmoji ${NumberFormat.getInstance(java.util.Locale.US).format(cp.cpValue)}",
            color = Color(0xFFF43F5E),
            fontSize = 8.sp,
            fontWeight = FontWeight.Black
        )
    }
}

@Composable
fun LiveCpPodiumItem(
    cp: RealtimeCpPair?,
    avatarSize: Dp,
    borderColor: Color,
    modifier: Modifier = Modifier
) {
    var u1Avatar by remember(cp?.id) { mutableStateOf(cp?.u1Avatar) }
    var u2Avatar by remember(cp?.id) { mutableStateOf(cp?.u2Avatar) }

    DisposableEffect(cp?.id) {
        if (cp == null) {
            onDispose {}
        } else {
            val fs = FirebaseFirestore.getInstance()
            val uid1 = cp.participantIds.getOrNull(0) ?: ""
            val uid2 = cp.participantIds.getOrNull(1) ?: ""

            val listener1 = if (uid1.isNotEmpty()) {
                fs.collection("users").document(uid1).addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        u1Avatar = snap.getString("avatarUrl") ?: snap.getString("photoURL")
                    }
                }
            } else null

            val listener2 = if (uid2.isNotEmpty()) {
                fs.collection("users").document(uid2).addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        u2Avatar = snap.getString("avatarUrl") ?: snap.getString("photoURL")
                    }
                }
            } else null

            onDispose {
                listener1?.remove()
                listener2?.remove()
            }
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "cp_podium_motion")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.4f, targetValue = 0.9f,
        animationSpec = infiniteRepeatable(tween(1500), RepeatMode.Reverse),
        label = "pulse"
    )

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        // Pulsing outer rounded card border
        Box(
            modifier = Modifier
                .size(width = avatarSize * 1.6f, height = avatarSize + 4.dp)
                .graphicsLayer(alpha = pulse)
                .border(1.2.dp, borderColor.copy(alpha = 0.5f), RoundedCornerShape(99.dp))
        )

        if (cp != null) {
            Row(
                horizontalArrangement = Arrangement.spacedBy((-avatarSize.value * 0.3).dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(avatarSize)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.3f))
                        .border(1.dp, borderColor, CircleShape)
                ) {
                    AsyncImage(
                        model = CdnUtils.toCdn(u1Avatar) ?: "https://picsum.photos/102",
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                Box(
                    modifier = Modifier
                        .size(avatarSize)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.3f))
                        .border(1.dp, borderColor, CircleShape)
                ) {
                    AsyncImage(
                        model = CdnUtils.toCdn(u2Avatar) ?: "https://picsum.photos/103",
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .size(width = avatarSize * 1.4f, height = avatarSize)
                    .clip(RoundedCornerShape(99.dp))
                    .background(Color.White.copy(alpha = 0.05f)),
                contentAlignment = Alignment.Center
            ) {
                Text("💖", fontSize = (avatarSize.value * 0.4).sp, color = Color.White.copy(alpha = 0.3f))
            }
        }
    }
}
