package app.vercel.ummy_chat.twa.ui.vips

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import coil.compose.AsyncImage
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import kotlin.math.sin

// ─────────────────────────────────────────────────────────────────────────────
// SVIP Club Screen — EXACT RN PARITY
// 18 levels, 4 animal emblems, 17 privileges, 5 stealth toggles, space BG
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tier Color Definitions ──────────────────────────────────────────────────

private data class TierColors(
    val primary: Color, val secondary: Color, val accent: Color,
    val glow: Color, val bgStart: Color, val bgEnd: Color,
    val text: Color, val badgeGradient: List<Color>
)

private val OwlColors = TierColors(
    primary = Color(0xFF22D3EE), secondary = Color(0xFF0891B2), accent = Color(0xFF0284C7),
    glow = Color(0x2606B6D4), bgStart = Color(0xFF0891B2), bgEnd = Color(0xFF0284C7),
    text = Color(0xFF22D3EE), badgeGradient = listOf(Color(0xFF94A3B8), Color(0xFF22D3EE), Color(0xFF94A3B8))
)
private val WolfColors = TierColors(
    primary = Color(0xFFA855F7), secondary = Color(0xFFC084FC), accent = Color(0xFFD946EF),
    glow = Color(0x26A855F7), bgStart = Color(0xFFA855F7), bgEnd = Color(0xFFD946EF),
    text = Color(0xFFC084FC), badgeGradient = listOf(Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899))
)
private val LionColors = TierColors(
    primary = Color(0xFFF97316), secondary = Color(0xFFFACC15), accent = Color(0xFFEF4444),
    glow = Color(0x26F97316), bgStart = Color(0xFFF97316), bgEnd = Color(0xFFEF4444),
    text = Color(0xFFF97316), badgeGradient = listOf(Color(0xFFEF4444), Color(0xFFF97316), Color(0xFFEF4444))
)
private val DragonColors = TierColors(
    primary = Color(0xFFFBBF24), secondary = Color(0xFFC084FC), accent = Color(0xFFA855F7),
    glow = Color(0x33FBBF24), bgStart = Color(0xFFFBBF24), bgEnd = Color(0xFFA855F7),
    text = Color(0xFFFBBF24), badgeGradient = listOf(Color(0xFF111111), Color(0xFFAA33FF), Color(0xFFFFD700))
)

private fun getTierColors(level: Int): TierColors = when {
    level >= 16 -> DragonColors
    level >= 11 -> LionColors
    level >= 7 -> WolfColors
    else -> OwlColors
}

private fun getTierName(level: Int): String = when {
    level >= 16 -> "dragon"
    level >= 11 -> "lion"
    level >= 7 -> "wolf"
    else -> "owl"
}

// ─── SVIP Levels Data ────────────────────────────────────────────────────────

private data class SvipLevel(
    val level: Int, val points: String, val exp: Long,
    val validity: String, val maintPoints: String, val maintExp: Long, val theme: String
)

private val SVIP_LEVELS = listOf(
    SvipLevel(1, "1.5M", 1500000, "7 Days", "375K", 375000, "owl"),
    SvipLevel(2, "3.0M", 3000000, "7 Days", "375K", 375000, "owl"),
    SvipLevel(3, "6.25M", 6250000, "15 Days", "1.25M", 1250000, "owl"),
    SvipLevel(4, "12.5M", 12500000, "15 Days", "1.25M", 1250000, "owl"),
    SvipLevel(5, "25.0M", 25000000, "15 Days", "1.25M", 1250000, "owl"),
    SvipLevel(6, "50.0M", 50000000, "15 Days", "1.25M", 1250000, "owl"),
    SvipLevel(7, "75.0M", 75000000, "30 Days", "5.0M", 5000000, "wolf"),
    SvipLevel(8, "100.0M", 100000000, "30 Days", "5.0M", 5000000, "wolf"),
    SvipLevel(9, "150.0M", 150000000, "30 Days", "5.0M", 5000000, "wolf"),
    SvipLevel(10, "200.0M", 200000000, "30 Days", "5.0M", 5000000, "wolf"),
    SvipLevel(11, "275.0M", 275000000, "45 Days", "20.0M", 20000000, "lion"),
    SvipLevel(12, "350.0M", 350000000, "45 Days", "20.0M", 20000000, "lion"),
    SvipLevel(13, "425.0M", 425000000, "45 Days", "20.0M", 20000000, "lion"),
    SvipLevel(14, "500.0M", 500000000, "45 Days", "20.0M", 20000000, "lion"),
    SvipLevel(15, "575.0M", 575000000, "45 Days", "20.0M", 20000000, "lion"),
    SvipLevel(16, "650.0M", 650000000, "60 Days", "100.0M", 100000000, "dragon"),
    SvipLevel(17, "700.0M", 700000000, "60 Days", "100.0M", 100000000, "dragon"),
    SvipLevel(18, "750.0M", 750000000, "60 Days", "100.0M", 100000000, "dragon"),
)

