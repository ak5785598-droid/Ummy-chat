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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import app.vercel.ummy_chat.twa.util.CdnUtils
import app.vercel.ummy_chat.twa.ui.components.SvipPillBadge

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
    onNavigateToRoom: (String) -> Unit = {},
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

    // Real-time profile fields (fetched from Firestore)
    var liveAccountNumber by remember { mutableStateOf(accountNumber) }
    var liveTags by remember { mutableStateOf(tags) }
    var liveActiveIdBadge by remember { mutableStateOf<Map<String, Any>?>(null) }
    var liveIsAdmin by remember { mutableStateOf(isAdmin) }
    var liveIsBudgetId by remember { mutableStateOf(false) }
    var liveIdColor by remember { mutableStateOf<String?>(null) }
    var liveTotalSpent by remember { mutableStateOf(totalSpent) }
    var liveTotalReceived by remember { mutableStateOf(totalReceived) }
    var liveMonthlySpent by remember { mutableStateOf(monthlySpent) }
    var liveMonthlyReceived by remember { mutableStateOf(monthlyReceived) }
    var liveSvip by remember { mutableIntStateOf(svipLevel) }
    var liveFanCount by remember { mutableIntStateOf(fanCount) }
    var liveFollowingCount by remember { mutableIntStateOf(followingCount) }
    var liveFriendsCount by remember { mutableIntStateOf(friendsCount) }
    var liveVisitorsCount by remember { mutableIntStateOf(visitorsCount) }
    var liveHideGiftRecord by remember { mutableStateOf(false) }
    var liveRankInvisible by remember { mutableStateOf(false) }
    var liveCrimsonNameplate by remember { mutableStateOf(true) }

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
    var dailySupported by remember { mutableStateOf(false) }
    var supporting by remember { mutableStateOf(false) }
    var activeSupportPeriod by remember { mutableStateOf("weekly") }
    var showSupportersModal by remember { mutableStateOf(false) }

    // Tab content data
    var receivedGifts by remember { mutableStateOf<Map<String, Any>>(emptyMap()) }
    var giftDetails by remember { mutableStateOf<Map<String, Any>>(emptyMap()) }
    var ownedItemIds by remember { mutableStateOf(setOf<String>()) }
    val storeItemsMap = remember { mutableStateMapOf<String, Map<String, Any>>() }
    val screenWidth = androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp.dp

    var cpPartnerName by remember { mutableStateOf<String?>(null) }
    var cpPartnerAvatar by remember { mutableStateOf("") }
    var cpPartnerUid by remember { mutableStateOf<String?>(null) }

    // Best Friend + Besties data (real-time)
    var bestFriendName by remember { mutableStateOf<String?>(null) }
    var bestFriendAvatar by remember { mutableStateOf("") }
    var bestFriendUid by remember { mutableStateOf<String?>(null) }
    var bestiesName by remember { mutableStateOf<String?>(null) }
    var bestiesAvatar by remember { mutableStateOf("") }
    var bestiesUid by remember { mutableStateOf<String?>(null) }

    // Real-time family listener
    var familyListener by remember { mutableStateOf<com.google.firebase.firestore.ListenerRegistration?>(null) }

    // Room status
    var currentRoomId by remember { mutableStateOf<String?>(null) }

    // Record Profile Visit (both profileVisitors and visitedProfiles)
    LaunchedEffect(targetUid, currentUid) {
        if (targetUid.isNotBlank() && targetUid != currentUid) {
            try {
                // Check mysteriousVisitor
                val myProfile = db.collection("users").document(currentUid)
                    .collection("profile").document(currentUid).get().await()
                val tags = myProfile.get("tags") as? List<*>
                val isOfficial = tags?.any { it.toString() in listOf("Official", "Admin", "Creator", "Super Admin", "Official center") } == true || currentUid == "901piBzTQ0VzCtAvlyyobwvAaTs1"
                val rawSvip = (myProfile.get("svip") as? Number)?.toInt() ?: 0
                val mySvip = if (isOfficial) maxOf(rawSvip, 17) else rawSvip
                
                val mysteriousVisitorToggle = myProfile.getBoolean("mysteriousVisitor") ?: true
                val mysteriousVisitor = (mySvip >= 13) && mysteriousVisitorToggle
                
                if (!mysteriousVisitor) {
                    val timestamp = com.google.firebase.firestore.FieldValue.serverTimestamp()
                    // 1. Add to target user's profileVisitors
                    db.collection("users").document(targetUid)
                        .collection("profileVisitors").document(currentUid)
                        .set(mapOf(
                            "visitorId" to currentUid,
                            "timestamp" to timestamp,
                            "count" to com.google.firebase.firestore.FieldValue.increment(1)
                        ), com.google.firebase.firestore.SetOptions.merge())

                    // 2. Add to my visitedProfiles
                    db.collection("users").document(currentUid)
                        .collection("visitedProfiles").document(targetUid)
                        .set(mapOf(
                            "visitorId" to targetUid,
                            "timestamp" to timestamp,
                            "count" to com.google.firebase.firestore.FieldValue.increment(1)
                        ), com.google.firebase.firestore.SetOptions.merge())
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Real-time listener for user profile (ID badge, level, tags, SVIP)
    DisposableEffect(targetUid) {
        if (targetUid.isBlank()) { onDispose {} }
        else {
            val userRef = db.collection("users").document(targetUid)
            val listener = userRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data ?: emptyMap()
                    liveAccountNumber = (data["accountNumber"] as? Number)?.toString()
                        ?: data["accountNumber"] as? String ?: liveAccountNumber
                    
                    val tagsList = data["tags"] as? List<*> ?: emptyList<Any>()
                    liveTags = tagsList.map { it.toString() }
                    
                    val isOfficial = liveTags.any { it in listOf("Official", "Admin", "Creator", "Super Admin", "Official center") } || targetUid == "901piBzTQ0VzCtAvlyyobwvAaTs1"
                    val rawSvip = (data["svip"] as? Number)?.toInt() ?: 0
                    liveSvip = if (isOfficial) maxOf(rawSvip, 17) else rawSvip
                    
                    liveActiveIdBadge = data["activeIdBadge"] as? Map<String, Any>
                    liveIsAdmin = data["isAdmin"] as? Boolean ?: false
                    liveIsBudgetId = data["isBudgetId"] as? Boolean ?: false
                    liveIdColor = data["idColor"] as? String
                    
                    val wallet = data["wallet"] as? Map<String, Any> ?: emptyMap()
                    liveTotalSpent = (wallet["totalSpent"] as? Number)?.toLong() ?: 0L
                    liveTotalReceived = (wallet["totalReceived"] as? Number)?.toLong() ?: 0L
                }
            }
            // Also listen to profile subcollection for wallet data + tags
            val profileRef = db.collection("users").document(targetUid)
                .collection("profile").document(targetUid)
            val profileListener = profileRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data ?: emptyMap()
                    val wallet = data["wallet"] as? Map<String, Any> ?: emptyMap()
                    if (wallet.containsKey("totalSpent")) {
                        liveTotalSpent = (wallet["totalSpent"] as? Number)?.toLong() ?: liveTotalSpent
                    }
                    if (wallet.containsKey("totalReceived")) {
                        liveTotalReceived = (wallet["totalReceived"] as? Number)?.toLong() ?: liveTotalReceived
                    }
                    if (wallet.containsKey("monthlySpent")) {
                        liveMonthlySpent = (wallet["monthlySpent"] as? Number)?.toLong() ?: liveMonthlySpent
                    }
                    if (wallet.containsKey("monthlyReceived")) {
                        liveMonthlyReceived = (wallet["monthlyReceived"] as? Number)?.toLong() ?: liveMonthlyReceived
                    }
                    if (data.containsKey("familyId")) {
                        familyId = data["familyId"] as? String ?: familyId
                    }
                    liveHideGiftRecord = data["hideGiftRecord"] as? Boolean ?: false
                    liveRankInvisible = data["rankInvisible"] as? Boolean ?: false
                    liveCrimsonNameplate = data["crimsonNameplate"] as? Boolean ?: true
                    // Tags from profile subcollection (merge with base doc)
                    val profileTags = (data["tags"] as? List<*>)?.filterIsInstance<String>()
                    if (profileTags != null && profileTags.isNotEmpty()) {
                        liveTags = profileTags
                    }
                    // accountNumber from profile subcollection (fallback)
                    val profileAccNum = (data["accountNumber"] as? Number)?.toString()
                        ?: data["accountNumber"] as? String
                    if (profileAccNum != null && liveAccountNumber.isBlank()) {
                        liveAccountNumber = profileAccNum
                    }

                    // Relationship data (CP, Best Friend, Besties) — real-time
                    val relationship = data["relationship"] as? Map<String, Any>
                    if (relationship != null) {
                        cpPartnerUid = relationship["partnerUid"] as? String ?: relationship["uid"] as? String
                        cpPartnerName = relationship["partnerName"] as? String ?: relationship["name"] as? String
                        cpPartnerAvatar = relationship["partnerAvatar"] as? String ?: relationship["avatarUrl"] as? String ?: ""
                    }

                    val bfData = data["bestFriend"] as? Map<String, Any>
                        ?: (data["bestFriends"] as? List<*>)?.firstOrNull() as? Map<String, Any>
                    if (bfData != null) {
                        bestFriendUid = bfData["uid"] as? String ?: bfData["id"] as? String
                        bestFriendName = bfData["name"] as? String ?: bfData["username"] as? String
                        bestFriendAvatar = bfData["avatarUrl"] as? String ?: bfData["avatar"] as? String ?: ""
                    }

                    val bestiesData = data["besties"] as? Map<String, Any>
                        ?: (data["bestiesList"] as? List<*>)?.firstOrNull() as? Map<String, Any>
                    if (bestiesData != null) {
                        bestiesUid = bestiesData["uid"] as? String ?: bestiesData["id"] as? String
                        bestiesName = bestiesData["name"] as? String ?: bestiesData["username"] as? String
                        bestiesAvatar = bestiesData["avatarUrl"] as? String ?: bestiesData["avatar"] as? String ?: ""
                    }
                }
            }

            // Resolve familyId from profile, then set up real-time family listener
            db.collection("users").document(targetUid)
                .collection("profile").document(targetUid).get()
                .addOnSuccessListener { profileSnap ->
                    var resolvedFamilyId = profileSnap.getString("familyId")
                    if (resolvedFamilyId == null) {
                        val familyMap = profileSnap.get("family") as? Map<String, Any>
                        resolvedFamilyId = familyMap?.get("id") as? String
                    }

                    if (!resolvedFamilyId.isNullOrBlank()) {
                        familyId = resolvedFamilyId
                        val famRef = db.collection("families").document(resolvedFamilyId)
                        familyListener = famRef.addSnapshotListener { famSnap, _ ->
                            if (famSnap != null && famSnap.exists()) {
                                val f = famSnap.data ?: emptyMap()
                                familyName = f["name"] as? String ?: f["familyName"] as? String ?: "Family"
                                familyAvatar = f["avatarUrl"] as? String ?: f["logoUrl"] as? String
                                    ?: f["bannerUrl"] as? String ?: f["icon"] as? String
                                    ?: f["image"] as? String ?: f["avatar"] as? String ?: ""
                                familyMemberCount = (f["membersCount"] as? Number)?.toInt()
                                    ?: (f["memberCount"] as? Number)?.toInt()
                                    ?: (f["members"] as? Map<*, *>)?.size ?: 0
                                familyMaxMembers = (f["maxMembers"] as? Number)?.toInt()
                                    ?: (f["capacity"] as? Number)?.toInt() ?: 100
                                @Suppress("UNCHECKED_CAST")
                                val members = f["members"] as? Map<String, Any>
                                familyRole = if (f["ownerId"] == targetUid)
                                    (f["creatorTitle"] as? String ?: "Owner")
                                else members?.get(targetUid) as? String ?: "Member"
                            } else {
                                familyName = null
                                familyAvatar = ""
                                familyRole = "Member"
                                familyMemberCount = 0
                            }
                        }
                    }
                }

            // Real-time fans count (followers collection)
            val fansRef = db.collection("followers")
                .whereEqualTo("followingId", targetUid)
            val fansListener = fansRef.addSnapshotListener { snap, _ ->
                liveFanCount = snap?.documents?.size ?: 0
            }

            // Real-time following count
            val followingRef = db.collection("followers")
                .whereEqualTo("followerId", targetUid)
            val followingListener = followingRef.addSnapshotListener { snap, _ ->
                liveFollowingCount = snap?.documents?.size ?: 0
            }

            // Real-time friends count (mutual followers)
            val friendsRef = db.collection("followers")
                .whereEqualTo("followerId", targetUid)
            val friendsListener = friendsRef.addSnapshotListener { snap, _ ->
                val followingIds = snap?.documents?.mapNotNull { it.getString("followingId") } ?: emptyList()
                if (followingIds.isNotEmpty()) {
                    db.collection("followers")
                        .whereEqualTo("followingId", targetUid)
                        .get()
                        .addOnSuccessListener { fanSnap ->
                            val fanIds = fanSnap.documents.mapNotNull { it.getString("followerId") }.toSet()
                            liveFriendsCount = followingIds.count { it in fanIds }
                        }
                } else {
                    liveFriendsCount = 0
                }
            }

            // Real-time visitors count
            val visitorsRef = db.collection("users").document(targetUid)
                .collection("visitors")
            val visitorsListener = visitorsRef.addSnapshotListener { snap, _ ->
                liveVisitorsCount = snap?.documents?.size ?: 0
            }

            onDispose {
                listener.remove(); profileListener.remove()
                fansListener.remove(); followingListener.remove()
                friendsListener.remove(); visitorsListener.remove()
                familyListener?.remove()
            }
        }
    }

    // Real-time partner/BF/besties profile listeners (re-run when UIDs change)
    DisposableEffect(cpPartnerUid, bestFriendUid, bestiesUid) {
        var cpPartnerListenerReg: ListenerRegistration? = null
        var bestFriendListenerReg: ListenerRegistration? = null
        var bestiesListenerReg: ListenerRegistration? = null

        if (!cpPartnerUid.isNullOrBlank()) {
            cpPartnerListenerReg = db.collection("users").document(cpPartnerUid!!)
                .addSnapshotListener { partnerSnap, _ ->
                    if (partnerSnap != null && partnerSnap.exists()) {
                        val pData = partnerSnap.data ?: emptyMap()
                        cpPartnerName = pData["username"] as? String
                            ?: pData["name"] as? String ?: cpPartnerName
                        cpPartnerAvatar = pData["avatarUrl"] as? String
                            ?: pData["photoURL"] as? String ?: cpPartnerAvatar
                    }
                }
        }
        if (!bestFriendUid.isNullOrBlank()) {
            bestFriendListenerReg = db.collection("users").document(bestFriendUid!!)
                .addSnapshotListener { bfSnap, _ ->
                    if (bfSnap != null && bfSnap.exists()) {
                        val bfData = bfSnap.data ?: emptyMap()
                        bestFriendName = bfData["username"] as? String
                            ?: bfData["name"] as? String ?: bestFriendName
                        bestFriendAvatar = bfData["avatarUrl"] as? String
                            ?: bfData["photoURL"] as? String ?: bestFriendAvatar
                    }
                }
        }
        if (!bestiesUid.isNullOrBlank()) {
            bestiesListenerReg = db.collection("users").document(bestiesUid!!)
                .addSnapshotListener { bestiesSnap, _ ->
                    if (bestiesSnap != null && bestiesSnap.exists()) {
                        val bsData = bestiesSnap.data ?: emptyMap()
                        bestiesName = bsData["username"] as? String
                            ?: bsData["name"] as? String ?: bestiesName
                        bestiesAvatar = bsData["avatarUrl"] as? String
                            ?: bsData["photoURL"] as? String ?: bestiesAvatar
                    }
                }
        }

        onDispose {
            cpPartnerListenerReg?.remove()
            bestFriendListenerReg?.remove()
            bestiesListenerReg?.remove()
        }
    }

    // Real-time supporter profile listeners (live name + avatar for each supporter)
    val supporterIds = remember(supporters) {
        supporters.mapNotNull { it["supporterId"]?.toString() }.distinct()
    }
    DisposableEffect(supporterIds) {
        val listenerRegs = mutableListOf<ListenerRegistration>()
        supporterIds.forEach { sId ->
            val reg = db.collection("users").document(sId)
                .addSnapshotListener { snap, _ ->
                    if (snap != null && snap.exists()) {
                        val data = snap.data ?: emptyMap()
                        val name = data["username"] as? String
                            ?: data["name"] as? String ?: "User"
                        val avatar = data["avatarUrl"] as? String
                            ?: data["photoURL"] as? String ?: ""
                        supporterProfiles[sId] = Pair(name, avatar)
                    }
                }
            listenerRegs.add(reg)
        }
        onDispose { listenerRegs.forEach { it.remove() } }
    }

    // Fetch all data reactively when targetUid changes
    LaunchedEffect(targetUid) {
        if (targetUid.isBlank()) return@LaunchedEffect
        try {
            // Medals
            val medalsSnap = db.collection("medalsList").get().await()
            allMedals = medalsSnap.documents.mapNotNull { it.data?.plus("id" to it.id) }

            // Supporters — real-time listener
            val supportersRef = db.collection("supporters")
                .whereEqualTo("receiverId", targetUid)
            val supportersListener = supportersRef.addSnapshotListener { snap, _ ->
                val list = snap?.documents?.mapNotNull { it.data?.plus("id" to it.id) } ?: emptyList()
                supporters = list
                supporterCount = list.size
                // Check if current user already supported today
                val myUid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid
                if (myUid != null) {
                    val mySupport = list.find { it["supporterId"]?.toString() == myUid }
                    if (mySupport != null) {
                        val lastDaily = mySupport["lastDailySupport"]
                        val lastDate = when (lastDaily) {
                            is com.google.firebase.Timestamp -> lastDaily.toDate()
                            is java.util.Date -> lastDaily
                            else -> null
                        }
                        val today = java.util.Calendar.getInstance()
                        dailySupported = lastDate != null &&
                            lastDate.date == today.get(java.util.Calendar.DAY_OF_MONTH) &&
                            lastDate.month == today.get(java.util.Calendar.MONTH) &&
                            lastDate.year == today.get(java.util.Calendar.YEAR)
                    }
                }
            }

            // Room status
            try {
                val userSnap = db.collection("users").document(targetUid).get().await()
                val profileSnap = db.collection("users").document(targetUid).collection("profile").document(targetUid).get().await()
                
                val tags = profileSnap.get("tags") as? List<*>
                val isOfficial = tags?.any { it.toString() in listOf("Official", "Admin", "Creator", "Super Admin", "Official center") } == true || targetUid == "901piBzTQ0VzCtAvlyyobwvAaTs1"
                val rawSvip = (profileSnap.get("svip") as? Number)?.toInt() ?: 0
                val svipLevel = if (isOfficial) maxOf(rawSvip, 17) else rawSvip
                
                val roomInvisible = profileSnap.getBoolean("roomInvisible") ?: true
                val isStealth = svipLevel >= 12 && roomInvisible
                currentRoomId = userSnap.getString("currentRoomId")

                // Tab data: receivedGifts, giftDetails, ownedItemIds
                val stats = profileSnap.get("stats") as? Map<*, *>
                @Suppress("UNCHECKED_CAST")
                receivedGifts = stats?.get("receivedGifts") as? Map<String, Any> ?: emptyMap()
                @Suppress("UNCHECKED_CAST")
                giftDetails = stats?.get("giftDetails") as? Map<String, Any> ?: emptyMap()
                val inventory = profileSnap.get("inventory") as? Map<*, *>
                ownedItemIds = (inventory?.get("ownedItems") as? List<*>)?.mapNotNull { it?.toString() }?.toSet() ?: emptySet()
            } catch (_: Exception) {}
        } catch (_: Exception) {}
    }

    // Real-time storeItems listener (Entry + Frame tabs)
    DisposableEffect(targetUid) {
        val reg = db.collection("storeItems").addSnapshotListener { snap, _ ->
            snap?.documents?.forEach { doc ->
                val cat = doc.getString("category")?.lowercase() ?: return@forEach
                if (cat == "entry" || cat == "frame") {
                    storeItemsMap[cat] = (storeItemsMap[cat] ?: emptyMap()) + (doc.id to (doc.data ?: emptyMap()))
                }
            }
        }
        onDispose { reg.remove() }
    }

    val age = remember(birthday) { calculateAgeFull(birthday) }
    val level = remember(liveTotalSpent) { getLevelFromSpent(liveTotalSpent) }
    val charmLevel = remember(liveTotalReceived) { getLevelFromSpent(liveTotalReceived) }
    val countryFlag = remember(country) { getCountryFlag(country) }
    val hasOfficialTag = remember(liveTags) { liveTags.any { it.contains("Official", true) } }
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

    // Get points based on active period
    val getPoints: (Map<String, Any>) -> Long = { s ->
        when (activeSupportPeriod) {
            "weekly" -> (s["weeklyPoints"] as? Number)?.toLong() ?: 0L
            "monthly" -> (s["monthlyPoints"] as? Number)?.toLong() ?: 0L
            else -> (s["totalPoints"] as? Number)?.toLong() ?: 0L
        }
    }

    // Daily support handler
    val handleDailySupport = {
        if (!dailySupported && !supporting) {
            supporting = true
            scope.launch {
                try {
                    val myUid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: return@launch
                    val supportId = "${targetUid}_$myUid"
                    val supportRef = db.collection("supporters").document(supportId)
                    val existing = supportRef.get().await()
                    var resetWeekly = false
                    var resetMonthly = false
                    if (existing.exists()) {
                        val data = existing.data ?: emptyMap()
                        val lastDaily = data["lastDailySupport"] as? com.google.firebase.Timestamp
                            ?: data["lastGiftAt"] as? com.google.firebase.Timestamp
                        if (lastDaily != null) {
                            val lastDate = lastDaily.toDate()
                            val now = java.util.Calendar.getInstance()
                            val lastCal = java.util.Calendar.getInstance().apply { time = lastDate }
                            if (lastCal.get(java.util.Calendar.WEEK_OF_YEAR) != now.get(java.util.Calendar.WEEK_OF_YEAR) ||
                                lastCal.get(java.util.Calendar.YEAR) != now.get(java.util.Calendar.YEAR)) {
                                resetWeekly = true
                            }
                            if (lastCal.get(java.util.Calendar.MONTH) != now.get(java.util.Calendar.MONTH) ||
                                lastCal.get(java.util.Calendar.YEAR) != now.get(java.util.Calendar.YEAR)) {
                                resetMonthly = true
                            }
                        } else {
                            resetWeekly = true; resetMonthly = true
                        }
                    } else {
                        resetWeekly = true; resetMonthly = true
                    }
                    val myProfileSnap = db.collection("users").document(myUid)
                        .collection("profile").document(myUid).get().await()
                    val myName = myProfileSnap.getString("username") ?: myProfileSnap.getString("name") ?: "User"
                    val myAvatar = myProfileSnap.getString("avatarUrl") ?: ""
                    val updates = mutableMapOf<String, Any>(
                        "receiverId" to targetUid,
                        "supporterId" to myUid,
                        "supporterName" to myName,
                        "supporterAvatar" to myAvatar,
                        "totalPoints" to com.google.firebase.firestore.FieldValue.increment(60),
                        "lastDailySupport" to com.google.firebase.Timestamp.now(),
                        "updatedAt" to com.google.firebase.Timestamp.now(),
                        "lastGiftAt" to com.google.firebase.Timestamp.now()
                    )
                    if (resetWeekly) updates["weeklyPoints"] = 60L
                    else updates["weeklyPoints"] = com.google.firebase.firestore.FieldValue.increment(60)
                    if (resetMonthly) updates["monthlyPoints"] = 60L
                    else updates["monthlyPoints"] = com.google.firebase.firestore.FieldValue.increment(60)
                    supportRef.set(updates, com.google.firebase.firestore.SetOptions.merge()).await()
                    dailySupported = true
                } catch (_: Exception) {}
                supporting = false
            }
        }
    }

    // Supporters sorted
    val sortedSupporters = remember(supporters, activeSupportPeriod) {
        supporters.sortedByDescending { getPoints(it) }
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
                Box(modifier = Modifier.fillMaxWidth().offset(y = (-32).dp)
                    .background(ColorWhite, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .padding(top = 10.dp, bottom = 24.dp)) {

                    // ════════════════════════════════════════════════════════════════
                    // "IN ROOM" STATUS PILL — RN line 675-735
                    // position: absolute, top: 14, left: 16, zIndex: 40
                    // ════════════════════════════════════════════════════════════════
                    Box(modifier = Modifier.align(Alignment.TopStart).offset(x = 16.dp, y = 14.dp).zIndex(40f)) {
                        if (currentRoomId != null) {
                            // Active: gradient pill with animated equalizer bars
                            Box(modifier = Modifier.clip(RoundedCornerShape(14.dp))
                                .background(Brush.linearGradient(listOf(Color(0xFF38BDF8), Color(0xFF0284C7))))
                                .shadow(4.dp, RoundedCornerShape(14.dp), ambientColor = Color(0x590284C7))
                                .clickable { currentRoomId?.let { onDismiss(); onNavigateToRoom(it) } }
                                .padding(horizontal = 10.dp, vertical = 5.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    val infiniteTransition = rememberInfiniteTransition()
                                    val bar1 by infiniteTransition.animateFloat(0.3f, 1.2f, infiniteRepeatable(tween(400), RepeatMode.Reverse))
                                    val bar2 by infiniteTransition.animateFloat(0.4f, 1.3f, infiniteRepeatable(tween(350), RepeatMode.Reverse))
                                    val bar3 by infiniteTransition.animateFloat(0.2f, 1.1f, infiniteRepeatable(tween(500), RepeatMode.Reverse))
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.5.dp),
                                        modifier = Modifier.height(14.dp)) {
                                        Box(modifier = Modifier.width(2.5.dp).fillMaxHeight().offset(y = ((1 - bar1) * 7).dp)
                                            .clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                        Box(modifier = Modifier.width(2.5.dp).fillMaxHeight().offset(y = ((1 - bar2) * 7).dp)
                                            .clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                        Box(modifier = Modifier.width(2.5.dp).fillMaxHeight().offset(y = ((1 - bar3) * 7).dp)
                                            .clip(RoundedCornerShape(1.5.dp)).background(ColorWhite))
                                    }
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text("In Room", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold,
                                        color = ColorWhite, letterSpacing = 0.3.sp)
                                }
                            }
                        } else {
                            // Inactive: gray pill
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
                    Box(modifier = Modifier.fillMaxWidth().height(20.dp), contentAlignment = Alignment.TopCenter) {
                        Box(modifier = Modifier.requiredSize(88.dp).offset(y = (-48).dp).shadow(8.dp, CircleShape).clip(CircleShape)
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
                    Row(modifier = Modifier.fillMaxWidth().offset(y = (-4).dp), horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically) {
                        val nameColor = if (liveSvip >= 11 && liveCrimsonNameplate) Color(0xFFDC2626) else ColorText
                        Text(username, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold,
                            color = nameColor, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(countryFlag, fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        val isFemale = gender.equals("Female", true)
                        Box(modifier = Modifier.size(22.dp).clip(CircleShape)
                            .background(if (isFemale) ColorPink else ColorBlue),
                            contentAlignment = Alignment.Center) {
                            Text("${if (isFemale) "\u2640" else "\u2642"}${if (age != null) " $age" else ""}",
                                fontSize = 9.sp, fontWeight = FontWeight.Bold, color = ColorWhite)
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // ════════════════════════════════════════════════════════════════
                    // ID + OFFICIAL + LEVEL + FAMILY + SVIP — RN line 759-814
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth().offset(y = (-6).dp), horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically) {
                        // ID Badge — 4-tier cascade (tap to copy)
                        Box(modifier = Modifier.clickable {
                            clipboardManager.setText(AnnotatedString(liveAccountNumber))
                            copiedId = true
                            scope.launch { delay(2000); copiedId = false }
                        }) {
                            if (hasOfficialTag) {
                                SVGA_GlossyID(label = "ID: $liveAccountNumber")
                            } else if (liveActiveIdBadge != null) {
                                ActiveIDBadge(badgeData = liveActiveIdBadge, fallbackNumber = liveAccountNumber)
                            } else if (liveIsAdmin || (liveIsBudgetId && liveIdColor != null && liveIdColor != "none")) {
                                SovereignIDBadge(
                                    color = if (liveIsAdmin) "gold" else liveIdColor ?: "gold",
                                    number = liveAccountNumber
                                )
                            } else {
                                Row(modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                    .background(ColorDivider)
                                    .padding(horizontal = 8.dp, vertical = 4.5.dp),
                                    verticalAlignment = Alignment.CenterVertically) {
                                    Text("ID: $liveAccountNumber", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        if (copiedId) Icons.Filled.CheckCircle else Icons.Default.ContentCopy,
                                        contentDescription = null,
                                        modifier = Modifier.size(10.dp),
                                        tint = if (copiedId) ColorGreen else ColorTextMuted
                                    )
                                }
                            }
                        }

                        // Official Tag — always show if user has Official tag
                        if (hasOfficialTag) {
                            Spacer(modifier = Modifier.width(4.dp))
                            SVGA_OfficialTag()
                        }

                        Spacer(modifier = Modifier.width(4.dp))

                        // Level Badge — UserLevelBadge
                        if (!(liveRankInvisible && liveSvip >= 9)) {
                            UserLevelBadge(level = level, scale = 1.1f)
                        }

                        // Family tag pill — RN line 790-812
                        if (familyName != null) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Box(modifier = Modifier.clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF064E3B))
                                .border(1.dp, Color(0xFF10B981), RoundedCornerShape(14.dp))
                                .padding(horizontal = 6.dp, vertical = 0.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("\uD83D\uDEE1\uFE0F", fontSize = 7.sp)
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text(familyName ?: "", fontSize = 7.sp, fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF6EE7B7), maxLines = 1, overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.widthIn(max = 80.dp))
                                }
                            }
                        }

                        // SVIP Badge
                        if (liveSvip > 0) {
                            Spacer(modifier = Modifier.width(4.dp))
                            SvipPillBadge(level = liveSvip)
                        }
                    }

                    Spacer(modifier = Modifier.height(0.dp))

                    // ════════════════════════════════════════════════════════════════
                    // STATS BAR — RN line 840-855 (real-time)
                    // ════════════════════════════════════════════════════════════════
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp, horizontal = 16.dp)
                        .border(1.dp, ColorDivider)) {
                        val statsList = listOf(
                            "Fans" to liveFanCount, "Following" to liveFollowingCount,
                            "Friend" to liveFriendsCount, "Visitors" to liveVisitorsCount
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
                        Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .border(1.dp, Color(0x26FFFFFF), RoundedCornerShape(16.dp))
                            .background(
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
                    // RICH & CHARM LEVEL CARDS — RN line 944-984 (real-time)
                    // ════════════════════════════════════════════════════════════════
                    if (!(liveRankInvisible && liveSvip >= 9)) {
                        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 0.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            // Rich Level
                            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(
                                Brush.linearGradient(listOf(Color(0xFF4338CA), Color(0xFF6366F1), Color(0xFF818CF8)),
                                    start = androidx.compose.ui.geometry.Offset(0f, 0f),
                                    end = androidx.compose.ui.geometry.Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY))
                            ).padding(6.dp)) {
                                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.SpaceBetween) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(Color(0x33FFFFFF)),
                                            contentAlignment = Alignment.Center) { Text("\uD83D\uDC8E", fontSize = 8.sp) }
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Column {
                                            Text("RICH", fontSize = 7.sp, fontWeight = FontWeight.ExtraBold,
                                                color = Color(0xB3FFFFFF))
                                            Text("Lv $level", fontSize = 10.sp, fontWeight = FontWeight.Black, color = ColorWhite)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp))
                                        .background(Color(0x26FFFFFF)).padding(horizontal = 6.dp, vertical = 3.dp)) {
                                        Text("Monthly sent: ${formatAmount(liveMonthlySpent)}", fontSize = 7.sp,
                                            fontWeight = FontWeight.ExtraBold, color = Color(0xCCFFFFFF))
                                    }
                                }
                            }
                            // Charm Level
                            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(
                                Brush.linearGradient(listOf(Color(0xFFBE185D), Color(0xFFDB2777), Color(0xFFEC4899)),
                                    start = androidx.compose.ui.geometry.Offset(0f, 0f),
                                    end = androidx.compose.ui.geometry.Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY))
                            ).padding(6.dp)) {
                                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.SpaceBetween) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(Color(0x33FFFFFF)),
                                            contentAlignment = Alignment.Center) { Text("\uD83D\uDC96", fontSize = 8.sp) }
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Column {
                                            Text("CHARM", fontSize = 7.sp, fontWeight = FontWeight.ExtraBold,
                                                color = Color(0xB3FFFFFF))
                                            Text("Lv $charmLevel", fontSize = 10.sp, fontWeight = FontWeight.Black, color = ColorWhite)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp))
                                        .background(Color(0x26FFFFFF)).padding(horizontal = 6.dp, vertical = 3.dp)) {
                                        Text("Monthly received: ${formatAmount(liveMonthlyReceived)}", fontSize = 7.sp,
                                            fontWeight = FontWeight.ExtraBold, color = Color(0xCCFFFFFF))
                                    }
                                }
                            }
                        }
                    }

                    // ════════════════════════════════════════════════════════════════
                    // RELATIONSHIP CARDS — RN line 986-1109 (real-time)
                    // ════════════════════════════════════════════════════════════════
                    Spacer(modifier = Modifier.height(6.dp))
                    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        val relationPagerState = rememberPagerState(pageCount = { 3 })
                        val coroutineScope = rememberCoroutineScope()

                        data class RelationCard(
                            val type: String,
                            val outerColors: List<Color>,
                            val innerColors: List<Color>,
                            val icon: String,
                            val label: String,
                            val partnerName: String?,
                            val partnerAvatar: String,
                            val partnerUid: String?
                        )

                        val cards = listOf(
                            RelationCard("CP",
                                listOf(Color(0xFFF7C49F), Color(0xFFE99B8E)),
                                listOf(Color(0xFF8A153E), Color(0xFFB02352)),
                                "\u2764\uFE0F", "CP",
                                cpPartnerName, cpPartnerAvatar, cpPartnerUid),
                            RelationCard("Best Friend",
                                listOf(Color(0xFFBBF7D0), Color(0xFF86EFAC)),
                                listOf(Color(0xFF166534), Color(0xFF16A34A)),
                                "\uD83E\uDD1D", "Best Friend",
                                bestFriendName, bestFriendAvatar, bestFriendUid),
                            RelationCard("Besties",
                                listOf(Color(0xFFFED7AA), Color(0xFFFDBA74)),
                                listOf(Color(0xFF9A3412), Color(0xFFEA580C)),
                                "\uD83D\uDC65", "Besties",
                                bestiesName, bestiesAvatar, bestiesUid)
                        )

                        HorizontalPager(
                            state = relationPagerState,
                            modifier = Modifier.fillMaxWidth().height(130.dp)
                        ) { page ->
                            val card = cards[page]
                            val hasPartner = card.partnerUid != null

                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Brush.horizontalGradient(card.outerColors))
                                    .padding(3.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(RoundedCornerShape(17.dp))
                                        .background(Brush.verticalGradient(card.innerColors))
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
                                            text = card.label.uppercase(),
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Black,
                                            color = Color(0xFF5A2105),
                                            letterSpacing = 0.5.sp
                                        )
                                    }

                                    // Content: Self — Icon — Partner
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
                                            Text(text = card.icon, fontSize = 24.sp)
                                        }
                                        Spacer(modifier = Modifier.width(20.dp))

                                        // Right: Partner or Add button
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            if (hasPartner) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(50.dp)
                                                        .clip(CircleShape)
                                                        .border(2.dp, Color.White.copy(alpha = 0.95f), CircleShape)
                                                ) {
                                                    AsyncImage(
                                                        model = CdnUtils.toCdn(card.partnerAvatar),
                                                        contentDescription = null,
                                                        modifier = Modifier.fillMaxSize(),
                                                        contentScale = ContentScale.Crop
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = card.partnerName ?: "Partner",
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = Color.White,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    modifier = Modifier.widthIn(max = 60.dp)
                                                )
                                            } else {
                                                Box(
                                                    modifier = Modifier
                                                        .size(50.dp)
                                                        .clip(CircleShape)
                                                        .border(2.dp, Color.White.copy(alpha = 0.8f), CircleShape)
                                                        .background(Color.White.copy(alpha = 0.06f))
                                                        .clickable { /* Open CP search */ },
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text("+", fontSize = 20.sp, color = Color.White, fontWeight = FontWeight.Light)
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = "Add",
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
                        }

                        // Dot indicators
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
                            if (sortedSupporters.isNotEmpty()) {
                                Text(" (${sortedSupporters.size})", fontSize = 10.sp, color = ColorDivider)
                            }
                            Text(
                                text = "View All",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = ColorBlue,
                                modifier = Modifier.clickable { showSupportersModal = true }
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        // Daily Support Button (other users only)
                        if (!isOwnProfile) {
                            androidx.compose.material3.Button(
                                onClick = { handleDailySupport() },
                                enabled = !dailySupported && !supporting,
                                modifier = Modifier.fillMaxWidth().height(36.dp),
                                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                    containerColor = if (dailySupported) Color(0x1A22C55E) else Color(0x1AEAB308),
                                    contentColor = if (dailySupported) Color(0xFF22C55E) else Color(0xFFEAB308),
                                    disabledContainerColor = if (dailySupported) Color(0x1A22C55E) else Color(0x1AEAB308),
                                    disabledContentColor = if (dailySupported) Color(0xFF22C55E) else Color(0xFFEAB308)
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    width = 1.5.dp, if (dailySupported) Color(0x4D22C55E) else Color(0x4DEAB308)
                                ),
                                contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                                    if (supporting) {
                                        androidx.compose.material3.CircularProgressIndicator(
                                            modifier = Modifier.size(12.dp), strokeWidth = 1.5.dp,
                                            color = Color(0xFFEAB308))
                                    } else {
                                        Text("\u2B50", fontSize = 14.sp)
                                    }
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        if (dailySupported) "Supported Today \u2714" else "Support (+60 Points)",
                                        fontSize = 11.sp, fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        // Podium: 2nd — 1st — 3rd
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.Bottom) {
                            // Silver (2nd): 48dp, offset 10dp down, silver border
                            // Gold (1st): 60dp, no offset (highest), gold border
                            // Bronze (3rd): 44dp, offset 12dp down, bronze border
                            data class PodiumSlot(val supporter: Map<String, Any>?, val medal: String, val avatarSize: Int, val borderColor: Long, val offsetDp: Int)
                            val slots = listOf(
                                PodiumSlot(s2, "\uD83E\uDD48", 48, 0xFF94a3b8, 10),   // silver
                                PodiumSlot(s1, "\uD83E\uDD47", 60, 0xFFfbbf24, 0),     // gold
                                PodiumSlot(s3, "\uD83E\uDD49", 44, 0xFFd97706, 12)     // bronze
                            )
                            slots.forEach { slot ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(horizontal = 8.dp).offset(y = slot.offsetDp.dp)) {
                                    if (slot.supporter != null) {
                                        val sId = slot.supporter["supporterId"]?.toString() ?: ""
                                        val resolvedProfile = supporterProfiles[sId]
                                        val sName = resolvedProfile?.first ?: slot.supporter["supporterName"]?.toString() ?: "User"
                                        val sAvatar = resolvedProfile?.second ?: slot.supporter["supporterAvatar"]?.toString() ?: ""
                                        val sPoints = getPoints(slot.supporter)
                                        Box(modifier = Modifier.size(slot.avatarSize.dp).clip(CircleShape)
                                            .border(2.dp, Color(slot.borderColor), CircleShape)) {
                                            if (sAvatar.isNotBlank()) {
                                                AsyncImage(model = CdnUtils.toCdn(sAvatar), contentDescription = null,
                                                    modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                            }
                                        }
                                        Text(slot.medal, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))
                                        Text(sName, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF334155),
                                            maxLines = 1, modifier = Modifier.padding(top = 2.dp), overflow = TextOverflow.Ellipsis)
                                        Text("${sPoints} pts", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = ColorPink)
                                    } else {
                                        Box(modifier = Modifier.size(slot.avatarSize.dp).clip(CircleShape)
                                            .border(2.dp, Color(slot.borderColor), CircleShape)
                                            .background(Color(slot.borderColor).copy(alpha = 0.05f)), contentAlignment = Alignment.Center) {
                                            Text(slot.medal, fontSize = 16.sp, color = ColorTextMuted)
                                        }
                                        Text(slot.medal, fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))
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
                    ProfileTabContent(
                        activeTab = activeTab,
                        liveHideGiftRecord = liveHideGiftRecord,
                        liveSvip = liveSvip,
                        receivedGifts = receivedGifts,
                        giftDetails = giftDetails,
                        filteredMedals = filteredMedals,
                        ownedItemIds = ownedItemIds,
                        storeItemsMap = storeItemsMap,
                        screenWidth = screenWidth
                    )
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

                // Period Tabs (weekly / monthly / total)
                var activePeriod by remember { mutableStateOf("weekly") }
                val periods = listOf("weekly", "monthly", "total")

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
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isSelected) ColorBlue else Color(0xFFF1F5F9))
                                .clickable { activePeriod = period }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = period.replaceFirstChar { it.uppercase() },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isSelected) ColorWhite else ColorTextSecondary
                            )
                        }
                    }
                }

                // Helper to get points
                fun getPoints(s: Map<String, Any>): Long {
                    val key = when (activePeriod) {
                        "weekly" -> "weeklyPoints"
                        "monthly" -> "monthlyPoints"
                        else -> "totalPoints"
                    }
                    return (s[key] as? Number)?.toLong() ?: 0L
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

// ════════════════════════════════════════════════════════════════
// PROFILE TAB CONTENT (extracted to reduce instruction count)
// ════════════════════════════════════════════════════════════════
@Composable
fun ProfileTabContent(
    activeTab: Int,
    liveHideGiftRecord: Boolean,
    liveSvip: Int,
    receivedGifts: Map<String, Any>,
    giftDetails: Map<String, Any>,
    filteredMedals: List<Map<String, Any>>,
    ownedItemIds: Set<String>,
    storeItemsMap: Map<String, Map<String, Any>>,
    screenWidth: Dp
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
        when (activeTab) {
            0 -> { // Gift tab
                if (liveHideGiftRecord && liveSvip >= 8) {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center) {
                        Text("\uD83D\uDD12 Gifts hidden by SVIP", fontSize = 12.sp, color = ColorTextMuted)
                    }
                } else if (receivedGifts.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center) {
                        Text("No Gift Received", fontSize = 12.sp, color = ColorTextMuted)
                    }
                } else {
                    // RN pattern: wrap, 5 columns
                    val columns = 5
                    val itemWidth = (screenWidth - 32.dp) / columns
                    val entries = receivedGifts.entries.toList()
                    val rows = (entries.size + columns - 1) / columns
                    Column {
                        for (row in 0 until rows) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                for (col in 0 until columns) {
                                    val idx = row * columns + col
                                    if (idx < entries.size) {
                                        val giftId = entries[idx].key
                                        val count = (entries[idx].value as? Number)?.toLong() ?: 0L
                                        val giftName = giftDetails["${giftId}_name"]?.toString() ?: giftId
                                        val giftImage = giftDetails["${giftId}_imageUrl"]?.toString()
                                        Column(modifier = Modifier.width(itemWidth).padding(vertical = 2.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally) {
                                            if (giftImage != null) {
                                                AsyncImage(model = CdnUtils.toCdn(giftImage),
                                                    contentDescription = null, modifier = Modifier.size(60.dp).clip(
                                                        RoundedCornerShape(6.dp)),
                                                    contentScale = ContentScale.Fit)
                                            } else {
                                                Text("\uD83C\uDF81", fontSize = 22.sp)
                                            }
                                            Text("x$count", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold,
                                                color = ColorPink, modifier = Modifier.padding(top = 2.dp))
                                            Text(giftName, fontSize = 8.sp, fontWeight = FontWeight.ExtraBold,
                                                color = ColorTextSecondary, maxLines = 1,
                                                textAlign = TextAlign.Center, modifier = Modifier.padding(top = 2.dp))
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
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
                    // WrapFlow grid of all medals (RN: medalList.length columns)
                    val columns = 3
                    val itemWidth = (screenWidth - 32.dp - 20.dp) / columns
                    val rows = (filteredMedals.size + columns - 1) / columns
                    Column {
                        for (row in 0 until rows) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                for (col in 0 until columns) {
                                    val idx = row * columns + col
                                    if (idx < filteredMedals.size) {
                                        val medal = filteredMedals[idx]
                                        Column(modifier = Modifier.width(itemWidth).padding(vertical = 6.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally) {
                                            val imgUrl = medal["imageUrl"] ?: medal["image"]
                                            if (imgUrl != null) {
                                                AsyncImage(model = CdnUtils.toCdn(imgUrl.toString()),
                                                    contentDescription = null, modifier = Modifier.size(56.dp),
                                                    contentScale = ContentScale.Fit)
                                            } else {
                                                Text("\uD83C\uDFC5", fontSize = 22.sp)
                                            }
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(medal["name"]?.toString() ?: "Medal", fontSize = 8.sp,
                                                fontWeight = FontWeight.ExtraBold, color = ColorTextSecondary,
                                                maxLines = 1, textAlign = TextAlign.Center)
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            2 -> { // Entry (Vehicle) tab
                val entries = storeItemsMap["entry"] ?: emptyMap()
                val ownedEntries = entries.filter { (id, _) -> id in ownedItemIds }
                if (ownedEntries.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("\uD83D\uDE97", fontSize = 32.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No Vehicle Owned", fontSize = 12.sp, color = ColorTextMuted)
                        }
                    }
                } else {
                    val columns = 3
                    val itemWidth = (screenWidth - 32.dp - 20.dp) / columns
                    val rows = (ownedEntries.size + columns - 1) / columns
                    Column {
                        for (row in 0 until rows) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                for (col in 0 until columns) {
                                    val idx = row * columns + col
                                    if (idx < ownedEntries.size) {
                                        val entry = ownedEntries.entries.elementAt(idx)
                                        val entryData = entry.value as? Map<*, *>
                                        val entryName = entryData?.get("name")?.toString() ?: "Entry"
                                        val entryImg = entryData?.get("imageUrl")?.toString() ?: entryData?.get("image")?.toString()
                                        Column(modifier = Modifier.width(itemWidth).padding(vertical = 6.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally) {
                                            if (entryImg != null) {
                                                AsyncImage(model = CdnUtils.toCdn(entryImg),
                                                    contentDescription = null, modifier = Modifier.size(56.dp),
                                                    contentScale = ContentScale.Fit)
                                            } else {
                                                Text("\uD83D\uDE97", fontSize = 22.sp)
                                            }
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(entryName, fontSize = 8.sp, fontWeight = FontWeight.ExtraBold,
                                                color = ColorTextSecondary, maxLines = 1,
                                                textAlign = TextAlign.Center)
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            3 -> { // Frame tab
                val frames = storeItemsMap["frame"] ?: emptyMap()
                val ownedFrames = frames.filter { (id, _) -> id in ownedItemIds }
                if (ownedFrames.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("\uD83D\uDDBC\uFE0F", fontSize = 32.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No Frame Owned", fontSize = 12.sp, color = ColorTextMuted)
                        }
                    }
                } else {
                    val columns = 3
                    val itemWidth = (screenWidth - 32.dp - 20.dp) / columns
                    val rows = (ownedFrames.size + columns - 1) / columns
                    Column {
                        for (row in 0 until rows) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                for (col in 0 until columns) {
                                    val idx = row * columns + col
                                    if (idx < ownedFrames.size) {
                                        val frameEntry = ownedFrames.entries.elementAt(idx)
                                        val frameData = frameEntry.value as? Map<*, *>
                                        val frameName = frameData?.get("name")?.toString() ?: "Frame"
                                        val frameImg = frameData?.get("imageUrl")?.toString() ?: frameData?.get("image")?.toString()
                                        Column(modifier = Modifier.width(itemWidth).padding(vertical = 6.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally) {
                                            if (frameImg != null) {
                                                AsyncImage(model = CdnUtils.toCdn(frameImg),
                                                    contentDescription = null, modifier = Modifier.size(56.dp),
                                                    contentScale = ContentScale.Fit)
                                            } else {
                                                Text("\uD83D\uDDBC\uFE0F", fontSize = 22.sp)
                                            }
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(frameName, fontSize = 8.sp, fontWeight = FontWeight.ExtraBold,
                                                color = ColorTextSecondary, maxLines = 1,
                                                textAlign = TextAlign.Center)
                                        }
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
