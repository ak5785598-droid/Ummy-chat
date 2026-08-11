package app.vercel.ummy_chat.twa.ui.vips

import android.content.Context
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.ui.components.SvipPillBadge
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch
import app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon
import java.text.NumberFormat
import java.util.Locale
import java.util.Calendar

// ─────────────────────────────────────────────────────────────────────────────
// SVIP Club Screen — EXACT RN PARITY
// 18 levels, animal emblems, 17 privileges, stealth toggles, exact theme assets
// ─────────────────────────────────────────────────────────────────────────────

private data class TierColors(
    val primary: Color, val secondary: Color, val accent: Color,
    val glow: Color, val bgStart: Color, val bgEnd: Color,
    val text: Color, val badgeGradient: List<Color>
)

private val OwlColors = TierColors(
    primary = Color(0xFF0EA5E9), secondary = Color(0xFF2563EB), accent = Color(0xFFF59E0B),
    glow = Color(0x664F46E5), bgStart = Color(0xFF0891B2), bgEnd = Color(0xFF1D4ED8),
    text = Color(0xFF22D3EE), badgeGradient = listOf(Color(0xFF0EA5E9), Color(0xFF3B82F6), Color(0xFF1D4ED8))
)
private val WolfColors = TierColors(
    primary = Color(0xFFA855F7), secondary = Color(0xFFD946EF), accent = Color(0xFF0EA5E9),
    glow = Color(0x66A855F7), bgStart = Color(0xFFA855F7), bgEnd = Color(0xFFD946EF),
    text = Color(0xFFC084FC), badgeGradient = listOf(Color(0xFFA855F7), Color(0xFFD946EF), Color(0xFFEC4899))
)
private val ScorpionColors = TierColors(
    primary = Color(0xFF06B6D4), secondary = Color(0xFF0891B2), accent = Color(0xFF3B82F6),
    glow = Color(0x660891B2), bgStart = Color(0xFF0891B2), bgEnd = Color(0xFF06B6D4),
    text = Color(0xFF2DD4BF), badgeGradient = listOf(Color(0xFF0891B2), Color(0xFF06B6D4), Color(0xFF2563EB))
)
private val LionColors = TierColors(
    primary = Color(0xFFF97316), secondary = Color(0xFFF59E0B), accent = Color(0xFFEF4444),
    glow = Color(0x66F97316), bgStart = Color(0xFFF97316), bgEnd = Color(0xFFEF4444),
    text = Color(0xFFFDBA74), badgeGradient = listOf(Color(0xFFF97316), Color(0xFFF59E0B), Color(0xFFEF4444))
)
private val TigerColors = TierColors(
    primary = Color(0xFFD97706), secondary = Color(0xFFEAB308), accent = Color(0xFFF59E0B),
    glow = Color(0x66EAB308), bgStart = Color(0xFFD97706), bgEnd = Color(0xFFF59E0B),
    text = Color(0xFFFDE047), badgeGradient = listOf(Color(0xFFD97706), Color(0xFFEAB308), Color(0xFFF59E0B))
)
private val DragonColors = TierColors(
    primary = Color(0xFFEAB308), secondary = Color(0xFFD97706), accent = Color(0xFF7C3AED),
    glow = Color(0x66EAB308), bgStart = Color(0xFFEAB308), bgEnd = Color(0xFF7C3AED),
    text = Color(0xFFFDE047), badgeGradient = listOf(Color(0xFFEAB308), Color(0xFFD97706), Color(0xFF7C3AED))
)

private fun getTierColors(level: Int): TierColors = when {
    level >= 16 -> DragonColors
    level >= 13 -> TigerColors
    level >= 10 -> LionColors
    level >= 7 -> ScorpionColors
    level >= 4 -> WolfColors
    else -> OwlColors
}

private fun getTierTheme(level: Int): String = when {
    level >= 16 -> "dragon"
    level >= 13 -> "tiger"
    level >= 10 -> "lion"
    level >= 7 -> "scorpion"
    level >= 4 -> "wolf"
    else -> "owl"
}

private fun getDrawableResId(context: Context, name: String): Int {
    return context.resources.getIdentifier(name, "drawable", context.packageName)
}

private data class SvipLevel(
    val level: Int, val name: String, val points: String, val exp: Long,
    val pointsBack: String, val pointsBackExp: Long, val monthlyCoins: Long, val theme: String
)

