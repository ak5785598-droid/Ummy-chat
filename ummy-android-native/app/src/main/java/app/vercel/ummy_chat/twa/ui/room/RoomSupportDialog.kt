package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class SupportPartner(
    val uid: String = "",
    val name: String = "",
    val avatarUrl: String? = null
)

private data class GoalReward(
    val level: Int,
    val visitors: String,
    val roomCoins: String,
    val totalCoins: String,
    val hostCoins: String,
    val partnerCoins: String,
    val partners: Int
)

private val GOALS_REWARDS = listOf(
    GoalReward(17, "≥130", "2600M", "250,960,000", "152,200,000", "8,230,000", 13),
    GoalReward(16, "≥120", "1900M", "187,150,000", "100,750,000", "7,200,000", 12),
    GoalReward(15, "≥110", "1300M", "131,580,000", "77,350,000", "4,930,000", 11),
    GoalReward(14, "≥100", "800M", "82,250,000", "45,250,000", "3,700,000", 10),
    GoalReward(13, "≥90", "600M", "61,670,000", "33,950,000", "3,080,000", 9),
    GoalReward(12, "≥70", "400M", "41,160,000", "21,400,000", "2,470,000", 8),
    GoalReward(11, "≥50", "300M", "19,750,000", "17,900,000", "1,850,000", 7),
    GoalReward(10, "≥45", "200M", "20,530,000", "13,150,000", "1,230,000", 6),
    GoalReward(9, "≥40", "150M", "15,650,000", "10,300,000", "1,070,000", 5),
    GoalReward(8, "≥35", "100M", "12,500,000", "9,200,000", "550,000", 5),
    GoalReward(7, "≥30", "75M", "9,543,750", "7,012,500", "506,250", 5),
    GoalReward(6, "≥25", "50M", "6,750,000", "4,750,000", "400,000", 5),
    GoalReward(5, "≥20", "22.5M", "3,225,000", "2,325,000", "225,000", 4),
    GoalReward(4, "≥15", "15M", "2,200,000", "1,600,000", "200,000", 3),
    GoalReward(3, "≥10", "10M", "1,488,350", "1,353,350", "135,000", 3),
    GoalReward(2, "≥5", "5M", "600,000", "450,000", "150,000", 1),
    GoalReward(1, "≥2", "2.5M", "350,000", "275,000", "75,000", 1)
)

