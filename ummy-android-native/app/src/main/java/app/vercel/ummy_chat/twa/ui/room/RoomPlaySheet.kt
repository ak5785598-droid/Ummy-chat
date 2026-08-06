package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.RoomModel
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// RoomPlaySheet — mirrors RN room-play-sheet.tsx
// Features: Grid view (Games, Music Sync, YouTube, Movie Hub 1/2/3, Screen Mirror)
// + Admin quick toggles (Clean Chat, Public Msg toggle, Gift Effects toggle)
// + Full Music Sync Player view
// ─────────────────────────────────────────────────────────────────────────────

private data class PlayGridItem(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val gradient: List<Color>,
    val requiresAdmin: Boolean = false
)

private val PLAY_GRID_ITEMS = listOf(
    PlayGridItem("games", "GAMES", Icons.Default.SportsEsports, listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))),
    PlayGridItem("music", "MUSIC", Icons.Default.MusicNote, listOf(Color(0xFFEC4899), Color(0xFFD946EF))),
    PlayGridItem("youtube", "YOUTUBE", Icons.Default.PlayCircle, listOf(Color(0xFFEF4444), Color(0xFFDC2626))),
    PlayGridItem("netmirror", "NET MIRROR", Icons.Default.Tv, listOf(Color(0xFF3B82F6), Color(0xFF1D4ED8))),
    PlayGridItem("moviehub", "MOVIES", Icons.Default.Movie, listOf(Color(0xFF10B981), Color(0xFF059669))),
    PlayGridItem("multimovies", "MULTI MOVIES", Icons.Default.VideoLibrary, listOf(Color(0xFFF59E0B), Color(0xFFD97706))),
    PlayGridItem("screen", "SCREEN", Icons.Default.ScreenShare, listOf(Color(0xFF6366F1), Color(0xFF4338CA)))
)

