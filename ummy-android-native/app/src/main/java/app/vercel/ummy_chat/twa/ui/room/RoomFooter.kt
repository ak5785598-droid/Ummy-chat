package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.R

data class RoomFooterState(
    val isMicMuted: Boolean = true,
    val isSpeakerMuted: Boolean = false,
    val isInSeat: Boolean = false,
    val isOwner: Boolean = false,
    val isModerator: Boolean = false
)

@Composable
fun RoomFooter(
    state: RoomFooterState,
    onToggleMic: () -> Unit,
    onToggleSpeaker: () -> Unit,
    onOpenChatInput: () -> Unit,
    onOpenEmoji: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenGift: () -> Unit,
    onOpenPlay: () -> Unit,
    onOpenSoundboard: () -> Unit,
    onOpenGames: () -> Unit,
    onOpenUserList: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    // RN L38-93: <View className="px-4 py-3"> <View className="flex-row items-center justify-between gap-2">
    // RN order: SayHi → Emoji → Mic → Speaker → Messages → Gift → Play
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 1. Say Hi pill — RN: flex-1 h-[38px] rounded-full bg-black/40 border-white/10 text-[13px] font-bold max-w-[100px]
        Box(
            modifier = Modifier
                .weight(1f)
                .widthIn(max = 100.dp)
                .height(38.dp)
                .clip(RoundedCornerShape(19.dp))
                .background(Color.Black.copy(alpha = 0.4f))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(19.dp))
                .clickable { onOpenChatInput() }
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "Say hi...",
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        // 2. Emoji — RN: w-[38px] h-[38px] rounded-full bg-black/40 border-white/10 FontAwesome5 smile size=20
        FooterIconBtn(
            icon = Icons.Default.EmojiEmotions,
            onClick = onOpenEmoji
        )

        // 3. Mic — RN: w:38 h:38 borderRadius:19
        //    active: bg-green-500/30 border-green-500/70, microphone icon white
        //    muted: bg-black/40 border-white/10, microphone-slash white/60
        //    opacity: isInSeat ? 1 : 0.4
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .then(
                    if (!state.isMicMuted)
                        Modifier.background(Color(0x4D22C55E))
                            .border(1.dp, Color(0xB322C55E), CircleShape)
                    else
                        Modifier.background(Color.Black.copy(alpha = 0.4f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                )
                .clickable { onToggleMic() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                if (!state.isMicMuted) Icons.Default.Mic else Icons.Default.MicOff,
                contentDescription = "Mic",
                tint = if (state.isMicMuted) Color.White.copy(alpha = 0.6f) else Color.White,
                modifier = Modifier
                    .size(18.dp)
                    .let { if (!state.isInSeat) it else it }
            )
        }

        // Need to wrap the rest with alpha for non-in-seat mic state
        // Actually RN applies opacity to mic button only, so this is fine

        // 4. Speaker — RN: w-[38px] h-[38px] rounded-full bg-black/40 border-white/10
        //    Ionicons volume-high / volume-mute size=20
        FooterIconBtn(
            icon = if (state.isSpeakerMuted) Icons.AutoMirrored.Filled.VolumeOff
                   else Icons.AutoMirrored.Filled.VolumeUp,
            onClick = onToggleSpeaker
        )

        // 5. Messages — RN: Ionicons chatbubble-ellipses size=20
        FooterIconBtn(
            icon = Icons.AutoMirrored.Filled.Chat,
            onClick = onOpenMessages
        )

// 6. Gift — RN: LinearGradient #A020F0→#FF69B4, FontAwesome5 gift size=18,
//    w 38 h 38 rounded-full border-white/20 shadow-lg
        FooterIconBtn(
            iconPainter = painterResource(R.drawable.ic_fa_gift),
            bgBrush = Brush.linearGradient(listOf(Color(0xFFA020F0), Color(0xFFFF69B4))),
            borderColor = Color.White.copy(alpha = 0.2f),
            onClick = onOpenGift
        )

        // 7. Play — RN: Ionicons grid size=20 (custom drawable, same 4 rounded squares)
        SimpleFooterBtn(
            icon = painterResource(R.drawable.ic_play_grid),
            iconSize = 20.dp,
            onClick = onOpenPlay
        )
    }
}

@Composable
private fun SimpleFooterBtn(
    icon: Painter,
    iconSize: Dp = 18.dp,
    tint: Color = Color.White,
    onClick: () -> Unit
) {
    val mod = Modifier
        .size(38.dp)
        .shadow(elevation = 6.dp, shape = CircleShape)
        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
        .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
        .clip(CircleShape)
        .clickable { onClick() }

    Box(modifier = mod, contentAlignment = Alignment.Center) {
        Icon(
            painter = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(iconSize)
        )
    }
}

@Composable
private fun FooterIconBtn(
    icon: ImageVector = Icons.Default.PlayArrow,
    iconPainter: Painter? = null,
    bgBrush: Brush? = null,
    borderColor: Color = Color.White.copy(alpha = 0.1f),
    tint: Color = Color.White,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    // RN: w-[38px] h-[38px] rounded-full bg-black/40 border-white/10 shadow-lg
    val mod = Modifier
        .size(38.dp)
        .shadow(elevation = 6.dp, shape = CircleShape)
        .then(
            if (bgBrush != null) Modifier.background(bgBrush, CircleShape)
            else Modifier.background(Color.Black.copy(alpha = 0.4f), CircleShape)
        )
        .border(1.dp, borderColor, CircleShape)
        .clip(CircleShape)
        .clickable(enabled = enabled) { onClick() }

    Box(modifier = mod, contentAlignment = Alignment.Center) {
        if (iconPainter != null) {
            Icon(
                painter = iconPainter,
                contentDescription = null,
                tint = tint.copy(alpha = if (enabled) 1f else 0.35f),
                modifier = Modifier.size(18.dp)
            )
        } else {
            Icon(
                icon, null,
                tint = tint.copy(alpha = if (enabled) 1f else 0.35f),
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
