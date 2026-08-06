package app.vercel.ummy_chat.twa.ui.leaderboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import kotlin.math.cos
import kotlin.math.sin

data class LeaderboardUser(
    val uid: String,
    val username: String,
    val avatarUrl: String?,
    val totalSpent: Long,
    val frameUrl: String? = null
)

data class LeaderboardRoom(
    val roomId: String,
    val title: String,
    val roomNumber: String,
    val ownerName: String,
    val dailyGifts: Long
)

data class LeaderboardTheme(
    val id: String = "",
    val backgroundGradient: List<String> = emptyList(),
    val accentColor: String = "#FBBF24",
    val rainColor: String = "#FBBF24"
)

@Composable
fun LeaderboardScreen(
    onBack: () -> Unit,
    onOpenRoom: (roomId: String) -> Unit
) {
    var activeTab by remember { mutableStateOf("users") }
    var users by remember { mutableStateOf<List<LeaderboardUser>>(emptyList()) }
    var rooms by remember { mutableStateOf<List<LeaderboardRoom>>(emptyList()) }
    var theme by remember { mutableStateOf(LeaderboardTheme()) }
    var loading by remember { mutableStateOf(true) }

    DisposableEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        
        val themeListener = fs.collection("leaderboardThemes").document("current").addSnapshotListener { snap, _ ->
            snap?.toObject(LeaderboardTheme::class.java)?.let { theme = it }
        }

        val usersListener = fs.collection("users")
            .orderBy("wallet.totalSpent", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(100)
            .addSnapshotListener { snap, _ ->
                users = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val totalSpent = (data["wallet"] as? Map<*, *>)?.get("totalSpent") as? Number
                    LeaderboardUser(
                        uid = doc.id,
                        username = data["username"] as? String ?: "User",
                        avatarUrl = data["avatarUrl"] as? String,
                        totalSpent = totalSpent?.toLong() ?: 0L,
                        frameUrl = data["activeFrameUrl"] as? String
                    )
                } ?: emptyList()
                loading = false
            }

        val roomsListener = fs.collection("chatRooms")
            .orderBy("stats.dailyGifts", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(10)
            .addSnapshotListener { snap, _ ->
                rooms = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    val stats = data["stats"] as? Map<*, *>
                    LeaderboardRoom(
                        roomId = doc.id,
                        title = data["name"] as? String ?: data["title"] as? String ?: "Frequency",
                        roomNumber = data["roomNumber"] as? String ?: "0000",
                        ownerName = data["ownerName"] as? String ?: data["hostName"] as? String ?: "Tribe Member",
                        dailyGifts = (stats?.get("dailyGifts") as? Number)?.toLong() ?: 0L
                    )
                } ?: emptyList()
            }
        onDispose {
            themeListener.remove()
            usersListener.remove()
            roomsListener.remove()
        }
    }

    val bgBrush = if (theme.backgroundGradient.isNotEmpty()) {
        try {
            Brush.verticalGradient(theme.backgroundGradient.map { Color(android.graphics.Color.parseColor(it)) })
        } catch (e: Exception) {
            Brush.verticalGradient(listOf(Color(0xFF03000F), Color(0xFF1E1B4B)))
        }
    } else {
        Brush.verticalGradient(listOf(Color(0xFF03000F), Color(0xFF1E1B4B)))
    }

    val rainColor = try { Color(android.graphics.Color.parseColor(theme.rainColor)) } catch (e: Exception) { Color(0xFFFBBF24) }

    Box(modifier = Modifier.fillMaxSize().background(bgBrush)) {
        GoldenRainAnimation(color = rainColor)

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            Header(onBack)
            
            Tabs(activeTab) { activeTab = it }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color.White.copy(alpha = 0.5f))
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    if (activeTab == "users" && users.size >= 3) {
                        item { Podium(users.take(3)) }
                        items(users.drop(3)) { user -> UserRow(user) }
                    } else {
                        items(rooms) { room -> RoomRow(room, onOpenRoom) }
                    }
                }
            }
        }
    }
}

@Composable
fun GoldenRainAnimation(color: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "rain")
    val rainCount = 20
    val rainStates = List(rainCount) {
        infiniteTransition.animateFloat(
            initialValue = -100f,
            targetValue = 2000f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = (2000..4000).random(), easing = LinearEasing),
                repeatMode = RepeatMode.Restart,
                initialStartOffset = StartOffset((0..2000).random())
            ), label = "drop"
        )
    }
    val xOffsets = remember { List(rainCount) { (0..1000).random() / 1000f } }
    val density = LocalDensity.current

    Canvas(modifier = Modifier.fillMaxSize()) {
        val dropHeight = 40.dp.toPx()
        val dropWidth = 2.dp.toPx()
        rainStates.forEachIndexed { i, state ->
            drawRect(
                color = color.copy(alpha = 0.3f),
                topLeft = Offset(xOffsets[i] * size.width, state.value),
                size = Size(dropWidth, dropHeight)
            )
        }
    }
}

