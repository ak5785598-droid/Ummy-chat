package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
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
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class RoomCategory(val id: String, val name: String, val icon: String)

private val categories = listOf(
    RoomCategory("chat", "Chat", "💬"),
    RoomCategory("music", "Music", "🎵"),
    RoomCategory("game", "Game", "🎮"),
    RoomCategory("party", "Party", "🎉")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateRoomSheet(
    visible: Boolean,
    onClose: () -> Unit,
    onRoomCreated: (roomId: String) -> Unit
) {
    if (!visible) return

    var roomName by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(categories[0].id) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable(indication = null, interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }) {
                    onClose()
                },
            contentAlignment = Alignment.BottomCenter
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(indication = null, interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }) { },
                shape = RoundedCornerShape(topStart = 40.dp, topEnd = 40.dp),
                color = Color.White
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Create Room",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E293B)
                        )
                        IconButton(
                            onClick = onClose,
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color(0xFFF1F5F9), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color(0xFF64748B),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Room Name Input
                    Text(
                        text = "Room Name",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF475569)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (roomName.isEmpty()) {
                            Text(
                                text = "Enter room name...",
                                color = Color(0xFF94A3B8),
                                fontSize = 16.sp
                            )
                        }
                        BasicTextField(
                            value = roomName,
                            onValueChange = { if (it.length <= 50) roomName = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = androidx.compose.ui.text.TextStyle(
                                fontSize = 16.sp,
                                color = Color(0xFF1E293B)
                            ),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Category Selector
                    Text(
                        text = "Category",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF475569)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        categories.forEach { category ->
                            val isSelected = selectedCategory == category.id
                            val bgColor = if (isSelected) Color(0xFFF3E8FF) else Color(0xFFF8FAFC)
                            val borderColor = if (isSelected) Color(0xFFA855F7) else Color(0xFFE2E8F0)
                            val borderWidth = if (isSelected) 2.dp else 1.dp
                            val textColor = if (isSelected) Color(0xFF7E22CE) else Color(0xFF64748B)

                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = 4.dp)
                                    .background(bgColor, RoundedCornerShape(12.dp))
                                    .border(borderWidth, borderColor, RoundedCornerShape(12.dp))
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { selectedCategory = category.id }
                                    .padding(vertical = 12.dp)
                            ) {
                                Text(text = category.icon, fontSize = 24.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = category.name,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = textColor
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // Create Button
                    val isButtonEnabled = roomName.isNotBlank() && !isLoading
                    val gradient = if (isButtonEnabled) {
                        Brush.horizontalGradient(listOf(Color(0xFF8B5CF6), Color(0xFF6366F1)))
                    } else {
                        Brush.horizontalGradient(listOf(Color(0xFFCBD5E1), Color(0xFF94A3B8)))
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(gradient, RoundedCornerShape(16.dp))
                            .clip(RoundedCornerShape(16.dp))
                            .clickable(enabled = isButtonEnabled) {
                                coroutineScope.launch {
                                    isLoading = true
                                    try {
                                        val userId = FirebaseAuth.getInstance().currentUser?.uid ?: return@launch
                                        val db = FirebaseFirestore.getInstance()
                                        
                                        var roomNumber = 1L
                                        db.runTransaction { transaction ->
                                            val counterRef = db.collection("appConfig").document("counters")
                                            val snapshot = transaction.get(counterRef)
                                            roomNumber = if (snapshot.exists()) {
                                                val current = snapshot.getLong("roomCounter") ?: 0L
                                                transaction.update(counterRef, "roomCounter", current + 1)
                                                current + 1
                                            } else {
                                                transaction.set(counterRef, mapOf("roomCounter" to 1L))
                                                1L
                                            }
                                            null
                                        }.await()

                                        val roomData = hashMapOf(
                                            "id" to userId,
                                            "name" to roomName,
                                            "title" to roomName,
                                            "roomNumber" to roomNumber,
                                            "ownerId" to userId,
                                            "moderatorIds" to emptyList<String>(),
                                            "category" to selectedCategory,
                                            "createdAt" to FieldValue.serverTimestamp(),
                                            "stats" to mapOf(
                                                "totalGifts" to 0,
                                                "dailyGifts" to 0
                                            ),
                                            "participantCount" to 0,
                                            "roomThemeId" to "misty",
                                            "isPinned" to false
                                        )

                                        db.collection("chatRooms").document(userId).set(roomData).await()
                                        onClose()
                                        onRoomCreated(userId)
                                    } catch (e: Exception) {
                                        e.printStackTrace()
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(
                            text = if (isLoading) "Creating..." else "Create Room",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(start = if (isLoading) 32.dp else 0.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