// ─── 17 Privileges Data ──────────────────────────────────────────────────────

private data class Privilege(
    val id: Int, val name: String, val desc: String,
    val level: Int, val icon: ImageVector, val category: String
)

private val PRIVILEGES = listOf(
    Privilege(4, "Entering Sound", "Audio sound wave chime on room entry", 2, Icons.Default.VolumeUp, "VFX"),
    Privilege(6, "Silver Greeting Card", "Gleaming Owl entry greeting card", 4, Icons.Default.Shield, "VFX"),
    Privilege(8, "Mysterious Visitor", "Visit profiles with 100% stealth", 5, Icons.Default.VisibilityOff, "Stealth"),
    Privilege(9, "Exclusive Gift", "Unlock core token gifting item", 5, Icons.Default.CardGiftcard, "Gifts"),
    Privilege(10, "Weekly Coin Rebate", "Daily claimable coin multiplier bonuses", 6, Icons.Default.Bolt, "Rebates"),
    Privilege(12, "Hide Gift Record", "Stealthily receive/send without record", 8, Icons.Default.Lock, "Stealth"),
    Privilege(14, "Rank Hiding", "Become completely invisible on charts", 9, Icons.Default.PersonOff, "Stealth"),
    Privilege(16, "Private Space Album", "Hidden album with access key control", 10, Icons.Default.Key, "Interaction"),
    Privilege(18, "Crimson Nameplate", "Stand out with bold red nameplate text", 11, Icons.Default.LocalFireDepartment, "Identity"),
    Privilege(19, "Room Stealth Entry", "Enter any chatroom in absolute silence", 12, Icons.Default.VisibilityOff, "Stealth"),
    Privilege(21, "Absolute Kick Immunity", "Immunity against all kicks & bans", 13, Icons.Default.Shield, "Stealth"),
    Privilege(23, "CP Room Decoration", "Custom themed luxury CP room design", 14, Icons.Default.Favorite, "Interaction"),
    Privilege(24, "Custom Micro-Badge", "Personalized mini icon next to name", 15, Icons.Default.EmojiEvents, "Identity"),
    Privilege(27, "Diamond Conversion Buff", "Higher limit for coin-to-diamond swaps", 17, Icons.Default.Diamond, "Rebates"),
    Privilege(28, "VIP Liaison Officer", "24/7 dedicated support representative", 17, Icons.Default.Groups, "Interaction"),
    Privilege(30, "Global Server Broadcast", "Announce presence to all rooms globally", 18, Icons.Default.CellTower, "VFX"),
    Privilege(31, "Infinite Validity Lock", "Never downgrade; level locked forever", 18, Icons.Default.AllInclusive, "Rebates"),
)

// ─── 5 Stealth Settings ──────────────────────────────────────────────────────

private data class StealthSetting(
    val key: String, val label: String, val desc: String, val reqLevel: Int
)

private val STEALTH_SETTINGS = listOf(
    StealthSetting("mysteriousVisitor", "Mysterious Visitor", "Visit profiles incognito", 5),
    StealthSetting("hideGiftRecord", "Hide Gift Record", "Hide gift records publicly", 8),
    StealthSetting("rankInvisible", "Rank Invisibility", "Hide from leaderboards", 9),
    StealthSetting("roomInvisible", "Room Stealth Entry", "Enter rooms silently", 12),
    StealthSetting("avoidBeingKicked", "Kick Immunity", "Immune to kicks & bans", 13),
)

