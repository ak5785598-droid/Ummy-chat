package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.R
import kotlinx.coroutines.delay

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun LootGate(
    isOpen: Boolean,
    levelName: String,
    levelImage: String,
    entryLimit: Int,
    currentEntries: Int,
    timeRemaining: Int,
    onEnter: () -> Unit,
    hasEntered: Boolean,
    onClose: () -> Unit
) {
    if (!isOpen) return

    fun getLocalDrawableForLevel(name: String): Int? {
        return when (name.lowercase()) {
            "home" -> R.drawable.level_home
            "bank" -> R.drawable.level_bank
            "car" -> R.drawable.level_car
            "hotel" -> R.drawable.level_hotel
            "bus" -> R.drawable.level_bus
            "train" -> R.drawable.level_train
            "ship" -> R.drawable.level_ship
            "aeroplane" -> R.drawable.level_aeroplane
            "submarine" -> R.drawable.level_submarine
            "rocket" -> R.drawable.level_rocket
            else -> null
        }
    }

    val localRes = getLocalDrawableForLevel(levelName)

    var isCinematicActive by remember { mutableStateOf(true) }

    LaunchedEffect(isOpen) {
        if (isOpen) {
            isCinematicActive = true
            delay(5000)
            isCinematicActive = false
        }
    }

    LaunchedEffect(timeRemaining, isCinematicActive) {
        if (timeRemaining <= 0 && !isCinematicActive) {
            delay(1000)
            onClose()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.9f)),
        contentAlignment = Alignment.Center
    ) {
        AnimatedContent(
            targetState = isCinematicActive,
            transitionSpec = {
                (fadeIn() + scaleIn(initialScale = 0.95f)) with (fadeOut() + scaleOut(targetScale = 1.05f))
            }
        ) { cinematic ->
            if (cinematic) {
                // Cinematic View
                Box(modifier = Modifier.fillMaxSize()) {
                    if (levelImage.isNotEmpty()) {
                        AsyncImage(
                            model = if (levelImage.startsWith("http")) levelImage else "https://ummy.in$levelImage",
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize().padding(16.dp),
                            alpha = 0.8f
                        )
                    } else {
                        Box(modifier = Modifier.fillMaxSize().background(Brush.radialGradient(listOf(Color(0xFFF57F17), Color(0xFF1B0000)))))
                    }
                    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black))))

                    Column(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .background(Brush.linearGradient(listOf(Color(0xFFFFEB3B), Color(0xFFFF9800))), CircleShape)
                                .border(2.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                                .shadow(20.dp, CircleShape, ambientColor = Color.Yellow, spotColor = Color.Yellow),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🔑", fontSize = 36.sp)
                        }
                        
                        Spacer(Modifier.height(24.dp))
                        Text(
                            text = "🎉 LEVEL COMPLETE! 🎉",
                            color = Color(0xFFFFEB3B),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 4.sp
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "${levelName.uppercase()} GATE",
                            color = Color.White,
                            fontSize = 40.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "OPENING VAULT DOORS IN 5 SECONDS...",
                            color = Color(0xFFFFF59D),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                    }
                }
            } else {
                // Vault Dialog
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .background(Brush.linearGradient(listOf(Color(0xE63E2723), Color(0xE6210000))), RoundedCornerShape(24.dp))
                        .border(2.dp, Color(0x80FFB300), RoundedCornerShape(24.dp))
                        .padding(24.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Level Icon
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                                .clip(RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (levelImage.isNotEmpty() || localRes != null) {
                                AsyncImage(
                                    model = if (levelImage.isNotEmpty()) {
                                        if (levelImage.startsWith("http")) levelImage else "https://ummy.in$levelImage"
                                    } else {
                                        localRes
                                    },
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize().padding(16.dp)
                                )
                            } else {
                                Text("🏠", fontSize = 48.sp)
                            }
                        }

                        Spacer(Modifier.height(16.dp))
                        Text("${levelName.uppercase()} LOOT!", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)

                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Timer, contentDescription = null, tint = Color(0xFFFFEB3B), modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("${timeRemaining}s", color = Color(0xFFFFEB3B), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(Modifier.height(16.dp))
                        
                        val isFull = currentEntries >= entryLimit
                        Box(modifier = Modifier.fillMaxWidth().background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(16.dp)).padding(16.dp)) {
                            Column {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Entries", color = Color(0xFFFFF59D), fontSize = 12.sp)
                                    Text("$currentEntries / $entryLimit", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(Modifier.height(8.dp))
                                Box(modifier = Modifier.fillMaxWidth().height(8.dp).background(Color(0x803E2723), CircleShape)) {
                                    val pct = (currentEntries.toFloat() / entryLimit).coerceIn(0f, 1f)
                                    Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(pct).background(if (isFull) Color.Red else Color.Green, CircleShape))
                                }
                                Spacer(Modifier.height(8.dp))
                                val spotsLeft = entryLimit - currentEntries
                                Text(
                                    text = if (isFull) "GATE FULL!" else "$spotsLeft spots left",
                                    color = if (isFull) Color(0xFFEF5350) else if (spotsLeft <= 5) Color(0xFFFFA726) else Color(0xFF66BB6A),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(Modifier.height(16.dp))
                        if (!hasEntered && !isFull) {
                            Button(
                                onClick = onEnter,
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Icon(Icons.Default.FlashOn, contentDescription = null, tint = Color.Black)
                                Spacer(Modifier.width(8.dp))
                                Text("ENTER NOW!", color = Color.Black, fontSize = 18.sp, fontWeight = FontWeight.Black)
                            }
                        } else if (hasEntered) {
                            Box(modifier = Modifier.fillMaxWidth().background(Color(0x334CAF50), RoundedCornerShape(16.dp)).border(1.dp, Color(0x804CAF50), RoundedCornerShape(16.dp)).padding(16.dp), contentAlignment = Alignment.Center) {
                                Text("✅ You're inside! Start looting!", color = Color(0xFFA5D6A7), fontWeight = FontWeight.Bold)
                            }
                        } else if (isFull) {
                            Box(modifier = Modifier.fillMaxWidth().background(Color(0x33F44336), RoundedCornerShape(16.dp)).border(1.dp, Color(0x80F44336), RoundedCornerShape(16.dp)).padding(16.dp), contentAlignment = Alignment.Center) {
                                Text("❌ Gate is full! Try next time.", color = Color(0xFFEF9A9A), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
