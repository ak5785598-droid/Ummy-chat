package app.vercel.ummy_chat.twa.ui.room

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.compose.ui.res.painterResource
import androidx.lifecycle.viewmodel.compose.viewModel
import app.vercel.ummy_chat.twa.data.model.GiftModel
import app.vercel.ummy_chat.twa.data.model.RoomModel
import app.vercel.ummy_chat.twa.data.model.SeatModel
import app.vercel.ummy_chat.twa.ui.gift.GiftBottomSheet
import android.graphics.Bitmap
import coil.compose.AsyncImage
import coil.request.ImageRequest
import app.vercel.ummy_chat.twa.R
import com.google.firebase.auth.FirebaseAuth

// ─────────────────────────────────────────────────────────────────────────────
// RoomScreen — Full Native Conversion of RN src/app/rooms/[id].tsx
// Wires all Phase 0 – Phase 8 Native Composables & Modals
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomScreen(
    roomId: String,
    onLeaveRoom: () -> Unit,
    vm: RoomViewModel = viewModel()
) {
    val context = LocalContext.current
    val currentUid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val currentUserSvipLevel by vm.currentUserSvipLevel.collectAsState()

    // ── Collect State from ViewModel ───────────────────────────────────────
    val room              by vm.room.collectAsState()
    val seats             by vm.seats.collectAsState()
    val messages          by vm.messages.collectAsState()
    val isMicMuted        by vm.isMicMuted.collectAsState()
    val isInSeat          by vm.isInSeat.collectAsState()
    val isOwner           by vm.isOwner.collectAsState()
    val isModerator       by vm.isModerator.collectAsState()
    val canManage         by vm.canManageRoom.collectAsState()
    val onlineCount       by vm.onlineCount.collectAsState()
    val isFollowing       by vm.isFollowing.collectAsState()
    val participants      by vm.allParticipants.collectAsState()
    val topSupporters     by vm.topSupporters.collectAsState()
    val giftBroadcast     by vm.activeGiftBroadcast.collectAsState()
    val lootBroadcast     by vm.activeLootBroadcast.collectAsState()
    val giftAnimEvents    by vm.giftAnimEvents.collectAsState()
    val entryEffect       by vm.entryEffect.collectAsState()

    // ── Dialog Visibility States ───────────────────────────────────────────
    var showChatInput       by remember { mutableStateOf(false) }
    var targetLanguage      by remember { mutableStateOf("en") }
    var sourceLanguage      by remember { mutableStateOf("auto") }
    var showGiftSheet       by remember { mutableStateOf(false) }
    var showRoomSettings    by remember { mutableStateOf(false) }
    var showUserList        by remember { mutableStateOf(false) }
    var showRoomInfo        by remember { mutableStateOf(false) }
    var showExitSheet       by remember { mutableStateOf(false) }
    var selectedSeat        by remember { mutableStateOf<SeatModel?>(null) }
    var showSeatMenu        by remember { mutableStateOf(false) }
    var kickTarget          by remember { mutableStateOf<String?>(null) }
    var showKickDialog      by remember { mutableStateOf(false) }



    // Phase 1 – 8 Dialog States
    var showShareSheet      by remember { mutableStateOf(false) }
    var showProfileCard     by remember { mutableStateOf<RoomProfileUser?>(null) }
    var showTopSupporters   by remember { mutableStateOf(false) }
    var showPlaySheet       by remember { mutableStateOf(false) }
    var showLuckyRain       by remember { mutableStateOf(false) }
    var showGoldenChest     by remember { mutableStateOf(false) }
    var showLuckySpin       by remember { mutableStateOf(false) }
    var showMessagesDialog  by remember { mutableStateOf(false) }
    var showSupportDialog   by remember { mutableStateOf(false) }
    var showAristocracy     by remember { mutableStateOf(false) }
    var showGamesDialog     by remember { mutableStateOf(false) }
    var showEntertainment   by remember { mutableStateOf(false) }
    var showTasksDialog     by remember { mutableStateOf(false) }
    var showSportsHub       by remember { mutableStateOf(false) }
    var showSoundboard      by remember { mutableStateOf(false) }
    var showEmojiPicker     by remember { mutableStateOf(false) }
    var showWeeklyStar      by remember { mutableStateOf(false) }
    var showEchoDialog       by remember { mutableStateOf(false) }
    var activeGameId        by remember { mutableStateOf<String?>(null) }
    var activeGameTitle     by remember { mutableStateOf("") }
    var isGameMinimized     by remember { mutableStateOf(false) }
    var showLootGate        by remember { mutableStateOf(false) }
    val customEmojis        by vm.customEmojis.collectAsState()
    var activeLootBox       by remember { mutableStateOf<LootBoxData?>(null) }

    // ── Init Room ──────────────────────────────────────────────────────────
    LaunchedEffect(roomId) {
        val lifecycleOwner = context as? androidx.lifecycle.LifecycleOwner
        vm.initializeRoom(context, roomId, lifecycleOwner)
    }

    // ── Back Button → leaveRoom() ──────────────────────────────────────────
    BackHandler {
        vm.leaveRoom()
        onLeaveRoom()
    }

    // ── Root Layout ────────────────────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F0B2A))
    ) {
        val backgroundRequest = remember(room?.backgroundUrl, room?.coverUrl) {
            ImageRequest.Builder(context)
                .data(room?.backgroundUrl ?: room?.coverUrl ?: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400")
                .bitmapConfig(Bitmap.Config.ARGB_8888)
                .allowHardware(true)
                .crossfade(true)
                .build()
        }

        // 1. Background Cover
        AsyncImage(
            model = backgroundRequest,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // 2. Top-only Gradient Overlay (matches RN: h-40 color gradient for status bar legibility)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.7f),
                            Color.Transparent
                        )
                    )
                )
        )

        // 3. Main Screen Column
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // Header
            RoomHeader(
                title          = room?.title ?: "Ummy Room",
                roomNumber     = room?.roomNumber ?: "",
                coverUrl       = room?.coverUrl,
                onlineCount    = onlineCount,
                isFollowing    = isFollowing,
                isOwner        = isOwner,
                isModerator    = isModerator,
                onFollow       = { vm.handleFollow() },
                onExit         = { showExitSheet = true },
                onOpenSettings = { showRoomSettings = true },
                onOpenUserList = { showUserList = true },
                onOpenInfo     = { showRoomInfo = true },
                onOpenShare    = { showShareSheet = true }
            )

            // Trophy Badge Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 0.dp, top = 2.dp, end = 14.dp, bottom = 2.dp), // Set start to 0.dp for extreme left
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                RoomTrophyBadge(
                    dailyGifts = room?.dailyGifts ?: 0L,
                    supporters = topSupporters,
                    onPress = { showTopSupporters = true }
                )
            }

            // Entry effect
            entryEffect?.let { EntryEffectPlayer(it) { vm.clearEntryEffect() } }

            Spacer(modifier = Modifier.height(4.dp))

            // Seat Grid
            RoomSeatGrid(
                seats         = seats,
                maxSeats      = room?.seatsCount ?: 9,
                currentUserId = currentUid,
                canManage     = canManage,
                onSeatClick   = { seat ->
                    selectedSeat = seat
                    if (seat.userId != null) {
                        showProfileCard = RoomProfileUser(
                            uid = seat.userId,
                            name = seat.username ?: "User",
                            avatarUrl = seat.avatarUrl ?: "https://picsum.photos/200",
                            isInSeat = true,
                            seatIndex = seat.index,
                            isMuted = seat.isMuted
                        )
                    } else {
                        showSeatMenu = true
                    }
                }
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Chat Area
            RoomChatArea(
                messages     = messages,
                announcement = room?.announcement ?: "",
                chatClearedAt = room?.chatClearedAt,
                currentUserId = currentUid,
                onMsgLongPress = { },
                modifier     = Modifier
                    .weight(1f)
                    .padding(horizontal = 8.dp)
            )

            // Footer
            RoomFooter(
                state = RoomFooterState(
                    isMicMuted  = isMicMuted,
                    isInSeat    = isInSeat,
                    isOwner     = isOwner,
                    isModerator = isModerator
                ),
                onToggleMic      = { vm.toggleMicMute() },
                onToggleSpeaker  = { },
                onOpenChatInput  = { showChatInput = true },
                onOpenEmoji      = { showEmojiPicker = true },
                onOpenMessages   = { showMessagesDialog = true },
                onOpenGift       = { showGiftSheet = true },
                onOpenPlay       = { showPlaySheet = true },
                onOpenSoundboard = { showSoundboard = true },
                onOpenGames      = { showGamesDialog = true },
                onOpenUserList   = { showUserList = true },
                onOpenSettings   = { showRoomSettings = true }
            )

            Spacer(modifier = Modifier.navigationBarsPadding())
        }

        // Floating Broadcast Banners (Overlays)
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 95.dp)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            giftBroadcast?.let {
                BroadcastPattiBanner(
                    event = it,
                    colors = listOf(Color(0xFF7C3AED), Color(0xFF6366F1), Color(0xFF22D3EE))
                )
            }
            lootBroadcast?.let {
                BroadcastPattiBanner(
                    event = it,
                    colors = listOf(Color(0xFFFACC15), Color(0xFFF59E0B), Color(0xFFEF4444))
                )
            }
        }

        // Minimized Game Floating Action Card
        if (activeGameId != null && isGameMinimized) {
            GameMiniCard(
                gameId = activeGameId!!,
                onPress = { isGameMinimized = false },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 160.dp, end = 16.dp)
            )
        }



        // Gift Animation Overlay
        RoomGiftAnimOverlay(giftEvents = giftAnimEvents)

        // ─────────────────────────────────────────────────────────────────
        // ALL DIALOGS & OVERLAYS (Phase 1 – Phase 8)
        // ─────────────────────────────────────────────────────────────────

        // Profile Card
        RoomProfileCard(
            user = showProfileCard,
            canManage = canManage,
            isMe = showProfileCard?.uid == currentUid,
            onDismiss = { showProfileCard = null },
            onSendMessage = { showProfileCard = null; showMessagesDialog = true },
            onSendGift = { showProfileCard = null; showGiftSheet = true },
            onLeaveSeat = { vm.leaveSeat(); showProfileCard = null },
            onMute = { uid, isMuted -> vm.muteSeat(showProfileCard?.seatIndex ?: 0); showProfileCard = null },
            onKick = { uid -> kickTarget = uid; showKickDialog = true; showProfileCard = null },
            onEcho = { /* TODO: echo effect */ },
            onPropose = { /* TODO: propose effect */ }
        )

        // Share Sheet
        if (showShareSheet && room != null) {
            RoomShareSheet(
                room = ShareRoom(room!!.id, room!!.title, room!!.roomNumber, room!!.coverUrl),
                onDismiss = { showShareSheet = false }
            )
        }

        // Top Supporters Sheet
        if (showTopSupporters) {
            RoomTopSupportersDialog(
                visible = showTopSupporters,
                supporters = topSupporters,
                onDismiss = { showTopSupporters = false }
            )
        }

        // Play Sheet (Hub & Tools)
        if (showPlaySheet && room != null) {
            RoomPlaySheet(
                visible = showPlaySheet,
                room = room!!,
                canManage = canManage,
                onDismiss = { showPlaySheet = false },
                onOpenGames = { showGamesDialog = true },
                onOpenYouTube = { showEntertainment = true },
                onOpenEntertainment = { showEntertainment = true },
                onChatCleared = { name -> vm.addLocalChatClearedMessage(name) }
            )
        }

        // Games Grid Selector Dialog
        if (showGamesDialog) {
            RoomGamesDialog(
                visible = showGamesDialog,
                onSelectGame = { id, title, _ ->
                    activeGameId = id
                    activeGameTitle = title
                    isGameMinimized = false
                    showGamesDialog = false
                },
                onDismiss = { showGamesDialog = false }
            )
        }

        // Active Game Overlay Container
        if (activeGameId != null && !isGameMinimized) {
            RoomGameOverlay(
                visible = true,
                gameId = activeGameId,
                gameTitle = activeGameTitle,
                isAdmin = canManage,
                onMinimize = { isGameMinimized = true },
                onDismiss = { activeGameId = null }
            )
        }

        // Entertainment Hub (TMDB Movies)
        if (showEntertainment) {
            EntertainmentHubDialog(
                visible = showEntertainment,
                onSelectMovie = { showEntertainment = false },
                onDismiss = { showEntertainment = false }
            )
        }

        // Golden Chest & Lucky Spin Dialogs
        if (showGoldenChest) {
            RoomGoldenChestDialog(
                visible = showGoldenChest,
                roomId = roomId,
                onDismiss = { showGoldenChest = false }
            )
        }
        if (showLuckySpin) {
            RoomLuckySpinDialog(
                visible = showLuckySpin,
                roomId = roomId,
                onDismiss = { showLuckySpin = false }
            )
        }

        // Room Support & Aristocracy Dialogs
        if (showSupportDialog) {
            val participants by vm.allParticipants.collectAsState()
            val mappedParticipants = participants.map { SupportPartner(it.uid, it.name, it.avatarUrl) }
            val mappedPartners = room?.partners?.map { 
                SupportPartner(it["uid"] as? String ?: "", it["name"] as? String ?: "", it["avatarUrl"] as? String) 
            } ?: emptyList()

            RoomSupportDialog(
                visible = showSupportDialog,
                roomId = roomId,
                isOwner = isOwner,
                roomStats = room?.stats,
                visitorCount = room?.visitorCount ?: 0,
                uniqueVisitorCount = room?.uniqueVisitorCount ?: 0,
                levelPoints = room?.levelPoints ?: 0,
                partners = mappedPartners,
                participants = mappedParticipants,
                onDismiss = { showSupportDialog = false }
            )
        }
        if (showAristocracy) {
            AristocracyDialog(
                visible = showAristocracy,
                onDismiss = { showAristocracy = false }
            )
        }
        if (showWeeklyStar) {
            WeeklyStarDialog(
                visible = showWeeklyStar,
                onDismiss = { showWeeklyStar = false }
            )
        }

        // Private DMs / Messages Dialog
        if (showMessagesDialog) {
            RoomMessagesDialog(
                visible = showMessagesDialog,
                roomId = roomId,
                onDismiss = { showMessagesDialog = false }
            )
        }

        // Lucky Rain Coin Overlay
        if (showLuckyRain) {
            LuckyRainOverlay(
                visible = showLuckyRain,
                roomId = roomId,
                onComplete = { showLuckyRain = false }
            )
        }

        // Loot Gate Popup
        if (activeLootBox != null) {
            LootGate(
                visible = true,
                lootBox = activeLootBox,
                onClaim = { },
                onDismiss = { activeLootBox = null }
            )
        }

        // Emoji, Soundboard & Echo Dialogs
        if (showEmojiPicker) {
            RoomEmojiPickerDialog(
                visible = showEmojiPicker,
                customEmojis = customEmojis,
                onClose = { showEmojiPicker = false },
                onSendEmoji = { emojiId ->
                    vm.sendPickerEmoji(emojiId)
                    showEmojiPicker = false
                }
            )
        }

        if (showSoundboard) {
            RoomSoundboardDialog(
                visible = showSoundboard,
                onPlaySound = { },
                onDismiss = { showSoundboard = false }
            )
        }

        // Standard Dialogs (Chat input, Gift sheet, Exit, Settings, User list, Room info, Seat Menu)
        if (showSeatMenu && selectedSeat != null) {
            RoomSeatMenu(
                visible = showSeatMenu,
                onClose = { showSeatMenu = false },
                seatIndex = selectedSeat!!.index,
                isLocked = selectedSeat!!.isLocked,
                isSeatMuted = selectedSeat!!.isMuted,
                isOwner = isOwner,
                isModerator = isModerator,
                onTakeSeat = { vm.takeSeat(selectedSeat!!.index) },
                onLockSeat = { vm.lockSeat(selectedSeat!!.index) },
                onMuteSeat = { vm.muteSeat(selectedSeat!!.index) },
                onInvite = {
                    showSeatMenu = false
                    // Optionally open invite/user list dialog here
                    showUserList = true
                }
            )
        }
        if (showChatInput) {
            ChatInputBar(
                visible = showChatInput,
                onClose = { showChatInput = false },
                onSend = { text, _ -> vm.sendMessage(text) },
                targetLanguage = targetLanguage,
                sourceLanguage = sourceLanguage,
                onSelectLanguage = { targetLanguage = it },
                onSelectSourceLanguage = { sourceLanguage = it }
            )
        }
        if (showGiftSheet) {
            GiftBottomSheet(
                onDismiss = { showGiftSheet = false },
                userSvipLevel = currentUserSvipLevel,
                onSendGift = { _, _ -> showGiftSheet = false }
            )
        }
        if (showRoomSettings) {
            RoomSettingsSheet(
                roomId = roomId,
                participants = participants,
                ownerId = room?.ownerId ?: "",
                currentUid = currentUid,
                onDismissRequest = { showRoomSettings = false }
            )
        }

        val currentRoom = room
        if (showUserList && currentRoom != null) {
            RoomUserListSheet(
                visible = showUserList,
                onDismiss = { showUserList = false },
                participants = participants,
                roomId = currentRoom.id,
                ownerId = currentRoom.ownerId,
                moderatorIds = currentRoom.moderatorIds,
                currentUserId = currentUid,
                onUserPress = { uid ->
                    showUserList = false
                    val p = participants.find { it.uid == uid }
                    if (p != null) {
                        showProfileCard = RoomProfileUser(
                            uid = p.uid,
                            name = p.name,
                            avatarUrl = p.avatarUrl ?: "https://picsum.photos/200",
                            isInSeat = p.isInSeat,
                            seatIndex = p.seatIndex
                        )
                    }
                },
                onAcceptMicRequest = { uid, seatIndex ->
                    vm.acceptMicRequest(uid, seatIndex)
                },
                onRejectMicRequest = { uid ->
                    vm.rejectMicRequest(uid)
                }
            )
        }
        if (showRoomInfo && currentRoom != null) {
            RoomInfoSheet(
                roomId = currentRoom.id,
                initialRoom = currentRoom,
                isOwner = isOwner,
                isFollowing = isFollowing,
                onFollow = { vm.handleFollow() },
                onDismiss = { showRoomInfo = false },
                onUserPress = { uid ->
                    showRoomInfo = false
                    val p = participants.find { it.uid == uid }
                    if (p != null) {
                        showProfileCard = RoomProfileUser(
                            uid = p.uid,
                            name = p.name,
                            avatarUrl = p.avatarUrl ?: "https://picsum.photos/200",
                            isInSeat = p.isInSeat,
                            seatIndex = p.seatIndex
                        )
                    }
                }
            )
        }
        if (showExitSheet) {
            RoomExitSheet(
                onDismiss = { showExitSheet = false },
                onExit = { vm.leaveRoom(); onLeaveRoom() },
                onMinimize = {
                    vm.setMinimized(true)
                    showExitSheet = false
                    onLeaveRoom()
                }
            )
        }

        // 4. Floating Banners (Mid-Bottom Right) - RN Parity
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 8.dp, bottom = if ((room?.seatsCount ?: 9) >= 13) 256.dp else 288.dp)
        ) {
            RoomBanners(
                onOpenSupport = { showSupportDialog = true },
                onOpenSpin = { showLuckySpin = true },
                onOpenChest = { showGoldenChest = true },
                onOpenAristocracy = { showAristocracy = true },
                onOpenWeeklyStar = { showWeeklyStar = true }
            )
        }

        // 5. Loot Level Display (Right side floating) - RN Parity
        val lootLevels by vm.lootLevels.collectAsState()
        val currentLootLevelIndex by vm.currentLootLevelIndex.collectAsState()
        val isLootGateOpen by vm.isLootGateOpen.collectAsState()
        var showLootStation by remember { mutableStateOf(false) }

        if (isLootGateOpen) {
            Box(modifier = Modifier.fillMaxSize().zIndex(100f)) {
                app.vercel.ummy_chat.twa.ui.room.components.LootingRoom(
                    active = true,
                    onCollect = { /* Handle collection */ },
                    onClose = { vm.setLootGateOpen(false) }
                )
            }
        }

        if (showLootStation) {
            app.vercel.ummy_chat.twa.ui.room.components.LootStationDialog(
                levels = lootLevels,
                currentLevelIndex = currentLootLevelIndex,
                displayPct = 0,
                onDismiss = { showLootStation = false }
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 4.dp, bottom = if ((room?.seatsCount ?: 9) >= 13) 60.dp else 70.dp)
        ) {
            app.vercel.ummy_chat.twa.ui.room.components.LootBoxDisplay(
                levels = lootLevels,
                currentProgress = room?.levelPoints ?: 0L,
                isGateOpen = isLootGateOpen,
                canOpenGate = canManage,
                onOpenGate = { vm.setLootGateOpen(true) },
                onShowStation = { showLootStation = true },
                currentLevelIndex = currentLootLevelIndex,
                isGateCompleted = false
            )
        }

        // 14. Floating Top-Right Badge (Golden Task Jar) - OWNER ONLY
        if (isOwner && !showTasksDialog) {
            val achievedTasks by vm.achievedTasks.collectAsState()
            val claimedTasks by vm.claimedTasks.collectAsState()
            val hasUnclaimedRewards = achievedTasks.any { !claimedTasks.contains(it) }

            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 80.dp, end = 4.dp)
                    .zIndex(50f)
            ) {
                Box(
                    modifier = Modifier
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { showTasksDialog = true }
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.golden_task_jar),
                        contentDescription = "Golden Task Jar",
                        modifier = Modifier.size(64.dp),
                        contentScale = ContentScale.Fit
                    )
                    if (hasUnclaimedRewards) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .size(16.dp)
                                .background(Color.Red, CircleShape)
                                .border(1.dp, Color.Black, CircleShape)
                        )
                    }
                }
            }
        }

        // 13. Room Tasks Dialog (LAST CHILD — renders on top of everything)
        RoomTasksBottomSheet(
            visible = showTasksDialog,
            onDismiss = { showTasksDialog = false },
            vm = vm,
            totalRoomGifts = room?.totalGifts ?: room?.dailyGifts ?: 0L
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomMiniCard — Floating mini-player when room is minimized (RN parity: Keep)
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomMiniCard(
    room: RoomModel,
    onExpand: () -> Unit,
    onExit: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(72.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF0F172A))
            .border(1.5.dp, Color(0xFF00E5FF), RoundedCornerShape(16.dp))
            .clickable(onClick = onExpand)
    ) {
        // Room cover thumbnail
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
            AsyncImage(
                model = room.coverUrl ?: "https://picsum.photos/150",
                contentDescription = "Room",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(16.dp))
            )
        }

        // Room title badge at bottom
        Text(
            text = room.title,
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

        // Exit button overlay (top-right)
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEF4444))
                    .clickable(onClick = onExit),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Exit",
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Kick Duration Dialog & Share Helper
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun KickDurationDialog(
    onDismiss: () -> Unit,
    onKick: (Int) -> Unit
) {
    val options = listOf(1 to "1 Hour", 12 to "12 Hours", 24 to "1 Day", 72 to "3 Days", 168 to "1 Week")
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E1B4B),
        title = { Text("Kick Duration", color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                options.forEach { (hours, label) ->
                    Button(
                        onClick = { onKick(hours) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF312E81))
                    ) {
                        Text(label, color = Color.White)
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = Color.White.copy(alpha = 0.7f)) }
        }
    )
}

