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
import androidx.compose.material.icons.filled.WorkspacePremium
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
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.ui.home.GoldenCoin
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlinx.coroutines.delay
import kotlin.math.sin
import kotlin.random.Random

data class TopUserRanking(
    val uid: String = "",
    val name: String = "User",
    val avatarUrl: String? = null,
    val spentCoins: Long = 0L
)

@Composable
fun RealtimeRankingCard(
    onPress: () -> Unit
) {
    var topUsersDaily by remember { mutableStateOf<List<TopUserRanking>>(emptyList()) }
    var topUsersTotal by remember { mutableStateOf<List<TopUserRanking>>(emptyList()) }
    var dailyLoading by remember { mutableStateOf(true) }
    var totalLoading by remember { mutableStateOf(true) }
    var activeIndex by remember { mutableIntStateOf(0) }
    var mode by remember { mutableStateOf("carousel") }

    DisposableEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        val dailyListener = fs.collection("users")
            .whereGreaterThan("wallet.dailySpent", 0)
            .orderBy("wallet.dailySpent", Query.Direction.DESCENDING)
            .limit(3)
            .addSnapshotListener { snapshot, _ ->
                topUsersDaily = snapshot?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val wallet = data["wallet"] as? Map<*, *>
                    TopUserRanking(
                        uid = doc.id,
                        name = data["username"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String,
                        spentCoins = (wallet?.get("dailySpent") as? Number)?.toLong() ?: 0L
                    )
                } ?: emptyList()
                dailyLoading = false
            }
        val totalListener = fs.collection("users")
            .whereGreaterThan("wallet.totalSpent", 0)
            .orderBy("wallet.totalSpent", Query.Direction.DESCENDING)
            .limit(3)
            .addSnapshotListener { snapshot, _ ->
                topUsersTotal = snapshot?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val wallet = data["wallet"] as? Map<*, *>
                    TopUserRanking(
                        uid = doc.id,
                        name = data["username"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String,
                        spentCoins = (wallet?.get("totalSpent") as? Number)?.toLong() ?: 0L
                    )
                } ?: emptyList()
                totalLoading = false
            }
        onDispose { dailyListener.remove(); totalListener.remove() }
    }

    val topUsers = remember(topUsersDaily, topUsersTotal, dailyLoading, totalLoading) {
        if (dailyLoading && totalLoading) emptyList()
        else if (topUsersDaily.isNotEmpty()) topUsersDaily
        else if (!dailyLoading) topUsersTotal
        else topUsersTotal
    }

    // ── Mode Switching Logic (RN Parity: Carousel 3s each → Podium 10s → repeat) ──
    LaunchedEffect(topUsers.size) {
        if (topUsers.isEmpty()) return@LaunchedEffect
        while (true) {
            // Carousel mode: show each user for 3 seconds
            for (i in topUsers.indices) {
                activeIndex = i
                mode = "carousel"
                delay(3000)
            }
            // Podium mode: show all 3 together for 10 seconds
            mode = "podium"
            delay(10000)
        }
    }

    // ── Sheen animation ──
    val infiniteTransition = rememberInfiniteTransition(label = "card_motion")
    val sheenX by infiniteTransition.animateFloat(
        initialValue = -120f, targetValue = 240f,
        animationSpec = infiniteRepeatable(
            tween(2500, easing = LinearEasing),
            RepeatMode.Restart
        ),
        label = "sheen"
    )

    // ── Glowing orbs pulse ──
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.95f, targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            tween(2000, easing = FastOutSlowInEasing),
            RepeatMode.Reverse
        ),
        label = "glow_pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1.4f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x08FFFFFF))
            .border(1.5.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(16.dp))
            .clickable { onPress() }
    ) {
        // ── Background assets & effects ──
        Image(
            painter = painterResource(id = R.drawable.bg_card_ranking),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.linearGradient(listOf(Color(0x80581C87), Color(0xA6000000)))
            )
        )
        // Glowing orbs
        Box(
            modifier = Modifier
                .offset(x = (-10).dp, y = (-10).dp)
                .size(80.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x26A855F7))
        )
        Box(
            modifier = Modifier
                .offset(x = 140.dp, y = 160.dp)
                .size(90.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x1FEAB308))
        )
        RankingEmberLayer()
        // Sweeping Metallic sheen
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(30.dp)
                .offset(x = sheenX.dp)
                .graphicsLayer(rotationZ = -25f)
                .background(Color.White.copy(alpha = 0.06f))
        )

        // ── Card Content ──
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 0.dp, bottom = 2.dp, start = 8.dp, end = 8.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.offset(y = (-4).dp)
            ) {
                Icon(
                    Icons.Default.WorkspacePremium,
                    contentDescription = null,
                    tint = Color(0xFFFBBF24),
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    "Ranking",
                    color = Color(0xFFFBBF24),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
            }

            // Content Area
            Box(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentAlignment = Alignment.Center
            ) {
                AnimatedContent(
                    targetState = mode,
                    transitionSpec = {
                        fadeIn(tween(250)) togetherWith fadeOut(tween(250))
                    },
                    contentAlignment = Alignment.Center,
                    label = "ModeSwitch"
                ) { currentMode ->
                    if (currentMode == "podium") {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(58.dp).padding(bottom = 2.dp),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            // #2 Silver (Left)
                            val user2 = topUsers.getOrNull(1)
                            Box(modifier = Modifier.size(34.dp).offset(x = (-34).dp, y = (-2).dp).zIndex(5f)) {
                                if (user2 != null) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(user2.avatarUrl) ?: "https://picsum.photos/100",
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape).border(1.5.dp, Color(0xFFCBD5E1), CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color(0x0DFFFFFF)).border(1.5.dp, Color(0xFFCBD5E1), CircleShape))
                                }
                            }

                            // #3 Bronze (Right)
                            val user3 = topUsers.getOrNull(2)
                            Box(modifier = Modifier.size(34.dp).offset(x = 34.dp, y = (-2).dp).zIndex(5f)) {
                                if (user3 != null) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(user3.avatarUrl) ?: "https://picsum.photos/100",
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape).border(1.5.dp, Color(0xFFD97706), CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color(0x0DFFFFFF)).border(1.5.dp, Color(0xFFD97706), CircleShape))
                                }
                            }

                            // #1 Gold (Center, raised)
                            val user1 = topUsers.getOrNull(0)
                            Box(modifier = Modifier.size(40.dp).offset(y = (-16).dp).zIndex(10f)) {
                                if (user1 != null) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(user1.avatarUrl) ?: "https://picsum.photos/100",
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize().clip(CircleShape).border(2.dp, Color(0xFFFBBF24), CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color(0x0DFFFFFF)).border(2.dp, Color(0xFFFBBF24), CircleShape))
                                }
                            }
                        }
                    } else {
                        val user = topUsers.getOrNull(activeIndex)
                        val frameColor = when (activeIndex) {
                            0 -> Color(0xFFFBBF24)
                            1 -> Color(0xFFCBD5E1)
                            else -> Color(0xFFD97706)
                        }
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy((-6).dp, Alignment.CenterVertically),
                            modifier = Modifier.fillMaxWidth().offset(y = (-6).dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(Color.Black.copy(alpha = 0.3f))
                                    .border(2.dp, frameColor, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                AsyncImage(
                                    model = CdnUtils.toCdn(user?.avatarUrl) ?: "https://picsum.photos/100",
                                    contentDescription = null,
                                    modifier = Modifier.size(28.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Spacer(modifier = Modifier.height(0.dp))
                            Text(
                                user?.name ?: "User",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                modifier = Modifier.fillMaxWidth(0.9f).offset(y = 6.dp)
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                GoldenCoin(size = 10.dp)
                                Text(
                                    "${user?.spentCoins?.takeIf { it > 0 }?.let { "%,d".format(it) } ?: 0}",
                                    color = Color(0xFFFBBF24),
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
fun RankingEmberLayer() {
    val embers = remember {
        List(6) { idx ->
            EmberData(
                x = 10f + Random.nextFloat() * 140f,
                size = 2f + Random.nextFloat() * 3f,
                delayMs = (Random.nextFloat() * 2000).toLong(),
                isGold = idx % 2 == 0
            )
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        embers.forEach { ember ->
            RankingSingleEmber(ember)
        }
    }
}

data class EmberData(
    val x: Float,
    val size: Float,
    val delayMs: Long,
    val isGold: Boolean
)

@Composable
fun RankingSingleEmber(ember: EmberData) {
    val infiniteTransition = rememberInfiniteTransition(label = "ember_${ember.x}")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            tween(2500, delayMillis = ember.delayMs.toInt(), easing = LinearEasing),
            RepeatMode.Restart
        ),
        label = "ember_progress"
    )

    val alpha = when {
        progress < 0.2f -> progress / 0.2f
        progress > 0.8f -> (1f - progress) / 0.2f
        else -> 1f
    }
    val yOffset = progress * -80f
    val xOffset = sin(progress * 3.14f * 2f) * 15f

    Box(
        modifier = Modifier
            .offset(x = ember.x.dp + xOffset.dp, y = (170f + yOffset).dp)
            .size(ember.size.dp)
            .clip(CircleShape)
            .background(if (ember.isGold) Color(0xFFF59E0B) else Color(0xFFD946EF))
            .graphicsLayer(alpha = alpha)
    )
}
