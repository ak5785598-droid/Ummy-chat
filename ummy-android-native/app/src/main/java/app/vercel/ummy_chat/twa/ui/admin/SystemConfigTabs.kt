package app.vercel.ummy_chat.twa.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

// ─── Broadcaster System ──────────────────────────────────────────────────────

@Composable
fun BroadcasterTab(onBack: () -> Unit) {
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

// ─── Loot Config ─────────────────────────────────────────────────────────────

@Composable
fun LootConfigTab(onBack: () -> Unit) {
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

// ─── Rewards Center ──────────────────────────────────────────────────────────

@Composable
fun RewardsCenterTab(onBack: () -> Unit) {
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

// ─── Direct Messenger ────────────────────────────────────────────────────────

@Composable
fun DirectMessengerTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var targetUid by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var success by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Mail, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Direct Messenger", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = targetUid, onValueChange = { targetUid = it }, label = { Text("Target User UID") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = message, onValueChange = { message = it }, label = { Text("Message...") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 3)
        Spacer(modifier = Modifier.height(12.dp))

        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF3B82F6)).clickable(enabled = targetUid.isNotBlank() && message.isNotBlank()) {
            scope.launch {
                try {
                    db.collection("direct_messages").add(mapOf("to" to targetUid.trim(), "message" to message.trim(), "sentAt" to com.google.firebase.Timestamp.now(), "from" to "admin")).await()
                    success = "Message sent to $targetUid!"
                    targetUid = ""; message = ""
                } catch (e: Exception) { success = "Error: ${e.message}" }
            }
        }.padding(14.dp), contentAlignment = Alignment.Center) {
            Text("Send Direct Message", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        success?.let { LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }; Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(top = 12.dp), fontWeight = FontWeight.Bold, fontSize = 13.sp) }
    }
}

// ─── Banners ─────────────────────────────────────────────────────────────────

@Composable
fun BannersTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var banners by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("banners").get().await()
            banners = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Image, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Banners", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            banners.forEach { b ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(b["title"] as? String ?: "Banner", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("URL: ${b["imageUrl"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                        Text("Active: ${b["active"] ?: false}", fontSize = 12.sp, color = if (b["active"] == true) Color(0xFF22C55E) else Color(0xFFEF4444))
                    }
                }
            }
        }
    }
}

// ─── Sovereign IDs ───────────────────────────────────────────────────────────

@Composable
fun SovereignIdsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var sovereigns by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("sovereign_ids").get().await()
            sovereigns = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Sovereign IDs", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            sovereigns.forEach { s ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(s["userName"] as? String ?: "User", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("ID: ${s["uid"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                    }
                }
            }
        }
    }
}

// ─── Level Management ────────────────────────────────────────────────────────

@Composable
fun LevelManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var levels by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("levels_config").get().await()
            levels = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFF06B6D4), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Level Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            levels.forEach { l ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Lvl ${l["level"] ?: "?"}", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF06B6D4))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(l["title"] as? String ?: "Level", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("XP: ${l["xpRequired"] ?: 0}", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                    }
                }
            }
        }
    }
}

// ─── Medal Management ────────────────────────────────────────────────────────

@Composable
fun MedalManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var medals by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("medals").get().await()
            medals = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Star, null, tint = Color(0xFFFB923C), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Medal Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            medals.forEach { m ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, null, tint = Color(0xFFFB923C), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(m["name"] as? String ?: "Medal", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("Rarity: ${m["rarity"] ?: "Common"}", fontSize = 11.sp, color = Color(0xFFFB923C))
                    }
                }
            }
        }
    }
}

// ─── Emoji Management ────────────────────────────────────────────────────────

@Composable
fun EmojiManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var emojis by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("emojis").get().await()
            emojis = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.SentimentSatisfied, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Emoji Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            emojis.forEach { e ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(e["emoji"] as? String ?: "?", fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(e["name"] as? String ?: "Emoji", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Price: ${e["price"] ?: 0} coins", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                    }
                }
            }
        }
    }
}

// ─── System Control ──────────────────────────────────────────────────────────

@Composable
fun SystemControlTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var isMaintenance by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("system_config").document("main").get().await()
            isMaintenance = snap.getBoolean("maintenanceMode") ?: false
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Settings, null, tint = Color(0xFF64748B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("System Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            // Maintenance Mode
            Card(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), shape = RoundedCornerShape(12.dp)) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Maintenance Mode", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
                        Text(if (isMaintenance) "Active - App is in maintenance" else "Inactive - App running normally", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                    Switch(checked = isMaintenance, onCheckedChange = { newValue ->
                        isMaintenance = newValue
                        scope.launch {
                            db.collection("system_config").document("main").update("maintenanceMode", newValue).await()
                        }
                    })
                }
            }
        }
    }
}

// ─── Game Sync ───────────────────────────────────────────────────────────────

@Composable
fun GameSyncTab(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Gamepad, null, tint = Color(0xFFA855F7), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Game Sync", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Ludo", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Status: Active | Players: 2-4", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("UNO", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Status: Active | Players: 2-4", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Carrom", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Status: Active | Players: 2", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
    }
}

// ─── Seat Timing Tracker ─────────────────────────────────────────────────────

