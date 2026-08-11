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
import androidx.compose.ui.unit.Dp
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
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(44.dp)
            .padding(start = 8.dp, end = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
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

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
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
                    if (!isOwner) {
                        Spacer(modifier = Modifier.width(4.dp))
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
                Text(
                    text = "ID:${roomNumber.ifBlank { "" }}",
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 9.sp,
                    lineHeight = 12.sp
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HeaderBtn(
                icon = Icons.Default.Group,
                showLabel = true,
                label = "$onlineCount",
                iconSize = 17.dp,
                btnSize = 35.dp,
                onClick = onOpenUserList
            )
            if (isOwner) {
                HeaderBtn(
                    icon = Icons.Default.Settings,
                    iconSize = 22.dp,
                    btnSize = 35.dp,
                    onClick = onOpenSettings
                )
            }
            HeaderBtn(
                icon = Icons.Default.Share,
                iconSize = 20.dp,
                btnSize = 35.dp,
                onClick = onOpenShare
            )
            HeaderBtn(
                icon = Icons.Default.PowerSettingsNew,
                tint = Color(0xFFFCA5A5),
                iconSize = 20.dp,
                btnSize = 35.dp,
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
    iconSize: Dp = 16.dp,
    btnSize: Dp = 40.dp,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(btnSize)
            .clip(CircleShape)
            .background(Color.Black.copy(alpha = 0.4f))
            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (showLabel && label != null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(iconSize).offset(y = (-3).dp)
                )
                Text(
                    text = label,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 11.sp,
                    modifier = Modifier.align(Alignment.BottomCenter).offset(y = 3.dp)
                )
            }
        } else {
            Icon(
                icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier.size(iconSize)
            )
        }
    }
}