@Composable
fun Podium(top3: List<LeaderboardUser>) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp).height(240.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        // Rank 2
        PodiumMember(top3[1], 2, Modifier.weight(1f).height(180.dp), Color(0xFF94A3B8))
        // Rank 1
        PodiumMember(top3[0], 1, Modifier.weight(1.2f).height(220.dp), Color(0xFFFBBF24))
        // Rank 3
        PodiumMember(top3[2], 3, Modifier.weight(1f).height(160.dp), Color(0xFFD97706))
    }
}

@Composable
fun PodiumMember(user: LeaderboardUser, rank: Int, modifier: Modifier, accentColor: Color) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color(0xFF1E1B4B).copy(alpha = 0.8f))
            .border(2.dp, accentColor.copy(alpha = 0.5f), RoundedCornerShape(20.dp)),
        contentAlignment = Alignment.Center
    ) {
        if (rank == 1) OrbitingStar(accentColor)
        
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(contentAlignment = Alignment.Center) {
                AsyncImage(
                    model = user.avatarUrl ?: "https://picsum.photos/200",
                    contentDescription = null,
                    modifier = Modifier.size(if (rank == 1) 80.dp else 60.dp).clip(CircleShape).border(2.dp, accentColor, CircleShape),
                    contentScale = ContentScale.Crop
                )
                if (!user.frameUrl.isNullOrBlank()) {
                    AsyncImage(model = user.frameUrl, contentDescription = null, modifier = Modifier.size(if (rank == 1) 110.dp else 84.dp))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(user.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("${user.totalSpent} Coins", color = accentColor, fontWeight = FontWeight.Black, fontSize = 12.sp)
            Text("#$rank", color = accentColor.copy(alpha = 0.8f), fontWeight = FontWeight.Black, fontSize = 24.sp)
        }
    }
}

@Composable
fun OrbitingStar(color: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "orbit")
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing)), label = "angle"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        val radius = 100.dp
        val x = (radius.value * cos(Math.toRadians(angle.toDouble()))).dp
        val y = (radius.value * sin(Math.toRadians(angle.toDouble()))).dp

        Icon(
            Icons.Default.Star,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(16.dp).offset(x = x, y = y).align(Alignment.Center)
        )
    }
}

@Composable
fun Header(onBack: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBack, modifier = Modifier.background(Color.White.copy(alpha = 0.1f), CircleShape)) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
        }
        Text("🏆 Rankings", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(start = 16.dp))
    }
}

@Composable
fun Tabs(activeTab: String, onTabSelect: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(14.dp)).background(Color.White.copy(alpha = 0.1f)).padding(4.dp)
    ) {
        listOf("users" to "Users", "rooms" to "Rooms").forEach { (id, label) ->
            val selected = activeTab == id
            Box(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(if (selected) Color(0xFF6366F1) else Color.Transparent).clickable { onTabSelect(id) }.padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(label, color = if (selected) Color.White else Color.Gray, fontWeight = FontWeight.Bold)
            }
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}

@Composable
fun UserRow(user: LeaderboardUser) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = 0.05f)).padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(contentAlignment = Alignment.Center) {
            AsyncImage(
                model = user.avatarUrl ?: "https://picsum.photos/200",
                contentDescription = null,
                modifier = Modifier.size(44.dp).clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            if (!user.frameUrl.isNullOrBlank()) {
                AsyncImage(model = user.frameUrl, contentDescription = null, modifier = Modifier.size(62.dp))
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(user.username, color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("${user.totalSpent}", color = Color(0xFFFBBF24), fontWeight = FontWeight.Black)
    }
}

@Composable
fun RoomRow(room: LeaderboardRoom, onPress: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = 0.05f)).clickable { onPress(room.roomId) }.padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(44.dp).background(Color(0xFF6366F1), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
            Text("🎧", fontSize = 20.sp)
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(room.title, color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text("ID: ${room.roomNumber}", color = Color.Gray, fontSize = 12.sp)
        }
        Text("${room.dailyGifts}", color = Color(0xFFFBBF24), fontWeight = FontWeight.Black)
    }
}
