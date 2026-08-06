package app.vercel.ummy_chat.twa.ui.discover

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.MomentModel
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay

@Composable
fun FullscreenMomentOverlay(
    moments: List<MomentModel>,
    initialIndex: Int,
    visible: Boolean,
    onClose: () -> Unit,
    onOpenComments: (String) -> Unit
) {
    if (!visible || moments.isEmpty()) return
    if (initialIndex < 0 || initialIndex >= moments.size) return

    val context = LocalContext.current
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
    val fs = FirebaseFirestore.getInstance()

    var currentIndex by remember { mutableIntStateOf(initialIndex) }
    var likedMap by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) }
    var likeCounts by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }
    var isMuted by remember { mutableStateOf(true) }
    var showMoreOptions by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var swipeOffset by remember { mutableFloatStateOf(0f) }

    val currentMoment = moments.getOrNull(currentIndex) ?: return

    // View tracking after 1.5s
    LaunchedEffect(currentIndex, visible) {
        delay(1500)
        if (currentIndex < moments.size) {
            val moment = moments[currentIndex]
            val momentRef = fs.collection("moments").document(moment.id)
            val reachRef = fs.collection("moments").document(moment.id).collection("reach").document(uid)
            try {
                fs.runTransaction { transaction ->
                    transaction.update(momentRef, "views", FieldValue.increment(1))
                    val reachSnap = transaction.get(reachRef)
                    if (!reachSnap.exists()) {
                        transaction.set(reachRef, mapOf("userId" to uid, "createdAt" to FieldValue.serverTimestamp()))
                        transaction.update(momentRef, "reach", FieldValue.increment(1))
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun handleLike() {
        if (currentMoment.id.isBlank()) return
        val isCurrentlyLiked = likedMap[currentMoment.id] ?: false
        likedMap = likedMap + (currentMoment.id to !isCurrentlyLiked)
        likeCounts = likeCounts + (currentMoment.id to
                ((likeCounts[currentMoment.id] ?: currentMoment.likes) + if (isCurrentlyLiked) -1 else 1))

        val momentRef = fs.collection("moments").document(currentMoment.id)
        val likeRef = fs.collection("moments").document(currentMoment.id).collection("likes").document(uid)

        try {
            fs.runTransaction { transaction ->
                val snap = transaction.get(likeRef)
                if (snap.exists()) {
                    transaction.delete(likeRef)
                    transaction.update(momentRef, "likes", FieldValue.increment(-1))
                } else {
                    transaction.set(likeRef, mapOf("userId" to uid, "createdAt" to FieldValue.serverTimestamp()))
                    transaction.update(momentRef, "likes", FieldValue.increment(1))
                }
            }
        } catch (_: Exception) {
            likedMap = likedMap + (currentMoment.id to isCurrentlyLiked)
        }
    }

    fun handleShare() {
        val clip = ClipData.newPlainText("moment", "@${currentMoment.username} on Ummy: ${currentMoment.content}")
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(clip)
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    fun handleDelete() {
        fs.collection("moments").document(currentMoment.id).delete()
            .addOnSuccessListener {
                Toast.makeText(context, "Post deleted", Toast.LENGTH_SHORT).show()
                onClose()
            }
            .addOnFailureListener {
                Toast.makeText(context, "Could not delete", Toast.LENGTH_SHORT).show()
            }
    }

    fun handleReport(reason: String) {
        val report = hashMapOf(
            "type" to "moment",
            "targetId" to currentMoment.id,
            "targetContent" to (currentMoment.content ?: ""),
            "targetImageUrl" to (currentMoment.imageUrl ?: ""),
            "targetAuthorId" to currentMoment.userId,
            "targetAuthorName" to currentMoment.username,
            "reason" to reason,
            "reporterId" to uid,
            "status" to "pending",
            "timestamp" to FieldValue.serverTimestamp()
        )
        fs.collection("reports").add(report)
            .addOnSuccessListener {
                Toast.makeText(context, "Report submitted", Toast.LENGTH_SHORT).show()
                showReportDialog = false
            }
            .addOnFailureListener {
                Toast.makeText(context, "Could not submit report", Toast.LENGTH_SHORT).show()
            }
    }

    // Swipe to navigate
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(currentIndex) {
                detectVerticalDragGestures(
                    onDragEnd = {
                        if (kotlin.math.abs(swipeOffset) > size.height * 0.2f) {
                            val direction = if (swipeOffset > 0) -1 else 1
                            val nextIndex = currentIndex + direction
                            if (nextIndex in moments.indices) {
                                currentIndex = nextIndex
                            }
                        }
                        swipeOffset = 0f
                    },
                    onDragCancel = { swipeOffset = 0f },
                    onVerticalDrag = { _, dragAmount -> swipeOffset += dragAmount }
                )
            }
            .graphicsLayer { translationY = swipeOffset }
    ) {
        // Image
        AsyncImage(
            model = CdnUtils.toCdn(currentMoment.imageUrl) ?: "https://picsum.photos/600",
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Black.copy(alpha = 0.3f),
                            Color.Transparent,
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.5f)
                        )
                    )
                )
        )

        // ── Top Bar ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .clickable { onClose() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Close, null, tint = Color.White, modifier = Modifier.size(20.dp))
            }

            if (currentMoment.videoUrl != null) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.3f))
                        .clickable { isMuted = !isMuted },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (isMuted) Icons.Default.VolumeOff else Icons.AutoMirrored.Filled.VolumeUp,
                        null, tint = Color.White, modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        // ── Pagination indicator ──
        if (moments.size > 1) {
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (currentIndex > 0) {
                    Icon(Icons.Default.KeyboardArrowUp, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
                }
                if (currentIndex < moments.size - 1) {
                    Icon(Icons.Default.KeyboardArrowDown, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
                }
            }
        }

        // ── Action Buttons (right side) ──
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 16.dp, bottom = 140.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Like
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.3f))
                        .clickable { handleLike() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Favorite, null,
                        tint = if (likedMap[currentMoment.id] == true) Color(0xFFF43F5E) else Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Text(
                    "${likeCounts[currentMoment.id] ?: currentMoment.likes}",
                    color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Comments
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.3f))
                        .clickable { onOpenComments(currentMoment.id) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Comment, null, tint = Color.White, modifier = Modifier.size(24.dp))
                }
                Text(
                    "${currentMoment.commentsCount}",
                    color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Share
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .clickable { handleShare() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Share, null, tint = Color.White, modifier = Modifier.size(22.dp))
            }

            // More options
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .clickable { showMoreOptions = true },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.MoreVert, null, tint = Color.White, modifier = Modifier.size(22.dp))
            }
        }

        // ── Bottom User Info ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomStart)
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AsyncImage(
                    model = CdnUtils.toCdn(currentMoment.avatarUrl) ?: "https://picsum.photos/100",
                    contentDescription = null,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.5f), CircleShape),
                    contentScale = ContentScale.Crop
                )
                Text(currentMoment.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                currentMoment.content,
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 14.sp,
                lineHeight = 20.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }

    // ── More Options Dialog ──
    if (showMoreOptions) {
        AlertDialog(
            onDismissRequest = { showMoreOptions = false },
            title = { Text("Options") },
            text = { Text("What would you like to do?") },
            confirmButton = {
                if (currentMoment.userId == uid) {
                    TextButton(onClick = { showMoreOptions = false; showDeleteConfirm = true }) {
                        Text("Delete Post", color = Color.Red)
                    }
                } else {
                    TextButton(onClick = { showMoreOptions = false; showReportDialog = true }) {
                        Text("Report Post", color = Color.Red)
                    }
                }
            },
            dismissButton = {
                Column {
                    TextButton(onClick = { showMoreOptions = false; handleShare() }) {
                        Text("Copy Link")
                    }
                    TextButton(onClick = { showMoreOptions = false }) {
                        Text("Cancel")
                    }
                }
            }
        )
    }

    // ── Delete Confirmation ──
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Post") },
            text = { Text("Are you sure you want to delete this post?") },
            confirmButton = {
                TextButton(onClick = { showDeleteConfirm = false; handleDelete() }) {
                    Text("Delete", color = Color.Red)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // ── Report Dialog ──
    if (showReportDialog) {
        val reasons = listOf(
            "Spam",
            "Harassment or Bullying",
            "Inappropriate/Adult Content",
            "Hate Speech",
            "Intellectual Property Violation",
            "Other"
        )
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            title = { Text("Report Reason") },
            text = {
                Column {
                    reasons.forEach { reason ->
                        TextButton(onClick = { handleReport(reason) }) {
                            Text(reason)
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
