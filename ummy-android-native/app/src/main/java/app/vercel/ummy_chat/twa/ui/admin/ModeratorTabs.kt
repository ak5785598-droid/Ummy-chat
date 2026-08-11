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

// ─── ID Ban Control ──────────────────────────────────────────────────────────

@Composable
fun IdBanTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }
    var banInput by remember { mutableStateOf("") }
    var banDays by remember { mutableStateOf("0") }
    var banHours by remember { mutableStateOf("0") }
    var banMinutes by remember { mutableStateOf("0") }
    var foundUser by remember { mutableStateOf<Map<String, Any>?>(null) }
    var foundUserId by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Gavel, null, tint = Color(0xFFEF4444), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("ID Ban Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))
        
        Text("TARGET ID", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = banInput,
                onValueChange = { banInput = it },
                placeholder = { Text("e.g. 100023 or UID") },
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF7C3AED))
                    .clickable {
                        if (banInput.isBlank()) return@clickable
                        isLoading = true
                        foundUser = null
                        foundUserId = null
                        message = null
                        scope.launch {
                            try {
                                val input = banInput.trim()
                                // Try accountNumber
                                var snap = db.collection("users").whereEqualTo("accountNumber", input).limit(1).get().await()
                                if (snap.isEmpty) {
                                    // Try displayId
                                    snap = db.collection("users").whereEqualTo("activeIdBadge.displayId", input).limit(1).get().await()
                                }
                                if (!snap.isEmpty) {
                                    val doc = snap.documents[0]
                                    foundUser = doc.data
                                    foundUserId = doc.id
                                } else {
                                    // Try direct doc ID
                                    val docSnap = db.collection("users").document(input).get().await()
                                    if (docSnap.exists()) {
                                        foundUser = docSnap.data
                                        foundUserId = docSnap.id
                                    } else {
                                        message = "Error: No user matches this ID or UID."
                                    }
                                }
                            } catch (e: Exception) {
                                message = "Error: ${e.message}"
                            }
                            isLoading = false
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Search, null, tint = Color.White)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        foundUser?.let { user ->
            val uid = foundUserId ?: ""
            val name = user["username"] as? String ?: "Unknown"
            val displayId = (user["activeIdBadge"] as? Map<*, *>)?.get("displayId") as? String 
                            ?: user["accountNumber"]?.toString() ?: uid
            @Suppress("UNCHECKED_CAST")
            val tags = user["tags"] as? List<String> ?: emptyList()
            val isAdmin = user["isAdmin"] as? Boolean ?: false
            val targetLevel = getUserLevel(tags, isAdmin, uid)
            
            val currentBanStatus = user["banStatus"] as? Map<*, *>
            val isBanned = currentBanStatus?.get("isBanned") as? Boolean ?: false
            
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("User Found", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(name, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
                    Text("ID: $displayId", fontSize = 14.sp, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(8.dp))
                    if (isBanned) {
                        Text("Status: BANNED", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                    } else {
                        Text("Status: ACTIVE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF22C55E))
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Text("DURATION (0 FOR PERMANENT)", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.height(6.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(value = banDays, onValueChange = { banDays = it }, label = { Text("Days") }, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(value = banHours, onValueChange = { banHours = it }, label = { Text("Hours") }, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(value = banMinutes, onValueChange = { banMinutes = it }, label = { Text("Mins") }, modifier = Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp)).background(Color(0xFFEF4444)).clickable {
                        if (userLevel < 3) { message = "Error: Banning features are restricted to Admins and above."; return@clickable }
                        if (userLevel <= targetLevel) { message = "Error: Aap apne se barabar ya upar ke rank wale user ko ban nahi kar sakte."; return@clickable }
                        
                        val days = banDays.toLongOrNull() ?: 0L
                        val hours = banHours.toLongOrNull() ?: 0L
                        val mins = banMinutes.toLongOrNull() ?: 0L
                        val totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (mins * 60 * 1000)
                        
                        val bannedUntil = if (totalMs == 0L) null else com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis() + totalMs))
                        
                        val banStatusMap = mapOf(
                            "isBanned" to true,
                            "bannedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp(),
                            "bannedUntil" to bannedUntil,
                            "reason" to "Administrative Exclusion"
                        )
                        
                        scope.launch {
                            try {
                                db.collection("users").document(uid).update("banStatus", banStatusMap).await()
                                try {
                                    db.collection("users").document(uid).collection("profile").document(uid).update("banStatus", banStatusMap).await()
                                } catch (e: Exception) {}
                                
                                val updatedUser = foundUser!!.toMutableMap()
                                updatedUser["banStatus"] = banStatusMap
                                foundUser = updatedUser
                                message = "Success: User banned successfully."
                            } catch (e: Exception) {
                                message = "Error: ${e.message}"
                            }
                        }
                    }.padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("BAN USER", color = Color.White, fontWeight = FontWeight.Bold)
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Box(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp)).background(Color(0xFFE2E8F0)).clickable {
                        if (userLevel < 3) { message = "Error: Unbanning features are restricted to Admins and above."; return@clickable }
                        if (userLevel <= targetLevel) { message = "Error: Aap apne se barabar ya upar ke rank wale user ko unban nahi kar sakte."; return@clickable }
                        
                        val banStatusMap = mapOf(
                            "isBanned" to false,
                            "bannedAt" to null,
                            "bannedUntil" to null,
                            "reason" to null
                        )
                        
                        scope.launch {
                            try {
                                db.collection("users").document(uid).update("banStatus", banStatusMap).await()
                                try {
                                    db.collection("users").document(uid).collection("profile").document(uid).update("banStatus", banStatusMap).await()
                                } catch (e: Exception) {}
                                
                                val updatedUser = foundUser!!.toMutableMap()
                                updatedUser["banStatus"] = banStatusMap
                                foundUser = updatedUser
                                message = "Success: User unbanned successfully."
                            } catch (e: Exception) {
                                message = "Error: ${e.message}"
                            }
                        }
                    }.padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("UNBAN", color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
                }
            }
        }
        
        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(
                text = it,
                color = if (isError) Color(0xFFEF4444) else Color(0xFF22C55E),
                modifier = Modifier.padding(top = 16.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}

// ─── Moderation Reports ──────────────────────────────────────────────────────

@Composable
fun ModerationReportsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var reports by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf<String?>(null) }

    DisposableEffect(Unit) {
        val listener = db.collection("reports")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    message = "Error: ${error.message}"
                    isLoading = false
                    return@addSnapshotListener
                }
                if (snap != null) {
                    reports = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
                }
                isLoading = false
            }
        onDispose { listener.remove() }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Shield, null, tint = Color(0xFFEF4444), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Moderation Reports", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFFEF4444))
            }
        } else if (reports.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No pending reports", color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
            }
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                reports.forEach { report ->
                    val reportId = report["id"] as? String ?: return@forEach
                    val targetId = report["targetId"] as? String ?: ""
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, null, tint = Color(0xFFEF4444), modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(report["type"] as? String ?: "Report", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1E293B))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Reporter: ${report["reporterName"] ?: "Unknown"}", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("Target ID: $targetId", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("Reason: ${report["reason"] ?: "N/A"}", fontSize = 14.sp, color = Color(0xFF334155), modifier = Modifier.padding(vertical = 4.dp))
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFE2E8F0))
                                        .clickable {
                                            if (userLevel < 3) {
                                                message = "Error: Unauthorized."
                                                return@clickable
                                            }
                                            scope.launch {
                                                try {
                                                    db.collection("reports").document(reportId).delete().await()
                                                    message = "Success: Report dismissed."
                                                } catch (e: Exception) {
                                                    message = "Error: ${e.message}"
                                                }
                                            }
                                        }
                                        .padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Text("Dismiss", color = Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFEF4444))
                                        .clickable {
                                            if (userLevel < 3) {
                                                message = "Error: Unauthorized."
                                                return@clickable
                                            }
                                            if (targetId.isNotEmpty()) {
                                                scope.launch {
                                                    try {
                                                        db.collection("moments").document(targetId).delete().await()
                                                        db.collection("reports").document(reportId).delete().await()
                                                        message = "Success: Content deleted."
                                                    } catch (e: Exception) {
                                                        message = "Error: ${e.message}"
                                                    }
                                                }
                                            }
                                        }
                                        .padding(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Text("DELETE CONTENT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(
                text = it,
                color = if (isError) Color(0xFFEF4444) else Color(0xFF22C55E),
                modifier = Modifier.padding(top = 16.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}

// ─── Member Directory ────────────────────────────────────────────────────────

@Composable
fun MemberDirectoryTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var members by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var search by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("users").limit(200).get().await()
            members = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    val filtered = members.filter {
        val name = (it["name"] as? String ?: "").lowercase()
        val id = (it["uid"] as? String ?: "").lowercase()
        name.contains(search.lowercase()) || id.contains(search.lowercase())
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Groups, null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Member Directory", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = search, onValueChange = { search = it }, label = { Text("Search by name or UID...") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), leadingIcon = { Icon(Icons.Default.Search, null) })
        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            Text("Showing ${filtered.size} members", fontSize = 12.sp, color = Color(0xFF64748B))
            Spacer(modifier = Modifier.height(8.dp))
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                filtered.forEach { m ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(20.dp)).background(Color(0xFFE0E7FF)), contentAlignment = Alignment.Center) {
                                Text((m["name"] as? String ?: "?").take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF6366F1))
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(m["name"] as? String ?: "Unknown", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("ID: ${m["uid"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                @Suppress("UNCHECKED_CAST")
                                val tags = (m["tags"] as? List<String>) ?: emptyList()
                                tags.take(2).forEach { tag ->
                                    Text(tag, fontSize = 10.sp, color = Color(0xFF7C3AED), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── User Records ────────────────────────────────────────────────────────────

@Composable
fun UserRecordsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var searchMode by remember { mutableStateOf("id") } // "id" or "name"
    var searchValue by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var targetUser by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isPurging by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PersonSearch, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("User Ledger", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B), textDecoration = androidx.compose.ui.text.style.TextDecoration.None)
        }
        Spacer(modifier = Modifier.height(16.dp))

        // Mode Selector
        Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp)).padding(4.dp)) {
            Box(
                modifier = Modifier.weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (searchMode == "id") Color.White else Color.Transparent)
                    .clickable { searchMode = "id" }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Search by ID", fontWeight = FontWeight.Bold, color = if (searchMode == "id") Color(0xFF1E293B) else Color(0xFF64748B), fontSize = 12.sp)
            }
            Box(
                modifier = Modifier.weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (searchMode == "name") Color.White else Color.Transparent)
                    .clickable { searchMode = "name" }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Search by Name", fontWeight = FontWeight.Bold, color = if (searchMode == "name") Color(0xFF1E293B) else Color(0xFF64748B), fontSize = 12.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = searchValue,
                onValueChange = { searchValue = it },
                placeholder = { Text(if (searchMode == "id") "Enter Account No. or Display ID" else "Enter Exact Username") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFF43F5E),
                    unfocusedBorderColor = Color(0xFFE2E8F0)
                )
            )
            Spacer(modifier = Modifier.width(12.dp))
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF43F5E))
                    .clickable(enabled = !isSearching) {
                        if (searchValue.isBlank()) return@clickable
                        isSearching = true
                        targetUser = null
                        scope.launch {
                            try {
                                val input = searchValue.trim()
                                var found: MutableMap<String, Any?>? = null

                                if (searchMode == "id") {
                                    val snap = db.collection("users").whereEqualTo("accountNumber", input).limit(1).get().await()
                                    if (!snap.isEmpty) {
                                        found = snap.documents[0].data?.toMutableMap()
                                        found?.put("id", snap.documents[0].id)
                                    } else {
                                        val fallbackSnap = db.collection("users").whereEqualTo("activeIdBadge.displayId", input).limit(1).get().await()
                                        if (!fallbackSnap.isEmpty) {
                                            found = fallbackSnap.documents[0].data?.toMutableMap()
                                            found?.put("id", fallbackSnap.documents[0].id)
                                        }
                                    }
                                } else {
                                    val snap = db.collection("users")
                                        .whereGreaterThanOrEqualTo("username", input)
                                        .whereLessThanOrEqualTo("username", input + "\uf8ff")
                                        .limit(1).get().await()
                                    if (!snap.isEmpty) {
                                        found = snap.documents[0].data?.toMutableMap()
                                        found?.put("id", snap.documents[0].id)
                                    }
                                }

                                if (found != null) {
                                    val uid = found["id"] as String
                                    val pSnap = db.collection("users").document(uid).collection("profile").document(uid).get().await()
                                    if (pSnap.exists()) {
                                        pSnap.data?.let { found!!.putAll(it) }
                                    }
                                    targetUser = found
                                } else {
                                    message = "Error: No user found with the given credentials."
                                }
                            } catch (e: Exception) {
                                message = "Error: ${e.message}"
                            }
                            isSearching = false
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isSearching) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Search, null, tint = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        targetUser?.let { user ->
            val uid = user["id"] as? String ?: ""
            val wallet = user["wallet"] as? Map<*, *>
            val coins = (wallet?.get("coins") as? Number)?.toLong() ?: 0L
            val diamonds = (wallet?.get("diamonds") as? Number)?.toLong() ?: 0L
            
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("USER LEDGER", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(user["username"] as? String ?: "Unknown", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
                        Text("ID: ${user["accountNumber"] ?: "N/A"}", fontSize = 13.sp, color = Color(0xFF64748B))
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("COINS", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                                Text(coins.toString(), fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFFEAB308))
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("DIAMONDS", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                                Text(diamonds.toString(), fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF3B82F6))
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFEF4444))
                                .clickable(enabled = !isPurging) {
                                    if (userLevel < 5) {
                                        message = "Error: Unauthorized. Level 5+ required."
                                        return@clickable
                                    }
                                    isPurging = true
                                    scope.launch {
                                        try {
                                            val pRef = db.collection("users").document(uid).collection("profile").document(uid)
                                            val resetData = mapOf(
                                                "wallet.coins" to 0,
                                                "wallet.diamonds" to 0,
                                                "wallet.totalSpent" to 0,
                                                "wallet.dailySpent" to 0,
                                                "wallet.weeklySpent" to 0,
                                                "wallet.monthlySpent" to 0,
                                                "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                                            )
                                            
                                            db.runBatch { batch ->
                                                batch.update(pRef, resetData)
                                            }.await()
                                            
                                            val updatedUser = targetUser!!.toMutableMap()
                                            updatedUser["wallet"] = mapOf("coins" to 0, "diamonds" to 0, "totalSpent" to 0, "dailySpent" to 0, "weeklySpent" to 0, "monthlySpent" to 0)
                                            targetUser = updatedUser
                                            
                                            message = "Success: Wallet successfully purged to 0."
                                        } catch (e: Exception) {
                                            message = "Error: ${e.message}"
                                        }
                                        isPurging = false
                                    }
                                }
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isPurging) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Text("WALLET PURGE (RESET TO 0)", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
        
        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(
                text = it,
                color = if (isError) Color(0xFFEF4444) else Color(0xFF22C55E),
                modifier = Modifier.padding(top = 16.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}
