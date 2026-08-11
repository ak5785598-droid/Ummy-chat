package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.ui.components.SvipPillBadge
import app.vercel.ummy_chat.twa.ui.profile.UserLevelBadge
import app.vercel.ummy_chat.twa.ui.profile.OfficialTag
import app.vercel.ummy_chat.twa.ui.profile.SuperAdminTag
import app.vercel.ummy_chat.twa.ui.profile.ManagerTag
import app.vercel.ummy_chat.twa.ui.profile.AuditorTag
import app.vercel.ummy_chat.twa.ui.profile.AdminTag
import app.vercel.ummy_chat.twa.ui.profile.SellerTag
import app.vercel.ummy_chat.twa.ui.profile.ServiceTag
import app.vercel.ummy_chat.twa.ui.profile.HostTag
import app.vercel.ummy_chat.twa.ui.profile.CSLeaderTag
import app.vercel.ummy_chat.twa.ui.profile.CustomerServiceTag
import app.vercel.ummy_chat.twa.ui.profile.SVGA_GlossyID
import app.vercel.ummy_chat.twa.ui.profile.ActiveIDBadge
import app.vercel.ummy_chat.twa.ui.profile.SovereignIDBadge
import kotlinx.coroutines.tasks.await
import com.google.firebase.firestore.FirebaseFirestore

// ─────────────────────────────────────────────────────────────────────────────
// RoomProfileCard — mirrors RN room-profile-card.tsx
// Bottom-sheet style user profile card with: avatar, CP partner, medals,
// fan count, social actions, admin controls (mute/kick/lock/ban)
// ─────────────────────────────────────────────────────────────────────────────

private val COUNTRY_FLAGS = mapOf(
    "india" to "🇮🇳", "pakistan" to "🇵🇰", "bangladesh" to "🇧🇩", "nepal" to "🇳🇵",
    "usa" to "🇺🇸", "uk" to "🇬🇧", "canada" to "🇨🇦", "australia" to "🇦🇺",
    "germany" to "🇩🇪", "france" to "🇫🇷", "japan" to "🇯🇵", "china" to "🇨🇳",
    "uae" to "🇦🇪", "saudi_arabia" to "🇸🇦", "indonesia" to "🇮🇩",
    "philippines" to "🇵🇭", "thailand" to "🇹🇭", "malaysia" to "🇲🇾"
)

private val COUNTRY_CODES = mapOf(
    "india" to "IND", "pakistan" to "PAK", "bangladesh" to "BGD", "nepal" to "NPL",
    "usa" to "USA", "uk" to "GBR", "canada" to "CAN", "australia" to "AUS",
    "germany" to "DEU", "france" to "FRA", "japan" to "JPN", "china" to "CHN",
    "uae" to "ARE", "saudi_arabia" to "SAU", "indonesia" to "IDN",
    "philippines" to "PHL", "thailand" to "THA", "malaysia" to "MYS"
)

data class RoomProfileUser(
    val uid: String,
    val name: String,
    val avatarUrl: String,
    val accountNumber: String = "",
    val gender: String? = null,
    val isInSeat: Boolean = false,
    val seatIndex: Int = -1,
    val isMuted: Boolean = false,
    val country: String? = null,
    val fansCount: Int = 0,
    val level: Int = 1,
    val svip: Int = 0,
    val medals: List<String> = emptyList(),
    val tags: List<String> = emptyList(),
    val hasCpPartner: Boolean = false,
    val partnerAvatarUrl: String? = null,
    val cpLevel: Int = 1
)

