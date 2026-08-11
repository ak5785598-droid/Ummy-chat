package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.data.model.TopSupporter
import app.vercel.ummy_chat.twa.ui.home.GoldenCoin
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import java.util.Calendar
import java.util.Locale

// ─────────────────────────────────────────────────────────────────────────────
// RoomTopSupportersDialog — mirrors RN room-top-supporters-dialog.tsx
// Top givers sheet with 3 tabs (Daily, Weekly, All Time), Top-3 Podium view,
// Rank 4+ list view, and supporter details popup modal.
// ─────────────────────────────────────────────────────────────────────────────

// RN L224: >= 1M ? (x/1e6).toFixed(1)+'M' : toLocaleString()
private fun formatCoins(amount: Long): String {
    return if (amount >= 1_000_000) {
        String.format(Locale.US, "%.1f", amount / 1_000_000.0).replace(",", ".") + "M"
    } else {
        String.format(Locale.US, "%,d", amount)
    }
}

private fun tsIsToday(millis: Long): Boolean {
    val d1 = Calendar.getInstance().apply { timeInMillis = millis }
    val d2 = Calendar.getInstance()
    return d1.get(Calendar.YEAR) == d2.get(Calendar.YEAR) &&
            d1.get(Calendar.MONTH) == d2.get(Calendar.MONTH) &&
            d1.get(Calendar.DAY_OF_MONTH) == d2.get(Calendar.DAY_OF_MONTH)
}

