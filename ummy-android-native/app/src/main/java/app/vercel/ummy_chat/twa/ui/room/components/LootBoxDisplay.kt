package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.with
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.data.model.LootLevel
import app.vercel.ummy_chat.twa.R
import kotlinx.coroutines.delay

@OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun LootBoxDisplay(
    levels: List<LootLevel>,
    currentProgress: Long,
    isGateOpen: Boolean,
    canOpenGate: Boolean,
    onOpenGate: () -> Unit,
    onShowStation: () -> Unit,
    currentLevelIndex: Int,
    isGateCompleted: Boolean,
    modifier: Modifier = Modifier
) {
    if (isGateOpen || levels.isEmpty()) return

    fun getLocalDrawableForLevel(id: String): Int? {
        return when (id.lowercase()) {
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

    var activeIndex by remember { mutableStateOf(0) }
    var showLevelPath by remember { mutableStateOf(false) }

    val activeLevel = levels[activeIndex]
    val currentLevel = levels.getOrNull(currentLevelIndex) ?: levels.last()
    val nextLevel = levels.getOrNull(currentLevelIndex + 1)

    val lastLevelThreshold = levels.lastOrNull()?.threshold ?: 500000L
    val effectiveProgress = currentProgress % lastLevelThreshold

    val progressPercent = if (nextLevel != null) {
        val max = ((effectiveProgress - currentLevel.threshold).toFloat() / (nextLevel.threshold - currentLevel.threshold).toFloat() * 100f).coerceIn(0f, 100f)
        max
    } else {
        if (effectiveProgress >= currentLevel.threshold) 100f else 0f
    }

    LaunchedEffect(levels.size, showLevelPath) {
        if (showLevelPath) return@LaunchedEffect

        while (true) {
            delay(4000)
            activeIndex = (activeIndex + 1) % levels.size
        }
    }

    val displayPercent = when {
        activeIndex < currentLevelIndex -> 100f
        activeIndex == currentLevelIndex -> progressPercent
        else -> 0f
    }

    val isCurrentActiveLevel = activeIndex == currentLevelIndex
    val isLootGateLocked = false // Disabled as requested: isCurrentActiveLevel && canOpenGate && !isGateCompleted

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .width(56.dp)
                .height(50.dp)
                .shadow(8.dp, RoundedCornerShape(8.dp))
                .background(Brush.linearGradient(listOf(Color(0xE64A148C), Color(0xE6311B92))), RoundedCornerShape(8.dp))
                .clip(RoundedCornerShape(8.dp))
            .clickable {
                if (isLootGateLocked) {
                    onOpenGate()
                } else {
                    onShowStation()
                }
            }
    ) {
        AnimatedContent(
            targetState = activeIndex,
            transitionSpec = {
                slideInHorizontally(animationSpec = tween(300)) { it } + fadeIn() with slideOutHorizontally(animationSpec = tween(300)) { -it } + fadeOut()
            }
        ) { index ->
            val level = levels[index]
            val localRes = getLocalDrawableForLevel(level.id)
            Box(modifier = Modifier.fillMaxSize()) {
                if (level.image.isNotEmpty() || localRes != null) {
                    AsyncImage(
                        model = localRes ?: if (level.image.isNotEmpty()) {
                            if (level.image.startsWith("http")) level.image else "https://ummy.in${level.image}"
                        } else null,
                        contentDescription = level.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    
                    // Shine overlay (Premium feel)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(30.dp)
                            .align(Alignment.TopCenter)
                            .background(Color.White.copy(alpha = 0.08f))
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("🏠", fontSize = 24.sp, color = Color.White.copy(alpha = 0.2f))
                    }
                }

                Column(
                    modifier = Modifier.fillMaxSize().padding(4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = level.name.uppercase(),
                            color = Color.White,
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Black
                        )
                        if (index < currentLevelIndex) {
                            Text("✅", fontSize = 6.sp)
                        } else if (index > currentLevelIndex) {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(6.dp))
                        }
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth().offset(y = (-2).dp), // Nudged upwards inside the box
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .background(Color.White.copy(alpha = 0.2f), CircleShape)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(displayPercent / 100f)
                                    .background(Brush.horizontalGradient(listOf(Color(0xFFAB47BC), Color(0xFF7E57C2))), CircleShape)
                            )
                        }
                        Text(
                            text = "${displayPercent.toInt()}%",
                            color = Color(0xFFE1BEE7),
                            fontSize = 6.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }
            }
        }

        if (isLootGateLocked) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f)),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(Brush.linearGradient(listOf(Color(0xFFFFEB3B), Color(0xFFFF9800))), CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.5f), CircleShape)
                        .shadow(4.dp, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.LockOpen, contentDescription = "Unlock", tint = Color.Black, modifier = Modifier.size(18.dp))
                }
            }
        }
        
        // Missing closing brace for the main Box component
        }

        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier.width(56.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            levels.forEachIndexed { index, _ ->
                Box(
                    modifier = Modifier
                        .size(if (index == activeIndex) 4.dp else 2.5.dp)
                        .background(
                            if (index == activeIndex) Color.White else Color.White.copy(alpha = 0.4f),
                            CircleShape
                        )
                )
            }
        }
    }

    if (showLevelPath) {
        ModalBottomSheet(
            onDismissRequest = { showLevelPath = false },
            containerColor = Color(0xF31C011E),
        ) {
            Column(modifier = Modifier.padding(16.dp).padding(bottom = 32.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = currentLevel.name.uppercase(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(text = "Level ${currentLevelIndex + 1} of ${levels.size}", color = Color(0xFFCE93D8), fontSize = 12.sp)
                    }
                    if (canOpenGate && !isGateCompleted) {
                        Button(
                            onClick = onOpenGate,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF9800))
                        ) {
                            Icon(Icons.Default.LockOpen, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Open Gate", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                Box(modifier = Modifier.fillMaxWidth().background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp)).padding(12.dp)) {
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("$effectiveProgress coins", color = Color(0xFFCE93D8), fontSize = 12.sp)
                            Text(if (nextLevel != null) "${nextLevel.threshold} to ${nextLevel.name}" else "MAX", color = Color(0xFFCE93D8), fontSize = 12.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .background(Color.White.copy(alpha = 0.1f), CircleShape)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(progressPercent / 100f)
                                    .background(Brush.horizontalGradient(listOf(Color(0xFFAB47BC), Color(0xFF7E57C2))), CircleShape)
                            )
                        }
                    }
                }

                // Removed Scrollable Row for Levels for brevity
            }
        }
    }
}