data class MusicTrack(
    val id: String = "",
    val name: String = "",
    val url: String = "",
    val uploadedBy: String = ""
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomPlaySheet(
    visible: Boolean,
    room: RoomModel?,
    canManage: Boolean = false,
    onDismiss: () -> Unit,
    onOpenGames: () -> Unit = {},
    onOpenYouTube: () -> Unit = {},
    onOpenNetMirror: () -> Unit = {},
    onOpenEntertainment: () -> Unit = {},
    onOpenScreenMirror: () -> Unit = {},
    onOpenMultiMovies: () -> Unit = {}
) {
    if (!visible || room == null) return

    val scope = rememberCoroutineScope()
    var viewState by remember { mutableStateOf("grid") } // "grid" | "music"
    var isChatMuted by remember { mutableStateOf(false) }
    var isGiftEffects by remember { mutableStateOf(true) }

    // Music library state
    var musicTracks by remember { mutableStateOf<List<MusicTrack>>(emptyList()) }

    // Load music library when in music view
    LaunchedEffect(viewState, room.id) {
        if (viewState == "music") {
            try {
                val db = Firebase.firestore
                val snap = db.collection("chatRooms").document(room.id)
                    .collection("music")
                    .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                    .get().await()

                musicTracks = snap.documents.map { doc ->
                    MusicTrack(
                        id = doc.id,
                        name = doc.getString("name") ?: "Track",
                        url = doc.getString("url") ?: "",
                        uploadedBy = doc.getString("uploadedBy") ?: ""
                    )
                }
            } catch (_: Exception) {}
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
            )
        },
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        AnimatedContent(
            targetState = viewState,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "play_view"
        ) { currentView ->
            if (currentView == "grid") {
                // ── Grid View ─────────────────────────────────────────────
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    // Admin Quick Toggles
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // Clear Chat
                        if (canManage) {
                            QuickToggleBtn(
                                label = "Clean",
                                icon = Icons.Default.CleaningServices,
                                color = Color(0xFFEF4444),
                                onClick = {
                                    scope.launch {
                                        try {
                                            val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                            val db = Firebase.firestore
                                            db.collection("chatRooms").document(room.id)
                                                .update("chatClearedAt", FieldValue.serverTimestamp())
                                                .await()
                                            onDismiss()
                                        } catch (_: Exception) {}
                                    }
                                }
                            )
                        }

                        // Mute Chat Toggle
                        if (canManage) {
                            QuickToggleBtn(
                                label = if (isChatMuted) "Unmute Chat" else "Mute Chat",
                                icon = if (isChatMuted) Icons.Default.SpeakerNotesOff else Icons.Default.SpeakerNotes,
                                color = if (isChatMuted) Color(0xFFF59E0B) else Color(0xFF10B981),
                                onClick = {
                                    isChatMuted = !isChatMuted
                                    scope.launch {
                                        try {
                                            Firebase.firestore.collection("chatRooms").document(room.id)
                                                .update("isChatMuted", isChatMuted)
                                                .await()
                                        } catch (_: Exception) {}
                                    }
                                }
                            )
                        }

                        // Gift Effects Toggle
                        QuickToggleBtn(
                            label = "Effects",
                            icon = Icons.Default.AutoAwesome,
                            color = if (isGiftEffects) Color(0xFF8B5CF6) else Color(0xFF64748B),
                            onClick = { isGiftEffects = !isGiftEffects }
                        )
                    }

                    Spacer(Modifier.height(20.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                    Spacer(Modifier.height(16.dp))

                    // Feature Grid
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(4),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxWidth().height(200.dp)
                    ) {
                        items(PLAY_GRID_ITEMS) { item ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.clickable {
                                    when (item.id) {
                                        "games" -> { onDismiss(); onOpenGames() }
                                        "music" -> viewState = "music"
                                        "youtube" -> { onDismiss(); onOpenYouTube() }
                                        "netmirror" -> { onDismiss(); onOpenNetMirror() }
                                        "moviehub" -> { onDismiss(); onOpenEntertainment() }
                                        "multimovies" -> { onDismiss(); onOpenMultiMovies() }
                                        "screen" -> { onDismiss(); onOpenScreenMirror() }
                                    }
                                }
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(56.dp)
                                        .clip(RoundedCornerShape(18.dp))
                                        .background(Brush.linearGradient(item.gradient)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        item.icon,
                                        contentDescription = item.title,
                                        tint = Color.White,
                                        modifier = Modifier.size(26.dp)
                                    )
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    item.title,
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    Spacer(Modifier.navigationBarsPadding())
                }
            } else {
                // ── Music View ────────────────────────────────────────────
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(500.dp)
                        .padding(horizontal = 20.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { viewState = "grid" }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Music Sync",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    HorizontalDivider(color = Color.White.copy(alpha = 0.05f))

                    // Track list
                    if (musicTracks.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No music tracks uploaded yet",
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 13.sp
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f).padding(top = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(musicTracks, key = { it.id }) { track ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color.White.copy(alpha = 0.05f))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.MusicNote,
                                        contentDescription = null,
                                        tint = Color(0xFFEC4899),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            track.name,
                                            color = Color.White,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        if (track.uploadedBy.isNotBlank()) {
                                            Text(
                                                "By ${track.uploadedBy}",
                                                color = Color.White.copy(alpha = 0.4f),
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                    IconButton(
                                        onClick = {
                                            // Play track in room
                                            scope.launch {
                                                try {
                                                    Firebase.firestore.collection("chatRooms").document(room.id)
                                                        .update(
                                                            mapOf(
                                                                "currentMusicUrl" to track.url,
                                                                "currentMusicTitle" to track.name
                                                            )
                                                        ).await()
                                                    onDismiss()
                                                } catch (_: Exception) {}
                                            }
                                        }
                                    ) {
                                        Icon(
                                            Icons.Default.PlayArrow,
                                            contentDescription = "Play",
                                            tint = Color(0xFF10B981)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.navigationBarsPadding())
                }
            }
        }
    }
}

@Composable
private fun QuickToggleBtn(
    label: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.15f))
                .border(1.dp, color.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}
