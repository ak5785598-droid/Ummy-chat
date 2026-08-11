package app.vercel.ummy_chat.twa.ui.leaderboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage

@Composable
fun LeaderboardScreen(
    onBack: () -> Unit,
    onOpenProfile: (id: String) -> Unit,
    onOpenRoom: (id: String) -> Unit,
    viewModel: LeaderboardViewModel = viewModel()
) {
    val activeCategory by viewModel.activeCategory.collectAsState()
    val timeFilter by viewModel.timeFilter.collectAsState()
    val entries by viewModel.entries.collectAsState()
    val activeTheme by viewModel.activeTheme.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    var showInfo by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF1E0E14))) {
        // Background layer
        if (activeTheme?.backgroundUrl != null) {
            AsyncImage(
                model = activeTheme?.backgroundUrl,
                contentDescription = "Theme Background",
                modifier = Modifier.fillMaxSize().graphicsLayer(scaleX = 1.05f, scaleY = 1.05f).offset(y = (-70).dp),
                contentScale = ContentScale.Crop,
                alignment = Alignment.TopCenter
            )
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)))
        } else {
            DynamicThemeBackground()
        }

        LeaderboardAnimOverlay()

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            Header(
                activeCategory = activeCategory,
                onCategorySelect = { viewModel.setCategory(it) },
                onBack = onBack,
                onInfo = { showInfo = true }
            )

            TimeFilters(
                timeFilter = timeFilter,
                onFilterSelect = { viewModel.setTimeFilter(it) }
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFFA78BFA))
                }
            } else if (entries.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No rankings yet", color = Color.White.copy(alpha = 0.4f))
                }
            } else {
                PodiumLayout(
                    entries = entries.take(3),
                    themeConfig = activeTheme,
                    onPress = { if (activeCategory == "rooms") onOpenRoom(it) else onOpenProfile(it) }
                )
                
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    if (entries.size > 3) {
                        item {
                            Spacer(modifier = Modifier.height(24.dp))
                        }
                        itemsIndexed(entries.drop(3)) { index, item ->
                            val rank = index + 4
                            ListCard(
                                rank = rank,
                                item = item,
                                isRoom = activeCategory == "rooms",
                                onPress = { if (activeCategory == "rooms") onOpenRoom(item.id) else onOpenProfile(item.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    if (showInfo) {
        InfoDialog { showInfo = false }
    }
}

@Composable
fun Header(activeCategory: String, onCategorySelect: (String) -> Unit, onBack: () -> Unit, onInfo: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 12.dp)
            .offset(y = (-10).dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
            listOf("rich" to "Honor", "charm" to "Charm", "rooms" to "Room").forEach { (key, label) ->
                val selected = activeCategory == key
                Text(
                    text = label.uppercase(),
                    color = if (selected) Color.White else Color.White.copy(alpha = 0.4f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp,
                    modifier = Modifier.clickable { onCategorySelect(key) }
                )
            }
        }

        IconButton(onClick = onInfo) {
            Icon(Icons.Default.Info, null, tint = Color.White)
        }
    }
}

@Composable
fun TimeFilters(timeFilter: String, onFilterSelect: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 0.dp).offset(y = (-16).dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        listOf("daily", "weekly", "monthly").forEach { filter ->
            val selected = timeFilter == filter
            Box(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (selected) Color.White.copy(alpha = 0.2f) else Color.Transparent)
                    .border(
                        1.dp,
                        if (selected) Color.White.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.1f),
                        RoundedCornerShape(8.dp)
                    )
                    .clickable { onFilterSelect(filter) }
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = filter.replaceFirstChar { it.uppercase() },
                    color = if (selected) Color.White else Color.White.copy(alpha = 0.4f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@Composable
fun DynamicThemeBackground() {
    val brush = Brush.linearGradient(
        colors = listOf(Color(0xFF2E152B), Color(0xFF2C1B18), Color(0xFF3B1C32))
    )
    Box(modifier = Modifier.fillMaxSize().background(brush)) {
        Box(modifier = Modifier.offset(x = (-40).dp, y = (-40).dp).size(280.dp).clip(CircleShape).background(Color(0xFFEC4899).copy(alpha = 0.1f)))
        Box(modifier = Modifier.align(Alignment.BottomEnd).offset(x = 40.dp, y = 40.dp).size(280.dp).clip(CircleShape).background(Color(0xFF9333EA).copy(alpha = 0.1f)))
    }
}

@Composable
fun LeaderboardAnimOverlay() {
    val infiniteTransition = rememberInfiniteTransition()
    val glow by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2000), RepeatMode.Reverse)
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier.fillMaxSize().padding(2.dp).border(2.5.dp, Color(0xFFFBBF24).copy(alpha = glow), RoundedCornerShape(24.dp))
        )
        // Add golden rain simulation using Canvas
        val density = LocalDensity.current
        val particles = remember { List(30) { 
            object {
                val x = (0..1000).random() / 1000f
                val size = (2..7).random().toFloat()
                val speedMs = (5000..10000).random()
                val delayMs = (0..5000).random()
                val isGold = (0..2).random() != 0
            }
        } }

        val timeStates = particles.map { p ->
            infiniteTransition.animateFloat(
                initialValue = 0f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(p.speedMs, easing = LinearEasing),
                    initialStartOffset = StartOffset(p.delayMs)
                )
            )
        }

        Canvas(modifier = Modifier.fillMaxSize()) {
            val h = size.height
            val w = size.width
            particles.forEachIndexed { index, p ->
                val progress = timeStates[index].value
                val y = progress * (h + 100f) - 50f
                val drift = (p.x * 40f) * progress // slight horizontal drift
                val currentX = (p.x * w) + drift
                
                val alpha = if (progress < 0.1f) progress * 10f else if (progress > 0.8f) (1f - progress) * 5f else 1f
                val color = if (p.isGold) Color(0xFFFBBF24) else Color.White
                
                drawCircle(
                    color = color.copy(alpha = alpha * 0.9f),
                    radius = p.size,
                    center = Offset(currentX, y)
                )
            }
        }
    }
}

@Composable
fun PodiumLayout(entries: List<LeaderboardItem>, themeConfig: LeaderboardThemeConfig?, onPress: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().height(250.dp).padding(top = 0.dp).offset(y = (-20).dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.Bottom
    ) {
        if (entries.size > 1) {
            PodiumCard(modifier = Modifier.offset(x = (-10).dp), rank = 2, item = entries[1], frameConfig = themeConfig?.frameConfigs?.get("rank2"), onPress = onPress)
        } else {
            Spacer(modifier = Modifier.width(96.dp))
        }

        if (entries.isNotEmpty()) {
            PodiumCard(modifier = Modifier.zIndex(1f), rank = 1, item = entries[0], frameConfig = themeConfig?.frameConfigs?.get("rank1"), onPress = onPress)
        }

        if (entries.size > 2) {
            PodiumCard(modifier = Modifier.offset(x = 5.dp), rank = 3, item = entries[2], frameConfig = themeConfig?.frameConfigs?.get("rank3"), onPress = onPress)
        } else {
            Spacer(modifier = Modifier.width(96.dp))
        }
    }
}

@Composable
fun PodiumCard(modifier: Modifier = Modifier, rank: Int, item: LeaderboardItem, frameConfig: FrameConfig?, onPress: (String) -> Unit) {
    val isFirst = rank == 1
    val width = if (isFirst) 116.dp else 96.dp
    val avatarSize = if (isFirst) 64.dp else 52.dp
    val color = if (rank == 1) Color(0xFFFBBF24) else if (rank == 2) Color(0xFFCBD5E1) else Color(0xFFEA580C)

    Box(
        modifier = modifier.width(width).height(if (isFirst) 220.dp else 220.dp).clickable { onPress(item.id) }
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = if (isFirst) 45.dp else 75.dp)
                .size(avatarSize),  // Fixed size = DP size, frame won't affect DP position
            contentAlignment = Alignment.Center
        ) {
            // DP - fills the fixed box
            Box(
                modifier = Modifier.fillMaxSize().clip(CircleShape).border(2.dp, color, CircleShape).background(Color(0xFF1E1B4B)),
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = item.avatarUrl ?: "https://picsum.photos/200",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            // Frame - independent of DP, uses requiredSize to overflow freely
            if (frameConfig?.isEnabled == true) {
                val frameModifier = Modifier
                    .requiredSize(if (isFirst) 320.dp else 240.dp)
                    .offset(y = if (rank == 2) (-1).dp else 0.dp)

                if (frameConfig.type == "video" && frameConfig.videoUrl != null) {
                    app.vercel.ummy_chat.twa.ui.components.AnimatedVideoFrame(
                        videoUrl = frameConfig.videoUrl,
                        modifier = frameModifier
                    )
                } else if (frameConfig.imageUrl != null) {
                    AsyncImage(
                        model = frameConfig.imageUrl,
                        contentDescription = null,
                        modifier = frameModifier
                    )
                }
            }
        }

        Column(
            modifier = Modifier.align(Alignment.TopCenter).padding(top = if (isFirst) 145.dp else 160.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = item.label,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 4.dp)
            )
            Row(
                modifier = Modifier.offset(y = (-4).dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatValue(item.value),
                    color = Color(0xFFFBBF24),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }
}

@Composable
fun ListCard(rank: Int, item: LeaderboardItem, isRoom: Boolean, onPress: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).background(Color.White.copy(alpha = 0.05f)).clickable { onPress() }.padding(horizontal = 8.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = rank.toString(),
            color = Color.White.copy(alpha = 0.6f),
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(32.dp),
            textAlign = TextAlign.Center
        )
        
        AsyncImage(
            model = item.avatarUrl ?: "https://picsum.photos/200",
            contentDescription = null,
            modifier = Modifier.size(40.dp).clip(if (isRoom) RoundedCornerShape(8.dp) else CircleShape).background(Color.DarkGray),
            contentScale = ContentScale.Crop
        )

        Column(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text(item.label, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (item.identifier != null) {
                Text("ID: ${item.identifier}", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Medium)
            }
        }

        Text(formatValue(item.value), color = Color(0xFFFBBF24), fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun InfoDialog(onDismiss: () -> Unit) {
    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(24.dp)
        ) {
            // Close Button
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFF1F5F9))
                    .clickable { onDismiss() },
                contentAlignment = Alignment.Center
            ) {
                Text("✕", color = Color(0xFF64748B), fontSize = 16.sp)
            }

            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "Ranking Info",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF0F172A),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                )

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    InfoBox(
                        "🏆 Honor Ranking",
                        "Honor Ranking is determined by the number of Coins you Spend in Gifts.",
                        "Coins you Spend",
                        Color(0xFFFFFBEB),
                        Color(0xFFFDE68A),
                        Color(0xFFD97706),
                        Color(0xFFF59E0B)
                    )
                    InfoBox(
                        "💖 Charm Ranking",
                        "Charm Ranking is determined by the number of Coins you Received in Gifts.",
                        "Coins you Received",
                        Color(0xFFFDF2F8),
                        Color(0xFFFCE7F3),
                        Color(0xFFDB2777),
                        Color(0xFFEC4899)
                    )
                    InfoBox(
                        "🏠 Room Ranking",
                        "Room Ranking is determined by the number of Coins you Spend in Room.",
                        "Coins you Spend",
                        Color(0xFFFAF5FF),
                        Color(0xFFF3E8FF),
                        Color(0xFF9333EA),
                        Color(0xFFA855F7)
                    )
                    
                    // Rewards Box
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.horizontalGradient(listOf(Color(0xFFFFFBEB), Color(0xFFFEFCE8))),
                                RoundedCornerShape(16.dp)
                            )
                            .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        Text("🎁 Ranking Rewards", color = Color(0xFFB45309), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                        Text(
                            text = androidx.compose.ui.text.buildAnnotatedString {
                                withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.Bold)) { append("Top 3: ") }
                                append("Exclusive Frames + Coins\n")
                                withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.Bold)) { append("Rank 4 - 7: ") }
                                append("Coins\n")
                            },
                            color = Color(0xFF475569),
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InfoBox(title: String, fullDesc: String, highlightText: String, bg: Color, border: Color, titleColor: Color, highlightColor: Color) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(bg, RoundedCornerShape(16.dp))
            .border(1.dp, border, RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Text(title, color = titleColor, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 4.dp))
        
        val parts = fullDesc.split(highlightText)
        Text(
            text = androidx.compose.ui.text.buildAnnotatedString {
                if (parts.size == 2) {
                    append(parts[0])
                    withStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.Bold, color = highlightColor)) {
                        append(highlightText)
                    }
                    append(parts[1])
                } else {
                    append(fullDesc)
                }
            },
            color = Color(0xFF475569),
            fontSize = 12.sp,
            lineHeight = 18.sp
        )
    }
}

fun formatValue(valToFormat: Long): String {
    if (valToFormat == 0L) return "0"
    if (valToFormat >= 1_000_000) return String.format("%.1fM", valToFormat / 1_000_000.0)
    if (valToFormat >= 1_000) return String.format("%.1fK", valToFormat / 1_000.0)
    return valToFormat.toString()
}
