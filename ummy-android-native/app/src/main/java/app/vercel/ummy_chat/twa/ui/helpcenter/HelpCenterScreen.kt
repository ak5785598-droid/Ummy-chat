package app.vercel.ummy_chat.twa.ui.helpcenter

import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

// React Native help-center/index.tsx → Kotlin Compose (EXACT PARITY)

private val SUPER_ADMIN_UID = "901piBzTQ0VzCtAvlyyobwvAaTs1"
private val BLOCKED_UID = "XcEUwkKp1KSZ66Qns6tIgpmzOQA3"

private data class AdminUser(
    val uid: String = "",
    val username: String = "",
    val avatarUrl: String = "",
    val isOnline: Boolean = false
)

private val FAQS = listOf(
    "How do I create an account?" to "You can sign up using Google, Facebook, or your phone number. Simply tap 'Get Started' on the login screen and follow the prompts.",
    "How do I buy coins?" to "Navigate to your wallet from the profile screen. Choose a coin package and complete the payment process through the secure payment gateway.",
    "What can I use coins for?" to "Coins can be used to send gifts, purchase items in the store, buy ID badges, and unlock premium features.",
    "How do I edit my profile?" to "Tap the edit icon on your profile screen. You can change your username, avatar, gender, and other details.",
    "How do I create a room?" to "Tap the '+' button on the home screen. Choose a category, enter a room name, and tap 'Create Room'."
)

