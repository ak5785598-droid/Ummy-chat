package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import coil.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CpHouseScreen(
    onBack: () -> Unit
) {
    val fs = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val uid = auth.currentUser?.uid ?: ""

    var activeTab by remember { mutableStateOf("cp") }
    var isEditMode by remember { mutableStateOf(false) }
    var showSearch by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }

    var placedItems by remember { mutableStateOf(mutableListOf<PlacedItem>()) }
    val coroutineScope = rememberCoroutineScope()
    var showPropose by remember { mutableStateOf(false) }

    var activeCp by remember { mutableStateOf<Map<String, Any>?>(null) }
    var partnerProfile by remember { mutableStateOf<Map<String, Any>?>(null) }
    
    // Fetch existing CP layout
    DisposableEffect(uid) {
        if (uid.isEmpty()) return@DisposableEffect onDispose {}
        
        val listener = fs.collection("cpPairs")
            .whereArrayContains("participantIds", uid)
            .limit(1)
            .addSnapshotListener { snap, _ ->
                val doc = snap?.documents?.firstOrNull()
                if (doc != null) {
                    val data = doc.data
                    activeCp = data
                    
                    val layout = data?.get("mansionLayout") as? List<Map<String, Any>>
                    if (layout != null) {
                        placedItems = layout.map { 
                            PlacedItem(
                                id = it["id"] as? String ?: "",
                                catalogId = it["catalogId"] as? String ?: "",
                                x = (it["x"] as? Number)?.toInt() ?: 0,
                                y = (it["y"] as? Number)?.toInt() ?: 0,
                                rotation = (it["rotation"] as? Number)?.toInt() ?: 0
                            )
                        }.toMutableList()
                    }

                    val pIds = data?.get("participantIds") as? List<String>
                    val pUid = pIds?.find { it != uid }
                    if (pUid != null) {
                        fs.collection("users").document(pUid).collection("profile").document(pUid)
                            .get()
                            .addOnSuccessListener { pSnap ->
                                partnerProfile = pSnap.data
                            }
                    }
                } else {
                    activeCp = null
                    partnerProfile = null
                }
            }
            
        onDispose {
            listener.remove()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Animated Background
        CpHouseBackground(mode = activeTab)

        // Main Content Overlay
        Column(modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.statusBars)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }

                // Tabs
                Row(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0x33000000))) {
                    Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(if (activeTab == "cp") Color(0xFFF43F5E) else Color.Transparent).clickable { activeTab = "cp" }.padding(horizontal = 16.dp, vertical = 6.dp)) {
                        Text("CP", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(if (activeTab == "friend") Color(0xFF0EA5E9) else Color.Transparent).clickable { activeTab = "friend" }.padding(horizontal = 16.dp, vertical = 6.dp)) {
                        Text("Friend", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }

                IconButton(onClick = { showSearch = true }) {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.White)
                }
            }

            // Centered Content
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                if (!isEditMode) {
                    // Glassmorphic Couple Sanctuary Card
                    Box(modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(28.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .border(1.dp, if (activeTab == "cp") Color(0x4DF43F5E) else Color(0x4D0EA5E9), RoundedCornerShape(28.dp))
                    ) {
                        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = if (activeTab == "cp") "💖 COUPLE SANCTUARY" else "🤝 FRIEND SPACE",
                                color = if (activeTab == "cp") Color(0xFFF43F5E) else Color(0xFF0EA5E9),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Me Avatar
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .background(if (activeTab == "cp") Color(0x66F43F5E) else Color(0x660EA5E9))
                                        .padding(3.dp)
                                    ) {
                                        AsyncImage(
                                            model = auth.currentUser?.photoUrl?.toString() ?: "https://via.placeholder.com/150",
                                            contentDescription = "My Avatar",
                                            modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color(0xFF0A0018)),
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Me", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                
                                Spacer(modifier = Modifier.width(16.dp))
                                
                                // Heart
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("❤️", fontSize = 24.sp)
                                    if (activeCp != null) {
                                        Text("Lv.${activeCp?.get("level") ?: 1}", color = Color(0xFFFBBF24), fontSize = 9.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                                
                                Spacer(modifier = Modifier.width(16.dp))
                                
                                // Partner Avatar
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    if (partnerProfile != null || activeCp != null) {
                                        val partnerAvatarUrl = partnerProfile?.get("avatarUrl")?.toString() ?: activeCp?.get("user2Avatar")?.toString()
                                        val partnerName = partnerProfile?.get("username")?.toString()?.split(" ")?.get(0) ?: "Partner"
                                        Box(modifier = Modifier
                                            .size(72.dp)
                                            .clip(CircleShape)
                                            .background(if (activeTab == "cp") Color(0x668B5CF6) else Color(0x6622D3EE))
                                            .padding(3.dp)
                                        ) {
                                            AsyncImage(
                                                model = partnerAvatarUrl ?: "https://via.placeholder.com/150",
                                                contentDescription = "Partner Avatar",
                                                modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color(0xFF0A0018)),
                                                contentScale = ContentScale.Crop
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(partnerName, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    } else {
                                        Box(modifier = Modifier
                                            .size(72.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.06f))
                                            .border(2.dp, if (activeTab == "cp") Color(0x80F43F5E) else Color(0x800EA5E9), CircleShape)
                                            .clickable { showSearch = true }
                                            .padding(3.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("+", color = if (activeTab == "cp") Color(0xFFF43F5E) else Color(0xFF0EA5E9), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("Partner", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            // Stats Strip
                            if (activeCp != null) {
                                val cpScore = activeCp?.get("cpValue")?.toString() ?: "0"
                                val cpLevel = activeCp?.get("level")?.toString() ?: "1"
                                val createdAt = activeCp?.get("createdAt") as? com.google.firebase.Timestamp
                                val cpDays = if (createdAt != null) {
                                    java.util.concurrent.TimeUnit.MILLISECONDS.toDays(System.currentTimeMillis() - createdAt.toDate().time).toString()
                                } else "0"

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 16.dp)
                                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                                        .padding(vertical = 12.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(cpScore, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                        Text("SCORE", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    }
                                    Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color.White.copy(alpha = 0.08f)))
                                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Lv.$cpLevel", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                        Text("LEVEL", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    }
                                    Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color.White.copy(alpha = 0.08f)))
                                    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("${cpDays}d", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                        Text("DAYS", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    }
                                }
                                
                                // Contribution Breakdown
                                val u1Name = activeCp?.get("user1Name")?.toString() ?: "User 1"
                                val u2Name = activeCp?.get("user2Name")?.toString() ?: "User 2"
                                val u1Sent = activeCp?.get("user1Sent")?.toString() ?: "0"
                                val u2Sent = activeCp?.get("user2Sent")?.toString() ?: "0"
                                
                                Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(modifier = Modifier.weight(1f).background(Color(0x1AF43F5E), RoundedCornerShape(10.dp)).padding(vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(u1Name, color = Color.White.copy(alpha = 0.5f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                        Text(u1Sent, color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Black)
                                    }
                                    Text("❤️", fontSize = 16.sp)
                                    Column(modifier = Modifier.weight(1f).background(Color(0x1A0EA5E9), RoundedCornerShape(10.dp)).padding(vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(u2Name, color = Color.White.copy(alpha = 0.5f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                        Text(u2Sent, color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                                
                                // Break CP Button
                                Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp).background(Color(0x14EF4444), RoundedCornerShape(8.dp)).padding(vertical = 10.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Close, contentDescription = "Break", tint = Color(0xFFEF4444), modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Break Relationship", color = Color(0xFFEF4444), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }
                    }
                } else {
                    MansionEditor(
                        placedItems = placedItems,
                        isEditMode = isEditMode,
                        onItemMoved = { idx, x, y ->
                            placedItems = placedItems.toMutableList().apply {
                                this[idx] = this[idx].copy(x = x, y = y)
                            }
                        },
                        onItemRotated = { idx ->
                            placedItems = placedItems.toMutableList().apply {
                                val curRot = this[idx].rotation
                                this[idx] = this[idx].copy(rotation = (curRot + 90) % 360)
                            }
                        },
                        onItemRemoved = { idx ->
                            placedItems = placedItems.toMutableList().apply { removeAt(idx) }
                        }
                    )
                }
            }

            // Bottom Actions
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                Button(onClick = { isEditMode = !isEditMode }, colors = ButtonDefaults.buttonColors(containerColor = if (isEditMode) Color(0xFF10B981) else Color(0xFF1E293B))) {
                    Text(if (isEditMode) "Save Mansion" else "Edit Mansion")
                }
                
                if (isEditMode) {
                    Button(onClick = { 
                        // Add dummy item for demo
                        placedItems = placedItems.toMutableList().apply {
                            add(PlacedItem(System.currentTimeMillis().toString(), "neon-gaming-chair", 5, 5, 0))
                        }
                    }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))) {
                        Text("Add Furniture")
                    }
                }
            }
        }

        // Search Bottom Sheet / Dialog
        if (showSearch) {
            ModalBottomSheet(onDismissRequest = { showSearch = false }) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Search Users", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Account Number") },
                        trailingIcon = {
                            IconButton(onClick = {
                                coroutineScope.launch {
                                    isSearching = true
                                    try {
                                        val snap = fs.collection("users").whereEqualTo("accountNumber", searchQuery.trim()).get().await()
                                        searchResults = snap.documents.mapNotNull { it.data?.plus("uid" to it.id) }
                                    } catch (e: Exception) {}
                                    isSearching = false
                                }
                            }) {
                                Icon(Icons.Default.Search, contentDescription = "Search")
                            }
                        }
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    if (isSearching) {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                    } else {
                        LazyColumn {
                            items(searchResults.size) { i ->
                                val user = searchResults[i]
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clickable { 
                                        showSearch = false
                                        showPropose = true
                                    },
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(user["nickname"]?.toString() ?: "Unknown", fontWeight = FontWeight.Bold)
                                    Text("Propose", color = Color(0xFFF43F5E), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Propose Modal
        if (showPropose) {
            Dialog(onDismissRequest = { showPropose = false }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
                Box(modifier = Modifier.fillMaxWidth(0.85f).clip(RoundedCornerShape(24.dp)).background(Color.White).padding(24.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Send Proposal", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Send a CP or BFF proposal to this user?", textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Button(onClick = { showPropose = false }, colors = ButtonDefaults.buttonColors(containerColor = Color.LightGray)) { Text("Cancel") }
                            Button(onClick = { showPropose = false }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E))) { Text("Send CP") }
                        }
                    }
                }
            }
        }
    }
}