// ─── Main Composable ─────────────────────────────────────────────────────────

@Composable
fun VipStoreScreen(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    var selectedLevel by remember { mutableIntStateOf(1) }
    var userSvip by remember { mutableIntStateOf(0) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var svipConfig by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var stealthToggles by remember { mutableStateOf(mapOf<String, Boolean>()) }
    var badgeUrl by remember { mutableStateOf<String?>(null) }
    var levelBgUrl by remember { mutableStateOf<String?>(null) }
    var showRules by remember { mutableStateOf(false) }
    var showStealthDrawer by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }

    // Infinite float animation
    val infiniteTransition = rememberInfiniteTransition(label = "float")
    val floatY by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = -10f,
        animationSpec = infiniteRepeatable(tween(4000, easing = LinearEasing), RepeatMode.Reverse), label = "floatY"
    )
    val floatRotation by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(4000, easing = LinearEasing), RepeatMode.Reverse), label = "floatRotation"
    )

    // Sparkle animations (6 stars with different delays)
    val sparkles = List(6) { index ->
        val delay = index * 300
        val duration = 3000 + (index * 500)
        infiniteTransition.animateFloat(
            initialValue = 0.2f, targetValue = 1f,
            animationSpec = infiniteRepeatable(
                tween(duration, delayMillis = delay, easing = LinearEasing), RepeatMode.Reverse
            ), label = "sparkle$index"
        )
    }

    // Orbital ring rotation
    val orbitalSpin by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(40000, easing = LinearEasing), RepeatMode.Restart), label = "orbital"
    )

    // Nebula drift
    val nebulaDrift by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 20f,
        animationSpec = infiniteRepeatable(tween(10000, easing = LinearEasing), RepeatMode.Reverse), label = "nebula"
    )

    // Fetch data
    LaunchedEffect(uid) {
        try {
            // User profile
            if (uid.isNotEmpty()) {
                val userSnap = db.collection("users").document(uid).get().await()
                userSvip = (userSnap.getLong("svip") ?: 0).toInt()

                val profileSnap = db.collection("users").document(uid).collection("profile").document(uid).get().await()
                userProfile = profileSnap.data

                // Stealth toggles
                val toggles = mutableMapOf<String, Boolean>()
                STEALTH_SETTINGS.forEach { setting ->
                    toggles[setting.key] = profileSnap.getBoolean(setting.key) ?: false
                }
                stealthToggles = toggles
            }

            // SVIP Config
            val configSnap = db.collection("settings").document("svipConfig").get().await()
            svipConfig = configSnap.data

            // Read global bgUrl
            levelBgUrl = configSnap.getString("bgUrl")
        } catch (_: Exception) {}
        isLoading = false
    }

    // Update badge/bgUrl when level changes
    LaunchedEffect(selectedLevel, svipConfig) {
        val levels = svipConfig?.get("levels") as? Map<*, *>
        val levelData = levels?.get(selectedLevel.toString()) as? Map<*, *>
        badgeUrl = levelData?.get("badgeUrl") as? String
        val customBg = levelData?.get("bgUrl") as? String
        if (!customBg.isNullOrBlank()) levelBgUrl = customBg
    }

    val currentLevel = SVIP_LEVELS.getOrElse(selectedLevel - 1) { SVIP_LEVELS[0] }
    val tc = getTierColors(selectedLevel)
    val tierName = getTierName(selectedLevel)
    val unlockedCount = PRIVILEGES.count { selectedLevel >= it.level }
    val showCustomBg = !levelBgUrl.isNullOrBlank()

    Box(modifier = Modifier.fillMaxSize()) {
        // ─── Background ──────────────────────────────────────────────
        if (showCustomBg && !levelBgUrl.isNullOrBlank()) {
            // Custom background from Firestore
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFF070922))) {
                AsyncImage(model = levelBgUrl, contentDescription = null, modifier = Modifier.fillMaxSize().alpha(0.7f), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
            }
        } else {
            // Default space background
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFF070922))) {
                // Animated gradient background
                Box(modifier = Modifier.fillMaxSize().background(
                    Brush.linearGradient(listOf(Color(0xFF070922), Color(0xFF1D0F3A), Color(0xFF0B1D3D), Color(0xFF140723)))
                ))

                // Nebula Glow 1 - Violet
                Box(modifier = Modifier.offset(x = nebulaDrift.dp, y = nebulaDrift.dp).size(260.dp).clip(CircleShape).background(Color(0x338B5CF6)).alpha(0.4f))
                // Nebula Glow 2 - Cyan
                Box(modifier = Modifier.align(Alignment.CenterEnd).offset(y = nebulaDrift.dp).size(320.dp).clip(CircleShape).background(Color(0x2606B6D4)).alpha(0.35f))
                // Nebula Glow 3 - Pink
                Box(modifier = Modifier.align(Alignment.BottomCenter).offset(x = nebulaDrift.dp).size(240.dp).clip(CircleShape).background(Color(0x20EC4899)).alpha(0.3f))

                // Sparkle particles
                sparkles.forEachIndexed { index, anim ->
                    val (posX, posY, size) = when (index) {
                        0 -> Triple(0.15f, 0.12f, 4f)
                        1 -> Triple(0.80f, 0.28f, 6f)
                        2 -> Triple(0.08f, 0.45f, 4f)
                        3 -> Triple(0.88f, 0.62f, 4f)
                        4 -> Triple(0.22f, 0.75f, 6f)
                        else -> Triple(0.70f, 0.90f, 4f)
                    }
                    val color = when (index) {
                        1 -> Color(0xFF67E8F9)
                        3 -> Color(0xFFC4B5FD)
                        4 -> Color(0xFFFCD34D)
                        else -> Color.White
                    }
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopStart) {
                        Box(modifier = Modifier.offset(
                            x = (posX * 400).dp, y = (posY * 800).dp
                        ).size(size.dp).clip(CircleShape).background(color.copy(alpha = anim.value)))
                    }
                }

                // Orbital ring
                Box(modifier = Modifier.align(Alignment.Center).size(320.dp).alpha(0.08f).border(1.dp, Color.White.copy(alpha = 0.12f), CircleShape))
                Box(modifier = Modifier.align(Alignment.Center).size(300.dp).alpha(0.05f).border(1.dp, Color.White.copy(alpha = 0.08f), CircleShape))
            }
        }

        // ─── Dynamic Ambient Spotlights ────────────────────────────────
        Box(modifier = Modifier.fillMaxSize()) {
            // Base purple spotlight
            Box(modifier = Modifier.align(Alignment.TopCenter).offset(y = (-100).dp).size(240.dp).clip(CircleShape).background(Color(0x407C3AED)).alpha(0.5f))
            // Tier-specific spotlight
            Box(modifier = Modifier.align(Alignment.TopCenter).offset(y = (-80).dp).size(240.dp).clip(CircleShape).background(tc.glow).alpha(0.5f))
        }

        // ─── Main Content ──────────────────────────────────────────────
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha = 0.1f)).clickable { onBack() }.padding(8.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White, modifier = Modifier.size(20.dp))
                }
                Spacer(modifier = Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("VIP CLUB", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                }
                Spacer(modifier = Modifier.weight(1f))
                Box(modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha = 0.1f)).clickable { showRules = true }.padding(8.dp)) {
                    Icon(Icons.Default.HelpOutline, "Rules", tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }

            // Scrollable content
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).weight(1f)) {
                // ─── Identity & Progress Card ───────────────────────────
                Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), shape = RoundedCornerShape(24.dp)) {
                    Box(modifier = Modifier.fillMaxWidth().background(Color(0xFF0B0E1E).copy(alpha = 0.85f)).padding(20.dp)) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            // Avatar
                            val avatarUrl = userProfile?.get("avatarUrl") as? String
                            Box(modifier = Modifier.size(64.dp).clip(CircleShape).background(Color(0xFF1E293B)).border(2.dp, tc.primary, CircleShape)) {
                                if (!avatarUrl.isNullOrBlank()) {
                                    AsyncImage(model = avatarUrl, contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                                } else {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        Text("👤", fontSize = 28.sp)
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(userProfile?.get("username") as? String ?: "User", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            // Level badge
                            Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Brush.horizontalGradient(tc.badgeGradient)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                                Text("SVIP $userSvip", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            // EXP Progress
                            val progress = ((userProfile?.get("wallet") as? Map<*, *>)?.get("totalSpent") as? Number)?.toLong() ?: 0L
                            val nextLevel = SVIP_LEVELS.getOrElse(selectedLevel) { SVIP_LEVELS.last() }
                            val currentExp = currentLevel.exp
                            val expPct = if (progress >= currentLevel.exp) 1f else (progress.toFloat() / currentLevel.exp).coerceIn(0f, 1f)
                            Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(Color(0xFF1E293B))) {
                                Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(expPct).clip(RoundedCornerShape(4.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFF59E0B), Color(0xFFEAB308)))))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("${progress / 1000000}M / ${currentLevel.points} EXP", color = Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ─── Level Switcher Ribbon ──────────────────────────────
                LazyRow(modifier = Modifier.fillMaxWidth().padding(start = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SVIP_LEVELS) { lvl ->
                        val isSelected = lvl.level == selectedLevel
                        val levelTc = getTierColors(lvl.level)
                        Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(
                            if (isSelected) levelTc.primary.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.05f)
                        ).border(1.dp, if (isSelected) levelTc.primary else Color.Transparent, RoundedCornerShape(12.dp)).clickable {
                            selectedLevel = lvl.level
                        }.padding(horizontal = 12.dp, vertical = 8.dp)) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Lv.${lvl.level}", fontSize = 12.sp, fontWeight = FontWeight.Black, color = if (isSelected) levelTc.text else Color(0xFF94A3B8))
                                Text(lvl.theme.uppercase(), fontSize = 7.sp, color = if (isSelected) levelTc.text.copy(alpha = 0.7f) else Color(0xFF64748B))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ─── 3D Podium + Beast Emblem ──────────────────────────
                Box(modifier = Modifier.fillMaxWidth().height(280.dp), contentAlignment = Alignment.Center) {
                    // Ambient radial spotlight
                    Box(modifier = Modifier.size(200.dp).clip(CircleShape).background(
                        Brush.radialGradient(listOf(tc.glow, Color.Transparent))
                    ))

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        // Emblem - custom badge image or default emblem
                        Box(modifier = Modifier.size(176.dp).offset(y = floatY.dp), contentAlignment = Alignment.Center) {
                            if (!badgeUrl.isNullOrBlank()) {
                                // Custom badge from Firestore
                                Box(modifier = Modifier.size(144.dp).clip(CircleShape).background(Color(0xFF0B0E1E).copy(alpha = 0.6f)).border(2.dp, tc.primary, CircleShape)) {
                                    AsyncImage(model = badgeUrl, contentDescription = "SVIP Badge", modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                                }
                            } else {
                                when (tierName) {
                                    "owl" -> OwlEmblem()
                                    "wolf" -> WolfEmblem()
                                    "lion" -> LionEmblem()
                                    "dragon" -> DragonEmblem()
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        // Level name
                        Text(currentLevel.points, color = tc.text, fontSize = 24.sp, fontWeight = FontWeight.Black)
                        Text("${currentLevel.validity} Validity", color = Color(0xFF94A3B8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // ─── Unlocked Privileges Banner ─────────────────────────
                Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), shape = RoundedCornerShape(16.dp)) {
                    Box(modifier = Modifier.fillMaxWidth().background(tc.primary.copy(alpha = 0.1f)).border(1.dp, tc.primary.copy(alpha = 0.3f), RoundedCornerShape(16.dp)).padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Lock, null, tint = tc.primary, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("$unlockedCount / ${PRIVILEGES.size} Privileges Unlocked", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                                Text("Reach higher levels for more", fontSize = 11.sp, color = Color(0xFF94A3B8))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ─── 3-Column Privileges Grid ──────────────────────────
                Text("PRIVILEGES", color = Color(0xFF94A3B8), fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp, modifier = Modifier.padding(horizontal = 16.dp))
                Spacer(modifier = Modifier.height(8.dp))

                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    PRIVILEGES.chunked(3).forEach { row ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { priv ->
                                val isUnlocked = selectedLevel >= priv.level
                                Card(modifier = Modifier.weight(1f).height(100.dp), shape = RoundedCornerShape(12.dp)) {
                                    Box(modifier = Modifier.fillMaxSize().background(
                                        if (isUnlocked) tc.primary.copy(alpha = 0.08f) else Color(0xFF0B0E1E).copy(alpha = 0.8f)
                                    ).padding(8.dp), contentAlignment = Alignment.Center) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Icon(priv.icon, null, tint = if (isUnlocked) tc.primary else Color(0xFF475569), modifier = Modifier.size(20.dp))
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(priv.name, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = if (isUnlocked) Color.White else Color(0xFF64748B), textAlign = TextAlign.Center, maxLines = 2)
                                            Text("Lv.${priv.level}", fontSize = 7.sp, color = if (isUnlocked) tc.text else Color(0xFF475569))
                                        }
                                    }
                                }
                            }
                            // Fill empty slots
                            repeat(3 - row.size) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                Spacer(modifier = Modifier.height(80.dp))
            }

            // ─── Fixed Footer ───────────────────────────────────────────
            Box(modifier = Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF050711).copy(alpha = 0.95f)))).padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Rules & Benefits", color = Color(0xFF94A3B8), fontSize = 11.sp)
                        Text("View SVIP terms", color = Color(0xFF64748B), fontSize = 10.sp)
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(25.dp)).background(Brush.horizontalGradient(listOf(tc.primary, tc.accent))).clickable { }.padding(horizontal = 24.dp, vertical = 12.dp)) {
                        Text("UPGRADE SVIP", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        // ─── Rules Modal ──────────────────────────────────────────────
        if (showRules) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)).clickable { showRules = false }, contentAlignment = Alignment.Center) {
                Card(modifier = Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.7f), shape = RoundedCornerShape(20.dp)) {
                    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0B0E1E)).padding(20.dp).verticalScroll(rememberScrollState())) {
                        Text("SVIP Rules & Validity", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(16.dp))

                        // Level thresholds
                        Text("Level Thresholds", color = Color(0xFFF59E0B), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        SVIP_LEVELS.forEach { lvl ->
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                Text("Lv.${lvl.level}", color = Color.White, fontSize = 12.sp, modifier = Modifier.width(40.dp), fontWeight = FontWeight.Bold)
                                Text("${lvl.points} EXP", color = Color(0xFF94A3B8), fontSize = 12.sp, modifier = Modifier.width(80.dp))
                                Text(lvl.validity, color = Color(0xFF94A3B8), fontSize = 12.sp, modifier = Modifier.width(70.dp))
                                Text("Maint: ${lvl.maintPoints}", color = Color(0xFF64748B), fontSize = 11.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Validity Groups", color = Color(0xFFF59E0B), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        val groups = listOf(
                            "Silver Owl (1-2): 7 Days | 375K Maint",
                            "Silver Owl (3-6): 15 Days | 1.25M Maint",
                            "Velvet Wolf (7-10): 30 Days | 5.0M Maint",
                            "Fiery Lion (11-15): 45 Days | 20.0M Maint",
                            "Obsidian Dragon (16-18): 60 Days | 100.0M Maint"
                        )
                        groups.forEach { g -> Text("• $g", color = Color(0xFF94A3B8), fontSize = 11.sp, modifier = Modifier.padding(vertical = 2.dp)) }

                        Spacer(modifier = Modifier.height(16.dp))
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF1E293B)).clickable { showRules = false }.padding(12.dp), contentAlignment = Alignment.Center) {
                            Text("Close", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // ─── Stealth Settings Drawer ──────────────────────────────────
        if (showStealthDrawer) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)).clickable { showStealthDrawer = false }, contentAlignment = Alignment.BottomCenter) {
                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
                    Column(modifier = Modifier.fillMaxWidth().background(Color(0xFF070914)).padding(20.dp).verticalScroll(rememberScrollState())) {
                        Box(modifier = Modifier.align(Alignment.CenterHorizontally).width(40.dp).height(4.dp).clip(RoundedCornerShape(2.dp)).background(Color(0xFF334155)))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Stealth Settings", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(16.dp))

                        STEALTH_SETTINGS.forEach { setting ->
                            val isUnlocked = userSvip >= setting.reqLevel
                            val isChecked = stealthToggles[setting.key] ?: false
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(setting.label, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = if (isUnlocked) Color.White else Color(0xFF475569))
                                    Text(setting.desc, fontSize = 11.sp, color = Color(0xFF64748B))
                                    if (!isUnlocked) Text("Requires SVIP ${setting.reqLevel}", fontSize = 10.sp, color = Color(0xFFEF4444))
                                }
                                Switch(
                                    checked = isChecked && isUnlocked,
                                    onCheckedChange = { newValue ->
                                        if (isUnlocked) {
                                            stealthToggles = stealthToggles + (setting.key to newValue)
                                            // Write to Firestore
                                            if (uid.isNotEmpty()) {
                                                db.collection("users").document(uid).collection("profile").document(uid)
                                                    .update(setting.key, newValue)
                                            }
                                        }
                                    },
                                    enabled = isUnlocked
                                )
                            }
                            Divider(color = Color(0xFF1E293B))
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF1E293B)).clickable { showStealthDrawer = false }.padding(12.dp), contentAlignment = Alignment.Center) {
                            Text("Close", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Animal Emblem SVGs (simplified Compose Canvas equivalents)
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun OwlEmblem() {
    // Cyan Owl - RN parity: wings, gem, eyes, dashed circle
    Box(modifier = Modifier.size(176.dp), contentAlignment = Alignment.Center) {
        // Dashed circle
        Box(modifier = Modifier.fillMaxSize().border(1.dp, Color(0xFF22D3EE).copy(alpha = 0.4f), CircleShape))
        // Owl body
        Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFF22D3EE).copy(alpha = 0.3f), Color.Transparent)))) {
            Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("🦉", fontSize = 48.sp)
            }
        }
        // Glowing gem
        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(Color(0xFF22D3EE)).shadow(12.dp, CircleShape))
        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.White))
    }
}

