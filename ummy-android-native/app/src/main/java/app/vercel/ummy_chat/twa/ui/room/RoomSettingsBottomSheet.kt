package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingsBottomSheet(
    roomId: String,
    roomTitle: String,
    announcement: String,
    onDismiss: () -> Unit,
    onUpdateRoom: (newTitle: String, newAnnouncement: String) -> Unit
) {
    var titleInput by remember { mutableStateOf(roomTitle) }
    var announcementInput by remember { mutableStateOf(announcement) }
    var isPasswordProtected by remember { mutableStateOf(false) }
    var passwordInput by remember { mutableStateOf("") }
    var selectedSeatCount by remember { mutableStateOf(11) }
    val seatOptions = listOf(6, 11, 16)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E293B)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Sheet Title
            Text(
                text = "⚙️ Room Settings & Control",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 20.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Room Name Input
            Text("Room Name", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = titleInput,
                onValueChange = { titleInput = it },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF6366F1)
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Room Announcement Input
            Text("Room Notice / Announcement", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedTextField(
                value = announcementInput,
                onValueChange = { announcementInput = it },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF6366F1)
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Amount of Mic Visual Selector
            AmountOfMicSelector(
                selectedCount = selectedSeatCount,
                onSelect = { selectedSeatCount = it }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Room Password Lock Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Lock Room with Password", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Switch(
                    checked = isPasswordProtected,
                    onCheckedChange = { isPasswordProtected = it },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF6366F1))
                )
            }

            if (isPasswordProtected) {
                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = passwordInput,
                    onValueChange = { passwordInput = it },
                    placeholder = { Text("Set 4-Digit PIN Password", color = Color.Gray) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF6366F1)
                    )
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Save Settings Button
            Button(
                onClick = {
                    val fs = FirebaseFirestore.getInstance()
                    val updates = hashMapOf<String, Any>(
                        "title" to titleInput,
                        "announcement" to announcementInput,
                        "seatsCount" to selectedSeatCount,
                        "isLocked" to isPasswordProtected
                    )
                    if (isPasswordProtected && passwordInput.isNotBlank()) {
                        updates["password"] = passwordInput
                    }
                    fs.collection("rooms").document(roomId).update(updates)
                    onUpdateRoom(titleInput, announcementInput)
                    onDismiss()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                Text("Save Changes 💾", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}

@Composable
fun AmountOfMicSelector(
    selectedCount: Int,
    onSelect: (Int) -> Unit
) {
    val options = listOf(8, 9, 11, 13, 16, 6) // Placed 6 at the end as an extra option
    val displayOptions = options.sorted() // sort to 6, 8, 9, 11, 13, 16

    Column(modifier = Modifier.fillMaxWidth()) {
        // Title
        Text(
            text = "Amount of Mic",
            color = Color.White,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Tabs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Regular Mic", color = Color.White, fontSize = 14.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Box(modifier = Modifier.width(24.dp).height(2.dp).background(Color(0xFF00E6A5), RoundedCornerShape(1.dp)))
            }
            Spacer(modifier = Modifier.width(40.dp))
            Text("Super Mic", color = Color.Gray.copy(alpha = 0.5f), fontSize = 14.sp)
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        
        // Grid of cards
        displayOptions.chunked(3).forEach { rowOptions ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                rowOptions.forEach { count ->
                    val isSelected = selectedCount == count
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .border(
                                width = if (isSelected) 2.dp else 0.dp,
                                color = if (isSelected) Color(0xFF00E6A5) else Color.Transparent,
                                shape = RoundedCornerShape(12.dp)
                            )
                            .background(Color(0xFF0D323E)) // Dark teal
                            .clickable { onSelect(count) },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Spacer(modifier = Modifier.height(12.dp))
                            MicLayoutPreview(count)
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White)
                                    .padding(vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("$count mics", color = Color.DarkGray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        
                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF00E6A5),
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(4.dp)
                                    .size(16.dp)
                            )
                        }
                    }
                }
                // Fill empty slots in the grid row to keep sizing consistent
                repeat(3 - rowOptions.size) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun MicLayoutPreview(count: Int) {
    val hasTopHost = count != 8
    val seatsPerRow = if (count in listOf(6, 11, 16)) 5 else 4
    val remainingSeats = if (hasTopHost) count - 1 else count
    
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.height(50.dp) // Fixed height to keep cards uniform
    ) {
        if (hasTopHost) {
            MicPreviewDot()
        }
        
        val rows = remainingSeats / seatsPerRow
        repeat(rows) {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                repeat(seatsPerRow) {
                    MicPreviewDot()
                }
            }
        }
    }
}

@Composable
fun MicPreviewDot() {
    Box(
        modifier = Modifier
            .size(10.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.2f))
    )
}
