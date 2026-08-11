package app.vercel.ummy_chat.twa.ui.room

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.vercel.ummy_chat.twa.R
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// GameMiniCard — mirrors RN room-game-mini-card.tsx
// Floating action button on room screen displaying active game thumbnail
// ─────────────────────────────────────────────────────────────────────────────

private val GAME_NAMES = mapOf(
    "fruit-party" to "Fruit Party",
    "forest-party" to "Forest Party",
    "roulette" to "Roulette",
    "teen-patti" to "Teen Patti",
    "ludo" to "Ludo",
    "carrom" to "Carrom",
    "chess" to "Chess"
)

@Composable
fun GameMiniCard(
    gameId: String,
    onPress: () -> Unit,
    modifier: Modifier = Modifier
) {
    val name = GAME_NAMES[gameId] ?: "Game"

    Box(
        modifier = modifier
            .size(68.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0F172A))
            .border(1.5.dp, Color(0xFFFBBF24), RoundedCornerShape(16.dp))
            .clickable(onClick = onPress)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF8B5CF6), Color(0xFFEC4899))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Text("🎮", fontSize = 28.sp)
        }

        Text(
            name,
            color = Color.White,
            fontSize = 8.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(vertical = 2.dp)
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomGamesDialog — mirrors RN room-games-dialog.tsx
// 7 games grid: local thumbnails (carrom/ludo/chess/fruit-party/forest-party)
// + Firestore coverUrl override + SVG fallback (roulette/teen-patti use local
// PNG). Admin-only restriction for starting ludo/chess/carrom.
// ─────────────────────────────────────────────────────────────────────────────

data class RoomGameConfig(
    val id: String = "",
    val title: String = "",
    val slug: String = "",
    val coverUrl: String = "",
    val backgroundUrl: String = "",
    val cost: Int = 0
)

// Local 3D game thumbnails (RN GAME_THUMBNAILS equivalent)
private val GAME_THUMBNAIL_RES = mapOf(
    "carrom" to R.drawable.carrom,
    "ludo" to R.drawable.ludo,
    "chess" to R.drawable.chess,
    "fruit-party" to R.drawable.fruit_party,
    "forest-party" to R.drawable.forest_party
)

// Games available in the native app (matching web app)
private val AVAILABLE_GAME_IDS = listOf(
    "carrom", "chess", "ludo", "fruit-party",
    "forest-party", "roulette", "teen-patti"
)

private val GAME_TITLES = mapOf(
    "carrom" to "Carrom",
    "chess" to "Chess",
    "ludo" to "Ludo",
    "fruit-party" to "Fruit Party",
    "forest-party" to "Forest Party",
    "roulette" to "Roulette",
    "teen-patti" to "Teen Patti"
)

// Only owners/admins can START a fresh restricted game (still can JOIN active)
private val RESTRICTED_GAMES_START_ONLY = listOf("ludo", "chess", "carrom")

private fun gameGradientColor(id: String): Pair<Color, Color> = when (id) {
    "carrom" -> Color(0xFFF59E0B) to Color(0xFFD97706)
    "chess" -> Color(0xFF6366F1) to Color(0xFF4338CA)
    "ludo" -> Color(0xFFEC4899) to Color(0xFFBE185D)
    "fruit-party" -> Color(0xFF10B981) to Color(0xFF047857)
    "forest-party" -> Color(0xFF22C55E) to Color(0xFF15803D)
    "roulette" -> Color(0xFFEF4444) to Color(0xFFB91C1C)
    "teen-patti" -> Color(0xFF8B5CF6) to Color(0xFF6D28D9)
    else -> Color(0xFF3B82F6) to Color(0xFF1D4ED8)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomGamesDialog(
    visible: Boolean,
    onSelectGame: (String, String, String) -> Unit,
    onDismiss: () -> Unit,
    roomId: String = "",
    canManage: Boolean = false
) {
    if (!visible) return

    val context = LocalContext.current
    var games by remember { mutableStateOf<List<RoomGameConfig>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var selectedId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        // Base list from AVAILABLE_GAME_IDS (mirrors RN baseList)
        val baseList = AVAILABLE_GAME_IDS.map { id ->
            RoomGameConfig(
                id = id,
                title = GAME_TITLES[id] ?: id.replace('-', ' ').replaceFirstChar { it.uppercase() },
                slug = id,
                coverUrl = "",
                cost = 0
            )
        }
        // Merge with Firestore games config (title/coverUrl/cost override)
        var merged = baseList
        try {
            val snap = Firebase.firestore.collection("games").get().await()
            if (!snap.isEmpty) {
                val byId = mutableMapOf<String, RoomGameConfig>()
                val bySlug = mutableMapOf<String, RoomGameConfig>()
                snap.documents.forEach { doc ->
                    val cfg = RoomGameConfig(
                        id = doc.id,
                        title = doc.getString("title") ?: "",
                        slug = doc.getString("slug") ?: doc.id,
                        coverUrl = doc.getString("coverUrl") ?: "",
                        backgroundUrl = doc.getString("backgroundUrl") ?: "",
                        cost = doc.getLong("cost")?.toInt() ?: 0
                    )
                    if (cfg.id.isNotBlank()) byId[cfg.id] = cfg
                    if (cfg.slug.isNotBlank() && cfg.slug != cfg.id) bySlug[cfg.slug] = cfg
                }
                merged = baseList.map { base ->
                    val remote = byId[base.id] ?: bySlug[base.slug]
                    if (remote != null) {
                        base.copy(
                            title = remote.title.ifBlank { base.title },
                            coverUrl = remote.coverUrl.ifBlank { base.coverUrl },
                            cost = remote.cost
                        )
                    } else base
                }
            }
        } catch (_: Exception) {}
        games = merged
        isLoading = false
    }

    // Reset selection when dialog closes
    LaunchedEffect(visible) {
        if (!visible) selectedId = null
    }

    var infoAlert by remember { mutableStateOf<String?>(null) }

    val handleSelect: (String) -> Unit = { gameId ->
        val game = games.find { it.id == gameId || it.slug == gameId }
        // Block non-admins from starting a fresh restricted game (not from joining)
        val isRestrictedSelect = RESTRICTED_GAMES_START_ONLY.contains(gameId) && !canManage
        if (isRestrictedSelect) {
            infoAlert = "Admin Only — Only room owner or admin can start this game."
        } else {
            selectedId = gameId
            onSelectGame(gameId, game?.title ?: gameId, game?.coverUrl ?: "")
            onDismiss()
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Transparent)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null, onClick = onDismiss
                ),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.8f)
                    .clip(RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
                    .background(Color(0xFF0C0C14))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {}
            ) {
                // Handle
                Box(
                    modifier = Modifier
                        .padding(top = 14.dp, bottom = 6.dp)
                        .width(40.dp)
                        .height(5.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(Color(0x33FFFFFF))
                        .align(Alignment.CenterHorizontally)
                )

                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "GAMES",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.5).sp
                        )
                        Text(
                            if (isLoading) "Loading..." else "${games.size} Games Available",
                            color = Color.White.copy(alpha = 0.35f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.08f))
                            .clickable { onDismiss() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
                Spacer(Modifier.height(16.dp))

                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(vertical = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Color(0xFF6366F1), modifier = Modifier.size(28.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Loading games...", color = Color.White.copy(alpha = 0.3f), fontSize = 12.sp)
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(4),
                        horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally),
                        verticalArrangement = Arrangement.spacedBy(20.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(horizontal = 16.dp, vertical = 16.dp),
                        contentPadding = PaddingValues(bottom = 24.dp)
                    ) {
                        items(games, key = { it.id }) { g ->
                            val gameId = g.id.ifBlank { g.slug }
                            val isSelected = selectedId == gameId
                            val isRestricted = RESTRICTED_GAMES_START_ONLY.contains(gameId) && !canManage
                            val (c1, c2) = gameGradientColor(gameId)
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(64.dp)
                                    .graphicsLayer {
                                        scaleX = if (isSelected) 0.92f else 1f
                                        scaleY = if (isSelected) 0.92f else 1f
                                        alpha = if (isRestricted) 0.4f else 1f
                                    }
                                    .clickable { handleSelect(gameId) },
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(56.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .border(
                                            1.5.dp,
                                            if (isSelected) c1 else Color.White.copy(alpha = 0.1f),
                                            RoundedCornerShape(14.dp)
                                        )
                                        .background(Color.White.copy(alpha = 0.05f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val localRes = GAME_THUMBNAIL_RES[gameId]
                                    if (localRes != null && g.coverUrl.isBlank()) {
                                        androidx.compose.foundation.Image(
                                            painter = painterResource(localRes),
                                            contentDescription = g.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else if (g.coverUrl.isNotBlank()) {
                                        AsyncImage(
                                            model = g.coverUrl,
                                            contentDescription = g.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        // SVG fallback: use local PNGs for roulette/teen-patti
                                        when (gameId) {
                                            "roulette" -> androidx.compose.foundation.Image(
                                                painter = painterResource(R.drawable.roulette),
                                                contentDescription = g.title,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            "teen-patti" -> androidx.compose.foundation.Image(
                                                painter = painterResource(R.drawable.teen_patti),
                                                contentDescription = g.title,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            else -> Text("🎯", fontSize = 24.sp)
                                        }
                                    }
                                    if (isRestricted) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .background(Color.Black.copy(alpha = 0.5f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Default.Lock,
                                                contentDescription = "Locked",
                                                tint = Color.White.copy(alpha = 0.8f),
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                }
                                Text(
                                    g.title,
                                    color = if (isSelected) Color.White else Color.White.copy(alpha = 0.6f),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center
                                )
                                if (g.cost > 0) {
                                    Text("🪙 ${g.cost}", color = Color(0xFFF59E0B), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Admin Only Alert ────────────────────────────────────────────────────
    infoAlert?.let { msg ->
        AlertDialog(
            onDismissRequest = { infoAlert = null },
            title = { Text("Admin Only", fontWeight = FontWeight.Bold) },
            text = { Text(msg) },
            confirmButton = {
                TextButton(onClick = { infoAlert = null }) { Text("OK") }
            }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomTasksDialog — mirrors RN room-tasks-dialog.tsx
// ─────────────────────────────────────────────────────────────────────────────

private data class RoomTaskItem(
    val id: String,
    val title: String,
    val target: Int,
    val reward: Int,
    val unit: String = ""
)

private val DAILY_ROOM_TASKS = listOf(
    RoomTaskItem("mic_10", "On mic for 10 Minutes", 10, 2500, "min"),
    RoomTaskItem("mic_30", "On mic for 30 Minutes", 30, 10000, "min"),
    RoomTaskItem("mic_60", "On mic for 60 Minutes", 60, 25000, "min"),
    RoomTaskItem("invite_1", "Invite 1 user on mic", 1, 2500),
    RoomTaskItem("invite_10", "Invite 10 users on mic", 10, 25000),
    RoomTaskItem("gift_once", "Send gift once", 1, 500)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomTasksDialog(
    visible: Boolean,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var claimedTasks by remember { mutableStateOf<Set<String>>(emptySet()) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.75f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🎯", fontSize = 20.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("ROOM DAILY TASKS", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(Modifier.height(10.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(DAILY_ROOM_TASKS, key = { it.id }) { task ->
                    val isClaimed = claimedTasks.contains(task.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(task.title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(2.dp))
                            Text("Reward: 🪙 ${task.reward}", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                if (!isClaimed) {
                                    claimedTasks = claimedTasks + task.id
                                    scope.launch {
                                        try {
                                            val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                            Firebase.firestore.collection("users").document(uid)
                                                .update("wallet.coins", FieldValue.increment(task.reward.toLong()))
                                                .await()
                                        } catch (_: Exception) {}
                                    }
                                }
                            },
                            enabled = !isClaimed,
                            colors = ButtonDefaults.buttonColors(containerColor = if (isClaimed) Color(0xFF10B981) else Color(0xFFF59E0B)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                if (isClaimed) "Claimed" else "Claim",
                                color = if (isClaimed) Color.White else Color.Black,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SportsHubDialog — mirrors RN sports-hub-dialog.tsx
// Live Sports scores external link launchers (Cricket, Football, Kabaddi, etc.)
// ─────────────────────────────────────────────────────────────────────────────

private data class SportLink(val name: String, val url: String, val emoji: String)

private val SPORTS_MAP = mapOf(
    "Cricket" to listOf(
        SportLink("Cricbuzz Live", "https://www.cricbuzz.com/live-cricket-scores", "🏏"),
        SportLink("ESPNcricinfo", "https://www.espncricinfo.com/live-cricket-score", "🏏")
    ),
    "Football" to listOf(
        SportLink("SofaScore", "https://www.sofascore.com/football", "⚽"),
        SportLink("ESPN Football", "https://www.espn.com/soccer/scores", "⚽")
    ),
    "Kabaddi" to listOf(
        SportLink("Pro Kabaddi", "https://www.prokabaddi.com/schedule", "🤼")
    ),
    "Basketball" to listOf(
        SportLink("NBA Scores", "https://www.nba.com/games", "🏀")
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SportsHubDialog(
    visible: Boolean,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val context = LocalContext.current
    var activeCategory by remember { mutableStateOf("Cricket") }
    val categories = remember { SPORTS_MAP.keys.toList() }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.65f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Live Sports Scores", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            // Categories pill row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSel = cat == activeCategory
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSel) Color(0xFF0284C7) else Color.White.copy(alpha = 0.08f))
                            .clickable { activeCategory = cat }
                            .padding(horizontal = 14.dp, vertical = 7.dp)
                    ) {
                        Text(cat, color = if (isSel) Color.White else Color.White.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
            Spacer(Modifier.height(10.dp))

            val links = SPORTS_MAP[activeCategory] ?: emptyList()
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(links) { link ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(link.emoji, fontSize = 28.sp)
                        Spacer(Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(link.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(link.url, color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp, maxLines = 1)
                        }
                        Icon(Icons.Default.OpenInNew, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