@Composable
fun RoomSupportDialog(
    visible: Boolean,
    roomId: String,
    isOwner: Boolean = false,
    roomStats: Map<String, Any>? = null,
    visitorCount: Long = 0,
    uniqueVisitorCount: Long = 0,
    levelPoints: Long = 0,
    partners: List<SupportPartner> = emptyList(),
    participants: List<SupportPartner> = emptyList(),
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var showPartnerPicker by remember { mutableStateOf(false) }
    var countdownText by remember { mutableStateOf("00h : 00m : 00s") }

    // Logic
    val roomCoins = (roomStats?.get("weeklyGifts") as? Number)?.toLong() ?: (roomStats?.get("dailyGifts") as? Number)?.toLong() ?: 0L
    val lastWeekGifts = (roomStats?.get("lastWeekGifts") as? Number)?.toLong() ?: 0L
    val lastWeekLevel = (roomStats?.get("lastWeekLevel") as? Number)?.toInt() ?: 0
    val lastWeekVisitors = (roomStats?.get("lastWeekVisitors") as? Number)?.toLong() ?: 0L
    val lastWeekRewardsDistributed = roomStats?.get("lastWeekRewardsDistributed") as? Boolean ?: false

    val currentGoal = GOALS_REWARDS.reversed().find { g ->
        val targetCoins = g.roomCoins.replace("M", "").toFloatOrNull()?.times(1000000) ?: 0f
        roomCoins >= targetCoins
    } ?: if (roomCoins > 0) GOALS_REWARDS.last() else GoalReward(0, "0", "0", "0", "0", "0", 0)

    val roomLevel = currentGoal.level

    LaunchedEffect(Unit) {
        while (true) {
            val now = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
            val target = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
            target.set(java.util.Calendar.DAY_OF_WEEK, java.util.Calendar.WEDNESDAY)
            target.set(java.util.Calendar.HOUR_OF_DAY, 0)
            target.set(java.util.Calendar.MINUTE, 0)
            target.set(java.util.Calendar.SECOND, 0)
            if (target.before(now)) target.add(java.util.Calendar.WEEK_OF_YEAR, 1)

            val diff = target.timeInMillis - now.timeInMillis
            val hrs = diff / (1000 * 60 * 60)
            val mins = (diff % (1000 * 60 * 60)) / (1000 * 60)
            val secs = (diff % (1000 * 60)) / 1000
            countdownText = "%02dh : %02dm : %02ds".format(hrs, mins, secs)
            delay(1000)
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0A0F1D))
        ) {
            // Header Image
            AsyncImage(
                model = CdnUtils.toCdn("https://ummy-chat.vercel.app/images/haza_style_room_support_lions_trophy_header_1776810688232.png"),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp),
                contentScale = ContentScale.Crop
            )
            // Gradient Overlay
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFF0A0F1D).copy(alpha = 0.2f),
                                Color(0xFF0A0F1D).copy(alpha = 0.5f),
                                Color(0xFF0A0F1D)
                            )
                        )
                    )
            )

            // Close Button
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .padding(top = 20.dp, start = 20.dp)
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.4f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
            ) {
                Icon(Icons.Default.Close, null, tint = Color.White, modifier = Modifier.size(20.dp))
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 120.dp, bottom = 40.dp, start = 16.dp, end = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Title Section
                item {
                    Spacer(Modifier.height(32.dp))
                    Box(modifier = Modifier.padding(bottom = 64.dp), contentAlignment = Alignment.Center) {
                        Box(
                            modifier = Modifier
                                .size(200.dp, 60.dp)
                                .background(Color(0xFF3B82F6).copy(alpha = 0.2f), CircleShape)
                        )
                        Text(
                            "ROOM SUPPORT",
                            color = Color.White,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp
                        )
                    }
                }

                // My Room Section
                item {
                    SectionHeader("My Room", Color(0xFF3B82F6))
                    
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 32.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF121B2D).copy(alpha = 0.8f))
                            .border(1.dp, Color(0xFF3B82F6).copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                    ) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF1E3A8A).copy(alpha = 0.4f))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("PERIOD", color = Color(0xFF93C5FD).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                            Text("LEVEL", color = Color(0xFF93C5FD).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(48.dp), textAlign = TextAlign.Center)
                            Text("REWARDS", color = Color(0xFF93C5FD).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text("VISITORS", color = Color(0xFF93C5FD).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text("COINS", color = Color(0xFF93C5FD).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
                        }

                        // This Week
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF3B82F6).copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.05f))
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("This Week", color = Color(0xFF60A5FA), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            Text("$roomLevel", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(48.dp), textAlign = TextAlign.Center)
                            Text(if (roomLevel > 0) "🎁" else "0", color = Color(0xFFFACC15), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text("$uniqueVisitorCount", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text(String.format("%,d", roomCoins), color = Color(0xFF22D3EE), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
                        }

                        // Last Week
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Last Week", color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            Text("$lastWeekLevel", color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(48.dp), textAlign = TextAlign.Center)
                            Text(if (lastWeekRewardsDistributed) "✅" else if (lastWeekLevel > 0) "⏳" else "--", color = Color(0xFFFACC15).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text("$lastWeekVisitors", color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(64.dp), textAlign = TextAlign.Center)
                            Text(if (lastWeekGifts > 0) String.format("%,d", lastWeekGifts) else "0", color = Color(0xFF22D3EE).copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
                        }

                        // Footer Note
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF172554).copy(alpha = 0.4f))
                                .border(1.dp, Color.White.copy(alpha = 0.05f))
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                if (lastWeekLevel > 0 && !lastWeekRewardsDistributed)
                                    "Last week Level $lastWeekLevel — rewards pending (Wed 00:30 IST)"
                                else if (lastWeekRewardsDistributed && lastWeekLevel > 0)
                                    "Last week Level $lastWeekLevel — rewards delivered ✅"
                                else
                                    "This week's rewards will be delivered next Wednesday (IST)",
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                // Partners Section
                item {
                    SectionHeader("Partners", Color(0xFF06B6D4))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFF121B2D).copy(alpha = 0.8f))
                            .border(1.dp, Color(0xFF06B6D4).copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                                .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape)
                                .padding(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Text("ADD TIME:", color = Color.White.copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(6.dp))
                            Text(countdownText, color = Color(0xFF22D3EE), fontSize = 11.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Partners can be added from Monday 00:00 to Tuesday 24:00 (UTC+0).",
                            color = Color.White.copy(alpha = 0.4f),
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)
                        ) {
                            for (i in 0..2) {
                                val partner = partners.getOrNull(i)
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White.copy(alpha = 0.05f))
                                        .border(
                                            1.dp, 
                                            Color.White.copy(alpha = 0.1f), 
                                            RoundedCornerShape(16.dp)
                                        )
                                        .clickable(enabled = isOwner) {
                                            if (partner != null) {
                                                scope.launch {
                                                    try {
                                                        Firebase.firestore.collection("chatRooms").document(roomId)
                                                            .update("partners", FieldValue.arrayRemove(
                                                                mapOf(
                                                                    "uid" to partner.uid,
                                                                    "name" to partner.name,
                                                                    "avatarUrl" to partner.avatarUrl
                                                                )
                                                            )).await()
                                                    } catch (_: Exception) {}
                                                }
                                            } else {
                                                showPartnerPicker = true
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (partner != null) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            AsyncImage(
                                                model = CdnUtils.toCdn(partner.avatarUrl),
                                                contentDescription = null,
                                                modifier = Modifier
                                                    .size(48.dp)
                                                    .clip(CircleShape)
                                                    .border(1.dp, Color(0xFF06B6D4).copy(alpha = 0.3f), CircleShape),
                                                contentScale = ContentScale.Crop
                                            )
                                            Spacer(Modifier.height(4.dp))
                                            Text(
                                                partner.name,
                                                color = Color.White,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1
                                            )
                                        }
                                    } else {
                                        Icon(Icons.Default.Add, null, tint = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(24.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                // Goals & Rewards Section
                item {
                    SectionHeader("Goals & Rewards", Color(0xFFD97706))
                    
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF121B2D).copy(alpha = 0.9f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    ) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF1A253A))
                                .border(1.dp, Color.White.copy(alpha = 0.05f))
                                .padding(vertical = 4.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Lvl", color = Color.White.copy(alpha = 0.4f), fontSize = 8.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(35.dp), textAlign = TextAlign.Center)
                            Text("Goals (Visitors / Coins)", color = Color.White.copy(alpha = 0.4f), fontSize = 8.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                            Text("Rewards (Total / Host / Partner / PtrQty)", color = Color.White.copy(alpha = 0.4f), fontSize = 8.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(2f), textAlign = TextAlign.Center)
                        }

                        GOALS_REWARDS.forEachIndexed { idx, goal ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (idx % 2 == 0) Color.White.copy(alpha = 0.02f) else Color.Transparent)
                                    .border(1.dp, Color.White.copy(alpha = 0.05f))
                                    .padding(vertical = 8.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("${goal.level}", color = Color(0xFF60A5FA), fontSize = 9.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(35.dp), textAlign = TextAlign.Center)
                                
                                Row(
                                    modifier = Modifier.weight(1f),
                                    horizontalArrangement = Arrangement.SpaceAround
                                ) {
                                    Text(goal.visitors, color = Color.White.copy(alpha = 0.8f), fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                                    Text(goal.roomCoins, color = Color(0xFF22D3EE), fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                                }

                                Row(
                                    modifier = Modifier.weight(2f).padding(start = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceAround
                                ) {
                                    Text(goal.totalCoins, color = Color.White.copy(alpha = 0.7f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    Text(goal.hostCoins, color = Color(0xFFFACC15), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    Text(goal.partnerCoins, color = Color(0xFF93C5FD), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    Text("${goal.partners}", color = Color.White.copy(alpha = 0.6f), fontSize = 8.5.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }
                }

                // Note Section
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black.copy(alpha = 0.2f))
                            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
                            .padding(20.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                            Icon(Icons.Default.Info, null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("NOTE", color = Color.White.copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        }
                        Text("1. Weekly room visits and coin statistics are counted from Monday 00:00 to Sunday 23:59 (UTC+0).", color = Color.White.copy(alpha = 0.4f), fontSize = 9.5.sp, lineHeight = 14.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("2. Room owners must submit the partner information before Wednesday; otherwise, the reward will be forfeited.", color = Color.White.copy(alpha = 0.4f), fontSize = 9.5.sp, lineHeight = 14.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("3. The official team will send the reward to the room owner and partner on Wednesday.", color = Color.White.copy(alpha = 0.4f), fontSize = 9.5.sp, lineHeight = 14.sp)
                    }
                }
            }
        }
    }

    if (showPartnerPicker) {
        Dialog(onDismissRequest = { showPartnerPicker = false }) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF121B2D))
                    .border(1.dp, Color(0xFF06B6D4).copy(alpha = 0.3f), RoundedCornerShape(24.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("SELECT PARTNER", color = Color(0xFFCFFAFE), fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        IconButton(onClick = { showPartnerPicker = false }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, null, tint = Color(0xFF22D3EE), modifier = Modifier.size(18.dp))
                        }
                    }

                    LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                        if (participants.isEmpty()) {
                            item {
                                Text("No active participants in the room", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp), textAlign = TextAlign.Center)
                            }
                        } else {
                            itemsIndexed(participants) { _, item ->
                                val isAlreadyPartner = partners.any { it.uid == item.uid }
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (isAlreadyPartner) Color.White.copy(alpha = 0.02f) else Color.White.copy(alpha = 0.05f))
                                        .clickable(enabled = !isAlreadyPartner) {
                                            if (partners.size >= 3) return@clickable
                                            scope.launch {
                                                try {
                                                    Firebase.firestore.collection("chatRooms").document(roomId)
                                                        .update("partners", FieldValue.arrayUnion(
                                                            mapOf("uid" to item.uid, "name" to item.name, "avatarUrl" to item.avatarUrl)
                                                        )).await()
                                                } catch (_: Exception) {}
                                            }
                                            showPartnerPicker = false
                                        }
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(item.avatarUrl),
                                        contentDescription = null,
                                        modifier = Modifier.size(32.dp).clip(CircleShape).border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(item.name, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        if (isAlreadyPartner) {
                                            Text("Already Partner", color = Color(0xFF22D3EE), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, color: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(Color.Transparent, color.copy(alpha = 0.4f), Color.Transparent)
                    )
                )
                .border(1.dp, color.copy(alpha = 0.3f))
                .padding(horizontal = 24.dp, vertical = 6.dp)
        ) {
            Text(
                title.uppercase(),
                color = color.copy(alpha = 0.9f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
        }
    }
}