private val SVIP_LEVELS = listOf(
    SvipLevel(1, "SVIP 1", "8.0M", 80000000, "2.4M", 24000000, 400000, "owl"),
    SvipLevel(2, "SVIP 2", "24.0M", 240000000, "8.0M", 80000000, 1600000, "owl"),
    SvipLevel(3, "SVIP 3", "80.0M", 800000000, "32.0M", 320000000, 5600000, "owl"),
    SvipLevel(4, "SVIP 4", "200.0M", 2000000000, "80.0M", 800000000, 16000000, "wolf"),
    SvipLevel(5, "SVIP 5", "400.0M", 4000000000, "200.0M", 2000000000, 36000000, "wolf"),
    SvipLevel(6, "SVIP 6", "800.0M", 8000000000, "400.0M", 4000000000, 80000000, "wolf"),
    SvipLevel(7, "SVIP 7", "1.36B", 13600000000, "800.0M", 8000000000, 136000000, "scorpion"),
    SvipLevel(8, "SVIP 8", "2.16B", 21600000000, "1.36B", 13600000000, 216000000, "scorpion"),
    SvipLevel(9, "SVIP 9", "3.6B", 36000000000, "2.16B", 21600000000, 360000000, "scorpion"),
    SvipLevel(10, "SVIP 10", "5.6B", 56000000000, "3.6B", 36000000000, 400000000, "lion"),
    SvipLevel(11, "SVIP 11", "8.4B", 84000000000, "5.6B", 56000000000, 484000000, "lion"),
    SvipLevel(12, "SVIP 12", "12.0B", 120000000000, "8.4B", 84000000000, 576000000, "lion"),
    SvipLevel(13, "SVIP 13", "16.8B", 168000000000, "12.0B", 120000000000, 676000000, "tiger"),
    SvipLevel(14, "SVIP 14", "22.4B", 224000000000, "16.8B", 168000000000, 784000000, "tiger"),
    SvipLevel(15, "SVIP 15", "30.0B", 300000000000, "22.4B", 224000000000, 900000000, "tiger"),
    SvipLevel(16, "SVIP 16", "40.0B", 400000000000, "30.0B", 300000000000, 1024000000, "dragon"),
    SvipLevel(17, "SVIP 17", "52.0B", 520000000000, "40.0B", 400000000000, 1156000000, "dragon"),
    SvipLevel(18, "SVIP 18", "68.0B", 680000000000, "52.0B", 520000000000, 1296000000, "dragon")
)

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
    Privilege(27, "Diamond Conversion Buff", "Higher limit for coin-to-diamond swaps", 17, Icons.Default.Star, "Rebates"),
    Privilege(28, "VIP Liaison Officer", "24/7 dedicated support representative", 17, Icons.Default.Groups, "Interaction"),
    Privilege(30, "Global Server Broadcast", "Announce presence to all rooms globally", 18, Icons.Default.CellTower, "VFX"),
    Privilege(31, "Infinite Validity Lock", "Never downgrade; level locked forever", 18, Icons.Default.AllInclusive, "Rebates"),
)

private data class PrivilegeSetting(val key: String, val label: String, val desc: String, val reqLevel: Int)

private val PRIVILEGE_SETTINGS = listOf(
    PrivilegeSetting("enteringSound", "Entering Sound", "Audio sound wave chime on room entry", 2),
    PrivilegeSetting("silverGreetingCard", "Silver Greeting Card", "Gleaming Owl entry greeting card", 4),
    PrivilegeSetting("mysteriousVisitor", "Mysterious Visitor", "Visit profiles incognito", 5),
    PrivilegeSetting("exclusiveGift", "Exclusive Gift", "Unlock core token gifting item", 5),
    PrivilegeSetting("weeklyCoinRebate", "Weekly Coin Rebate", "Daily claimable coin multiplier bonuses", 6),
    PrivilegeSetting("hideGiftRecord", "Hide Gift Record", "Hide gift records publicly", 8),
    PrivilegeSetting("rankInvisible", "Rank Invisibility", "Hide from leaderboards", 9),
    PrivilegeSetting("privateSpaceAlbum", "Private Space Album", "Hidden album with access key control", 10),
    PrivilegeSetting("crimsonNameplate", "Crimson Nameplate", "Stand out with bold red nameplate text", 11),
    PrivilegeSetting("roomInvisible", "Room Stealth Entry", "Enter rooms silently", 12),
    PrivilegeSetting("avoidBeingKicked", "Kick Immunity", "Immune to kicks & bans", 13),
    PrivilegeSetting("cpRoomDecoration", "CP Room Decoration", "Custom themed luxury CP room design", 14),
    PrivilegeSetting("customMicroBadge", "Custom Micro-Badge", "Personalized mini icon next to name", 15),
    PrivilegeSetting("diamondConversionBuff", "Diamond Conversion Buff", "Higher limit for coin-to-diamond swaps", 17),
    PrivilegeSetting("vipLiaisonOfficer", "VIP Liaison Officer", "24/7 dedicated support representative", 17),
    PrivilegeSetting("globalServerBroadcast", "Global Server Broadcast", "Announce presence to all rooms globally", 18),
    PrivilegeSetting("infiniteValidityLock", "Infinite Validity Lock", "Never downgrade; level locked forever", 18)
)

