package app.vercel.ummy_chat.twa.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
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
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlinx.coroutines.delay
import java.text.NumberFormat
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

data class TopFamilyModel(
    val id: String = "",
    val name: String = "Family",
    val bannerUrl: String? = null,
    val avatarUrl: String? = null,
    val displayWealth: Long = 0L
)

@Composable
fun RealtimeFamilyCard(
    onPress: () -> Unit
) {
    var topFamilies by remember { mutableStateOf<List<TopFamilyModel>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var activeIndex by remember { mutableIntStateOf(0) }
    var mode by remember { mutableStateOf("podium") }

    val coroutineScope = rememberCoroutineScope()

    // ── Cascading Firebase Queries for Daily -> Weekly -> Total ──
    LaunchedEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        
        fun parseSnapshot(snap: com.google.firebase.firestore.QuerySnapshot, wealthField: String): List<TopFamilyModel> {
            return snap.documents.mapNotNull { doc ->
                val data = doc.data ?: return@mapNotNull null
                val wealth = (data[wealthField] as? Number)?.toLong() ?: 0L
                if (wealth <= 0) return@mapNotNull null
                TopFamilyModel(
                    id = doc.id,
                    name = data["name"] as? String ?: "Family",
                    bannerUrl = data["bannerUrl"] as? String,
                    avatarUrl = data["avatarUrl"] as? String ?: data["badgeUrl"] as? String,
                    displayWealth = wealth
                )
            }
        }

        coroutineScope.launch {
            try {
                // Try Daily First
                val dailySnap = fs.collection("families").whereGreaterThan("dailyWealth", 0).orderBy("dailyWealth", Query.Direction.DESCENDING).limit(3).get().await()
                val dailyList = parseSnapshot(dailySnap, "dailyWealth")
                if (dailyList.isNotEmpty()) {
                    topFamilies = dailyList
                    loading = false
                    return@launch
                }

                // Try Weekly
                val weeklySnap = fs.collection("families").whereGreaterThan("weeklyWealth", 0).orderBy("weeklyWealth", Query.Direction.DESCENDING).limit(3).get().await()
                val weeklyList = parseSnapshot(weeklySnap, "weeklyWealth")
                if (weeklyList.isNotEmpty()) {
                    topFamilies = weeklyList
                    loading = false
                    return@launch
                }

                // Fallback to Total
                val totalSnap = fs.collection("families").whereGreaterThan("totalWealth", 0).orderBy("totalWealth", Query.Direction.DESCENDING).limit(3).get().await()
                val totalList = parseSnapshot(totalSnap, "totalWealth")
                topFamilies = totalList
            } catch (e: Exception) {
                // Ignore for now
            } finally {
                loading = false
            }
        }
    }

    // ── Mode Switching Logic (RN Parity: Carousel 3s each → Podium 10s → repeat) ──
    LaunchedEffect(topFamilies.size) {
        if (topFamilies.isEmpty()) return@LaunchedEffect
        while (true) {
            for (i in topFamilies.indices) {
                activeIndex = i
                mode = "carousel"
                delay(3000)
            }
            mode = "podium"
            delay(10000)
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "family_card_motion")
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
            .aspectRatio(1.4f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0x08FFFFFF))
            .border(1.5.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(16.dp))
            .clickable { onPress() }
    ) {
        // Clipped background
        Image(
            painter = painterResource(id = R.drawable.bg_card_family),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.linearGradient(listOf(Color(0x801E3A8A), Color(0xA6000000)))
            )
        )
        Box(
            modifier = Modifier
                .offset(x = (-10).dp, y = (-10).dp)
                .size(80.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x2638BDF8))
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = 15.dp, y = 15.dp)
                .size(90.dp)
                .scale(glowPulse)
                .clip(CircleShape)
                .background(Color(0x1F38BDF8))
        )
        
        // Floating diamond stars like React Native
        val starStates = List(6) {
            object {
                val delay = (0..2000).random()
                val x = (10..140).random().dp
                val size = (2..5).random().dp
            }
        }
        
        starStates.forEach { star ->
            val starAnimY by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = -80f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000, easing = LinearEasing),
                    repeatMode = RepeatMode.Restart,
                    initialStartOffset = StartOffset(star.delay)
                ), label = "starY"
            )
            val starAlpha by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(1000, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse,
                    initialStartOffset = StartOffset(star.delay)
                ), label = "starAlpha"
            )
            
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = star.x, y = starAnimY.dp - 10.dp)
                    .size(star.size)
                    .graphicsLayer(rotationZ = 45f, alpha = starAlpha)
                    .background(Color(0xFF38BDF8))
            )
        }

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
                .padding(top = 0.dp, bottom = 2.dp, start = 8.dp, end = 8.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.offset(y = (-4).dp)
            ) {
                Icon(
                    Icons.Default.People,
                    contentDescription = null,
                    tint = Color(0xFF38BDF8),
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    "Family",
                    color = Color(0xFF38BDF8),
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
                    contentAlignment = Alignment.Center,
                    label = "ModeSwitch"
                ) { currentMode ->
                    if (currentMode == "podium") {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(58.dp).padding(bottom = 2.dp),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            // #2 Silver (Left)
                            FamilyPodiumItem(topFamilies.getOrNull(1), Color(0xFFCBD5E1), 34.dp, Modifier.offset(x = (-34).dp, y = (-2).dp).zIndex(5f))
                            
                            // #3 Bronze (Right)
                            FamilyPodiumItem(topFamilies.getOrNull(2), Color(0xFFD97706), 34.dp, Modifier.offset(x = 34.dp, y = (-2).dp).zIndex(5f))

                            // #1 Cyan (Center, raised)
                            FamilyPodiumItem(topFamilies.getOrNull(0), Color(0xFF38BDF8), 40.dp, Modifier.offset(y = (-16).dp).zIndex(10f))
                        }
                    } else {
                        val family = topFamilies.getOrNull(activeIndex)
                        val frameColor = when (activeIndex) {
                            0 -> Color(0xFF38BDF8)
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
                                    model = CdnUtils.toCdn(family?.bannerUrl ?: family?.avatarUrl) ?: "https://picsum.photos/101",
                                    contentDescription = null,
                                    modifier = Modifier.size(28.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Spacer(modifier = Modifier.height(0.dp))
                            Text(
                                family?.name ?: "Family",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.fillMaxWidth(0.9f).offset(y = 6.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Text(
                                "🛡️ ${NumberFormat.getInstance(java.util.Locale.US).format(family?.displayWealth ?: 0L)}",
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

@Composable
fun FamilyPodiumItem(family: TopFamilyModel?, color: Color, size: Dp, modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "family_dp_motion")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.4f, targetValue = 0.9f,
        animationSpec = infiniteRepeatable(tween(1500), RepeatMode.Reverse),
        label = "pulse"
    )

    Box(modifier = modifier.size(size), contentAlignment = Alignment.Center) {
        Box(modifier = Modifier.size(size + 4.dp).graphicsLayer(alpha = pulse).border(1.2.dp, color, CircleShape))
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(Color.Black.copy(alpha = 0.3f))
                .border(1.8.dp, color, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (family != null) {
                AsyncImage(
                    model = CdnUtils.toCdn(family.bannerUrl ?: family.avatarUrl) ?: "https://picsum.photos/101",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.White.copy(alpha = 0.05f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🛡️", fontSize = (size.value * 0.4).sp, color = Color.White.copy(alpha = 0.3f))
                }
            }
        }
    }
}
