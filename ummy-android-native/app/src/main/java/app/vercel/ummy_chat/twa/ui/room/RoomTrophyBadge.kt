package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.TopSupporter
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import java.util.Calendar

private const val DAILY_TARGET = 2_500_000L

fun isToday(timestamp: com.google.firebase.Timestamp?): Boolean {
    if (timestamp == null) return false
    val cal1 = Calendar.getInstance().apply { time = timestamp.toDate() }
    val cal2 = Calendar.getInstance()
    return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
           cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
}

@Composable
fun RoomTrophyBadge(
    dailyGifts: Long = 0L,
    supporters: List<TopSupporter> = emptyList(),
    onPress: () -> Unit = {}
) {
    val progress = (dailyGifts.toFloat() / DAILY_TARGET).coerceIn(0f, 1f)

    // Filter top 3 supporters for TODAY only (matching React Native logic)
    val todayTopSupporters = remember(supporters) {
        supporters
            .map { s ->
                val amount = if (isToday(s.updatedAt)) s.dailyAmount else 0L
                s to amount
            }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }
            .map { it.first }
            .take(3)
    }

    Row(
        modifier = Modifier
            .padding(start = 0.dp, top = 6.dp) // Removed 10.dp padding to move to extreme left
            .clip(RoundedCornerShape(99.dp))
            .background(Color.Black.copy(alpha = 0.5f))
            .border(1.dp, Color(0xFFF59E0B).copy(alpha = 0.2f), RoundedCornerShape(99.dp))
            .clickable(onClick = onPress)
            .padding(start = 3.dp, end = 7.dp, top = 3.dp, bottom = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Trophy circle gradient
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFD97706))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Text("🏆", fontSize = 10.sp)
        }

        Spacer(Modifier.width(4.dp))

        // Gift count + progress bar
        Column(modifier = Modifier.wrapContentWidth()) {
            val displayText = when {
                dailyGifts >= 1_000_000 -> "${"%.2f".format(dailyGifts / 1_000_000f)}M"
                else -> "%,d".format(dailyGifts)
            }
            Text(
                displayText,
                fontSize = 9.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFFFBBF24),
                lineHeight = 10.sp
            )
            // Progress bar
            Box(
                modifier = Modifier
                    .width(32.dp)
                    .height(2.dp)
                    .clip(RoundedCornerShape(1.dp))
                    .background(Color.White.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress)
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFFFBBF24), Color(0xFFF59E0B))
                            )
                        )
                )
            }
        }

        // Top 3 supporter avatars (using negative spacing layout matching React Native -space-x-1)
        if (todayTopSupporters.isNotEmpty()) {
            Spacer(Modifier.width(6.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy((-3).dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                todayTopSupporters.forEachIndexed { i, sup ->
                    val borderColor = when (i) {
                        0 -> Color(0xFFFBBF24) // Gold
                        1 -> Color(0xFFCBD5E1) // Silver
                        else -> Color(0xFFB45309) // Bronze
                    }
                    LiveBadgeAvatar(
                        uid = sup.uid,
                        fallbackAvatarUrl = sup.avatarUrl,
                        fallbackName = sup.name,
                        borderColor = borderColor
                    )
                }
            }
        }

        Spacer(Modifier.width(2.dp))
        Icon(
            Icons.Default.ExpandMore,
            contentDescription = null,
            tint = Color(0xFFF59E0B).copy(alpha = 0.4f),
            modifier = Modifier.size(12.dp)
        )
    }
}

@Composable
fun LiveBadgeAvatar(
    uid: String,
    fallbackAvatarUrl: String?,
    fallbackName: String,
    borderColor: Color,
    modifier: Modifier = Modifier
) {
    var avatarUrl by remember { mutableStateOf<String?>(fallbackAvatarUrl) }
    var username by remember { mutableStateOf(fallbackName) }

    DisposableEffect(uid) {
        if (uid.isBlank()) {
            onDispose {}
        } else {
            val firestore = FirebaseFirestore.getInstance()
            val baseRef = firestore.collection("users").document(uid)
            val subRef = baseRef.collection("profile").document(uid)

            val baseListener = baseRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String ?: data?.get("name") as? String
                    if (name != null) username = name
                }
            }

            val subListener = subRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val data = snap.data
                    val av = data?.get("avatarUrl") as? String ?: data?.get("photoURL") as? String
                    if (av != null) avatarUrl = av
                    val name = data?.get("username") as? String ?: data?.get("name") as? String
                    if (name != null) username = name
                }
            }

            onDispose {
                baseListener.remove()
                subListener.remove()
            }
        }
    }

    Box(
        modifier = modifier
            .size(16.dp)
            .clip(CircleShape)
            .border(1.dp, borderColor, CircleShape)
    ) {
        AsyncImage(
            model = CdnUtils.toCdn(avatarUrl) ?: "https://api.dicebear.com/7.x/initials/png?seed=$username",
            contentDescription = username,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
    }
}
