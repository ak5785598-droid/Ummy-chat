package app.vercel.ummy_chat.twa.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

@Composable
fun BroadcasterTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var message by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }
    var success by remember { mutableStateOf<String?>(null) }
    var broadcasts by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("broadcasts").orderBy("sentAt", com.google.firebase.firestore.Query.Direction.DESCENDING).limit(20).get().await()
            broadcasts = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.NotificationImportant, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Broadcaster", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        Text("Send System Broadcast", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = message, onValueChange = { message = it }, label = { Text("Broadcast message...") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 3)
        Spacer(modifier = Modifier.height(12.dp))

        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF3B82F6)).clickable(enabled = message.isNotBlank() && !isSending) {
            isSending = true
            scope.launch {
                try {
                    db.collection("broadcasts").add(mapOf("message" to message.trim(), "sentAt" to com.google.firebase.Timestamp.now(), "sentBy" to "admin")).await()
                    success = "Broadcast sent!"
                    message = ""
                    val snap = db.collection("broadcasts").orderBy("sentAt", com.google.firebase.firestore.Query.Direction.DESCENDING).limit(20).get().await()
                    broadcasts = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
                } catch (e: Exception) { success = "Error: ${e.message}" }
                isSending = false
            }
        }.padding(14.dp), contentAlignment = Alignment.Center) {
            if (isSending) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            else Text("Send Broadcast", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("Recent Broadcasts", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))

        broadcasts.forEach { b ->
            Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(b["message"] as? String ?: "", fontSize = 13.sp, color = Color(0xFF1E293B))
                    Text("Sent: ${b["sentAt"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF94A3B8))
                }
            }
        }

        success?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(top = 12.dp), fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}