// Helper for Animated Wave
@Composable
fun AnimatedWaveWidget(theme: String) {
    val infiniteTransition = rememberInfiniteTransition(label = "wave")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(animation = tween(1500, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "scale"
    )
    val color = when(theme) {
        "dragon" -> Color(0xFFEAB308)
        "tiger" -> Color(0xFFF59E0B)
        "lion" -> Color(0xFFEF4444)
        "scorpion" -> Color(0xFF06B6D4)
        "wolf" -> Color(0xFFA855F7)
        else -> Color(0xFF3B82F6)
    }
    
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.Canvas(modifier = Modifier.size(60.dp)) {
            drawCircle(color = color.copy(alpha = 0.2f), radius = size.minDimension / 2 * scale)
            drawCircle(color = color.copy(alpha = 0.5f), radius = size.minDimension / 2 * (scale * 0.7f))
            drawCircle(color = color, radius = size.minDimension / 2 * 0.4f)
        }
    }
}

@Composable
fun VipStoreScreen(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var selectedLevel by remember { mutableIntStateOf(1) }
    var userSvip by remember { mutableIntStateOf(0) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var svipConfig by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var stealthToggles by remember { mutableStateOf(mapOf<String, Boolean>()) }
    var monthlySpent by remember { mutableLongStateOf(0L) }
    var coinsBalance by remember { mutableLongStateOf(0L) }
    var monthlyClaimed by remember { mutableStateOf(false) }

    var showRules by remember { mutableStateOf(false) }
    var showStealthDrawer by remember { mutableStateOf(false) }
    var isPurchaseOpen by remember { mutableStateOf(false) }
    var showMonthlyInfo by remember { mutableStateOf(false) }
    var isPurchasing by remember { mutableStateOf(false) }

    // Real-Time Listeners (RN Parity)
    DisposableEffect(uid) {
        val configListener = db.collection("settings").document("svipConfig")
            .addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) svipConfig = snap.data
            }

        val profileListener = if (uid.isNotEmpty()) {
            db.collection("users").document(uid).collection("profile").document(uid)
                .addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        val data = snap.data ?: return@addSnapshotListener
                        userProfile = data
                        val tags = data["tags"] as? List<*>
                        val isOfficial = tags?.any { it.toString() in listOf("Official", "Admin", "Creator", "Super Admin", "Official center") } == true || uid == "901piBzTQ0VzCtAvlyyobwvAaTs1"
                        val rawSvip = (data["svip"] as? Number)?.toInt() ?: 0
                        userSvip = if (isOfficial) maxOf(rawSvip, 17) else rawSvip
                        val wallet = data["wallet"] as? Map<*, *>
                        monthlySpent = (wallet?.get("monthlySpent") as? Number)?.toLong() ?: 0L
                        coinsBalance = (wallet?.get("coins") as? Number)?.toLong() ?: 0L

                        val toggles = mutableMapOf<String, Boolean>()
                        PRIVILEGE_SETTINGS.forEach { setting ->
                            toggles[setting.key] = data[setting.key] as? Boolean ?: true // Default to true so privileges auto-apply
                        }
                        stealthToggles = toggles

                        // Parse claimed timestamp
                        val claimedAt = snap.getTimestamp("svipMonthlyClaimedAt")?.toDate()
                        if (claimedAt != null) {
                            val claimCal = Calendar.getInstance().apply { time = claimedAt }
                            val nowCal = Calendar.getInstance()
                            monthlyClaimed = (claimCal.get(Calendar.MONTH) == nowCal.get(Calendar.MONTH)) &&
                                             (claimCal.get(Calendar.YEAR) == nowCal.get(Calendar.YEAR))
                        } else {
                            monthlyClaimed = false
                        }
                    }
                }
        } else null

        onDispose {
            configListener.remove()
            profileListener?.remove()
        }
    }

    val currentLevel = SVIP_LEVELS.getOrElse(selectedLevel - 1) { SVIP_LEVELS[0] }
    val tc = getTierColors(selectedLevel)
    val theme = getTierTheme(selectedLevel)
    val unlockedCount = PRIVILEGES.count { userSvip >= it.level }

    // Actions
    val handleClaimMonthlyCoins = {
        if (!monthlyClaimed && userSvip > 0 && uid.isNotEmpty()) {
            coroutineScope.launch {
                try {
                    val batch = db.batch()
                    val profileRef = db.collection("users").document(uid).collection("profile").document(uid)
                    val userRef = db.collection("users").document(uid)
                    
                    val coinsToAdd = SVIP_LEVELS.find { it.level == userSvip }?.monthlyCoins ?: 0L
                    if (coinsToAdd > 0) {
                        batch.update(profileRef, mapOf(
                            "wallet.coins" to FieldValue.increment(coinsToAdd),
                            "svipMonthlyClaimedAt" to FieldValue.serverTimestamp()
                        ))
                        batch.update(userRef, mapOf(
                            "wallet.coins" to FieldValue.increment(coinsToAdd)
                        ))
                        batch.commit().await()
                    }
                } catch (e: Exception) {
                    // ignore
                }
            }
        }
    }

    val executeSvipPurchase = { targetExp: Long ->
        if (!isPurchasing && uid.isNotEmpty()) {
            coroutineScope.launch {
                isPurchasing = true
                try {
                    val cost = (targetExp - monthlySpent).coerceAtLeast(0L)
                    if (coinsBalance >= cost) {
                        val batch = db.batch()
                        val profileRef = db.collection("users").document(uid).collection("profile").document(uid)
                        val userRef = db.collection("users").document(uid)
                        
                        val updates = mapOf(
                            "wallet.coins" to FieldValue.increment(-cost),
                            "wallet.monthlySpent" to FieldValue.increment(cost),
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                        batch.update(profileRef, updates)
                        batch.update(userRef, updates)
                        batch.commit().await()
                        isPurchaseOpen = false
                    }
                } catch (e: Exception) {
                    // ignore
                } finally {
                    isPurchasing = false
                }
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        
        // ─── Background Parallax (RN Parity) ──────────────────────────────────
        val bgResId = getDrawableResId(context, "dangerous_${theme}_bg")
        if (bgResId != 0) {
            Image(
                painter = painterResource(id = bgResId),
                contentDescription = null,
                modifier = Modifier.fillMaxSize().alpha(0.85f),
                contentScale = ContentScale.Crop
            )
        }

        // ─── Top Center Absolute Mascot Badge ──────────────────────────────────
        val levelsConfig = svipConfig?.get("levels") as? Map<*, *>
        val levelData = levelsConfig?.get(selectedLevel.toString()) as? Map<*, *>
        val badgeUrl = levelData?.get("badgeUrl") as? String
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(320.dp)
                .offset(y = 45.dp),
            contentAlignment = Alignment.Center
        ) {
            if (!badgeUrl.isNullOrBlank()) {
                AsyncImage(
                    model = badgeUrl,
                    contentDescription = "SVIP Badge",
                    modifier = Modifier.size(240.dp),
                    contentScale = ContentScale.Fit
                )
            }
        }

        // ─── Main Content ─────────────────────────────────────────────────────
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 8.dp)
                    .offset(y = (-8).dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                    .clickable { onBack() }
                    .padding(8.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(20.dp))
                }
                Text("VIP CLUB", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                        .clickable { showRules = true }
                        .padding(8.dp)
                    ) {
                        Icon(Icons.Default.HelpOutline, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(18.dp))
                    }
                    Box(modifier = Modifier
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                        .clickable { showStealthDrawer = true }
                        .padding(8.dp)
                    ) {
                        Icon(Icons.Default.Settings, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(18.dp))
                    }
                }
            }

            // Scrollable Body
            Column(modifier = Modifier
                .verticalScroll(rememberScrollState())
                .weight(1f)
                .padding(horizontal = 16.dp)
            ) {
                // Offset spacer to push content below the absolute positioned mascot badge
                Spacer(modifier = Modifier.height(230.dp))

                // Select SVIP Level Header
                Text(
                    text = "SELECT SVIP LEVEL",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier.padding(start = 4.dp, top = 24.dp, bottom = 8.dp)
                )

                // Level Switcher LazyRow
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(SVIP_LEVELS) { lvl ->
                        val isSelected = selectedLevel == lvl.level
                        val isUserLevel = userSvip >= lvl.level
                        val ltc = getTierColors(lvl.level)
                        
                        Box(
                            modifier = Modifier
                                .height(42.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) ltc.bgStart.copy(alpha = 0.2f) else Color(0x990F0F19))
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) ltc.glow else ltc.primary.copy(alpha = 0.3f),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable { selectedLevel = lvl.level }
                                .padding(horizontal = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (isUserLevel) {
                                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(10.dp))
                                }
                                Text(
                                    text = lvl.name,
                                    color = if (isSelected) ltc.glow else Color(0xFF94A3B8),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                        }
                    }
                }

                // ─── Identity Progress Card ────────────────────────────────────
                Column(modifier = Modifier.fillMaxWidth().padding(top = 20.dp, bottom = 4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        val avatarUrl = userProfile?.get("avatarUrl") as? String
                        Box(
                            modifier = Modifier
                                .size(110.dp)
                                .offset(x = (-12).dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0F172A))
                                .border(2.dp, Color(0x80A855F7), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!avatarUrl.isNullOrBlank()) {
                                AsyncImage(
                                    model = avatarUrl,
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Text(
                                    text = (userProfile?.get("username") as? String ?: "U").first().uppercase(),
                                    color = Color.White,
                                    fontSize = 48.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = userProfile?.get("username") as? String ?: "Gamer",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (userSvip > 0) {
                                    val levelData = levelsConfig?.get(userSvip.toString()) as? Map<*, *>
                                    val badgeUrl = levelData?.get("badgeUrl") as? String
                                    
                                    SvipPillBadge(level = userSvip, badgeUrlOverride = badgeUrl)
                                } else {
                                    Box(modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF1E293B))
                                        .border(1.dp, Color(0xFF334155), RoundedCornerShape(4.dp))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text("NON-SVIP MEMBER", color = Color(0xFF94A3B8), fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                                    }
                                }
                                Text("ID: ${userProfile?.get("accountNumber") ?: "000000"}", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = Color.White.copy(alpha = 0.05f))
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    val progressPoints = monthlySpent / 10
                    val expPoints = currentLevel.exp / 10
                    val expPct = if (monthlySpent >= currentLevel.exp) 1f else (monthlySpent.toFloat() / currentLevel.exp).coerceIn(0f, 1f)
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("SVIP POINTS PROGRESS", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        Text("${NumberFormat.getNumberInstance(Locale.US).format(progressPoints)} / ${NumberFormat.getNumberInstance(Locale.US).format(expPoints)} Points", color = Color(0xFFFACC15), fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(Color(0xFF020617)).border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(4.dp))) {
                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(expPct).clip(RoundedCornerShape(4.dp)).background(Color(0xFFFACC15)))
                    }
                }

                // ─── SVIP Privileges Grid Showcase (2 Rows x 3 Cols) ───────────
                Spacer(modifier = Modifier.height(16.dp))
                Text("SVIP LEVEL PRIVILEGES", color = Color(0xFFCBD5E1), fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                Spacer(modifier = Modifier.height(12.dp))

                // Grid Container
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Row 1
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Card 1: Gold Coins
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0x4DF59E0B), RoundedCornerShape(16.dp))
                            .clickable { if (userSvip > 0 && selectedLevel <= userSvip) handleClaimMonthlyCoins() else showMonthlyInfo = true }
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        GoldDollarIcon(size = 32)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(if (monthlyClaimed) Color.Gray else Color(0xE6F59E0B)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                                            Text(if (monthlyClaimed) "CLAIMED" else "${NumberFormat.getNumberInstance(Locale.US).format(currentLevel.monthlyCoins)}/Mo", color = Color.Black, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                                Text("gold coins / month", color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            }
                        }

                        // Card 2: Frame Preview
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0xFF3D2A1D), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    val avatarUrl = userProfile?.get("avatarUrl") as? String
                                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF0F172A)), contentAlignment = Alignment.Center) {
                                        if (!avatarUrl.isNullOrBlank()) {
                                            AsyncImage(model = avatarUrl, contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                                        } else {
                                            Text(text = (userProfile?.get("username") as? String ?: "U").first().uppercase(), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    val customFrameUrl = levelData?.get("frameUrl") as? String
                                    if (!customFrameUrl.isNullOrBlank()) {
                                        AsyncImage(model = customFrameUrl, contentDescription = null, modifier = Modifier.size(72.dp), contentScale = ContentScale.Fit)
                                    } else {
                                        val frameId = getDrawableResId(context, "svip_${theme}_frame")
                                        if (frameId != 0) {
                                            Image(painter = painterResource(id = frameId), contentDescription = null, modifier = Modifier.size(72.dp), contentScale = ContentScale.Fit)
                                        }
                                    }
                                }
                                Text("frame", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Card 3: Entrance Preview
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0xFF3D2A1D), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    val entId = getDrawableResId(context, "svip_${theme}_entrance")
                                    if (entId != 0) {
                                        Box(modifier = Modifier.fillMaxWidth().height(42.dp), contentAlignment = Alignment.Center) {
                                            Image(painter = painterResource(id = entId), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                                            Text(
                                                text = (userProfile?.get("username") as? String ?: "USER").uppercase(),
                                                color = Color.White,
                                                fontSize = 8.sp,
                                                fontWeight = FontWeight.Black,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                modifier = Modifier.align(Alignment.CenterEnd).padding(end = 10.dp).offset(y = 2.dp)
                                            )
                                        }
                                    }
                                }
                                Text("entrance", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Row 2
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        // Card 4: Chat Bubble
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0xFF3D2A1D), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    val bubbleId = getDrawableResId(context, "svip_${theme}_bubble")
                                    if (bubbleId != 0) {
                                        Image(painter = painterResource(id = bubbleId), contentDescription = null, modifier = Modifier.fillMaxWidth(0.9f).height(48.dp), contentScale = ContentScale.Fit)
                                    }
                                }
                                Text("bubble", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Card 5: Mic Wave Preview
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0xFF3D2A1D), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    AnimatedWaveWidget(theme = theme)
                                }
                                Text("wave", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Card 6: Level Logo Badge
                        Box(modifier = Modifier
                            .weight(1f)
                            .height(144.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xE6140F0C))
                            .border(1.dp, Color(0xFF3D2A1D), RoundedCornerShape(16.dp))
                            .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                                    val customBadgeUrl = levelData?.get("badgeUrl") as? String
                                    SvipPillBadge(level = selectedLevel, badgeUrlOverride = customBadgeUrl)
                                }
                                Text("logo", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // ─── Counters Banner ───────────────────────────────────────────
                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("SVIP BENEFITS", color = Color(0xFF94A3B8), fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        Text("Unlocked: $unlockedCount / ${PRIVILEGES.size}", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.1f))
                            .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            .clickable { showStealthDrawer = true }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text("STEALTH SETTINGS", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    }
                }

                // ─── Full Privileges Grid (17 items) ───────────────────────────
                Spacer(modifier = Modifier.height(24.dp))
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    PRIVILEGES.chunked(4).forEach { row ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            row.forEach { priv ->
                                val isUnlocked = userSvip >= priv.level
                                val privTc = getTierColors(priv.level)
                                Box(modifier = Modifier.weight(1f).height(100.dp).clip(RoundedCornerShape(16.dp)).background(if (isUnlocked) privTc.primary.copy(alpha = 0.1f) else Color(0xFF1E293B).copy(alpha = 0.5f)).border(1.dp, if (isUnlocked) privTc.primary.copy(alpha = 0.3f) else Color(0xFF334155), RoundedCornerShape(16.dp)).padding(8.dp), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                        Icon(priv.icon, null, tint = if (isUnlocked) privTc.primary else Color(0xFF475569), modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(priv.name, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = if (isUnlocked) Color.White else Color(0xFF64748B), textAlign = TextAlign.Center, maxLines = 2, lineHeight = 11.sp)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("Lv.${priv.level}", fontSize = 8.sp, color = if (isUnlocked) privTc.text else Color(0xFF475569), fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            repeat(4 - row.size) { Spacer(modifier = Modifier.weight(1f)) }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(120.dp)) // padding for bottom bar
            }
        }

        // ─── STICKY BOTTOM BAR (Purchase & Upgrade) ────────────────────────────────
        Box(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Color(0xFF0F172A).copy(alpha = 0.95f)).padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                // Rules Button
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { showRules = true }.padding(horizontal = 8.dp)) {
                    Icon(Icons.Default.MenuBook, null, tint = Color(0xFF94A3B8), modifier = Modifier.size(24.dp))
                    Text("Rules", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                // Upgrade SVIP Button
                Box(
                    modifier = Modifier.weight(1f).height(48.dp).clip(RoundedCornerShape(24.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFEAB308), Color(0xFFF59E0B)))).clickable { isPurchaseOpen = true },
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Bolt, null, tint = Color.Black, modifier = Modifier.size(20.dp))
                        Text("UPGRADE SVIP", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    }
                }
            }
        }

        // ─── Purchase Confirmation Modal ──────────────────────────────────────────
        if (isPurchaseOpen) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.8f)).clickable { isPurchaseOpen = false }, contentAlignment = Alignment.Center) {
                Card(modifier = Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.85f).clickable(enabled = false) {}, shape = RoundedCornerShape(24.dp)) {
                    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0F172A))) {
                        // Header
                        Row(modifier = Modifier.fillMaxWidth().background(Color(0xFF1E293B)).padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Upgrade SVIP", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                            Icon(Icons.Default.Close, null, tint = Color(0xFF94A3B8), modifier = Modifier.clickable { isPurchaseOpen = false })
                        }
                        
                        // Current Status Progress
                        Column(modifier = Modifier.fillMaxWidth().padding(16.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFF1E293B)).padding(16.dp)) {
                            val nextLevel = SVIP_LEVELS.firstOrNull { it.exp > monthlySpent } ?: SVIP_LEVELS.last()
                            val progressPoints = monthlySpent / 10
                            val nextExpPoints = nextLevel.exp / 10
                            val progressPct = if (monthlySpent >= nextLevel.exp) 1f else (monthlySpent.toFloat() / nextLevel.exp).coerceIn(0f, 1f)
                            
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                val currentLevelData = levelsConfig?.get(userSvip.coerceAtLeast(1).toString()) as? Map<*, *>
                                val currentBadgeUrl = currentLevelData?.get("badgeUrl") as? String
                                
                                SvipPillBadge(level = userSvip.coerceAtLeast(1), badgeUrlOverride = currentBadgeUrl)
                                
                                Text("${NumberFormat.getNumberInstance(Locale.US).format(progressPoints)} / ${NumberFormat.getNumberInstance(Locale.US).format(nextExpPoints)}", color = Color(0xFFEAB308), fontSize = 14.sp, fontWeight = FontWeight.Black)
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(Color(0xFF0F172A))) {
                                Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(progressPct).clip(RoundedCornerShape(4.dp)).background(Color(0xFFEAB308)))
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                GoldDollarIcon(size = 16)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(NumberFormat.getNumberInstance(Locale.US).format(coinsBalance), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Level Selection List
                        LazyRow(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(horizontal = 16.dp)) {
                            items(SVIP_LEVELS) { lvl ->
                                val isSelected = selectedLevel == lvl.level
                                val ltc = getTierColors(lvl.level)
                                Box(
                                    modifier = Modifier.height(42.dp).clip(RoundedCornerShape(12.dp)).background(if (isSelected) ltc.bgStart.copy(alpha = 0.2f) else Color(0xFF1E293B)).border(width = if (isSelected) 1.5.dp else 1.dp, color = if (isSelected) ltc.glow else Color.Transparent, shape = RoundedCornerShape(12.dp)).clickable { selectedLevel = lvl.level }.padding(horizontal = 14.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(text = lvl.name, color = if (isSelected) ltc.glow else Color(0xFF94A3B8), fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }

                        // Purchase Summary
                        val cost = Math.max(0L, currentLevel.exp - monthlySpent)
                        val canAfford = coinsBalance >= cost
                        Column(modifier = Modifier.fillMaxWidth().weight(1f).padding(horizontal = 16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            if (cost == 0L) {
                                Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(64.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("ALREADY REACHED", color = Color(0xFF10B981), fontSize = 20.sp, fontWeight = FontWeight.Black)
                            } else {
                                Text("Cost to Reach ${currentLevel.name}", color = Color(0xFF94A3B8), fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    GoldDollarIcon(size = 32)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(NumberFormat.getNumberInstance(Locale.US).format(cost), color = if (canAfford) Color.White else Color(0xFFEF4444), fontSize = 32.sp, fontWeight = FontWeight.Black)
                                }
                                if (!canAfford) {
                                    Text("Insufficient coins", color = Color(0xFFEF4444), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                                }
                            }
                        }

                        // Action Button
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                            val btnEnabled = cost > 0L && canAfford && !isPurchasing
                            val btnText = if (isPurchasing) "PROCESSING..." else if (cost == 0L) "ALREADY UNLOCKED" else "PAY & UPGRADE"
                            val btnColor = if (cost == 0L) Color(0xFF334155) else if (btnEnabled) Color(0xFFEAB308) else Color(0xFF475569)
                            
                            Button(
                                onClick = { if (btnEnabled) executeSvipPurchase(currentLevel.exp) },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = btnColor),
                                shape = RoundedCornerShape(16.dp),
                                enabled = btnEnabled || cost == 0L
                            ) {
                                if (isPurchasing) {
                                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(24.dp))
                                } else {
                                    Text(btnText, color = if (btnEnabled) Color.Black else Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // ─── Monthly Claims Info Modal ──────────────────────────────────────────
        if (showMonthlyInfo) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.8f)).clickable { showMonthlyInfo = false }, contentAlignment = Alignment.Center) {
                Card(modifier = Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.7f).clickable(enabled = false) {}, shape = RoundedCornerShape(24.dp)) {
                    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0F172A))) {
                        Row(modifier = Modifier.fillMaxWidth().background(Color(0xFF1E293B)).padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Monthly Gold Coins", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                            Icon(Icons.Default.Close, null, tint = Color(0xFF94A3B8), modifier = Modifier.clickable { showMonthlyInfo = false })
                        }
                        Column(modifier = Modifier.fillMaxWidth().weight(1f).verticalScroll(rememberScrollState()).padding(16.dp)) {
                            Text("As an SVIP member, you receive a free gold coin salary on the 1st of every month.", color = Color(0xFFCBD5E1), fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(16.dp))
                            SVIP_LEVELS.forEach { lvl ->
                                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(lvl.name, color = getTierColors(lvl.level).glow, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        GoldDollarIcon(size = 14)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("${NumberFormat.getNumberInstance(Locale.US).format(lvl.monthlyCoins)}", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                HorizontalDivider(color = Color(0xFF1E293B))
                            }
                        }
                    }
                }
            }
        }

        // ─── Rules Modal ──────────────────────────────────────────────
        if (showRules) {
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)).clickable { showRules = false }, contentAlignment = Alignment.Center) {
                Card(modifier = Modifier.fillMaxWidth(0.9f).fillMaxHeight(0.7f).clickable(enabled = false) {}, shape = RoundedCornerShape(20.dp)) {
                    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0B0E1E)).padding(20.dp).verticalScroll(rememberScrollState())) {
                        Text("SVIP Rules & Validity", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("1. SVIP points are earned directly by spending gold coins. 10 Coins = 1 EXP Point.", color = Color(0xFF94A3B8), fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("2. SVIP levels are valid for the current and the following month. If you do not maintain the required spending, your level will downgrade.", color = Color(0xFF94A3B8), fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("3. SVIP 18 is locked forever and never downgrades.", color = Color(0xFF94A3B8), fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(24.dp))

                        // Level thresholds
                        Text("Level Thresholds", color = Color(0xFFF59E0B), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        SVIP_LEVELS.forEach { lvl ->
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                Text(lvl.name, color = Color.White, fontSize = 12.sp, modifier = Modifier.width(60.dp), fontWeight = FontWeight.Bold)
                                Text("${lvl.points} EXP", color = Color(0xFF94A3B8), fontSize = 12.sp, modifier = Modifier.weight(1f))
                            }
                        }

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
                Card(modifier = Modifier.fillMaxWidth().clickable(enabled = false) {}, shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
                    Column(modifier = Modifier.fillMaxWidth().background(Color(0xFF070914)).padding(20.dp).verticalScroll(rememberScrollState())) {
                        Box(modifier = Modifier.align(Alignment.CenterHorizontally).width(40.dp).height(4.dp).clip(RoundedCornerShape(2.dp)).background(Color(0xFF334155)))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Stealth Settings", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(16.dp))

                        PRIVILEGE_SETTINGS.forEach { setting ->
                            val isUnlocked = userSvip >= setting.reqLevel
                            val isChecked = stealthToggles[setting.key] ?: false
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(setting.label, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = if (isUnlocked) Color.White else Color(0xFF475569))
                                    Text(setting.desc, fontSize = 12.sp, color = Color(0xFF64748B))
                                    if (!isUnlocked) Text("Requires SVIP ${setting.reqLevel}", fontSize = 11.sp, color = Color(0xFFEF4444))
                                }
                                Switch(
                                    checked = isChecked && isUnlocked,
                                    onCheckedChange = { newValue ->
                                        if (isUnlocked) {
                                            stealthToggles = stealthToggles + (setting.key to newValue)
                                            if (uid.isNotEmpty()) {
                                                val batch = db.batch()
                                                batch.set(db.collection("users").document(uid).collection("profile").document(uid), mapOf(setting.key to newValue), com.google.firebase.firestore.SetOptions.merge())
                                                batch.set(db.collection("users").document(uid), mapOf(setting.key to newValue), com.google.firebase.firestore.SetOptions.merge())
                                                batch.commit()
                                            }
                                        }
                                    },
                                    enabled = isUnlocked,
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = Color.White,
                                        checkedTrackColor = Color(0xFF10B981)
                                    )
                                )
                            }
                            HorizontalDivider(color = Color(0xFF1E293B))
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF1E293B)).clickable { showStealthDrawer = false }.padding(12.dp), contentAlignment = Alignment.Center) {
                            Text("Close", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
