package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// Medal Modal — EXACT RN PARITY
// Dark purple bg, 10-slot current medals, 3 tabs, 2-col grid, Firebase images
// ─────────────────────────────────────────────────────────────────────────────

private val BgDark = Color(0xFFFFFFFF)
private val CardBg = Color(0xFFF8F9FA)
private val GoldText = Color(0xFFCFB284)
private val AmberStar = Color(0xFFF59E0B)
private val SlotBg = Color(0xFFF1F5F9)
private val SlotBorder = Color(0xFFE2E8F0)
private val TabInactive = Color(0xFF94A3B8)
private val TextDim = Color(0xFF94A3B8)
private val TitleColor = Color(0xFF1E293B)
private val SubTitleColor = Color(0xFF64748B)

data class MedalItem(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val tier: String = "common",
    val category: String = "achievement",
    val imageUrl: String? = null,
    val updatedAt: Long = 0
)

@Composable
fun MedalModal(
    onDismissRequest: () -> Unit
) {
    val db = FirebaseFirestore.getInstance()
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    var activeTab by remember { mutableStateOf("Achievement") }
    var allMedals by remember { mutableStateOf(listOf<MedalItem>()) }
    var userMedalIds by remember { mutableStateOf(setOf<String>()) }
    var isLoading by remember { mutableStateOf(true) }

    // Fetch medals from Firestore
    LaunchedEffect(Unit) {
        try {
            // All medals — try medalsList first, fallback to medals
            var medalsSnap = db.collection("medalsList").get().await()
            if (medalsSnap.isEmpty) medalsSnap = db.collection("medals").get().await()
            allMedals = medalsSnap.documents.mapNotNull { doc ->
                val updatedAt = doc.getTimestamp("updatedAt")
                MedalItem(
                    id = doc.id,
                    name = doc.getString("name") ?: doc.getString("title") ?: "Medal",
                    description = doc.getString("description") ?: "",
                    tier = doc.getString("tier") ?: "common",
                    category = doc.getString("category") ?: "achievement",
                    imageUrl = doc.getString("imageUrl") ?: doc.getString("image"),
                    updatedAt = updatedAt?.toDate()?.time ?: 0
                )
            }.sortedByDescending { it.updatedAt }

            // Also fetch from "medals" collection and merge (avoid duplicates)
            try {
                val medalsSnap2 = db.collection("medals").get().await()
                val existingIds = allMedals.map { it.id }.toSet()
                val extraMedals = medalsSnap2.documents.mapNotNull { doc ->
                    if (doc.id in existingIds) return@mapNotNull null
                    // Skip medal with name exactly "official" (keep official-1, official-2)
                    val mName = doc.getString("name") ?: doc.getString("title") ?: ""
                    if (mName.equals("official", ignoreCase = true) || mName.equals("OFFICIAL", ignoreCase = true)) return@mapNotNull null
                    val updatedAt = doc.getTimestamp("updatedAt")
                    MedalItem(
                        id = doc.id,
                        name = doc.getString("name") ?: doc.getString("title") ?: "Medal",
                        description = doc.getString("description") ?: "",
                        tier = doc.getString("tier") ?: "common",
                        category = doc.getString("category") ?: "achievement",
                        imageUrl = doc.getString("imageUrl") ?: doc.getString("image"),
                        updatedAt = updatedAt?.toDate()?.time ?: 0
                    )
                }
                allMedals = (allMedals + extraMedals).sortedByDescending { it.updatedAt }
            } catch (_: Exception) {}

            // User's earned medal IDs
            if (uid.isNotEmpty()) {
                val profileSnap = db.collection("users").document(uid)
                    .collection("profile").document(uid).get().await()
                @Suppress("UNCHECKED_CAST")
                val medalIds = profileSnap.get("medals") as? List<String> ?: emptyList()
                userMedalIds = medalIds.toSet()
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    val filteredMedals = allMedals.filter { it.category.equals(activeTab, ignoreCase = true) }
    val obtainedMedals = allMedals.filter { it.id in userMedalIds }

    androidx.activity.compose.BackHandler { onDismissRequest() }

    Box(modifier = Modifier.fillMaxSize().background(BgDark)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ─── Header ─────────────────────────────────────────────────
            Row(modifier = Modifier.fillMaxWidth().statusBarsPadding().height(56.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = TitleColor, modifier = Modifier.size(24.dp).clickable { onDismissRequest() })
                Spacer(modifier = Modifier.weight(1f))
                Text("Medal", fontSize = 17.sp, fontWeight = FontWeight.Medium, color = TitleColor)
                Spacer(modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.size(24.dp))
            }

            // ─── Scrollable Content ─────────────────────────────────────
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).weight(1f).padding(bottom = 40.dp)) {

                // ─── "Current Medal" Divider ────────────────────────────
                Spacer(modifier = Modifier.height(24.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.height(1.dp).width(48.dp).background(Brush.horizontalGradient(listOf(Color.Transparent, GoldText.copy(alpha = 0.6f)))))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("CURRENT MEDAL", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = GoldText, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Box(modifier = Modifier.height(1.dp).width(48.dp).background(Brush.horizontalGradient(listOf(GoldText.copy(alpha = 0.6f), Color.Transparent))))
                }

                // ─── Current Medals Grid (5x2 = 10 slots) ───────────────
                Spacer(modifier = Modifier.height(24.dp))
                Column(modifier = Modifier.padding(horizontal = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(2) { row ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            repeat(5) { col ->
                                val index = row * 5 + col
                                val medal = obtainedMedals.getOrNull(index)
                                Box(modifier = Modifier.aspectRatio(1f).weight(1f).clip(RoundedCornerShape(12.dp)).background(SlotBg).border(1.dp, SlotBorder, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                                    if (medal != null && !medal.imageUrl.isNullOrBlank()) {
                                        AsyncImage(model = medal.imageUrl, contentDescription = medal.name, modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)), contentScale = ContentScale.Crop)
                                    } else {
                                        Text("+", fontSize = 20.sp, fontWeight = FontWeight.Light, color = SubTitleColor)
                                    }
                                }
                            }
                        }
                    }
                }

                // ─── Obtained Medal Count Pill ──────────────────────────
                Spacer(modifier = Modifier.height(32.dp))
                Box(modifier = Modifier.align(Alignment.CenterHorizontally).clip(RoundedCornerShape(25.dp)).border(1.dp, Color(0xFF3B82F6).copy(alpha = 0.3f), RoundedCornerShape(25.dp)).background(Brush.horizontalGradient(listOf(Color(0xFFEFF6FF), Color(0xFFDBEAFE), Color(0xFFEFF6FF)))).padding(horizontal = 24.dp, vertical = 6.dp)) {
                    Text("Obtained Medal(s): ${userMedalIds.size}", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF1E40AF))
                }

                // ─── Tab Bar ────────────────────────────────────────────
                Spacer(modifier = Modifier.height(24.dp))
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                    listOf("Achievement", "Gift", "Activity").forEach { tab ->
                        val isActive = activeTab == tab
                        Column(modifier = Modifier.clickable { activeTab = tab }.padding(vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(tab, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = if (isActive) Color(0xFFF59E0B) else TabInactive)
                            Spacer(modifier = Modifier.height(4.dp))
                            if (isActive) {
                                Box(modifier = Modifier.width(32.dp).height(2.dp).background(Color(0xFFF59E0B), RoundedCornerShape(1.dp)))
                            } else {
                                Spacer(modifier = Modifier.height(2.dp))
                            }
                        }
                    }
                }
                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFE2E8F0)))

                // ─── Medal Cards Grid (2 columns) ──────────────────────
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 80.dp), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = Color(0xFFF59E0B), modifier = Modifier.size(32.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("SYNCING MEDALS...", fontSize = 10.sp, fontWeight = FontWeight.Black, color = SubTitleColor, letterSpacing = 2.sp)
                        }
                    }
                } else {
                    if (filteredMedals.isEmpty()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(vertical = 80.dp), contentAlignment = Alignment.Center) {
                            Text("No medals available yet", fontSize = 10.sp, fontWeight = FontWeight.Black, color = SubTitleColor, letterSpacing = 2.sp)
                        }
                    } else {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            filteredMedals.chunked(2).forEach { row ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    row.forEach { medal ->
                                        MedalCard(medal = medal, isOwned = medal.id in userMedalIds, activeTab = activeTab, modifier = Modifier.weight(1f))
                                    }
                                    if (row.size < 2) {
                                        Spacer(modifier = Modifier.weight(1f))
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

@Composable
private fun MedalCard(medal: MedalItem, isOwned: Boolean, activeTab: String, modifier: Modifier = Modifier) {
    val isVideo = medal.imageUrl?.let {
        it.contains(".mp4") || it.contains("video") || it.contains(".webm") || it.contains(".mov") || it.contains("m3u8")
    } ?: false

    val stars = when (medal.tier) {
        "legendary" -> "★★★★★"
        "epic" -> "★★★★"
        "rare" -> "★★★"
        else -> "★★"
    }

    Box(modifier = modifier.clip(RoundedCornerShape(16.dp)).background(CardBg).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).then(if (!isOwned) Modifier.alpha(0.3f) else Modifier).padding(16.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            // Top shimmer line
            Box(modifier = Modifier.fillMaxWidth().height(2.dp).background(Brush.horizontalGradient(listOf(Color.Transparent, Color(0xFFCBD5E1), Color.Transparent))))

            Spacer(modifier = Modifier.height(8.dp))

            // Medal image
            Box(modifier = Modifier.size(96.dp), contentAlignment = Alignment.Center) {
                if (!medal.imageUrl.isNullOrBlank()) {
                    AsyncImage(model = medal.imageUrl, contentDescription = medal.name, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                } else {
                    // Fallback icon by category
                    val emoji = when (activeTab) {
                        "Achievement" -> "👑"
                        "Gift" -> "🎁"
                        else -> "⚡"
                    }
                    Text(emoji, fontSize = 40.sp)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Star rating
            Text(stars, fontSize = 10.sp, color = AmberStar, letterSpacing = 2.sp)

            Spacer(modifier = Modifier.height(4.dp))

            // Medal name
            Text(medal.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TitleColor, textAlign = TextAlign.Center, maxLines = 1, modifier = Modifier.fillMaxWidth())

            // Description
            if (medal.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(medal.description, fontSize = 9.sp, color = SubTitleColor, textAlign = TextAlign.Center, maxLines = 1, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}
