package app.vercel.ummy_chat.twa.ui.families

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

data class FamilyModel(
    val id: String = "",
    val name: String = "",
    val wealth: Long = 0,
    val membersCount: Int = 0,
    val capacity: Int = 100,
    val avatarUrl: String? = null,
    val level: Int = 1
)

@Composable
fun FamiliesScreen(
    onBack: () -> Unit,
    onOpenFamily: (String) -> Unit
) {
    var activeTab by remember { mutableStateOf("total") }
    val tabs = listOf("daily", "weekly", "monthly", "total")
    var families by remember { mutableStateOf<List<FamilyModel>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    DisposableEffect(activeTab) {
        val fs = FirebaseFirestore.getInstance()
        val orderByField = when(activeTab) {
            "daily" -> "stats.dailyWealth"
            "weekly" -> "stats.weeklyWealth"
            "monthly" -> "stats.monthlyWealth"
            else -> "wealth"
        }
        
        val listener = fs.collection("families")
            .orderBy(orderByField, Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                families = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    FamilyModel(
                        id = doc.id,
                        name = data["name"] as? String ?: "Family",
                        wealth = (data[if (activeTab == "total") "wealth" else "stats.${activeTab}Wealth"] as? Number)?.toLong() ?: 0L,
                        membersCount = (data["membersCount"] as? Number)?.toInt() ?: 0,
                        capacity = (data["capacity"] as? Number)?.toInt() ?: 100,
                        avatarUrl = data["avatarUrl"] as? String,
                        level = (data["level"] as? Number)?.toInt() ?: 1
                    )
                } ?: emptyList()
                loading = false
            }
        onDispose { listener.remove() }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF03000F))) {
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
            item { Header(onBack) }
            item { Tabs(activeTab, tabs) { activeTab = it } }

            if (loading) {
                item { Box(modifier = Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFF6366F1)) } }
            } else if (families.size >= 3) {
                item { Podium(families.take(3), onOpenFamily) }
                itemsIndexed(families.drop(3)) { idx, fam ->
                    FamilyRow(idx + 4, fam) { onOpenFamily(fam.id) }
                }
            } else {
                itemsIndexed(families) { idx, fam ->
                    FamilyRow(idx + 1, fam) { onOpenFamily(fam.id) }
                }
            }
        }
    }
}

@Composable
fun Header(onBack: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", color = Color.White, fontSize = 28.sp, modifier = Modifier.clickable { onBack() })
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text("👑 Family Leaderboard", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Text("Conquer the leaderboard with your clan", color = Color(0xFFFBBF24), fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun Tabs(activeTab: String, tabs: List<String>, onTabSelect: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFF1E1B4B)).padding(4.dp)
    ) {
        tabs.forEach { tab ->
            val isSelected = activeTab == tab
            Box(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(if (isSelected) Color(0xFF6366F1) else Color.Transparent).clickable { onTabSelect(tab) }.padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(tab.uppercase(), color = if (isSelected) Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }
    }
    Spacer(modifier = Modifier.height(14.dp))
}

@Composable
fun Podium(top3: List<FamilyModel>, onOpenFamily: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.Bottom
    ) {
        PodiumCard(top3[1], 2, Modifier.weight(1f).height(110.dp), Color(0xFF94A3B8), onOpenFamily)
        PodiumCard(top3[0], 1, Modifier.weight(1.1f).height(130.dp), Color(0xFFFBBF24), onOpenFamily)
        PodiumCard(top3[2], 3, Modifier.weight(1f).height(100.dp), Color(0xFFF97316), onOpenFamily)
    }
    Spacer(modifier = Modifier.height(16.dp))
}

@Composable
fun PodiumCard(fam: FamilyModel, rank: Int, modifier: Modifier, color: Color, onOpenFamily: (String) -> Unit) {
    val bg = if (rank == 1) Brush.verticalGradient(listOf(Color(0xFF78350F), Color(0xFF1E1B4B))) else Brush.linearGradient(listOf(Color(0xFF1E293B), Color(0xFF1E293B)))
    Box(
        modifier = modifier.clip(RoundedCornerShape(16.dp)).background(bg).border(1.5.dp, color, RoundedCornerShape(16.dp)).clickable { onOpenFamily(fam.id) }.padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${if(rank==1)"🥇" else if(rank==2)"🥈" else "🥉"} #$rank", color = color, fontWeight = FontWeight.Black, fontSize = 12.sp)
            AsyncImage(model = fam.avatarUrl ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape), contentScale = ContentScale.Crop)
            Text(fam.name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
            Text("🟡 ${fam.wealth}", color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun FamilyRow(rank: Int, fam: FamilyModel, onClick: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFF1E293B)).clickable { onClick() }.padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("#$rank", color = Color.Gray, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(modifier = Modifier.width(12.dp))
                AsyncImage(model = fam.avatarUrl ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(fam.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("👥 ${fam.membersCount}/${fam.capacity} · Lv.${fam.level}", color = Color.Gray, fontSize = 10.sp)
                }
            }
            Text("🟡 ${fam.wealth}", color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}
