package app.vercel.ummy_chat.twa.ui.room.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.LootReward
import app.vercel.ummy_chat.twa.data.model.LootingItem
import app.vercel.ummy_chat.twa.data.model.LootConstants
import kotlinx.coroutines.delay
import java.util.UUID

@Composable
fun LootingRoom(
    active: Boolean,
    rewards: List<LootReward> = LootConstants.DEFAULT_LOOT_REWARDS,
    onCollect: (LootingItem) -> Unit,
    onClose: () -> Unit
) {
    if (!active) return

    var lootItems by remember { mutableStateOf<List<LootingItem>>(emptyList()) }
    var timeRemaining by remember { mutableStateOf(15) }

    LaunchedEffect(active) {
        if (active && lootItems.isEmpty()) {
            val items = mutableListOf<LootingItem>()
            val count = (rewards.size * 3).coerceAtMost(20)
            for (i in 0 until count) {
                val reward = rewards.random()
                items.add(
                    LootingItem(
                        id = UUID.randomUUID().toString(),
                        reward = reward,
                        x = 10f + (Math.random() * 80).toFloat(),
                        y = 10f + (Math.random() * 80).toFloat(),
                        collected = false
                    )
                )
            }
            lootItems = items
            timeRemaining = 15
        }
    }

    LaunchedEffect(timeRemaining) {
        if (timeRemaining > 0) {
            delay(1000)
            timeRemaining -= 1
        } else {
            delay(1000)
            onClose()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f))
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .padding(top = 40.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text("Time Left: ${timeRemaining}s", color = Color.White, fontWeight = FontWeight.Bold)
            }
            
            IconButton(
                onClick = onClose,
                modifier = Modifier.background(Color.White.copy(alpha = 0.1f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }
        }

        // Loot Items
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val maxWidth = maxWidth.value
            val maxHeight = maxHeight.value

            lootItems.forEach { item ->
                AnimatedVisibility(
                    visible = !item.collected,
                    enter = scaleIn(animationSpec = tween(500)),
                    exit = scaleOut(animationSpec = tween(300)) + fadeOut(),
                    modifier = Modifier.offset(
                        x = (maxWidth * (item.x / 100f)).dp,
                        y = (maxHeight * (item.y / 100f)).dp
                    )
                ) {
                    LootItemNode(item = item) {
                        // Mark as collected
                        val updated = lootItems.map { if (it.id == item.id) it.copy(collected = true) else it }
                        lootItems = updated
                        onCollect(item)
                    }
                }
            }
        }
    }
}

@Composable
fun LootItemNode(item: LootingItem, onClick: () -> Unit) {
    val (bgColor, borderColor) = when (item.reward.rarity) {
        "common" -> Pair(Color(0xE637474F), Color(0x8090A4AE))
        "rare" -> Pair(Color(0xE60D47A1), Color(0x8064B5F6))
        "epic" -> Pair(Color(0xE64A148C), Color(0x80BA68C8))
        "legendary" -> Pair(Color(0xE6F57F17), Color(0x80FFD54F))
        else -> Pair(Color(0xE637474F), Color(0x8090A4AE))
    }

    Box(
        modifier = Modifier
            .size(60.dp)
            .shadow(8.dp, CircleShape)
            .background(bgColor, CircleShape)
            .border(2.dp, borderColor, CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = if (item.reward.type == "coins") Icons.Default.MonetizationOn else Icons.Default.Star,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
            if (item.reward.type == "coins") {
                Text(
                    text = "${item.reward.value}",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
