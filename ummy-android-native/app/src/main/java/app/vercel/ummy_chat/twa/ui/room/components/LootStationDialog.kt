package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.airbnb.lottie.compose.*
import app.vercel.ummy_chat.twa.data.model.LootLevel
import app.vercel.ummy_chat.twa.R

@Composable
fun LootStationDialog(
    levels: List<LootLevel>,
    currentLevelIndex: Int,
    displayPct: Int,
    onDismiss: () -> Unit
) {
    var activeIndex by remember { mutableStateOf(currentLevelIndex.coerceIn(0, maxOf(0, levels.size - 1))) }
    val activeLevel = levels.getOrNull(activeIndex)

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF050209),
                            Color(0xFF0D0724),
                            Color(0xFF050209)
                        )
                    )
                )
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // HEADER
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "LOOT LEVEL STATION",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.1f), CircleShape)
                            .size(32.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                // MAIN BODY
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 8.dp)
                ) {
                    // LEFT: Level Selector
                    LazyColumn(
                        modifier = Modifier
                            .weight(0.3f)
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        itemsIndexed(levels) { idx, level ->
                            val isSelected = activeIndex == idx
                            val isUnlocked = idx <= currentLevelIndex
                            
                            val bgColor = if (isSelected) Color(0xFF334155) else Color.Transparent
                            val borderColor = if (isSelected) Color(0xFFFBBF24) else Color.Transparent
                            
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(bgColor)
                                    .border(1.dp, borderColor, RoundedCornerShape(8.dp))
                                    .clickable { activeIndex = idx }
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(
                                            if (isSelected) Color(0xFFFBBF24)
                                            else if (isUnlocked) Color(0xFFA855F7)
                                            else Color(0xFF334155),
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "Lv.${idx + 1}",
                                        color = if (isSelected) Color.Black else Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = level.name,
                                    color = if (isSelected) Color(0xFFFBBF24)
                                            else if (isUnlocked) Color(0xFFE2E8F0)
                                            else Color(0xFF64748B),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    // CENTER: Lottie Stage
                    Box(
                        modifier = Modifier
                            .weight(0.6f)
                            .fillMaxHeight(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            if (activeLevel?.id?.lowercase() == "rocket") {
                                // NATIVE JETPACK COMPOSE ROCKET PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    RocketLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "home") {
                                // NATIVE JETPACK COMPOSE HOME PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    HomeLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "bank") {
                                // NATIVE JETPACK COMPOSE BANK PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    BankLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "car") {
                                // NATIVE JETPACK COMPOSE CAR PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    CarLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "hotel") {
                                // NATIVE JETPACK COMPOSE HOTEL PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    HotelLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "bus") {
                                // NATIVE JETPACK COMPOSE BUS PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    BusLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "train") {
                                // NATIVE JETPACK COMPOSE TRAIN PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    TrainLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "ship") {
                                // NATIVE JETPACK COMPOSE SHIP PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    ShipLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "plane" || activeLevel?.id?.lowercase() == "aeroplane") {
                                // NATIVE JETPACK COMPOSE AIRPLANE PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    AirplaneLootStage()
                                }
                            } else if (activeLevel?.id?.lowercase() == "submarine" || activeLevel?.id?.lowercase() == "spaceship") {
                                // NATIVE JETPACK COMPOSE SUBMARINE/SPACESHIP PORT
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    SubmarineLootStage()
                                }
                            } else {
                                // Lottie Animation Fallback for other levels
                                val lottieRes = R.raw.loot_home
                                
                                val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(lottieRes))
                                val progress by animateLottieCompositionAsState(
                                    composition = composition,
                                    iterations = LottieConstants.IterateForever
                                )
                                
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .padding(32.dp)
                                        .shadow(24.dp, CircleShape)
                                        .background(Color.White.copy(alpha = 0.05f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    LottieAnimation(
                                        composition = composition,
                                        progress = { progress },
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Timer Box
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF0F172A), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Reset countdown:", color = Color(0xFF94A3B8), fontSize = 12.sp)
                                    Text("23:59:59", color = Color(0xFF38BDF8), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // RIGHT: Progress Bar
                    Box(
                        modifier = Modifier
                            .weight(0.1f)
                            .fillMaxHeight()
                            .padding(vertical = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.fillMaxHeight()
                        ) {
                            Text("$displayPct%", color = Color(0xFFFBBF24), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Box(
                                modifier = Modifier
                                    .width(12.dp)
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFF1E293B))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .fillMaxHeight(displayPct / 100f)
                                        .background(
                                            Brush.verticalGradient(
                                                listOf(Color(0xFF8B5CF6), Color(0xFFF43F5E))
                                            )
                                        )
                                        .align(Alignment.BottomCenter)
                                )
                            }
                        }
                    }
                }

                // BOTTOM: Rewards
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(Color(0xFF1E1B4B).copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF4C1D95), RoundedCornerShape(12.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "🎁 Unlocks & Rewards (2x Threshold Pool)",
                            color = Color(0xFFFDE047),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            // Mock rewards
                            Box(modifier = Modifier.background(Color(0xFF0F051D), RoundedCornerShape(8.dp)).padding(12.dp)) {
                                Text("Frame: ${activeLevel?.name ?: ""} Elite", color = Color(0xFFC084FC), fontSize = 12.sp)
                            }
                            Box(modifier = Modifier.background(Color(0xFF0F051D), RoundedCornerShape(8.dp)).padding(12.dp)) {
                                Text("Entry: ${activeLevel?.name ?: ""} Special", color = Color(0xFF34D399), fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
