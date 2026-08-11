package app.vercel.ummy_chat.twa.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import app.vercel.ummy_chat.twa.data.repository.LiveRoomModel
import app.vercel.ummy_chat.twa.ui.home.ChatRoomCard
import app.vercel.ummy_chat.twa.ui.profile.UserLevelBadge
import app.vercel.ummy_chat.twa.ui.profile.getLevelFromSpent
import app.vercel.ummy_chat.twa.ui.room.RoomProfileCard
import app.vercel.ummy_chat.twa.ui.room.RoomProfileUser
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay

// ============================================================
// React Native search.tsx → Kotlin Compose (EXACT PARITY)
// Source: src/app/search.tsx
// ============================================================

data class SearchResult(
    val type: String, // "user" or "room"
    val id: String,
    val title: String,
    val avatarUrl: String? = null,
    val subtitle: String? = null,
    val badge: String? = null,
    val levelValue: Int? = null,
    val password: String? = null,
    val ownerId: String? = null,
    val moderatorIds: List<String> = emptyList(),
    // extra fields for User Profile Card construction
    val gender: String? = null,
    val svip: Int = 0,
    val hasCpPartner: Boolean = false,
    val partnerAvatarUrl: String? = null,
    val cpLevel: Int = 1
)

@Composable
fun SearchScreen(
    onBack: () -> Unit,
    onOpenRoom: (roomId: String) -> Unit
) {
    var query by remember { mutableStateOf("") }
    var activeTab by remember { mutableStateOf("user") } // "user" or "room"
    var results by remember { mutableStateOf<List<SearchResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var hasSearched by remember { mutableStateOf(false) }

    // State to manage showing RoomProfileCard dialog
    var selectedUserForProfileCard by remember { mutableStateOf<RoomProfileUser?>(null) }

    // Debounced query logic matching RN L54-63
    LaunchedEffect(query, activeTab) {
        val input = query.trim()
        if (input.isEmpty()) {
            results = emptyList()
            isSearching = false
            hasSearched = false
            return@LaunchedEffect
        }
        isSearching = true
        hasSearched = true
        delay(400) // 400ms debounce
        performFirestoreSearch(input, activeTab) { searchResults ->
            results = searchResults
            isSearching = false
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L41-56)
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

                // Search Input Box (React Native L58-66)
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
                            color = Color(0xFF94A3B8),
                            modifier = Modifier.padding(start = 26.dp)
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

            // Tabs row (User | Room) matching RN L165-185
            Row(
                modifier = Modifier.fillMaxWidth()
            ) {
                // USER Tab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { activeTab = "user" }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            "USER",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (activeTab == "user") Color(0xFFEC4899) else Color(0xFF64748B)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .width(40.dp)
                                .height(2.dp)
                                .background(if (activeTab == "user") Color(0xFFEC4899) else Color.Transparent)
                        )
                    }
                }

                // ROOM Tab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { activeTab = "room" }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            "ROOM",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (activeTab == "room") Color(0xFFEC4899) else Color(0xFF64748B)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .width(40.dp)
                                .height(2.dp)
                                .background(if (activeTab == "room") Color(0xFFEC4899) else Color.Transparent)
                        )
                    }
                }
            }

            // Search Content / Results
            if (isSearching) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFFEC4899), strokeWidth = 3.dp)
                }
            } else if (query.isBlank()) {
                // Empty state matching RN
                Box(
                    modifier = Modifier.fillMaxWidth().padding(top = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        if (activeTab == "user") "SEARCH FOR USERS" else "SEARCH FOR ROOMS",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            } else if (results.isEmpty() && hasSearched) {
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
                if (activeTab == "user") {
                    // USER Results List
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        items(results) { res ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedUserForProfileCard = RoomProfileUser(
                                            uid = res.id,
                                            name = res.title,
                                            avatarUrl = res.avatarUrl ?: "https://picsum.photos/200",
                                            accountNumber = res.subtitle?.removePrefix("ID: ") ?: "",
                                            gender = res.gender,
                                            level = res.levelValue ?: 1,
                                            svip = res.svip,
                                            hasCpPartner = res.hasCpPartner,
                                            partnerAvatarUrl = res.partnerAvatarUrl,
                                            cpLevel = res.cpLevel
                                        )
                                    }
                                    .padding(vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = res.avatarUrl ?: "https://picsum.photos/200",
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFE2E8F0))
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            res.title,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF1E293B)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        UserLevelBadge(level = res.levelValue ?: 1, scale = 0.85f)
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        res.subtitle ?: "",
                                        fontSize = 12.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        }
                    }
                } else {
                    // ROOM Results Grid
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp)
                    ) {
                        items(results.chunked(2)) { pair ->
                            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                                pair.forEach { res ->
                                    val roomModel = LiveRoomModel(
                                        id = res.id,
                                        title = res.title,
                                        roomNumber = res.subtitle?.substringAfter("#") ?: "",
                                        coverUrl = res.avatarUrl ?: "",
                                        ownerName = "",
                                        participantCount = res.badge?.substringBefore(" ")?.toIntOrNull() ?: 0,
                                        isLocked = !res.password.isNullOrBlank(),
                                        password = res.password ?: ""
                                    )
                                    ChatRoomCard(room = roomModel, onPress = { onOpenRoom(res.id) })
                                }
                                if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }

        // Header Background glow overlay matching RN
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(24.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFFC084FC).copy(alpha = 0.4f),
                            Color(0xFFC084FC).copy(alpha = 0.1f),
                            Color.Transparent
                        )
                    )
                )
        )
    }

    // Render RoomProfileCard if selectedUserForProfileCard is not null
    selectedUserForProfileCard?.let { user ->
        RoomProfileCard(
            user = user,
            onDismiss = { selectedUserForProfileCard = null },
            onSendMessage = {
                selectedUserForProfileCard = null
                // Trigger messages dialog or detail navigation if available
            }
        )
    }
}

