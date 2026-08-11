package app.vercel.ummy_chat.twa.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.ui.discover.DiscoverScreen
import app.vercel.ummy_chat.twa.ui.home.HomeScreen
import app.vercel.ummy_chat.twa.ui.messages.MessagesScreen
import app.vercel.ummy_chat.twa.ui.navigation.BottomNavItem
import app.vercel.ummy_chat.twa.ui.profile.ProfileScreen
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

@Composable
fun MainDashboardScreen(
    initialTab: String = "home",
    onNavigateToRoom: (roomId: String) -> Unit,
    onNavigateToFamilies: () -> Unit,
    onNavigateToFamilyProfile: (String) -> Unit = {},
    onNavigateToCpRanking: () -> Unit,
    onNavigateToLeaderboard: () -> Unit = {},
    onNavigateToSearch: () -> Unit = {},
    onNavigateToWallet: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {},
    onNavigateToLevel: () -> Unit = {},
    onNavigateToStore: () -> Unit = {},
    onNavigateToBonus: () -> Unit = {},
    onNavigateToHelpCenter: () -> Unit = {},
    onNavigateToAbout: () -> Unit = {},
    onNavigateToVips: () -> Unit = {},
    onNavigateToGames: () -> Unit = {},
    onNavigateToChatDetail: (chatId: String, recipientId: String, recipientName: String, recipientAvatar: String, recipientIsOnline: Boolean) -> Unit = { _, _, _, _, _ -> },
    onNavigateToOfficial: () -> Unit = {},
    onNavigateToSystem: () -> Unit = {},
    onNavigateToRequests: () -> Unit = {},
    onNavigateToTasks: () -> Unit = {},
    onNavigateToAdmin: () -> Unit = {}
) {
    val initialNavItem = when (initialTab) {
        "discover" -> BottomNavItem.Discover
        "messages" -> BottomNavItem.Messages
        "profile" -> BottomNavItem.Profile
        else -> BottomNavItem.Home
    }
    var currentTabKey by rememberSaveable { mutableStateOf(initialTab) }
    val currentTab = when (currentTabKey) {
        "discover" -> BottomNavItem.Discover
        "messages" -> BottomNavItem.Messages
        "profile" -> BottomNavItem.Profile
        else -> BottomNavItem.Home
    }

    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Discover,
        BottomNavItem.Messages,
        BottomNavItem.Profile
    )

    // React Native (tabs)/_layout.tsx L27-54: global unread dot on Message tab
    var hasUnread by remember { mutableStateOf(false) }
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    DisposableEffect(uid) {
        if (uid == null) return@DisposableEffect onDispose {}
        val registration = FirebaseFirestore.getInstance()
            .collection("privateChats")
            .whereArrayContains("participantIds", uid)
            .addSnapshotListener { snapshot, _ ->
                var unreadFound = false
                snapshot?.documents?.forEach { doc ->
                    val chat = doc.data ?: return@forEach
                    val lastSenderId = chat["lastSenderId"] as? String
                    val readBy = chat["lastMessageReadBy"] as? List<*> ?: emptyList<Any?>()
                    if (lastSenderId != null && lastSenderId != uid && !readBy.contains(uid)) {
                        unreadFound = true
                    }
                }
                hasUnread = unreadFound
            }
        onDispose { registration.remove() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Tab Content
        when (currentTab) {
            is BottomNavItem.Home -> HomeScreen(
                onOpenRoom = onNavigateToRoom,
                onOpenFamilies = onNavigateToFamilies,
                onOpenCpRanking = onNavigateToCpRanking,
                onOpenLeaderboard = onNavigateToLeaderboard,
                onOpenSearch = onNavigateToSearch,
                onNavigateToProfile = { currentTabKey = "profile" }
            )
            is BottomNavItem.Discover -> DiscoverScreen()
            is BottomNavItem.Messages -> MessagesScreen(
                onOpenChatRoom = { chatId, recipientId, recipientName, recipientAvatar ->
                    onNavigateToChatDetail(chatId, recipientId, recipientName, recipientAvatar, false)
                },
                onOpenOfficial = onNavigateToOfficial,
                onOpenSystem = onNavigateToSystem,
                onOpenRequests = onNavigateToRequests,
                onOpenSearch = onNavigateToSearch,
                onOpenRoom = onNavigateToRoom
            )
            is BottomNavItem.Profile -> ProfileScreen(
                onNavigate = { route ->
                    when (route) {
                        "/wallet" -> onNavigateToWallet()
                        "/settings" -> onNavigateToSettings()
                        "/level" -> onNavigateToLevel()
                        "/store", "/my-item" -> onNavigateToStore()
                        "/bonus" -> onNavigateToBonus()
                        "/help", "/help-center" -> onNavigateToHelpCenter()
                        "/about" -> onNavigateToAbout()
                        "/family", "/families" -> onNavigateToFamilies()
                        "/cp-friends", "/cp-house" -> onNavigateToCpRanking()
                        "/tasks" -> onNavigateToTasks()
                        "/vips" -> onNavigateToVips()
                        "/admin" -> onNavigateToAdmin()
                        "/games" -> onNavigateToGames()
                        "/leaderboard" -> onNavigateToLeaderboard()
                        else -> Unit
                    }
                }
            )
        }

        // ============================================================
        // ⚡ RN-STYLE BOTTOM TAB BAR ((tabs)/_layout.tsx L60-146) ⚡
        // ============================================================
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                // tabBarStyle shadow: #000, offset (0,-5), opacity 0.5, radius 20, elevation 10
                .shadow(
                    elevation = 20.dp,
                    ambientColor = Color.Black,
                    spotColor = Color.Black
                )
                .background(Color(0xFF1A0B2E)) // tabBarStyle backgroundColor '#1a0b2e'

                .windowInsetsPadding(WindowInsets.navigationBars.only(WindowInsetsSides.Bottom))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp) // tabHeight = 52 + safeBottom
                    .padding(top = 4.dp), // paddingTop: 4
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                items.forEach { tab ->
                    val isSelected = currentTab == tab
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                currentTabKey = when (tab) {
                                    is BottomNavItem.Discover -> "discover"
                                    is BottomNavItem.Messages -> "messages"
                                    is BottomNavItem.Profile -> "profile"
                                    else -> "home"
                                }
                            }
                            .padding(vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier.height(30.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            // NeonIndicator (L9-11): absolute -top-3 w-8 h-1 rounded-full bg-pink-400 opacity-80
                            if (isSelected) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopCenter)
                                        .offset(y = (-14).dp)
                                        .size(width = 32.dp, height = 2.dp) // w-8 h-1 (RN h-1 is approx 4dp, but 2dp looks cleaner)
                                        .clip(CircleShape)
                                        .background(Color(0xFFF472B6).copy(alpha = 0.9f)) // bg-pink-400
                                )
                            }
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.title,
                                // tabBarActiveTintColor '#ffffff' / inactive 'rgba(255,255,255,0.4)'
                                tint = if (isSelected) Color.White else Color.White.copy(alpha = 0.4f),
                                modifier = Modifier.size(24.dp) // size={22} in RN, 24dp in Compose is standard
                            )
                            // Unread dot for Message tab (L118-129): w-2 h-2 rounded-full bg-red-500 border border-white
                            if (tab is BottomNavItem.Messages && hasUnread) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = 4.dp, y = (-2).dp)
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEC4899)) // bg-pink-500 matching
                                        .border(1.dp, Color.White, CircleShape)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp)) // label marginTop: 4
                        Text(
                            text = tab.title.uppercase(), // textTransform: 'uppercase'
                            fontSize = 10.sp, // fontSize: 10
                            fontWeight = FontWeight.Black, // fontWeight: '900'
                            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.4f),
                            maxLines = 1,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }
    }
}
