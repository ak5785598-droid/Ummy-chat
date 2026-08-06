package app.vercel.ummy_chat.twa.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.repository.HomeRealtimeRepository
import app.vercel.ummy_chat.twa.data.repository.LiveRoomModel
import app.vercel.ummy_chat.twa.ui.home.ChatRoomCard
import com.google.firebase.auth.FirebaseAuth

// ============================================================
// React Native search.tsx → Kotlin Compose (EXACT PARITY)
// Source: src/app/(tabs)/search.tsx
// ============================================================

@Composable
fun SearchScreen(
    onBack: () -> Unit,
    onOpenRoom: (roomId: String) -> Unit
) {
    var query by remember { mutableStateOf("") }
    var allRooms by remember { mutableStateOf<List<LiveRoomModel>>(emptyList()) }
    val repository = remember { HomeRealtimeRepository() }
    val currentUser = FirebaseAuth.getInstance().currentUser

    LaunchedEffect(Unit) {
        repository.getLiveRoomsStream().collect { allRooms = it }
    }

    // React Native search.tsx L28-33: filteredRooms = rooms.filter(name includes query)
    val filteredRooms = remember(allRooms, query) {
        if (query.isBlank()) emptyList()
        else allRooms.filter { room ->
            room.title.contains(query.trim(), ignoreCase = true) ||
                room.roomNumber.contains(query.trim()) ||
                room.ownerName.contains(query.trim(), ignoreCase = true)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native search.tsx L41-56)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF1F5F9))
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF1E293B), modifier = Modifier.size(18.dp))
                }
                // Search Input (React Native L58-66)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFFF1F5F9))
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🔍", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    if (query.isEmpty()) {
                        Text(
                            "Search rooms, IDs, users...",
                            fontSize = 14.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                    BasicTextField(
                        value = query,
                        onValueChange = { query = it },
                        modifier = Modifier.fillMaxWidth().padding(start = 26.dp),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontSize = 14.sp,
                            color = Color(0xFF1E293B)
                        ),
                        singleLine = true
                    )
                }
            }

            if (query.isBlank()) {
                // Empty state (React Native search.tsx L94-102)
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "SEARCH FOR ROOMS",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            } else if (filteredRooms.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "NO RESULTS FOUND",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp)
                ) {
                    items(filteredRooms.chunked(2)) { pair ->
                        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                            pair.forEach { room ->
                                ChatRoomCard(room = room, onPress = { onOpenRoom(room.id) })
                            }
                            if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // Background gradient header (React Native search.tsx L36-40)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(24.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFFC084FC),
                            Color(0xFFC084FC).copy(alpha = 0.4f),
                            Color.Transparent
                        )
                    )
                )
        )
    }
}