@Composable
fun LootConfigTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var lootItems by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var newItem by remember { mutableStateOf("") }
    var newChance by remember { mutableStateOf("") }
    var success by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("loot_items").get().await()
            lootItems = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CardGiftcard, null, tint = Color(0xFFA855F7), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Loot Config", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        Text("Add Loot Item", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = newItem, onValueChange = { newItem = it }, label = { Text("Item name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedTextField(value = newChance, onValueChange = { newChance = it }, label = { Text("Chance %") }, modifier = Modifier.width(80.dp), shape = RoundedCornerShape(12.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFFA855F7)).clickable {
                if (newItem.isNotBlank()) {
                    scope.launch {
                        db.collection("loot_items").add(mapOf("name" to newItem.trim(), "chance" to (newChance.toDoubleOrNull() ?: 0.0), "createdAt" to com.google.firebase.Timestamp.now())).await()
                        success = "Loot item added!"
                        newItem = ""; newChance = ""
                        val snap = db.collection("loot_items").get().await()
                        lootItems = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
                    }
                }
            }.padding(12.dp)) { Text("Add", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
        }

        Spacer(modifier = Modifier.height(16.dp))
        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            lootItems.forEach { item ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CardGiftcard, null, tint = Color(0xFFA855F7), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(item["name"] as? String ?: "", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("${item["chance"] ?: 0}%", fontSize = 12.sp, color = Color(0xFFA855F7), fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                            scope.launch {
                                db.collection("loot_items").document(item["docId"] as String).delete().await()
                                lootItems = lootItems.filter { it["docId"] != item["docId"] }
                            }
                        }.padding(horizontal = 10.dp, vertical = 6.dp)) { Text("X", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }

        success?.let { LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }; Text(it, color = Color(0xFF22C55E), fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.padding(top = 12.dp)) }
    }
}
@Composable
fun RewardsCenterTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var rewards by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("rewards_config").get().await()
            rewards = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CardGiftcard, null, tint = Color(0xFF22C55E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Rewards Center", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            rewards.forEach { r ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(r["name"] as? String ?: "Reward", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Type: ${r["type"] ?: "N/A"} | Amount: ${r["amount"] ?: 0}", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                }
            }
            if (rewards.isEmpty()) Text("No rewards configured", color = Color(0xFF94A3B8))
        }
    }
}
@Composable
fun SeatTimingTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var sessions by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("seat_sessions").orderBy("startTime", com.google.firebase.firestore.Query.Direction.DESCENDING).limit(50).get().await()
            sessions = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Timer, null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Seat Timing Tracker", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            sessions.forEach { s ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Timer, null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(s["userName"] as? String ?: "User", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Room: ${s["roomId"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                        Text("${s["duration"] ?: 0}min", fontSize = 12.sp, color = Color(0xFF0EA5E9), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun DirectMessengerTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var userIdInput by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var foundUser by remember { mutableStateOf<Map<String, Any>?>(null) }
    var foundUserId by remember { mutableStateOf("") }
    
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Message, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Direct Messenger", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        Text("RECIPIENT ID", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = userIdInput,
                onValueChange = { userIdInput = it },
                placeholder = { Text("e.g. 100023 or UID") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(10.dp))
            Button(
                onClick = {
                    if (userIdInput.isBlank()) return@Button
                    scope.launch {
                        loading = true
                        foundUser = null
                        try {
                            val snap = db.collection("users").whereEqualTo("accountNumber", userIdInput.trim()).limit(1).get().await()
                            if (!snap.isEmpty) {
                                foundUser = snap.documents[0].data
                                foundUserId = snap.documents[0].id
                            } else {
                                val doc = db.collection("users").document(userIdInput.trim()).get().await()
                                if (doc.exists()) {
                                    foundUser = doc.data
                                    foundUserId = doc.id
                                } else {
                                    message = "Not Found: No user matches this ID."
                                }
                            }
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        loading = false
                    }
                },
                modifier = Modifier.height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
            ) {
                if (loading) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("FIND", fontWeight = FontWeight.Bold)
            }
        }

        message?.let {
            Spacer(modifier = Modifier.height(10.dp))
            Text(it, color = if (it.startsWith("Error") || it.startsWith("Not Found")) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
        }

        if (foundUser != null) {
            Spacer(modifier = Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = foundUser!!["avatarUrl"] ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(foundUser!!["username"]?.toString() ?: "User", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Text("Account: ${foundUser!!["accountNumber"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("MESSAGE TITLE", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                placeholder = { Text("e.g. Warning / Reward") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))
            Text("MESSAGE CONTENT", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                placeholder = { Text("Write the system message...") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = {
                    if (title.isBlank() || content.isBlank() || userLevel < 6) {
                        message = if (userLevel < 6) "Error: Unauthorized" else "Please fill all fields"
                        return@Button
                    }
                    scope.launch {
                        sending = true
                        try {
                            db.collection("users").document(foundUserId).collection("notifications").add(
                                mapOf(
                                    "title" to title,
                                    "content" to content,
                                    "type" to "direct_system",
                                    "timestamp" to Timestamp.now(),
                                    "isRead" to false
                                )
                            ).await()
                            message = "Success: Private message sent to user."
                            title = ""
                            content = ""
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        sending = false
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
            ) {
                if (sending) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("SEND DIRECT MESSAGE", fontWeight = FontWeight.Bold)
            }
        }
    }
}
@Composable
fun SovereignIdsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var userIdInput by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var foundUser by remember { mutableStateOf<Map<String, Any>?>(null) }
    var foundUserId by remember { mutableStateOf("") }
    
    var newSovereignId by remember { mutableStateOf("") }
    var isUpdating by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    
    // Checkboxes/toggles state
    var isBudgetId by remember { mutableStateOf(false) }
    var isAdmin by remember { mutableStateOf(false) }
    
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.VerifiedUser, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Sovereign ID Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        Text("SEARCH USER ID", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = userIdInput,
                onValueChange = { userIdInput = it },
                placeholder = { Text("e.g. 100023 or UID") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(10.dp))
            Button(
                onClick = {
                    if (userIdInput.isBlank()) return@Button
                    scope.launch {
                        loading = true
                        foundUser = null
                        try {
                            val snap = db.collection("users").whereEqualTo("accountNumber", userIdInput.trim()).limit(1).get().await()
                            if (!snap.isEmpty) {
                                foundUser = snap.documents[0].data
                                foundUserId = snap.documents[0].id
                            } else {
                                val doc = db.collection("users").document(userIdInput.trim()).get().await()
                                if (doc.exists()) {
                                    foundUser = doc.data
                                    foundUserId = doc.id
                                } else {
                                    message = "Not Found: No user matches this ID."
                                }
                            }
                            foundUser?.let { u ->
                                isBudgetId = (u["isBudgetId"] as? Boolean) ?: false
                                isAdmin = (u["isAdmin"] as? Boolean) ?: false
                            }
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        loading = false
                    }
                },
                modifier = Modifier.height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
            ) {
                if (loading) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("LOCATE", fontWeight = FontWeight.Bold)
            }
        }

        message?.let {
            Spacer(modifier = Modifier.height(10.dp))
            Text(it, color = if (it.startsWith("Error") || it.startsWith("Not Found")) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
        }

        if (foundUser != null) {
            Spacer(modifier = Modifier.height(20.dp))
            Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = foundUser!!["avatarUrl"] ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(foundUser!!["username"]?.toString() ?: "User", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Text("Current ID: ${foundUser!!["accountNumber"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            Text("NEW SOVEREIGN ID", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = newSovereignId,
                onValueChange = { newSovereignId = it },
                placeholder = { Text("Leave blank to keep existing") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = isBudgetId, onCheckedChange = { isBudgetId = it })
                Spacer(modifier = Modifier.width(8.dp))
                Text("Is Budget ID")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = isAdmin, onCheckedChange = { isAdmin = it })
                Spacer(modifier = Modifier.width(8.dp))
                Text("Is Admin (Root Access)")
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = {
                    if (userLevel < 7) {
                        message = "Error: Sovereign actions require Level 7 (Creator) authority."
                        return@Button
                    }
                    scope.launch {
                        isUpdating = true
                        try {
                            val uRef = db.collection("users").document(foundUserId)
                            val pRef = db.collection("users").document(foundUserId).collection("profile").document(foundUserId)
                            val batch = db.batch()
                            
                            val updates = mutableMapOf<String, Any>(
                                "isBudgetId" to isBudgetId,
                                "isAdmin" to isAdmin,
                                "updatedAt" to Timestamp.now()
                            )
                            
                            if (newSovereignId.isNotBlank()) {
                                val newId = newSovereignId.trim()
                                val oldId = foundUser!!["accountNumber"]?.toString() ?: ""
                                updates["accountNumber"] = newId
                                updates["accountNumberLocked"] = true
                                
                                if (oldId.isNotBlank() && oldId != newId) {
                                    batch.delete(db.collection("assigned_ids").document(oldId))
                                }
                                batch.set(db.collection("assigned_ids").document(newId), mapOf("uid" to foundUserId, "assignedAt" to Timestamp.now()))
                            }
                            
                            batch.update(uRef, updates)
                            batch.update(pRef, updates)
                            batch.commit().await()
                            message = "Success: Sovereign Identity parameters updated."
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        isUpdating = false
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
            ) {
                if (isUpdating) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("APPLY SOVEREIGN PARAMS", fontWeight = FontWeight.Bold)
            }
        }
    }
}
@Composable
fun SystemControlTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var syncingIds by remember { mutableStateOf(false) }
    var resettingEconomy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.SettingsApplications, null, tint = Color(0xFF1E293B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("System Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))
        
        message?.let {
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(10.dp))
            LaunchedEffect(it) { kotlinx.coroutines.delay(5000); message = null }
        }

        // Global ID Sync
        Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).padding(18.dp)) {
            Text("Global Identity Sync", fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
            Text("Re-index users that do not follow numerical standard format.", fontSize = 11.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 4.dp, bottom = 14.dp))
            Button(
                onClick = {
                    if (userLevel < 7) { message = "Error: Level 7 required"; return@Button }
                    scope.launch {
                        syncingIds = true
                        try {
                            val usersSnap = db.collection("users").get().await()
                            val batch = db.batch()
                            var counter = 1000
                            for (doc in usersSnap.documents) {
                                if (doc.getString("accountNumber").isNullOrEmpty()) {
                                    batch.update(doc.reference, "accountNumber", (counter++).toString(), "updatedAt", Timestamp.now())
                                }
                            }
                            batch.commit().await()
                            message = "Success: Global re-indexing executed."
                        } catch (e: Exception) { message = "Error: ${e.message}" }
                        syncingIds = false
                    }
                },
                modifier = Modifier.fillMaxWidth().height(40.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A))
            ) {
                if (syncingIds) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                else Text("START GLOBAL SYNC", fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Economy Reset
        Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFFDF2F2), RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFFDE2E2), RoundedCornerShape(16.dp)).padding(18.dp)) {
            Text("Economy Purge & Reset", fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color(0xFF991B1B))
            Text("Wipe all coins and reset user balances back to 0. Destructive operation.", fontSize = 11.sp, color = Color(0xFFB91C1C), modifier = Modifier.padding(top = 4.dp, bottom = 14.dp))
            Button(
                onClick = {
                    if (userLevel < 7) { message = "Error: Level 7 required"; return@Button }
                    scope.launch {
                        resettingEconomy = true
                        try {
                            val usersSnap = db.collection("users").get().await()
                            val batch = db.batch()
                            for (doc in usersSnap.documents) {
                                batch.update(doc.reference, "wallet.coins", 0, "wallet.diamonds", 0, "updatedAt", Timestamp.now())
                            }
                            batch.commit().await()
                            message = "Success: Global economy purged."
                        } catch (e: Exception) { message = "Error: ${e.message}" }
                        resettingEconomy = false
                    }
                },
                modifier = Modifier.fillMaxWidth().height(40.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
            ) {
                if (resettingEconomy) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                else Text("EXECUTE ECONOMY RESET", fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }
    }
}
@Composable
fun GameSyncTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var editSlug by remember { mutableStateOf("") }
    var loadingBgUrl by remember { mutableStateOf("") }
    var coverUrl by remember { mutableStateOf("") }
    var updating by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.VideogameAsset, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Game Sync", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))
        
        Text("GAME SLUG", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        OutlinedTextField(
            value = editSlug,
            onValueChange = { editSlug = it },
            placeholder = { Text("e.g. teen-patti") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        Text("LOADING BG URL", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        OutlinedTextField(
            value = loadingBgUrl,
            onValueChange = { loadingBgUrl = it },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        Text("COVER URL", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        OutlinedTextField(
            value = coverUrl,
            onValueChange = { coverUrl = it },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        
        Spacer(modifier = Modifier.height(20.dp))
        message?.let {
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(10.dp))
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
        }
        
        Button(
            onClick = {
                if (editSlug.isBlank() || userLevel < 6) {
                    message = if (userLevel < 6) "Error: Unauthorized" else "Slug is required"
                    return@Button
                }
                scope.launch {
                    updating = true
                    try {
                        db.collection("games").document(editSlug.trim()).set(
                            mapOf(
                                "slug" to editSlug.trim(),
                                "loadingBackgroundUrl" to loadingBgUrl.trim(),
                                "coverUrl" to coverUrl.trim(),
                                "updatedAt" to Timestamp.now()
                            ), com.google.firebase.firestore.SetOptions.merge()
                        ).await()
                        message = "Success: Game config synced."
                        editSlug = ""; loadingBgUrl = ""; coverUrl = ""
                    } catch (e: Exception) { message = "Error: ${e.message}" }
                    updating = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6))
        ) {
            if (updating) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE SYNC", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun AssignCenterTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var userIdInput by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var targetUser by remember { mutableStateOf<Map<String, Any>?>(null) }
    var targetUserId by remember { mutableStateOf("") }
    
    var updatingSeller by remember { mutableStateOf(false) }
    var updatingOfficial by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Security, null, tint = Color(0xFF6366F1), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Assign Center", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        Text("SEARCH USER ID", fontWeight = FontWeight.Black, fontSize = 11.sp, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = userIdInput,
                onValueChange = { userIdInput = it },
                placeholder = { Text("e.g. 100023") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(10.dp))
            Button(
                onClick = {
                    if (userIdInput.isBlank()) return@Button
                    scope.launch {
                        loading = true
                        targetUser = null
                        try {
                            val snap = db.collection("users").whereEqualTo("accountNumber", userIdInput.trim()).limit(1).get().await()
                            if (!snap.isEmpty) {
                                targetUser = snap.documents[0].data
                                targetUserId = snap.documents[0].id
                            } else {
                                message = "Not Found: No user matches this ID."
                            }
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        loading = false
                    }
                },
                modifier = Modifier.height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
            ) {
                if (loading) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                else Text("SEARCH", fontWeight = FontWeight.Bold)
            }
        }
        
        message?.let {
            Spacer(modifier = Modifier.height(10.dp))
            Text(it, color = if (it.startsWith("Error") || it.startsWith("Not Found")) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
        }

        if (targetUser != null) {
            Spacer(modifier = Modifier.height(20.dp))
            val tags = (targetUser!!["tags"] as? List<String>) ?: emptyList()
            val isSeller = tags.any { it in listOf("Seller", "Seller center", "Coin Seller") }
            val isOfficial = tags.any { it in listOf("Official center", "Admin") }

            Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = targetUser!!["avatarUrl"] ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(targetUser!!["username"]?.toString() ?: "User", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Text("Account: ${targetUser!!["accountNumber"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Toggle Seller Center
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Seller Center", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Text("Allow coin transactions & store control.", fontSize = 11.sp, color = Color(0xFF64748B))
                }
                Switch(
                    checked = isSeller,
                    onCheckedChange = {
                        if (userLevel < 7) { message = "Error: Level 7 required"; return@Switch }
                        scope.launch {
                            updatingSeller = true
                            try {
                                val newTags = if (isSeller) tags.filter { it !in listOf("Seller", "Seller center", "Coin Seller") } else tags + "Seller"
                                val batch = db.batch()
                                batch.update(db.collection("users").document(targetUserId), "tags", newTags, "updatedAt", Timestamp.now())
                                batch.update(db.collection("users").document(targetUserId).collection("profile").document(targetUserId), "tags", newTags, "updatedAt", Timestamp.now())
                                batch.commit().await()
                                targetUser = targetUser!!.toMutableMap().apply { put("tags", newTags) }
                                message = "Success: Seller Center ${if (isSeller) "Revoked" else "Activated"}"
                            } catch (e: Exception) { message = "Error: ${e.message}" }
                            updatingSeller = false
                        }
                    },
                    enabled = !updatingSeller
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Toggle Official Center
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Official Center", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Text("Grants full system root access.", fontSize = 11.sp, color = Color(0xFF64748B))
                }
                Switch(
                    checked = isOfficial,
                    onCheckedChange = {
                        if (userLevel < 7) { message = "Error: Level 7 required"; return@Switch }
                        scope.launch {
                            updatingOfficial = true
                            try {
                                val newTags = if (isOfficial) tags.filter { it !in listOf("Official center", "Admin") } else tags + "Official center"
                                val newIsAdmin = !isOfficial
                                val batch = db.batch()
                                batch.update(db.collection("users").document(targetUserId), "tags", newTags, "isAdmin", newIsAdmin, "updatedAt", Timestamp.now())
                                batch.update(db.collection("users").document(targetUserId).collection("profile").document(targetUserId), "tags", newTags, "isAdmin", newIsAdmin, "updatedAt", Timestamp.now())
                                batch.commit().await()
                                targetUser = targetUser!!.toMutableMap().apply { put("tags", newTags); put("isAdmin", newIsAdmin) }
                                message = "Success: Admin Portal ${if (isOfficial) "Revoked" else "Activated"}"
                            } catch (e: Exception) { message = "Error: ${e.message}" }
                            updatingOfficial = false
                        }
                    },
                    enabled = !updatingOfficial
                )
            }
        }
    }
}

@Composable
fun BannersTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var banners by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    
    var newImageUrl by remember { mutableStateOf("") }
    var newTargetUrl by remember { mutableStateOf("") }
    var isAdding by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("banners").orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING).get().await()
            banners = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.ViewCarousel, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Home Banners", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (userLevel >= 6) {
            Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Text("ADD NEW BANNER", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = newImageUrl, onValueChange = { newImageUrl = it }, placeholder = { Text("Banner Image URL") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = newTargetUrl, onValueChange = { newTargetUrl = it }, placeholder = { Text("Target Web URL (Optional)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        if (newImageUrl.isBlank()) return@Button
                        scope.launch {
                            isAdding = true
                            try {
                                val doc = mapOf("imageUrl" to newImageUrl.trim(), "targetUrl" to newTargetUrl.trim(), "createdAt" to Timestamp.now())
                                val ref = db.collection("banners").add(doc).await()
                                banners = listOf(doc.plus("id" to ref.id)) + banners
                                newImageUrl = ""; newTargetUrl = ""
                            } catch (_: Exception) {}
                            isAdding = false
                        }
                    },
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                ) {
                    if (isAdding) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    else Text("ADD BANNER", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (loading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFFF59E0B))
        } else {
            banners.forEach { b ->
                Card(modifier = Modifier.fillMaxWidth().height(120.dp).padding(bottom = 12.dp), shape = RoundedCornerShape(12.dp)) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AsyncImage(model = b["imageUrl"], contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                        if (userLevel >= 6) {
                            IconButton(
                                onClick = {
                                    scope.launch {
                                        try {
                                            db.collection("banners").document(b["id"] as String).delete().await()
                                            banners = banners.filter { it["id"] != b["id"] }
                                        } catch (_: Exception) {}
                                    }
                                },
                                modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).background(Color.Black.copy(alpha = 0.5f), CircleShape)
                            ) {
                                Icon(Icons.Default.Delete, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
@Composable
fun LevelManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var levels by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    
    var levelNumber by remember { mutableStateOf("") }
    var xpRequired by remember { mutableStateOf("") }
    var iconUrl by remember { mutableStateOf("") }
    var isAdding by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("levels_config").orderBy("level").get().await()
            levels = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Stars, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Level Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (userLevel >= 6) {
            Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Text("ADD / UPDATE LEVEL", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = levelNumber, onValueChange = { levelNumber = it }, placeholder = { Text("Level No") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedTextField(value = xpRequired, onValueChange = { xpRequired = it }, placeholder = { Text("XP Required") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = iconUrl, onValueChange = { iconUrl = it }, placeholder = { Text("Badge Icon URL") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        val lvl = levelNumber.toIntOrNull()
                        val xp = xpRequired.toLongOrNull()
                        if (lvl == null || xp == null || iconUrl.isBlank()) return@Button
                        scope.launch {
                            isAdding = true
                            try {
                                val doc = mapOf("level" to lvl, "xp" to xp, "iconUrl" to iconUrl.trim(), "updatedAt" to Timestamp.now())
                                db.collection("levels_config").document(lvl.toString()).set(doc).await()
                                val snap = db.collection("levels_config").orderBy("level").get().await()
                                levels = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
                                levelNumber = ""; xpRequired = ""; iconUrl = ""
                            } catch (_: Exception) {}
                            isAdding = false
                        }
                    },
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                ) {
                    if (isAdding) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    else Text("SAVE LEVEL", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFFF59E0B))
        else {
            levels.forEach { l ->
                Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = l["iconUrl"], contentDescription = null, modifier = Modifier.size(40.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Level ${l["level"]}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("XP Required: ${l["xp"]}", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                    if (userLevel >= 6) {
                        IconButton(onClick = {
                            scope.launch {
                                try {
                                    db.collection("levels_config").document(l["id"] as String).delete().await()
                                    levels = levels.filter { it["id"] != l["id"] }
                                } catch (_: Exception) {}
                            }
                        }) {
                            Icon(Icons.Default.Delete, null, tint = Color.Red)
                        }
                    }
                }
            }
        }
    }
}
@Composable
fun MedalManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var targetUser by remember { mutableStateOf("") }
    var medalUrl by remember { mutableStateOf("") }
    var medalName by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.MilitaryTech, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Medal Distributer", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = targetUser, onValueChange = { targetUser = it }, label = { Text("User ID (Account No.)") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(value = medalUrl, onValueChange = { medalUrl = it }, label = { Text("Medal Image URL") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(value = medalName, onValueChange = { medalName = it }, label = { Text("Medal Title (e.g. Top Gifter 2026)") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        message?.let {
            Text(it, color = if (it.startsWith("Error")) Color.Red else Color(0xFF10B981), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(10.dp))
        }
        
        Button(
            onClick = {
                if (targetUser.isBlank() || medalUrl.isBlank() || medalName.isBlank() || userLevel < 6) return@Button
                scope.launch {
                    isSending = true
                    try {
                        val snap = db.collection("users").whereEqualTo("accountNumber", targetUser.trim()).limit(1).get().await()
                        if (snap.isEmpty) message = "Error: User not found."
                        else {
                            val uid = snap.documents[0].id
                            db.collection("users").document(uid).collection("medals").add(
                                mapOf("name" to medalName.trim(), "iconUrl" to medalUrl.trim(), "awardedAt" to Timestamp.now())
                            ).await()
                            message = "Success: Medal awarded."
                            targetUser = ""; medalUrl = ""; medalName = ""
                        }
                    } catch (e: Exception) { message = "Error: ${e.message}" }
                    isSending = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6))
        ) {
            if (isSending) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("AWARD MEDAL", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun EmojiManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var emojis by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    
    var emojiKey by remember { mutableStateOf("") }
    var emojiUrl by remember { mutableStateOf("") }
    var isAdding by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("emojis").get().await()
            emojis = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.EmojiEmotions, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Chat Emojis", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (userLevel >= 6) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = emojiKey, onValueChange = { emojiKey = it }, placeholder = { Text("Code e.g. :smile:") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.width(10.dp))
                OutlinedTextField(value = emojiUrl, onValueChange = { emojiUrl = it }, placeholder = { Text("URL") }, modifier = Modifier.weight(2f), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Button(
                    onClick = {
                        if (emojiKey.isBlank() || emojiUrl.isBlank()) return@Button
                        scope.launch {
                            isAdding = true
                            try {
                                val doc = mapOf("code" to emojiKey.trim(), "url" to emojiUrl.trim())
                                val ref = db.collection("emojis").add(doc).await()
                                emojis = listOf(doc.plus("id" to ref.id)) + emojis
                                emojiKey = ""; emojiUrl = ""
                            } catch (_: Exception) {}
                            isAdding = false
                        }
                    },
                    modifier = Modifier.height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E))
                ) {
                    if (isAdding) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    else Text("ADD", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFFF43F5E))
        else {
            emojis.forEach { e ->
                Row(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = e["url"], contentDescription = null, modifier = Modifier.size(32.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(e["code"] as? String ?: "", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    if (userLevel >= 6) {
                        IconButton(onClick = {
                            scope.launch {
                                try {
                                    db.collection("emojis").document(e["id"] as String).delete().await()
                                    emojis = emojis.filter { it["id"] != e["id"] }
                                } catch (_: Exception) {}
                            }
                        }) { Icon(Icons.Default.Delete, null, tint = Color.Red) }
                    }
                }
            }
        }
    }
}

@Composable
fun LoadingScreenTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var gifUrl by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("loading").get().await()
            gifUrl = snap.getString("gifUrl") ?: ""
        } catch (_: Exception) {}
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.HourglassEmpty, null, tint = Color(0xFF6366F1), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Loading Screen", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = gifUrl, onValueChange = { gifUrl = it }, label = { Text("Loading GIF / SVGA URL") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        if (gifUrl.isNotBlank()) {
            Box(modifier = Modifier.size(150.dp).align(Alignment.CenterHorizontally).clip(RoundedCornerShape(16.dp)).background(Color(0xFFF1F5F9))) {
                AsyncImage(model = gifUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = androidx.compose.ui.layout.ContentScale.Fit)
            }
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = {
                if (userLevel < 6) return@Button
                scope.launch {
                    saving = true
                    try { db.collection("system_config").document("loading").set(mapOf("gifUrl" to gifUrl)).await() } catch (_: Exception) {}
                    saving = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
        ) {
            if (saving) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE LOADING SCREEN", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun GameLoadingTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var bgUrl by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("game_loading").get().await()
            bgUrl = snap.getString("bgUrl") ?: ""
        } catch (_: Exception) {}
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.SportsEsports, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Game Splash Transition", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = bgUrl, onValueChange = { bgUrl = it }, label = { Text("Game Loading Background URL") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        if (bgUrl.isNotBlank()) {
            AsyncImage(model = bgUrl, contentDescription = null, modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(12.dp)), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = {
                if (userLevel < 6) return@Button
                scope.launch {
                    saving = true
                    try { db.collection("system_config").document("game_loading").set(mapOf("bgUrl" to bgUrl)).await() } catch (_: Exception) {}
                    saving = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
        ) {
            if (saving) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE TRANSITION SCREEN", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun VisualIdentityTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var primaryColor by remember { mutableStateOf("#7C3AED") }
    var secondaryColor by remember { mutableStateOf("#F59E0B") }
    var saving by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("visual").get().await()
            primaryColor = snap.getString("primaryColor") ?: "#7C3AED"
            secondaryColor = snap.getString("secondaryColor") ?: "#F59E0B"
        } catch (_: Exception) {}
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Palette, null, tint = Color(0xFFEC4899), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Visual Identity", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = primaryColor, onValueChange = { primaryColor = it }, label = { Text("Primary Hex Color") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(value = secondaryColor, onValueChange = { secondaryColor = it }, label = { Text("Secondary Hex Color") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = {
                if (userLevel < 6) return@Button
                scope.launch {
                    saving = true
                    try { db.collection("system_config").document("visual").set(mapOf("primaryColor" to primaryColor, "secondaryColor" to secondaryColor)).await() } catch (_: Exception) {}
                    saving = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899))
        ) {
            if (saving) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE THEME COLORS", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun SplashScreenTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var bgUrl by remember { mutableStateOf("") }
    var logoUrl by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("splash").get().await()
            bgUrl = snap.getString("bgUrl") ?: ""
            logoUrl = snap.getString("logoUrl") ?: ""
        } catch (_: Exception) {}
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PhoneAndroid, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Splash Screen", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = bgUrl, onValueChange = { bgUrl = it }, label = { Text("Background Image URL") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(value = logoUrl, onValueChange = { logoUrl = it }, label = { Text("Center Logo URL (Optional)") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        if (bgUrl.isNotBlank()) {
            Box(modifier = Modifier.fillMaxWidth().height(300.dp).clip(RoundedCornerShape(16.dp)).background(Color.Black)) {
                AsyncImage(model = bgUrl, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                if (logoUrl.isNotBlank()) {
                    AsyncImage(model = logoUrl, contentDescription = null, modifier = Modifier.align(Alignment.Center).size(100.dp))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        Button(
            onClick = {
                if (userLevel < 6) return@Button
                scope.launch {
                    saving = true
                    try { db.collection("system_config").document("splash").set(mapOf("bgUrl" to bgUrl, "logoUrl" to logoUrl)).await() } catch (_: Exception) {}
                    saving = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
        ) {
            if (saving) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE SPLASH SCREEN", fontWeight = FontWeight.Bold)
        }
    }
}
@Composable
fun RankingThemesTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var bgUrl by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("rankingTheme").get().await()
            bgUrl = snap.getString("headerBgUrl") ?: ""
        } catch (_: Exception) {}
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Leaderboard, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Ranking Themes", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = bgUrl, onValueChange = { bgUrl = it }, label = { Text("Leaderboard Header BG URL") }, modifier = Modifier.fillMaxWidth())
        
        Spacer(modifier = Modifier.height(20.dp))
        if (bgUrl.isNotBlank()) {
            AsyncImage(model = bgUrl, contentDescription = null, modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(12.dp)), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        message?.let {
            Text(it, color = Color(0xFF10B981), fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(10.dp))
        }
        
        Button(
            onClick = {
                if (userLevel < 6) return@Button
                scope.launch {
                    saving = true
                    try { 
                        db.collection("system_config").document("rankingTheme").set(mapOf("headerBgUrl" to bgUrl)).await() 
                        message = "Saved successfully."
                    } catch (_: Exception) {}
                    saving = false
                }
            },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
        ) {
            if (saving) CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            else Text("SAVE HEADER THEME", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun BoutiqueHubTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var items by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    
    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var imageUrl by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("Frame") } // Frame, Bubble, Entrance
    var isAdding by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("store_items").get().await()
            items = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Storefront, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Boutique Hub", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (userLevel >= 6) {
            Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Text("ADD NEW ITEM", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, placeholder = { Text("Item Name") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = price, onValueChange = { price = it }, placeholder = { Text("Coin Price") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedTextField(value = type, onValueChange = { type = it }, placeholder = { Text("Type (Frame/Bubble/Entrance)") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = imageUrl, onValueChange = { imageUrl = it }, placeholder = { Text("Asset URL (PNG/SVGA)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        val p = price.toLongOrNull()
                        if (name.isBlank() || p == null || imageUrl.isBlank()) return@Button
                        scope.launch {
                            isAdding = true
                            try {
                                val doc = mapOf("name" to name.trim(), "price" to p, "type" to type.trim(), "imageUrl" to imageUrl.trim(), "createdAt" to Timestamp.now())
                                val ref = db.collection("store_items").add(doc).await()
                                items = listOf(doc.plus("id" to ref.id)) + items
                                name = ""; price = ""; imageUrl = ""
                            } catch (_: Exception) {}
                            isAdding = false
                        }
                    },
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6))
                ) {
                    if (isAdding) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    else Text("ADD ITEM", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFF8B5CF6))
        else {
            items.forEach { i ->
                Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = i["imageUrl"], contentDescription = null, modifier = Modifier.size(40.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(i["name"] as? String ?: "", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${i["type"]} | ${i["price"]} Coins", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                    if (userLevel >= 6) {
                        IconButton(onClick = {
                            scope.launch {
                                try {
                                    db.collection("store_items").document(i["id"] as String).delete().await()
                                    items = items.filter { it["id"] != i["id"] }
                                } catch (_: Exception) {}
                            }
                        }) { Icon(Icons.Default.Delete, null, tint = Color.Red) }
                    }
                }
            }
        }
    }
}
@Composable
fun GiftManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var gifts by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    
    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Classic") }
    var iconUrl by remember { mutableStateOf("") }
    var animUrl by remember { mutableStateOf("") }
    var isAdding by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("gifts").orderBy("price").get().await()
            gifts = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CardGiftcard, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Gift Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (userLevel >= 6) {
            Column(modifier = Modifier.fillMaxWidth().background(Color(0xFFF8FAFC), RoundedCornerShape(12.dp)).padding(16.dp)) {
                Text("ADD NEW GIFT", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFF94A3B8))
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, placeholder = { Text("Gift Name") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = price, onValueChange = { price = it }, placeholder = { Text("Coin Price") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedTextField(value = category, onValueChange = { category = it }, placeholder = { Text("Category (Classic/Luxury)") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = iconUrl, onValueChange = { iconUrl = it }, placeholder = { Text("Static Icon URL (PNG)") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(value = animUrl, onValueChange = { animUrl = it }, placeholder = { Text("Animation URL (SVGA) - Optional") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        val p = price.toLongOrNull()
                        if (name.isBlank() || p == null || iconUrl.isBlank()) return@Button
                        scope.launch {
                            isAdding = true
                            try {
                                val doc = mapOf("name" to name.trim(), "price" to p, "category" to category.trim(), "iconUrl" to iconUrl.trim(), "animUrl" to animUrl.trim(), "createdAt" to Timestamp.now())
                                val ref = db.collection("gifts").add(doc).await()
                                gifts = (listOf(doc.plus("id" to ref.id)) + gifts).sortedBy { it["price"] as? Long ?: 0 }
                                name = ""; price = ""; iconUrl = ""; animUrl = ""
                            } catch (_: Exception) {}
                            isAdding = false
                        }
                    },
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    if (isAdding) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    else Text("ADD GIFT", fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        if (loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFF10B981))
        else {
            gifts.forEach { g ->
                Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = g["iconUrl"], contentDescription = null, modifier = Modifier.size(40.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(g["name"] as? String ?: "", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${g["category"]} | ${g["price"]} Coins", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                    if (userLevel >= 6) {
                        IconButton(onClick = {
                            scope.launch {
                                try {
                                    db.collection("gifts").document(g["id"] as String).delete().await()
                                    gifts = gifts.filter { it["id"] != g["id"] }
                                } catch (_: Exception) {}
                            }
                        }) { Icon(Icons.Default.Delete, null, tint = Color.Red) }
                    }
                }
            }
        }
    }
}
@Composable
fun CustomGiftsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var requests by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("custom_gift_requests").whereEqualTo("status", "pending").get().await()
            requests = snap.documents.map { (it.data ?: emptyMap()).plus("id" to it.id) }
        } catch (_: Exception) {}
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Diamond, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("SVIP Custom Gifts", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (loading) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally), color = Color(0xFFF43F5E))
        else {
            if (requests.isEmpty()) {
                Text("No pending requests.", color = Color.Gray, modifier = Modifier.align(Alignment.CenterHorizontally))
            }
            requests.forEach { r ->
                Column(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(16.dp)) {
                    Text("User ID: ${r["userId"]}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Requested Name: ${r["giftName"]}", fontSize = 14.sp)
                    Text("Price Suggestion: ${r["price"]} Coins", fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (userLevel >= 6) {
                        Row {
                            Button(onClick = {
                                scope.launch {
                                    try {
                                        db.collection("custom_gift_requests").document(r["id"] as String).update("status", "approved").await()
                                        requests = requests.filter { it["id"] != r["id"] }
                                    } catch (_: Exception) {}
                                }
                            }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)), modifier = Modifier.weight(1f)) {
                                Text("APPROVE", fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Button(onClick = {
                                scope.launch {
                                    try {
                                        db.collection("custom_gift_requests").document(r["id"] as String).update("status", "rejected").await()
                                        requests = requests.filter { it["id"] != r["id"] }
                                    } catch (_: Exception) {}
                                }
                            }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)), modifier = Modifier.weight(1f)) {
                                Text("REJECT", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
