package app.vercel.ummy_chat.twa.ui.room

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
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
import app.vercel.ummy_chat.twa.data.model.RoomModel
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.ktx.database
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// RoomPlaySheet — mirrors RN room-play-sheet.tsx 1:1
// Grid view: quick toggles (Clean / Public Msg / Gift Effects) + feature grid
// (GAMES, MUSIC, YOUTUBE, MOVIE HUB 1/2/3, SCREEN) with same image icons.
// Music view: Music Power switch + Online Sync / Room Library tabs + upload.
// ─────────────────────────────────────────────────────────────────────────────

private data class PlayToggle(
    val id: String,
    val label: String,
    val iconRes: Int,
    val activeColor: Color,
    val bgColor: Color,
    val showDot: Boolean = false,
    val dotColor: Color = Color(0xFF22C55E),
    val onClick: () -> Unit
)

private data class PlayFeature(
    val id: String,
    val label: String,
    val iconRes: Int,
    val gradient: List<Color>,
    val onPress: () -> Unit
)

data class MusicTrack(
    val id: String = "",
    val name: String = "",
    val url: String = "",
    val type: String = "upload",
    val storagePath: String = "",
    val uploadedBy: String = "",
    val uploaderName: String = ""
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
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
    onOpenMultiMovies: () -> Unit = {},
    onChatCleared: (String) -> Unit = {}
) {
    if (!visible || room == null) return

    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val uid = Firebase.auth.currentUser?.uid

    var view by remember { mutableStateOf("grid") } // "grid" | "music"
    var isChatMuted by remember { mutableStateOf(false) }
    var isGiftEffects by remember { mutableStateOf(true) }
    var isMusicEnabled by remember { mutableStateOf(false) }
    var musicTab by remember { mutableStateOf("online") } // "online" | "device"
    var musicSearch by remember { mutableStateOf("") }
    var isUploading by remember { mutableStateOf(false) }
    var isClearingChat by remember { mutableStateOf(false) }
    var userName by remember { mutableStateOf("Admin") }
    var infoAlert by remember { mutableStateOf<String?>(null) }
    var deleteTarget by remember { mutableStateOf<MusicTrack?>(null) }
    var showCleanConfirm by remember { mutableStateOf(false) }
    var musicTracks by remember { mutableStateOf<List<MusicTrack>>(emptyList()) }

    // Reset to grid view each time sheet opens
    LaunchedEffect(visible) {
        if (visible) view = "grid"
    }

    // Live room doc (isChatMuted)
    LaunchedEffect(room.id) {
        Firebase.firestore.collection("chatRooms").document(room.id)
            .addSnapshotListener { snap, _ ->
                if (snap != null) {
                    isChatMuted = snap.getBoolean("isChatMuted") ?: false
                    isMusicEnabled = snap.getBoolean("isMusicPlaying") ?: false
                }
            }
    }

    // Live music library (orderBy createdAt desc)
    LaunchedEffect(room.id) {
        Firebase.firestore.collection("chatRooms").document(room.id)
            .collection("music")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { snap, _ ->
                if (snap != null) {
                    musicTracks = snap.documents.map { doc ->
                        MusicTrack(
                            id = doc.id,
                            name = doc.getString("name") ?: "Track",
                            url = doc.getString("url") ?: "",
                            type = doc.getString("type") ?: "upload",
                            storagePath = doc.getString("storagePath") ?: "",
                            uploadedBy = doc.getString("uploadedBy") ?: "",
                            uploaderName = doc.getString("uploaderName") ?: ""
                        )
                    }
                }
            }
    }

    // Current user's username (for "X cleared the chat")
    LaunchedEffect(uid) {
        if (uid != null) {
            try {
                val snap = Firebase.firestore.collection("users").document(uid).get().await()
                userName = snap.getString("username") ?: "Admin"
            } catch (_: Exception) {}
        }
    }

    // ── Actions ─────────────────────────────────────────────────────────────
    val handleClearChat: () -> Unit = {
        if (canManage) {
            showCleanConfirm = true
        }
    }

    val performClearChat: () -> Unit = {
        scope.launch {
            try {
                isClearingChat = true
                Firebase.database.getReference("roomMessages").child(room.id).removeValue().await()
                Firebase.firestore.collection("chatRooms").document(room.id)
                    .set(
                        mapOf(
                            "chatClearedAt" to FieldValue.serverTimestamp(),
                            "chatClearedBy" to userName,
                            "updatedAt" to FieldValue.serverTimestamp()
                        ),
                        com.google.firebase.firestore.SetOptions.merge()
                    ).await()
                infoAlert = "Chat history cleared."
                onChatCleared(userName)
                onDismiss()
            } catch (e: Exception) {
                infoAlert = e.message ?: "Chat Clean Failed"
            } finally {
                isClearingChat = false
            }
        }
    }

    val handleToggleChatMute: () -> Unit = {
        if (canManage) {
            scope.launch {
            try {
                val newMute = !isChatMuted
                Firebase.firestore.collection("chatRooms").document(room.id)
                    .update(
                        "isChatMuted", newMute,
                        "updatedAt", FieldValue.serverTimestamp()
                    ).await()
                isChatMuted = newMute
                infoAlert = if (newMute) {
                    "Messaging Restricted — Only authorities can broadcast."
                } else {
                    "Messaging Restored — Tribe members can now send messages."
                }
                onDismiss()
            } catch (_: Exception) {
                infoAlert = "Failed to update chat status."
            }
            }
        }
    }

    val uploadLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            isUploading = true
            try {
                var filename: String? = null
                var fileSize = 0L
                var mimeType: String? = null
                context.contentResolver.query(
                    uri, null, null, null, null
                )?.use { c ->
                    val nameIdx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val sizeIdx = c.getColumnIndex(OpenableColumns.SIZE)
                    if (c.moveToFirst()) {
                        if (nameIdx >= 0) filename = c.getString(nameIdx)
                        if (sizeIdx >= 0) fileSize = c.getLong(sizeIdx)
                    }
                }
                mimeType = context.contentResolver.getType(uri)
                val finalName = filename ?: "${System.currentTimeMillis()}.mp3"
                val timestamp = System.currentTimeMillis()
                val path = "rooms/${room.id}/music/${timestamp}_$finalName"
                val metadata = StorageMetadata.Builder()
                    .setContentType(mimeType ?: "audio/mpeg")
                    .setCacheControl("public, max-age=2592000, immutable")
                    .build()
                val stream = context.contentResolver.openInputStream(uri)
                    ?: throw Exception("Cannot open file")
                val ref = FirebaseStorage.getInstance().reference.child(path)
                ref.putStream(stream, metadata).await()
                stream.close()
                val url = ref.downloadUrl.await().toString()
                Firebase.firestore.collection("chatRooms").document(room.id)
                    .collection("music")
                    .add(
                        mapOf(
                            "name" to finalName,
                            "url" to url,
                            "storagePath" to path,
                            "type" to "upload",
                            "size" to fileSize,
                            "uploadedBy" to (uid ?: "user"),
                            "uploaderName" to userName,
                            "createdAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                infoAlert = "$finalName added to room library."
            } catch (e: Exception) {
                infoAlert = e.message ?: "Upload Failed"
            } finally {
                isUploading = false
            }
        }
    }

    val handleSyncMusic: (MusicTrack) -> Unit = { track ->
        if (uid != null) {
            scope.launch {
                try {
                Firebase.firestore.collection("chatRooms").document(room.id)
                    .update(
                        mapOf(
                            "currentMusicUrl" to track.url,
                            "currentMusicTitle" to (track.name.ifBlank { "Unknown Song" }),
                            "currentMusicType" to track.type,
                            "currentMusicId" to track.id,
                            "isMusicPlaying" to true,
                            "musicStartedAt" to FieldValue.serverTimestamp(),
                            "musicStartOffset" to 0,
                            "musicUpdatedAt" to FieldValue.serverTimestamp(),
                            "musicUpdatedBy" to uid,
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                isMusicEnabled = true
                infoAlert = "Broadcasting Track — ${track.name} is now playing for everyone."
                onDismiss()
            } catch (e: Exception) {
                infoAlert = e.message ?: "Failed to sync music"
            }
            }
        }
    }

    val handleDeleteTrack: (MusicTrack) -> Unit = { track ->
        if (canManage) {
            deleteTarget = track
        }
    }

    // ── Content builders ────────────────────────────────────────────────────
    val toggles: List<PlayToggle> = buildList {
        if (canManage) {
            add(
                PlayToggle(
                    id = "clean",
                    label = "Clean",
                    iconRes = R.drawable.icon_clean,
                    activeColor = Color(0xFF06B6D4),
                    bgColor = Color(0xFFE0F7FA),
                    showDot = false,
                    onClick = handleClearChat
                )
            )
            add(
                PlayToggle(
                    id = "public-msg",
                    label = "Public Msg",
                    iconRes = R.drawable.icon_public_msg,
                    activeColor = if (isChatMuted) Color(0xFF475569) else Color(0xFF3B82F6),
                    bgColor = Color(0xFFEFF6FF),
                    showDot = !isChatMuted,
                    dotColor = Color(0xFF22C55E),
                    onClick = handleToggleChatMute
                )
            )
        }
        add(
            PlayToggle(
                id = "gift-effects",
                label = "Gift Effects",
                iconRes = R.drawable.icon_gift_effects,
                activeColor = if (isGiftEffects) Color(0xFFEAB308) else Color(0xFF475569),
                bgColor = Color(0xFFFEFCE8),
                showDot = isGiftEffects,
                dotColor = Color(0xFFEAB308),
                onClick = { isGiftEffects = !isGiftEffects }
            )
        )
    }

    val featureItems: List<PlayFeature> = buildList {
        add(
            PlayFeature(
                id = "games", label = "Games",
                iconRes = R.drawable.icon_games,
                gradient = listOf(Color(0xFF22C55E), Color(0xFF047857)),
                onPress = { onOpenGames(); onDismiss() }
            )
        )
        if (canManage) {
            add(
                PlayFeature(
                    id = "music", label = "Music",
                    iconRes = R.drawable.icon_music,
                    gradient = listOf(Color(0xFF00ACC1), Color(0xFF006064)),
                    onPress = { view = "music" }
                )
            )
        }
        add(
            PlayFeature(
                id = "youtube", label = "YouTube",
                iconRes = R.drawable.icon_youtube,
                gradient = listOf(Color(0xFFEF4444), Color(0xFFB91C1C)),
                onPress = { onOpenYouTube(); onDismiss() }
            )
        )
        add(
            PlayFeature(
                id = "netmirror", label = "Movie Hub 1",
                iconRes = R.drawable.icon_netmirror,
                gradient = listOf(Color(0xFF22C55E), Color(0xFF047857)),
                onPress = { onOpenNetMirror(); onDismiss() }
            )
        )
        add(
            PlayFeature(
                id = "movies", label = "Movie Hub 2",
                iconRes = R.drawable.icon_movie,
                gradient = listOf(Color(0xFFA855F7), Color(0xFF6D28D9)),
                onPress = { onOpenEntertainment(); onDismiss() }
            )
        )
        add(
            PlayFeature(
                id = "multimovies", label = "Movie Hub 3",
                iconRes = R.drawable.icon_movie,
                gradient = listOf(Color(0xFFF59E0B), Color(0xFFD97706)),
                onPress = { onOpenMultiMovies(); onDismiss() }
            )
        )
        add(
            PlayFeature(
                id = "screenmirror", label = "Screen",
                iconRes = R.drawable.icon_screen,
                gradient = listOf(Color(0xFF3B82F6), Color(0xFF1D4ED8)),
                onPress = { onOpenScreenMirror(); onDismiss() }
            )
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        val screenHeight = LocalConfiguration.current.screenHeightDp
        val sheetHeight = if (view == "grid") 280.dp else 600.dp
        val maxSheetHeight = (screenHeight * 0.8f).dp
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Transparent)
                .clickable(interactionSource = remember { MutableInteractionSource() },
                    indication = null, onClick = onDismiss),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(sheetHeight)
                    .heightIn(max = maxSheetHeight)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(Color(0xFFFFFFFF))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {}
            ) {
                // Drag handle
                Box(
                    modifier = Modifier
                        .padding(top = 16.dp, bottom = 8.dp)
                        .width(40.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color(0x1F000000))
                        .align(Alignment.CenterHorizontally)
                )

                if (view == "grid") {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                    ) {
                        // ── Top Row: Quick Toggles (Glossy Circles) ──
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.Top
                        ) {
                            toggles.forEach { opt ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(horizontal = 4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(18.dp))
                                            .background(opt.bgColor)
                                            .border(1.5.dp, Color(0x0F000000), RoundedCornerShape(18.dp))
                                            .clickable(onClick = opt.onClick),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Image(
                                            painter = painterResource(opt.iconRes),
                                            contentDescription = opt.label,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(RoundedCornerShape(18.dp))
                                        )
                                        if (opt.showDot) {
                                            Box(
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .padding(4.dp)
                                                    .size(8.dp)
                                                    .clip(CircleShape)
                                                    .background(opt.dotColor)
                                                    .border(1.dp, Color.White, CircleShape)
                                            )
                                        }
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        opt.label.uppercase(),
                                        color = Color(0x73000000),
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }
                        }

                        Spacer(Modifier.height(8.dp))

                        // ── Feature Grid ──
                        FlowRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterHorizontally),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            maxItemsInEachRow = 5
                        ) {
                            featureItems.forEach { f ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.width(56.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(RoundedCornerShape(18.dp))
                                            .background(Brush.linearGradient(f.gradient))
                                            .border(1.dp, Color(0x14000000), RoundedCornerShape(18.dp))
                                            .clickable(onClick = f.onPress),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Image(
                                            painter = painterResource(f.iconRes),
                                            contentDescription = f.label,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(RoundedCornerShape(18.dp))
                                        )
                                    }
                                    Spacer(Modifier.height(6.dp))
                                    Text(
                                        f.label.uppercase(),
                                        color = Color(0x80000000),
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 0.5.sp,
                                        textAlign = TextAlign.Center,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.navigationBarsPadding())
                    }
                } else {
                    // ── Music Sync View ──
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 0.dp)
                    ) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { view = "grid" }) {
                                Icon(
                                    Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                    contentDescription = "Back",
                                    tint = Color(0x80000000)
                                )
                            }
                            Text(
                                "Music Sync",
                                color = Color(0xFF111827),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Button(
                                onClick = { uploadLauncher.launch("audio/*") },
                                enabled = !isUploading,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF06B6D4),
                                    contentColor = Color.Black
                                ),
                                shape = RoundedCornerShape(999.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Icon(
                                    Icons.Default.Upload,
                                    contentDescription = null,
                                    tint = Color.Black,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    if (isUploading) "..." else "Add +",
                                    color = Color.Black,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp
                                )
                            }
                        }

                        HorizontalDivider(color = Color(0x12000000))

                        // Music Power
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp, vertical = 16.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0x0A000000))
                                .border(1.dp, Color(0x12000000), RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(8.dp)
                                    .size(34.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isMusicEnabled) Color(0x3322C55E) else Color(0x1AFFFFFF)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.PowerSettingsNew,
                                    contentDescription = null,
                                    tint = if (isMusicEnabled) Color(0xFF4ADE80) else Color(0x66FFFFFF),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(Modifier.width(4.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "Music Power",
                                    color = Color(0xFF111827),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    if (isMusicEnabled) "Active" else "Offline",
                                    color = Color(0x66000000),
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                            }
                            Switch(
                                checked = isMusicEnabled,
                                onCheckedChange = { isMusicEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedTrackColor = Color(0xFF7C3AED),
                                    uncheckedTrackColor = Color(0xFF374151),
                                    checkedThumbColor = Color(0xFFA78BFA),
                                    uncheckedThumbColor = Color(0xFF6B7280)
                                )
                            )
                        }

                        // Music Tabs
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0x0D000000))
                                .border(1.dp, Color(0x0F000000), RoundedCornerShape(16.dp))
                                .padding(4.dp)
                        ) {
                            listOf(
                                "online" to "Online Sync",
                                "device" to "Room Library (${musicTracks.size})"
                            ).forEach { (key, label) ->
                                Row(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (musicTab == key) Color.White else Color.Transparent
                                        )
                                        .clickable { musicTab = key }
                                        .padding(vertical = 10.dp),
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        label.uppercase(),
                                        color = if (musicTab == key) Color(0xFF111827) else Color(0x66000000),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // Tab content
                        if (musicTab == "online") {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 24.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    TextField(
                                        value = musicSearch,
                                        onValueChange = { musicSearch = it },
                                        singleLine = true,
                                        textStyle = androidx.compose.ui.text.TextStyle(
                                            color = Color(0xFF111827),
                                            fontSize = 14.sp
                                        ),
                                        placeholder = {
                                            Text(
                                                "Search tribe vibes...",
                                                color = Color(0x4D000000),
                                                fontSize = 14.sp
                                            )
                                        },
                                        colors = TextFieldDefaults.colors(
                                            focusedContainerColor = Color(0x0A000000),
                                            unfocusedContainerColor = Color(0x0A000000),
                                            focusedIndicatorColor = Color.Transparent,
                                            unfocusedIndicatorColor = Color.Transparent,
                                            disabledIndicatorColor = Color.Transparent,
                                            cursorColor = Color(0xFF111827)
                                        ),
                                        shape = RoundedCornerShape(16.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(48.dp)
                                            .border(1.dp, Color(0x14000000), RoundedCornerShape(16.dp))
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(Color(0xFF7C3AED)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.Search,
                                            contentDescription = "Search",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Text(
                                    "Search YouTube tracks",
                                    color = Color(0x66000000),
                                    textAlign = TextAlign.Center,
                                    fontSize = 14.sp,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 32.dp)
                                )
                            }
                        } else {
                            // Room Library
                            if (musicTracks.isEmpty()) {
                                Text(
                                    "No tracks in library",
                                    color = Color(0x66000000),
                                    textAlign = TextAlign.Center,
                                    fontSize = 14.sp,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 32.dp)
                                )
                            } else {
                                LazyColumn(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxWidth()
                                        .padding(horizontal = 24.dp),
                                    verticalArrangement = Arrangement.spacedBy(0.dp)
                                ) {
                                    items(musicTracks, key = { it.id }) { track ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 12.dp)
                                                .border(
                                                    width = 0.dp,
                                                    color = Color.Transparent
                                                ),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    track.name,
                                                    color = Color(0xFF111827),
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                if (track.uploaderName.isNotBlank()) {
                                                    Text(
                                                        track.uploaderName,
                                                        color = Color(0x66000000),
                                                        fontSize = 11.sp
                                                    )
                                                }
                                            }
                                            Spacer(Modifier.width(8.dp))
                                            Box(
                                                modifier = Modifier
                                                    .size(36.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0x12000000))
                                                    .clickable { handleSyncMusic(track) },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    Icons.Default.PlayArrow,
                                                    contentDescription = "Play",
                                                    tint = Color(0xFF111827),
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                            if (canManage) {
                                                Spacer(Modifier.width(8.dp))
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(CircleShape)
                                                        .background(Color(0x1AEF4444))
                                                        .clickable { handleDeleteTrack(track) },
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        Icons.Default.Delete,
                                                        contentDescription = "Delete",
                                                        tint = Color(0xFFEF4444),
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                }
                                            }
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

    // ── Clean Chat Confirm ──────────────────────────────────────────────────
    if (showCleanConfirm) {
        AlertDialog(
            onDismissRequest = { showCleanConfirm = false },
            title = { Text("Clean Chat", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to clear all messages in this room?") },
            confirmButton = {
                TextButton(onClick = {
                    showCleanConfirm = false
                    performClearChat()
                }) {
                    Text("Clear", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCleanConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // ── Info Alert ──────────────────────────────────────────────────────────
    infoAlert?.let { msg ->
        AlertDialog(
            onDismissRequest = { infoAlert = null },
            title = { Text("Ummy Chat", fontWeight = FontWeight.Bold) },
            text = { Text(msg) },
            confirmButton = {
                TextButton(onClick = { infoAlert = null }) {
                    Text("OK", fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // ── Delete Track Confirm ────────────────────────────────────────────────
    deleteTarget?.let { track ->
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            title = { Text("Delete Track", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to delete \"${track.name}\"?") },
            confirmButton = {
                TextButton(onClick = {
                    deleteTarget = null
                    scope.launch {
                        try {
                            if (track.storagePath.isNotBlank()) {
                                FirebaseStorage.getInstance().reference.child(track.storagePath)
                                    .delete().await()
                            }
                            Firebase.firestore.collection("chatRooms").document(room.id)
                                .collection("music").document(track.id).delete().await()
                            infoAlert = "Track removed from library."
                        } catch (e: Exception) {
                            infoAlert = e.message ?: "Delete failed"
                        }
                    }
                }) {
                    Text("Delete", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteTarget = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // ── Clearing Chat Indicator ─────────────────────────────────────────────
    if (isClearingChat) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Cleaning...") },
            text = { Text("Clearing all messages in this room.") },
            confirmButton = {}
        )
    }
}
