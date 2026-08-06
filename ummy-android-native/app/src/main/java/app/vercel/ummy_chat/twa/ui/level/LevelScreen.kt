package app.vercel.ummy_chat.twa.ui.level

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
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
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

// React Native level/index.tsx → Kotlin Compose (EXACT PARITY)

private data class LevelItem(
    val range: String,
    val level: Int,
    val imageUrl: String? = null
)

private val DEFAULT_BUDGET_LEVELS = listOf(
    LevelItem("Lv.0-10", 5), LevelItem("Lv.11-20", 15), LevelItem("Lv.21-30", 25),
    LevelItem("Lv.31-40", 35), LevelItem("Lv.41-50", 45), LevelItem("Lv.51-60", 55),
    LevelItem("Lv.61-70", 65), LevelItem("Lv.71-80", 75), LevelItem("Lv.81-90", 85),
    LevelItem("Lv.91-100", 95)
)

private fun calculateLevelProgress(totalSpent: Long): Triple<Int, Int, Float> {
    val levels = listOf(
        0L, 5000L, 20000L, 50000L, 150000L, 400000L, 800000L, 1500000L, 3000000L, 6000000L, Long.MAX_VALUE
    )
    var level = 1
    for (i in 1 until levels.size) {
        if (totalSpent < levels[i]) {
            level = i
            val progress = ((totalSpent - levels[i - 1]).toFloat() / (levels[i] - levels[i - 1]).toFloat()).coerceIn(0f, 1f)
            val remaining = (levels[i] - totalSpent).coerceAtLeast(0)
            return Triple(level, remaining.toInt(), progress * 100f)
        }
    }
    return Triple(10, 0, 100f)
}

@Composable
fun LevelScreen(onBack: () -> Unit) {
    val purple600 = Color(0xFF9333EA)
    val purple500 = Color(0xFF8B5CF6)
    val purple200 = Color(0xFFE9D5FF)
    val darkText = Color(0xFF1F2937)

    var levels by remember { mutableStateOf<List<LevelItem>>(emptyList()) }
    var totalSpent by remember { mutableLongStateOf(0L) }
    var username by remember { mutableStateOf("User") }
    var avatarUrl by remember { mutableStateOf<String?>(null) }
    var showRules by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }

    val uid = FirebaseAuth.getInstance().currentUser?.uid

    // Load data
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        val fs = FirebaseFirestore.getInstance()

        // User profile
        fs.collection("users").document(uid).get()
            .addOnSuccessListener { doc ->
                val wallet = doc.get("wallet")
totalSpent = when (wallet) {
    is Map<*, *> -> (wallet["totalSpent"] as? Number)?.toLong() ?: 0L
    is Number -> wallet.toLong()
    else -> 0L
}
                username = doc.getString("username") ?: "User"
                avatarUrl = doc.getString("avatarUrl")
            }

        // Levels collection
        fs.collection("levels")
            .orderBy("updatedAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snap ->
                levels = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    LevelItem(
                        range = data["range"] as? String ?: "",
                        level = (data["level"] as? Number)?.toInt() ?: 0,
                        imageUrl = data["imageUrl"] as? String ?: data["image"] as? String
                    )
                }
                loading = false
            }
            .addOnFailureListener { loading = false }
    }

    val (currentLevel, remaining, progressPercent) = calculateLevelProgress(totalSpent)
    val nextLevel = currentLevel + 1
    val budgetLevels = levels.filter { it.range.isNotBlank() }.ifEmpty { DEFAULT_BUDGET_LEVELS }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        // Top gradient overlay
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color(0xFF8B5CF6).copy(alpha = 0.12f))
        )

        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L14-22)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .clickable { onBack() }
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = darkText, modifier = Modifier.size(24.dp))
                }
                Text("Levels", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF7C3AED), letterSpacing = 2.sp)
                Spacer(modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .clickable { showRules = true }
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.HelpOutline, null, tint = Color(0xFFFDE68A), modifier = Modifier.size(20.dp))
                }
            }

            // Content (React Native L24-end)
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 80.dp)
            ) {
                // Profile Card (React Native L26-58)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(12.dp, RoundedCornerShape(20.dp))
                        .clip(RoundedCornerShape(20.dp))
                        .background(purple600)
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Avatar
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFEDE9FE)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (avatarUrl != null) {
                                AsyncImage(model = avatarUrl, contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                            } else {
                                Icon(Icons.Default.Person, null, tint = purple500, modifier = Modifier.size(28.dp))
                            }
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("WELCOME BACK", fontSize = 10.sp, color = purple200, letterSpacing = 1.5.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(username, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, letterSpacing = 0.5.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            // Progress Bar
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(10.dp)
                                        .clip(RoundedCornerShape(5.dp))
                                        .background(Color.Black.copy(alpha = 0.2f))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(fraction = progressPercent / 100f)
                                            .clip(RoundedCornerShape(5.dp))
                                            .background(Color.White)
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Lv.$currentLevel", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Need $remaining Exp for Lv.$nextLevel", fontSize = 11.sp, color = purple200, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                if (loading) {
                    Box(modifier = Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = purple500, modifier = Modifier.size(24.dp))
                    }
                } else {
                    // Budget Section (React Native L62-78)
                    Spacer(modifier = Modifier.height(24.dp))
                    Text("BUDGET", fontSize = 15.sp, fontWeight = FontWeight.Black, color = darkText, letterSpacing = 2.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    budgetLevels.forEach { item ->
                        BudgetGridItem(item = item, currentLevel = currentLevel)
                    }
                }
            }
        }

        // Rules Modal (React Native L82-104)
        if (showRules) {
            AlertDialog(
                onDismissRequest = { showRules = false },
                title = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Rules", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7C3AED))
                        IconButton(onClick = { showRules = false }) { Text("✕", fontSize = 16.sp, color = Color(0xFF64748B)) }
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        RuleRow("Gift coins consumption:", "5 coins = 1 Exp")
                        RuleRow("SVIP2:", "5 coins = 1.2 EXP")
                        RuleRow("SVIP7:", "5 coins = 1.3 EXP")
                        RuleRow("Enter the room:", "2000 Exp/day")
                        RuleRow("Share the room:", "2000 Exp/day")
                        RuleRow("Stay in your own room:", "10mins = 1000 Exp, 10000 Exp/day")
                        RuleRow("Stay in other rooms:", "10mins = 1000 Exp, 20000 Exp/day")
                        RuleRow("Participate in activities:", "Speed up upgrade")
                    }
                },
                confirmButton = {},
                containerColor = Color.White,
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}

@Composable
private fun BudgetGridItem(item: LevelItem, currentLevel: Int) {
    val isHighlighted = item.level in (currentLevel - 5)..currentLevel
    Box(
        modifier = Modifier
            .padding(bottom = 8.dp)
            .fillMaxWidth()
            .height(110.dp)
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, if (isHighlighted) Color(0xFF8B5CF6) else Color(0xFFE2E8F0), RoundedCornerShape(14.dp))
            .background(Color(0xFF090D1F))
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Level Image from Firestore or fallback
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1E293B)),
                contentAlignment = Alignment.Center
            ) {
                if (!item.imageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = item.imageUrl,
                        contentDescription = "Level ${item.level}",
                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Text("Lv.${item.level}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF64748B).copy(alpha = 0.8f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(item.range, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White, letterSpacing = 1.sp)
            }
        }
    }
}

@Composable
private fun RuleRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7C3AED), modifier = Modifier.weight(1f))
        Text(value, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFD97706))
    }
}
