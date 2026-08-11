package app.vercel.ummy_chat.twa.ui.families

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.painterResource
import app.vercel.ummy_chat.twa.R
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import app.vercel.ummy_chat.twa.util.CdnUtils

data class FamilyModel(
    val id: String = "",
    val name: String = "",
    val totalWealth: Long = 0,
    val dailyWealth: Long = 0,
    val weeklyWealth: Long = 0,
    val monthlyWealth: Long = 0,
    @com.google.firebase.firestore.PropertyName("memberCount")
    val memberCount: Int = 0,
    val capacity: Int = 100,
    val bannerUrl: String? = null,
    @get:com.google.firebase.firestore.PropertyName("isVerified")
    @com.google.firebase.firestore.PropertyName("isVerified")
    val isVerified: Boolean = false,
    val level: Int = 1,
    val ownerId: String = "",
    val ownerName: String = "",
    val admins: List<String> = emptyList(),
    val members: List<String> = emptyList(),
    val bio: String = "",
    val announcement: String = "",
    val contributions: Map<String, Long> = emptyMap()
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamiliesScreen(
    onBack: () -> Unit,
    onOpenFamily: (String) -> Unit
) {
    var activeTab by remember { mutableStateOf("total") }
    var searchQuery by remember { mutableStateOf("") }
    var showInfo by remember { mutableStateOf(false) }

    var primaryFamilies by remember { mutableStateOf<List<FamilyModel>>(emptyList()) }
    var fallbackFamilies by remember { mutableStateOf<List<FamilyModel>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    // Primary query
    DisposableEffect(activeTab) {
        loading = true
        val fs = FirebaseFirestore.getInstance()
        val orderByField = when(activeTab) {
            "daily" -> "dailyWealth"
            "weekly" -> "weeklyWealth"
            "monthly" -> "monthlyWealth"
            else -> "totalWealth"
        }
        val primaryListener = fs.collection("families")
            .orderBy(orderByField, Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                primaryFamilies = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    FamilyModel(
                        id = doc.id,
                        name = data["name"] as? String ?: "Family",
                        totalWealth = (data["totalWealth"] as? Number)?.toLong() ?: 0L,
                        dailyWealth = (data["dailyWealth"] as? Number)?.toLong() ?: 0L,
                        weeklyWealth = (data["weeklyWealth"] as? Number)?.toLong() ?: 0L,
                        monthlyWealth = (data["monthlyWealth"] as? Number)?.toLong() ?: 0L,
                        memberCount = (data["memberCount"] as? Number)?.toInt() ?: 0,
                        capacity = (data["capacity"] as? Number)?.toInt() ?: 100,
                        bannerUrl = data["bannerUrl"] as? String ?: data["avatarUrl"] as? String,
                        isVerified = data["isVerified"] as? Boolean ?: false,
                        level = (data["level"] as? Number)?.toInt() ?: 1
                    )
                } ?: emptyList()
                loading = false
            }
        onDispose { primaryListener.remove() }
    }

    // Fallback query
    DisposableEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        val fallbackListener = fs.collection("families")
            .orderBy("totalWealth", Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                fallbackFamilies = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    FamilyModel(
                        id = doc.id,
                        name = data["name"] as? String ?: "Family",
                        totalWealth = (data["totalWealth"] as? Number)?.toLong() ?: 0L,
                        dailyWealth = (data["dailyWealth"] as? Number)?.toLong() ?: 0L,
                        weeklyWealth = (data["weeklyWealth"] as? Number)?.toLong() ?: 0L,
                        monthlyWealth = (data["monthlyWealth"] as? Number)?.toLong() ?: 0L,
                        memberCount = (data["memberCount"] as? Number)?.toInt() ?: 0,
                        capacity = (data["capacity"] as? Number)?.toInt() ?: 100,
                        bannerUrl = data["bannerUrl"] as? String ?: data["avatarUrl"] as? String,
                        isVerified = data["isVerified"] as? Boolean ?: false,
                        level = (data["level"] as? Number)?.toInt() ?: 1
                    )
                } ?: emptyList()
            }
        onDispose { fallbackListener.remove() }
    }

    val families = remember(activeTab, primaryFamilies, fallbackFamilies) {
        if (activeTab == "total") {
            if (primaryFamilies.isNotEmpty()) primaryFamilies else fallbackFamilies
        } else {
            if (primaryFamilies.isNotEmpty()) primaryFamilies else fallbackFamilies
        }
    }

    val filteredFamilies = remember(families, searchQuery) {
        val query = searchQuery.lowercase()
        families.filter { it.name.lowercase().contains(query) || it.id.lowercase().contains(query) }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF03000F))) {
        // Animated Canvas Background
        FamilyBackground()

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .offset(y = (-24).dp)
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0x14FFFFFF))
                        .border(1.dp, Color(0x1EFFFFFF), CircleShape)
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Back", tint = Color(0xD9FFFFFF), modifier = Modifier.size(20.dp))
                }

                Column(modifier = Modifier.weight(1f).offset(y = (-10).dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Social Kings", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    }
                    Text("Conquer the leaderboard with your clan", color = Color(0x66FFFFFF), fontSize = 7.5.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Visible)
                }

                Box(
                    modifier = Modifier
                        .offset(y = (-24).dp)
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0x26FBBF24))
                        .clickable { showInfo = true },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Info, contentDescription = "Info", tint = Color(0xFFFBBF24), modifier = Modifier.size(16.dp))
                }

                Box(
                    modifier = Modifier
                        .offset(y = (-24).dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Brush.horizontalGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFA855F7))))
                        .clickable { /* TODO Handle Create */ }
                        .padding(horizontal = 14.dp, vertical = 9.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                        Text("CREATE", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
                    }
                }
            }

            // Search Bar
            Box(modifier = Modifier.padding(horizontal = 14.dp).padding(bottom = 16.dp).offset(y = (-8).dp)) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search clans & dynasties...", color = Color(0x40FFFFFF), fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0x80FBBF24), modifier = Modifier.size(16.dp)) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0x33FBBF24),
                        unfocusedBorderColor = Color(0x33FBBF24),
                        unfocusedContainerColor = Color(0x0FFFFFFF),
                        focusedContainerColor = Color(0x0FFFFFFF),
                        cursorColor = Color(0xFFFBBF24)
                    ),
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(16.dp)
                )
            }

            // Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-16).dp)
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0x14FFFFFF))
                        .border(1.dp, Color(0x1EFFFFFF), RoundedCornerShape(20.dp))
                        .padding(3.dp)
                ) {
                    listOf("daily", "weekly", "monthly", "total").forEach { tab ->
                        val isActive = activeTab == tab
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isActive) Color(0xFFA855F7) else Color.Transparent)
                                .clickable { activeTab = tab }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(
                                if (tab == "total") "All / Total" else tab.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() },
                                color = if (isActive) Color.White else Color(0x99FFFFFF),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }
            }


            // List
            if (loading) {
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 50.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Color(0xFFA855F7))
                    Text("SUMMONING CLANS...", color = Color(0x66FFFFFF), fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, modifier = Modifier.padding(top = 10.dp))
                }
            } else if (filteredFamilies.isEmpty()) {
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 50.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("⚔️", fontSize = 44.sp, modifier = Modifier.padding(bottom = 10.dp))
                    Text("NO CLANS FOUND", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Black)
                    Text("Be the first to forge a dynasty!", color = Color(0x4DFFFFFF), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                }
            } else {
                val top3 = filteredFamilies.take(3)
                val rest = filteredFamilies.drop(3)
                
                Column(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    top3.forEachIndexed { idx, family ->
                        FamilyListItem(idx = idx, family = family, activeTab = activeTab, onOpenFamily = onOpenFamily)
                    }
                }
                
                Spacer(modifier = Modifier.height(10.dp))
                
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(start = 14.dp, end = 14.dp, bottom = 40.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(rest) { idx, family ->
                        FamilyListItem(idx = idx + 3, family = family, activeTab = activeTab, onOpenFamily = onOpenFamily)
                    }
                }
            }
        }
    }

    // Info Modal
    if (showInfo) {
        AlertDialog(
            onDismissRequest = { showInfo = false },
            title = { Text("Family Ranking Info", fontWeight = FontWeight.Black, fontSize = 18.sp, color = Color(0xFF1E293B), modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Color(0xFFFEF3C7)).padding(14.dp)) {
                        Column {
                            Text("👨‍👩‍👧‍👦 Family Ranking", fontWeight = FontWeight.Bold, color = Color(0xFFD97706), modifier = Modifier.padding(bottom = 4.dp))
                            Text("Ranking is determined by the total Family Wealth of all members.", fontSize = 12.sp, color = Color(0xFF64748B), lineHeight = 18.sp)
                        }
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Color(0xFFFFFBEB)).border(1.dp, Color(0xFFFBBF24), RoundedCornerShape(16.dp)).padding(14.dp)) {
                        Column {
                            Text("🎁 Ranking Rewards", fontWeight = FontWeight.Bold, color = Color(0xFFB45309), modifier = Modifier.padding(bottom = 6.dp))
                            Text("Top 3: Exclusive Frames + Coins\nRank 4 - 7: Coins\nRank 8 - 10: Coins\n\nWeekly and Monthly rewards are 3x of Daily.", fontSize = 11.sp, color = Color(0xFF64748B), lineHeight = 18.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Box(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF0F172A)).clickable { showInfo = false }.padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("OK", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            },
            containerColor = Color.White,
            shape = RoundedCornerShape(24.dp)
        )
    }
}


