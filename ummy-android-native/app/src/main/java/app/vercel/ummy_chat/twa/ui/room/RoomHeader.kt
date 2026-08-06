package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

@Composable
fun RoomHeader(
    title: String,
    roomNumber: String,
    coverUrl: String?,
    onlineCount: Int,
    isFollowing: Boolean,
    isOwner: Boolean,
    isModerator: Boolean,
    onFollow: () -> Unit,
    onExit: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenUserList: () -> Unit,
    onOpenInfo: () -> Unit,
    onOpenShare: () -> Unit
) {
    // Top gradient: RN L1559 — LinearGradient rgba(0,0,0,0.7)→transparent h-40 (absolute top-0)
    // Header row height = 44dp (RN L29: style={{ height: 44 }})
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .padding(start = 8.dp, end = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // ── Left: cover avatar + title/ID ──────────────────────────────
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            // Cover avatar — RN: w-12 h-12 (48dp) rounded-xl (12dp) border border-white/10 shadow
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .shadow(4.dp, RoundedCornerShape(12.dp))
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                    .clickable { onOpenInfo() }
            ) {
                if (coverUrl != null) {
                    AsyncImage(
                        model = coverUrl,
                        contentDescription = "Room",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    // RN: bg-gradient-to-br from-purple-500 to-pink-500
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF8B5CF6), Color(0xFFEC4899))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "R",
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 16.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Title + ID column
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // RN: text-white font-bold fontSize:14 letterSpacing:-0.3 lineHeight:16
                    Text(
                        text = title,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        lineHeight = 16.sp,
                        letterSpacing = (-0.3).sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.widthIn(max = 120.dp)
                    )
                    // Follow button — only if !isOwner
                    if (!isOwner) {
                        Spacer(modifier = Modifier.width(4.dp))
                        // RN: h-5 px-1.5 rounded-full flex-row items-center gap-1 border
                        // backgroundColor: isFollowing ? rgba(236,72,153,0.2) : rgba(255,255,255,0.05)
                        // borderColor: isFollowing ? rgba(236,72,153,0.4) : rgba(255,255,255,0.1)
                        Row(
                            modifier = Modifier
                                .height(20.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isFollowing) Color(0xFFEC4899).copy(alpha = 0.2f)
                                    else Color.White.copy(alpha = 0.05f)
                                )
                                .border(
                                    1.dp,
                                    if (isFollowing) Color(0xFFEC4899).copy(alpha = 0.4f)
                                    else Color.White.copy(alpha = 0.1f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { onFollow() }
                                .padding(horizontal = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Favorite,
                                contentDescription = null,
                                modifier = Modifier.size(10.dp),
                                tint = if (isFollowing) Color(0xFFEC4899)
                                else Color.White.copy(alpha = 0.4f)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = if (isFollowing) "Sub" else "Follow",
                                fontSize = 7.5.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.3).sp,
                                color = if (isFollowing) Color(0xFFEC4899)
                                else Color.White.copy(alpha = 0.4f)
                            )
                        }
                    }
                }
                // RN: text-white/40 fontSize:9 lineHeight:12
                Text(
                    text = "ID:${roomNumber.ifBlank { "" }}",
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 9.sp,
                    lineHeight = 12.sp
                )
            }
        }

        // ── Right: action icons — RN order: Users → Settings(owner only) → Share → Power ──
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Users button — RN: w-10 h-10 (40dp) rounded-full bg-black/40 border-white/10
            // RN: Users size=16, count text fontSize=9 bottom=2
            HeaderBtn(
                icon = Icons.Default.Group,
                showLabel = true,
                label = "$onlineCount",
                onClick = onOpenUserList
            )
            // Settings — owner only in RN (aligning with RN)
            if (isOwner) {
                HeaderBtn(
                    icon = Icons.Default.Settings,
                    onClick = onOpenSettings
                )
            }
            // Share
            HeaderBtn(
                icon = Icons.Default.Share,
                onClick = onOpenShare
            )
            // Exit — RN: Power icon tint=#fca5a5
            HeaderBtn(
                icon = Icons.Default.PowerSettingsNew,
                tint = Color(0xFFFCA5A5),
                onClick = onExit
            )
        }
    }
}

@Composable
private fun HeaderBtn(
    icon: ImageVector,
    showLabel: Boolean = false,
    label: String? = null,
    tint: Color = Color.White,
    onClick: () -> Unit
) {
    // RN: w-10 h-10 (40dp) rounded-full bg-black/40 border-white/10
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(Color.Black.copy(alpha = 0.4f))
            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (showLabel && label != null) {
            // RN: Users icon + count text at absolute bottom:2
            Box(modifier = Modifier.fillMaxSize()) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier
                        .size(16.dp)
                        .align(Alignment.TopCenter)
                        .padding(top = 6.dp)
                )
                Text(
                    text = label,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.sp,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 3.dp) // RN bottom:2 parity
                )
            }
        } else {
            Icon(
                icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
