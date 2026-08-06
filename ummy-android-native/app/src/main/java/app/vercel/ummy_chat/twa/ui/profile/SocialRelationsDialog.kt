package app.vercel.ummy_chat.twa.ui.profile

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// SocialRelationsDialog — NO Dialog window, pure fullscreen overlay composable
// Matches RN <Modal statusBarTranslucent animationType="slide">
// ─────────────────────────────────────────────────────────────────────────────

data class SocialUser(
    val id: String = "",
    val username: String = "",
    val bio: String = "",
    val avatarUrl: String = "",
    val gender: String = "Male",
    val country: String = "IN",
    val richLevel: Int = 1,
    val charmLevel: Int = 0,
    val isFollowing: Boolean = false,
    val visitCount: Int = 1,
    val visitTimeAgo: String = "Just now"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SocialRelationsDialog(
    visible: Boolean,
    currentUid: String,
    isSvip: Boolean,
    initialTab: Int = 0,
    username: String = "Social",
    onDismissRequest: () -> Unit,
    onNavigateProfile: (String) -> Unit = {}
) {
    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it })
    ) {
        // Handle hardware back button
        BackHandler { onDismissRequest() }

        val tabs = listOf("Fans", "Following", "Friends", "Visitors")
        var selectedTabIndex by remember { mutableIntStateOf(initialTab) }

        // Full screen white surface — no Dialog, no separate window
        Box(
            modifier = Modifier
                .fillMaxSize()
                .zIndex(999f)
                .background(Color.White)
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            Column(modifier = Modifier.fillMaxSize()) {

                // Header (matches RN: paddingTop:52 paddingBottom:12 paddingHorizontal:16)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Back button (RN: ChevronLeft in circle bg #f8fafc)
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFF8FAFC))
                            .clickable { onDismissRequest() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ChevronLeft,
                            contentDescription = "Back",
                            tint = Color(0xFF1E293B),
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = username.uppercase(),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF1E293B),
                            letterSpacing = (-0.5).sp
                        )
                        Text(
                            text = "TRIBAL FREQUENCIES",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8),
                            letterSpacing = 1.sp
                        )
                    }
                }

                Divider(color = Color(0xFFF1F5F9))

                // Tabs
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = Color.White,
                    contentColor = Color(0xFF7C3AED),
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                            color = Color(0xFF7C3AED),
                            height = 3.dp
                        )
                    }
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = {
                                Text(
                                    text = title.uppercase(),
                                    color = if (selectedTabIndex == index) Color(0xFF7C3AED) else Color(0xFF94A3B8),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 0.5.sp,
                                    maxLines = 1,
                                    softWrap = false,
                                    overflow = TextOverflow.Clip
                                )
                            }
                        )
                    }
                }

                Divider(color = Color(0xFFF1F5F9))

                // Content
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .background(Color.White)
                ) {
                    when (selectedTabIndex) {
                        0 -> SocialListScreen(type = "fans", currentUid = currentUid, onNavigateProfile = onNavigateProfile)
                        1 -> SocialListScreen(type = "following", currentUid = currentUid, onNavigateProfile = onNavigateProfile)
                        2 -> SocialListScreen(type = "friends", currentUid = currentUid, onNavigateProfile = onNavigateProfile)
                        3 -> {
                            if (isSvip) {
                                SocialListScreen(type = "visitors", currentUid = currentUid, onNavigateProfile = onNavigateProfile)
                            } else {
                                SvipUpgradePrompt(onUpgrade = { })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SocialListScreen(
    type: String,
    currentUid: String,
    onNavigateProfile: (String) -> Unit
) {
    var users by remember { mutableStateOf<List<SocialUser>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(type, currentUid) {
        loading = true
        val db = FirebaseFirestore.getInstance()
        try {
            val result = mutableListOf<SocialUser>()
            when (type) {
                "fans" -> {
                    val snap = db.collection("followers")
                        .whereEqualTo("followingId", currentUid)
                        .get().await()
                    for (doc in snap.documents) {
                        val followerId = doc.getString("followerId") ?: continue
                        val userDoc = db.collection("users").document(followerId).get().await()
                        if (userDoc.exists()) {
                            val levelMap = userDoc.get("level") as? Map<*, *>
                            result.add(
                                SocialUser(
                                    id = followerId,
                                    username = userDoc.getString("username") ?: "User",
                                    bio = userDoc.getString("bio") ?: "",
                                    avatarUrl = userDoc.getString("avatarUrl") ?: "",
                                    gender = userDoc.getString("gender") ?: "Male",
                                    country = userDoc.getString("country") ?: "IN",
                                    richLevel = (levelMap?.get("currentLevel") as? Number)?.toInt() ?: 1,
                                    charmLevel = (levelMap?.get("charm") as? Number)?.toInt() ?: 0
                                )
                            )
                        }
                    }
                }
                "following" -> {
                    val snap = db.collection("followers")
                        .whereEqualTo("followerId", currentUid)
                        .get().await()
                    for (doc in snap.documents) {
                        val followingId = doc.getString("followingId") ?: continue
                        val userDoc = db.collection("users").document(followingId).get().await()
                        if (userDoc.exists()) {
                            val levelMap = userDoc.get("level") as? Map<*, *>
                            result.add(
                                SocialUser(
                                    id = followingId,
                                    username = userDoc.getString("username") ?: "User",
                                    bio = userDoc.getString("bio") ?: "",
                                    avatarUrl = userDoc.getString("avatarUrl") ?: "",
                                    gender = userDoc.getString("gender") ?: "Male",
                                    country = userDoc.getString("country") ?: "IN",
                                    richLevel = (levelMap?.get("currentLevel") as? Number)?.toInt() ?: 1,
                                    charmLevel = (levelMap?.get("charm") as? Number)?.toInt() ?: 0,
                                    isFollowing = true
                                )
                            )
                        }
                    }
                }
                "friends" -> {
                    val myFollowing = db.collection("followers")
                        .whereEqualTo("followerId", currentUid).get().await()
                    val myFollowers = db.collection("followers")
                        .whereEqualTo("followingId", currentUid).get().await()
                    val followingIds = myFollowing.documents.mapNotNull { it.getString("followingId") }.toSet()
                    val followerIds = myFollowers.documents.mapNotNull { it.getString("followerId") }.toSet()
                    val friendIds = followingIds.intersect(followerIds)
                    for (friendId in friendIds) {
                        val userDoc = db.collection("users").document(friendId).get().await()
                        if (userDoc.exists()) {
                            val levelMap = userDoc.get("level") as? Map<*, *>
                            result.add(
                                SocialUser(
                                    id = friendId,
                                    username = userDoc.getString("username") ?: "User",
                                    bio = userDoc.getString("bio") ?: "",
                                    avatarUrl = userDoc.getString("avatarUrl") ?: "",
                                    gender = userDoc.getString("gender") ?: "Male",
                                    country = userDoc.getString("country") ?: "IN",
                                    richLevel = (levelMap?.get("currentLevel") as? Number)?.toInt() ?: 1,
                                    charmLevel = (levelMap?.get("charm") as? Number)?.toInt() ?: 0,
                                    isFollowing = true
                                )
                            )
                        }
                    }
                }
                "visitors" -> {
                    val snap = db.collection("users").document(currentUid)
                        .collection("profileVisitors")
                        .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                        .limit(50)
                        .get().await()
                    for (doc in snap.documents) {
                        val visitorId = doc.getString("visitorId") ?: doc.getString("uid") ?: continue
                        val userDoc = db.collection("users").document(visitorId).get().await()
                        if (userDoc.exists()) {
                            val levelMap = userDoc.get("level") as? Map<*, *>
                            val count = (doc.get("count") as? Number)?.toInt() ?: 1
                            result.add(
                                SocialUser(
                                    id = visitorId,
                                    username = userDoc.getString("username") ?: "User",
                                    bio = userDoc.getString("bio") ?: "",
                                    avatarUrl = userDoc.getString("avatarUrl") ?: "",
                                    gender = userDoc.getString("gender") ?: "Male",
                                    country = userDoc.getString("country") ?: "IN",
                                    richLevel = (levelMap?.get("currentLevel") as? Number)?.toInt() ?: 1,
                                    charmLevel = (levelMap?.get("charm") as? Number)?.toInt() ?: 0,
                                    visitCount = count,
                                    visitTimeAgo = formatTimeAgo(doc.get("timestamp"))
                                )
                            )
                        }
                    }
                }
            }
            users = result
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            loading = false
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF7C3AED))
        }
    } else if (users.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                text = "NO ${type.uppercase()} YET",
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFFCBD5E1),
                letterSpacing = 1.sp
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
        ) {
            items(users) { user ->
                SocialUserItem(
                    user = user,
                    isVisitor = type == "visitors",
                    onUserClick = { onNavigateProfile(user.id) },
                    onToggleFollow = { }
                )
            }
        }
    }
}

@Composable
fun SocialUserItem(
    user: SocialUser,
    isVisitor: Boolean = false,
    onUserClick: () -> Unit,
    onToggleFollow: () -> Unit
) {
    val isFemale = user.gender.equals("Female", ignoreCase = true)
    val cdnAvatar = if (user.avatarUrl.isNotEmpty()) user.avatarUrl else "https://i.pravatar.cc/150?u=${user.id}"
    val flagEmoji = COUNTRY_FLAGS[user.country.lowercase()] ?: "\uD83C\uDDEE\uD83C\uDDF3"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onUserClick() }
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .border(2.dp, Color.White, CircleShape)
                .background(Color(0xFFF1F5F9))
        ) {
            AsyncImage(
                model = cdnAvatar,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = user.username.uppercase(),
                fontSize = 15.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = flagEmoji, fontSize = 14.sp)

                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(if (isFemale) Color(0xFFEC4899) else Color(0xFF3B82F6)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isFemale) "\u2640" else "\u2642",
                        color = Color.White,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = Color(0xFFF59E0B),
                    modifier = Modifier.height(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    ) {
                        Text("Lv.${user.richLevel}", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                }

                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = Color(0xFFA855F7),
                    modifier = Modifier.height(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    ) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color.White, modifier = Modifier.size(8.dp))
                        Spacer(modifier = Modifier.width(2.dp))
                        Text("${user.charmLevel}", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        if (isVisitor) {
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Visited ${user.visitCount} ${if (user.visitCount == 1) "time" else "times"}",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF7C3AED)
                )
                Text(
                    text = user.visitTimeAgo,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF64748B)
                )
            }
        } else {
            Surface(
                shape = RoundedCornerShape(99.dp),
                color = Color(0xFFF3E8FF),
                modifier = Modifier.clickable { onToggleFollow() }
            ) {
                Text(
                    text = if (user.isFollowing) "Following" else "Follow",
                    color = Color(0xFF7C3AED),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
fun SvipUpgradePrompt(onUpgrade: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0314))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(Color(0xFFA855F7).copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = "Locked",
                tint = Color(0xFFA855F7),
                modifier = Modifier.size(40.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Visitors History Locked",
            fontSize = 18.sp,
            fontWeight = FontWeight.Black,
            color = Color.White
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Only SVIP members can view their profile visitors log. Upgrade to SVIP now!",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onUpgrade,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA855F7)),
            shape = RoundedCornerShape(20.dp)
        ) {
            Text(text = "Upgrade to SVIP", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
        }
    }
}

private fun formatTimeAgo(timestamp: Any?): String {
    if (timestamp == null) return "Just now"
    val date = when (timestamp) {
        is com.google.firebase.Timestamp -> timestamp.toDate()
        is Map<*, *> -> {
            val seconds = (timestamp["seconds"] as? Number)?.toLong() ?: 0L
            java.util.Date(seconds * 1000)
        }
        else -> java.util.Date()
    }
    val diffMs = System.currentTimeMillis() - date.time
    val diffMins = diffMs / 60000
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return "${diffMins}m ago"
    val diffHours = diffMins / 60
    if (diffHours < 24) return "${diffHours}h ago"
    val diffDays = diffHours / 24
    return "${diffDays}d ago"
}
