package app.vercel.ummy_chat.twa.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// AdminScreen — 1-to-1 RN parity of admin/index.tsx
// Full-screen with menu + 30 tab components, level-based access
// ─────────────────────────────────────────────────────────────────────────────

private const val CREATOR_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1"

internal fun getUserLevel(tags: List<String>, isAdmin: Boolean, uid: String): Int {
    if (uid == CREATOR_ID) return 7
    if (tags.contains("Official") || tags.contains("Official center") || isAdmin) return 6
    if (tags.contains("Super Admin")) return 5
    if (tags.contains("Manager")) return 4
    if (tags.contains("Auditor")) return 3
    if (tags.contains("Admin")) return 2
    if (tags.contains("CS Leader")) return 1
    if (tags.contains("Customer Service")) return 0
    return -1
}

enum class AdminTab {
    MENU,
    RECHARGE_REQUESTS, FINANCIAL_AUDIT, FINANCIAL_SETTINGS, APP_LEDGER,
    ID_BAN, MODERATION_REPORTS, MEMBER_DIRECTORY, USER_RECORDS,
    AUTHORITY_HUB, VIP_MANAGEMENT, CP_MANAGEMENT, FAMILY_MANAGEMENT, PIN_CONTROL, TAGS,
    BROADCASTER, LOOT_CONFIG, REWARDS_CENTER, DIRECT_MESSENGER, BANNERS,
    SOVEREIGN_IDS, LEVEL_MANAGEMENT, MEDAL_MANAGEMENT, EMOJI_MANAGEMENT,
    SYSTEM_CONTROL, GAME_SYNC, SEAT_TIMING, LOADING_SCREEN, GAME_LOADING,
    VISUAL_IDENTITY, ASSIGN_CENTER, SPLASH_SCREEN, RANKING_THEMES,
    BOUTIQUE_HUB, GIFT_MANAGEMENT, CUSTOM_GIFTS, AGENCY_APPLICATIONS
}

