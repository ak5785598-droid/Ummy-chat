package app.vercel.ummy_chat.twa.ui.room

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingsSheet(
    roomId: String,
    participants: List<app.vercel.ummy_chat.twa.data.model.RoomParticipant> = emptyList(),
    ownerId: String = "",
    currentUid: String = "",
    onDismissRequest: () -> Unit
) {
    val firestore = FirebaseFirestore.getInstance()
    val context = LocalContext.current

    // Realtime Room Document State Variables
    var roomName by remember { mutableStateOf("") }
    var roomCover by remember { mutableStateOf("") }
    var roomAnnouncement by remember { mutableStateOf("") }
    var aiVoiceAssistant by remember { mutableStateOf(false) }
    var aiListen by remember { mutableStateOf(false) }
    var voiceCaptions by remember { mutableStateOf(false) }
    var superGlowMode by remember { mutableStateOf(false) }
    var maxSeats by remember { mutableStateOf(11) }
    var category by remember { mutableStateOf("Chat") }
    var roomPassword by remember { mutableStateOf("") }
    var moderatorIds by remember { mutableStateOf<List<String>>(emptyList()) }
    var bannedUsers by remember { mutableStateOf<List<String>>(emptyList()) }

    // Sub-Modal Visibility States (Managed internally in Settings Page)
    var showEditNameModal by remember { mutableStateOf(false) }
    var showAnnouncementModal by remember { mutableStateOf(false) }
    var showMicTestModal by remember { mutableStateOf(false) }
    var showSeatCountModal by remember { mutableStateOf(false) }
    var showPasswordModal by remember { mutableStateOf(false) }
    var showThemeModal by remember { mutableStateOf(false) }
    var showAiThemeModal by remember { mutableStateOf(false) }
    var showTagModal by remember { mutableStateOf(false) }
    var showAdminsModal by remember { mutableStateOf(false) }
    var showLogsModal by remember { mutableStateOf(false) }

    // User profile for theme ownership check
    var ownedItemIds by remember { mutableStateOf<List<String>>(emptyList()) }
    var itemExpiries by remember { mutableStateOf<Map<String, Any>>(emptyMap()) }
    var isOfficialUser by remember { mutableStateOf(false) }

    // Read user profile for theme ownership
    DisposableEffect(Unit) {
        val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid
        val reg = if (uid != null) {
            firestore.collection("users").document(uid).collection("profile").document(uid)
                .addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        @Suppress("UNCHECKED_CAST")
                        val inventory = snap.get("inventory") as? Map<*, *>
                        ownedItemIds = inventory?.get("ownedItems") as? List<String> ?: emptyList()
                        @Suppress("UNCHECKED_CAST")
                        itemExpiries = inventory?.get("expiries") as? Map<String, Any> ?: emptyMap()
                        @Suppress("UNCHECKED_CAST")
                        val tags = snap.get("tags") as? List<*> ?: emptyList<Any>()
                        isOfficialUser = tags.any { it.toString() in listOf("Official", "Admin", "Creator", "Super Admin") }
                    }
                }
        } else null
        onDispose { reg?.remove() }
    }

    // Realtime Listener
    DisposableEffect(roomId) {
        val docRef = firestore.collection("chatRooms").document(roomId)
        val registration = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener
            if (snapshot != null && snapshot.exists()) {
                roomName = snapshot.getString("title") ?: snapshot.getString("name") ?: ""
                roomAnnouncement = snapshot.getString("announcement") ?: ""
                roomCover = snapshot.getString("coverUrl") ?: snapshot.getString("roomCover") ?: ""
                aiVoiceAssistant = snapshot.getBoolean("isAIVoiceEnabled") ?: snapshot.getBoolean("aiVoiceAssistant") ?: false
                aiListen = snapshot.getBoolean("isAIListening") ?: snapshot.getBoolean("aiListen") ?: false
                voiceCaptions = snapshot.getBoolean("isCaptionsEnabled") ?: snapshot.getBoolean("voiceCaptions") ?: false
                superGlowMode = snapshot.getBoolean("isBrightMode") ?: snapshot.getBoolean("superGlowMode") ?: false
                maxSeats = (snapshot.get("maxSeats") as? Number)?.toInt() ?: (snapshot.get("maxActiveMics") as? Number)?.toInt() ?: 11
                category = snapshot.getString("category") ?: "Chat"
                roomPassword = snapshot.getString("password") ?: ""
                
                @Suppress("UNCHECKED_CAST")
                val mods = snapshot.get("moderatorIds") as? List<*> ?: snapshot.get("admins") as? List<*> ?: emptyList<Any>()
                moderatorIds = mods.mapNotNull { it?.toString() }
                
                @Suppress("UNCHECKED_CAST")
                val bans = snapshot.get("bannedUsers") as? List<*> ?: emptyList<Any>()
                bannedUsers = bans.mapNotNull { it?.toString() }
            }
        }
        onDispose {
            registration.remove()
        }
    }

    // Image Picker + Upload (matching RN flow)
    val scope = rememberCoroutineScope()
    var isUploadingCover by remember { mutableStateOf(false) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        uri?.let {
            isUploadingCover = true
            scope.launch {
                try {
                    val storage = FirebaseStorage.getInstance()
                    val ref = storage.reference.child("rooms/$roomId/cover.jpg")
                    ref.putFile(it).await()
                    val downloadUrl = ref.downloadUrl.await().toString()
                    firestore.collection("chatRooms").document(roomId)
                        .update("coverUrl", downloadUrl).await()
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    isUploadingCover = false
                }
            }
        }
    }

    // Helper to update toggle settings in Firestore
    fun updateToggleSetting(field: String, value: Boolean) {
        firestore.collection("chatRooms").document(roomId)
            .update(field, value)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .zIndex(999f)
            .background(Color.White)
            .statusBarsPadding()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
                // Header (Arrows & Title)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(onClick = onDismissRequest) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color(0xFF374151)
                        )
                    }

                    Text(
                        text = "SETTINGS",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF111827),
                        letterSpacing = 1.sp,
                        textAlign = TextAlign.Center
                    )

                    IconButton(
                        onClick = onDismissRequest,
                        modifier = Modifier.background(Color(0x1A7C3AED), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Color(0xFF7C3AED),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                HorizontalDivider(color = Color(0x14000000))

                // Scrollable content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp)
                ) {
                    // 1. Room Cover (matches RN: 60x60 rounded rect + camera badge)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                imagePickerLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            }
                            .padding(vertical = 12.dp, horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box {
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFFE5E7EB)),
                                contentAlignment = Alignment.Center
                            ) {
                                if (roomCover.isNotBlank()) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(roomCover),
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = null,
                                        tint = Color(0xFF9CA3AF),
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                                if (isUploadingCover) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(20.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                    }
                                }
                            }
                            if (!isUploadingCover) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .offset(x = 3.dp, y = 3.dp)
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF7C3AED))
                                        .border(2.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(10.dp)
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Room Cover",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF374151)
                            )
                            Text(
                                text = "Tap to change",
                                fontSize = 10.sp,
                                color = Color(0xFF9CA3AF),
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowRight,
                            contentDescription = null,
                            tint = Color(0x33000000),
                            modifier = Modifier.size(14.dp)
                        )
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 2. Room Name
                    SettingsItem(
                        icon = Icons.Default.Edit,
                        title = "Room Name",
                        value = roomName.takeIf { it.isNotBlank() } ?: "Set Name",
                        onClick = { showEditNameModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 3. Announcement
                    SettingsItem(
                        icon = Icons.Default.Campaign,
                        title = "Announcement",
                        value = roomAnnouncement.takeIf { it.isNotBlank() }?.let { if (it.length > 15) it.take(12) + "..." else it } ?: "Set Announcement",
                        onClick = { showAnnouncementModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 4. Microphone Test
                    SettingsItem(
                        icon = Icons.Default.Mic,
                        title = "Microphone Test",
                        onClick = { showMicTestModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 5. AI Voice Assistant
                    SettingsToggleItem(
                        icon = Icons.Default.SmartToy,
                        title = "AI Voice Assistant",
                        checked = aiVoiceAssistant,
                        onCheckedChange = {
                            aiVoiceAssistant = it
                            updateToggleSetting("isAIVoiceEnabled", it)
                            updateToggleSetting("aiVoiceAssistant", it)
                        }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 6. AI Listen
                    SettingsToggleItem(
                        icon = Icons.Default.Hearing,
                        title = "AI Listen",
                        checked = aiListen,
                        onCheckedChange = {
                            aiListen = it
                            updateToggleSetting("isAIListening", it)
                            updateToggleSetting("aiListen", it)
                        }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 7. Voice Captions
                    SettingsToggleItem(
                        icon = Icons.Default.ClosedCaption,
                        title = "Voice Captions",
                        checked = voiceCaptions,
                        onCheckedChange = {
                            voiceCaptions = it
                            updateToggleSetting("isCaptionsEnabled", it)
                            updateToggleSetting("voiceCaptions", it)
                        }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 8. Super Glow Mode
                    SettingsToggleItem(
                        icon = Icons.Default.Lightbulb,
                        title = "Super Glow Mode",
                        checked = superGlowMode,
                        onCheckedChange = {
                            superGlowMode = it
                            updateToggleSetting("isBrightMode", it)
                            updateToggleSetting("superGlowMode", it)
                        }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 9. Number of Mic Seats
                    SettingsItem(
                        icon = Icons.Default.EventSeat,
                        title = "Number of Mic Seats",
                        value = "$maxSeats Seats",
                        onClick = { showSeatCountModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 10. Room Password
                    SettingsItem(
                        icon = Icons.Default.Lock,
                        title = "Room Password",
                        value = if (roomPassword.isNotBlank()) "Locked 🔒" else "Unlocked 🔓",
                        onClick = { showPasswordModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 11. Room Theme
                    SettingsItem(
                        icon = Icons.Default.Palette,
                        title = "Room Theme",
                        onClick = { showThemeModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 12. AI Theme Architect
                    SettingsItem(
                        icon = Icons.Default.AutoAwesome,
                        title = "AI Theme Architect",
                        onClick = { showAiThemeModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 13. Room Tag
                    SettingsItem(
                        icon = Icons.Default.LocalOffer,
                        title = "Room Tag",
                        value = category,
                        onClick = { showTagModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 14. Administrators
                    SettingsItem(
                        icon = Icons.Default.AdminPanelSettings,
                        title = "Administrators",
                        value = "${moderatorIds.size} Admins",
                        onClick = { showAdminsModal = true }
                    )

                    HorizontalDivider(color = Color(0xFFF1F5F9), modifier = Modifier.padding(horizontal = 16.dp))

                    // 15. Room Entry & Kick Logs
                    SettingsItem(
                        icon = Icons.Default.List,
                        title = "Room Entry & Kick Logs",
                        value = "${bannedUsers.size} Banned",
                        onClick = { showLogsModal = true }
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }

    // Instantiated Sub-Modals
    RoomSettingsModals(
        roomId = roomId,
        showEditNameModal = showEditNameModal,
        showAnnouncementModal = showAnnouncementModal,
        showMicTestModal = showMicTestModal,
        showSeatCountModal = showSeatCountModal,
        showPasswordModal = showPasswordModal,
        showThemeModal = showThemeModal,
        showAiThemeModal = showAiThemeModal,
        showTagModal = showTagModal,
        showAdminsModal = showAdminsModal,
        showLogsModal = showLogsModal,
        onDismissEditName = { showEditNameModal = false },
        onDismissAnnouncement = { showAnnouncementModal = false },
        onDismissMicTest = { showMicTestModal = false },
        onDismissSeatCount = { showSeatCountModal = false },
        onDismissPassword = { showPasswordModal = false },
        onDismissTheme = { showThemeModal = false },
        onDismissAiTheme = { showAiThemeModal = false },
        onDismissTag = { showTagModal = false },
        onDismissAdmins = { showAdminsModal = false },
        onDismissLogs = { showLogsModal = false },
        currentRoomName = roomName,
        currentAnnouncement = roomAnnouncement,
        currentSeats = maxSeats,
        currentTag = category,
        currentAdmins = moderatorIds,
        currentBannedUsers = bannedUsers,
        ownedItemIds = ownedItemIds,
        itemExpiries = itemExpiries,
        isOfficialUser = isOfficialUser,
        participants = participants,
        ownerId = ownerId,
        currentUid = currentUid
    )
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    value: String? = null,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = Color(0xFF7C3AED), // Purple accent
            modifier = Modifier.size(22.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1E293B),
            modifier = Modifier.weight(1f)
        )
        if (value != null) {
            Text(
                text = value,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF64748B),
                modifier = Modifier.padding(end = 8.dp)
            )
        }
        Icon(
            imageVector = Icons.Default.KeyboardArrowRight,
            contentDescription = "Go",
            tint = Color(0xFF94A3B8),
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun SettingsToggleItem(
    icon: ImageVector,
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = Color(0xFF7C3AED),
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E293B)
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Color(0xFF7C3AED)
            )
        )
    }
}
