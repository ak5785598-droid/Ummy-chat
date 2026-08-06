package app.vercel.ummy_chat.twa.ui.room

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import app.vercel.ummy_chat.twa.util.CdnUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingsSheet(
    roomId: String,
    onDismissRequest: () -> Unit
) {
    val firestore = FirebaseFirestore.getInstance()

    // Realtime Room Document State Variables
    var roomName by remember { mutableStateOf("") }
    var roomCover by remember { mutableStateOf("") }
    var roomAnnouncement by remember { mutableStateOf("") }
    var aiVoiceAssistant by remember { mutableStateOf(false) }
    var aiListen by remember { mutableStateOf(false) }
    var voiceCaptions by remember { mutableStateOf(false) }
    var superGlowMode by remember { mutableStateOf(false) }
    var maxSeats by remember { mutableStateOf(9) }
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

    // Realtime Listener
    DisposableEffect(roomId) {
        val docRef = firestore.collection("chatRooms").document(roomId)
        val registration = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener
            if (snapshot != null && snapshot.exists()) {
                roomName = snapshot.getString("title") ?: snapshot.getString("name") ?: ""
                roomAnnouncement = snapshot.getString("announcement") ?: ""
                roomCover = snapshot.getString("roomCover") ?: snapshot.getString("coverUrl") ?: ""
                aiVoiceAssistant = snapshot.getBoolean("isAIVoiceEnabled") ?: snapshot.getBoolean("aiVoiceAssistant") ?: false
                aiListen = snapshot.getBoolean("isAIListening") ?: snapshot.getBoolean("aiListen") ?: false
                voiceCaptions = snapshot.getBoolean("isCaptionsEnabled") ?: snapshot.getBoolean("voiceCaptions") ?: false
                superGlowMode = snapshot.getBoolean("isBrightMode") ?: snapshot.getBoolean("superGlowMode") ?: false
                maxSeats = (snapshot.get("maxSeats") as? Number)?.toInt() ?: (snapshot.get("maxActiveMics") as? Number)?.toInt() ?: 9
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

    // Image Picker Launcher for Room Cover
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            firestore.collection("chatRooms").document(roomId)
                .update("roomCover", it.toString())
        }
    }

    // Helper to update toggle settings in Firestore
    fun updateToggleSetting(field: String, value: Boolean) {
        firestore.collection("chatRooms").document(roomId)
            .update(field, value)
    }

    // Render as a full-page sliding dialog
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFFF8F9FF) // Light, premium background
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
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Group 1: General Room Info
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            // 1. Room Cover
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { imagePickerLauncher.launch("image/*") }
                                    .padding(vertical = 14.dp, horizontal = 16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Image,
                                    contentDescription = "Room Cover",
                                    tint = Color(0xFF7C3AED),
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Text(
                                    text = "Room Cover",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF1E293B),
                                    modifier = Modifier.weight(1f)
                                )
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .border(1.5.dp, Color(0xFFE2E8F0), CircleShape)
                                        .background(Color(0xFFF1F5F9)),
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
                                            tint = Color(0xFF94A3B8),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowRight,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(20.dp)
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
                        }
                    }

                    // Group 2: Audio & AI Voice Tools
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
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
                        }
                    }

                    // Group 3: Seat, Lock & Category Settings
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
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
                        }
                    }

                    // Group 4: Moderation logs & admins
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
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
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
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
        currentBannedUsers = bannedUsers
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
