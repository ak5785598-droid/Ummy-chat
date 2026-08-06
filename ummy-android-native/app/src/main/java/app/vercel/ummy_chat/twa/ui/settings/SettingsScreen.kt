package app.vercel.ummy_chat.twa.ui.settings

import android.content.Intent
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import app.vercel.ummy_chat.twa.MainActivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// React Native settings/index.tsx → Kotlin Compose (MINIMAL PARITY)
// Main view: Language, Account Connections, Notifications, Privacy, Blocked Users, Logout, Delete Account

@Composable
fun SettingsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val providers = FirebaseAuth.getInstance().currentUser?.providerData?.map { it?.providerId }?.filterNotNull() ?: emptyList()
    val isGoogleLinked = providers.contains("google.com")
    val isFacebookLinked = providers.contains("facebook.com")
    val isPhoneLinked = providers.contains("phone")
    val linkedCount = providers.size

    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    fun handleLogout() {
        if (uid == null) return
        val fs = FirebaseFirestore.getInstance()
        val batch = fs.batch()
        val userRef = fs.collection("users").document(uid)
        val profileRef = userRef.collection("profile").document(uid)
        batch.update(userRef, mapOf("isOnline" to false, "currentRoomId" to null, "updatedAt" to FieldValue.serverTimestamp()))
        batch.update(profileRef, mapOf("isOnline" to false, "currentRoomId" to null, "updatedAt" to FieldValue.serverTimestamp()))
        batch.commit().addOnSuccessListener {
            FirebaseAuth.getInstance().signOut()
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            context.startActivity(intent)
        }
    }

    fun handleDeleteAccount() {
        if (uid == null) return
        val fs = FirebaseFirestore.getInstance()
        val batch = fs.batch()
        val userRef = fs.collection("users").document(uid)
        val profileRef = userRef.collection("profile").document(uid)
        batch.update(userRef, mapOf("isDeleted" to true, "isOnline" to false, "updatedAt" to FieldValue.serverTimestamp()))
        batch.update(profileRef, mapOf("isDeleted" to true, "isOnline" to false, "updatedAt" to FieldValue.serverTimestamp()))
        batch.commit().addOnSuccessListener {
            FirebaseAuth.getInstance().currentUser?.delete()
            FirebaseAuth.getInstance().signOut()
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            context.startActivity(intent)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L12-20)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Color(0xFFF1F5F9))
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(CircleShape)
                        .clickable { onBack() }
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF1E293B), modifier = Modifier.size(24.dp))
                }
                Text("Settings", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
            ) {
                // Section: Identity & Configuration (React Native L22-34)
                Text(
                    "IDENTITY & CONFIGURATION",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 24.dp, bottom = 8.dp, start = 4.dp)
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                ) {
                    Column {
                        SettingsMenuItem(icon = Icons.Default.Language, label = "Language", extra = "English")
                        SettingsMenuItem(icon = Icons.Default.Link, label = "Account Connections", extra = "$linkedCount Linked")
                        SettingsMenuItem(icon = Icons.Default.Notifications, label = "Notifications")
                        SettingsMenuItem(icon = Icons.Default.Lock, label = "Privacy")
                        SettingsMenuItem(icon = Icons.Default.Block, label = "Blocked Users", showDivider = false)
                    }
                }

                // Section: Exit Actions (React Native L36-44)
                Text(
                    "EXIT ACTIONS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8),
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 24.dp, bottom = 8.dp, start = 4.dp)
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                ) {
                    Column {
                        SettingsMenuItem(icon = Icons.Default.Logout, label = "Logout", textColor = Color(0xFFEF4444), onClick = { showLogoutConfirm = true })
                        SettingsMenuItem(icon = Icons.Default.Delete, label = "Delete Account", textColor = Color(0xFFEF4444), showDivider = false, onClick = { showDeleteConfirm = true })
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    "Ummy Secure Protocol v1.4.2 • India Official",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    fontSize = 11.sp,
                    color = Color(0xFF94A3B8)
                )
                Spacer(modifier = Modifier.height(32.dp))
            }
        }

        // Logout Confirmation
        if (showLogoutConfirm) {
            AlertDialog(
                onDismissRequest = { showLogoutConfirm = false },
                title = { Text("Logout", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                text = { Text("Are you sure you want to logout?", fontSize = 14.sp, color = Color(0xFF64748B)) },
                confirmButton = {
                    TextButton(onClick = { showLogoutConfirm = false; handleLogout() }) {
                        Text("Logout", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutConfirm = false }) {
                        Text("Cancel", color = Color(0xFF64748B))
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
        }

        // Delete Confirmation
        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirm = false },
                title = { Text("Delete Account", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                text = { Text("This action is permanent. Your account and all data will be deleted.", fontSize = 14.sp, color = Color(0xFF64748B)) },
                confirmButton = {
                    TextButton(onClick = { showDeleteConfirm = false; handleDeleteAccount() }) {
                        Text("Delete", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirm = false }) {
                        Text("Cancel", color = Color(0xFF64748B))
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}

@Composable
private fun SettingsMenuItem(
    icon: ImageVector,
    label: String,
    extra: String? = null,
    textColor: Color = Color(0xFF1E293B),
    showDivider: Boolean = true,
    onClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFFF3E8FF)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = textColor, modifier = Modifier.weight(1f))
        if (extra != null) {
            Text(extra, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF94A3B8))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(16.dp))
    }
    if (showDivider) {
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFF1F5F9).copy(alpha = 0.5f)))
    }
}
