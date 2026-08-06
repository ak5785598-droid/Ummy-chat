package app.vercel.ummy_chat.twa.ui.store

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

// React Native store/index.tsx → Kotlin Compose (MINIMAL PARITY)

private data class StoreItem(
    val id: String = "",
    val name: String = "",
    val type: String = "Frame",
    val price: Long = 0,
    val imageUrl: String? = null,
    val description: String = ""
)

private val STORE_TYPES = listOf("Frame", "Theme", "Bubble", "Wave", "Entry", "ID")

@Composable
fun StoreScreen(onBack: () -> Unit) {
    val purple500 = Color(0xFF7C3AED)
    val amber100 = Color(0xFFFEF3C7)
    val amber200 = Color(0xFFFDE68A)
    val amber800 = Color(0xFF92400E)

    var activeTab by remember { mutableStateOf("Store") }
    var activeType by remember { mutableStateOf("Frame") }
    var storeItems by remember { mutableStateOf<List<StoreItem>>(emptyList()) }
    var userCoins by remember { mutableLongStateOf(0L) }
    var loading by remember { mutableStateOf(true) }

    val uid = FirebaseAuth.getInstance().currentUser?.uid

    LaunchedEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        fs.collection("storeItems")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snap ->
                storeItems = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    StoreItem(
                        id = doc.id,
                        name = data["name"] as? String ?: "Item",
                        type = data["type"] as? String ?: "Frame",
                        price = (data["price"] as? Number)?.toLong() ?: 0L,
                        imageUrl = data["imageUrl"] as? String,
                        description = data["description"] as? String ?: ""
                    )
                }
                loading = false
            }
            .addOnFailureListener { loading = false }

        if (uid != null) {
            fs.collection("users").document(uid).get()
                .addOnSuccessListener { doc ->
                    userCoins = doc.getLong("wallet.coins") ?: 0L
                }
        }
    }

    val filteredItems = if (activeTab == "Store") {
        storeItems.filter { it.type == activeType }
    } else emptyList()

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().background(Color.White).border(1.dp, Color(0xFFF1F5F9)).padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.padding(8.dp).clip(CircleShape).clickable { onBack() }.padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF0F172A), modifier = Modifier.size(24.dp))
                }
                Text("Store", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.weight(1f))
                Row(
                    modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(amber100).border(1.dp, amber200, RoundedCornerShape(20.dp)).padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("🪙", fontSize = 12.sp)
                    Text("$userCoins", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = amber800)
                }
            }

            // Tabs
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).border(1.dp, Color(0xFFF1F5F9))) {
                listOf("Store", "My Items").forEach { tab ->
                    val isActive = activeTab == tab
                    Box(
                        modifier = Modifier.weight(1f).clickable { activeTab = tab }.padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tab, fontSize = 14.sp, fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium, color = if (isActive) purple500 else Color(0xFF94A3B8))
                        if (isActive) {
                            Box(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(2.dp).background(purple500))
                        }
                    }
                }
            }

            // Type Filter
            if (activeTab == "Store") {
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    STORE_TYPES.forEach { type ->
                        val isActive = activeType == type
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(if (isActive) purple500 else Color.Transparent).border(1.dp, if (isActive) purple500 else Color(0xFFE2E8F0), RoundedCornerShape(20.dp)).clickable { activeType = type }.padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(type, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = if (isActive) Color.White else Color(0xFF64748B))
                        }
                    }
                }
            }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = purple500, modifier = Modifier.size(24.dp))
                }
            } else if (activeTab == "My Items") {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.ShoppingBag, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No Items Yet", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Purchase items from the Store", fontSize = 12.sp, color = Color(0xFFCBD5E1))
                    }
                }
            } else if (filteredItems.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No $activeType items available", fontSize = 14.sp, color = Color(0xFF94A3B8))
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredItems) { item ->
                        StoreItemCard(item = item, userCoins = userCoins)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoreItemCard(item: StoreItem, userCoins: Long) {
    val canAfford = userCoins >= item.price
    Box(
        modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Color.White).border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp)).clickable { }
    ) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().height(120.dp).background(Color(0xFFF8FAFC))) {
                if (item.imageUrl != null) {
                    AsyncImage(model = item.imageUrl, contentDescription = item.name, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                } else {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("🎨", fontSize = 32.sp) }
                }
            }
            Column(modifier = Modifier.padding(10.dp)) {
                Text(item.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🪙", fontSize = 10.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${item.price}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (canAfford) Color(0xFFD97706) else Color(0xFFEF4444))
                }
            }
        }
    }
}
