package app.vercel.ummy_chat.twa.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

@Composable
fun UpdateDialog(
    versionName: String,
    releaseNotes: String,
    forceUpdate: Boolean,
    isDownloading: Boolean,
    downloadProgress: Float,
    downloadError: String? = null,
    onUpdate: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = { if (!forceUpdate && !isDownloading) onDismiss() },
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = !forceUpdate && !isDownloading, dismissOnClickOutside = !forceUpdate && !isDownloading)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.88f)
                .clip(RoundedCornerShape(32.dp))
                .background(Color(0xFF0A0118))
                .border(
                    width = 1.5.dp,
                    brush = Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFEC4899))),
                    shape = RoundedCornerShape(32.dp)
                )
                .padding(28.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF6366F1).copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (isDownloading) "\u23F3" else "\uD83D\uDE80", fontSize = 36.sp)
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    if (isDownloading) "Downloading Update..." else "New Mission Ready!",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF6366F1).copy(alpha = 0.15f),
                    modifier = Modifier.padding(bottom = 16.dp)
                ) {
                    Text(
                        text = "Version $versionName",
                        color = Color(0xFF818CF8),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }

                if (isDownloading) {
                    // Download Progress
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { downloadProgress },
                        modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                        color = Color(0xFF6366F1),
                        trackColor = Color(0xFF1E1B4B)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "${(downloadProgress * 100).toInt()}%",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                } else {
                    if (downloadError != null) {
                        Text(
                            text = downloadError,
                            fontSize = 13.sp,
                            color = Color(0xFFF87171),
                            textAlign = TextAlign.Center,
                            lineHeight = 18.sp,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    } else {
                        Text(
                            text = releaseNotes.ifBlank { "We've added amazing new features and fixed some bugs to make your experience smoother than ever." },
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.6f),
                            textAlign = TextAlign.Center,
                            lineHeight = 20.sp,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = onUpdate,
                    enabled = !isDownloading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                if (isDownloading) Brush.horizontalGradient(listOf(Color(0xFF475569), Color(0xFF64748B)))
                                else Brush.horizontalGradient(listOf(Color(0xFF6366F1), Color(0xFFA855F7)))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (isDownloading) "DOWNLOADING..." else "UPGRADE NOW",
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp,
                            color = Color.White,
                            letterSpacing = 1.sp
                        )
                    }
                }

                if (!forceUpdate && !isDownloading) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Maybe Later",
                        modifier = Modifier
                            .clickable { onDismiss() }
                            .padding(8.dp),
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