// Animated pulsing heart badge for CP couples
@Composable
private fun CpHeartBadge(cpLevel: Int) {
    val pulse by rememberInfiniteTransition(label = "cp_pulse").animateFloat(
        initialValue = 1f, targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "pulse"
    )
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .scale(pulse)
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFFF43F5E).copy(alpha = 0.12f))
                .border(1.dp, Color(0xFFF43F5E).copy(alpha = 0.25f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("❤️", fontSize = 14.sp, fontWeight = FontWeight.Black)
        }
        if (cpLevel > 0) {
            Text(
                "Lv.$cpLevel",
                fontSize = 10.sp, color = Color(0xFFF43F5E),
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
fun RoomProfileCard(
    user: RoomProfileUser?,
    isOwner: Boolean = false,
    isModerator: Boolean = false,
    isMe: Boolean = false,
    canManage: Boolean = false,
    isBanned: Boolean = false,
    isLocked: Boolean = false,
    onDismiss: () -> Unit,
    onSendMessage: ((String) -> Unit)? = null,
    onFollow: ((String) -> Unit)? = null,
    onReport: ((String) -> Unit)? = null,
    onMute: ((String, Boolean) -> Unit)? = null,
    onKick: ((String) -> Unit)? = null,
    onLeaveSeat: ((String) -> Unit)? = null,
    onToggleMod: ((String) -> Unit)? = null,
    onSendGift: ((String) -> Unit)? = null,
    onMention: ((String) -> Unit)? = null,
    onLockSeat: ((Int) -> Unit)? = null,
    onBan: ((String) -> Unit)? = null,
    onViewProfile: ((String) -> Unit)? = null,
    onEcho: ((String) -> Unit)? = null,
    onPropose: ((String) -> Unit)? = null
) {
    if (user == null) return

    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current
    var showMoreMenu by remember { mutableStateOf(false) }
    var fullProfile by remember { mutableStateOf<Map<String, Any>?>(null) }
    var realTimeFans by remember { mutableIntStateOf(0) }
    var firestoreMedals by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    // Fetch full profile from Firestore
    LaunchedEffect(user.uid) {
        try {
            val snap = FirebaseFirestore.getInstance()
                .collection("users").document(user.uid).get().await()
            fullProfile = snap?.data
        } catch (_: Exception) {}
    }

    // Real-time fans count from followers collection
    LaunchedEffect(user.uid) {
        try {
            val followersRef = FirebaseFirestore.getInstance()
                .collection("followers")
                .whereEqualTo("followingId", user.uid)
            followersRef.addSnapshotListener { snap, _ ->
                realTimeFans = snap?.size() ?: 0
            }
        } catch (_: Exception) {}
    }

    // Fetch medals list from medalsList collection
    LaunchedEffect(Unit) {
        try {
            val snap = FirebaseFirestore.getInstance()
                .collection("medalsList").get().await()
            firestoreMedals = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
        } catch (_: Exception) {}
    }

    val profileTags = remember(fullProfile) {
        (fullProfile?.get("tags") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
    }
    val profileSvip = remember(fullProfile) {
        (fullProfile?.get("svip") as? Number)?.toInt() ?: 0
    }
    val profileMedals = remember(fullProfile) {
        (fullProfile?.get("medals") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
    }
    val profileCountry = remember(fullProfile) {
        fullProfile?.get("country") as? String
    }
    val profileAccountNumber = remember(fullProfile) {
        (fullProfile?.get("accountNumber") as? Number)?.toString()
            ?: fullProfile?.get("accountNumber") as? String ?: ""
    }
    val profileIdColor = remember(fullProfile) {
        fullProfile?.get("idColor") as? String
    }
    val profileIsActiveId = remember(fullProfile) {
        fullProfile?.get("activeIdBadge") as? Map<*, *>
    }
    val profileIsAdmin = remember(fullProfile) {
        fullProfile?.get("isAdmin") as? Boolean ?: false
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.BottomCenter
        ) {
            // Dismiss tap area
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(onClick = onDismiss)
            )

            // Sheet
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                    .background(Color.White)
                    .padding(bottom = 28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ── Avatar area (overlapping top) ──────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                ) {
                    // Header top bar (more menu + close)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (canManage || !isMe) {
                            Box {
                                IconButton(
                                    onClick = { showMoreMenu = !showMoreMenu },
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFE2E8F0))
                                ) {
                                    Icon(Icons.Default.MoreVert, contentDescription = "More",
                                        tint = Color(0xFF64748B), modifier = Modifier.size(18.dp))
                                }
                                DropdownMenu(
                                    expanded = showMoreMenu,
                                    onDismissRequest = { showMoreMenu = false }
                                ) {
                                    if (canManage && onToggleMod != null) {
                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    if (isModerator) "Demote" else "Set Admin",
                                                    color = Color(0xFF7C3AED), fontWeight = FontWeight.Bold
                                                )
                                            },
                                            onClick = { showMoreMenu = false; onDismiss(); onToggleMod(user.uid) }
                                        )
                                    }
                                    if (canManage && onBan != null) {
                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    if (isBanned) "Unban" else "Ban",
                                                    color = Color(0xFFDC2626), fontWeight = FontWeight.Bold
                                                )
                                            },
                                            onClick = { showMoreMenu = false; onDismiss(); onBan(user.uid) }
                                        )
                                    }
                                    if (!isMe && onReport != null) {
                                        DropdownMenuItem(
                                            text = { Text("Report User", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold) },
                                            onClick = { showMoreMenu = false; onDismiss(); onReport(user.uid) }
                                        )
                                    }
                                }
                            }
                        } else {
                            Spacer(Modifier.size(34.dp))
                        }
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE2E8F0))
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close",
                                tint = Color(0xFF64748B), modifier = Modifier.size(18.dp))
                        }
                    }
                }

                // ── Avatar row (single or CP pair) ────────────────────────
                if (user.hasCpPartner && user.partnerAvatarUrl != null) {
                    Row(
                        modifier = Modifier.offset(y = (-24).dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        // User avatar
                        AsyncImage(
                            model = user.avatarUrl,
                            contentDescription = user.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .border(3.dp, Color.White, CircleShape)
                                .clickable { onDismiss(); onViewProfile?.invoke(user.uid) }
                        )
                        // CP heart badge
                        Spacer(Modifier.width(4.dp))
                        CpHeartBadge(user.cpLevel)
                        Spacer(Modifier.width(4.dp))
                        // Partner avatar
                        AsyncImage(
                            model = user.partnerAvatarUrl,
                            contentDescription = "Partner",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(62.dp)
                                .clip(CircleShape)
                                .border(3.dp, Color.White, CircleShape)
                        )
                    }
                } else {
                    AsyncImage(
                        model = user.avatarUrl,
                        contentDescription = user.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .offset(y = (-24).dp)
                            .size(96.dp)
                            .clip(CircleShape)
                            .border(3.dp, Color.White, CircleShape)
                            .clickable { onDismiss(); onViewProfile?.invoke(user.uid) }
                    )
                }

                Spacer(Modifier.height(4.dp))

                // ── Name + gender + country ───────────────────────────────
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Text(
                        user.name,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF1E293B)
                    )
                    Spacer(Modifier.width(6.dp))
                    // Gender icon
                    val isFemale = user.gender == "female"
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(if (isFemale) Color(0xFFFCE7F3) else Color(0xFFDBEAFE)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (isFemale) "♀" else "♂",
                            fontSize = 11.sp,
                            color = if (isFemale) Color(0xFFDB2777) else Color(0xFF2563EB),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    // Country
                    val displayCountry = profileCountry ?: user.country
                    if (displayCountry != null) {
                        Spacer(Modifier.width(6.dp))
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(horizontal = 8.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(COUNTRY_FLAGS[displayCountry] ?: "🌍", fontSize = 12.sp)
                            Spacer(Modifier.width(4.dp))
                            Text(
                                COUNTRY_CODES[displayCountry] ?: displayCountry.uppercase(),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                    // User Level Badge
                    if (user.level > 0) {
                        Spacer(Modifier.width(6.dp))
                        UserLevelBadge(level = user.level, scale = 1.1f)
                    }
                }

                Spacer(Modifier.height(4.dp))

                // ── Tags row ──────────────────────────────────────────────
                val hasAnyTag = profileTags.any { tag ->
                    tag in listOf("Official", "Super Admin", "Manager", "Auditor", "Admin",
                        "Seller", "Seller center", "Coin Seller", "CS Leader",
                        "Customer Service", "Service", "Host")
                }
                if (hasAnyTag) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        if (profileTags.any { it.contains("Official", true) }) OfficialTag()
                        if ("Super Admin" in profileTags) SuperAdminTag()
                        if ("Manager" in profileTags) ManagerTag()
                        if ("Auditor" in profileTags) AuditorTag()
                        if ("Admin" in profileTags) AdminTag()
                        if (profileTags.any { it in listOf("Seller", "Seller center", "Coin Seller") }) SellerTag()
                        if ("CS Leader" in profileTags) CSLeaderTag()
                        if ("Customer Service" in profileTags) CustomerServiceTag()
                        if ("Service" in profileTags) ServiceTag()
                        if ("Host" in profileTags) HostTag()
                    }
                }

                // ── ID badge (copyable) — SVG badges like RN ─────────────
                val displayId = profileAccountNumber.ifEmpty { user.accountNumber }
                val hasOfficialTag = profileTags.any { it.contains("Official", true) }
                val isBudgetId = fullProfile?.get("isBudgetId") as? Boolean ?: false
                val idColor = profileIdColor

                Box(
                    modifier = Modifier.clickable {
                        clipboard.setText(AnnotatedString(displayId))
                    },
                    contentAlignment = Alignment.Center
                ) {
                    if (hasOfficialTag) {
                        SVGA_GlossyID(label = "ID: $displayId")
                    } else if (profileIsActiveId != null) {
                        ActiveIDBadge(badgeData = profileIsActiveId, fallbackNumber = displayId)
                    } else if (profileIsAdmin || (isBudgetId && idColor != null && idColor != "none")) {
                        SovereignIDBadge(
                            color = if (profileIsAdmin) "gold" else idColor ?: "gold",
                            number = displayId
                        )
                    } else {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFF1F5F9))
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "ID: $displayId",
                                fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569)
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.Default.ContentCopy, contentDescription = "Copy",
                                tint = Color(0xFF94A3B8), modifier = Modifier.size(12.dp))
                        }
                    }
                }

                // ── SVIP Badge + Medals Row ──────────────────────────────
                val displaySvip = if (profileSvip > 0) profileSvip else user.svip
                val displayMedals = if (profileMedals.isNotEmpty()) profileMedals else user.medals

                if (displaySvip > 0 || displayMedals.isNotEmpty()) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (displaySvip > 0) {
                            SvipPillBadge(level = displaySvip)
                        }
                        // Medals (show max 5)
                        displayMedals.take(5).forEach { medalId ->
                            val medalData = firestoreMedals.find { it["id"] == medalId }
                            val medalImageUrl = medalData?.get("imageUrl") as? String
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F9))
                                    .border(1.dp, Color(0xFFE2E8F0), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                if (medalImageUrl != null) {
                                    AsyncImage(
                                        model = medalImageUrl,
                                        contentDescription = "Medal",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.size(32.dp)
                                    )
                                } else {
                                    Text("\uD83C\uDFC5", fontSize = 16.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(6.dp))

                // ── Fans + Gift button ────────────────────────────────────
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        "$realTimeFans FANS",
                        fontSize = 11.sp, fontWeight = FontWeight.Black,
                        color = Color(0xFF94A3B8)
                    )
                    if (onSendGift != null && !isMe) {
                        Spacer(Modifier.width(10.dp))
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(
                                    Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)))
                                )
                                .clickable { onDismiss(); onSendGift(user.uid) },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CardGiftcard, contentDescription = "Gift",
                                tint = Color.White, modifier = Modifier.size(14.dp))
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                // ── User action buttons ───────────────────────────────────
                if (!isMe) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(20.dp, Alignment.CenterHorizontally),
                        modifier = Modifier.padding(horizontal = 24.dp)
                    ) {
                        // Message
                        if (onSendMessage != null) {
                            ActionChip(
                                label = "Msg",
                                icon = Icons.Default.Message,
                                color = Color(0xFF2563EB),
                                onClick = { onSendMessage(user.uid) }
                            )
                        }
                        // Follow
                        if (onFollow != null) {
                            ActionChip(
                                label = "Follow",
                                icon = Icons.Default.Favorite,
                                color = Color(0xFFA855F7),
                                onClick = { onFollow(user.uid) }
                            )
                        }
                        // Mention
                        if (onMention != null) {
                            IconActionCircle(
                                icon = Icons.Default.AlternateEmail,
                                bg = Color(0xFFF1F5F9),
                                tint = Color(0xFF475569),
                                onClick = { onDismiss(); onMention(user.name) }
                            )
                        }
                        // Echo
                        if (onEcho != null) {
                            IconActionCircle(
                                icon = Icons.Default.AutoAwesome,
                                bg = Color(0xFFFAF5FF),
                                tint = Color(0xFF8B5CF6),
                                onClick = { onDismiss(); onEcho(user.uid) }
                            )
                        }
                        // Propose
                        if (onPropose != null) {
                            IconActionCircle(
                                icon = Icons.Default.Bolt,
                                bg = Color(0xFFFFF1F2),
                                tint = Color(0xFFEC4899),
                                onClick = { onDismiss(); onPropose(user.uid) }
                            )
                        }
                    }
                }

                // ── "Leave Seat" for self ─────────────────────────────────
                if (isMe && user.isInSeat && onLeaveSeat != null) {
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { onLeaveSeat(user.uid); onDismiss() },
                        modifier = Modifier
                            .fillMaxWidth(0.65f)
                            .height(44.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00E676)),
                        shape = RoundedCornerShape(18.dp)
                    ) {
                        Icon(Icons.Default.MicOff, contentDescription = null,
                            tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("SEAT LEAVE", color = Color.White,
                            fontWeight = FontWeight.Black, fontSize = 12.sp)
                    }
                }

                // ── Admin controls (manage panel) ─────────────────────────
                if (canManage && !isMe && !isOwner) {
                    Spacer(Modifier.height(12.dp))
                    Divider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AdminTextBtn(
                            label = if (user.isMuted) "Unmute" else "Mute",
                            color = Color(0xFF3B82F6),
                            onClick = { onMute?.invoke(user.uid, user.isMuted); onDismiss() }
                        )
                        Text("|", color = Color(0xFFE2E8F0), fontSize = 18.sp)
                        AdminTextBtn(
                            label = "Leave",
                            color = if (user.isInSeat) Color(0xFFF97316) else Color(0xFFCBD5E1),
                            enabled = user.isInSeat,
                            onClick = { onLeaveSeat?.invoke(user.uid); onDismiss() }
                        )
                        Text("|", color = Color(0xFFE2E8F0), fontSize = 18.sp)
                        AdminTextBtn(
                            label = if (isLocked) "Unlock" else "Lock",
                            color = if (user.isInSeat) Color(0xFF6366F1) else Color(0xFFCBD5E1),
                            enabled = user.isInSeat,
                            onClick = {
                                if (user.isInSeat) onLockSeat?.invoke(user.seatIndex)
                                onDismiss()
                            }
                        )
                        Text("|", color = Color(0xFFE2E8F0), fontSize = 18.sp)
                        AdminTextBtn(
                            label = "Kick",
                            color = Color(0xFFEF4444),
                            onClick = { onKick?.invoke(user.uid); onDismiss() }
                        )
                    }
                }
            }
        }
    }
}

// ── Helper composables ────────────────────────────────────────────────────────

@Composable
private fun ActionChip(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(13.dp))
        Text(label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun IconActionCircle(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    bg: Color,
    tint: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(38.dp)
            .clip(CircleShape)
            .background(bg)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(17.dp))
    }
}

@Composable
private fun AdminTextBtn(
    label: String,
    color: Color,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Text(
        label,
        fontSize = 10.sp,
        fontWeight = FontWeight.Black,
        color = if (enabled) color else Color(0xFFCBD5E1),
        modifier = Modifier.clickable(enabled = enabled, onClick = onClick)
    )
}