// Perform Firestore search matching RN performSearch logic
private fun performFirestoreSearch(
    input: String,
    activeTab: String,
    onResults: (List<SearchResult>) -> Unit
) {
    val db = FirebaseFirestore.getInstance()
    val isNumeric = input.all { it.isDigit() }

    if (activeTab == "user") {
        val found = mutableListOf<SearchResult>()
        val queries = mutableListOf<com.google.firebase.firestore.Query>()

        // Query 1: search by username prefix
        queries.add(
            db.collection("users")
                .orderBy("username")
                .startAt(input)
                .endAt(input + "\uf8ff")
                .limit(5)
        )

        // Query 2: search by accountNumber exact match (as string)
        queries.add(
            db.collection("users")
                .whereEqualTo("accountNumber", input)
                .limit(5)
        )

        // Query 3: search by activeIdBadge.displayId exact match (as string)
        queries.add(
            db.collection("users")
                .whereEqualTo("activeIdBadge.displayId", input)
                .limit(5)
        )

        if (isNumeric) {
            val numValue = input.toLongOrNull()
            if (numValue != null) {
                // Query 4: search by accountNumber exact match (as number)
                queries.add(
                    db.collection("users")
                        .whereEqualTo("accountNumber", numValue)
                        .limit(5)
                )
                // Query 5: search by activeIdBadge.displayId exact match (as number)
                queries.add(
                    db.collection("users")
                        .whereEqualTo("activeIdBadge.displayId", numValue)
                        .limit(5)
                )
            }
        }

        var completed = 0
        val total = queries.size

        queries.forEach { q ->
            q.get().addOnCompleteListener { task ->
                completed++
                if (task.isSuccessful && task.result != null) {
                    for (doc in task.result) {
                        val uid = doc.id
                        if (found.none { it.id == uid }) {
                            val username = doc.getString("username") ?: doc.getString("name") ?: "User"
                            val avatarUrl = doc.getString("avatarUrl") ?: "https://picsum.photos/200"
                            val accountNumber = doc.get("accountNumber")?.toString() ?: "No ID"
                            val displayId = doc.getString("activeIdBadge.displayId") ?: accountNumber

                            val wallet = doc.get("wallet") as? Map<*, *>
                            val totalSpent = (wallet?.get("totalSpent") as? Number)?.toLong() ?: 0L
                            val level = getLevelFromSpent(totalSpent)

                            found.add(
                                SearchResult(
                                    type = "user",
                                    id = uid,
                                    title = username,
                                    avatarUrl = avatarUrl,
                                    subtitle = "ID: $displayId",
                                    badge = "Lv.$level",
                                    levelValue = level,
                                    gender = doc.getString("gender"),
                                    svip = (doc.get("svip") as? Number)?.toInt() ?: 0,
                                    hasCpPartner = doc.getBoolean("hasCpPartner") ?: false,
                                    partnerAvatarUrl = doc.getString("partnerAvatarUrl"),
                                    cpLevel = (doc.get("cpLevel") as? Number)?.toInt() ?: 1
                                )
                            )
                        }
                    }
                }
                if (completed == total) {
                    onResults(found)
                }
            }
        }
    } else {
        // Tab is ROOM
        val found = mutableListOf<SearchResult>()
        val queries = mutableListOf<com.google.firebase.firestore.Query>()

        // Query 1: search by roomNumber (as string)
        queries.add(
            db.collection("chatRooms")
                .whereEqualTo("roomNumber", input)
                .limit(5)
        )

        if (isNumeric) {
            val numValue = input.toLongOrNull()
            if (numValue != null) {
                // Query 2: search by roomNumber (as number)
                queries.add(
                    db.collection("chatRooms")
                        .whereEqualTo("roomNumber", numValue)
                        .limit(5)
                )
            }
        }

        var completed = 0
        val total = queries.size

        queries.forEach { q ->
            q.get().addOnCompleteListener { task ->
                completed++
                if (task.isSuccessful && task.result != null) {
                    for (doc in task.result) {
                        val roomId = doc.id
                        if (found.none { it.id == roomId }) {
                            val title = doc.getString("title") ?: doc.getString("name") ?: "Room"
                            val coverUrl = doc.getString("coverUrl") ?: ""
                            val roomNumber = doc.get("roomNumber")?.toString() ?: "0000"
                            val participantCount = (doc.get("participantCount") as? Number)?.toInt() ?: 0

                            found.add(
                                SearchResult(
                                    type = "room",
                                    id = roomId,
                                    title = title,
                                    avatarUrl = coverUrl,
                                    subtitle = "Room #$roomNumber",
                                    badge = "$participantCount online",
                                    password = doc.getString("password"),
                                    ownerId = doc.getString("ownerId"),
                                    moderatorIds = (doc.get("moderatorIds") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList()
                                )
                            )
                        }
                    }
                }
                if (completed == total) {
                    onResults(found)
                }
            }
        }
    }
}
