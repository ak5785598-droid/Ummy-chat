package app.vercel.ummy_chat.twa.ui.profile

import android.content.Intent
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import app.vercel.ummy_chat.twa.util.CdnUtils

@Composable
fun ProfileScreen(
    onNavigate: (String) -> Unit = {},
    onEditProfile: () -> Unit = {}
) {
    val auth = FirebaseAuth.getInstance()
    val db = FirebaseFirestore.getInstance()
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    // ── Modal states ──
    var showFullProfileDialog by remember { mutableStateOf(false) }
    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showSocialDialog by remember { mutableStateOf(false) }
    var activeSocialTab by remember { mutableStateOf("fans") }
    var showMedalDialog by remember { mutableStateOf(false) }
    var showOfficialCenter by remember { mutableStateOf(false) }
    var showSellerCenter by remember { mutableStateOf(false) }

    // ── Real-time user profile state ──
    val uid = auth.currentUser?.uid
    var username by remember { mutableStateOf("Tribe Member") }
    var avatarUrl by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("Male") }
    var birthday by remember { mutableStateOf<Any?>(null) }
    var country by remember { mutableStateOf<String?>(null) }
    var accountNumber by remember { mutableStateOf("000000") }
    var coins by remember { mutableLongStateOf(0L) }
    var diamonds by remember { mutableLongStateOf(0L) }
    var totalSpent by remember { mutableLongStateOf(0L) }
    var tags by remember { mutableStateOf<List<String>>(emptyList()) }
    var isAdmin by remember { mutableStateOf(false) }
    var bio by remember { mutableStateOf("") }
    var whatsapp by remember { mutableStateOf("") }
    var showBirthday by remember { mutableStateOf(true) }
    var showWhatsapp by remember { mutableStateOf(true) }
    var spaceImages by remember { mutableStateOf<List<String>>(emptyList()) }
    var activeIdBadge by remember { mutableStateOf<Map<*, *>?>(null) }
    var isBudgetId by remember { mutableStateOf(false) }
    var idColor by remember { mutableStateOf("") }
    var userSvip by remember { mutableIntStateOf(0) }

    var fansCount by remember { mutableIntStateOf(0) }
    var followingCount by remember { mutableIntStateOf(0) }
    var friendsCount by remember { mutableIntStateOf(0) }
    var visitorsCount by remember { mutableIntStateOf(0) }

    // Fan/Following IDs for computing friends
    var fanIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var followingIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var userMedalIds by remember { mutableStateOf(setOf<String>()) }

    // ── Firestore listeners ──
    DisposableEffect(uid) {
        if (uid == null) return@DisposableEffect onDispose {}

        // Listen to User document
        val userUnsub = db.collection("users").document(uid)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    username = snapshot.getString("username")
                        ?: snapshot.getString("displayName")
                        ?: snapshot.getString("name") ?: "Tribe Member"
                    avatarUrl = snapshot.getString("avatarUrl")
                        ?: snapshot.getString("photoURL")
                        ?: snapshot.getString("profileImage") ?: ""
                    gender = snapshot.getString("gender") ?: "Male"
                    birthday = snapshot.get("birthday")
                    country = snapshot.getString("country")
                    accountNumber = snapshot.getString("accountNumber") ?: snapshot.getString("id") ?: "000000"
                    isAdmin = snapshot.getBoolean("isAdmin") ?: false

                    val wallet = snapshot.get("wallet") as? Map<*, *>
                    coins = (wallet?.get("coins") as? Number)?.toLong() ?: 0L
                    diamonds = (wallet?.get("diamonds") as? Number)?.toLong() ?: 0L
                    totalSpent = (wallet?.get("totalSpent") as? Number)?.toLong() ?: 0L
                    userSvip = (snapshot.get("svip") as? Number)?.toInt() ?: 0
                }
            }

        // Listen to Profile subdoc for tags + avatar fallback
        val profileUnsub = db.collection("users").document(uid)
            .collection("profile").document(uid)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    @Suppress("UNCHECKED_CAST")
                    tags = (snapshot.get("tags") as? List<String>) ?: emptyList()
                    val subAccNum = snapshot.getString("accountNumber")
                    if (!subAccNum.isNullOrBlank() && subAccNum.matches(Regex("^\\d+$"))) {
                        if (accountNumber == "000000") accountNumber = subAccNum
                    }
                    snapshot.getString("country")?.let { c -> if (country.isNullOrBlank()) country = c }
                    snapshot.getString("gender")?.let { g -> if (gender.isBlank()) gender = g }
                    snapshot.get("birthday")?.let { b -> if (birthday == null) birthday = b }
                    // Avatar fallback from profile subcollection
                    val profileAvatar = snapshot.getString("avatarUrl")
                        ?: snapshot.getString("photoURL")
                        ?: snapshot.getString("profileImage")
                    if (avatarUrl.isBlank() && !profileAvatar.isNullOrBlank()) {
                        avatarUrl = profileAvatar
                    }
                    // Bio fallback
                    val profileBio = snapshot.getString("bio")
                    if (bio.isBlank() && !profileBio.isNullOrBlank()) {
                        bio = profileBio
                    }
                    // WhatsApp, showBirthday, showWhatsapp, spaceImages
                    snapshot.getString("whatsapp")?.let { w -> if (whatsapp.isBlank()) whatsapp = w }
                    snapshot.getBoolean("showBirthday")?.let { showBirthday = it }
                    snapshot.getBoolean("showWhatsapp")?.let { showWhatsapp = it }
                    @Suppress("UNCHECKED_CAST")
                    snapshot.get("spaceImages")?.let { si ->
                        spaceImages = (si as? List<String>) ?: emptyList()
                    }
                    // Medals
                    @Suppress("UNCHECKED_CAST")
                    snapshot.get("medals")?.let { m ->
                        userMedalIds = (m as? List<String>)?.toSet() ?: emptySet()
                    }
                    activeIdBadge = snapshot.get("activeIdBadge") as? Map<*, *>
                    isBudgetId = snapshot.getBoolean("isBudgetId") ?: false
                    idColor = snapshot.getString("idColor") ?: ""
                }
            }

        // Listen to Followers (fans)
        val fansUnsub = db.collection("followers")
            .whereEqualTo("followingId", uid)
            .addSnapshotListener { snap, _ ->
                val docs = snap?.documents ?: emptyList()
                fansCount = docs.size
                fanIds = docs.mapNotNull { it.getString("followerId") }.toSet()
                // Recompute friends
                friendsCount = followingIds.count { it in fanIds }
            }

        // Listen to Following
        val followingUnsub = db.collection("followers")
            .whereEqualTo("followerId", uid)
            .addSnapshotListener { snap, _ ->
                val docs = snap?.documents ?: emptyList()
                followingCount = docs.size
                followingIds = docs.mapNotNull { it.getString("followingId") }.toSet()
                // Recompute friends
                friendsCount = followingIds.count { it in fanIds }
            }

        // Listen to Visitors (7-day filter)
        val sevenDaysAgoDate = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000))
        val visitorsUnsub = db.collection("users").document(uid)
            .collection("profileVisitors")
            .whereGreaterThanOrEqualTo("timestamp", sevenDaysAgoDate)
            .addSnapshotListener { snap, _ ->
                visitorsCount = snap?.documents?.size ?: 0
            }

        onDispose {
            userUnsub.remove()
            profileUnsub.remove()
            fansUnsub.remove()
            followingUnsub.remove()
            visitorsUnsub.remove()
        }
    }

    // ── Derived values ──
    val age = calculateAge(birthday)
    val level = getLevelFromSpent(totalSpent)
    val countryFlag = getCountryFlag(country)
    val displayID = accountNumber.ifBlank { "000000" }
    val adminLevel = getUserAdminLevel(tags, isAdmin, uid ?: "")
    val isAuthorizedAdmin = adminLevel >= 0
    val adminPanelTitle = getAdminPanelTitle(adminLevel)
    val showSellerCentre = isCertifiedSeller(tags, isAuthorizedAdmin)

    val scrollState = rememberScrollState()

    // ══════════════════════════════════════════════════════════════════
    // LAYOUT — Matches React Native profile.tsx exactly
    // ══════════════════════════════════════════════════════════════════
    val isLoading = uid == null || (username == "Tribe Member" && avatarUrl.isBlank() && coins == 0L && diamonds == 0L && tags.isEmpty())

    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color.White),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "SYNCING IDENTITY...",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8),
                letterSpacing = 2.sp
            )
        }
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {

        // ── Background: Purple banner + gradient fade ──
        Column(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(96.dp)
                    .background(Color(0xFFC084FC))
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(128.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFFC084FC), Color(0x00C084FC))
                        )
                    )
            )
        }

        // ── Main scrollable content ──
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .statusBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(top = 8.dp) // Reduced from 32.dp to move name/DP section up
        ) {

            // ══════════════════════════════════════════
            // PROFILE ROW — Avatar LEFT, Info RIGHT
            // ══════════════════════════════════════════
            Row(
                modifier = Modifier
                    .fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(88.dp)
                        .shadow(8.dp, CircleShape)
                        .clip(CircleShape)
                        .background(Color.White)
                        .border(2.dp, Color.White, CircleShape)
                        .clickable { showFullProfileDialog = true },
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = (CdnUtils.toCdn(avatarUrl) ?: "").ifBlank { "https://picsum.photos/200" },
                        contentDescription = "Avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize().clip(CircleShape)
                    )
                }

                // Info Column
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 14.dp, top = 12.dp)
                ) {
                    // Row 1: Username + Flag + Gender/Age + Level
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = username,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E293B),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false),
                            letterSpacing = (-0.5).sp
                        )
                        Text(text = countryFlag, fontSize = 18.sp)
                        GenderAgeTag(gender = gender, age = age)
                        UserLevelBadge(level = level, scale = 1.1f)
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // Row 2: ID Badge + Role Tags (wrapping)
                    @OptIn(ExperimentalLayoutApi::class)
                    FlowRow(
                        modifier = Modifier.offset(x = (-4).dp, y = (-6).dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        // ID Badge
                        Box(
                            modifier = Modifier
                                .clickable {
                                    clipboardManager.setText(AnnotatedString(displayID))
                                }
                        ) {
                            if (tags.contains("Official")) {
                                SVGA_GlossyID(label = "ID: $displayID")
                            } else if (activeIdBadge != null) {
                                ActiveIDBadge(badgeData = activeIdBadge, fallbackNumber = displayID)
                            } else if (isAdmin || (isBudgetId && !idColor.isNullOrBlank() && idColor != "none")) {
                                SovereignIDBadge(
                                    color = if (isAdmin) "gold" else idColor,
                                    number = displayID
                                )
                            } else {
                                // Default ID badge
                                Box(
                                    modifier = Modifier
                                        .background(Color(0xFFF1F5F9), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 3.5.dp)
                                ) {
                                    Text(
                                        text = "ID: $displayID",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF475569)
                                    )
                                }
                            }
                        }

                        // Role Tags — conditional
                        if (tags.contains("Official")) { OfficialTag() }
                        if (tags.contains("Super Admin")) { SuperAdminTag() }
                        if (tags.contains("Manager")) { ManagerTag() }
                        if (tags.contains("Auditor")) { AuditorTag() }
                        if (tags.contains("Admin")) { AdminTag() }
                        if (tags.any { it in listOf("Seller", "Seller center", "Coin Seller") }) { SellerTag() }
                        if (tags.contains("CS Leader")) { CSLeaderTag() }
                        if (tags.contains("Customer Service")) { CustomerServiceTag() }
                        if (tags.contains("Service")) { ServiceTag() }
                        if (tags.contains("Host")) { HostTag() }
                    }
                }
            }

            // ══════════════════════════════════════════
            // STATS BAR — Extended Width for Maximum Inter-gap
            // ══════════════════════════════════════════
            val screenWidth = LocalConfiguration.current.screenWidthDp.dp
            Row(
                modifier = Modifier
                    .requiredWidth(screenWidth)
                    .offset(x = (-8).dp)
                    .padding(top = 4.dp, bottom = 12.dp)
                    .drawBehind {
                        val strokeWidth = 1.dp.toPx()
                        val lineY = size.height - 6.dp.toPx()
                        drawLine(
                            color = Color(0xFFF1F5F9).copy(alpha = 0.4f),
                            start = Offset(0f, lineY),
                            end = Offset(size.width, lineY),
                            strokeWidth = strokeWidth
                        )
                    },
                verticalAlignment = Alignment.CenterVertically
            ) {
                ProfileStatItem(count = fansCount, label = "FANS", modifier = Modifier.weight(1f)) {
                    activeSocialTab = "fans"; showSocialDialog = true
                }
                ProfileStatItem(count = followingCount, label = "FOLLOWING", modifier = Modifier.weight(1f)) {
                    activeSocialTab = "following"; showSocialDialog = true
                }
                ProfileStatItem(count = friendsCount, label = "FRIENDS", modifier = Modifier.weight(1f)) {
                    activeSocialTab = "friends"; showSocialDialog = true
                }
                ProfileStatItem(count = visitorsCount, label = "VISITORS", modifier = Modifier.weight(1f).offset(x = 6.dp)) {
                    activeSocialTab = "visitors"; showSocialDialog = true
                }
            }

            // ══════════════════════════════════════════
            // WALLET CARDS — marginTop: -4 (overlap stats bar)
            // ══════════════════════════════════════════
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-16).dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Coins Card
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(85.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFFFD700), Color(0xFFFDB931), Color(0xFF9E7302))
                            )
                        )
                        .clickable { onNavigate("/wallet") }
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    // Top: Icon + Label
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.align(Alignment.TopStart)
                    ) {
                        GoldDollarIcon(size = 32)
                        Text(
                            text = "COINS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF5C4000),
                            letterSpacing = 1.sp
                        )
                    }
                    // Bottom: Value
                    val coinsStr = formatWalletNumber(coins)
                    val coinsFontSize = when {
                        coinsStr.length <= 9 -> 30.sp
                        coinsStr.length <= 11 -> 24.sp
                        coinsStr.length <= 13 -> 20.sp
                        else -> 16.sp
                    }
                    Text(
                        text = coinsStr,
                        fontSize = coinsFontSize,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF422E00),
                        letterSpacing = (-0.5).sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.align(Alignment.BottomStart)
                    )
                }

                // Diamonds Card
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(85.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF00D2FF), Color(0xFF3A7BD5), Color(0xFF004E92))
                            )
                        )
                        .clickable { onNavigate("/wallet") }
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    // Top: Icon + Label
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.align(Alignment.TopStart)
                    ) {
                        PremiumDiamondIcon(size = 32)
                        Text(
                            text = "DIAMONDS",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            letterSpacing = 1.sp
                        )
                    }
                    // Bottom: Value
                    val diamondsStr = formatWalletNumber(diamonds)
                    val diamondsFontSize = when {
                        diamondsStr.length <= 9 -> 30.sp
                        diamondsStr.length <= 11 -> 24.sp
                        diamondsStr.length <= 13 -> 20.sp
                        else -> 16.sp
                    }
                    Text(
                        text = diamondsStr,
                        fontSize = diamondsFontSize,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.5).sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.align(Alignment.BottomStart)
                    )
                }
            }

            // ══════════════════════════════════════════
            // VIP BANNER — marginTop: -8 (overlap)
            // ══════════════════════════════════════════
            Box(modifier = Modifier.offset(y = (-12).dp)) {
                VIPBanner(onClick = { onNavigate("/vips") })
            }

            // ══════════════════════════════════════════
            // QUICK ACTIONS (4-column) — extends -mx-7 beyond parent
            // ══════════════════════════════════════════
            Row(
                modifier = Modifier
                    .requiredWidth(screenWidth - 32.dp)
                    .offset(x = (-4).dp, y = (-22).dp)
                    .padding(top = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                QuickActionColumn(icon = { LevelCrownIcon() }, label = "LEVEL") { onNavigate("/level") }
                QuickActionColumn(icon = { StoreCartIcon() }, label = "STORE") { onNavigate("/store") }
                QuickActionColumn(icon = { MedalStarIcon() }, label = "MEDAL") { showMedalDialog = true }
                QuickActionColumn(icon = { BonusGiftIcon() }, label = "BONUS") { onNavigate("/bonus") }
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 1.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-24).dp)
            ) {
                Column {
                    ProfileMenuItem(
                        icon = { InviteHeartIcon() },
                        label = "Invite friends",
                        onClick = {
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, "Hey! Download Ummy Chat and join me! My ID is: $displayID")
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Invite Friends"))
                        }
                    )
                    ProfileMenuItem(
                        icon = { FamilyShieldIcon() },
                        label = "Family",
                        onClick = { onNavigate("/families") }
                    )
                    ProfileMenuItem(
                        icon = { BagShirtIcon() },
                        label = "My Item",
                        onClick = { onNavigate("/store") }
                    )
                    ProfileMenuItem(
                        icon = { CpHeartIcon() },
                        label = "Cp/friends",
                        onClick = { onNavigate("/cp-house") }
                    )
                    if (!tags.contains("Official center") && !tags.contains("Agency") && !tags.contains("Official")) {
                        ProfileMenuItem(
                            icon = { 
                                Icon(
                                    imageVector = Icons.Default.BusinessCenter, 
                                    contentDescription = null,
                                    tint = Color(0xFF6366F1),
                                    modifier = Modifier.size(22.dp)
                                ) 
                            },
                            label = "Apply for Agency/Center",
                            onClick = { onNavigate("/agency-application") }
                        )
                    }
                    if (showSellerCentre) {
                        ProfileMenuItem(
                            icon = { SellerBagIcon() },
                            label = "Seller Centre",
                            onClick = { showSellerCenter = true }
                        )
                    }
                    if (isAuthorizedAdmin) {
                        ProfileMenuItem(
                            icon = { OfficialUserIcon() },
                            label = adminPanelTitle,
                            showDivider = false,
                            onClick = { showOfficialCenter = true }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ══════════════════════════════════════════
            // MENU GROUP 2
            // ══════════════════════════════════════════
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 1.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    ProfileMenuItem(
                        icon = { SettingsIcon() },
                        label = "Settings",
                        onClick = { onNavigate("/settings") }
                    )
                    ProfileMenuItem(
                        icon = { HelpCenterIcon() },
                        label = "Live Support Centre",
                        onClick = { onNavigate("/help-center") }
                    )
                    ProfileMenuItem(
                        icon = { AboutInfoIcon() },
                        label = "About",
                        showDivider = false,
                        onClick = { onNavigate("/about") }
                    )
                }
            }

            // Bottom padding (pb-32 = 128dp)
            Spacer(modifier = Modifier.height(128.dp))
        }

        // ── Edit pencil — absolute top-right (AFTER scrollable Column for correct z-order) ──
        IconButton(
            onClick = { showEditProfileDialog = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 0.dp, end = 4.dp) // Reduced end padding from 12.dp to 4.dp to move further right
                .statusBarsPadding()
        ) {
            Icon(
                imageVector = Icons.Default.Edit,
                contentDescription = "Edit Profile",
                tint = Color(0xFF4B5563),
                modifier = Modifier.size(24.dp)
            )
        }
    }

    // ══════════════════════════════════════════
    // DIALOGS
    // ══════════════════════════════════════════
    if (showEditProfileDialog) {
        EditProfileDialog(
            onDismissRequest = { showEditProfileDialog = false },
            initialUsername = username,
            initialBio = bio,
            initialGender = gender,
            initialCountry = country ?: "",
            initialBirthday = birthday?.toString() ?: "",
            initialWhatsapp = whatsapp,
            initialAvatarUrl = avatarUrl,
            initialShowBirthday = showBirthday,
            initialShowWhatsapp = showWhatsapp,
            initialSpaceImages = spaceImages,
            initialTags = tags,
            onSaved = {
                // Reload profile data after save
            }
        )
    }

    val initialTabIndex = when (activeSocialTab) {
        "following" -> 1
        "friends" -> 2
        "visitors" -> 3
        else -> 0
    }
    SocialRelationsDialog(
        visible = showSocialDialog,
        currentUid = uid ?: "",
        isSvip = userSvip > 0,
        initialTab = initialTabIndex,
        username = username,
        onDismissRequest = { showSocialDialog = false }
    )

    if (showMedalDialog) {
        MedalModal(
            onDismissRequest = { showMedalDialog = false }
        )
    }

    FullProfileDialog(
        visible = showFullProfileDialog,
        onDismiss = { showFullProfileDialog = false },
        onApplyFamily = { onNavigate("/family") },
        username = username,
        accountNumber = displayID,
        avatarUrl = avatarUrl,
        gender = gender,
        birthday = birthday,
        country = country,
        bio = bio,
        coins = coins,
        diamonds = diamonds,
        totalSpent = totalSpent,
        tags = tags,
        isAdmin = isAdmin,
        spaceImages = spaceImages,
        fanCount = fansCount,
        followingCount = followingCount,
        friendsCount = friendsCount,
        visitorsCount = visitorsCount,
        userMedals = userMedalIds.toList(),
        userId = uid ?: "",
        isOwnProfile = true
    )

    // ── Official Center Dialog ──
    OfficialCenterDialog(
        visible = showOfficialCenter,
        onDismiss = { showOfficialCenter = false },
        isAuthorized = isAuthorizedAdmin,
        userLevel = adminLevel,
        onNavigate = onNavigate
    )

    // ── Seller Transfer Dialog ──
    SellerTransferDialog(
        visible = showSellerCenter,
        onDismiss = { showSellerCenter = false },
        userTags = tags,
        userCoins = coins
    )
}

