package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.data.model.TopSupporter
import coil.compose.AsyncImage

// ─────────────────────────────────────────────────────────────────────────────
// RoomTopSupportersDialog — mirrors RN room-top-supporters-dialog.tsx
// Top givers sheet with 3 tabs (Daily, Weekly, All Time), Top-3 Podium view,
// Rank 4+ list view, and supporter details popup modal.
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomTopSupportersDialog(
    visible: Boolean,
    supporters: List<TopSupporter> = emptyList(),
    onDismiss: () -> Unit
) {
    if (!visible) return

    var activeTab by remember { mutableStateOf("daily") } // "daily" | "weekly" | "total"
    var selectedSupporter by remember { mutableStateOf<TopSupporter?>(null) }
    var selectedRank by remember { mutableIntStateOf(0) }

    // Filter and sort according to activeTab
    val sortedSupporters = remember(supporters, activeTab) {
        val filtered = when (activeTab) {
            "daily" -> supporters.filter { it.dailyAmount > 0 }
            "weekly" -> supporters.filter { it.totalAmount > 0 } // use total/weekly
            else -> supporters.filter { it.totalAmount > 0 }
        }
        filtered.sortedByDescending {
            if (activeTab == "daily") it.dailyAmount else it.totalAmount
        }
    }

    val top1 = sortedSupporters.getOrNull(0)
    val top2 = sortedSupporters.getOrNull(1)
    val top3 = sortedSupporters.getOrNull(2)
    val restSupporters = if (sortedSupporters.size > 3) sortedSupporters.subList(3, sortedSupporters.size) else emptyList()

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
            // Header Section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF1A2540), Color(0xFF0F1929))
                        )
                    )
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFBBF24).copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("👑", fontSize = 28.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "ROOM SUPPORTERS",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Text(
                        "TOP GIVERS OF THE ROOM",
                        color = Color(0xFFFBBF24),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Tab Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TabPill(
                    label = "DAILY",
                    isSelected = activeTab == "daily",
                    onClick = { activeTab = "daily" },
                    modifier = Modifier.weight(1f)
                )
                TabPill(
                    label = "WEEKLY",
                    isSelected = activeTab == "weekly",
                    onClick = { activeTab = "weekly" },
                    modifier = Modifier.weight(1f)
                )
                TabPill(
                    label = "ALL TIME",
                    isSelected = activeTab == "total",
                    onClick = { activeTab = "total" },
                    modifier = Modifier.weight(1f)
                )
            }

            // Scrollable Podium & List
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 20.dp)
            ) {
                // Podium Item
                item {
                    PodiumView(
                        top1 = top1,
                        top2 = top2,
                        top3 = top3,
                        activeTab = activeTab,
                        onSupporterClick = { sup, rank ->
                            selectedSupporter = sup
                            selectedRank = rank
                        }
                    )
                    Spacer(Modifier.height(20.dp))
                }

                // Rank 4+ Items
                if (restSupporters.isNotEmpty()) {
                    itemsIndexed(restSupporters) { idx, supporter ->
                        val rank = idx + 4
                        val amount = if (activeTab == "daily") supporter.dailyAmount else supporter.totalAmount
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.03f))
                                .clickable {
                                    selectedSupporter = supporter
                                    selectedRank = rank
                                }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "#$rank",
                                color = Color.White.copy(alpha = 0.5f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.width(36.dp)
                            )

                            AsyncImage(
                                model = supporter.avatarUrl ?: "https://picsum.photos/200",
                                contentDescription = supporter.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                            )

                            Spacer(Modifier.width(12.dp))

                            Text(
                                supporter.name.ifBlank { "Supporter" },
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFFCA5A5).copy(alpha = 0.15f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("🪙 ", fontSize = 10.sp)
                                Text(
                                    formatCoins(amount),
                                    color = Color(0xFFFCA5A5),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                    }
                } else if (sortedSupporters.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No contributions found",
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Selected Supporter Details Dialog Popup
    selectedSupporter?.let { supporter ->
        Dialog(
            onDismissRequest = { selectedSupporter = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color(0xFF0F172A))
                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(24.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val crownColor = when (selectedRank) {
                        1 -> Color(0xFFFBBF24)
                        2 -> Color(0xFFCBD5E1)
                        else -> Color(0xFFD97706)
                    }

                    Text(
                        when (selectedRank) {
                            1 -> "👑 1st Rank Contributor"
                            2 -> "🥈 2nd Rank Contributor"
                            3 -> "🥉 3rd Rank Contributor"
                            else -> "#$selectedRank Contributor"
                        },
                        color = crownColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black
                    )

                    Spacer(Modifier.height(16.dp))

                    AsyncImage(
                        model = supporter.avatarUrl ?: "https://picsum.photos/200",
                        contentDescription = supporter.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .border(3.dp, crownColor, CircleShape)
                    )

                    Spacer(Modifier.height(12.dp))

                    Text(
                        supporter.name.ifBlank { "User" },
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black
                    )

                    Spacer(Modifier.height(16.dp))

                    // Stats Grid
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("TODAY", color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(formatCoins(supporter.dailyAmount), color = Color(0xFFFBBF24), fontSize = 14.sp, fontWeight = FontWeight.Black)
                        }
                        Box(modifier = Modifier.width(1.dp).height(30.dp).background(Color.White.copy(alpha = 0.1f)))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("ALL TIME", color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text(formatCoins(supporter.totalAmount), color = Color(0xFF38BDF8), fontSize = 14.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    Button(
                        onClick = { selectedSupporter = null },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Close", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun PodiumView(
    top1: TopSupporter?,
    top2: TopSupporter?,
    top3: TopSupporter?,
    activeTab: String,
    onSupporterClick: (TopSupporter, Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 10.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.Bottom
    ) {
        // 2nd Place (Left)
        PodiumSpot(
            supporter = top2,
            rank = 2,
            crownColor = Color(0xFFCBD5E1),
            avatarSize = 56,
            activeTab = activeTab,
            onClick = { top2?.let { onSupporterClick(it, 2) } }
        )

        // 1st Place (Center, Raised)
        PodiumSpot(
            supporter = top1,
            rank = 1,
            crownColor = Color(0xFFFBBF24),
            avatarSize = 68,
            activeTab = activeTab,
            modifier = Modifier.offset(y = (-16).dp),
            onClick = { top1?.let { onSupporterClick(it, 1) } }
        )

        // 3rd Place (Right)
        PodiumSpot(
            supporter = top3,
            rank = 3,
            crownColor = Color(0xFFD97706),
            avatarSize = 56,
            activeTab = activeTab,
            onClick = { top3?.let { onSupporterClick(it, 3) } }
        )
    }
}

@Composable
private fun PodiumSpot(
    supporter: TopSupporter?,
    rank: Int,
    crownColor: Color,
    avatarSize: Int,
    activeTab: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier.clickable(enabled = supporter != null, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (supporter != null) {
            Text(if (rank == 1) "👑" else if (rank == 2) "🥈" else "🥉", fontSize = 16.sp)
            Spacer(Modifier.height(2.dp))

            Box(contentAlignment = Alignment.BottomCenter) {
                AsyncImage(
                    model = supporter.avatarUrl ?: "https://picsum.photos/200",
                    contentDescription = supporter.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(avatarSize.dp)
                        .clip(CircleShape)
                        .border(2.5.dp, crownColor, CircleShape)
                )
                Box(
                    modifier = Modifier
                        .offset(y = 8.dp)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(crownColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text("$rank", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }

            Spacer(Modifier.height(12.dp))

            Text(
                supporter.name.ifBlank { "User" },
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            val amount = if (activeTab == "daily") supporter.dailyAmount else supporter.totalAmount
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🪙 ", fontSize = 8.sp)
                Text(
                    formatCoins(amount),
                    color = crownColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .size(avatarSize.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f)),
                contentAlignment = Alignment.Center
            ) {
                Text("$rank", color = Color.White.copy(alpha = 0.3f), fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun TabPill(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) Color(0xFF1E3A5F) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (isSelected) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.5f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Black
        )
    }
}

private fun formatCoins(amount: Long): String {
    return when {
        amount >= 1_000_000 -> "${"%.1f".format(amount / 1_000_000f)}M"
        amount >= 1_000 -> "${"%.1f".format(amount / 1_000f)}K"
        else -> amount.toString()
    }
}
