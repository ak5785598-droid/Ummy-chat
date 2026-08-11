package app.vercel.ummy_chat.twa.ui.home

import androidx.activity.ComponentActivity
import androidx.browser.customtabs.CustomTabsIntent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Castle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.data.repository.FollowedRoomEntry
import app.vercel.ummy_chat.twa.data.repository.HomeRealtimeRepository
import app.vercel.ummy_chat.twa.data.repository.LiveRoomModel
import app.vercel.ummy_chat.twa.data.repository.RecentVisitEntry
import app.vercel.ummy_chat.twa.data.repository.UserProfileData
import app.vercel.ummy_chat.twa.ui.components.RealtimeCpCard
import app.vercel.ummy_chat.twa.ui.components.RealtimeFamilyCard
import app.vercel.ummy_chat.twa.ui.components.RealtimeRankingCard
import app.vercel.ummy_chat.twa.ui.room.RoomViewModel
import com.google.firebase.auth.FirebaseAuth

// ============================================================
// React Native index.tsx → Kotlin Compose (EXACT PARITY)
// Source: src/app/(tabs)/index.tsx
// ============================================================

val CATEGORIES = listOf("All", "Chat", "Game", "Music", "Party")
private const val HELP_ROOM_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1"

@Composable
fun HomeScreen(
    onOpenRoom: (roomId: String) -> Unit,
    onOpenFamilies: () -> Unit = {},
    onOpenCpRanking: () -> Unit = {},
    onOpenLeaderboard: () -> Unit = {},
    onOpenSearch: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {}
) {
    // ── State Variables (React Native L27-38) ──
    var headerTab by remember { mutableStateOf("recommend") } 
    var meTab by remember { mutableStateOf("following") } 
    var activeCategory by remember { mutableStateOf("All") }
    var showRewardsModal by remember { mutableStateOf(false) }
    var showCreateRoom by remember { mutableStateOf(false) }
    var showSupportDialog by remember { mutableStateOf(false) }
    var refreshing by remember { mutableStateOf(false) }

    var lockedRoom by remember { mutableStateOf<LiveRoomModel?>(null) }
    var enteredPin by remember { mutableStateOf("") }
    var showPassModal by remember { mutableStateOf(false) }
    var pinError by remember { mutableStateOf(false) }
    var showNoRoomAlert by remember { mutableStateOf(false) }

    val repository = remember { HomeRealtimeRepository() }
    val currentUser = FirebaseAuth.getInstance().currentUser
    val uid = currentUser?.uid

    // ── Data State ──
    var liveRooms by remember { mutableStateOf<List<LiveRoomModel>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var profile by remember { mutableStateOf<UserProfileData?>(null) }
    var myRooms by remember { mutableStateOf<List<LiveRoomModel>>(emptyList()) }
    var followedEntries by remember { mutableStateOf<List<FollowedRoomEntry>>(emptyList()) }
    var recentEntries by remember { mutableStateOf<List<RecentVisitEntry>>(emptyList()) }

    val context = LocalContext.current
    val roomVm: RoomViewModel = androidx.lifecycle.viewmodel.compose.viewModel(context as ComponentActivity)
    val activeRoom by roomVm.room.collectAsState()
    val activeRoomId = activeRoom?.id

    // ── Data Loaders ──
    LaunchedEffect(Unit) {
        repository.getLiveRoomsStream().collect { rooms ->
            liveRooms = rooms
            isLoading = false
        }
    }
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        repository.getUserProfileStream(uid).collect { profile = it }
    }
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        repository.getMyRoomsStream(uid).collect { myRooms = it }
    }
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        repository.getFollowedRoomsStream(uid).collect { followedEntries = it }
    }
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        repository.getRecentVisitsStream(uid).collect { recentEntries = it }
    }

    // ── Room Processing (React Native L162-213) ──
    val displayRooms = remember(liveRooms, activeCategory, activeRoomId) {
        val filtered = liveRooms.filter { room ->
            val cat = room.category.ifEmpty { "Chat" }
            val matchesCategory = activeCategory == "All" || cat.equals(activeCategory, ignoreCase = true)
            val isDecommissioned = room.title.contains("SYNCHRONIZING", ignoreCase = true)
            val roomName = room.title.lowercase().trim()
            val isOriginalHelp = room.id == HELP_ROOM_ID || roomName == "ummy help"
            val looksLikeHelp = roomName.contains("help")
            if (looksLikeHelp && !isOriginalHelp) return@filter false
            matchesCategory && !isDecommissioned
        }.map { room ->
            val isCurrentActive = if (room.id == activeRoomId) 1 else 0
            // HomeRealtimeRepository already provides the RTDB count in room.participantCount
            room.copy(participantCount = maxOf(room.participantCount, isCurrentActive))
        }.filter { room ->
            val isOriginalHelp = room.id == HELP_ROOM_ID || room.title.lowercase().trim() == "ummy help"
            val isPinned = room.isPinned
            val hasLiveUsers = room.participantCount > 0
            hasLiveUsers || isPinned || isOriginalHelp
        }.sortedWith(compareBy<LiveRoomModel> {
            if (it.id == HELP_ROOM_ID) 0 else 1
        }.thenBy {
            if (it.isPinned) 0 else 1
        }.thenByDescending {
            it.participantCount
        })
        filtered
    }

    val followedRoomData = remember(followedEntries, liveRooms) {
        followedEntries.mapNotNull { entry -> liveRooms.firstOrNull { it.id == entry.roomId } }
    }
    val recentRoomData = remember(recentEntries, liveRooms) {
        val oneDayAgo = System.currentTimeMillis() - 86_400_000L
        recentEntries.filter { it.visitedAt > oneDayAgo }
            .map { entry ->
                val liveRoom = liveRooms.firstOrNull { it.id == entry.roomId }
                liveRoom ?: LiveRoomModel(
                    id = entry.roomId,
                    title = entry.title,
                    coverUrl = entry.coverUrl,
                    roomNumber = entry.roomNumber,
                    ownerUid = entry.ownerId,
                    participantCount = 0
                )
            }
    }

    fun enterRoom(room: LiveRoomModel) {
        val isOwner = uid == room.ownerUid
        val isMod = uid != null && room.moderatorIds.contains(uid)
        if (room.isLocked && !isOwner && !isMod) {
            lockedRoom = room
            enteredPin = ""
            pinError = false
            showPassModal = true
            return
        }
        onOpenRoom(room.id)
    }

    // React Native L303-310: handleOpenSupport → show RoomSupportDialog or prompt create
    fun handleOpenSupport() {
        if (myRooms.isNotEmpty()) {
            showSupportDialog = true
        } else {
            showNoRoomAlert = true
        }
    }

    // React Native L157-159: banner link navigation (router.push with replaces)
    fun handleBannerLink(link: String) {
        val resolved = link.replace("/cp-challenge", "/cp-house")
        when {
            resolved.startsWith("/leaderboard") -> onOpenLeaderboard()
            resolved.startsWith("/families") -> onOpenFamilies()
            resolved.startsWith("/cp-ranking") -> onOpenCpRanking()
            resolved.startsWith("/cp-house") -> onOpenCpRanking()
            resolved.startsWith("http") -> {
                try {
                    val builder = CustomTabsIntent.Builder()
                    builder.setShowTitle(true)
                    val customTabsIntent = builder.build()
                    customTabsIntent.launchUrl(context, Uri.parse(resolved))
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            else -> Unit // other links ignored (native equivalent not available)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // ── Background Gradients (React Native L208-210) ──
        Column(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.fillMaxWidth().height(96.dp).background(Color(0xFFC084FC)))
            Box(modifier = Modifier.fillMaxWidth().height(128.dp).background(
                Brush.verticalGradient(listOf(Color(0xFFC084FC), Color(0x00C084FC)))
            ))
        }

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // ── Top Bar (React Native L286-304) ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-12).dp)
                    .padding(horizontal = 20.dp, vertical = 8.dp), 
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Recommend",
                        color = if (headerTab == "recommend") Color.Black else Color.Gray,
                        fontWeight = FontWeight.Bold, fontSize = 20.sp,
                        modifier = Modifier.clickable { headerTab = "recommend" })
                    Text("Me", 
                        color = if (headerTab == "me") Color.Black else Color.Gray,
                        fontWeight = FontWeight.Bold, fontSize = 20.sp,
                        modifier = Modifier.clickable { headerTab = "me" })
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.8f)).border(1.dp, Color.White.copy(alpha = 0.8f), CircleShape).clickable { onOpenSearch() }, contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Search, null, tint = Color(0xFF1E293B), modifier = Modifier.size(18.dp))
                    }
                    Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color(0xFF1E293B)).clickable {
                        if (myRooms.isNotEmpty()) enterRoom(myRooms.first()) else showCreateRoom = true
                    }, contentAlignment = Alignment.Center) {
                        Icon(if (myRooms.isNotEmpty()) Icons.Default.Castle else Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            }

            if (headerTab == "recommend") {
                // ── Recommend View ──
                LazyColumn(
                    modifier = Modifier.fillMaxSize(), // Removed negative offset to move down
                    contentPadding = PaddingValues(bottom = 96.dp)
                ) {
                    item { 
                        Box(modifier = Modifier.padding(horizontal = 8.dp).padding(top = 4.dp)) { 
                            BannerCarousel(onBannerClick = ::handleBannerLink, onOpenSupport = ::handleOpenSupport) 
                        } 
                    }
                    
                    item {
                        // Combined Cards and Category Bar (Tightened)
                        Column(modifier = Modifier.fillMaxWidth().padding(top = 0.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp).offset(y = (-8).dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(modifier = Modifier.weight(1f).aspectRatio(1.4f)) { RealtimeRankingCard(onPress = onOpenLeaderboard) }
                                Box(modifier = Modifier.weight(1f).aspectRatio(1.4f)) { RealtimeFamilyCard(onPress = onOpenFamilies) }
                                Box(modifier = Modifier.weight(1f).aspectRatio(1.4f)) { RealtimeCpCard(onPress = onOpenCpRanking) }
                            }
                            
                            // Category Bar pushed up tight
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 8.dp), 
                                horizontalArrangement = Arrangement.spacedBy(8.dp), 
                                modifier = Modifier.offset(y = (-4).dp) // Reduced negative offset to move down
                            ) {
                                items(CATEGORIES) { cat ->
                                    val isSelected = activeCategory == cat
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp)) // Reduced roundness from CircleShape
                                            .background(if (isSelected) Color(0xFF1E293B) else Color.White)
                                            .border(1.dp, if (isSelected) Color(0xFF1E293B) else Color(0xFFE2E8F0).copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                                            .clickable { activeCategory = cat }
                                            .padding(horizontal = 12.dp, vertical = 6.dp), 
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(cat.uppercase(), color = if (isSelected) Color.White else Color(0xFF64748B), fontWeight = FontWeight.Black, fontSize = 10.sp, letterSpacing = 1.sp)
                                    }
                                }
                            }
                            HorizontalDivider(modifier = Modifier.padding(top = 0.dp), color = Color(0xFFF1F5F9).copy(alpha = 0.5f), thickness = 0.5.dp)
                        }
                    }

                    if (isLoading) {
                        item { Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFCBD5E1), modifier = Modifier.size(24.dp)) } }
                    } else if (displayRooms.isEmpty()) {
                        item { Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) { Text("NO ACTIVE ROOMS", color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.sp) } }
                    } else {
                        items(displayRooms.chunked(2)) { pair ->
                            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp).padding(top = 2.dp)) {
                                pair.forEach { room -> ChatRoomCard(room = room, onPress = { enterRoom(room) }) }
                                if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            } else {
                // ── Me View ──
                LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 16.dp), contentPadding = PaddingValues(bottom = 80.dp)) {
                    item {
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth().border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp).clickable { onNavigateToProfile() },
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Avatar
                                AsyncImage(
                                    model = profile?.avatarUrl?.ifBlank { "https://picsum.photos/200" } ?: "https://picsum.photos/200",
                                    contentDescription = null,
                                    modifier = Modifier.size(64.dp).clip(CircleShape).border(1.dp, Color(0xFFE2E8F0), CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                                
                                Spacer(modifier = Modifier.width(16.dp))
                                
                                // Info
                                Column(modifier = Modifier.weight(1f)) {
                                    val isRoomActive = myRooms.isNotEmpty()
                                    val mainText = if (isRoomActive) myRooms.first().title else (profile?.username ?: "User")
                                    val subText = if (isRoomActive) {
                                        myRooms.first().announcement.ifBlank { "No announcement set." }
                                    } else {
                                        "Create a room to go live!"
                                    }

                                    Text(
                                        text = mainText,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 18.sp,
                                        color = Color(0xFF0F172A),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = subText,
                                        fontSize = 12.sp,
                                        color = Color(0xFF64748B),
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                
                                // My Room / Create Button
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color(0xFF0F172A))
                                        .clickable { 
                                            if (myRooms.isNotEmpty()) enterRoom(myRooms.first()) else showCreateRoom = true
                                        }
                                        .padding(horizontal = 14.dp, vertical = 10.dp)
                                ) {
                                    Text(
                                        if (myRooms.isNotEmpty()) "MY ROOM" else "CREATE",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 10.sp,
                                        letterSpacing = 1.sp
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.padding(bottom = 16.dp)) {
                            Text("Following", color = if (meTab == "following") Color(0xFF1E293B) else Color(0xFF94A3B8), fontWeight = FontWeight.Bold, modifier = Modifier.clickable { meTab = "following" })
                            Text("Recent", color = if (meTab == "recent") Color(0xFF1E293B) else Color(0xFF94A3B8), fontWeight = FontWeight.Bold, modifier = Modifier.clickable { meTab = "recent" })
                        }
                    }
                    val meRooms = if (meTab == "following") followedRoomData else recentRoomData
                    if (meRooms.isEmpty()) {
                        item { Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) { Text("NO DATA", color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold, fontSize = 12.sp) } }
                    } else {
                        items(meRooms.chunked(2)) { pair ->
                            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                                pair.forEach { room -> ChatRoomCard(room = room, onPress = { enterRoom(room) }) }
                                if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }

        // ── Floating Calendar (React Native L408-413) ──
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 144.dp) // bottom-36 right-4
                .clip(CircleShape)
                .clickable { showRewardsModal = true }
                .shadow(8.dp, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            GlossyCalendarIcon(size = 58.dp) // RN native-svgs.tsx GlossyCalendarIcon
        }

        if (showPassModal && lockedRoom != null) {
            Dialog(onDismissRequest = { showPassModal = false }) {
                Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color.White).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(56.dp).clip(CircleShape).background(Color(0xFFFEF2F2)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(28.dp))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Locked Room", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color(0xFF0F172A))
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("This voice room is private. Please enter the 4-digit room password PIN to enter.", fontSize = 12.sp, color = Color(0xFF64748B), textAlign = TextAlign.Center)
                    Spacer(modifier = Modifier.height(20.dp))
                    OutlinedTextField(
                        value = enteredPin,
                        onValueChange = { enteredPin = it; pinError = false },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = if (pinError) Color(0xFFEF4444) else Color(0xFF7C3AED),
                            unfocusedBorderColor = if (pinError) Color(0xFFEF4444) else Color(0xFFE2E8F0)
                        ),
                        placeholder = { Text("Enter Room PIN", color = Color(0xFF94A3B8)) }
                    )
                    if (pinError) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Incorrect PIN. Please try again.", color = Color(0xFFEF4444), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(onClick = { showPassModal = false }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9)), shape = RoundedCornerShape(14.dp)) { Text("Cancel", color = Color(0xFF64748B), fontWeight = FontWeight.ExtraBold) }
                        Button(onClick = {
                            if (enteredPin == lockedRoom!!.password) {
                                val room = lockedRoom!!
                                showPassModal = false
                                lockedRoom = null
                                enteredPin = ""
                                pinError = false
                                onOpenRoom(room.id)
                            } else {
                                enteredPin = ""
                                pinError = true
                            }
                        }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)), shape = RoundedCornerShape(14.dp)) { Text("Unlock & Join", color = Color.White, fontWeight = FontWeight.ExtraBold) }
                    }
                }
            }
        }

        // React Native L303-310: Support alert (no own room → prompt to create one)
        if (showNoRoomAlert) {
            AlertDialog(
                onDismissRequest = { showNoRoomAlert = false },
                title = { Text("No Room Found", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color(0xFF0F172A)) },
                text = { Text("You need to create your own room first to configure support targets!", fontSize = 13.sp, color = Color(0xFF64748B)) },
                confirmButton = {
                    TextButton(onClick = { showNoRoomAlert = false; showCreateRoom = true }) {
                        Text("Create Room", color = Color(0xFF7C3AED), fontWeight = FontWeight.ExtraBold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showNoRoomAlert = false }) {
                        Text("Cancel", color = Color(0xFF64748B), fontWeight = FontWeight.ExtraBold)
                    }
                }
            )
        }

        // React Native L408-413: DailyRewardsModal + CreateRoomSheet
        DailyRewardsModal(visible = showRewardsModal, onClose = { showRewardsModal = false })
        CreateRoomSheet(
            visible = showCreateRoom,
            onClose = { showCreateRoom = false },
            onRoomCreated = { roomId -> onOpenRoom(roomId) }
        )
    }
}
