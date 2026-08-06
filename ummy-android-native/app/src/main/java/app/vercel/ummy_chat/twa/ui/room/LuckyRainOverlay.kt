package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

// ─────────────────────────────────────────────────────────────────────────────
// LuckyRainOverlay — mirrors RN lucky-rain-overlay.tsx
// 30-second interactive coin rain: tap falling coins to collect them
// Each tap = +10 coins, updates Firestore wallet
// ─────────────────────────────────────────────────────────────────────────────

private const val RAIN_DURATION = 30
private const val COIN_PER_TAP = 10
private const val TOTAL_COINS = 20

private data class RainCoin(
    val id: Int,
    val startXFraction: Float, // 0..1 of screen width fraction
    val side: String,          // "left" | "right"
    val delayMs: Long,
    var tapped: Boolean = false
)

@Composable
fun LuckyRainOverlay(
    visible: Boolean,
    roomId: String? = null,
    onComplete: (() -> Unit)? = null
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var timeLeft by remember { mutableIntStateOf(RAIN_DURATION) }
    var collected by remember { mutableIntStateOf(0) }
    var pops by remember { mutableStateOf<List<Pair<Int, Float>>>(emptyList()) } // id, xFraction
    val tappedIds = remember { mutableSetOf<Int>() }

    // Generate 20 coins once
    val coins = remember {
        List(TOTAL_COINS) { i ->
            RainCoin(
                id = i,
                startXFraction = if (i % 2 == 0) 0.1f + Random.nextFloat() * 0.3f
                                  else 0.55f + Random.nextFloat() * 0.3f,
                side = if (i % 2 == 0) "left" else "right",
                delayMs = (i * 200L)
            )
        }
    }

    // Countdown timer
    LaunchedEffect(visible) {
        timeLeft = RAIN_DURATION
        collected = 0
        tappedIds.clear()
        while (timeLeft > 0) {
            delay(1000)
            timeLeft--
        }
        delay(1500)
        onComplete?.invoke()
    }

    // Individual coin falling animations
    val coinYAnims = remember { coins.map { Animatable(-50f) } }
    val coinAlphas = remember { coins.map { Animatable(0f) } }
    val coinRotations = remember { coins.map { Animatable(0f) } }

    LaunchedEffect(visible) {
        coins.forEachIndexed { i, coin ->
            scope.launch {
                delay(coin.delayMs)
                // Fade in + fall + spin
                launch { coinAlphas[i].animateTo(1f, tween(200)) }
                launch {
                    coinYAnims[i].animateTo(500f, tween(2500))
                    coinAlphas[i].animateTo(0f, tween(300))
                }
                launch {
                    repeat(6) {
                        coinRotations[i].animateTo(coinRotations[i].value + 360f, tween(400))
                    }
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f))
    ) {
        // ── Header banner ──────────────────────────────────────────────
        Box(
            modifier = Modifier.fillMaxWidth().padding(top = 50.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFFBBF24).copy(alpha = 0.2f))
                    .border(1.dp, Color(0xFFFBBF24).copy(alpha = 0.4f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 20.dp, vertical = 10.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "🌧️ TAP THE COINS!",
                        color = Color(0xFFFBBF24),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "+$COIN_PER_TAP per coin • ${timeLeft}s left",
                        color = Color(0xFFFCD34D),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        // ── Falling coins (using BoxWithConstraints for relative positioning) ──
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val screenW = maxWidth
            coins.forEachIndexed { i, coin ->
                if (!tappedIds.contains(coin.id)) {
                    Box(
                        modifier = Modifier
                            .offset(
                                x = screenW * coin.startXFraction,
                                y = coinYAnims[i].value.dp
                            )
                            .alpha(coinAlphas[i].value)
                            .rotate(coinRotations[i].value)
                            .clickable {
                                if (!tappedIds.contains(coin.id)) {
                                    tappedIds.add(coin.id)
                                    collected += COIN_PER_TAP
                                    // Add pop effect
                                    val pid = pops.size
                                    pops = pops + (pid to coin.startXFraction)
                                    scope.launch {
                                        delay(800)
                                        pops = pops.filter { it.first != pid }
                                    }
                                    // Firestore update
                                    scope.launch {
                                        try {
                                            val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                            val db = Firebase.firestore
                                            db.collection("users").document(uid)
                                                .update("wallet.coins", FieldValue.increment(COIN_PER_TAP.toLong()))
                                                .await()
                                        } catch (_: Exception) {}
                                    }
                                    // Fly coin up and fade
                                    scope.launch {
                                        launch { coinYAnims[i].animateTo(-50f, tween(400)) }
                                        launch { coinAlphas[i].animateTo(0f, tween(300)) }
                                    }
                                }
                            }
                    ) {
                        Text("🪙", fontSize = 28.sp)
                    }
                }
            }

            // Pop texts (+10)
            pops.forEach { (_, xFrac) ->
                Box(
                    modifier = Modifier
                        .offset(x = screenW * xFrac, y = 200.dp)
                        .alpha(0.9f)
                ) {
                    Text(
                        "+$COIN_PER_TAP",
                        color = Color(0xFFFBBF24),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        // ── Bottom counter ─────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(bottom = 80.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFFBBF24).copy(alpha = 0.15f))
                    .border(1.dp, Color(0xFFFBBF24).copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 24.dp, vertical = 10.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "+$collected Lucky Coins!",
                        color = Color(0xFFFBBF24),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                    if (timeLeft == 0) {
                        Text(
                            "Rain finished!",
                            color = Color(0xFFFCD34D),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
