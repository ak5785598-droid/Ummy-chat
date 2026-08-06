package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlin.math.cos
import kotlin.math.sin

data class CPPair(
    val id: String = "",
    val user1Id: String = "",
    val user2Id: String = "",
    val user1Name: String = "",
    val user2Name: String = "",
    val user1Avatar: String? = null,
    val user2Avatar: String? = null,
    val level: Int = 1,
    val hearts: Long = 0
)

@Composable
fun CPRankingScreen(
    onBack: () -> Unit
) {
    var activeTab by remember { mutableStateOf("total") }
    val tabs = listOf("daily", "weekly", "monthly", "total")
    var pairs by remember { mutableStateOf<List<CPPair>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    DisposableEffect(activeTab) {
        val fs = FirebaseFirestore.getInstance()
        val orderByField = if (activeTab == "total") "hearts" else "stats.${activeTab}Hearts"
        
        val listener = fs.collection("cpPairs")
            .orderBy(orderByField, Query.Direction.DESCENDING)
            .limit(50)
            .addSnapshotListener { snap, _ ->
                pairs = snap?.documents?.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    CPPair(
                        id = doc.id,
                        user1Id = data["user1Id"] as? String ?: "",
                        user2Id = data["user2Id"] as? String ?: "",
                        user1Name = data["user1Name"] as? String ?: "User",
                        user2Name = data["user2Name"] as? String ?: "User",
                        user1Avatar = data["user1Avatar"] as? String,
                        user2Avatar = data["user2Avatar"] as? String,
                        level = (data["level"] as? Number)?.toInt() ?: 1,
                        hearts = (data[if (activeTab == "total") "hearts" else "stats.${activeTab}Hearts"] as? Number)?.toLong() ?: 0L
                    )
                } ?: emptyList()
                loading = false
            }
        onDispose { listener.remove() }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF1E0A2A))) {
        MeteorAnimation()
        HeartParticles()

        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
            item { Header(onBack) }
            item { Tabs(activeTab, tabs) { activeTab = it } }

            if (loading) {
                item { Box(modifier = Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFFEC4899)) } }
            } else {
                item { FerrisWheelMap(pairs.take(5)) }
                itemsIndexed(pairs.drop(5)) { idx, pair ->
                    CPRow(idx + 6, pair)
                }
            }
        }
    }
}

@Composable
fun FerrisWheelMap(topPairs: List<CPPair>) {
    val infiniteTransition = rememberInfiniteTransition(label = "wheel")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(20000, easing = LinearEasing)), label = "rotation"
    )

    Box(
        modifier = Modifier.fillMaxWidth().height(400.dp).padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        // The Wheel
        Canvas(modifier = Modifier.size(300.dp).rotate(rotation)) {
            val center = Offset(size.width / 2, size.height / 2)
            val radius = size.width / 2
            drawCircle(color = Color(0xFFEC4899).copy(alpha = 0.2f), radius = radius, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 4.dp.toPx()))
            
            for (i in 0 until 8) {
                val angle = (i * 45).toDouble()
                val start = Offset(
                    center.x + (radius * 0.2f * cos(Math.toRadians(angle))).toFloat(),
                    center.y + (radius * 0.2f * sin(Math.toRadians(angle))).toFloat()
                )
                val end = Offset(
                    center.x + (radius * cos(Math.toRadians(angle))).toFloat(),
                    center.y + (radius * sin(Math.toRadians(angle))).toFloat()
                )
                drawLine(color = Color(0xFFEC4899).copy(alpha = 0.3f), start = start, end = end, strokeWidth = 2.dp.toPx())
            }
        }

        // Gondolas (Pairs)
        topPairs.forEachIndexed { i, pair ->
            val angle = (i * (360 / topPairs.size) + rotation).toDouble()
            val radius = 130.dp
            val x = (radius.value * cos(Math.toRadians(angle))).dp
            val y = (radius.value * sin(Math.toRadians(angle))).dp

            Box(
                modifier = Modifier.offset(x = x, y = y).size(70.dp).graphicsLayer { rotationZ = -rotation },
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(contentAlignment = Alignment.Center) {
                        Row {
                            AsyncImage(model = pair.user1Avatar ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.size(30.dp).clip(CircleShape).border(1.dp, Color(0xFFEC4899), CircleShape), contentScale = ContentScale.Crop)
                            Spacer(modifier = Modifier.width((-8).dp))
                            AsyncImage(model = pair.user2Avatar ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.size(30.dp).clip(CircleShape).border(1.dp, Color(0xFFEC4899), CircleShape), contentScale = ContentScale.Crop)
                        }
                    }
                    Text(pair.user1Name.take(5), color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Center Piece
        Box(modifier = Modifier.size(60.dp).clip(CircleShape).background(Color(0xFF831843)).border(2.dp, Color(0xFFF43F5E), CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Favorite, null, tint = Color.White, modifier = Modifier.size(30.dp))
        }
    }
}

@Composable
fun MeteorAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "meteor")
    val x by infiniteTransition.animateFloat(initialValue = 1200f, targetValue = -200f, animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing)), label = "x")
    val y by infiniteTransition.animateFloat(initialValue = -200f, targetValue = 1200f, animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing)), label = "y")

    Canvas(modifier = Modifier.fillMaxSize()) {
        drawCircle(
            brush = Brush.linearGradient(listOf(Color.White, Color.Transparent), start = Offset(x, y), end = Offset(x + 100, y - 100)),
            radius = 2.dp.toPx(),
            center = Offset(x, y)
        )
    }
}

@Composable
fun HeartParticles() {
    // Simple static hearts for now, could be animated
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
                Text("💖 CP Pair Ranking", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Text("Eternal bonds of love & romance", color = Color(0xFFF43F5E), fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun Tabs(activeTab: String, tabs: List<String>, onTabSelect: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFF31103F)).padding(4.dp)
    ) {
        tabs.forEach { tab ->
            val isSelected = activeTab == tab
            Box(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(if (isSelected) Color(0xFFEC4899) else Color.Transparent).clickable { onTabSelect(tab) }.padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(tab.uppercase(), color = if (isSelected) Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }
    }
    Spacer(modifier = Modifier.height(16.dp))
}

@Composable
fun CPRow(rank: Int, pair: CPPair) {
    Box(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFF31103F).copy(alpha = 0.8f)).padding(14.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("#$rank", color = Color(0xFFF43F5E), fontWeight = FontWeight.Black, fontSize = 14.sp)
                Spacer(modifier = Modifier.width(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = pair.user1Avatar ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFF475569)), contentScale = ContentScale.Crop)
                    Text("💖", fontSize = 12.sp, modifier = Modifier.padding(horizontal = 2.dp))
                    AsyncImage(model = pair.user2Avatar ?: "https://picsum.photos/100", contentDescription = null, modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFF475569)), contentScale = ContentScale.Crop)
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text("${pair.user1Name} & ${pair.user2Name}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("Lv.${pair.level} CP Bond", color = Color.Gray, fontSize = 10.sp)
                }
            }
            Text("💖 ${pair.hearts}", color = Color(0xFFF43F5E), fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}
