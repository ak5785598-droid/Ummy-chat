package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun VisitorsTabContent(
    currentUid: String,
    isSvip: Boolean,
    onNavigateProfile: (String) -> Unit
) {
    var selectedInnerTab by remember { mutableIntStateOf(0) }
    val innerTabs = listOf("My Visitors", "Who I have visited")

    Column(modifier = Modifier.fillMaxSize()) {
        // Inner Tab Row
        TabRow(
            selectedTabIndex = selectedInnerTab,
            containerColor = Color.White,
            contentColor = Color(0xFF1E293B),
            indicator = { tabPositions ->
                Box(
                    modifier = Modifier
                        .tabIndicatorOffset(tabPositions[selectedInnerTab])
                        .height(3.dp)
                        .padding(horizontal = 30.dp)
                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                        .background(Color(0xFF1E293B))
                )
            },
            divider = {
                HorizontalDivider(color = Color(0xFFF1F5F9))
            }
        ) {
            innerTabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedInnerTab == index,
                    onClick = { selectedInnerTab = index },
                    text = {
                        Text(
                            text = title,
                            color = if (selectedInnerTab == index) Color(0xFF1E293B) else Color(0xFF94A3B8),
                            fontSize = 14.sp,
                            fontWeight = if (selectedInnerTab == index) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                )
            }
        }

        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            if (selectedInnerTab == 0) {
                VisitorList(
                    currentUid = currentUid,
                    isSvip = isSvip,
                    collectionName = "profileVisitors",
                    onNavigateProfile = onNavigateProfile
                )
            } else {
                VisitorList(
                    currentUid = currentUid,
                    isSvip = isSvip,
                    collectionName = "visitedProfiles",
                    onNavigateProfile = onNavigateProfile
                )
            }
        }
    }
}

@Composable
fun VisitorList(
    currentUid: String,
    isSvip: Boolean,
    collectionName: String,
    onNavigateProfile: (String) -> Unit
) {
    var visitors by remember { mutableStateOf<List<SocialUser>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    DisposableEffect(currentUid, collectionName) {
        loading = true
        val db = FirebaseFirestore.getInstance()
        
        // 7 days ago
        val sevenDaysAgoMs = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000
        val sevenDaysAgoDate = Date(sevenDaysAgoMs)

        val query = db.collection("users").document(currentUid)
            .collection(collectionName)
            .whereGreaterThanOrEqualTo("timestamp", sevenDaysAgoDate)
            .orderBy("timestamp", Query.Direction.DESCENDING)

        val listener = query.addSnapshotListener { snap, _ ->
            if (snap == null) {
                loading = false
                return@addSnapshotListener
            }
            
            // Background fetch for user data
            kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.IO) {
                val resultList = mutableListOf<SocialUser>()
                for (doc in snap.documents) {
                    val targetId = doc.getString("visitorId") ?: doc.getString("uid") ?: continue
                    val count = (doc.get("count") as? Number)?.toInt() ?: 1
                    val ts = doc.getTimestamp("timestamp")?.toDate() ?: Date()
                    
                    val userDoc = db.collection("users").document(targetId).get().await()
                    if (userDoc.exists()) {
                        val levelMap = userDoc.get("level") as? Map<*, *>
                        
                        val dateFormat = SimpleDateFormat("dd/MM HH:mm", Locale.getDefault())
                        val timeString = dateFormat.format(ts)
                        val timeAgoStr = "$timeString | View $count times"

                        resultList.add(
                            SocialUser(
                                id = targetId,
                                username = userDoc.getString("username") ?: "User",
                                bio = userDoc.getString("bio") ?: "",
                                avatarUrl = userDoc.getString("avatarUrl") ?: "",
                                gender = userDoc.getString("gender") ?: "Male",
                                country = userDoc.getString("country") ?: "IN",
                                richLevel = (levelMap?.get("currentLevel") as? Number)?.toInt() ?: 1,
                                charmLevel = (levelMap?.get("charm") as? Number)?.toInt() ?: 0,
                                visitCount = count,
                                visitTimeAgo = timeAgoStr
                            )
                        )
                    }
                }
                withContext(kotlinx.coroutines.Dispatchers.Main) {
                    visitors = resultList
                    loading = false
                }
            }
        }

        onDispose {
            listener.remove()
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF7C3AED))
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // SVIP Banner if not SVIP
            if (!isSvip) {
                item {
                    val bannerBrush = Brush.horizontalGradient(
                        colors = listOf(Color(0xFF5A2A1A), Color(0xFF38140B))
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(bannerBrush)
                            .clickable { /* Upgrade */ }
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Mock overlapping avatars
                            Box(modifier = Modifier.width(48.dp).height(32.dp)) {
                                Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.Gray).align(Alignment.CenterStart))
                                Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.DarkGray).align(Alignment.CenterEnd))
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Upgrade to SVIP to see who's interested in you.",
                                color = Color(0xFFFFD700),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.weight(1f)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .border(1.dp, Color(0xFFFFD700), RoundedCornerShape(99.dp))
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("View All", color = Color(0xFFFFD700), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else if (visitors.isEmpty()) {
                 item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "NO VISITORS IN LAST 7 DAYS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFFCBD5E1),
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            items(visitors) { user ->
                BlurredSocialUserItem(
                    user = user,
                    isBlurred = !isSvip,
                    onUserClick = { if (isSvip) onNavigateProfile(user.id) }
                )
            }

            item {
                Text(
                    text = "Displayed all visitors for 7 days",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp)
                )
            }
        }
    }
}

@Composable
fun BlurredSocialUserItem(
    user: SocialUser,
    isBlurred: Boolean,
    onUserClick: () -> Unit
) {
    val isFemale = user.gender.equals("Female", ignoreCase = true)
    val cdnAvatar = if (user.avatarUrl.isNotEmpty()) user.avatarUrl else "https://i.pravatar.cc/150?u=${user.id}"
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isBlurred) { onUserClick() }
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(Color(0xFFF1F5F9))
        ) {
            AsyncImage(
                model = cdnAvatar,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .then(if (isBlurred) Modifier.blur(16.dp) else Modifier)
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (isBlurred) "Hidden User" else user.username,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = if (isBlurred) Modifier.blur(8.dp) else Modifier
                )
                Spacer(modifier = Modifier.width(6.dp))
                // Gender Icon
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
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = user.visitTimeAgo,
                fontSize = 13.sp,
                color = Color(0xFF94A3B8)
            )
        }
    }
}
