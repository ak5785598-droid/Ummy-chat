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
fun IdBanTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var bannedUsers by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var banInput by remember { mutableStateOf("") }
    var banReason by remember { mutableStateOf("") }
    var success by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("bans").get().await()
            bannedUsers = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Gavel, null, tint = Color(0xFFEF4444), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("ID Ban Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(value = banInput, onValueChange = { banInput = it }, label = { Text("User ID to Ban") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = banReason, onValueChange = { banReason = it }, label = { Text("Ban Reason") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
        Spacer(modifier = Modifier.height(12.dp))

        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFEF4444)).clickable {
            if (banInput.isNotBlank()) {
                scope.launch {
                    try {
                        db.collection("bans").add(mapOf("uid" to banInput.trim(), "reason" to banReason, "bannedAt" to com.google.firebase.Timestamp.now())).await()
                        success = "User $banInput banned!"
                        banInput = ""; banReason = ""
                        val snap = db.collection("bans").get().await()
                        bannedUsers = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
                    } catch (e: Exception) { success = "Error: ${e.message}" }
                }
            }
        }.padding(14.dp), contentAlignment = Alignment.Center) {
            Text("Ban User", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        Spacer(modifier = Modifier.height(16.dp))
        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            Text("Banned Users (${bannedUsers.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
            Spacer(modifier = Modifier.height(8.dp))
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                bannedUsers.forEach { user ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Block, null, tint = Color(0xFFEF4444), modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(user["uid"] as? String ?: "Unknown", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Reason: ${user["reason"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                            }
                            Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFF22C55E)).clickable {
                                scope.launch {
                                    db.collection("bans").document(user["docId"] as String).delete().await()
                                    bannedUsers = bannedUsers.filter { it["docId"] != user["docId"] }
                                    success = "Unbanned!"
                                }
                            }.padding(horizontal = 12.dp, vertical = 6.dp)) {
                                Text("Unban", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }

        success?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(top = 12.dp), fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

// ─── Moderation Reports ──────────────────────────────────────────────────────

@Composable
fun ModerationReportsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var reports by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("reports").get().await()
            reports = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Shield, null, tint = Color(0xFFEF4444), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Moderation Reports", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else if (reports.isEmpty()) {
            Text("No pending reports", color = Color(0xFF94A3B8), modifier = Modifier.padding(top = 32.dp))
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                reports.forEach { report ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(report["type"] as? String ?: "Report", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.weight(1f))
                                Text(report["status"] as? String ?: "pending", fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Reporter: ${report["reporterName"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("Target: ${report["targetName"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("Reason: ${report["reason"] ?: ""}", fontSize = 12.sp, color = Color(0xFF475569))
                        }
                    }
                }
            }
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
fun UserRecordsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var records by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var search by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("user_reports").get().await()
            records = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PersonSearch, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("User Records", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(value = search, onValueChange = { search = it }, label = { Text("Search records...") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), leadingIcon = { Icon(Icons.Default.Search, null) })
        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                records.forEach { rec ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(rec["userName"] as? String ?: "Unknown", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Action: ${rec["action"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("Detail: ${rec["detail"] ?: ""}", fontSize = 12.sp, color = Color(0xFF475569))
                        }
                    }
                }
                if (records.isEmpty()) Text("No records found", color = Color(0xFF94A3B8))
            }
        }
    }
}