@Composable
fun HelpCenterScreen(onBack: () -> Unit) {
    val green50 = Color(0xFFF1F8E9)
    val green100 = Color(0xFFE8F5E9)
    val green600 = Color(0xFF16A34A)
    val green700 = Color(0xFF059669)
    val darkGreen = Color(0xFF1B4332)
    val context = LocalContext.current

    var expandedIndex by remember { mutableStateOf<Int?>(null) }
    var admins by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var loadingAdmins by remember { mutableStateOf(true) }

    // React Native L182-227: Fetch admins
    LaunchedEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        val uid = FirebaseAuth.getInstance().currentUser?.uid

        val results = mutableMapOf<String, AdminUser>()

        // Super admin
        fs.collection("users").document(SUPER_ADMIN_UID).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    results[SUPER_ADMIN_UID] = AdminUser(
                        uid = SUPER_ADMIN_UID,
                        username = doc.getString("username") ?: "Ummy Official",
                        avatarUrl = doc.getString("avatarUrl") ?: "",
                        isOnline = doc.getBoolean("isOnline") ?: false
                    )
                }
            }

        // isAdmin == true
        fs.collection("users").whereEqualTo("isAdmin", true).get()
            .addOnSuccessListener { snap ->
                snap.documents.forEach { doc ->
                    val uid2 = doc.id
                    if (uid2 != BLOCKED_UID && uid2 != uid) {
                        results[uid2] = AdminUser(
                            uid = uid2,
                            username = doc.getString("username") ?: "Admin",
                            avatarUrl = doc.getString("avatarUrl") ?: "",
                            isOnline = doc.getBoolean("isOnline") ?: false
                        )
                    }
                }
                // tags 'Official'
                fs.collection("users").whereArrayContains("tags", "Official").get()
                    .addOnSuccessListener { snap2 ->
                        snap2.documents.forEach { doc ->
                            val uid3 = doc.id
                            if (uid3 != BLOCKED_UID && uid3 != uid && !results.containsKey(uid3)) {
                                results[uid3] = AdminUser(
                                    uid = uid3,
                                    username = doc.getString("username") ?: "Official",
                                    avatarUrl = doc.getString("avatarUrl") ?: "",
                                    isOnline = doc.getBoolean("isOnline") ?: false
                                )
                            }
                        }
                        admins = results.values.toList().sortedBy { it.username }
                        loadingAdmins = false
                    }
                    .addOnFailureListener {
                        admins = results.values.toList()
                        loadingAdmins = false
                    }
            }
            .addOnFailureListener { loadingAdmins = false }
    }

    Box(modifier = Modifier.fillMaxSize().background(green50)) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L38-44)
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
                        .background(Color.White.copy(alpha = 0.6f))
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = darkGreen, modifier = Modifier.size(22.dp))
                }
                Text("Support", fontSize = 18.sp, fontWeight = FontWeight.Black, color = darkGreen)
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 48.dp)
            ) {
                // Badge (React Native L51-58)
                item {
                    Row(
                        modifier = Modifier.padding(bottom = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(Color.White.copy(alpha = 0.6f))
                                .border(1.dp, Color.White.copy(alpha = 0.8f), RoundedCornerShape(50))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("⚡", fontSize = 11.sp)
                                Text("SUPPORT PROTOCOL", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = darkGreen)
                            }
                        }
                    }
                }

                // Title (React Native L60-64)
                item {
                    Text("OFFICIAL HELP CENTER", fontSize = 28.sp, fontWeight = FontWeight.Black, color = darkGreen, lineHeight = 32.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Find answers to your questions...", fontSize = 14.sp, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // 24/7 Banner (React Native L66-82)
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Brush.horizontalGradient(listOf(green600, green700)))
                            .padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("🎧", fontSize = 20.sp)
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("24/7 AVAILABLE", fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color.White)
                                Text("Professional support team", fontSize = 10.sp, color = Color.White.copy(alpha = 0.7f))
                            }
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(Color.White.copy(alpha = 0.2f))
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                                Text("ACTIVE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // Official Team Header (React Native L84-92)
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFDCFCE7)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🛡️", fontSize = 14.sp)
                        }
                        Text("OFFICIAL TEAM", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = darkGreen)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(Color(0xFFDCFCE7))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Direct Message", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = green600)
                        }
                    }
                }

                // Admin List (React Native L94-128)
                if (loadingAdmins) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = green600, modifier = Modifier.size(24.dp))
                        }
                    }
                } else {
                    items(admins) { admin ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFDCFCE7), RoundedCornerShape(16.dp))
                                .padding(horizontal = 16.dp, vertical = 14.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box {
                                    if (admin.avatarUrl.isNotBlank()) {
                                        AsyncImage(
                                            model = admin.avatarUrl,
                                            contentDescription = null,
                                            modifier = Modifier.size(48.dp).clip(CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier.size(48.dp).clip(CircleShape).background(darkGreen),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(admin.username.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                        }
                                    }
                                    if (admin.isOnline) {
                                        Box(
                                            modifier = Modifier
                                                .size(14.dp)
                                                .clip(CircleShape)
                                                .background(green600)
                                                .border(2.dp, Color.White, CircleShape)
                                                .align(Alignment.BottomEnd)
                                        )
                                    }
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(admin.username, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = darkGreen)
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(green600)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("OFFICIAL", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text("Available 24/7 for support", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                }
                                Row(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(50))
                                        .background(green600)
                                        .clickable {
                                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://ummy.chat/chat/${admin.uid}"))
                                            try { context.startActivity(intent) } catch (_: Exception) {}
                                        }
                                        .padding(horizontal = 14.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text("💬", fontSize = 13.sp)
                                    Text("MESSAGE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                // Email Support (React Native L130-156)
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color.White)
                            .border(1.dp, Color(0xFFDCFCE7), RoundedCornerShape(24.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("NEED MORE HELP?", fontSize = 14.sp, fontWeight = FontWeight.Black, color = darkGreen)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Our email support team responds within 24 hours", fontSize = 12.sp, color = Color(0xFF64748B))
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFF0FDF4))
                                    .border(1.dp, Color(0xFFDCFCE7), RoundedCornerShape(16.dp))
                                    .padding(16.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(green600),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("📧", fontSize = 24.sp)
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Ummy Support", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = darkGreen)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text("RESPONSE IN 24 HRS", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = green600)
                                        }
                                    }
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(50))
                                            .background(green600)
                                            .clickable {
                                                val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:support@ummylive.com"))
                                                try { context.startActivity(intent) } catch (_: Exception) {}
                                            }
                                            .padding(horizontal = 16.dp, vertical = 10.dp)
                                    ) {
                                        Text("Email Us", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }

                // FAQ Header (React Native L158-166)
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFDCFCE7)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("🛡️", fontSize = 14.sp)
                        }
                        Text("FAQ DIMENSION", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = darkGreen)
                    }
                }

                // FAQ Accordion (React Native L168-190)
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color.White)
                            .border(1.dp, Color(0xFFDCFCE7), RoundedCornerShape(24.dp))
                    ) {
                        Column {
                            FAQS.forEachIndexed { index, (question, answer) ->
                                val isExpanded = expandedIndex == index
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable { expandedIndex = if (isExpanded) null else index }
                                            .padding(horizontal = 20.dp, vertical = 18.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            question,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = darkGreen,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Icon(
                                            if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                            null,
                                            tint = Color(0xFF8B9E8D),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    if (isExpanded) {
                                        Text(
                                            answer,
                                            fontSize = 11.sp,
                                            color = Color(0xFF64748B),
                                            modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 20.dp),
                                            lineHeight = 16.sp
                                        )
                                    }
                                    if (index < FAQS.lastIndex) {
                                        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFDCFCE7).copy(alpha = 0.4f)))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
