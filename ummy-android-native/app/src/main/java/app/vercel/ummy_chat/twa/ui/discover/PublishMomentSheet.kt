package app.vercel.ummy_chat.twa.ui.discover

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
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
import app.vercel.ummy_chat.twa.ui.profile.getLevelFromSpent
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PublishMomentSheet(
    visible: Boolean,
    onClose: () -> Unit
) {
    if (!visible) return

    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
    val fs = FirebaseFirestore.getInstance()
    val storage = FirebaseStorage.getInstance()
    val scope = rememberCoroutineScope()

    var content by remember { mutableStateOf("") }
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var selectedType by remember { mutableStateOf("image") }
    var uploading by remember { mutableStateOf(false) }

    // Profile data
    var username by remember { mutableStateOf("Tribe Member") }
    var avatarUrl by remember { mutableStateOf("") }
    var userCountry by remember { mutableStateOf("IN") }
    var totalSpent by remember { mutableLongStateOf(0L) }

    LaunchedEffect(uid) {
        fs.collection("users").document(uid).collection("profile").document(uid)
            .get().addOnSuccessListener { doc ->
                username = doc.getString("username") ?: "Tribe Member"
                avatarUrl = doc.getString("avatarUrl") ?: ""
                userCountry = doc.getString("country") ?: "IN"
                totalSpent = doc.getLong("wallet.totalSpent") ?: 0L
            }
    }

    val userLevel = remember(totalSpent) { getLevelFromSpent(totalSpent) }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            selectedUri = it
            selectedType = if (it.toString().contains("video")) "video" else "image"
        }
    }

    fun handlePublish() {
        if (content.isBlank() && selectedUri == null) return
        uploading = true

        scope.launch {
            try {
                var mediaUrl = ""
                if (selectedUri != null) {
                    val ext = selectedUri.toString().substringAfterLast(".", "jpg")
                    val subfolder = if (selectedType == "video") "videos" else "images"
                    val path = "moments/$uid/$subfolder/${System.currentTimeMillis()}_${UUID.randomUUID()}.$ext"
                    val ref = storage.reference.child(path)
                    ref.putFile(selectedUri!!).await()
                    mediaUrl = ref.downloadUrl.await().toString()
                }

                val momentData = hashMapOf(
                    "userId" to uid,
                    "username" to username,
                    "avatarUrl" to avatarUrl,
                    "userLevel" to userLevel,
                    "userCountry" to userCountry,
                    "content" to content.trim(),
                    "type" to selectedType,
                    "likes" to 0,
                    "views" to 0,
                    "reach" to 0,
                    "commentsCount" to 0,
                    "createdAt" to FieldValue.serverTimestamp()
                )

                if (mediaUrl.isNotEmpty()) {
                    if (selectedType == "video") {
                        momentData["videoUrl"] = mediaUrl
                    } else {
                        momentData["imageUrl"] = mediaUrl
                    }
                }

                fs.collection("moments").add(momentData).await()

                content = ""
                selectedUri = null
                uploading = false
                onClose()
            } catch (_: Exception) {
                uploading = false
            }
        }
    }

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onClose,
        sheetState = sheetState,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight(0.92f)
                .padding(horizontal = 24.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp, bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("New Moment", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF1F5F9))
                        .clickable { onClose() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Close, null, tint = Color(0xFF64748B), modifier = Modifier.size(20.dp))
                }
            }

            // Media picker
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .border(
                        2.dp,
                        if (selectedUri != null) Color(0xFFA855F7) else Color(0xFFCBD5E1),
                        RoundedCornerShape(16.dp)
                    )
                    .background(if (selectedUri != null) Color(0xFFFAF5FF) else Color(0xFFF8FAFC))
                    .clickable { imagePicker.launch("*/*") },
                contentAlignment = Alignment.Center
            ) {
                if (selectedUri != null) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AsyncImage(
                            model = selectedUri,
                            contentDescription = null,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(RoundedCornerShape(16.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(8.dp)
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f))
                                .clickable { selectedUri = null },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Close, null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("\uD83D\uDCF7", fontSize = 36.sp)
                        Text("Tap to add photo/video", color = Color(0xFF94A3B8), fontSize = 14.sp, modifier = Modifier.padding(top = 8.dp))
                        Text("Max 5MB image, 15MB video", color = Color(0xFFCBD5E1), fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Text input
            OutlinedTextField(
                value = content,
                onValueChange = { if (it.length <= 500) content = it },
                placeholder = {
                    Text("What's on your mind?", color = Color(0xFF94A3B8), fontSize = 14.sp)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 100.dp),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color(0xFFE2E8F0),
                    focusedBorderColor = Color(0xFF8B5CF6),
                    unfocusedContainerColor = Color(0xFFF8FAFC),
                    focusedContainerColor = Color(0xFFF8FAFC)
                ),
                maxLines = 6
            )

            if (content.isNotEmpty()) {
                Text(
                    "${content.length}/500",
                    fontSize = 10.sp,
                    color = if (content.length > 450) Color(0xFFEF4444) else Color(0xFF94A3B8),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                        .wrapContentWidth(Alignment.End)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Publish button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        if (content.isNotBlank() || selectedUri != null) {
                            Brush.horizontalGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)))
                        } else {
                            Brush.horizontalGradient(listOf(Color(0xFFCBD5E1), Color(0xFF94A3B8)))
                        }
                    )
                    .clickable {
                        if ((content.isNotBlank() || selectedUri != null) && !uploading) {
                            handlePublish()
                        }
                    }
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                if (uploading) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Broadcast", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }
    }
}
