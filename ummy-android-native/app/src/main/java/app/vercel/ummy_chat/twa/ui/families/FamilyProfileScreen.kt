package app.vercel.ummy_chat.twa.ui.families

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.util.UUID

data class FamilyMember(
    val uid: String = "",
    val username: String = "",
    val avatarUrl: String? = null,
    val wallet: Map<String, Any>? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamilyProfileScreen(
    familyId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var family by remember { mutableStateOf<FamilyModel?>(null) }
    var members by remember { mutableStateOf<List<FamilyMember>>(emptyList()) }
    var userProfile by remember { mutableStateOf<FamilyMember?>(null) }
    var loading by remember { mutableStateOf(true) }

    val fs = FirebaseFirestore.getInstance()
    val currentUser = FirebaseAuth.getInstance().currentUser

    val isMember = currentUser != null && family?.members?.contains(currentUser.uid) == true
    val isOwner = currentUser != null && family?.ownerId == currentUser.uid
    val isAdmin = currentUser != null && family?.admins?.contains(currentUser.uid) == true

    var showEditModal by remember { mutableStateOf(false) }

    LaunchedEffect(familyId) {
        fs.collection("families").document(familyId).addSnapshotListener { snap, _ ->
            if (snap != null && snap.exists()) {
                family = snap.toObject(FamilyModel::class.java)?.copy(id = snap.id)
            }
        }
    }

    LaunchedEffect(family?.members) {
        if (family?.members?.isNotEmpty() == true) {
            val uids = family!!.members.take(10)
            if (uids.isNotEmpty()) {
                fs.collection("users").whereIn(com.google.firebase.firestore.FieldPath.documentId(), uids).get().addOnSuccessListener { snap ->
                    members = snap.documents.mapNotNull { it.toObject(FamilyMember::class.java)?.copy(uid = it.id) }
                }
            }
            if (currentUser != null) {
                fs.collection("users").document(currentUser.uid).get().addOnSuccessListener { snap ->
                    userProfile = snap.toObject(FamilyMember::class.java)?.copy(uid = snap.id)
                }
            }
            loading = false
        } else {
            loading = false
            members = emptyList()
        }
    }

    // --- Actions ---
    val handleJoin = {
        if (currentUser != null && family != null) {
            val batch = fs.batch()
            val userRef = fs.collection("users").document(currentUser.uid)
            val profileRef = fs.collection("users").document(currentUser.uid).collection("profile").document(currentUser.uid)
            val familyRef = fs.collection("families").document(familyId)

            batch.update(userRef, "familyId", familyId)
            batch.update(profileRef, "familyId", familyId)
            batch.update(familyRef, mapOf(
                "members" to FieldValue.arrayUnion(currentUser.uid),
                "memberCount" to FieldValue.increment(1)
            ))
            batch.commit().addOnSuccessListener {
                Toast.makeText(context, "Joined family", Toast.LENGTH_SHORT).show()
            }.addOnFailureListener {
                Toast.makeText(context, "Failed to join: ${it.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val handleLeave = {
        if (currentUser != null && family != null && !isOwner) {
            val batch = fs.batch()
            val userRef = fs.collection("users").document(currentUser.uid)
            val profileRef = fs.collection("users").document(currentUser.uid).collection("profile").document(currentUser.uid)
            val familyRef = fs.collection("families").document(familyId)

            batch.update(userRef, "familyId", null)
            batch.update(profileRef, "familyId", null)
            batch.update(familyRef, mapOf(
                "members" to FieldValue.arrayRemove(currentUser.uid),
                "memberCount" to FieldValue.increment(-1)
            ))
            batch.commit().addOnSuccessListener {
                Toast.makeText(context, "Left family", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val handleDelete = {
        if (isOwner) {
            fs.collection("families").document(familyId).delete().addOnSuccessListener {
                Toast.makeText(context, "Family deleted", Toast.LENGTH_SHORT).show()
                onBack()
            }
        }
    }

    val handleToggleAdmin = { memberUid: String ->
        if (isOwner) {
            val currentAdmins = family?.admins ?: emptyList()
            val isAlreadyAdmin = currentAdmins.contains(memberUid)
            if (!isAlreadyAdmin && currentAdmins.size >= 3) {
                Toast.makeText(context, "Limit Reached: Max 3 admins allowed.", Toast.LENGTH_SHORT).show()
            } else {
                fs.collection("families").document(familyId).update(
                    "admins", if (isAlreadyAdmin) FieldValue.arrayRemove(memberUid) else FieldValue.arrayUnion(memberUid)
                ).addOnSuccessListener {
                    Toast.makeText(context, if (isAlreadyAdmin) "Admin role removed." else "Admin role assigned!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    val handleKickMember = { memberUid: String ->
        if ((isOwner || isAdmin) && memberUid != currentUser?.uid && memberUid != family?.ownerId) {
            val batch = fs.batch()
            val userRef = fs.collection("users").document(memberUid)
            val profileRef = fs.collection("users").document(memberUid).collection("profile").document(memberUid)
            val familyRef = fs.collection("families").document(familyId)

            batch.update(userRef, "familyId", null)
            batch.update(profileRef, "familyId", null)
            
            val familyUpdates = mutableMapOf<String, Any>(
                "members" to FieldValue.arrayRemove(memberUid),
                "memberCount" to FieldValue.increment(-1)
            )
            if (family?.admins?.contains(memberUid) == true) {
                familyUpdates["admins"] = FieldValue.arrayRemove(memberUid)
            }
            batch.update(familyRef, familyUpdates)
            batch.commit().addOnSuccessListener {
                Toast.makeText(context, "Member removed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val handleShare = {
        val sendIntent: Intent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "Join my family \"${family?.name}\" on Ummy! Family ID: $familyId")
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, null)
        context.startActivity(shareIntent)
    }

    // --- Image Picker ---
    val imagePickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            Toast.makeText(context, "Uploading banner...", Toast.LENGTH_SHORT).show()
            val filename = "families/banners/${System.currentTimeMillis()}_${UUID.randomUUID().toString().substring(0,6)}.jpg"
            val ref = FirebaseStorage.getInstance().reference.child(filename)
            ref.putFile(uri).addOnSuccessListener {
                ref.downloadUrl.addOnSuccessListener { downloadUri ->
                    fs.collection("families").document(familyId).update("bannerUrl", downloadUri.toString())
                        .addOnSuccessListener {
                            Toast.makeText(context, "Banner updated!", Toast.LENGTH_SHORT).show()
                        }
                }
            }.addOnFailureListener { e ->
                Toast.makeText(context, "Upload failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    if (loading || family == null) {
        Box(modifier = Modifier.fillMaxSize().background(Color(0xFF1A0533)), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF6366F1))
        }
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF5F0F8))) {
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 40.dp)) {
            // --- Banner ---
            item {
                Box(modifier = Modifier.fillMaxWidth().height(240.dp)) {
                    AsyncImage(
                        model = family?.bannerUrl ?: "https://picsum.photos/seed/$familyId/800",
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    Box(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(120.dp).background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xF2F5F0F8)))))

                    // Top Action Buttons
                    Row(modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        IconButton(onClick = onBack, modifier = Modifier.background(Color.Black.copy(alpha = 0.3f), CircleShape).size(36.dp)) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                        if (isOwner || isAdmin) {
                            IconButton(onClick = { imagePickerLauncher.launch("image/*") }, modifier = Modifier.background(Color.Black.copy(alpha = 0.4f), CircleShape).size(36.dp)) {
                                Icon(Icons.Default.PhotoCamera, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                        }
                    }

                    // Family Info Overlay
                    Row(modifier = Modifier.align(Alignment.BottomStart).padding(start = 16.dp, end = 16.dp, bottom = 16.dp), verticalAlignment = Alignment.Bottom) {
                        // Avatar
                        Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(22.dp)).border(4.dp, Color.White, RoundedCornerShape(22.dp)).shadow(8.dp, RoundedCornerShape(22.dp))) {
                            AsyncImage(model = family?.bannerUrl ?: "https://picsum.photos/seed/$familyId/200", contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        }
                        
                        Column(modifier = Modifier.weight(1f).padding(start = 14.dp, bottom = 4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(family?.name ?: "", color = Color(0xFF1A1A2E), fontSize = 22.sp, fontWeight = FontWeight.Black)
                                if (family?.isVerified == true) {
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(Icons.Default.Verified, null, tint = Color(0xFF4ADE80), modifier = Modifier.size(18.dp))
                                }
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                                Text("👑 ", fontSize = 12.sp)
                                Text("Founder: ${family?.ownerName ?: "Unknown"}", color = Color(0xFF6B7280), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Right actions (Share, Edit, Join/Leave)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 4.dp)) {
                            IconButton(onClick = handleShare, modifier = Modifier.size(42.dp).background(Color.White, CircleShape).shadow(2.dp, CircleShape)) {
                                Icon(Icons.Default.Share, null, tint = Color(0xFF6B7280), modifier = Modifier.size(18.dp))
                            }
                            if (isOwner || isAdmin) {
                                IconButton(onClick = { showEditModal = true }, modifier = Modifier.size(42.dp).background(Color(0xFFE0F2FE), CircleShape)) {
                                    Icon(Icons.Default.Edit, null, tint = Color(0xFF0284C7), modifier = Modifier.size(18.dp))
                                }
                            }
                            if (isOwner) {
                                IconButton(onClick = handleDelete, modifier = Modifier.size(42.dp).background(Color(0xFFFEE2E2), CircleShape)) {
                                    Icon(Icons.Default.Delete, null, tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                                }
                            } else if (!isMember) {
                                Button(
                                    onClick = handleJoin,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                                    modifier = Modifier.height(42.dp).shadow(4.dp, CircleShape),
                                    contentPadding = PaddingValues(horizontal = 20.dp)
                                ) {
                                    Text("JOIN", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }
                }
            }

            // --- Stats ---
            item {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Total Power
                    Column(modifier = Modifier.weight(1f).shadow(2.dp, RoundedCornerShape(20.dp)).background(Color.White, RoundedCornerShape(20.dp)).padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.LocalFireDepartment, null, tint = Color(0xFFF97316), modifier = Modifier.size(24.dp))
                        app.vercel.ummy_chat.twa.ui.components.AutoResizeText(String.format("%,d", family?.totalWealth ?: 0), color = Color(0xFF1A1A2E), fontSize = 22.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 6.dp))
                        Text("TOTAL POWER", color = Color(0xFF9CA3AF), fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 2.dp))
                    }
                    // Active Members
                    Column(modifier = Modifier.weight(1f).shadow(2.dp, RoundedCornerShape(20.dp)).background(Color.White, RoundedCornerShape(20.dp)).padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Group, null, tint = Color(0xFF10B981), modifier = Modifier.size(24.dp))
                        app.vercel.ummy_chat.twa.ui.components.AutoResizeText("${family?.memberCount ?: 0}", color = Color(0xFF1A1A2E), fontSize = 22.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 6.dp))
                        Text("ACTIVE MEMBERS", color = Color(0xFF9CA3AF), fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }

            // --- Leave Button ---
            item {
                if (isMember && !isOwner) {
                    Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().border(1.5.dp, Color(0xFFFCA5A5), RoundedCornerShape(16.dp)).background(Color.White, RoundedCornerShape(16.dp)).clickable { handleLeave() }.padding(vertical = 14.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.PersonRemove, null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("LEAVE FAMILY", color = Color(0xFFEF4444), fontSize = 13.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }

            // --- Reputation ---
            item {
                val familyLevel = family?.level ?: 1
                val expPercent = 45 // Dummy progress for now
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp).shadow(2.dp, RoundedCornerShape(24.dp)).background(Color.White, RoundedCornerShape(24.dp)).padding(20.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.EmojiEvents, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("FAMILY REPUTATION", color = Color(0xFF1A1A2E), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                                Text("LEVEL $familyLevel ELITE CLAN", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                        if (isOwner) {
                            Box(modifier = Modifier.background(Color(0xFFFEF3C7), RoundedCornerShape(10.dp)).padding(horizontal = 10.dp, vertical = 5.dp)) {
                                Text("MANAGEMENT", color = Color(0xFFD97706), fontSize = 9.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("EXP PROGRESS", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("$expPercent% to Lv.${familyLevel + 1}", color = Color(0xFF1A1A2E), fontSize = 14.sp, fontWeight = FontWeight.Black)
                    }
                    Box(modifier = Modifier.fillMaxWidth().height(10.dp).background(Color(0xFFF3F4F6), RoundedCornerShape(5.dp))) {
                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(expPercent / 100f).background(Color(0xFF7C3AED), RoundedCornerShape(5.dp)))
                    }
                }
            }

            // --- Elite Roster ---
            item {
                Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp).padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Group, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("ELITE ROSTER", color = Color(0xFF1A1A2E), fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.weight(1f))
                    Text("Showing Top 10", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            // My Family Card
            item {
                if (isMember) {
                    Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 16.dp).shadow(2.dp, RoundedCornerShape(20.dp)).background(Color(0xFFEFE6F7), RoundedCornerShape(20.dp)).border(1.5.dp, Color(0xFF7C3AED), RoundedCornerShape(20.dp)).padding(14.dp)) {
                        Text("MY FAMILY CARD", color = Color(0xFF7C3AED), fontSize = 9.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(bottom = 8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(model = userProfile?.avatarUrl ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.size(44.dp).clip(CircleShape).border(2.dp, Color(0xFF7C3AED), CircleShape), contentScale = ContentScale.Crop)
                            Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
                                Text(userProfile?.username ?: "You", color = Color(0xFF1A1A2E), fontSize = 14.sp, fontWeight = FontWeight.Black)
                                Text(if (isOwner) "👑 Founder / Leader" else if (isAdmin) "🛡️ Family Admin" else "👤 Active Member", color = Color(0xFF7C3AED), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 2.dp))
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("SENDING CONTRIBUTED", color = Color(0xFF7C3AED), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                Text(String.format("%,d", family?.contributions?.get(currentUser?.uid) ?: 0) + " coins", color = Color(0xFF1A1A2E), fontSize = 13.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }
                }
            }

            // Member List
            items(members) { member ->
                val isMemberAdmin = family?.admins?.contains(member.uid) == true
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).shadow(1.dp, RoundedCornerShape(16.dp)).background(Color.White, RoundedCornerShape(16.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = member.avatarUrl ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(42.dp).clip(CircleShape).border(1.dp, Color(0xFFE5E7EB), CircleShape), contentScale = ContentScale.Crop)
                    Column(modifier = Modifier.weight(1f).padding(start = 12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(member.username, color = Color(0xFF1A1A2E), fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)
                            if (member.uid == family?.ownerId) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("👑", fontSize = 12.sp)
                            }
                            if (isMemberAdmin) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(Icons.Default.Verified, null, tint = Color(0xFF9333EA), modifier = Modifier.size(12.dp))
                            }
                        }
                        Text(if (member.uid == family?.ownerId) "Founder" else if (isMemberAdmin) "Admin" else "Member", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 2.dp))
                    }

                    if (isOwner && member.uid != currentUser?.uid) {
                        Box(modifier = Modifier.padding(end = 6.dp).background(if (isMemberAdmin) Color(0xFFFEE2E2) else Color(0xFFF3E8FF), RoundedCornerShape(8.dp)).clickable { handleToggleAdmin(member.uid) }.padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Text(if (isMemberAdmin) "- ADMIN" else "+ ADMIN", color = if (isMemberAdmin) Color(0xFFEF4444) else Color(0xFF7C3AED), fontSize = 9.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    if ((isOwner || isAdmin) && member.uid != currentUser?.uid && member.uid != family?.ownerId) {
                        Box(modifier = Modifier.padding(end = 10.dp).background(Color(0xFFFEF2F2), RoundedCornerShape(8.dp)).clickable { handleKickMember(member.uid) }.padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Text("KICK", color = Color(0xFFEF4444), fontSize = 9.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocalFireDepartment, null, tint = Color(0xFFF97316), modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(String.format("%,d", family?.contributions?.get(member.uid) ?: 0), color = Color(0xFF1A1A2E), fontSize = 13.sp, fontWeight = FontWeight.Black)
                        }
                        Text("Coins Sent", color = Color(0xFF9CA3AF), fontSize = 8.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 1.dp))
                    }
                }
            }

            if (members.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp), contentAlignment = Alignment.Center) {
                        Text("No members yet", color = Color(0xFF9CA3AF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    if (showEditModal) {
        EditFamilyModal(
            family = family,
            onDismiss = { showEditModal = false },
            onSave = { newName, newBanner, newBio, newAnnouncement ->
                fs.collection("families").document(familyId).update(
                    mapOf(
                        "name" to newName,
                        "bannerUrl" to newBanner,
                        "bio" to newBio,
                        "announcement" to newAnnouncement
                    )
                ).addOnSuccessListener {
                    showEditModal = false
                    Toast.makeText(context, "Family details updated!", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditFamilyModal(
    family: FamilyModel?,
    onDismiss: () -> Unit,
    onSave: (String, String, String, String) -> Unit
) {
    var editName by remember { mutableStateOf(family?.name ?: "") }
    var editBannerUrl by remember { mutableStateOf(family?.bannerUrl ?: "") }
    var editBio by remember { mutableStateOf(family?.bio ?: "") }
    var editAnnouncement by remember { mutableStateOf(family?.announcement ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Family Details", fontWeight = FontWeight.Black, fontSize = 18.sp) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = editName, onValueChange = { editName = it }, label = { Text("Family Name") }, singleLine = true)
                OutlinedTextField(value = editBannerUrl, onValueChange = { editBannerUrl = it }, label = { Text("Banner Image URL") }, singleLine = true)
                OutlinedTextField(value = editBio, onValueChange = { editBio = it }, label = { Text("Family Bio") }, maxLines = 3)
                OutlinedTextField(value = editAnnouncement, onValueChange = { editAnnouncement = it }, label = { Text("Announcement") }, maxLines = 2)
            }
        },
        confirmButton = {
            Button(onClick = { onSave(editName, editBannerUrl, editBio, editAnnouncement) }) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
