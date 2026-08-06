package app.vercel.ummy_chat.twa.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.MomentCommentModel
import app.vercel.ummy_chat.twa.util.CdnUtils
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MomentCommentsSheet(
    momentId: String?,
    visible: Boolean,
    onClose: () -> Unit
) {
    if (!visible || momentId.isNullOrBlank()) return

    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
    val fs = FirebaseFirestore.getInstance()

    var text by remember { mutableStateOf("") }
    var replyTo by remember { mutableStateOf<Pair<String, String>?>(null) }
    var sending by remember { mutableStateOf(false) }
    var comments by remember { mutableStateOf<List<MomentCommentModel>>(emptyList()) }
    var momentCommentsCount by remember { mutableIntStateOf(0) }

    // Fetch moment comments count
    LaunchedEffect(momentId) {
        fs.collection("moments").document(momentId).addSnapshotListener { doc, _ ->
            momentCommentsCount = (doc?.getLong("commentsCount") ?: 0).toInt()
        }
    }

    // Fetch comments
    LaunchedEffect(momentId) {
        fs.collection("moments").document(momentId).collection("comments")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, _ ->
                comments = snapshot?.documents?.mapNotNull { doc ->
                    try {
                        val data = doc.data ?: return@mapNotNull null
                        MomentCommentModel(
                            id = doc.id,
                            text = data["text"] as? String ?: "",
                            userId = data["userId"] as? String ?: "",
                            username = data["username"] as? String ?: "User",
                            avatarUrl = data["avatarUrl"] as? String ?: "",
                            parentId = data["parentId"] as? String,
                            likesCount = (data["likesCount"] as? Number)?.toInt() ?: 0,
                            createdAt = data["createdAt"]
                        )
                    } catch (_: Exception) { null }
                } ?: emptyList()
            }
    }

    // Threaded comments
    val threadedComments = remember(comments) {
        val topLevel = comments.filter { it.parentId == null }
        val replies = comments.filter { it.parentId != null }
        topLevel.map { tc ->
            tc to replies.filter { it.parentId == tc.id }
        }
    }

    fun handleSend() {
        if (text.isBlank() || momentId.isBlank()) return
        sending = true

        val commentData = hashMapOf(
            "text" to text.trim(),
            "userId" to uid,
            "username" to "User",
            "avatarUrl" to "",
            "parentId" to replyTo?.first,
            "likesCount" to 0,
            "createdAt" to FieldValue.serverTimestamp()
        )

        fs.collection("moments").document(momentId).collection("comments").add(commentData)
            .addOnSuccessListener {
                fs.collection("moments").document(momentId).update("commentsCount", FieldValue.increment(1))
                text = ""
                replyTo = null
                sending = false
            }
            .addOnFailureListener { sending = false }
    }

    fun handleLikeComment(commentId: String) {
        val likeRef = fs.collection("moments").document(momentId)
            .collection("comments").document(commentId)
            .collection("likes").document(uid)
        val commentRef = fs.collection("moments").document(momentId)
            .collection("comments").document(commentId)

        fs.runTransaction { transaction ->
            val likeSnap = transaction.get(likeRef)
            val commentSnap = transaction.get(commentRef)
            val currentLikes = commentSnap.getLong("likesCount") ?: 0

            if (likeSnap.exists()) {
                transaction.delete(likeRef)
                transaction.update(commentRef, "likesCount", currentLikes - 1)
            } else {
                transaction.set(likeRef, mapOf("userId" to uid, "createdAt" to FieldValue.serverTimestamp()))
                transaction.update(commentRef, "likesCount", currentLikes + 1)
            }
        }
    }

    fun formatTime(ts: Any?): String {
        if (ts == null) return ""
        val date = when (ts) {
            is Timestamp -> ts.toDate()
            else -> return ""
        }
        val diff = System.currentTimeMillis() - date.time
        return when {
            diff < 60000 -> "now"
            diff < 3600000 -> "${diff / 60000}m"
            diff < 86400000 -> "${diff / 3600000}h"
            else -> {
                val cal = java.util.Calendar.getInstance().apply { time = date }
                "${cal.get(java.util.Calendar.MONTH) + 1}/${cal.get(java.util.Calendar.DAY_OF_MONTH)}"
            }
        }
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = sheetState,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(modifier = Modifier.fillMaxHeight(0.85f)) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Comments ${if (momentCommentsCount > 0) "($momentCommentsCount)" else ""}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )
                Icon(
                    Icons.Default.Close, null,
                    tint = Color(0xFF64748B),
                    modifier = Modifier
                        .size(24.dp)
                        .clickable { onClose() }
                )
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            // Comments list
            val listState = rememberLazyListState()
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp)
            ) {
                if (threadedComments.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No comments yet", color = Color(0xFF94A3B8), fontSize = 14.sp)
                        }
                    }
                } else {
                    items(threadedComments) { (comment, replies) ->
                        CommentRow(
                            comment = comment,
                            replies = replies,
                            depth = 0,
                            onReply = { id, username -> replyTo = id to username },
                            onLike = { handleLikeComment(it) },
                            formatTime = { formatTime(it) }
                        )
                    }
                }
            }

            // Reply-to indicator
            if (replyTo != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFEFF6FF))
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Replying to @${replyTo?.second ?: ""}",
                        color = Color(0xFF3B82F6),
                        fontSize = 12.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        Icons.Default.Close, null,
                        tint = Color(0xFF3B82F6),
                        modifier = Modifier
                            .size(16.dp)
                            .clickable { replyTo = null }
                    )
                }
            }

            // Input bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = {
                        Text(
                            if (replyTo != null) "Write a reply..." else "Write a comment...",
                            color = Color(0xFF94A3B8), fontSize = 14.sp
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(50)),
                    shape = RoundedCornerShape(50),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFE2E8F0),
                        focusedBorderColor = Color(0xFF8B5CF6)
                    ),
                    maxLines = 3
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    Icons.Default.Send, null,
                    tint = if (text.isNotBlank()) Color(0xFF06B6D4) else Color(0xFFCBD5E1),
                    modifier = Modifier
                        .size(24.dp)
                        .clickable { if (text.isNotBlank() && !sending) handleSend() }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun CommentRow(
    comment: MomentCommentModel,
    replies: List<MomentCommentModel>,
    depth: Int,
    onReply: (String, String) -> Unit,
    onLike: (String) -> Unit,
    formatTime: (Any?) -> String
) {
    Column(modifier = Modifier.padding(start = (depth * 16).dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            verticalAlignment = Alignment.Top
        ) {
            AsyncImage(
                model = CdnUtils.toCdn(comment.avatarUrl) ?: "https://picsum.photos/100",
                contentDescription = null,
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(comment.username, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF334155))
                    Text(formatTime(comment.createdAt), fontSize = 10.sp, color = Color(0xFF94A3B8))
                }
                Text(comment.text, fontSize = 14.sp, color = Color(0xFF1E293B), modifier = Modifier.padding(top = 2.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Icon(
                        Icons.Default.Favorite, null,
                        tint = Color(0xFF94A3B8),
                        modifier = Modifier
                            .size(14.dp)
                            .clickable { onLike(comment.id) }
                    )
                    if (comment.likesCount > 0) {
                        Text("${comment.likesCount}", fontSize = 10.sp, color = Color(0xFF94A3B8))
                    }
                    Text(
                        "Reply",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF94A3B8),
                        modifier = Modifier.clickable { onReply(comment.id, comment.username) }
                    )
                }
            }
        }

        // Nested replies
        replies.forEach { reply ->
            CommentRow(
                comment = reply,
                replies = emptyList(),
                depth = depth + 1,
                onReply = onReply,
                onLike = onLike,
                formatTime = formatTime
            )
        }
    }
}