@Composable
fun SeatTimingTab(onBack: () -> Unit) {
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

// ─── Loading Screen Sync ─────────────────────────────────────────────────────

@Composable
fun LoadingScreenTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var config by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("config").document("loadingScreen").get().await()
            if (snap.exists()) config = snap.data
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Image, null, tint = Color(0xFF4F46E5), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Loading Screen", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Current Config", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Show Loading: ${config?.get("showLoading") ?: true}", fontSize = 13.sp, color = Color(0xFF64748B))
                    Text("Duration: ${config?.get("duration") ?: 3}s", fontSize = 13.sp, color = Color(0xFF64748B))
                }
            }
        }
    }
}

// ─── Game Loading ────────────────────────────────────────────────────────────

@Composable
fun GameLoadingTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var config by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("config").document("gameLoading").get().await()
            if (snap.exists()) config = snap.data
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Gamepad, null, tint = Color(0xFFA855F7), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Game Loading", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Game Loading Config", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Show Animation: ${config?.get("showAnimation") ?: true}", fontSize = 13.sp, color = Color(0xFF64748B))
                }
            }
        }
    }
}

// ─── Visual Identity ─────────────────────────────────────────────────────────

@Composable
fun VisualIdentityTab(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Palette, null, tint = Color(0xFFEC4899), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Visual Identity", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("App Theme", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Primary Color: #7C3AED (Purple)", fontSize = 12.sp, color = Color(0xFF64748B))
                Text("Secondary: #22C55E (Green)", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Fonts", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("Primary: Inter Bold", fontSize = 12.sp, color = Color(0xFF64748B))
                Text("Secondary: Inter Regular", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
    }
}

// ─── Center Management (Assign Center) ───────────────────────────────────────

@Composable
fun AssignCenterTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var centers by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("official_centers").get().await()
            centers = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Shield, null, tint = Color(0xFF6366F1), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Center Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            centers.forEach { c ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(c["name"] as? String ?: "Center", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Type: ${c["type"] ?: "N/A"} | Members: ${c["memberCount"] ?: 0}", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                }
            }
            if (centers.isEmpty()) Text("No centers configured", color = Color(0xFF94A3B8))
        }
    }
}

// ─── Splash Screen & Logo ────────────────────────────────────────────────────

@Composable
fun SplashScreenTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var config by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("config").document("splashScreen").get().await()
            if (snap.exists()) config = snap.data
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Monitor, null, tint = Color(0xFF14B8A6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Splash Screen & Logo", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Splash Screen Config", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Show Logo: ${config?.get("showLogo") ?: true}", fontSize = 13.sp, color = Color(0xFF64748B))
                    Text("Duration: ${config?.get("duration") ?: 2}s", fontSize = 13.sp, color = Color(0xFF64748B))
                    Text("App Name: ${config?.get("appName") ?: "Ummy Chat"}", fontSize = 13.sp, color = Color(0xFF64748B))
                }
            }
        }
    }
}

// ─── Ranking Themes ──────────────────────────────────────────────────────────

@Composable
fun RankingThemesTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var themes by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("ranking_themes").get().await()
            themes = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Star, null, tint = Color(0xFF6366F1), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Ranking Themes", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            themes.forEach { t ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(t["name"] as? String ?: "Theme", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Active: ${t["active"] ?: false}", fontSize = 12.sp, color = if (t["active"] == true) Color(0xFF22C55E) else Color(0xFFEF4444))
                    }
                }
            }
        }
    }
}

// ─── Boutique Hub ────────────────────────────────────────────────────────────

@Composable
fun BoutiqueHubTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var items by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("boutique_items").get().await()
            items = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.ShoppingBag, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Boutique Hub", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            items.forEach { item ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ShoppingBag, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item["name"] as? String ?: "Item", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Price: ${item["price"] ?: 0} | Category: ${item["category"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                    }
                }
            }
        }
    }
}

// ─── Gift Management ─────────────────────────────────────────────────────────

@Composable
fun GiftManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var gifts by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("gifts").get().await()
            gifts = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CardGiftcard, null, tint = Color(0xFFF97316), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Gift Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            gifts.forEach { g ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(g["emoji"] as? String ?: "?", fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(g["name"] as? String ?: "Gift", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Price: ${g["price"] ?: 0} coins", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                            scope.launch {
                                db.collection("gifts").document(g["docId"] as String).delete().await()
                                gifts = gifts.filter { it["docId"] != g["docId"] }
                            }
                        }.padding(horizontal = 10.dp, vertical = 6.dp)) { Text("Del", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }
}

// ─── Custom Gifts ────────────────────────────────────────────────────────────

@Composable
fun CustomGiftsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var customGifts by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("custom_gifts").get().await()
            customGifts = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.AutoAwesome, null, tint = Color(0xFFDB2777), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Customized Gifts", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        else {
            customGifts.forEach { cg ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(cg["name"] as? String ?: "Custom Gift", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Creator: ${cg["creatorName"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                        Text("Price: ${cg["price"] ?: 0} coins", fontSize = 12.sp, color = Color(0xFFDB2777))
                    }
                }
            }
            if (customGifts.isEmpty()) Text("No custom gifts created", color = Color(0xFF94A3B8))
        }
    }
}
