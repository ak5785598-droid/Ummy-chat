package app.vercel.ummy_chat.twa.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Visibility
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.MomentModel
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage

@Composable
fun MomentCard(
    moment: MomentModel,
    onPress: () -> Unit,
    onCommentPress: () -> Unit,
    modifier: Modifier = Modifier
) {
    var imageError by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .padding(4.dp)
            .fillMaxWidth(0.5f)
            .aspectRatio(0.77f)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFF1F5F9))
            .clickable { onPress() }
    ) {
        // Image / Video / Text
        if (!moment.imageUrl.isNullOrEmpty() && !imageError) {
            AsyncImage(
                model = CdnUtils.toCdn(moment.imageUrl),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                onError = { imageError = true }
            )
        } else if (moment.type == "video" || !moment.videoUrl.isNullOrEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0xFF1E293B)),
                contentAlignment = Alignment.Center
            ) {
                if (!moment.imageUrl.isNullOrEmpty() && !imageError) {
                    AsyncImage(
                        model = CdnUtils.toCdn(moment.imageUrl),
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                // Play button
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }
        } else {
            // Text only moment
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0xFFE9D5FF)).padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = moment.content,
                    fontSize = 11.sp,
                    color = Color(0xFF9333EA),
                    textAlign = TextAlign.Center,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))
                    )
                )
        )

        // Comments Count Bubble
        if (moment.commentsCount > 0) {
            Row(
                modifier = Modifier
                    .padding(8.dp)
                    .align(Alignment.TopStart)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f))
                    .padding(horizontal = 8.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text("\uD83D\uDCAC", fontSize = 8.sp)
                Text(moment.commentsCount.toString(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Bottom Info
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(8.dp)
        ) {
            // User row
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                AsyncImage(
                    model = CdnUtils.toCdn(moment.avatarUrl.ifBlank { "https://picsum.photos/100" }),
                    contentDescription = null,
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                        .border(0.5.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                    contentScale = ContentScale.Crop
                )
                Text(
                    text = moment.username,
                    color = Color.White,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Views & Likes row
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Visibility, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(10.dp))
                    Text(moment.views.toString(), color = Color.White.copy(alpha = 0.6f), fontSize = 8.sp)
                }
                Row(
                    modifier = Modifier.clickable { onCommentPress() },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.Favorite, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(10.dp))
                    Text(moment.likes.toString(), color = Color.White.copy(alpha = 0.6f), fontSize = 8.sp)
                }
            }
        }
    }
}
