package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// AristocracyDialog — mirrors RN aristocracy-dialog.tsx
// Nobility Club purchasing modal: 4 Ranks (Knight, Duke, King, Emperor)
// with duration pricing (3, 7, 15, 30 days) and DP avatar frame preview.
// ─────────────────────────────────────────────────────────────────────────────

private data class AristocracyRank(
    val id: String,
    val name: String,
    val title: String,
    val pricing: Map<Int, Long>,
    val gradient: List<Color>,
    val chatColor: String,
    val frameId: String,
    val frameUrl: String,
    val dailySalary: Long,
    val dailyExp: Long,
    val dailyDiamonds: Long,
    val dailyGiftCredit: Long
)

private val ARISTOCRACY_RANKS = listOf(
    AristocracyRank(
        id = "knight", name = "Knight", title = "Elite Tier I",
        pricing = mapOf(3 to 30000L, 7 to 60000L, 15 to 100000L, 30 to 180000L),
        gradient = listOf(Color(0xFF3B82F6), Color(0xFF1D4ED8)),
        chatColor = "#3B82F6", frameId = "aristocracy_knight_frame",
        frameUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/frames%2Faristocracy_knight_frame_v2.png?alt=media",
        dailySalary = 15000, dailyExp = 1000, dailyDiamonds = 2000, dailyGiftCredit = 5000
    ),
    AristocracyRank(
        id = "duke", name = "Duke", title = "Elite Tier II",
        pricing = mapOf(3 to 80000L, 7 to 150000L, 15 to 280000L, 30 to 500000L),
        gradient = listOf(Color(0xFF8B5CF6), Color(0xFF6D28D9)),
        chatColor = "#8B5CF6", frameId = "aristocracy_duke_frame",
        frameUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/frames%2Faristocracy_duke_frame_v2.png?alt=media",
        dailySalary = 30000, dailyExp = 2500, dailyDiamonds = 5000, dailyGiftCredit = 12000
    ),
    AristocracyRank(
        id = "king", name = "King", title = "Elite Tier III",
        pricing = mapOf(3 to 200000L, 7 to 380000L, 15 to 750000L, 30 to 1300000L),
        gradient = listOf(Color(0xFFFBBF24), Color(0xFFD97706)),
        chatColor = "#FBBF24", frameId = "aristocracy_king_frame",
        frameUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/frames%2Faristocracy_king_frame_v2.png?alt=media",
        dailySalary = 70000, dailyExp = 5000, dailyDiamonds = 10000, dailyGiftCredit = 25000
    ),
    AristocracyRank(
        id = "emperor", name = "Emperor", title = "Elite Tier IV",
        pricing = mapOf(3 to 400000L, 7 to 800000L, 15 to 1500000L, 30 to 2800000L),
        gradient = listOf(Color(0xFFEC4899), Color(0xFFBE185D)),
        chatColor = "#EC4899", frameId = "aristocracy_emperor_frame",
        frameUrl = "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/frames%2Faristocracy_emperor_frame_v2.png?alt=media",
        dailySalary = 100000, dailyExp = 10000, dailyDiamonds = 20000, dailyGiftCredit = 50000
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AristocracyDialog(
    visible: Boolean,
    onDismiss: () -> Unit
) {
    if (!visible) return

    val scope = rememberCoroutineScope()
    var selectedRank by remember { mutableStateOf(ARISTOCRACY_RANKS[0]) }
    var selectedDuration by remember { mutableIntStateOf(3) }
    var isLoading by remember { mutableStateOf(false) }

    var userCoins by remember { mutableLongStateOf(0L) }
    var nobilityRank by remember { mutableStateOf<String?>(null) }
    var nobilityExpiresAt by remember { mutableLongStateOf(0L) }
    var nobilityLastClaimedAt by remember { mutableLongStateOf(0L) }

    DisposableEffect(Unit) {
        val uid = Firebase.auth.currentUser?.uid
        val listener = if (uid != null) {
            Firebase.firestore.collection("users").document(uid).addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val wallet = snap.get("wallet") as? Map<*, *>
                    val coins = wallet?.get("coins")
                    userCoins = when (coins) {
                        is Number -> coins.toLong()
                        is String -> coins.toLongOrNull() ?: 0L
                        else -> 0L
                    }

                    val nobility = snap.get("nobility") as? Map<*, *>
                    nobilityRank = nobility?.get("rank") as? String
                    val expiresAtNum = nobility?.get("expiresAt")
                    nobilityExpiresAt = when (expiresAtNum) {
                        is Number -> expiresAtNum.toLong()
                        is String -> expiresAtNum.toLongOrNull() ?: 0L
                        else -> 0L
                    }
                    val lastClaimedAtNum = nobility?.get("lastClaimedAt")
                    nobilityLastClaimedAt = when (lastClaimedAtNum) {
                        is Number -> lastClaimedAtNum.toLong()
                        is String -> lastClaimedAtNum.toLongOrNull() ?: 0L
                        else -> 0L
                    }
                }
            }
        } else null
        onDispose { listener?.remove() }
    }

    val price = selectedRank.pricing[selectedDuration] ?: 0L
    val isRankActive = nobilityRank == selectedRank.id && nobilityExpiresAt > System.currentTimeMillis()
    val canClaimSalary = isRankActive && (System.currentTimeMillis() - nobilityLastClaimedAt >= 24 * 60 * 60 * 1000)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF150824),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("👑", fontSize = 20.sp)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "ARISTOCRACY CLUB",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            // Balance
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("My Balance", color = Color.White.copy(alpha = 0.7f), fontSize = 14.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon(size = 14)
                    Spacer(Modifier.width(4.dp))
                    Text(String.format("%,d", userCoins), color = Color(0xFFFBBF24), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Rank Selector Tabs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ARISTOCRACY_RANKS.forEach { rank ->
                    val isSelected = rank.id == selectedRank.id
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(14.dp))
                            .background(
                                if (isSelected) Brush.linearGradient(rank.gradient)
                                else Brush.linearGradient(listOf(Color.White.copy(alpha = 0.05f), Color.White.copy(alpha = 0.05f)))
                            )
                            .border(1.dp, if (isSelected) rank.gradient.first() else Color.Transparent, RoundedCornerShape(14.dp))
                            .clickable { selectedRank = rank }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            rank.name,
                            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.5f),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Scrollable Content
            LazyColumn(
                modifier = Modifier.weight(1f, fill = false),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    // Rank Card Preview
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Brush.linearGradient(selectedRank.gradient))
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    selectedRank.name,
                                    color = Color.White,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    selectedRank.title,
                                    color = Color.White.copy(alpha = 0.8f),
                                    fontSize = 14.sp
                                )

                                Spacer(Modifier.height(16.dp))
                                
                                AsyncImage(
                                    model = selectedRank.frameUrl,
                                    contentDescription = "Avatar Frame",
                                    modifier = Modifier.size(100.dp)
                                )
                                Spacer(Modifier.height(8.dp))
                                Text("Exclusive Avatar Frame", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)

                                Spacer(Modifier.height(16.dp))

                                // Duration Selector Pills (only if not active rank)
                                if (!isRankActive) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        listOf(3, 7, 15, 30).forEach { days ->
                                            val isDurSelected = days == selectedDuration
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .clip(RoundedCornerShape(12.dp))
                                                    .background(
                                                        if (isDurSelected) Color.White.copy(alpha = 0.25f)
                                                        else Color.Black.copy(alpha = 0.2f)
                                                    )
                                                    .clickable { selectedDuration = days }
                                                    .padding(vertical = 8.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    "${days}d",
                                                    color = Color.White,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }
                                } else {
                                    val daysLeft = Math.max(1, ((nobilityExpiresAt - System.currentTimeMillis()) / (24 * 60 * 60 * 1000)).toInt())
                                    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color.White.copy(alpha = 0.2f)).padding(8.dp)) {
                                        Text("Active: $daysLeft days remaining", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Privileges
                item {
                    Text("Daily Privileges", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    
                    Column(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = 0.05f)).padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        PrivilegeRow("🪙 Salary", "${String.format("%,d", selectedRank.dailySalary)} Coins")
                        PrivilegeRow("🎨 Theme", "Exclusive ${selectedRank.name} Frame")
                        PrivilegeRow("⭐ EXP", "+${String.format("%,d", selectedRank.dailyExp)}")
                        PrivilegeRow("💎 Diamonds", "${String.format("%,d", selectedRank.dailyDiamonds)}")
                        PrivilegeRow("🎁 Gift Credit", "${String.format("%,d", selectedRank.dailyGiftCredit)}")
                        PrivilegeRow("💬 Chat Color", "Exclusive ${selectedRank.name} Color")
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Action Button (Claim Salary or Buy)
            if (isRankActive) {
                Button(
                    onClick = {
                        if (!canClaimSalary || isLoading) return@Button
                        isLoading = true
                        scope.launch {
                            try {
                                val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                val db = Firebase.firestore
                                db.collection("users").document(uid).update(
                                    mapOf(
                                        "wallet.coins" to FieldValue.increment(selectedRank.dailySalary + selectedRank.dailyGiftCredit),
                                        "wallet.diamonds" to FieldValue.increment(selectedRank.dailyDiamonds),
                                        "wallet.totalSpent" to FieldValue.increment(selectedRank.dailyExp),
                                        "nobility.lastClaimedAt" to System.currentTimeMillis(),
                                        "updatedAt" to com.google.firebase.Timestamp.now()
                                    )
                                ).await()
                            } catch (_: Exception) {}
                            isLoading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    enabled = canClaimSalary && !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                    } else {
                        Text(
                            if (canClaimSalary) "Claim Daily Salary" else "Salary Already Claimed Today",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            } else {
                val canAfford = userCoins >= price
                Button(
                    onClick = {
                        if (!canAfford || isLoading) return@Button
                        isLoading = true
                        scope.launch {
                            try {
                                val uid = Firebase.auth.currentUser?.uid ?: return@launch
                                val db = Firebase.firestore
                                val expireTime = System.currentTimeMillis() + (selectedDuration * 24 * 60 * 60 * 1000L)
                                val batch = db.batch()

                                val userRef = db.collection("users").document(uid)
                                val profileRef = db.collection("users").document(uid).collection("profile").document(uid)

                                val frameData = mapOf("inventory.ownedItems" to FieldValue.arrayUnion(selectedRank.frameId))

                                batch.update(userRef, mapOf(
                                    "wallet.coins" to FieldValue.increment(-price),
                                    "wallet.dailySpent" to FieldValue.increment(price),
                                    "nobility.rank" to selectedRank.id,
                                    "nobility.expiresAt" to expireTime,
                                    "nobility.purchasedAt" to System.currentTimeMillis(),
                                    "nobility.chatColor" to selectedRank.chatColor,
                                    "updatedAt" to com.google.firebase.Timestamp.now()
                                ) + frameData)

                                batch.update(profileRef, frameData + mapOf("updatedAt" to com.google.firebase.Timestamp.now()))

                                batch.commit().await()
                            } catch (_: Exception) {}
                            isLoading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    enabled = canAfford && !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = selectedRank.gradient.first()),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                    } else {
                        Text(
                            if (canAfford) "Buy ${selectedRank.name} • 🪙 ${String.format("%,d", price)}" else "Insufficient Coins (🪙 ${String.format("%,d", price)})",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            Spacer(Modifier.navigationBarsPadding())
        }
    }
}

@Composable
private fun PrivilegeRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Text(value, color = Color(0xFFFBBF24), fontSize = 14.sp, fontWeight = FontWeight.Black)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomFollowersDialog — mirrors RN room-followers-dialog.tsx
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomFollowersDialog(
    visible: Boolean,
    roomId: String,
    onDismiss: () -> Unit
) {
    if (!visible) return

    var followers by remember { mutableStateOf<List<Pair<String, String>>>(emptyList()) } // name, avatar
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(roomId) {
        try {
            val db = Firebase.firestore
            val snap = db.collection("chatRooms").document(roomId)
                .collection("followers").get().await()

            followers = snap.documents.map { doc ->
                Pair(doc.getString("name") ?: "Follower", doc.getString("avatarUrl") ?: "")
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.6f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Room Followers (${followers.size})", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            HorizontalDivider(color = Color.White.copy(alpha = 0.05f))

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF38BDF8))
                }
            } else if (followers.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No followers yet", color = Color.White.copy(alpha = 0.4f), fontSize = 13.sp)
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(followers) { (name, avatar) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AsyncImage(
                                model = avatar.ifBlank { "https://picsum.photos/200" },
                                contentDescription = name,
                                modifier = Modifier.size(40.dp).clip(CircleShape)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CpProposeDialog — mirrors RN cp-propose-dialog.tsx
// Proposal dialog to send Couple / BFF / Love proposal to target user
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun CpProposeDialog(
    visible: Boolean,
    targetUser: Triple<String, String, String?>?, // uid, name, avatarUrl
    onDismiss: () -> Unit
) {
    if (!visible || targetUser == null) return

    val scope = rememberCoroutineScope()
    var selectedType by remember { mutableStateOf("CP") } // "CP" | "BFF" | "Love"
    var isSent by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color(0xFF0F172A))
                .border(1.dp, Color(0xFFEC4899).copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                .padding(24.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                    }
                }

                Text("💖 Proposal", color = Color(0xFFEC4899), fontSize = 20.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(16.dp))

                // Target User Info
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = targetUser.third ?: "https://picsum.photos/200",
                        contentDescription = targetUser.second,
                        modifier = Modifier.size(44.dp).clip(CircleShape)
                    )
                    Spacer(Modifier.width(12.dp))
                    Text(targetUser.second, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(Modifier.height(16.dp))

                if (isSent) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Proposal Sent! 💕", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text("Waiting for response...", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp)
                } else {
                    // Type selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("CP" to "💑 Couple", "BFF" to "🤝 BFF", "Love" to "💕 Love").forEach { (type, label) ->
                            val isSel = type == selectedType
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSel) Color(0xFFEC4899) else Color.White.copy(alpha = 0.05f))
                                    .clickable { selectedType = type }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(Modifier.height(20.dp))

                    Button(
                        onClick = {
                            scope.launch {
                                try {
                                    val currentUid = Firebase.auth.currentUser?.uid ?: return@launch
                                    val db = Firebase.firestore
                                    db.collection("proposals").document("${currentUid}_${targetUser.first}").set(
                                        mapOf(
                                            "fromUid" to currentUid,
                                            "toUid" to targetUser.first,
                                            "type" to selectedType,
                                            "status" to "pending",
                                            "timestamp" to FieldValue.serverTimestamp()
                                        )
                                    ).await()
                                    isSent = true
                                } catch (_: Exception) {}
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Send $selectedType Proposal", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun WeeklyStarDialog(visible: Boolean, onDismiss: () -> Unit) {
    if (!visible) return
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = Color.White)
            }
        },
        title = {
            Text("Weekly Star Rewards", color = Color.White)
        },
        text = {
            Text("Weekly Star rewards and leaderboard placeholder. Coming soon!", color = Color.White.copy(alpha = 0.8f))
        },
        containerColor = Color(0xFF150824),
        titleContentColor = Color.White,
        textContentColor = Color.White
    )
}
