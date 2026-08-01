package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.data.repository.HomeRealtimeRepository
import app.vercel.ummy_chat.twa.data.repository.LiveRoomModel
import app.vercel.ummy_chat.twa.ui.components.RealtimeCpCard
import app.vercel.ummy_chat.twa.ui.components.RealtimeFamilyCard
import app.vercel.ummy_chat.twa.ui.components.RealtimeRankingCard
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.FirebaseFirestore

// ============================================================
// React Native index.tsx → Kotlin Compose (1-to-1 Line Match)
// Source: src/app/(tabs)/index.tsx (557 lines)
// ============================================================

// React Native L23: const CATEGORIES = ['All', 'Chat', 'Game', 'Music', 'Party'];
val HOME_CATEGORIES = listOf("All", "Chat", "Game", "Music", "Party")

// React Native L90: const HELP_ROOM_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';
private const val HELP_ROOM_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1"

@Composable
fun HomeScreen(
    onOpenRoom: (roomId: String) -> Unit,
    onOpenFamilies: () -> Unit = {},
    onOpenCpRanking: () -> Unit = {}
) {
    // ── State Variables (React Native L27-38) ──
    var headerTab by remember { mutableStateOf("recommend") } // React Native L28: 'recommend' | 'me'
    var meSubTab by remember { mutableStateOf("following") } // React Native L29: 'following' | 'recent'
    var selectedCategory by remember { mutableStateOf("All") } // React Native L27: activeCategory
    var showRewardsModal by remember { mutableStateOf(false) } // React Native L30
    var showCreateRoom by remember { mutableStateOf(false) } // React Native L31
    var refreshing by remember { mutableStateOf(false) } // React Native L33

    // Password Lock Modal States (React Native L36-38)
    var lockedRoom by remember { mutableStateOf<LiveRoomModel?>(null) }
    var enteredPin by remember { mutableStateOf("") }
    var showPassModal by remember { mutableStateOf(false) }

    // ── Firebase & Room Data ──
    var liveRooms by remember { mutableStateOf<List<LiveRoomModel>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val repository = remember { HomeRealtimeRepository() }

    // ── RTDB Presence Tracking (React Native L48-85) ──
    var roomsWithUsersMap by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }

    DisposableEffect(Unit) {
        val database = FirebaseDatabase.getInstance()
        val presenceRef = database.getReference("roomPresence")

        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val countsMap = mutableMapOf<String, Int>()
                val now = System.currentTimeMillis()

                snapshot.children.forEach { roomSnapshot ->
                    val roomId = roomSnapshot.key ?: return@forEach
                    var onlineCount = 0

                    roomSnapshot.children.forEach { userSnapshot ->
                        val isOnline = userSnapshot.child("isOnline").getValue(Boolean::class.java) ?: false
                        val lastSeen = userSnapshot.child("lastSeen").getValue(Long::class.java) ?: 0L

                        // React Native L66-69: Must be online AND not stale (30s threshold)
                        if (isOnline && (lastSeen == 0L || (now - lastSeen) <= 30000)) {
                            onlineCount++
                        }
                    }

                    if (onlineCount > 0) {
                        countsMap[roomId] = onlineCount
                    }
                }

                roomsWithUsersMap = countsMap
            }

            override fun onCancelled(error: DatabaseError) {
                // React Native L79-81: console.error
            }
        }

        presenceRef.addValueEventListener(listener)
        onDispose { presenceRef.removeEventListener(listener) }
    }

    // ── Collect Firestore Rooms Stream ──
    LaunchedEffect(Unit) {
        repository.getLiveRoomsStream().collect { rooms ->
            liveRooms = rooms
            isLoading = false
        }
    }

    // ── Room Display Logic (React Native L162-213) ──
    // Sort: Help room first → Pinned → Active (highest live count)
    // Filter: Only rooms with live users OR pinned OR help room
    val displayRooms = remember(liveRooms, selectedCategory, roomsWithUsersMap) {
        val filtered = liveRooms.filter { room ->
            val cat = room.category.ifEmpty { "Chat" }
            val matchesCategory = selectedCategory == "All" || cat.equals(selectedCategory, ignoreCase = true)

            // React Native L172: Filter decommissioned rooms
            val isDecommissioned = room.title.contains("SYNCHRONIZING", ignoreCase = true)

            // React Native L174-176: Filter fake help rooms
            val roomName = room.title.lowercase().trim()
            val isOriginalHelp = room.id == HELP_ROOM_ID || roomName == "ummy help"
            val looksLikeHelp = roomName.contains("help")
            if (looksLikeHelp && !isOriginalHelp) return@filter false

            matchesCategory && !isDecommissioned
        }

        // React Native L179-184: Map with RTDB live count
        val mapped = filtered.map { room ->
            val rtdbCount = roomsWithUsersMap[room.id] ?: 0
            val liveOnlineCount = maxOf(rtdbCount, 0)
            room.copy(participantCount = liveOnlineCount)
        }

        // React Native L187-192: Only rooms with active users OR pinned OR help
        val activeRoomsOnly = mapped.filter { room ->
            val isOriginalHelp = room.id == HELP_ROOM_ID || room.title.lowercase().trim() == "ummy help"
            val isPinned = room.isPinned
            val hasLiveUsers = room.participantCount > 0
            hasLiveUsers || isPinned || isOriginalHelp
        }

        // React Native L195-208: Sort order
        activeRoomsOnly.sortedWith(compareBy<LiveRoomModel> {
            if (it.id == HELP_ROOM_ID) 0 else 1 // Help room first
        }.thenBy {
            if (it.isPinned) 0 else 1 // Pinned rooms second
        }.thenByDescending {
            it.participantCount // Highest live count
        })
    }

    val filteredByCategory = if (selectedCategory == "All") displayRooms
    else displayRooms.filter { it.category.equals(selectedCategory, ignoreCase = true) }

    // ── Room Enter Logic (React Native L215-236 enterRoom) ──
    val currentUser = FirebaseAuth.getInstance().currentUser

    fun enterRoom(room: LiveRoomModel) {
        // React Native L217-222: Password Lock Gate
        val isOwner = currentUser?.uid == room.ownerUid
        if (room.isLocked && !isOwner) {
            lockedRoom = room
            enteredPin = ""
            showPassModal = true
            return
        }
        onOpenRoom(room.id)
    }

    // ============================================================
    // ⚡ UI RENDER (React Native L275-556) ⚡
    // ============================================================
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC)) // React Native L276: bg-white / slate-50
    ) {
        // ── Background Gradient Cover (React Native L278-284) ──
        // colors={['#c084fc', 'rgba(192, 132, 252, 0.4)', 'transparent']}
        Column(modifier = Modifier.fillMaxWidth()) {
            // React Native L279: h-6 bg-purple-400
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(24.dp)
                    .background(Color(0xFFC084FC))
            )
            // React Native L280-283: h-56 LinearGradient
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(224.dp) // h-56 = 224dp
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                Color(0xFFC084FC),
                                Color(0xFFC084FC).copy(alpha = 0.4f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }

        Column(modifier = Modifier.fillMaxSize()) {
            // ── Header Bar (React Native L286-304) ──
            // flex-row items-center justify-between px-4 pt-2 pb-3
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp), // px-4 pt-2 pb-3
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left: Recommend / Me tabs (React Native L288-296)
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) { // gap-4
                    // React Native L289-292: Recommend tab
                    Text(
                        text = "Recommend",
                        color = if (headerTab == "recommend") Color.Black else Color.Gray,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp, // text-xl
                        modifier = Modifier.clickable { headerTab = "recommend" }
                    )
                    // React Native L293-296: Me tab
                    Text(
                        text = "Me",
                        color = if (headerTab == "me") Color.Black else Color.Gray,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        modifier = Modifier.clickable { headerTab = "me" }
                    )
                }

                // Right: Search + Create Room (React Native L298-303)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp), // gap-2
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Search icon (React Native L299-300): bg-white/80 rounded-2xl border border-white/80
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                            .background(Color.White.copy(alpha = 0.8f))
                            .border(1.dp, Color.White.copy(alpha = 0.8f), RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔍", fontSize = 16.sp)
                    }

                    // Create Room button (React Native L301-303): bg-slate-800 rounded-full
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape) // rounded-full
                            .background(Color(0xFF1E293B)) // bg-slate-800
                            .clickable { showCreateRoom = true },
                        contentAlignment = Alignment.Center
                    ) {
                        // React Native L302: hasOwnRoom ? Castle : Plus
                        Text("➕", color = Color.White, fontSize = 16.sp)
                    }
                }
            }

            // ── Content Area ──
            if (headerTab == "recommend") {
                // ── RECOMMEND TAB (React Native L307-355) ──
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 80.dp) // pb-24
                ) {
                    // ── BannerCarousel (React Native L308-310) ──
                    item {
                        Box(modifier = Modifier.padding(horizontal = 12.dp)) { // px-3
                            BannerCarousel()
                        }
                    }

                    // ── 3 Podium Cards Row (React Native L312-319) ──
                    // RankingCard + FamilyCard + CpCard
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(start = 22.dp, end = 6.dp), // paddingLeft: 22, paddingRight: 6
                            horizontalArrangement = Arrangement.spacedBy(12.dp), // gap-3
                            modifier = Modifier.padding(top = 4.dp) // marginTop: 4
                        ) {
                            item {
                                Box(modifier = Modifier.width(280.dp)) {
                                    RealtimeRankingCard(onPress = { /* Navigate to leaderboard */ })
                                }
                            }
                            item {
                                Box(modifier = Modifier.width(280.dp)) {
                                    RealtimeFamilyCard(onPress = onOpenFamilies)
                                }
                            }
                            item {
                                Box(modifier = Modifier.width(280.dp)) {
                                    RealtimeCpCard(onPress = onOpenCpRanking)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp)) // mb-1
                    }

                    // ── Sticky Category Bar (React Native L322-337) ──
                    // px-3 py-2 border-b border-slate-100 flex-row mt-[-8px]
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 12.dp), // px-3
                            horizontalArrangement = Arrangement.spacedBy(8.dp), // gap-2
                            modifier = Modifier.padding(vertical = 8.dp) // py-2
                        ) {
                            items(HOME_CATEGORIES) { cat ->
                                val isSelected = selectedCategory == cat
                                // React Native L329-334: rounded-full shadow-sm border
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp)) // rounded-full
                                        .background(
                                            if (isSelected) Color(0xFF1E293B) // bg-slate-800
                                            else Color.White
                                        )
                                        .border(
                                            1.dp,
                                            if (isSelected) Color(0xFF1E293B) // border-slate-800
                                            else Color(0xFFE2E8F0).copy(alpha = 0.8f), // border-slate-200/80
                                            RoundedCornerShape(20.dp)
                                        )
                                        .clickable { selectedCategory = cat }
                                        .padding(horizontal = 12.dp, vertical = 6.dp), // px-3 py-1.5
                                    contentAlignment = Alignment.Center
                                ) {
                                    // React Native L335: text-[10px] font-black uppercase tracking-wider
                                    Text(
                                        text = cat.uppercase(),
                                        color = if (isSelected) Color.White else Color(0xFF64748B), // text-slate-500
                                        fontWeight = FontWeight.Black,
                                        fontSize = 10.sp // text-[10px]
                                    )
                                }
                            }
                        }

                        // React Native L322: border-b border-slate-100
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(Color(0xFFF1F5F9))
                        )
                    }

                    // ── Room Grid (React Native L339-354) ──
                    // flex-row flex-wrap px-2 pt-0 pb-24
                    if (isLoading) {
                        // React Native L340-343: Loading state
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        color = Color(0xFFCBD5E1)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "LOADING...",
                                        color = Color(0xFF94A3B8), // text-slate-400
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    } else if (filteredByCategory.isEmpty()) {
                        // React Native L350-352: No Active Rooms
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "NO ACTIVE ROOMS",
                                    color = Color(0xFF94A3B8),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    } else {
                        // React Native L345-349: ChatRoomCard grid (flex-row flex-wrap, 48% width)
                        items(filteredByCategory.chunked(2)) { pair ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 0.dp), // px-2
                                horizontalArrangement = Arrangement.spacedBy(0.dp)
                            ) {
                                pair.forEach { room ->
                                    ChatRoomCard(
                                        room = room,
                                        onPress = { enterRoom(room) }
                                    )
                                }
                                if (pair.size == 1) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            } else {
                // ── ME TAB (React Native L357-396) ──
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp, vertical = 16.dp), // px-4 pt-4
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    // ── Profile Card (React Native L358-380) ──
                    // bg-white rounded-2xl p-4 shadow-sm border border-slate-100
                    item {
                        val user = FirebaseAuth.getInstance().currentUser
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                                .background(Color.White)
                                .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp)) // border-slate-100
                                .padding(16.dp), // p-4
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // React Native L360-362: Avatar w-16 h-16 rounded-full
                            AsyncImage(
                                model = user?.photoUrl?.toString() ?: "https://picsum.photos/200",
                                contentDescription = "Avatar",
                                modifier = Modifier
                                    .size(64.dp) // w-16 h-16
                                    .clip(CircleShape)
                                    .border(1.dp, Color(0xFFE2E8F0), CircleShape),
                                contentScale = ContentScale.Crop
                            )

                            Spacer(modifier = Modifier.width(16.dp)) // mr-4

                            Column(modifier = Modifier.weight(1f)) {
                                // React Native L365: text-lg font-bold text-slate-800
                                Text(
                                    text = user?.displayName ?: "User",
                                    color = Color(0xFF1E293B), // text-slate-800
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp // text-lg
                                )
                                // React Native L366: text-sm text-slate-500
                                Text(
                                    text = "ID: ${user?.uid?.take(6) ?: "000000"}",
                                    color = Color(0xFF64748B), // text-slate-500
                                    fontSize = 14.sp // text-sm
                                )
                                Spacer(modifier = Modifier.height(4.dp)) // mt-1
                                // React Native L368: text-amber-600 font-bold text-sm
                                Text(
                                    text = "0 Coins",
                                    color = Color(0xFFD97706), // text-amber-600
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }

                            // React Native L372-379: My Room / Create button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp)) // rounded-2xl
                                    .background(Color(0xFF0F172A)) // bg-slate-900
                                    .clickable { showCreateRoom = true }
                                    .padding(horizontal = 16.dp, vertical = 8.dp), // px-4 py-2
                            ) {
                                // React Native L376: text-white text-xs font-bold uppercase tracking-widest
                                Text(
                                    text = "CREATE",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp)) // mb-4
                    }

                    // ── Following / Recent Tabs (React Native L382-390) ──
                    item {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp), // gap-4
                            modifier = Modifier.padding(bottom = 16.dp)
                        ) {
                            // React Native L383-386: Following tab
                            Text(
                                text = "Following",
                                color = if (meSubTab == "following") Color(0xFF1E293B) else Color(0xFF94A3B8),
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp, // text-base
                                modifier = Modifier.clickable { meSubTab = "following" }
                            )
                            // React Native L387-390: Recent tab
                            Text(
                                text = "Recent",
                                color = if (meSubTab == "recent") Color(0xFF1E293B) else Color(0xFF94A3B8),
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.clickable { meSubTab = "recent" }
                            )
                        }
                    }

                    // ── Empty States (React Native L392-406) ──
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (meSubTab == "following") "NO FOLLOWED ROOMS" else "NO RECENT VISITS",
                                color = Color(0xFF94A3B8), // text-slate-400
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }

        // ── Floating Calendar Icon (React Native L408-413) ──
        // absolute bottom-36 right-4 z-50
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 144.dp) // bottom-36 right-4
                .size(58.dp) // 58x58
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF8B5CF6), Color(0xFF6366F1))
                    )
                )
                .clickable { showRewardsModal = true },
            contentAlignment = Alignment.Center
        ) {
            Text("📅", fontSize = 24.sp)
        }

        // ============================================================
        // ⚡ DAILY REWARDS MODAL (React Native L415) ⚡
        // ============================================================
        if (showRewardsModal) {
            DailyRewardsModal(
                visible = showRewardsModal,
                onClose = { showRewardsModal = false }
            )
        }

        // ============================================================
        // ⚡ CREATE ROOM SHEET (React Native L416-419) ⚡
        // ============================================================
        if (showCreateRoom) {
            CreateRoomSheet(
                visible = showCreateRoom,
                onClose = { showCreateRoom = false },
                onRoomCreated = { roomId -> onOpenRoom(roomId) }
            )
        }

        // ============================================================
        // ⚡ PASSWORD LOCK MODAL (React Native L422-465) ⚡
        // ============================================================
        if (showPassModal && lockedRoom != null) {
            Dialog(onDismissRequest = { showPassModal = false }) {
                // React Native L427: maxWidth: 340, bg: '#fff', borderRadius: 24, padding: 24
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color.White)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // React Native L428-430: Lock icon in red circle
                    // w-56 h-56 borderRadius: 28 bg: '#fef2f2'
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFEF2F2)), // #fef2f2
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔒", fontSize = 28.sp) // Lock size={28} color="#ef4444"
                    }

                    Spacer(modifier = Modifier.height(16.dp)) // marginBottom: 16

                    // React Native L432-434: Title
                    Text(
                        text = "Locked Room",
                        color = Color(0xFF0F172A), // #0f172a
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp)) // marginBottom: 6

                    // React Native L435-437: Description
                    Text(
                        text = "This voice room is private. Please enter the 4-digit room password PIN to enter.",
                        color = Color(0xFF64748B), // #64748b
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(20.dp)) // marginBottom: 20

                    // React Native L439-452: PIN Input
                    // height: 50, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14
                    OutlinedTextField(
                        value = enteredPin,
                        onValueChange = { enteredPin = it },
                        placeholder = {
                            Text(
                                "Enter Room PIN",
                                color = Color(0xFF94A3B8),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth()
                            )
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color(0xFF0F172A),
                            unfocusedTextColor = Color(0xFF0F172A),
                            focusedBorderColor = Color(0xFF7C3AED),
                            unfocusedBorderColor = Color(0xFFE2E8F0),
                            focusedContainerColor = Color(0xFFF8FAFC),
                            unfocusedContainerColor = Color(0xFFF8FAFC)
                        ),
                        shape = RoundedCornerShape(14.dp)
                    )

                    Spacer(modifier = Modifier.height(20.dp)) // marginBottom: 20

                    // React Native L454-465: Cancel & Unlock buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp) // gap: 12
                    ) {
                        // Cancel button (React Native L455-458)
                        // flex: 1, h: 48, borderRadius: 14, bg: '#f1f5f9'
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFF1F5F9)) // #f1f5f9
                                .clickable { showPassModal = false },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Cancel",
                                color = Color(0xFF64748B), // #64748b
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.sp
                            )
                        }

                        // Unlock & Join button (React Native L459-462)
                        // flex: 1, h: 48, borderRadius: 14, bg: '#7c3aed'
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF7C3AED)) // #7c3aed
                                .clickable {
                                    // React Native handleUnlockAndEnter L237-249
                                    showPassModal = false
                                    lockedRoom?.let { room ->
                                        onOpenRoom(room.id)
                                    }
                                    lockedRoom = null
                                    enteredPin = ""
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Unlock & Join",
                                color = Color.White, // #fff
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
