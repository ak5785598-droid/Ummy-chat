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
fun AuthorityHubTab(userLevel: Int, onBack: () -> Unit) {
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
fun VipManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current
    var config by remember { mutableStateOf<MutableMap<String, Any?>>(mutableMapOf("bgType" to "dynamic", "bgUrl" to "", "levels" to mutableMapOf<String, Any?>())) }
    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var isUploading by remember { mutableStateOf(false) }

    DisposableEffect(Unit) {
        val listener = db.document("settings/svipConfig").addSnapshotListener { snap, err ->
            if (err == null && snap != null && snap.exists()) {
                val data = snap.data?.toMutableMap() ?: mutableMapOf()
                config = mutableMapOf(
                    "bgType" to (data["bgType"] ?: "dynamic"),
                    "bgUrl" to (data["bgUrl"] ?: ""),
                    "levels" to (data["levels"] as? MutableMap<String, Any?> ?: mutableMapOf())
                )
            }
            isLoading = false
        }
        onDispose { listener.remove() }
    }

    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null && userLevel >= 6) {
            isUploading = true
            scope.launch {
                try {
                    val storageRef = com.google.firebase.storage.FirebaseStorage.getInstance().reference
                    val fileRef = storageRef.child("settings/vip_bg_${System.currentTimeMillis()}")
                    fileRef.putFile(uri).await()
                    val downloadUrl = fileRef.downloadUrl.await().toString()
                    config = config.toMutableMap().apply { put("bgUrl", downloadUrl) }
                    message = "Success: Background uploaded. Remember to save changes!"
                } catch (e: Exception) {
                    message = "Error: Failed to upload file."
                }
                isUploading = false
            }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFFF59E0B))
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.WorkspacePremium, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("VIP Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(16.dp))
        
        Text("SVIP BACKGROUND", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(8.dp))

        val currentBgType = config["bgType"] as? String ?: "dynamic"
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("dynamic", "image", "video").forEach { type ->
                val active = currentBgType == type
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (active) Color(0xFFF59E0B) else Color(0xFFF1F5F9))
                        .clickable { config = config.toMutableMap().apply { put("bgType", type) } }
                        .padding(10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(type.replaceFirstChar { it.uppercase() }, color = if (active) Color.White else Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        if (currentBgType == "image" || currentBgType == "video") {
            val bgUrl = config["bgUrl"] as? String ?: ""
            OutlinedTextField(
                value = bgUrl,
                onValueChange = { config = config.toMutableMap().apply { put("bgUrl", it) } },
                placeholder = { Text("Global BG URL ($currentBgType)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFF1F5F9)).clickable {
                    if (userLevel >= 6) {
                        launcher.launch(if (currentBgType == "video") "video/*" else "image/*")
                    } else {
                        message = "Error: Unauthorized. Level 6+ required."
                    }
                }.padding(14.dp), contentAlignment = Alignment.Center
            ) {
                if (isUploading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color(0xFFF59E0B), strokeWidth = 2.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudUpload, null, tint = Color(0xFF475569), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Upload Background", color = Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF22C55E)).clickable(enabled = !isSaving) {
                if (userLevel < 6) {
                    message = "Error: Unauthorized. Level 6+ required."
                } else {
                    isSaving = true
                    scope.launch {
                        try {
                            db.document("settings/svipConfig").set(config, com.google.firebase.firestore.SetOptions.merge()).await()
                            message = "Success: VIP Settings Saved Live!"
                        } catch (e: Exception) {
                            message = "Error: Failed to save."
                        }
                        isSaving = false
                    }
                }
            }.padding(14.dp), contentAlignment = Alignment.Center
        ) {
            if (isSaving) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Save, null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SAVE CHANGES", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
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

// ─── CP Management ───────────────────────────────────────────────────────────

@Composable
fun CpManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current
    var config by remember { mutableStateOf<MutableMap<String, Any?>>(mutableMapOf(
        "cpBgType" to "dynamic", "cpBgUrl" to "", "cpHeaderTheme" to "#FF91B5",
        "friendBgType" to "dynamic", "friendBgUrl" to "", "friendHeaderTheme" to "#60a5fa"
    )) }
    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var uploadTarget by remember { mutableStateOf<String?>(null) } // "cp" or "friend"

    DisposableEffect(Unit) {
        val listener = db.document("appConfig/global").addSnapshotListener { snap, err ->
            if (err == null && snap != null && snap.exists()) {
                val data = snap.data ?: mapOf()
                config = mutableMapOf(
                    "cpBgType" to (data["cpBgType"] ?: "dynamic"),
                    "cpBgUrl" to (data["cpBgUrl"] ?: ""),
                    "cpHeaderTheme" to (data["cpHeaderTheme"] ?: "#FF91B5"),
                    "friendBgType" to (data["friendBgType"] ?: "dynamic"),
                    "friendBgUrl" to (data["friendBgUrl"] ?: ""),
                    "friendHeaderTheme" to (data["friendHeaderTheme"] ?: "#60a5fa")
                )
            }
            isLoading = false
        }
        onDispose { listener.remove() }
    }

    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null && userLevel >= 6 && uploadTarget != null) {
            val target = uploadTarget!!
            scope.launch {
                try {
                    val storageRef = com.google.firebase.storage.FirebaseStorage.getInstance().reference
                    val fileRef = storageRef.child("settings/${target}_bg_${System.currentTimeMillis()}")
                    fileRef.putFile(uri).await()
                    val downloadUrl = fileRef.downloadUrl.await().toString()
                    config = config.toMutableMap().apply { put("${target}BgUrl", downloadUrl) }
                    message = "Success: Background uploaded. Remember to save changes!"
                } catch (e: Exception) {
                    message = "Error: Failed to upload file."
                }
                uploadTarget = null
            }
        } else {
            uploadTarget = null
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFFDB2777))
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Favorite, null, tint = Color(0xFFDB2777), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("CP Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("CP BACKGROUND (ROMANTIC)", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(8.dp))

        val currentCpBgType = config["cpBgType"] as? String ?: "dynamic"
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("dynamic", "image", "video").forEach { type ->
                val active = currentCpBgType == type
                Box(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(if (active) Color(0xFFDB2777) else Color(0xFFF1F5F9))
                        .clickable { config = config.toMutableMap().apply { put("cpBgType", type) } }.padding(10.dp),
                    contentAlignment = Alignment.Center
                ) { Text(type.replaceFirstChar { it.uppercase() }, color = if (active) Color.White else Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        
        if (currentCpBgType == "image" || currentCpBgType == "video") {
            OutlinedTextField(
                value = config["cpBgUrl"] as? String ?: "",
                onValueChange = { config = config.toMutableMap().apply { put("cpBgUrl", it) } },
                placeholder = { Text("CP Background URL ($currentCpBgType)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFF1F5F9)).clickable {
                    if (userLevel >= 6) {
                        uploadTarget = "cp"
                        launcher.launch(if (currentCpBgType == "video") "video/*" else "image/*")
                    } else message = "Error: Unauthorized."
                }.padding(14.dp), contentAlignment = Alignment.Center
            ) {
                if (uploadTarget == "cp") {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color(0xFFDB2777), strokeWidth = 2.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudUpload, null, tint = Color(0xFF475569), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Upload CP Background", color = Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }
        
        OutlinedTextField(
            value = config["cpHeaderTheme"] as? String ?: "",
            onValueChange = { config = config.toMutableMap().apply { put("cpHeaderTheme", it) } },
            placeholder = { Text("Header HEX Theme (e.g., #FF91B5)") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("FRIEND BACKGROUND", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
        Spacer(modifier = Modifier.height(8.dp))

        val currentFriendBgType = config["friendBgType"] as? String ?: "dynamic"
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("dynamic", "image", "video").forEach { type ->
                val active = currentFriendBgType == type
                Box(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(if (active) Color(0xFF3B82F6) else Color(0xFFF1F5F9))
                        .clickable { config = config.toMutableMap().apply { put("friendBgType", type) } }.padding(10.dp),
                    contentAlignment = Alignment.Center
                ) { Text(type.replaceFirstChar { it.uppercase() }, color = if (active) Color.White else Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        
        if (currentFriendBgType == "image" || currentFriendBgType == "video") {
            OutlinedTextField(
                value = config["friendBgUrl"] as? String ?: "",
                onValueChange = { config = config.toMutableMap().apply { put("friendBgUrl", it) } },
                placeholder = { Text("Friend Background URL ($currentFriendBgType)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFF1F5F9)).clickable {
                    if (userLevel >= 6) {
                        uploadTarget = "friend"
                        launcher.launch(if (currentFriendBgType == "video") "video/*" else "image/*")
                    } else message = "Error: Unauthorized."
                }.padding(14.dp), contentAlignment = Alignment.Center
            ) {
                if (uploadTarget == "friend") {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color(0xFF3B82F6), strokeWidth = 2.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudUpload, null, tint = Color(0xFF475569), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Upload Friend Background", color = Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }
        
        OutlinedTextField(
            value = config["friendHeaderTheme"] as? String ?: "",
            onValueChange = { config = config.toMutableMap().apply { put("friendHeaderTheme", it) } },
            placeholder = { Text("Header HEX Theme (e.g., #60a5fa)") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF22C55E)).clickable(enabled = !isSaving) {
                if (userLevel < 6) {
                    message = "Error: Unauthorized. Level 6+ required."
                } else {
                    isSaving = true
                    scope.launch {
                        try {
                            db.document("appConfig/global").set(config, com.google.firebase.firestore.SetOptions.merge()).await()
                            message = "Success: Settings Saved Live!"
                        } catch (e: Exception) {
                            message = "Error: Failed to save."
                        }
                        isSaving = false
                    }
                }
            }.padding(14.dp), contentAlignment = Alignment.Center
        ) {
            if (isSaving) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Save, null, tint = Color.White, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SAVE CHANGES", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
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

// ─── Family Management ───────────────────────────────────────────────────────

@Composable
fun FamilyManagementTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var families by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var searchQuery by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf<String?>(null) }
    var uploadTargetId by remember { mutableStateOf<String?>(null) }

    DisposableEffect(Unit) {
        val listener = db.collection("families").addSnapshotListener { snap, err ->
            if (err == null && snap != null) {
                families = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
            }
            isLoading = false
        }
        onDispose { listener.remove() }
    }

    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null && userLevel >= 6 && uploadTargetId != null) {
            val familyId = uploadTargetId!!
            scope.launch {
                try {
                    val storageRef = com.google.firebase.storage.FirebaseStorage.getInstance().reference
                    val fileRef = storageRef.child("families/$familyId/banner_${System.currentTimeMillis()}")
                    fileRef.putFile(uri).await()
                    val downloadUrl = fileRef.downloadUrl.await().toString()
                    db.collection("families").document(familyId).update(
                        "bannerUrl", downloadUrl, 
                        "updatedAt", com.google.firebase.Timestamp.now()
                    ).await()
                    message = "Success: Family cover banner updated!"
                } catch (e: Exception) {
                    message = "Error: Failed to upload banner."
                }
                uploadTargetId = null
            }
        } else {
            uploadTargetId = null
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF10B981))
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.People, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Family Management", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Text("Search and manage all user families. Upload custom cover banners.", fontSize = 12.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 4.dp))
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by family name or owner") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(it, color = if (isError) Color(0xFFEF4444) else Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.padding(bottom = 8.dp))
        }

        val filtered = families.filter { 
            (it["name"] as? String)?.contains(searchQuery, ignoreCase = true) == true || 
            (it["ownerName"] as? String)?.contains(searchQuery, ignoreCase = true) == true
        }

        androidx.compose.foundation.lazy.LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(filtered.size) { index ->
                val family = filtered[index]
                val fid = family["id"] as String
                val bannerUrl = family["bannerUrl"] as? String
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), shape = RoundedCornerShape(12.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Group, null, tint = Color(0xFF10B981), modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(family["name"] as? String ?: "Unknown Family", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Owner: ${family["ownerName"] ?: "N/A"}", fontSize = 13.sp, color = Color(0xFF64748B))
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF1F5F9)).clickable {
                                if (userLevel >= 6) {
                                    uploadTargetId = fid
                                    launcher.launch("image/*")
                                } else message = "Error: Unauthorized."
                            }.padding(10.dp), contentAlignment = Alignment.Center) {
                                if (uploadTargetId == fid) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color(0xFF10B981), strokeWidth = 2.dp)
                                } else {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Upload, null, tint = Color(0xFF475569), modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Set Banner", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
                                    }
                                }
                            }
                            
                            if (!bannerUrl.isNullOrEmpty()) {
                                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFFEE2E2)).clickable {
                                    if (userLevel >= 6) {
                                        scope.launch {
                                            db.collection("families").document(fid).update("bannerUrl", "", "updatedAt", com.google.firebase.Timestamp.now())
                                            message = "Banner cleared."
                                        }
                                    } else message = "Error: Unauthorized."
                                }.padding(10.dp), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Delete, null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Pin Control ─────────────────────────────────────────────────────────────────────────────

@Composable
fun PinControlTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var roomSearchId by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var targetRoom by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isPinning by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.PushPin, null, tint = Color(0xFF10B981), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Pin Control", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Text("Search for a chat room by its Room Number and pin/unpin it globally.", fontSize = 12.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 4.dp))
        Spacer(modifier = Modifier.height(16.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = roomSearchId,
                onValueChange = { roomSearchId = it },
                placeholder = { Text("Room Number (e.g. 1000021)") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(if (roomSearchId.isNotBlank() && !isSearching) Color(0xFF10B981) else Color(0xFF94A3B8)).clickable(enabled = roomSearchId.isNotBlank() && !isSearching) {
                    isSearching = true
                    targetRoom = null
                    message = null
                    scope.launch {
                        try {
                            val snap = db.collection("rooms").whereEqualTo("roomNumber", roomSearchId.trim()).get().await()
                            if (!snap.isEmpty) {
                                val doc = snap.documents[0]
                                targetRoom = doc.data?.plus("id" to doc.id)
                            } else {
                                message = "Error: Room frequency not found."
                            }
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        isSearching = false
                    }
                }.padding(14.dp), contentAlignment = Alignment.Center
            ) {
                if (isSearching) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Find", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        targetRoom?.let { room ->
            val isPinned = room["isPinned"] as? Boolean == true
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Room Found", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(room["roomName"] as? String ?: "Unnamed Room", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF1E293B))
                    Text("Host ID: ${room["ownerId"]}", fontSize = 12.sp, color = Color(0xFF64748B))
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Box(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (isPinned) Color(0xFFEF4444) else Color(0xFF10B981)).clickable(enabled = !isPinning) {
                            if (userLevel < 6) {
                                message = "Error: Unauthorized. Level 6+ required."
                            } else {
                                isPinning = true
                                val nextState = !isPinned
                                scope.launch {
                                    try {
                                        db.collection("rooms").document(room["id"] as String).update(
                                            "isPinned", nextState,
                                            "updatedAt", com.google.firebase.Timestamp.now()
                                        ).await()
                                        targetRoom = targetRoom?.toMutableMap()?.apply { put("isPinned", nextState) }
                                        message = "Success: Room has been ${if (nextState) "pinned" else "unpinned"}."
                                    } catch (e: Exception) {
                                        message = "Error: Failed to change pin state."
                                    }
                                    isPinning = false
                                }
                            }
                        }.padding(14.dp), contentAlignment = Alignment.Center
                    ) {
                        if (isPinning) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text(if (isPinned) "Unpin Room" else "Pin Room Globally", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
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
                color = if (isError) Color(0xFFEF4444) else Color(0xFF10B981), 
                modifier = Modifier.padding(top = 16.dp), 
                fontWeight = FontWeight.Bold, 
                fontSize = 14.sp
            )
        }
    }
}

// ─── Tags Management ─────────────────────────────────────────────────────────────────────────

@Composable
fun TagsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var searchMode by remember { mutableStateOf("id") } // "id" or "name"
    var searchValue by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var targetUser by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isUpdating by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    val eliteTags = listOf(
        "Official", "Super Admin", "Manager", "Auditor", 
        "Admin", "CS Leader", "Customer Service", 
        "Seller", "Coin Seller", "Official center", "Seller center"
    )

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp).verticalScroll(rememberScrollState())) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Badge, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Assign Tags", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Text("Search a user and assign Elite Tags.", fontSize = 12.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 4.dp))
        Spacer(modifier = Modifier.height(16.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("id", "name").forEach { mode ->
                val active = searchMode == mode
                Box(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(if (active) Color(0xFF7C3AED) else Color(0xFFF1F5F9))
                        .clickable { searchMode = mode }.padding(10.dp),
                    contentAlignment = Alignment.Center
                ) { Text("By ${mode.replaceFirstChar { it.uppercase() }}", color = if (active) Color.White else Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = searchValue,
                onValueChange = { searchValue = it },
                placeholder = { Text(if (searchMode == "id") "User Account Number" else "Username") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                singleLine = true
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(if (searchValue.isNotBlank() && !isSearching) Color(0xFF7C3AED) else Color(0xFF94A3B8)).clickable(enabled = searchValue.isNotBlank() && !isSearching) {
                    isSearching = true
                    targetUser = null
                    message = null
                    scope.launch {
                        try {
                            val snap = if (searchMode == "id") {
                                db.collection("users").whereEqualTo("accountNumber", searchValue.trim()).limit(1).get().await()
                            } else {
                                db.collection("users").whereGreaterThanOrEqualTo("username", searchValue.trim())
                                    .whereLessThanOrEqualTo("username", searchValue.trim() + "\uf8ff").limit(1).get().await()
                            }
                            if (!snap.isEmpty) {
                                val doc = snap.documents[0]
                                var userMap = doc.data?.plus("id" to doc.id) ?: mapOf()
                                val profileSnap = db.collection("users").document(doc.id).collection("profile").document(doc.id).get().await()
                                if (profileSnap.exists()) {
                                    userMap = userMap + (profileSnap.data ?: mapOf())
                                }
                                targetUser = userMap
                            } else {
                                message = "Error: User not found."
                            }
                        } catch (e: Exception) {
                            message = "Error: ${e.message}"
                        }
                        isSearching = false
                    }
                }.padding(14.dp), contentAlignment = Alignment.Center
            ) {
                if (isSearching) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Search", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        targetUser?.let { user ->
            val currentTags = (user["tags"] as? List<String>) ?: listOf()
            
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(user["username"] as? String ?: "Unknown", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
                        Text("Acc: ${user["accountNumber"] ?: "N/A"}", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("SELECT ELITE TAGS", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8))
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    @OptIn(ExperimentalLayoutApi::class)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        eliteTags.forEach { tag ->
                            val isActive = currentTags.contains(tag)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isActive) Color(0xFF7C3AED) else Color(0xFFF1F5F9))
                                    .clickable(enabled = !isUpdating) {
                                        if (userLevel < 6) {
                                            message = "Error: Unauthorized. Level 6+ required."
                                            return@clickable
                                        }
                                        isUpdating = true
                                        scope.launch {
                                            val newTags = if (isActive) currentTags - tag else currentTags + tag
                                            try {
                                                val batch = db.batch()
                                                val uRef = db.collection("users").document(user["id"] as String)
                                                val pRef = db.collection("users").document(user["id"] as String).collection("profile").document(user["id"] as String)
                                                val updateData = mapOf("tags" to newTags, "updatedAt" to com.google.firebase.Timestamp.now())
                                                batch.update(uRef, updateData)
                                                batch.update(pRef, updateData)
                                                batch.commit().await()
                                                
                                                targetUser = targetUser?.toMutableMap()?.apply { put("tags", newTags) }
                                            } catch (e: Exception) {
                                                message = "Error: Update failed."
                                            }
                                            isUpdating = false
                                        }
                                    }
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(tag, color = if (isActive) Color.White else Color(0xFF475569), fontSize = 12.sp, fontWeight = FontWeight.Bold)
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

// ─── Agency Applications ───────────────────────────────────────────────────────────────────

@Composable
fun AgencyApplicationsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var applications by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var isUpdating by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("agency_applications").orderBy("submittedAt", com.google.firebase.firestore.Query.Direction.DESCENDING).get().await()
            applications = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.BusinessCenter, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Agency Applications", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Text("Review and approve/reject agency host applications.", fontSize = 12.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 4.dp))
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF3B82F6))
            }
            return
        }
        
        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(it, color = if (isError) Color(0xFFEF4444) else Color(0xFF22C55E), fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.padding(bottom = 8.dp))
        }

        if (applications.isEmpty()) {
            Text("No pending applications.", color = Color(0xFF94A3B8))
        } else {
            androidx.compose.foundation.lazy.LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(applications.size) { index ->
                    val app = applications[index]
                    val status = app["status"] as? String ?: "pending"
                    val uid = app["uid"] as? String ?: ""
                    
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), shape = RoundedCornerShape(12.dp)) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(app["agencyName"] as? String ?: "No Name", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
                                val statusColor = when(status) {
                                    "approved" -> Color(0xFF22C55E)
                                    "rejected" -> Color(0xFFEF4444)
                                    else -> Color(0xFFF59E0B)
                                }
                                Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(statusColor.copy(alpha=0.1f)).padding(horizontal = 8.dp, vertical = 4.dp)) {
                                    Text(status.uppercase(), color = statusColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("UID: $uid", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text("WhatsApp: ${app["whatsappNumber"] ?: "N/A"}", fontSize = 13.sp, color = Color(0xFF334155))
                            Text("Experience: ${app["experience"] ?: "None"}", fontSize = 13.sp, color = Color(0xFF334155))
                            
                            if (status == "pending") {
                                Spacer(modifier = Modifier.height(16.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Box(
                                        modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFF22C55E)).clickable(enabled = !isUpdating) {
                                            if (userLevel < 6) { message = "Error: Unauthorized."; return@clickable }
                                            isUpdating = true
                                            scope.launch {
                                                try {
                                                    val batch = db.batch()
                                                    val appRef = db.collection("agency_applications").document(app["id"] as String)
                                                    batch.update(appRef, mapOf("status" to "approved", "reviewedAt" to com.google.firebase.Timestamp.now()))
                                                    
                                                    val uRef = db.collection("users").document(uid)
                                                    val pRef = db.collection("users").document(uid).collection("profile").document(uid)
                                                    batch.update(uRef, "isAgency", true)
                                                    batch.update(pRef, "isAgency", true)
                                                    
                                                    batch.commit().await()
                                                    applications = applications.map { if (it["id"] == app["id"]) it + ("status" to "approved") else it }
                                                    message = "Application Approved!"
                                                } catch(e: Exception) { message = "Error: ${e.message}" }
                                                isUpdating = false
                                            }
                                        }.padding(10.dp), contentAlignment = Alignment.Center
                                    ) { Text("Approve", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                                    
                                    Box(
                                        modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable(enabled = !isUpdating) {
                                            if (userLevel < 6) { message = "Error: Unauthorized."; return@clickable }
                                            isUpdating = true
                                            scope.launch {
                                                try {
                                                    db.collection("agency_applications").document(app["id"] as String)
                                                        .update("status", "rejected", "reviewedAt", com.google.firebase.Timestamp.now()).await()
                                                    applications = applications.map { if (it["id"] == app["id"]) it + ("status" to "rejected") else it }
                                                    message = "Application Rejected."
                                                } catch(e: Exception) { message = "Error: ${e.message}" }
                                                isUpdating = false
                                            }
                                        }.padding(10.dp), contentAlignment = Alignment.Center
                                    ) { Text("Reject", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