@Composable
fun FamilyListItem(idx: Int, family: FamilyModel, activeTab: String, onOpenFamily: (String) -> Unit) {
    val isTop3 = idx < 3
    val rankColor = when (idx) {
        0 -> androidx.compose.ui.graphics.Color(0xFFFBBF24)
        1 -> androidx.compose.ui.graphics.Color(0xFF94A3B8)
        2 -> androidx.compose.ui.graphics.Color(0xFFF97316)
        else -> androidx.compose.ui.graphics.Color.Transparent
    }
    val rankEmoji = when (idx) {
        0 -> "🥇"
        1 -> "🥈"
        2 -> "🥉"
        else -> ""
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(androidx.compose.ui.graphics.Color(0x0DFFFFFF))
            .border(1.dp, if (isTop3) rankColor else androidx.compose.ui.graphics.Color(0x12FFFFFF), RoundedCornerShape(18.dp))
            .clickable { onOpenFamily(family.id) }
    ) {
        if (isTop3) {
            Box(modifier = Modifier.matchParentSize().background(
                androidx.compose.ui.graphics.Brush.horizontalGradient(listOf(rankColor.copy(alpha = 0.06f), androidx.compose.ui.graphics.Color.Transparent))
            ))
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Rank Badge
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .clip(CircleShape)
                    .background(androidx.compose.ui.graphics.Color(0x0DFFFFFF))
                    .border(1.dp, if (isTop3) rankColor else androidx.compose.ui.graphics.Color(0x1AFFFFFF), CircleShape)
                    .padding(end = 10.dp), // To space from avatar
                contentAlignment = Alignment.Center
            ) {
                if (isTop3) {
                    Text(rankEmoji, fontSize = 13.sp, modifier = Modifier.offset(x=5.dp))
                } else {
                    Text("${idx + 1}", color = if (idx < 10) androidx.compose.ui.graphics.Color(0xFFA78BFA) else androidx.compose.ui.graphics.Color(0x4DFFFFFF), fontSize = 11.sp, fontWeight = FontWeight.Black, modifier = Modifier.offset(x=5.dp))
                }
            }

            Spacer(modifier = Modifier.width(10.dp))

            // Banner
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .border(2.dp, if (isTop3) rankColor else androidx.compose.ui.graphics.Color(0x1AFFFFFF), RoundedCornerShape(14.dp))
            ) {
                coil.compose.AsyncImage(
                    model = app.vercel.ummy_chat.twa.util.CdnUtils.toCdn(family.bannerUrl) ?: "https://picsum.photos/seed/${family.id}/200",
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
                if (isTop3) {
                    Box(modifier = Modifier.fillMaxSize().background(rankColor.copy(alpha = 0.1f))) // Simple glow effect placeholder
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Info
            Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(
                        family.name,
                        color = if (isTop3) rankColor else androidx.compose.ui.graphics.Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (family.isVerified) {
                        Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFF4ADE80), modifier = Modifier.size(12.dp))
                    }
                }
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Icon(Icons.Default.Group, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0x73FFFFFF), modifier = Modifier.size(9.dp))
                        Text("${family.memberCount}", color = androidx.compose.ui.graphics.Color(0x73FFFFFF), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("·", color = androidx.compose.ui.graphics.Color(0x33FFFFFF), fontSize = 10.sp)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Icon(Icons.Default.WorkspacePremium, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFFFBBF24), modifier = Modifier.size(9.dp))
                        Text("Lv.${family.level}", color = androidx.compose.ui.graphics.Color(0x73FFFFFF), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Power Score
            Column(horizontalAlignment = Alignment.End, modifier = Modifier.weight(1.2f).padding(end = 4.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Icon(Icons.Default.LocalFireDepartment, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFFF97316), modifier = Modifier.size(12.dp))
                    val score = when(activeTab) {
                        "daily" -> family.dailyWealth
                        "weekly" -> family.weeklyWealth
                        "monthly" -> family.monthlyWealth
                        else -> family.totalWealth
                    }
                    app.vercel.ummy_chat.twa.ui.components.AutoResizeText("%,d".format(score), color = androidx.compose.ui.graphics.Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                }
                Text("${activeTab.uppercase()} POWER", color = androidx.compose.ui.graphics.Color(0x40FFFFFF), fontSize = 7.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp, modifier = Modifier.padding(top = 1.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }

            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0x26FFFFFF), modifier = Modifier.size(16.dp).padding(start = 4.dp))
        }
    }
}
