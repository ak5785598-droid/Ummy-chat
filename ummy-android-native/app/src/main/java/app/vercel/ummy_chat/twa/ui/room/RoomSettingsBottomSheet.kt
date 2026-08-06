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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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
    var selectedSeatCount by remember { mutableStateOf(9) }
    val seatOptions = listOf(5, 9, 13)

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

            // Seat Capacity Selector (5, 9, 13 Seats)
            Text("Voice Mic Seats Count", color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                seatOptions.forEach { count ->
                    val isSelected = selectedSeatCount == count
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) Color(0xFF6366F1) else Color(0xFF0F172A))
                            .clickable { selectedSeatCount = count }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("$count Seats", color = if (isSelected) Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

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