@Composable
private fun WolfEmblem() {
    // Purple Wolf - crescent moon, howling head, amethyst gem
    Box(modifier = Modifier.size(176.dp), contentAlignment = Alignment.Center) {
        Box(modifier = Modifier.fillMaxSize().border(1.dp, Color(0xFFC084FC).copy(alpha = 0.3f), CircleShape))
        Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFA855F7).copy(alpha = 0.3f), Color.Transparent)))) {
            Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("🐺", fontSize = 48.sp)
            }
        }
        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(Color(0xFFD946EF)).shadow(12.dp, CircleShape))
        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.White))
    }
}

@Composable
private fun LionEmblem() {
    // Orange Lion - solar rings, fiery mane, crimson gem
    Box(modifier = Modifier.size(176.dp), contentAlignment = Alignment.Center) {
        Box(modifier = Modifier.fillMaxSize().border(1.dp, Color(0xFFF97316).copy(alpha = 0.4f), CircleShape))
        Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFF97316).copy(alpha = 0.3f), Color.Transparent)))) {
            Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("🦁", fontSize = 48.sp)
            }
        }
        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(Color(0xFFEF4444)).shadow(12.dp, CircleShape))
        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.White))
    }
}

@Composable
private fun DragonEmblem() {
    // Gold Dragon - rotating rings, dragon body, purple jewel
    Box(modifier = Modifier.size(176.dp), contentAlignment = Alignment.Center) {
        Box(modifier = Modifier.fillMaxSize().border(1.5.dp, Color(0xFFFBBF24).copy(alpha = 0.5f), CircleShape))
        Box(modifier = Modifier.fillMaxSize(0.9f).border(0.8.dp, Color(0xFFA855F7).copy(alpha = 0.3f), CircleShape))
        Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFFBBF24).copy(alpha = 0.3f), Color.Transparent)))) {
            Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Text("🐉", fontSize = 48.sp)
            }
        }
        Box(modifier = Modifier.size(18.dp).clip(CircleShape).background(Color(0xFFC084FC)).shadow(14.dp, CircleShape))
        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFFFBBF24)))
    }
}
