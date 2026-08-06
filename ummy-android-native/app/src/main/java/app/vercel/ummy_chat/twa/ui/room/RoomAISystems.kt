package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

// ─────────────────────────────────────────────────────────────────────────────
// CaptionsOverlay — mirrors RN captions-overlay.tsx
// Live voice captions floating overlay on top of room header
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun CaptionsOverlay(
    visible: Boolean,
    speakerName: String = "",
    captionText: String = "",
    modifier: Modifier = Modifier
) {
    if (!visible || captionText.isBlank()) return

    Box(
        modifier = modifier
            .fillMaxWidth(0.9f)
            .clip(RoundedCornerShape(14.dp))
            .background(Color.Black.copy(alpha = 0.75f))
            .border(1.dp, Color(0xFF60A5FA).copy(alpha = 0.3f), RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("💬 ", fontSize = 12.sp)
            if (speakerName.isNotBlank()) {
                Text(
                    "$speakerName: ",
                    color = Color(0xFF60A5FA),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                captionText,
                color = Color.White,
                fontSize = 11.sp,
                maxLines = 2
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomSoundboard — mirrors RN room-soundboard.tsx
// Quick sound effects trigger board (Clap, Laugh, Cheering, Drum, Boo, Horn)
// ─────────────────────────────────────────────────────────────────────────────

private data class SoundEffect(val id: String, val label: String, val emoji: String)

private val SOUND_EFFECTS = listOf(
    SoundEffect("clap", "Clap", "👏"),
    SoundEffect("laugh", "Laugh", "😂"),
    SoundEffect("cheer", "Cheer", "🎉"),
    SoundEffect("drum", "Drum Roll", "🥁"),
    SoundEffect("boo", "Boo", "👎"),
    SoundEffect("horn", "Air Horn", "🎺")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSoundboardDialog(
    visible: Boolean,
    onPlaySound: (String) -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible) return

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🔊 Room Soundboard", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f))
                }
            }

            Spacer(Modifier.height(16.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.height(180.dp)
            ) {
                items(SOUND_EFFECTS, key = { it.id }) { sound ->
                    Box(
                        modifier = Modifier
                            .aspectRatio(1.2f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .clickable {
                                onPlaySound(sound.id)
                                onDismiss()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(sound.emoji, fontSize = 28.sp)
                            Spacer(Modifier.height(4.dp))
                            Text(sound.label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomEchoDialog — mirrors RN room-echo-dialog.tsx
// Echo & Reverb audio effect presets
// ─────────────────────────────────────────────────────────────────────────────

private val ECHO_PRESETS = listOf("None", "Studio", "KTV", "Concert Hall", "Church", "Vocal Booster")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomEchoDialog(
    visible: Boolean,
    currentPreset: String = "None",
    onSelectPreset: (String) -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible) return

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🎙️ Voice Reverb / Echo", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f))
                }
            }

            Spacer(Modifier.height(12.dp))

            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.height(260.dp)) {
                items(ECHO_PRESETS) { preset ->
                    val isSel = preset == currentPreset
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isSel) Color(0xFF8B5CF6) else Color.White.copy(alpha = 0.05f))
                            .clickable {
                                onSelectPreset(preset)
                                onDismiss()
                            }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(preset, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        if (isSel) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