@Composable
fun AdminScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit = {}
) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val db = FirebaseFirestore.getInstance()

    var userLevel by remember { mutableIntStateOf(-1) }
    var isLoading by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf(AdminTab.MENU) }

    // Fetch user level
    LaunchedEffect(uid) {
        if (uid.isEmpty()) { isLoading = false; return@LaunchedEffect }
        try {
            val snap = db.collection("users").document(uid).get().await()
            if (snap.exists()) {
                @Suppress("UNCHECKED_CAST")
                val tags = (snap.get("tags") as? List<String>) ?: emptyList()
                val isAdmin = snap.getBoolean("isAdmin") ?: false
                userLevel = getUserLevel(tags, isAdmin, uid)
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    // Page title
    val pageTitle = when {
        userLevel >= 6 -> "Official Center"
        userLevel >= 4 -> "Operations Hub"
        userLevel == 3 -> "Audit Panel"
        userLevel >= 0 -> "Support Desk"
        else -> "Admin Control"
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Color(0xFF7C3AED))
                Spacer(modifier = Modifier.height(12.dp))
                Text("Verifying supreme credentials...", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
            }
        }
        return
    }

    if (userLevel < 0) {
        Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Shield, null, tint = Color(0xFFEF4444), modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Text("ACCESS DENIED", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
                Spacer(modifier = Modifier.height(8.dp))
                Text("This sector requires command clearance levels.", fontSize = 14.sp, color = Color(0xFF64748B))
                Spacer(modifier = Modifier.height(24.dp))
                Box(modifier = Modifier.clip(RoundedCornerShape(99.dp)).background(Color(0xFF7C3AED)).clickable { onBack() }.padding(horizontal = 24.dp, vertical = 12.dp)) {
                    Text("Return to Safety", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Header bar
        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.padding(start = 8.dp).clickable {
                if (activeTab != AdminTab.MENU) activeTab = AdminTab.MENU else onBack()
            }.padding(8.dp)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color(0xFF1E293B), modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                if (activeTab == AdminTab.MENU) pageTitle else activeTab.name.replace("_", " "),
                fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B)
            )
        }

        Divider(color = Color(0xFFF1F5F9))

        // Content
        when (activeTab) {
            AdminTab.MENU -> AdminMenu(userLevel = userLevel, onTabSelect = { activeTab = it }, onNavigate = onNavigate)
            // Core Operations
            AdminTab.RECHARGE_REQUESTS -> RechargeRequestsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.FINANCIAL_AUDIT -> FinancialAuditTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.FINANCIAL_SETTINGS -> FinancialSettingsTab(onBack = { activeTab = AdminTab.MENU })
            AdminTab.APP_LEDGER -> AppLedgerTab(onBack = { activeTab = AdminTab.MENU })
            // Moderator
            AdminTab.ID_BAN -> IdBanTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.MODERATION_REPORTS -> ModerationReportsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.MEMBER_DIRECTORY -> MemberDirectoryTab(onBack = { activeTab = AdminTab.MENU })
            AdminTab.USER_RECORDS -> UserRecordsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            // Management
            AdminTab.AUTHORITY_HUB -> AuthorityHubTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.VIP_MANAGEMENT -> VipManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.CP_MANAGEMENT -> CpManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.FAMILY_MANAGEMENT -> FamilyManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.PIN_CONTROL -> PinControlTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.TAGS -> TagsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.AGENCY_APPLICATIONS -> AgencyApplicationsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            // System Config
            AdminTab.BROADCASTER -> BroadcasterTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.LOOT_CONFIG -> LootConfigTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.REWARDS_CENTER -> RewardsCenterTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.DIRECT_MESSENGER -> DirectMessengerTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.BANNERS -> BannersTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.SOVEREIGN_IDS -> SovereignIdsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.LEVEL_MANAGEMENT -> LevelManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.MEDAL_MANAGEMENT -> MedalManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.EMOJI_MANAGEMENT -> EmojiManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.SYSTEM_CONTROL -> SystemControlTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.GAME_SYNC -> GameSyncTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.SEAT_TIMING -> SeatTimingTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.LOADING_SCREEN -> LoadingScreenTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.GAME_LOADING -> GameLoadingTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.VISUAL_IDENTITY -> VisualIdentityTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.ASSIGN_CENTER -> AssignCenterTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.SPLASH_SCREEN -> SplashScreenTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.RANKING_THEMES -> RankingThemesTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.BOUTIQUE_HUB -> BoutiqueHubTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.GIFT_MANAGEMENT -> GiftManagementTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
            AdminTab.CUSTOM_GIFTS -> CustomGiftsTab(userLevel = userLevel, onBack = { activeTab = AdminTab.MENU })
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Menu — level-based items
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun AdminMenu(userLevel: Int, onTabSelect: (AdminTab) -> Unit, onNavigate: (String) -> Unit) {
    Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(20.dp)) {
        // Core Operations
        AdminSection("Core Operations")
        if (userLevel == 3 || userLevel >= 6) {
            AdminMenuItem(Icons.Default.AccountBalance, "Recharge Requests", Color(0xFF22C55E)) { onTabSelect(AdminTab.RECHARGE_REQUESTS) }
            AdminMenuItem(Icons.Default.List, "Financial Audit", Color(0xFF3B82F6)) { onTabSelect(AdminTab.FINANCIAL_AUDIT) }
            AdminMenuItem(Icons.Default.CreditCard, "Financial Settings", Color(0xFF22C55E)) { onTabSelect(AdminTab.FINANCIAL_SETTINGS) }
            AdminMenuItem(Icons.Default.Storage, "App Ledger", Color(0xFF3B82F6)) { onTabSelect(AdminTab.APP_LEDGER) }
        }

        // Moderator & CS
        if (userLevel >= 0) {
            AdminMenuItem(Icons.Default.Gavel, "ID Ban Control", Color(0xFFEF4444)) { onTabSelect(AdminTab.ID_BAN) }
            AdminMenuItem(Icons.Default.Shield, "Moderation Reports", Color(0xFFEF4444)) { onTabSelect(AdminTab.MODERATION_REPORTS) }
            AdminMenuItem(Icons.Default.Groups, "Member Directory", Color(0xFF0EA5E9)) { onTabSelect(AdminTab.MEMBER_DIRECTORY) }
            AdminMenuItem(Icons.Default.PersonSearch, "User Ledger", Color(0xFFF43F5E)) { onTabSelect(AdminTab.USER_RECORDS) }
        }

        // Management
        if (userLevel >= 4) {
            AdminMenuItem(Icons.Default.FlashOn, "Authority Hub", Color(0xFFA855F7)) { onTabSelect(AdminTab.AUTHORITY_HUB) }
            AdminMenuItem(Icons.Default.EmojiEvents, "VIP Management", Color(0xFFEAB308)) { onTabSelect(AdminTab.VIP_MANAGEMENT) }
            AdminMenuItem(Icons.Default.Favorite, "CP Backgrounds", Color(0xFFDB2777)) { onTabSelect(AdminTab.CP_MANAGEMENT) }
            AdminMenuItem(Icons.Default.Groups, "Family Management", Color(0xFF10B981)) { onTabSelect(AdminTab.FAMILY_MANAGEMENT) }
            AdminMenuItem(Icons.Default.PushPin, "Pin Control", Color(0xFF10B981)) { onTabSelect(AdminTab.PIN_CONTROL) }
            AdminMenuItem(Icons.Default.Badge, "Assign Tags", Color(0xFF7C3AED)) { onTabSelect(AdminTab.TAGS) }
            AdminMenuItem(Icons.Default.BusinessCenter, "Agency Applications", Color(0xFF6366F1)) { onTabSelect(AdminTab.AGENCY_APPLICATIONS) }
        }

        // System Config (Level 6+)
        if (userLevel >= 6) {
            AdminMenuItem(Icons.Default.NotificationImportant, "Broadcaster System", Color(0xFF3B82F6)) { onTabSelect(AdminTab.BROADCASTER) }
            AdminMenuItem(Icons.Default.CardGiftcard, "Loot Config", Color(0xFFA855F7)) { onTabSelect(AdminTab.LOOT_CONFIG) }
            AdminMenuItem(Icons.Default.CardGiftcard, "Rewards Center", Color(0xFF22C55E)) { onTabSelect(AdminTab.REWARDS_CENTER) }
            AdminMenuItem(Icons.Default.Mail, "Direct Messenger", Color(0xFF3B82F6)) { onTabSelect(AdminTab.DIRECT_MESSENGER) }
            AdminMenuItem(Icons.Default.Image, "Banners Management", Color(0xFF3B82F6)) { onTabSelect(AdminTab.BANNERS) }
            AdminMenuItem(Icons.Default.EmojiEvents, "Sovereign ID Control", Color(0xFF8B5CF6)) { onTabSelect(AdminTab.SOVEREIGN_IDS) }
            AdminMenuItem(Icons.Default.ArrowUpward, "Level Management", Color(0xFF06B6D4)) { onTabSelect(AdminTab.LEVEL_MANAGEMENT) }
            AdminMenuItem(Icons.Default.Star, "Medal Management", Color(0xFFFB923C)) { onTabSelect(AdminTab.MEDAL_MANAGEMENT) }
            AdminMenuItem(Icons.Default.SentimentSatisfied, "Emoji Management", Color(0xFF10B981)) { onTabSelect(AdminTab.EMOJI_MANAGEMENT) }
            AdminMenuItem(Icons.Default.Settings, "System Control", Color(0xFF64748B)) { onTabSelect(AdminTab.SYSTEM_CONTROL) }
            AdminMenuItem(Icons.Default.Gamepad, "Game Sync", Color(0xFFA855F7)) { onTabSelect(AdminTab.GAME_SYNC) }
            AdminMenuItem(Icons.Default.Timer, "Seat Timing Tracker", Color(0xFF0EA5E9)) { onTabSelect(AdminTab.SEAT_TIMING) }
            AdminMenuItem(Icons.Default.Image, "Loading Screen Sync", Color(0xFF4F46E5)) { onTabSelect(AdminTab.LOADING_SCREEN) }
            AdminMenuItem(Icons.Default.Gamepad, "Game Loading Sync", Color(0xFFA855F7)) { onTabSelect(AdminTab.GAME_LOADING) }
            AdminMenuItem(Icons.Default.Palette, "Visual Identity", Color(0xFFEC4899)) { onTabSelect(AdminTab.VISUAL_IDENTITY) }
            AdminMenuItem(Icons.Default.Shield, "Center Management", Color(0xFF6366F1)) { onTabSelect(AdminTab.ASSIGN_CENTER) }
            AdminMenuItem(Icons.Default.Monitor, "Splash Screen & Logo", Color(0xFF14B8A6)) { onTabSelect(AdminTab.SPLASH_SCREEN) }
            AdminMenuItem(Icons.Default.Star, "Ranking Themes", Color(0xFF6366F1)) { onTabSelect(AdminTab.RANKING_THEMES) }
            AdminMenuItem(Icons.Default.ShoppingBag, "Boutique Sync", Color(0xFF7C3AED)) { onTabSelect(AdminTab.BOUTIQUE_HUB) }
            AdminMenuItem(Icons.Default.CardGiftcard, "Gift Management", Color(0xFFF97316)) { onTabSelect(AdminTab.GIFT_MANAGEMENT) }
            AdminMenuItem(Icons.Default.AutoAwesome, "Customized Gifts", Color(0xFFDB2777)) { onTabSelect(AdminTab.CUSTOM_GIFTS) }
        }

        // Quick Redirections
        Spacer(modifier = Modifier.height(12.dp))
        AdminSection("Quick Redirections")
        AdminMenuItem(Icons.Default.ShoppingBag, "Store Management", Color(0xFFEC4899)) { onNavigate("/store") }
        AdminMenuItem(Icons.Default.Gamepad, "Game Controls", Color(0xFF10B981)) { onNavigate("/games") }
        AdminMenuItem(Icons.Default.BarChart, "Leaderboard Center", Color(0xFFF59E0B)) { onNavigate("/leaderboard") }
        AdminMenuItem(Icons.Default.AccountBalance, "Coin Dispatch & Ledger", Color(0xFF06B6D4)) { onNavigate("/wallet") }
    }
}

@Composable
private fun AdminSection(title: String) {
    Text(
        title.uppercase(),
        fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8),
        letterSpacing = 1.sp, modifier = Modifier.padding(bottom = 16.dp, top = 8.dp)
    )
}

@Composable
private fun AdminMenuItem(icon: ImageVector, label: String, color: Color, onClick: () -> Unit) {
    // RN: backgroundColor:'#f8fafc', borderRadius:16, marginBottom:12, borderWidth:1, borderColor:'#e2e8f0'
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFF8FAFC))
            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon bg — RN: w:40 h:40 borderRadius:12
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(color.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
    }
}


