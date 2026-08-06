package app.vercel.ummy_chat.twa.ui.profile

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import app.vercel.ummy_chat.twa.util.CdnUtils

private val ColorWhite = Color.White
private val ColorBg = Color(0xFFFFFFFF)
private val ColorText = Color(0xFF1E293B)
private val ColorTextSecondary = Color(0xFF64748B)
private val ColorTextMuted = Color(0xFF94A3B8)
private val ColorDivider = Color(0xFFF1F5F9)
private val ColorBlue = Color(0xFF2563EB)
private val ColorIndigo = Color(0xFF6366F1)
private val ColorPink = Color(0xFFEC4899)
private val ColorGreen = Color(0xFF22C55E)
private val ColorRed = Color(0xFFEF4444)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun FullProfileDialog(
    visible: Boolean,
    onDismiss: () -> Unit,
    onApplyFamily: () -> Unit = {},
    username: String = "Royal Host User",
    accountNumber: String = "100001",
    avatarUrl: String = "",
    gender: String = "Male",
    birthday: Any? = null,
    country: String? = null,
    bio: String = "",
    coins: Long = 0,
    diamonds: Long = 0,
    totalSpent: Long = 0,
    totalReceived: Long = 0,
    monthlySpent: Long = 0,
    monthlyReceived: Long = 0,
    tags: List<String> = emptyList(),
    isAdmin: Boolean = false,
    svipLevel: Int = 0,
    spaceImages: List<String> = emptyList(),
    fanCount: Int = 0,
    followingCount: Int = 0,
    friendsCount: Int = 0,
    visitorsCount: Int = 0,
    userMedals: List<String> = emptyList(),
    userId: String = "",
    isOwnProfile: Boolean = true,
    onViewProfile: (String) -> Unit = {}
) {
    val db = FirebaseFirestore.getInstance()
    val currentUid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val targetUid = if (userId.isNotBlank()) userId else currentUid
    val clipboardManager = LocalClipboardManager.current
    val screenHeight = LocalConfiguration.current.screenHeightDp.dp
    val scope = rememberCoroutineScope()

    var allMedals by remember { mutableStateOf(listOf<Map<String, Any>>()) }
    var activeTab by remember { mutableIntStateOf(0) }
    var copiedId by remember { mutableStateOf(false) }

    // Family data
    var familyName by remember { mutableStateOf<String?>(null) }
    var familyAvatar by remember { mutableStateOf("") }
    var familyRole by remember { mutableStateOf("Member") }
    var familyMemberCount by remember { mutableIntStateOf(0) }
    var familyMaxMembers by remember { mutableIntStateOf(100) }
    var familyId by remember { mutableStateOf<String?>(null) }

    // Supporters and CP resolution states
    var supporters by remember { mutableStateOf(listOf<Map<String, Any>>()) }
    var supporterCount by remember { mutableIntStateOf(0) }
    val supporterProfiles = remember { mutableStateMapOf<String, Pair<String, String>>() }
    
    var cpPartnerName by remember { mutableStateOf<String?>(null) }
    var cpPartnerAvatar by remember { mutableStateOf("") }
    var cpPartnerUid by remember { mutableStateOf<String?>(null) }

    var showSupportersModal by remember { mutableStateOf(false) }

    // Room status
    var currentRoomId by remember { mutableStateOf<String?>(null) }

    // Fetch all data reactively when targetUid changes
    LaunchedEffect(targetUid) {
        if (targetUid.isBlank()) return@LaunchedEffect
        try {
            // Medals
            val medalsSnap = db.collection("medalsList").get().await()
            allMedals = medalsSnap.documents.mapNotNull { it.data?.plus("id" to it.id) }

            // Family
            try {
                val profileSnap = db.collection("users").document(targetUid)
                    .collection("profile").document(targetUid).get().await()
                val famId = profileSnap.getString("familyId")
                    ?: (profileSnap.get("family") as? Map<*, *>)?.get("id") as? String
                if (!famId.isNullOrBlank()) {
                    familyId = famId
                    val famSnap = db.collection("families").document(famId).get().await()
                    if (famSnap.exists()) {
                        familyName = famSnap.getString("name") ?: famSnap.getString("familyName") ?: "Family"
                        familyAvatar = famSnap.getString("avatarUrl") ?: famSnap.getString("logoUrl") ?: ""
                        familyMemberCount = (famSnap.get("membersCount") as? Number)?.toInt()
                            ?: (famSnap.get("memberCount") as? Number)?.toInt() ?: 0
                        familyMaxMembers = (famSnap.get("maxMembers") as? Number)?.toInt()
                            ?: (famSnap.get("capacity") as? Number)?.toInt() ?: 100
                        @Suppress("UNCHECKED_CAST")
                        val members = famSnap.get("members") as? Map<String, Any>
                        familyRole = if (famSnap.getString("ownerId") == targetUid) "Owner"
                        else members?.get(targetUid) as? String ?: "Member"
                    }
                }
            } catch (_: Exception) {}

            // Supporters
            try {
                val supportSnap = db.collection("supporters")
                    .whereEqualTo("receiverId", targetUid).get().await()
                val list = supportSnap.documents.mapNotNull { it.data?.plus("id" to it.id) }
                supporters = list
                supporterCount = list.size
                
                // Fetch profiles for each supporter to get live name and avatar
                list.forEach { item ->
                    val sId = item["supporterId"]?.toString() ?: ""
                    if (sId.isNotBlank() && !supporterProfiles.containsKey(sId)) {
                        scope.launch {
                            try {
                                val uProfileDoc = db.collection("users").document(sId)
                                    .collection("profile").document(sId).get().await()
                                if (uProfileDoc.exists() && uProfileDoc.getString("username") != null) {
                                    val name = uProfileDoc.getString("username") ?: uProfileDoc.getString("name") ?: "User"
                                    val avatar = uProfileDoc.getString("avatarUrl") ?: ""
                                    supporterProfiles[sId] = Pair(name, avatar)
                                } else {
                                    val uDoc = db.collection("users").document(sId).get().await()
                                    if (uDoc.exists()) {
                                        val name = uDoc.getString("username") ?: uDoc.getString("name") ?: "User"
                                        val avatar = uDoc.getString("avatarUrl") ?: ""
                                        supporterProfiles[sId] = Pair(name, avatar)
                                    }
                                }
                            } catch (_: Exception) {}
                        }
                    }
                }
            } catch (_: Exception) {}

            // CP Pair relationship resolution
            try {
                val cpSnap = db.collection("cpPairs")
                    .whereArrayContains("participantIds", targetUid)
                    .get().await()
                val cpDoc = cpSnap.documents.firstOrNull { it.getString("type") == "CP" }
                if (cpDoc != null) {
                    val pIds = cpDoc.get("participantIds") as? List<*>
                    val partnerId = pIds?.firstOrNull { it != targetUid }?.toString() ?: ""
                    if (partnerId.isNotBlank()) {
                        cpPartnerUid = partnerId
                        val pProfileDoc = db.collection("users").document(partnerId)
                            .collection("profile").document(partnerId).get().await()
                        if (pProfileDoc.exists() && pProfileDoc.getString("username") != null) {
                            cpPartnerName = pProfileDoc.getString("username") ?: pProfileDoc.getString("name") ?: "Partner"
                            cpPartnerAvatar = pProfileDoc.getString("avatarUrl") ?: ""
                        } else {
                            val pDoc = db.collection("users").document(partnerId).get().await()
                            if (pDoc.exists()) {
                                cpPartnerName = pDoc.getString("username") ?: pDoc.getString("name") ?: "Partner"
                                cpPartnerAvatar = pDoc.getString("avatarUrl") ?: ""
                            }
                        }
                    }
                } else {
                    cpPartnerUid = null
                    cpPartnerName = null
                    cpPartnerAvatar = ""
                }
            } catch (_: Exception) {}

            // Room status
            try {
                val userSnap = db.collection("users").document(targetUid).get().await()
                currentRoomId = userSnap.getString("currentRoomId")
            } catch (_: Exception) {}
        } catch (_: Exception) {}
    }

    val age = remember(birthday) { calculateAgeFull(birthday) }
    val level = remember(totalSpent) { getLevelFromSpent(totalSpent) }
    val charmLevel = remember(totalReceived) { getLevelFromSpent(totalReceived) }
    val countryFlag = remember(country) { getCountryFlag(country) }
    val hasOfficialTag = remember(tags) { tags.any { it.contains("Official", true) } }
    val filteredMedals = remember(allMedals, userMedals) {
        allMedals.filter { it["id"] in userMedals }
    }

    // Cover carousel
    val coverImages = if (spaceImages.isNotEmpty()) spaceImages else listOf(avatarUrl)
    val pagerState = rememberPagerState(pageCount = { coverImages.size })

    // Auto-scroll
    LaunchedEffect(coverImages.size) {
        if (coverImages.size <= 1) return@LaunchedEffect
        while (true) {
            delay(3000)
            val next = (pagerState.currentPage + 1) % coverImages.size
            pagerState.animateScrollToPage(next)
        }
    }

    // Supporters sorted
    val sortedSupporters = remember(supporters) {
        supporters.sortedByDescending { (it["totalPoints"] as? Number)?.toLong() ?: 0L }
    }
    val s1 = sortedSupporters.getOrNull(0)
    val s2 = sortedSupporters.getOrNull(1)
    val s3 = sortedSupporters.getOrNull(2)

    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it })
    ) {
        BackHandler { onDismiss() }
        Box(modifier = Modifier.fillMaxSize().zIndex(999f).background(ColorWhite).navigationBarsPadding()) {
            Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {

                // ════════════════════════════════════════════════════════════════
                // COVER IMAGE CAROUSEL — RN line 644: height: SCREEN_HEIGHT * 0.35
                // ════════════════════════════════════════════════════════════════
                Box(modifier = Modifier.fillMaxWidth().height((screenHeight * 0.35f))) {
                    if (coverImages.isNotEmpty() && coverImages[0].isNotBlank()) {
                        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
                            AsyncImage(
                                model = CdnUtils.toCdn(coverImages[page]),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    } else {
                        Box(modifier = Modifier.fillMaxSize().background(Color(0xFFC084FC)))
                    }

                    // Gradient overlay — RN line 646-649
                    Box(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(80.dp)
                        .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x66000000)))))

                    // Back button — below status bar, RN line 651: top:40, left:16, 36x36
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.align(Alignment.TopStart)
                            .statusBarsPadding()
                            .padding(start = 16.dp, top = 8.dp)
                            .size(36.dp).clip(CircleShape).background(Color(0x4D000000))
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = ColorWhite, modifier = Modifier.size(20.dp))
                    }

                    // Dots indicator — RN line 223-229
                    if (coverImages.size > 1) {
                        Row(modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            coverImages.forEachIndexed { index, _ ->
                                Box(modifier = Modifier
                                    .size(if (pagerState.currentPage == index) 16.dp else 6.dp, 6.dp)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(if (pagerState.currentPage == index) Color(0xE6FFFFFF) else Color(0x66FFFFFF)))
                            }
                        }
                    }
                }

                // ════════════════════════════════════════════════════════════════
                // WHITE CARD — RN line 672: marginTop:-32, px:20, borderTopRadius:24
                // ════════════════════════════════════════════════════════════════
                Column(modifier = Modifier.fillMaxWidth().offset(y = (-32).dp)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(ColorWhite).padding(top = 10.dp, bottom = 24.dp)) {

                    // "In Room" Status Pill — RN line 675-735
                    if (currentRoomId != null) {
                        Box(modifier = Modifier.padding(start = 16.dp, top = 4.dp)) {
                            Box(modifier = Modifier.clip(RoundedCornerShape(14.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF38BDF8), Color(0xFF0284C7))))
                                .padding(horizontal = 10.dp, vertical = 5.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    // Equalizer bars
                                    val infiniteTransition = rememberInfiniteTransition()
                                    val bar1 by infiniteTransition.animateFloat(0.3f, 1.2f, infiniteRepeatable(tween(400), RepeatMode.Reverse))
                                    val bar2 by infiniteTransition.animateFloat(0.4f, 1.3f, infiniteRepeatable(tween(350), RepeatMode.Reverse))
                                    val bar3 by infiniteTransition.animateFloat(0.2f, 1.1f, infiniteRepeatable(tween(500), RepeatMode.Reverse))
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.5.dp)) {
                                        Box(modifier = Modifier.width(2.5.dp).height((10 * bar1).dp).clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                        Box(modifier = Modifier.width(2.5.dp).height((14 * bar2).dp).clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                        Box(modifier = Modifier.width(2.5.dp).height((9 * bar3).dp).clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                    }
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text("In Room", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = ColorWhite)
                                }
                            }
                        }
                    } else {
                        Box(modifier = Modifier.padding(start = 16.dp, top = 4.dp)) {
                            Row(modifier = Modifier.clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFE2E8F0))
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(14.dp).clip(CircleShape).background(Color(0xFFCBD5E1)),
                                    contentAlignment = Alignment.Center) {
                                    Text("\uD83C\uDFDB\uFE0F", fontSize = 8.sp)
                                }
                                Spacer(modifier = Modifier.width(5.dp))
                                Text("In Room", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ColorTextSecondary)
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // AVATAR — RN line 738: marginTop:-40, size:88, straddles cover/card
                    // ════════════════════════════════════════════════════════════════
                    Box(modifier = Modifier.fillMaxWidth().offset(y = (-40).dp), contentAlignment = Alignment.Center) {
                        Box(modifier = Modifier.size(88.dp).shadow(8.dp, CircleShape).clip(CircleShape)
                            .border(3.dp, ColorWhite, CircleShape)) {
                            if (avatarUrl.isNotBlank()) {
                                AsyncImage(model = CdnUtils.toCdn(avatarUrl), contentDescription = null,
                                    modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            } else {
                                Box(modifier = Modifier.fillMaxSize().background(Color(0xFF1E293B)),
                                    contentAlignment = Alignment.Center) {
                                    Text("\uD83D\uDC51", fontSize = 42.sp)
                                }
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // USERNAME + FLAG + GENDER — RN line 752-756
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically) {
                        Text(username, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold,
                            color = ColorText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(countryFlag, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        val isFemale = gender.equals("Female", true)
                        Box(modifier = Modifier.clip(RoundedCornerShape(10.dp))
                            .background(if (isFemale) ColorPink else ColorBlue)
                            .padding(horizontal = 6.dp, vertical = 2.dp)) {
                            Text("${if (isFemale) "\u2640" else "\u2642"}${if (age != null) " $age" else ""}",
                                fontSize = 9.sp, fontWeight = FontWeight.Bold, color = ColorWhite)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // ════════════════════════════════════════════════════════════════
                    // ID + LEVEL + SVIP — RN line 759-814
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically) {
                        // ID Badge — tap to copy
                        Box(modifier = Modifier.clip(RoundedCornerShape(6.dp))
                            .background(ColorDivider).clickable {
                                clipboardManager.setText(AnnotatedString(accountNumber))
                                copiedId = true
                                scope.launch { delay(2000); copiedId = false }
                            }.padding(horizontal = 8.dp, vertical = 4.5.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("ID: $accountNumber", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    if (copiedId) Icons.Filled.CheckCircle else Icons.Default.ContentCopy,
                                    contentDescription = null,
                                    modifier = Modifier.size(10.dp),
                                    tint = if (copiedId) ColorGreen else ColorTextMuted
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(4.dp))

                        // Level Badge
                        Box(modifier = Modifier.clip(RoundedCornerShape(10.dp))
                            .background(ColorIndigo).padding(horizontal = 6.dp, vertical = 2.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("\uD83D\uDC8E", fontSize = 8.sp)
                                Spacer(modifier = Modifier.width(2.dp))
                                Text("Lv $level", fontSize = 8.sp, fontWeight = FontWeight.ExtraBold, color = ColorWhite)
                            }
                        }

                        // Family tag pill — RN line 790-812
                        if (familyName != null) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Box(modifier = Modifier.clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF064E3B))
                                .border(1.dp, Color(0xFF10B981), RoundedCornerShape(10.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("\uD83D\uDEE1\uFE0F", fontSize = 9.sp)
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(familyName ?: "", fontSize = 9.sp, fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF6EE7B7), maxLines = 1, overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.widthIn(max = 100.dp))
                                }
                            }
                        }

                        // SVIP Badge
                        if (svipLevel > 0) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Box(modifier = Modifier.clip(RoundedCornerShape(10.dp))
                                .background(getSvipColor(svipLevel)).padding(horizontal = 6.dp, vertical = 2.dp)) {
                                Text("SVIP $svipLevel", fontSize = 8.sp, fontWeight = FontWeight.ExtraBold, color = ColorWhite)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // ════════════════════════════════════════════════════════════════
                    // TAGS — RN line 817-837
                    // ════════════════════════════════════════════════════════════════
                    if (tags.isNotEmpty()) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically) {
                            tags.take(6).forEach { tag ->
                                val (bg, fg) = getTagColors(tag)
                                Box(modifier = Modifier.padding(horizontal = 3.dp).clip(RoundedCornerShape(12.dp))
                                    .background(bg).padding(horizontal = 8.dp, vertical = 3.dp)) {
                                    Text(tag, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = fg)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // ════════════════════════════════════════════════════════════════
                    // STATS BAR — RN line 840-855
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 14.dp, horizontal = 16.dp)
                        .border(1.dp, ColorDivider)) {
                        val statsList = listOf(
                            "Fans" to fanCount, "Following" to followingCount,
                            "Friend" to friendsCount, "Visitors" to visitorsCount
                        )
                        statsList.forEachIndexed { i, (label, value) ->
                            if (i > 0) Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color(0xFFE2E8F0)))
                            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("$value", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0F172A))
                                Text(label.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold,
                                    color = ColorTextMuted, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // FAMILY BANNER — RN line 858-941
                    // ════════════════════════════════════════════════════════════════
                    if (familyName != null) {
                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                            .clip(RoundedCornerShape(16.dp)).background(
                                Brush.linearGradient(listOf(Color(0xFF1C3D32), Color(0xFF2D5A49), Color(0xFF1A332A)))
                            ).padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                                // Family avatar
                                Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(Color(0x1AFFFFFF))) {
                                    if (familyAvatar.isNotBlank()) {
                                        AsyncImage(model = CdnUtils.toCdn(familyAvatar), contentDescription = null,
                                            modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                    }
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                // Family info
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(familyName ?: "", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold,
                                        color = ColorWhite, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 3.dp)) {
                                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFF065F46)).padding(horizontal = 6.dp, vertical = 2.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text("\uD83D\uDEE1\uFE0F", fontSize = 8.sp)
                                                Spacer(modifier = Modifier.width(2.dp))
                                                Text(familyRole, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF6EE7B7))
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("\uD83D\uDC65 $familyMemberCount/$familyMaxMembers", fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold, color = Color(0xCCFFFFFF))
                                    }
                                }
                                // Apply button
                                Box(modifier = Modifier.clip(RoundedCornerShape(20.dp))
                                    .background(Color(0x33FFFFFF))
                                    .border(1.dp, Color(0x66FFFFFF), RoundedCornerShape(20.dp))
                                    .clickable { onApplyFamily() }
                                    .padding(horizontal = 16.dp, vertical = 7.dp)) {
                                    Text("Apply", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = ColorWhite)
                                }
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // RICH & CHARM LEVEL CARDS — RN line 944-984
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        // Rich Level
                        Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(
                            Brush.linearGradient(listOf(Color(0xFF4338CA), Color(0xFF6366F1), Color(0xFF818CF8)))
                        ).padding(12.dp)) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(18.dp).clip(CircleShape).background(Color(0x33FFFFFF)),
                                        contentAlignment = Alignment.Center) { Text("\uD83D\uDC8E", fontSize = 9.sp) }
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Column {
                                        Text("RICH", fontSize = 8.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xB3FFFFFF))
                                        Text("Lv $level", fontSize = 11.sp, fontWeight = FontWeight.Black, color = ColorWhite)
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp))
                                    .background(Color(0x26FFFFFF)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                    Text("Monthly sent: ${formatAmount(monthlySpent)}", fontSize = 7.sp,
                                        fontWeight = FontWeight.ExtraBold, color = Color(0xCCFFFFFF))
                                }
                            }
                        }
                        // Charm Level
                        Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(
                            Brush.linearGradient(listOf(Color(0xFFBE185D), Color(0xFFDB2777), Color(0xFFEC4899)))
                        ).padding(12.dp)) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(18.dp).clip(CircleShape).background(Color(0x33FFFFFF)),
                                        contentAlignment = Alignment.Center) { Text("\uD83D\uDC96", fontSize = 9.sp) }
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Column {
                                        Text("CHARM", fontSize = 8.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xB3FFFFFF))
                                        Text("Lv $charmLevel", fontSize = 11.sp, fontWeight = FontWeight.Black, color = ColorWhite)
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp))
                                    .background(Color(0x26FFFFFF)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                    Text("Monthly received: ${formatAmount(monthlyReceived)}", fontSize = 7.sp,
                                        fontWeight = FontWeight.ExtraBold, color = Color(0xCCFFFFFF))
                                }
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // RELATIONSHIP CARDS — RN line 986-1109 (CP / Best Friend / Besties)
                    // ════════════════════════════════════════════════════════════════
                    Spacer(modifier = Modifier.height(10.dp))
                    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        val relationPagerState = rememberPagerState(pageCount = { 3 })
                        val coroutineScope = rememberCoroutineScope()
                        
                        HorizontalPager(
                            state = relationPagerState,
                            modifier = Modifier.fillMaxWidth().height(130.dp)
                        ) { page ->
                            class RelationUiConfig(
                                val type: String,
                                val outerColor: List<Color>,
                                val innerColor: List<Color>,
                                val iconText: String,
                                val label: String
                            )
                            val config = when (page) {
                                0 -> RelationUiConfig("CP", listOf(Color(0xFFF7C49F), Color(0xFFE99B8E)), listOf(Color(0xFF8A153E), Color(0xFFB02352)), "\u2764\uFE0F", "CP")
                                1 -> RelationUiConfig("Best Friend", listOf(Color(0xFFBBF7D0), Color(0xFF86EFAC)), listOf(Color(0xFF166534), Color(0xFF16A34A)), "\uD83E\uDD1D", "Best Friend")
                                else -> RelationUiConfig("Besties", listOf(Color(0xFFFED7AA), Color(0xFFFDBA74)), listOf(Color(0xFF9A3412), Color(0xFFEA580C)), "\uD83D\uDC65", "Besties")
                            }

                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Brush.horizontalGradient(config.outerColor))
                                    .padding(3.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(RoundedCornerShape(17.dp))
                                        .background(Brush.verticalGradient(config.innerColor))
                                        .padding(horizontal = 14.dp, vertical = 8.dp)
                                ) {
                                    // Top golden ribbon
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopCenter)
                                            .clip(RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
                                            .background(Brush.verticalGradient(listOf(Color(0xFFFDE6A8), Color(0xFFD68A32))))
                                            .border(1.dp, Color(0xFFFFF3D1), RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
                                            .padding(horizontal = 16.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = config.label.uppercase(),
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFF5A2105),
                                            letterSpacing = 0.5.sp
                                        )
                                    }

                                    // Content: Self — Heart/Icon — Partner
                                    Row(
                                        modifier = Modifier.fillMaxSize().padding(top = 18.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        // Left: Self
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Box(
                                                modifier = Modifier
                                                    .size(50.dp)
                                                    .clip(CircleShape)
                                                    .border(2.dp, Color.White.copy(alpha = 0.95f), CircleShape)
                                            ) {
                                                AsyncImage(
                                                    model = CdnUtils.toCdn(avatarUrl),
                                                    contentDescription = null,
                                                    modifier = Modifier.fillMaxSize(),
                                                    contentScale = ContentScale.Crop
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = username,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = Color.White,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                modifier = Modifier.widthIn(max = 60.dp)
                                            )
                                        }

                                        // Center Icon
                                        Spacer(modifier = Modifier.width(20.dp))
                                        Box(
                                            modifier = Modifier.size(48.dp, 44.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(text = config.iconText, fontSize = 24.sp)
                                        }
                                        Spacer(modifier = Modifier.width(20.dp))

                                        // Right: Partner placeholder / Add symbol
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            val isCpResolved = (page == 0 && cpPartnerUid != null)
                                            val rAvatar = if (isCpResolved) cpPartnerAvatar else ""
                                            val rName = if (isCpResolved) (cpPartnerName ?: "Partner") else "Add"

                                            Box(
                                                modifier = Modifier
                                                    .size(50.dp)
                                                    .clip(CircleShape)
                                                    .border(2.dp, Color.White.copy(alpha = 0.8f), CircleShape)
                                                    .background(Color.White.copy(alpha = 0.06f))
                                                    .clickable { /* Partner add/details action */ },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                if (isCpResolved && rAvatar.isNotBlank()) {
                                                    AsyncImage(
                                                        model = CdnUtils.toCdn(rAvatar),
                                                        contentDescription = null,
                                                        modifier = Modifier.fillMaxSize(),
                                                        contentScale = ContentScale.Crop
                                                    )
                                                } else {
                                                    Text("+", fontSize = 20.sp, color = Color.White, fontWeight = FontWeight.Light)
                                                }
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = rName,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = Color.White.copy(alpha = 0.7f),
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                modifier = Modifier.widthIn(max = 60.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // Dot indicators below relationship pager
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            repeat(3) { i ->
                                Box(
                                    modifier = Modifier
                                        .size(if (relationPagerState.currentPage == i) 14.dp else 5.dp, 5.dp)
                                        .clip(CircleShape)
                                        .background(if (relationPagerState.currentPage == i) Color(0xFFEC4899) else Color(0xFFE2E8F0))
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // ════════════════════════════════════════════════════════════════
                    // SIGNATURE BIO — RN line 1112-1123
                    // ════════════════════════════════════════════════════════════════
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Text("SIGNATURE BIO", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = ColorTextMuted)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(bio.ifBlank { "Synchronized with the Ummy frequency." },
                            fontSize = 13.sp, color = Color(0xFF475569), lineHeight = 18.sp)
                        if (birthday != null) {
                            val bStr = when (birthday) {
                                is String -> birthday
                                is com.google.firebase.Timestamp -> {
                                    val cal = java.util.Calendar.getInstance(); cal.time = birthday.toDate()
                                    "${cal.get(java.util.Calendar.YEAR)}-${cal.get(java.util.Calendar.MONTH)+1}-${cal.get(java.util.Calendar.DAY_OF_MONTH)}"
                                }
                                else -> null
                            }
                            if (!bStr.isNullOrBlank()) {
                                Row(modifier = Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text("\uD83D\uDCC5", fontSize = 12.sp, color = ColorTextMuted)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(bStr, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ColorTextSecondary)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // ════════════════════════════════════════════════════════════════
                    // TOP SUPPORTERS — RN line 1126-1689
                    // ════════════════════════════════════════════════════════════════
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("TOP SUPPORTERS", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold,
                                color = ColorTextMuted, letterSpacing = 1.sp)
                            Text(
                                text = "View All",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = ColorBlue,
                                modifier = Modifier.clickable { showSupportersModal = true }
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        // Podium: 2nd — 1st — 3rd
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.Bottom) {
                            val slots = listOf(
                                Triple(s2, "\uD83E\uDD48", 0.dp),   // silver
                                Triple(s1, "\uD83E\uDD47", 10.dp),   // gold
                                Triple(s3, "\uD83E\uDD49", 0.dp)    // bronze
                            )
                            slots.forEach { (supporter, medal, translateY) ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(horizontal = 8.dp).offset(y = translateY)) {
                                    if (supporter != null) {
                                        val sId = supporter["supporterId"]?.toString() ?: ""
                                        val resolvedProfile = supporterProfiles[sId]
                                        val sName = resolvedProfile?.first ?: supporter["supporterName"]?.toString() ?: "User"
                                        val sAvatar = resolvedProfile?.second ?: supporter["supporterAvatar"]?.toString() ?: ""
                                        val sPoints = (supporter["totalPoints"] as? Number)?.toLong() ?: 0L
                                        Box(modifier = Modifier.size(48.dp).clip(CircleShape)
                                            .border(2.dp, Color(0xFF94a3b8), CircleShape)) {
                                            if (sAvatar.isNotBlank()) {
                                                AsyncImage(model = CdnUtils.toCdn(sAvatar), contentDescription = null,
                                                    modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                            }
                                        }
                                        Text(medal, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))
                                        Text(sName, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF334155),
                                            maxLines = 1, modifier = Modifier.padding(top = 2.dp), overflow = TextOverflow.Ellipsis)
                                        Text("${sPoints} pts", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = ColorPink)
                                    } else {
                                        Box(modifier = Modifier.size(48.dp).clip(CircleShape)
                                            .border(2.dp, Color(0xFF94a3b8), CircleShape)
                                            .background(Color(0x0D94A3B8)), contentAlignment = Alignment.Center) {
                                            Text(medal, fontSize = 16.sp, color = ColorTextMuted)
                                        }
                                        Text(medal, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))
                                        Text("Empty", fontSize = 9.sp, color = ColorDivider)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // ════════════════════════════════════════════════════════════════
                    // TAB NAVIGATION — RN line 1129-1138
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        val tabs = listOf("Gift", "Medal", "Entry", "Frame")
                        tabs.forEachIndexed { index, tab ->
                            Column(modifier = Modifier.weight(1f).clickable { activeTab = index }
                                .padding(vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                  Text(tab.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold,
                                      color = if (activeTab == index) ColorBlue else ColorTextMuted)
                                  if (activeTab == index) {
                                      Spacer(modifier = Modifier.height(2.dp))
                                      Box(modifier = Modifier.size(24.dp, 2.dp).clip(RoundedCornerShape(1.dp)).background(ColorBlue))
                                  }
                            }
                        }
                    }
                    HorizontalDivider(color = ColorDivider)

                    // ════════════════════════════════════════════════════════════════
                    // TAB CONTENT — RN line 1142-1257
                    // ════════════════════════════════════════════════════════════════
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
                        when (activeTab) {
                            0 -> { // Gift tab
                                if (filteredMedals.isEmpty()) {
                                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                                        contentAlignment = Alignment.Center) {
                                        Text("No Gift Received", fontSize = 12.sp, color = ColorTextMuted)
                                    }
                                } else {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        filteredMedals.take(3).forEach { medal ->
                                            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                                val imgUrl = medal["imageUrl"] ?: medal["image"]
                                                if (imgUrl != null) {
                                                    AsyncImage(model = CdnUtils.toCdn(imgUrl.toString()),
                                                        contentDescription = null, modifier = Modifier.size(60.dp),
                                                        contentScale = ContentScale.Fit)
                                                } else {
                                                    Text("\uD83C\uDF81", fontSize = 22.sp)
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(medal["name"]?.toString() ?: "Medal", fontSize = 8.sp,
                                                    fontWeight = FontWeight.ExtraBold, color = ColorTextSecondary,
                                                    maxLines = 1, textAlign = TextAlign.Center)
                                            }
                                        }
                                    }
                                }
                            }
                            1 -> { // Medal tab
                                if (filteredMedals.isEmpty()) {
                                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                                        contentAlignment = Alignment.Center) {
                                        Text("No Medal Earned", fontSize = 12.sp, color = ColorTextMuted)
                                    }
                                } else {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        filteredMedals.take(3).forEach { medal ->
                                            Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                                val imgUrl = medal["imageUrl"] ?: medal["image"]
                                                if (imgUrl != null) {
                                                    AsyncImage(model = CdnUtils.toCdn(imgUrl.toString()),
                                                        contentDescription = null, modifier = Modifier.size(80.dp),
                                                        contentScale = ContentScale.Fit)
                                                } else {
                                                    Text("\uD83C\uDFC5", fontSize = 22.sp)
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(medal["name"]?.toString() ?: "Medal", fontSize = 8.sp,
                                                    fontWeight = FontWeight.ExtraBold, color = ColorTextSecondary,
                                                    maxLines = 1, textAlign = TextAlign.Center)
                                            }
                                        }
                                    }
                                }
                            }
                            2 -> { // Entry (Vehicle) tab
                                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                                    contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("\uD83D\uDE97", fontSize = 32.sp)
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("No Vehicle Owned", fontSize = 12.sp, color = ColorTextMuted)
                                    }
                                }
                            }
                            3 -> { // Frame tab
                                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                                    contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("\uD83D\uDDBC\uFE0F", fontSize = 32.sp)
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("No Frame Owned", fontSize = 12.sp, color = ColorTextMuted)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            SupportersListModal(
                visible = showSupportersModal,
                onDismiss = { showSupportersModal = false },
                supporters = supporters,
                supporterProfiles = supporterProfiles,
                onViewProfile = { sUid ->
                    showSupportersModal = false
                    onViewProfile(sUid)
                }
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

private fun calculateAgeFull(birthday: Any?): Int? {
    val bStr = when (birthday) {
        is String -> birthday
        is com.google.firebase.Timestamp -> {
            val cal = java.util.Calendar.getInstance()
            cal.time = birthday.toDate()
            "${cal.get(java.util.Calendar.YEAR)}-${cal.get(java.util.Calendar.MONTH)+1}-${cal.get(java.util.Calendar.DAY_OF_MONTH)}"
        }
        else -> return null
    }
    if (bStr.isBlank()) return null
    return try {
        val parts = bStr.split("-", "/", ".")
        val year = parts[0].toInt()
        val month = parts.getOrElse(1) { "1" }.toInt()
        val day = parts.getOrElse(2) { "1" }.toInt()
        val birth = java.util.Calendar.getInstance().apply { set(year, month - 1, day) }
        val now = java.util.Calendar.getInstance()
        var age = now.get(java.util.Calendar.YEAR) - birth.get(java.util.Calendar.YEAR)
        if (now.get(java.util.Calendar.DAY_OF_YEAR) < birth.get(java.util.Calendar.DAY_OF_YEAR)) age--
        if (age in 0..150) age else null
    } catch (_: Exception) { null }
}

private fun getSvipColor(level: Int): Color = when {
    level in 1..6 -> Color(0xFF0EA5E9)
    level in 7..10 -> Color(0xFF9333EA)
    level in 11..15 -> Color(0xFFDC2626)
    else -> Color(0xFF7C3AED)
}

private fun getTagColors(tag: String): Pair<Color, Color> = when {
    tag.contains("Official", true) -> Color(0xFFFEF3C7) to Color(0xFF92400E)
    tag.contains("Super Admin", true) -> Color(0xFFFCE7F3) to Color(0xFF9D174D)
    tag.contains("Manager", true) -> Color(0xFFDBEAFE) to Color(0xFF1E40AF)
    tag.contains("Admin", true) -> Color(0xFFFEF3C7) to Color(0xFF92400E)
    tag.contains("Seller", true) -> Color(0xFFD1FAE5) to Color(0xFF065F46)
    tag.contains("CS Leader", true) -> Color(0xFFEDE9FE) to Color(0xFF5B21B6)
    tag.contains("Customer Service", true) -> Color(0xFFEDE9FE) to Color(0xFF5B21B6)
    tag.contains("Service", true) -> Color(0xFFE0F2FE) to Color(0xFF075985)
    tag.contains("Host", true) -> Color(0xFFFCE7F3) to Color(0xFF9D174D)
    else -> Color(0xFFF1F5F9) to Color(0xFF475569)
}

private fun formatAmount(amount: Long): String = when {
    amount >= 1_000_000 -> String.format("%.1fM", amount / 1_000_000.0)
    amount >= 1_000 -> String.format("%.1fK", amount / 1_000.0)
    else -> amount.toString()
}

@Composable
fun SupportersListModal(
    visible: Boolean,
    onDismiss: () -> Unit,
    supporters: List<Map<String, Any>>,
    supporterProfiles: Map<String, Pair<String, String>>,
    onViewProfile: (String) -> Unit
) {
    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it })
    ) {
        BackHandler { onDismiss() }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                        .background(Color.White),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Top Supporters",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = ColorText
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = ColorTextSecondary
                        )
                    }
                }

                HorizontalDivider(color = ColorDivider)

                // Period Tabs
                var activePeriod by remember { mutableStateOf("Total") }
                val periods = listOf("Daily", "Weekly", "Monthly", "Total")

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    periods.forEach { period ->
                        val isSelected = activePeriod == period
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isSelected) ColorBlue else ColorDivider)
                                .clickable { activePeriod = period }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = period,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) ColorWhite else ColorTextSecondary
                            )
                        }
                    }
                }

                // Helper to get points
                fun getPoints(s: Map<String, Any>): Long {
                    val key = when (activePeriod) {
                        "Daily" -> "dailyPoints"
                        "Weekly" -> "weeklyPoints"
                        "Monthly" -> "monthlyPoints"
                        else -> "totalPoints"
                    }
                    return (s[key] as? Number)?.toLong() ?: (s["totalPoints"] as? Number)?.toLong() ?: 0L
                }

                // Sort supporters
                val sorted = remember(supporters, activePeriod) {
                    supporters.sortedByDescending { getPoints(it) }
                }

                if (sorted.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("⭐", fontSize = 48.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No supporters yet", fontSize = 14.sp, color = ColorTextSecondary)
                        }
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Podium Top 3
                        val p1 = sorted.getOrNull(0)
                        val p2 = sorted.getOrNull(1)
                        val p3 = sorted.getOrNull(2)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp)
                                .background(Color.White),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            // 2nd Place
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            ) {
                                if (p2 != null) {
                                    val sId = p2["supporterId"]?.toString() ?: ""
                                    val resolved = supporterProfiles[sId]
                                    val name = resolved?.first ?: p2["supporterName"]?.toString() ?: "User"
                                    val avatar = resolved?.second ?: p2["supporterAvatar"]?.toString() ?: ""
                                    val pts = getPoints(p2)
                                    Box(
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(CircleShape)
                                            .border(2.5.dp, Color(0xFF94A3B8), CircleShape)
                                            .clickable { onViewProfile(sId) }
                                    ) {
                                        if (avatar.isNotBlank()) {
                                            AsyncImage(
                                                model = CdnUtils.toCdn(avatar),
                                                contentDescription = null,
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop
                                            )
                                        }
                                    }
                                    Text("🥈", fontSize = 20.sp, modifier = Modifier.padding(top = 6.dp))
                                    Text(
                                        text = name,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF334155),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.widthIn(max = 70.dp)
                                    )
                                    Text(
                                        text = "$pts pts",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = ColorPink
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(56.dp)
                                            .clip(CircleShape)
                                            .background(Color(0x0D94A3B8)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("🥈", fontSize = 20.sp)
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Empty", fontSize = 11.sp, color = ColorTextMuted)
                                }
                            }

                            // 1st Place
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .padding(horizontal = 12.dp)
                                    .offset(y = (-8).dp)
                            ) {
                                if (p1 != null) {
                                    val sId = p1["supporterId"]?.toString() ?: ""
                                    val resolved = supporterProfiles[sId]
                                    val name = resolved?.first ?: p1["supporterName"]?.toString() ?: "User"
                                    val avatar = resolved?.second ?: p1["supporterAvatar"]?.toString() ?: ""
                                    val pts = getPoints(p1)
                                    Box(
                                        modifier = Modifier
                                            .size(72.dp)
                                            .clip(CircleShape)
                                            .border(3.dp, Color(0xFFFBBF24), CircleShape)
                                            .clickable { onViewProfile(sId) }
                                    ) {
                                        if (avatar.isNotBlank()) {
                                            AsyncImage(
                                                model = CdnUtils.toCdn(avatar),
                                                contentDescription = null,
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop
                                            )
                                        }
                                    }
                                    Text("🥇", fontSize = 24.sp, modifier = Modifier.padding(top = 6.dp))
                                    Text(
                                        text = name,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFF1E293B),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.widthIn(max = 80.dp)
                                    )
                                    Text(
                                        text = "$pts pts",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = ColorPink
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(72.dp)
                                            .clip(CircleShape)
                                            .background(Color(0x0DFBBF24)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("🥇", fontSize = 24.sp)
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Empty", fontSize = 12.sp, color = ColorTextMuted)
                                }
                            }

                            // 3rd Place
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            ) {
                                if (p3 != null) {
                                    val sId = p3["supporterId"]?.toString() ?: ""
                                    val resolved = supporterProfiles[sId]
                                    val name = resolved?.first ?: p3["supporterName"]?.toString() ?: "User"
                                    val avatar = resolved?.second ?: p3["supporterAvatar"]?.toString() ?: ""
                                    val pts = getPoints(p3)
                                    Box(
                                        modifier = Modifier
                                            .size(50.dp)
                                            .clip(CircleShape)
                                            .border(2.dp, Color(0xFFD97706), CircleShape)
                                            .clickable { onViewProfile(sId) }
                                    ) {
                                        if (avatar.isNotBlank()) {
                                            AsyncImage(
                                                model = CdnUtils.toCdn(avatar),
                                                contentDescription = null,
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop
                                            )
                                        }
                                    }
                                    Text("🥉", fontSize = 20.sp, modifier = Modifier.padding(top = 6.dp))
                                    Text(
                                        text = name,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF334155),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.widthIn(max = 60.dp)
                                    )
                                    Text(
                                        text = "$pts pts",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = ColorPink
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(50.dp)
                                            .clip(CircleShape)
                                            .background(Color(0x0DD97706)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("🥉", fontSize = 20.sp)
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text("Empty", fontSize = 11.sp, color = ColorTextMuted)
                                }
                            }
                        }

                        HorizontalDivider(color = ColorDivider)

                        // Scrollable List for the remaining supporters
                        Text(
                            text = "All Supporters",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = ColorTextMuted,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )

                        sorted.forEachIndexed { i, s ->
                            val sId = s["supporterId"]?.toString() ?: ""
                            val resolved = supporterProfiles[sId]
                            val name = resolved?.first ?: s["supporterName"]?.toString() ?: "User"
                            val avatar = resolved?.second ?: s["supporterAvatar"]?.toString() ?: ""
                            val pts = getPoints(s)

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onViewProfile(sId) }
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${i + 1}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = if (i < 3) ColorPink else ColorTextMuted,
                                    modifier = Modifier.width(36.dp),
                                    textAlign = TextAlign.Center
                                )

                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .clip(CircleShape)
                                        .background(ColorDivider)
                                ) {
                                    if (avatar.isNotBlank()) {
                                        AsyncImage(
                                            model = CdnUtils.toCdn(avatar),
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Text(
                                    text = name,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ColorText,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Text(
                                    text = "$pts pts",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = ColorPink
                                )
                            }

                            HorizontalDivider(color = ColorDivider, modifier = Modifier.padding(horizontal = 16.dp))
                        }
                    }
                }
            }
        }
    }
}
