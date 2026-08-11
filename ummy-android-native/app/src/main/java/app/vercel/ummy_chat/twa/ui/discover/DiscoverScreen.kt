package app.vercel.ummy_chat.twa.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.MomentModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen() {
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    var activeTab by remember { mutableStateOf("recommend") }
    var activeSection by remember { mutableStateOf("photos") }
    var moments by remember { mutableStateOf<List<MomentModel>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showPublish by remember { mutableStateOf(false) }
    var fullscreenIndex by remember { mutableIntStateOf(-1) }
    var commentsMomentId by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Following IDs cache
    var followingIds by remember { mutableStateOf<List<String>>(emptyList()) }

    // Fetch following list
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        val fs = FirebaseFirestore.getInstance()
        fs.collection("followers")
            .whereEqualTo("followerId", uid)
            .addSnapshotListener { snapshot, _ ->
                followingIds = snapshot?.documents?.mapNotNull { doc ->
                    doc.getString("followingId")
                } ?: emptyList()
            }
    }

    // Fetch moments based on active tab
    LaunchedEffect(activeTab, followingIds) {
        isLoading = true
        val fs = FirebaseFirestore.getInstance()
        val twentyFourHoursAgo = com.google.firebase.Timestamp(
            java.util.Date(System.currentTimeMillis() - 86400000L)
        )

        val query = when (activeTab) {
            "following" -> {
                if (followingIds.isEmpty()) {
                    isLoading = false
                    return@LaunchedEffect
                }
                fs.collection("moments")
                    .whereIn("userId", followingIds.take(30))
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(50)
            }
            else -> {
                fs.collection("moments")
                    .whereGreaterThanOrEqualTo("createdAt", twentyFourHoursAgo)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(50)
            }
        }

        val listener = query.addSnapshotListener { snapshot, _ ->
            moments = snapshot?.documents?.mapNotNull { doc ->
                try {
                    val data = doc.data ?: return@mapNotNull null
                    MomentModel(
                        id = doc.id,
                        userId = data["userId"] as? String ?: "",
                        username = data["username"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String ?: "",
                        userLevel = (data["userLevel"] as? Number)?.toInt() ?: 0,
                        userCountry = data["userCountry"] as? String ?: "IN",
                        content = data["content"] as? String ?: "",
                        imageUrl = data["imageUrl"] as? String,
                        videoUrl = data["videoUrl"] as? String,
                        type = data["type"] as? String,
                        likes = (data["likes"] as? Number)?.toInt() ?: 0,
                        views = (data["views"] as? Number)?.toInt() ?: 0,
                        reach = (data["reach"] as? Number)?.toInt() ?: 0,
                        commentsCount = (data["commentsCount"] as? Number)?.toInt() ?: 0,
                        createdAt = data["createdAt"]
                    )
                } catch (_: Exception) { null }
            } ?: emptyList()
            isLoading = false
        }
        delay(Long.MAX_VALUE)
    }

    val filteredMoments = remember(moments, activeSection) {
        moments.filter { m ->
            if (activeSection == "photos") m.type != "video" && m.videoUrl.isNullOrEmpty()
            else m.type == "video" || !m.videoUrl.isNullOrEmpty()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // ── Header Gradient ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(128.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF8B5CF6), Color(0x4D8B5CF6), Color.Transparent)
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // ── Top Header ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Post a Day with Ummy", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF9333EA))
                        .clickable { showPublish = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }

            // ── Tabs ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                listOf("recommend" to "Recommend", "following" to "Following").forEach { (tab, label) ->
                    val isSelected = activeTab == tab
                    Text(
                        text = label,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) Color(0xFF1E293B) else Color(0xFF94A3B8),
                        modifier = Modifier.clickable { activeTab = tab }
                    )
                }
            }

            // ── Moments Feed Grid ──
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF8B5CF6))
                    }
                } else if (filteredMoments.isEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text("\u2728", fontSize = 36.sp)
                        Text("No moments yet", color = Color(0xFF94A3B8), fontWeight = FontWeight.Medium)
                        Text("Be the first to share!", color = Color(0xFFCBD5E1), fontSize = 12.sp)
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 12.dp, end = 12.dp, bottom = 12.dp)
                    ) {
                        itemsIndexed(filteredMoments) { index, moment ->
                            MomentCard(
                                moment = moment,
                                onPress = { fullscreenIndex = index },
                                onCommentPress = { commentsMomentId = moment.id }
                            )
                        }
                    }
                }
            }

            // ── Section Toggle (Photos / Reels) ──
            Row(
                modifier = Modifier
                    .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 76.dp)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xFFF1F5F9))
                    .padding(2.dp)
            ) {
                listOf("photos" to "Photos", "reels" to "Reels").forEach { (section, label) ->
                    val isSelected = activeSection == section
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(50))
                            .background(if (isSelected) Color.White else Color.Transparent)
                            .clickable { activeSection = section }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            color = if (isSelected) Color(0xFF1E293B) else Color(0xFF94A3B8),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }

    // ── Modals ──
    if (fullscreenIndex >= 0 && fullscreenIndex < filteredMoments.size) {
        FullscreenMomentOverlay(
            moments = filteredMoments,
            initialIndex = fullscreenIndex,
            visible = true,
            onClose = { fullscreenIndex = -1 },
            onOpenComments = { id -> commentsMomentId = id }
        )
    }

    if (commentsMomentId != null) {
        MomentCommentsSheet(
            momentId = commentsMomentId,
            visible = true,
            onClose = { commentsMomentId = null }
        )
    }

    if (showPublish) {
        PublishMomentSheet(
            visible = true,
            onClose = { showPublish = false }
        )
    }
}