private fun tsIsThisWeek(millis: Long): Boolean {
    val d1 = Calendar.getInstance().apply { timeInMillis = millis }
    val d2 = Calendar.getInstance()
    val getWeek: (Calendar) -> Int = { d ->
        val oneJan = Calendar.getInstance().apply { clear(); set(d.get(Calendar.YEAR), 0, 1) }
        val daysSinceJan1 = ((d.timeInMillis - oneJan.timeInMillis) / 86400000).toDouble()
        val jan1DayOfWeek0 = oneJan.get(Calendar.DAY_OF_WEEK) - 1
        Math.ceil((daysSinceJan1 + jan1DayOfWeek0 + 1) / 7.0).toInt()
    }
    return d1.get(Calendar.YEAR) == d2.get(Calendar.YEAR) && getWeek(d1) == getWeek(d2)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomTopSupportersDialog(
    visible: Boolean,
    supporters: List<TopSupporter> = emptyList(),
    onDismiss: () -> Unit
) {
    if (!visible) return

    var activeTab by remember { mutableStateOf("daily") }
    var selectedSupporter by remember { mutableStateOf<TopSupporter?>(null) }
    var selectedRank by remember { mutableIntStateOf(0) }

    val firestore = remember { FirebaseFirestore.getInstance() }
    val liveProfiles = remember(supporters) { mutableStateMapOf<String, Pair<String?, String?>>() }

    LaunchedEffect(supporters) {
        supporters.forEach { s ->
            if (s.uid.isNotBlank() && !liveProfiles.containsKey(s.uid)) {
                val uid = s.uid
                firestore.collection("users").document(uid).get()
                    .addOnSuccessListener { doc ->
                        if (doc.exists()) {
                            liveProfiles[uid] =
                                (doc.getString("username") ?: doc.getString("name")) to doc.getString("avatarUrl")
                        }
                    }
            }
        }
    }

    val usernameOf: (TopSupporter) -> String = { s ->
        liveProfiles[s.uid]?.first?.takeIf { it.isNotBlank() } ?: s.name.ifBlank { "User" }
    }
    val avatarOf: (TopSupporter) -> String? = { s ->
        liveProfiles[s.uid]?.second ?: s.avatarUrl
    }

    // RN L121-140: getSortedSupporters — exact RN match
    val sorted = remember(supporters, activeTab) {
        supporters
            .map { s ->
                val millis = s.updatedAt?.toDate()?.time ?: System.currentTimeMillis()
                val display = when (activeTab) {
                    "daily" -> if (tsIsToday(millis)) (s.dailyAmount.takeIf { it > 0 } ?: s.amount) else 0L
                    "weekly" -> if (tsIsThisWeek(millis)) (s.weeklyAmount.takeIf { it > 0 } ?: s.amount) else 0L
                    else -> s.amount.takeIf { it > 0 } ?: s.totalAmount.takeIf { it > 0 } ?: s.dailyAmount
                }
                s to display
            }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }
    }

    val top1 = sorted.getOrNull(0)
    val top2 = sorted.getOrNull(1)
    val top3 = sorted.getOrNull(2)
    val rest = sorted.drop(3)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F1929),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
        ) {
            // Header — RN L166-178
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(Color(0xFF1A2540), Color(0xFF0F1929))))
                    .padding(top = 28.dp, bottom = 20.dp, start = 16.dp, end = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(32.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White.copy(alpha = 0.1f))
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFBBF24).copy(alpha = 0.15f))
                            .border(1.dp, Color(0xFFFBBF24).copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painterResource(R.drawable.ic_crown),
                            contentDescription = null,
                            tint = Color(0xFFFBBF24),
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(
                        "ROOM SUPPORTERS",
                        color = Color(0xFFFBBF24),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                    Text(
                        "TOP GIVERS OF THE ROOM",
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            // Tabs — RN L181-196
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(top = 16.dp, bottom = 8.dp)
                    .clip(RoundedCornerShape(30.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .padding(4.dp)
            ) {
                listOf("daily", "weekly", "total").forEach { tab ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(24.dp))
                            .background(if (activeTab == tab) Color(0xFF1E3A5F) else Color.Transparent)
                            .clickable { activeTab = tab }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (tab == "total") "ALL TIME" else tab.uppercase(Locale.US),
                            color = if (activeTab == tab) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.4f),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                if (sorted.isNotEmpty()) {
                    item {
                        PodiumRow(
                            top1 = top1,
                            top2 = top2,
                            top3 = top3,
                            usernameOf = usernameOf,
                            avatarOf = avatarOf,
                            onSupporterClick = { sup, rank ->
                                selectedSupporter = sup
                                selectedRank = rank
                            }
                        )
                    }

                    items(rest.size) { idx ->
                        val pair = rest[idx]
                        val rank = idx + 4
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                                .clickable {
                                    selectedSupporter = pair.first
                                    selectedRank = rank
                                }
                                .padding(horizontal = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "$rank",
                                color = Color.White.copy(alpha = 0.3f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.width(32.dp)
                            )
                            AsyncImage(
                                model = avatarOf(pair.first) ?: "https://picsum.photos/100",
                                contentDescription = usernameOf(pair.first),
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                usernameOf(pair.first),
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.weight(1f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color.White.copy(alpha = 0.05f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                GoldenCoin(size = 10.dp)
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    formatCoins(pair.second),
                                    color = Color(0xFFFCA5A5),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                        HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                    }
                } else {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 80.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No contributions found",
                                color = Color.White.copy(alpha = 0.3f),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }

    // Supporter Profile Popup — RN L57-114
    selectedSupporter?.let { supporter ->
        Dialog(
            onDismissRequest = { selectedSupporter = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            val cfg = when (selectedRank) {
                1 -> Triple(Color(0xFFFBBF24), Color(0xFFD97706), Color(0xFFFBBF24))
                2 -> Triple(Color(0xFFCBD5E1), Color(0xFF94A3B8), Color(0xFFCBD5E1))
                3 -> Triple(Color(0xFFD97706), Color(0xFF92400E), Color(0xFFD97706))
                else -> Triple(Color(0xFF475569), Color(0xFF334155), Color(0xFF94A3B8))
            }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.75f))
                    .clickable { selectedSupporter = null },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color(0xFF0F172A))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Brush.verticalGradient(listOf(Color(0xFF1E293B), Color(0xFF0F172A))))
                            .padding(top = 32.dp, bottom = 24.dp, start = 24.dp, end = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (selectedRank <= 3) {
                            Icon(
                                painterResource(R.drawable.ic_crown),
                                contentDescription = null,
                                tint = cfg.third,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                        Box(modifier = Modifier.border(3.dp, cfg.first, CircleShape)) {
                            AsyncImage(
                                model = avatarOf(supporter) ?: "https://picsum.photos/100",
                                contentDescription = usernameOf(supporter),
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(CircleShape)
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(
                            usernameOf(supporter),
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Box(
                            modifier = Modifier
                                .background(cfg.second, RoundedCornerShape(20.dp))
                                .padding(horizontal = 10.dp, vertical = 2.dp)
                        ) {
                            Text(
                                "#$selectedRank Contributor",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(width = 1.dp, color = Color.White.copy(alpha = 0.1f))
                    ) {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .border(width = 1.dp, color = Color.White.copy(alpha = 0.1f))
                                .padding(vertical = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                String.format(Locale.US, "%,d", supporter.dailyAmount),
                                color = Color(0xFFFBBF24),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                            )
                            Text(
                                "TODAY",
                                color = Color(0xFF475569),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .padding(vertical = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                String.format(Locale.US, "%,d", supporter.weeklyAmount),
                                color = Color(0xFF22D3EE),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                            )
                            Text(
                                "THIS WEEK",
                                color = Color(0xFF475569),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                            .clickable { selectedSupporter = null }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Close",
                            color = Color(0xFF94A3B8),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Podium — RN L200-295 (2nd left, 1st center raised, 3rd right)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun PodiumRow(
    top1: Pair<TopSupporter, Long>?,
    top2: Pair<TopSupporter, Long>?,
    top3: Pair<TopSupporter, Long>?,
    usernameOf: (TopSupporter) -> String,
    avatarOf: (TopSupporter) -> String?,
    onSupporterClick: (TopSupporter, Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 24.dp, bottom = 32.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.Bottom
    ) {
        PodiumSpot(
            pair = top2,
            rank = 2,
            crownSize = 18,
            avatarSize = 56,
            borderWidth = 2.5.dp,
            avatarRadius = 30.dp,
            borderColor = Color(0xFF94A3B8),
            crownColor = Color(0xFFCBD5E1),
            nameColor = Color(0xFFCBD5E1),
            amountColor = Color(0xFF94A3B8),
            pillBg = Color.White.copy(alpha = 0.05f),
            nameFontSize = 11,
            amountFontSize = 10,
            usernameOf = usernameOf,
            avatarOf = avatarOf,
            onClick = { top2?.let { onSupporterClick(it.first, 2) } },
            modifier = Modifier.weight(1f)
        )
        PodiumSpot(
            pair = top1,
            rank = 1,
            crownSize = 22,
            avatarSize = 68,
            borderWidth = 3.dp,
            avatarRadius = 34.dp,
            borderColor = Color(0xFFFBBF24),
            crownColor = Color(0xFFFBBF24),
            nameColor = Color(0xFFFBBF24),
            amountColor = Color(0xFFFBBF24),
            pillBg = Color(0xFFFBBF24).copy(alpha = 0.1f),
            nameFontSize = 12,
            amountFontSize = 11,
            usernameOf = usernameOf,
            avatarOf = avatarOf,
            modifier = Modifier
                .weight(1f)
                .offset(y = (-12).dp),
            showGlow = true,
            badgeSize = 22,
            onClick = { top1?.let { onSupporterClick(it.first, 1) } }
        )
        PodiumSpot(
            pair = top3,
            rank = 3,
            crownSize = 18,
            avatarSize = 56,
            borderWidth = 2.5.dp,
            avatarRadius = 28.dp,
            borderColor = Color(0xFFD97706),
            crownColor = Color(0xFFD97706),
            nameColor = Color(0xFFD97706),
            amountColor = Color(0xFFD97706),
            pillBg = Color(0xFFD97706).copy(alpha = 0.1f),
            nameFontSize = 11,
            amountFontSize = 10,
            usernameOf = usernameOf,
            avatarOf = avatarOf,
            onClick = { top3?.let { onSupporterClick(it.first, 3) } },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun PodiumSpot(
    pair: Pair<TopSupporter, Long>?,
    rank: Int,
    crownSize: Int,
    avatarSize: Int,
    borderWidth: Dp,
    avatarRadius: Dp,
    borderColor: Color,
    crownColor: Color,
    nameColor: Color,
    amountColor: Color,
    pillBg: Color,
    nameFontSize: Int,
    amountFontSize: Int,
    usernameOf: (TopSupporter) -> String,
    avatarOf: (TopSupporter) -> String?,
    modifier: Modifier = Modifier,
    showGlow: Boolean = false,
    badgeSize: Int = 20,
    onClick: () -> Unit
) {
    val supporter = pair?.first
    Column(
        modifier = modifier
            .clickable(enabled = supporter != null, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom
    ) {
        if (supporter != null) {
            Icon(
                painterResource(R.drawable.ic_crown),
                contentDescription = null,
                tint = crownColor,
                modifier = Modifier
                    .size(crownSize.dp)
                    .padding(bottom = 4.dp)
            )
            Spacer(Modifier.height(4.dp))

            Box(contentAlignment = Alignment.Center) {
                if (showGlow) {
                    Box(
                        modifier = Modifier
                            .size((avatarSize + 12).dp)
                            .border(2.dp, Color(0xFFFBBF24).copy(alpha = 0.3f), CircleShape)
                    )
                }
                Box(
                    modifier = Modifier
                        .border(borderWidth, borderColor, CircleShape)
                        .padding(2.dp)
                ) {
                    AsyncImage(
                        model = avatarOf(supporter) ?: "https://picsum.photos/100",
                        contentDescription = usernameOf(supporter),
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(avatarSize.dp)
                            .clip(RoundedCornerShape(avatarRadius))
                    )
                }
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = 4.dp, y = 4.dp)
                        .size(badgeSize.dp)
                        .clip(CircleShape)
                        .background(borderColor)
                        .border(1.5.dp, Color(0xFF0F1929), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "$rank",
                        color = Color(0xFF0F172A),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            Spacer(Modifier.height(10.dp))
            Text(
                usernameOf(supporter),
                color = nameColor,
                fontSize = nameFontSize.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )
            Row(
                modifier = Modifier
                    .padding(top = 3.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(pillBg)
                    .padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                GoldenCoin(size = 10.dp)
                Spacer(Modifier.width(3.dp))
                Text(
                    formatCoins(pair?.second ?: 0L),
                    color = amountColor,
                    fontSize = amountFontSize.sp,
                    fontWeight = FontWeight.Black
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .size(avatarSize.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(2.dp, Color.White.copy(alpha = 0.1f), CircleShape)
            )
        }
    }
}