// ══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════

private fun formatWalletNumber(value: Long): String {
    return "%,d".format(value)
}

// ══════════════════════════════════════════════════════
// HELPER COMPOSABLES
// ══════════════════════════════════════════════════════

@Composable
fun ProfileStatItem(count: Int, label: String, modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .clickable { onClick() }
            .padding(vertical = 4.dp)
    ) {
        Text(
            text = (count).toString(),
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF1F2937)
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF94A3B8),
            letterSpacing = 0.5.sp,
            maxLines = 1
        )
    }
}

@Composable
fun QuickActionColumn(icon: @Composable () -> Unit, label: String, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(8.dp)
    ) {
        icon()
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF64748B),
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun ProfileMenuItem(
    icon: @Composable () -> Unit,
    label: String,
    extra: String? = null,
    extraColor: Color = Color(0xFF6366F1),
    showDivider: Boolean = false,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 16.dp, start = 16.dp, end = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon with colored background
            Box(
                modifier = Modifier
                    .padding(end = 16.dp)
            ) {
                icon()
            }

            // Label
            Text(
                text = label,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF1F2937),
                modifier = Modifier.weight(1f)
            )

            // Extra text
            if (extra != null) {
                Text(
                    text = extra,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = extraColor,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.width(4.dp))
            }

            // Chevron
            Icon(
                imageVector = Icons.Rounded.ChevronRight,
                contentDescription = "Go",
                tint = Color(0xFFCBD5E1),
                modifier = Modifier.size(16.dp)
            )
        }

        if (showDivider) {
            HorizontalDivider(
                thickness = 1.dp,
                color = Color(0xFFF8FAFC),
                modifier = Modifier.padding(horizontal = 0.dp)
            )
        }
    }
}
