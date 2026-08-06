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

// ─── Authority Hub ───────────────────────────────────────────────────────────

@Composable
fun AuthorityHubTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var selectedUser by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("Admin") }
    var success by remember { mutableStateOf<String?>(null) }
    val roles = listOf("Admin", "Super Admin", "Manager", "Auditor", "CS Leader", "Customer Service")

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.FlashOn, null, tint = Color(0xFFA855F7), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Authority Hub", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(20.dp))

        Text("Assign Authority Role", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(value = selectedUser, onValueChange = { selectedUser = it }, label = { Text("User UID") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
        Spacer(modifier = Modifier.height(12.dp))

        Text("Select Role", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF64748B))
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            roles.take(3).forEach { role ->
                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(if (selectedRole == role) Color(0xFF7C3AED) else Color(0xFFF1F5F9)).clickable { selectedRole = role }.padding(horizontal = 12.dp, vertical = 8.dp)) {
                    Text(role, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (selectedRole == role) Color.White else Color(0xFF64748B))
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            roles.drop(3).forEach { role ->
                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(if (selectedRole == role) Color(0xFF7C3AED) else Color(0xFFF1F5F9)).clickable { selectedRole = role }.padding(horizontal = 12.dp, vertical = 8.dp)) {
                    Text(role, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (selectedRole == role) Color.White else Color(0xFF64748B))
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF7C3AED)).clickable {
            if (selectedUser.isNotBlank()) {
                scope.launch {
                    try {
                        db.collection("users").document(selectedUser.trim()).update("tags", com.google.firebase.firestore.FieldValue.arrayUnion(selectedRole)).await()
                        success = "Role $selectedRole assigned to $selectedUser!"
                        selectedUser = ""
                    } catch (e: Exception) { success = "Error: ${e.message}" }
                }
            }
        }.padding(14.dp), contentAlignment = Alignment.Center) {
            Text("Assign Authority", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        success?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(top = 12.dp), fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}

// ─── VIP Management ──────────────────────────────────────────────────────────

@Composable
fun VipManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var vipUsers by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var newVip by remember { mutableStateOf("") }
    var success by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("vip_users").get().await()
            vipUsers = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFFEAB308), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("VIP Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        Text("Add VIP User", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = newVip, onValueChange = { newVip = it }, label = { Text("User UID") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFFEAB308)).clickable {
                if (newVip.isNotBlank()) {
                    scope.launch {
                        try {
                            db.collection("vip_users").add(mapOf("uid" to newVip.trim(), "addedAt" to com.google.firebase.Timestamp.now())).await()
                            success = "$newVip added as VIP!"
                            newVip = ""
                            val snap = db.collection("vip_users").get().await()
                            vipUsers = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
                        } catch (e: Exception) { success = "Error: ${e.message}" }
                    }
                }
            }.padding(14.dp)) { Text("Add VIP", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Current VIPs (${vipUsers.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            vipUsers.forEach { vip ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFFEAB308), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(vip["uid"] as? String ?: "Unknown", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                            scope.launch {
                                db.collection("vip_users").document(vip["docId"] as String).delete().await()
                                vipUsers = vipUsers.filter { it["docId"] != vip["docId"] }
                                success = "VIP removed!"
                            }
                        }.padding(horizontal = 12.dp, vertical = 6.dp)) { Text("Remove", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
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

// ─── CP Management ───────────────────────────────────────────────────────────

@Composable
fun CpManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var cpList by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("cp_config").get().await()
            cpList = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Favorite, null, tint = Color(0xFFDB2777), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("CP Backgrounds", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            cpList.forEach { cp ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(cp["name"] as? String ?: "Background", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("ID: ${cp["id"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                        Text("Price: ${cp["price"] ?: 0} coins", fontSize = 12.sp, color = Color(0xFF22C55E))
                    }
                }
            }
            if (cpList.isEmpty()) Text("No CP backgrounds configured", color = Color(0xFF94A3B8))
        }
    }
}

// ─── Family Management ───────────────────────────────────────────────────────

@Composable
fun FamilyManagementTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var families by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("families").get().await()
            families = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Groups, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Family Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            families.forEach { fam ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFDCFCE7)), contentAlignment = Alignment.Center) {
                            Text((fam["name"] as? String ?: "?").take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(fam["name"] as? String ?: "Family", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Members: ${fam["memberCount"] ?: 0}", fontSize = 12.sp, color = Color(0xFF64748B))
                        }
                    }
                }
            }
            if (families.isEmpty()) Text("No families found", color = Color(0xFF94A3B8))
        }
    }
}

// ─── Pin Control ─────────────────────────────────────────────────────────────

@Composable
fun PinControlTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var pins by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("pinned_messages").get().await()
            pins = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PushPin, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Pin Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            pins.forEach { pin ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.PushPin, null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(pin["message"] as? String ?: "Pinned", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Room: ${pin["roomId"] ?: "N/A"}", fontSize = 11.sp, color = Color(0xFF64748B))
                        }
                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                            scope.launch {
                                db.collection("pinned_messages").document(pin["docId"] as String).delete().await()
                                pins = pins.filter { it["docId"] != pin["docId"] }
                            }
                        }.padding(horizontal = 10.dp, vertical = 6.dp)) { Text("Unpin", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }
}

// ─── Tags Management ─────────────────────────────────────────────────────────

@Composable
fun TagsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var tags by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var newTag by remember { mutableStateOf("") }
    var success by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("tags").get().await()
            tags = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Badge, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Assign Tags", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))

        Text("Create New Tag", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(value = newTag, onValueChange = { newTag = it }, label = { Text("Tag Name") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Box(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0xFF7C3AED)).clickable {
                if (newTag.isNotBlank()) {
                    scope.launch {
                        try {
                            db.collection("tags").add(mapOf("name" to newTag.trim(), "createdAt" to com.google.firebase.Timestamp.now())).await()
                            success = "Tag '$newTag' created!"
                            newTag = ""
                            val snap = db.collection("tags").get().await()
                            tags = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
                        } catch (e: Exception) { success = "Error: ${e.message}" }
                    }
                }
            }.padding(14.dp)) { Text("Create", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Existing Tags (${tags.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
        Spacer(modifier = Modifier.height(8.dp))

        if (isLoading) {
            CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.align(Alignment.CenterHorizontally))
        } else {
            tags.forEach { tag ->
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Badge, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(tag["name"] as? String ?: "Tag", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                            scope.launch {
                                db.collection("tags").document(tag["docId"] as String).delete().await()
                                tags = tags.filter { it["docId"] != tag["docId"] }
                                success = "Tag deleted!"
                            }
                        }.padding(horizontal = 10.dp, vertical = 6.dp)) { Text("Delete", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
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
