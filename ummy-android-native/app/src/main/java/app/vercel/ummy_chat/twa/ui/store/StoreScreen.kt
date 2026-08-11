package app.vercel.ummy_chat.twa.ui.store

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.ShoppingBag
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon
import app.vercel.ummy_chat.twa.util.CdnUtils
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private data class StoreItem(
    val id: String = "",
    val name: String = "",
    val type: String = "Frame",
    val price: Long = 0,
    val imageUrl: String? = null,
    val description: String = "",
    val createdAt: Date? = null,
    val entryType: String? = null,
    val videoUrl: String? = null,
    val isPinkDiamond: Boolean = false,
    val isSilver: Boolean = false,
    val variant: String? = null,
    val source: String = "store", // "store" / "inventory" / "svip" / "medal"
    val requiredTag: String? = null,
    val notForSale: Boolean = false
)

private val STORE_TYPES = listOf("Frame", "Theme", "Bubble", "Wave", "Entry", "ID")

// Static/System fallback items matching React Native 1-to-1
private val STATIC_WAVE_ITEMS = listOf(
    StoreItem("w-lovelyshine", "Lovely Shine Wave", "Wave", 30000, null, "Custom speaking wave animation with blue glow."),
    StoreItem("w-waveflew", "Wave Flew", "Wave", 30000, null, "Futuristic white-cyan mic wave glow."),
    StoreItem("w-tonepink", "Tone Pink Wave", "Wave", 30000, null, "Beautiful pink breathing mic wave glow."),
    StoreItem("w-vox", "Vox Wave", "Wave", 30000, null, "Oceanic blue voice-pulse wave ring."),
    StoreItem("w-reso", "Resonant Wave", "Wave", 30000, null, "Vibrant green acoustic speaker wave ring."),
    StoreItem("w-echo", "Echo Orange Wave", "Wave", 30000, null, "Electric orange audio echo wave ring.")
)

private val STATIC_BUBBLE_ITEMS = listOf(
    StoreItem("bubble-pink", "Pink Romance Bubble", "Bubble", 50000, null, "Custom pink chat bubble with heart highlights."),
    StoreItem("bubble-blue", "Blue Tech Bubble", "Bubble", 50000, null, "Cyber-blue futuristic chat bubble frame."),
    StoreItem("bubble-gold", "Golden SSS Bubble", "Bubble", 80000, null, "Premium gold gradient chat message bubble.")
)

private val STATIC_ID_ITEMS = listOf(
    StoreItem("theme-pink", "Pink Diamond ID", "ID", 0, null, "Exclusive Premium Pink ID Diamond Badge theme.", isPinkDiamond = true),
    StoreItem("theme-silver", "Silver Blue ID", "ID", 0, null, "Exclusive Premium Silver Blue ID Badge theme.", isSilver = true),
    StoreItem("theme-gold", "Gold SSS ID", "ID", 0, null, "Exclusive VIP Gold SSS ID Badge theme.", variant = "red")
)

private val STATIC_ENTRY_ITEMS = listOf(
    StoreItem("entry-dragon", "Dragon Elite Entry", "Entry", 150000, null, "Majestic golden dragon mount entrance animation.", entryType = "dragon"),
    StoreItem("entry-lion", "Lion Guard Entry", "Entry", 120000, null, "Royal lion guardian mount entrance animation.", entryType = "lion")
)

private fun getDynamicIDPrice(idString: String, duration: Int): Long {
    val len = idString.length
    val basePrice = when (len) {
        1 -> 1000000L
        2 -> 500000L
        3 -> 250000L
        4 -> 100000L
        5 -> 50000L
        6 -> 20000L
        7 -> 10000L
        else -> 5000L
    }
    return if (duration == 7) basePrice else basePrice * 3
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val purple500 = Color(0xFF7C3AED)
    val amber100 = Color(0xFFFEF3C7)
    val amber200 = Color(0xFFFDE68A)
    val amber800 = Color(0xFF92400E)

    var activeTab by remember { mutableStateOf("Store") }
    var activeType by remember { mutableStateOf("Frame") }
    var storeItems by remember { mutableStateOf<List<StoreItem>>(emptyList()) }
    var userProfileData by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var userCoins by remember { mutableLongStateOf(0L) }
    var loading by remember { mutableStateOf(true) }

    // Dialog preview state
    var previewItem by remember { mutableStateOf<StoreItem?>(null) }
    var isProcessingPurchase by remember { mutableStateOf(false) }

    // Gift flow state
    var giftTargetItem by remember { mutableStateOf<StoreItem?>(null) }
    var giftDuration by remember { mutableIntStateOf(7) }
    var showGiftSheet by remember { mutableStateOf(false) }
    var giftSearchQuery by remember { mutableStateOf("") }
    var giftSearchResults by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }
    var isSearchingGift by remember { mutableStateOf(false) }
    var isSendingGift by remember { mutableStateOf(false) }

    // Custom ID check states
    var customIdInput by remember { mutableStateOf("") }
    var isCheckingId by remember { mutableStateOf(false) }
    var checkedId by remember { mutableStateOf("") }
    var idAvailability by remember { mutableStateOf("none") } // "none", "available", "taken", "invalid"

    val uid = FirebaseAuth.getInstance().currentUser?.uid
    val fs = FirebaseFirestore.getInstance()

    BackHandler(enabled = previewItem != null || activeType != "Frame") {
        if (previewItem != null) {
            previewItem = null
        } else if (activeType != "Frame") {
            activeType = "Frame"
        }
    }

    // Query catalog items
    LaunchedEffect(Unit) {
        fs.collection("storeItems").get()
            .addOnSuccessListener { snap ->
                val fetched = snap.documents.mapNotNull { doc ->
                    val data = doc.data ?: return@mapNotNull null
                    StoreItem(
                        id = doc.id,
                        name = data["name"] as? String ?: "Item",
                        type = data["category"] as? String ?: data["type"] as? String ?: "Frame",
                        price = (data["price"] as? Number)?.toLong() ?: 0L,
                        imageUrl = data["imageUrl"] as? String ?: data["url"] as? String,
                        description = data["description"] as? String ?: "",
                        createdAt = doc.getDate("createdAt"),
                        entryType = data["entryType"] as? String,
                        videoUrl = data["videoUrl"] as? String ?: data["url"] as? String,
                        requiredTag = data["requiredTag"] as? String,
                        notForSale = data["notForSale"] as? Boolean ?: false
                    )
                }
                storeItems = fetched.sortedByDescending { it.createdAt ?: Date(0) }
                loading = false
            }
            .addOnFailureListener {
                loading = false
            }
    }

    // Snapshot listeners for Real-time nested map user profile & coins
    LaunchedEffect(uid) {
        if (uid != null) {
            val userRef = fs.collection("users").document(uid)
            val profileRef = userRef.collection("profile").document(uid)

            userRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val wallet = snap.get("wallet") as? Map<*, *>
                    userCoins = (wallet?.get("coins") as? Number)?.toLong() ?: 0L
                }
            }

            profileRef.addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    userProfileData = snap.data
                }
            }
        }
    }

    val allCatalogItems = remember(storeItems) {
        storeItems + STATIC_WAVE_ITEMS + STATIC_BUBBLE_ITEMS + STATIC_ID_ITEMS + STATIC_ENTRY_ITEMS
    }

    // Resolve user's inventory owned items
    val purchasedItems = remember(userProfileData, allCatalogItems) {
        if (userProfileData == null) return@remember emptyList<StoreItem>()

        val inventory = userProfileData?.get("inventory") as? Map<*, *>
        val ownedIds = inventory?.get("ownedItems") as? List<*> ?: emptyList<Any?>()
        val expiries = inventory?.get("expiries") as? Map<*, *> ?: emptyMap<String, Any?>()
        val svip = userProfileData?.get("svipPrivileges") as? Map<*, *>
        val medals = userProfileData?.get("medals") as? List<*> ?: emptyList<Any?>()

        val result = mutableListOf<StoreItem>()
        val catalogMap = allCatalogItems.associateBy { it.id }

        val nowIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

        fun isItemValid(itemId: String): Boolean {
            val exp = expiries[itemId]?.toString() ?: return true
            return exp > nowIso
        }

        for (idObj in ownedIds) {
            val id = idObj.toString()
            if (!isItemValid(id)) continue
            val item = catalogMap[id]
            if (item != null) {
                result.add(item.copy(source = "inventory"))
            } else {
                val name = if (id.startsWith("level_")) {
                    val lvl = id.removePrefix("level_").removeSuffix("_frame")
                    "Level $lvl Reward Frame"
                } else {
                    id.replace("_", " ").replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
                }
                result.add(StoreItem(id = id, name = name, type = "Frame", source = "inventory", description = "Reward achievement item."))
            }
        }

        // SVIP pseudo items
        if (svip != null) {
            val frameUrl = svip["frameUrl"] as? String
            if (!frameUrl.isNullOrEmpty() && !ownedIds.contains("__svip_frame__")) {
                result.add(StoreItem("__svip_frame__", "SVIP Frame", "Frame", 0, frameUrl, "Exclusive SVIP User Frame.", source = "svip"))
            }
            val bubbleId = svip["bubbleId"] as? String
            val bubbleUrl = svip["bubbleUrl"] as? String
            if (!bubbleId.isNullOrEmpty() && !ownedIds.contains(bubbleId)) {
                result.add(StoreItem(bubbleId, "SVIP Bubble", "Bubble", 0, bubbleUrl, "Exclusive SVIP Chat Bubble.", source = "svip"))
            }
            val waveId = svip["waveId"] as? String
            if (!waveId.isNullOrEmpty() && !ownedIds.contains(waveId)) {
                result.add(StoreItem(waveId, "SVIP Wave", "Wave", 0, null, "Exclusive SVIP Speaking Wave.", source = "svip"))
            }
            val entranceType = svip["entranceType"] as? String
            val entranceUrl = svip["entranceUrl"] as? String
            if (!entranceType.isNullOrEmpty() && !ownedIds.contains("__svip_entry__")) {
                result.add(StoreItem("__svip_entry__", "SVIP Entrance", "Entry", 0, entranceUrl, "Exclusive SVIP Entry Effect.", entryType = entranceType, source = "svip"))
            }
        }

        // Medals
        for (mObj in medals) {
            val mid = mObj.toString()
            result.add(StoreItem(id = "medal_$mid", name = "Medal: $mid", type = "Medal", source = "medal", description = "Official achievement medal."))
        }

        result
    }

    val filteredItems = if (activeTab == "Store") {
        allCatalogItems.filter { it.type == activeType }
    } else purchasedItems

    // ID availability checker
    fun checkIdAvailability() {
        val trimmed = customIdInput.trim()
        if (trimmed.length < 1 || trimmed.length > 8 || !trimmed.all { it.isDigit() }) {
            idAvailability = "invalid"
            return
        }
        isCheckingId = true
        fs.collection("taken_ids").document(trimmed).get()
            .addOnSuccessListener { snap ->
                if (!snap.exists()) {
                    idAvailability = "available"
                    checkedId = trimmed
                } else {
                    val expiryStr = snap.getString("expiry")
                    if (expiryStr != null) {
                        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }
                        val expDate = parser.parse(expiryStr.substring(0, 19))
                        if (expDate != null && expDate.time < System.currentTimeMillis()) {
                            idAvailability = "available"
                            checkedId = trimmed
                        } else {
                            idAvailability = "taken"
                        }
                    } else {
                        idAvailability = "taken"
                    }
                }
                isCheckingId = false
            }
            .addOnFailureListener {
                idAvailability = "taken"
                isCheckingId = false
            }
    }

    // Purchase execution
    fun executePurchase(item: StoreItem, durationDays: Int) {
        if (uid == null || isProcessingPurchase) return
        
        val price = if (item.type == "ID") getDynamicIDPrice(checkedId, durationDays) else when (durationDays) {
            3 -> (item.price * 0.5).toLong()
            7 -> item.price
            15 -> item.price * 2
            30 -> (item.price * 3.5).toLong()
            else -> item.price
        }
        if (userCoins < price) {
            Toast.makeText(context, "Insufficient Coins!", Toast.LENGTH_SHORT).show()
            return
        }

        val tags = userProfileData?.get("tags") as? List<*> ?: emptyList<Any?>()
        if (item.notForSale) {
            val isOfficial = tags.any { it.toString() in listOf("Official", "Admin", "Creator", "Seller", "Seller center") } || uid == "901piBzTQ0VzCtAvlyyobwvAaTs1"
            if (!isOfficial) {
                Toast.makeText(context, "This exclusive item is not for sale to general users.", Toast.LENGTH_LONG).show()
                return
            }
        }
        if (item.requiredTag != null) {
            val hasTag = tags.any { it.toString().contains(item.requiredTag) }
            if (!hasTag) {
                Toast.makeText(context, "This item is restricted to ${item.requiredTag} members only.", Toast.LENGTH_LONG).show()
                return
            }
        }

        isProcessingPurchase = true

        val expiryDate = Date(System.currentTimeMillis() + durationDays * 24L * 60L * 60L * 1000L)
        val isoParser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val expiryStr = isoParser.format(expiryDate)

        val profileRef = fs.collection("users").document(uid).collection("profile").document(uid)
        val userRef = fs.collection("users").document(uid)
        val batch = fs.batch()

        if (item.type == "ID") {
            val takenIdRef = fs.collection("taken_ids").document(checkedId)
            batch.set(takenIdRef, hashMapOf(
                "displayId" to checkedId,
                "ownerUid" to uid,
                "expiry" to expiryStr,
                "badgeTheme" to item.id,
                "createdAt" to FieldValue.serverTimestamp()
            ))

            val activeIdBadge = hashMapOf(
                "displayId" to checkedId,
                "isPinkDiamond" to item.isPinkDiamond,
                "isSilver" to item.isSilver,
                "variant" to (item.variant ?: ""),
                "expiry" to expiryStr
            )

            val originalId = userProfileData?.get("originalAccountNumber") as? String ?: userProfileData?.get("accountNumber") as? String ?: ""
            val profileUpdates = hashMapOf<String, Any>(
                "wallet.coins" to FieldValue.increment(-price),
                "activeIdBadge" to activeIdBadge,
                "accountNumber" to checkedId,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (userProfileData?.get("originalAccountNumber") == null) {
                profileUpdates["originalAccountNumber"] = originalId
            }
            batch.update(profileRef, profileUpdates)

            val userUpdates = hashMapOf<String, Any>(
                "wallet.coins" to FieldValue.increment(-price),
                "accountNumber" to checkedId,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (userProfileData?.get("originalAccountNumber") == null) {
                userUpdates["originalAccountNumber"] = originalId
            }
            batch.update(userRef, userUpdates)
        } else {
            val profileUpdates = hashMapOf<String, Any>(
                "wallet.coins" to FieldValue.increment(-price),
                "inventory.ownedItems" to FieldValue.arrayUnion(item.id),
                "inventory.expiries.${item.id}" to expiryStr,
                "updatedAt" to FieldValue.serverTimestamp()
            )
            
            if (item.type == "Entry") {
                val entryType = item.entryType ?: if ((item.name).lowercase().contains("dragon")) "dragon" else if ((item.name).lowercase().contains("lion")) "lion" else "line"
                val entryVideo = item.videoUrl ?: item.imageUrl ?: ""
                profileUpdates["inventory.entryTypes"] = FieldValue.arrayUnion(entryType)
                profileUpdates["inventory.activeEntryEffect"] = entryType
                profileUpdates["inventory.activeEntryVideoUrl"] = entryVideo
            }

            batch.update(profileRef, profileUpdates)
            batch.update(userRef, profileUpdates)
        }

        batch.commit()
            .addOnSuccessListener {
                Toast.makeText(context, "✅ Purchase Successful! Item added to inventory.", Toast.LENGTH_LONG).show()
                previewItem = null
                customIdInput = ""
                idAvailability = "none"
                isProcessingPurchase = false
            }
            .addOnFailureListener {
                Toast.makeText(context, "Purchase failed: ${it.message}", Toast.LENGTH_SHORT).show()
                isProcessingPurchase = false
            }
    }

    // Inventory state
    val inventory = userProfileData?.get("inventory") as? Map<*, *>
    val activeFrame = inventory?.get("activeFrame") as? String
    val activeWave = inventory?.get("activeWave") as? String
    val activeBubble = inventory?.get("activeBubble") as? String
    val activeEntryEffect = inventory?.get("activeEntryEffect") as? String
    @Suppress("UNCHECKED_CAST")
    val ownedIds = (inventory?.get("ownedItems") as? List<Any?>)?.mapNotNull { it?.toString() } ?: emptyList()

    fun isItemOwned(id: String): Boolean = id in ownedIds
    fun isEquipped(item: StoreItem): Boolean = when (item.type) {
        "Frame" -> activeFrame == item.id
        "Wave" -> activeWave == item.id
        "Bubble" -> activeBubble == item.id
        "Entry" -> activeEntryEffect == item.entryType
        else -> false
    }

    fun toggleEquipItem(item: StoreItem) {
        if (uid == null) return
        val profileRef = fs.collection("users").document(uid).collection("profile").document(uid)
        val userRef = fs.collection("users").document(uid)
        val field = when (item.type) {
            "Frame" -> "inventory.activeFrame"
            "Wave" -> "inventory.activeWave"
            "Bubble" -> "inventory.activeBubble"
            "Entry" -> "inventory.activeEntryEffect"
            else -> return
        }
        val urlField = "${field}MediaUrl"
        val itemUrl = item.imageUrl ?: item.videoUrl
        val currentlyActive = isEquipped(item)
        val updateData = hashMapOf<String, Any?>()
        if (currentlyActive) {
            updateData[field] = null
            if (item.type != "Entry") updateData[urlField] = null
            if (item.type == "Wave") updateData["activeWave"] = null
            if (item.type == "Entry") updateData["inventory.activeEntryVideoUrl"] = null
        } else {
            updateData[field] = item.id
            if (itemUrl != null) updateData[urlField] = itemUrl
            if (item.type == "Wave") updateData["activeWave"] = item.id
            if (item.type == "Entry") updateData["inventory.activeEntryVideoUrl"] = item.videoUrl ?: item.imageUrl
        }
        updateData["updatedAt"] = FieldValue.serverTimestamp()
        val batch = fs.batch()
        @Suppress("UNCHECKED_CAST")
        batch.update(profileRef, updateData as Map<String, Any>)
        @Suppress("UNCHECKED_CAST")
        batch.update(userRef, updateData as Map<String, Any>)
        batch.commit().addOnSuccessListener {
            Toast.makeText(context, "${if (currentlyActive) "Removed" else "Activated"} ${item.name}!", Toast.LENGTH_SHORT).show()
        }.addOnFailureListener {
            Toast.makeText(context, "Failed: ${it.message}", Toast.LENGTH_SHORT).show()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().background(Color.White).border(1.dp, Color(0xFFF1F5F9)).padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.padding(4.dp).clip(CircleShape).clickable { onBack() }.padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF0F172A), modifier = Modifier.size(24.dp))
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text("Boutique Shop", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.weight(1f))
                Row(
                    modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(amber100).border(1.dp, amber200, RoundedCornerShape(20.dp)).padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    GoldDollarIcon(size = 14)
                    Text(String.format("%,d", userCoins), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = amber800)
                }
            }

            // Tab Rows
            Row(modifier = Modifier.fillMaxWidth().background(Color.White).border(1.dp, Color(0xFFF1F5F9))) {
                listOf("Store", "My Items").forEach { tab ->
                    val isActive = activeTab == tab
                    Box(
                        modifier = Modifier.weight(1f).clickable { activeTab = tab }.padding(vertical = 14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tab, fontSize = 14.sp, fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium, color = if (isActive) purple500 else Color(0xFF94A3B8))
                        if (isActive) {
                            Box(modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(2.dp).background(purple500))
                        }
                    }
                }
            }

            // Category Filter Tab Chips
            if (activeTab == "Store") {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    STORE_TYPES.forEach { type ->
                        val isActive = activeType == type
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(if (isActive) purple500 else Color.Transparent)
                                .border(1.dp, if (isActive) purple500 else Color(0xFFE2E8F0), RoundedCornerShape(20.dp))
                                .clickable { activeType = type }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(type, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = if (isActive) Color.White else Color(0xFF64748B))
                        }
                    }
                }
            }

            // Custom ID search section in Store tab
            if (activeTab == "Store" && activeType == "ID") {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Search & Reserve Custom ID", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFFF1F5F9))
                                    .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
                                    .padding(horizontal = 12.dp),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                BasicTextField(
                                    value = customIdInput,
                                    onValueChange = {
                                        customIdInput = it.filter { char -> char.isDigit() }.take(8)
                                        idAvailability = "none"
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 15.sp, color = Color(0xFF0F172A)),
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                )
                                if (customIdInput.isEmpty()) {
                                    Text("Enter ID (1-8 digits only)", fontSize = 14.sp, color = Color(0xFF94A3B8))
                                }
                            }
                            Button(
                                onClick = { checkIdAvailability() },
                                colors = ButtonDefaults.buttonColors(containerColor = purple500),
                                enabled = !isCheckingId && customIdInput.isNotBlank(),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.height(44.dp),
                                contentPadding = PaddingValues(horizontal = 16.dp)
                            ) {
                                if (isCheckingId) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                } else {
                                    Text("Check", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        when (idAvailability) {
                            "available" -> {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF10B981)))
                                    Text("ID \"$checkedId\" is available!", fontSize = 13.sp, color = Color(0xFF10B981), fontWeight = FontWeight.SemiBold)
                                }
                            }
                            "taken" -> {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFFEF4444)))
                                    Text("ID is already taken or active.", fontSize = 13.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.SemiBold)
                                }
                            }
                            "invalid" -> {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFFF59E0B)))
                                    Text("ID must be numeric and 1 to 8 digits.", fontSize = 13.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = purple500, modifier = Modifier.size(36.dp))
                }
            } else if (filteredItems.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.ShoppingBag, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = if (activeTab == "Store") "No $activeType items available" else "No Items Owned Yet",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (activeTab == "Store") "Check back later" else "Purchased items will appear here.",
                            fontSize = 12.sp,
                            color = Color(0xFFCBD5E1)
                        )
                    }
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredItems) { item ->
                        StoreItemCard(
                            item = item,
                            userCoins = userCoins,
                            isEquipped = isEquipped(item),
                            isStoreTab = activeTab == "Store",
                            owned = isItemOwned(item.id),
                            onCardClick = {
                                if (activeTab == "Store") {
                                    if (activeType == "ID" && (idAvailability != "available" || checkedId.isBlank())) {
                                        Toast.makeText(context, "Search ID and check availability first!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        previewItem = item
                                    }
                                }
                            },
                            onEquipToggle = { toggleEquipItem(item) },
                            onRemove = if (activeTab != "Store" && isEquipped(item)) { { toggleEquipItem(item) } } else null
                        )
                    }
                }
            }
        }

        // Preview & Purchase Modal Dialog
        previewItem?.let { item ->
            PreviewPurchaseDialog(
                item = item,
                checkedId = checkedId,
                userCoins = userCoins,
                isProcessing = isProcessingPurchase,
                onDismiss = { previewItem = null },
                onConfirmPurchase = { duration ->
                    executePurchase(item, duration)
                },
                onGift = { duration ->
                    giftTargetItem = item
                    giftDuration = duration
                    showGiftSheet = true
                    giftSearchQuery = ""
                    giftSearchResults = emptyList()
                }
            )
        }

        // Gift Recipient Sheet
        if (showGiftSheet && giftTargetItem != null) {
            val item = giftTargetItem!!
            ModalBottomSheet(
                onDismissRequest = { showGiftSheet = false },
                containerColor = Color.White
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("Send as Gift", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                    Text("Send \"${item.name}\" to a friend", fontSize = 13.sp, color = Color(0xFF64748B))

                    OutlinedTextField(
                        value = giftSearchQuery,
                        onValueChange = { q ->
                            giftSearchQuery = q
                            if (q.length >= 2) {
                                isSearchingGift = true
                                fs.collection("users")
                                    .whereGreaterThanOrEqualTo("name", q)
                                    .whereLessThanOrEqualTo("name", q + "\uF8FF")
                                    .limit(10)
                                    .get()
                                    .addOnSuccessListener { snap ->
                                        giftSearchResults = snap.documents.mapNotNull { doc ->
                                            val d = doc.data ?: return@mapNotNull null
                                            if (doc.id != uid) d + mapOf("uid" to doc.id) else null
                                        }
                                        isSearchingGift = false
                                    }
                                    .addOnFailureListener { isSearchingGift = false }
                            } else {
                                giftSearchResults = emptyList()
                            }
                        },
                        placeholder = { Text("Search by name...") },
                        leadingIcon = { Icon(Icons.Default.Close, null) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )

                    if (isSearchingGift) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp, color = Color(0xFF7C3AED))
                    }

                    LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                        items(giftSearchResults) { user ->
                            val name = user["name"] as? String ?: "Unknown"
                            val photoUrl = user["photoUrl"] as? String
                            val targetUid = user["uid"] as? String ?: return@items
                            Row(
                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                                    .clickable {
                                        isSendingGift = true
                                        val batch = fs.batch()
                                        val recipientRef = fs.collection("users").document(targetUid)
                                        val senderRef = fs.collection("users").document(uid!!)
                                        batch.update(recipientRef, "giftsReceived", FieldValue.arrayUnion(mapOf(
                                            "itemId" to item.id,
                                            "itemName" to item.name,
                                            "senderName" to (userProfileData?.get("name") as? String ?: "Someone"),
                                            "senderId" to uid,
                                            "durationDays" to giftDuration,
                                            "timestamp" to FieldValue.serverTimestamp()
                                        )))
                                        batch.update(senderRef, "coins", FieldValue.increment(-item.price.toLong()))
                                        batch.commit()
                                            .addOnSuccessListener {
                                                Toast.makeText(context, "Gift sent!", Toast.LENGTH_SHORT).show()
                                                isSendingGift = false
                                                showGiftSheet = false
                                                userCoins -= item.price
                                            }
                                            .addOnFailureListener {
                                                Toast.makeText(context, "Failed to send gift", Toast.LENGTH_SHORT).show()
                                                isSendingGift = false
                                            }
                                    }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF7C3AED).copy(alpha = 0.1f)), contentAlignment = Alignment.Center) {
                                    Text(name.first().uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF7C3AED))
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(name, modifier = Modifier.weight(1f), fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                Icon(Icons.AutoMirrored.Filled.Send, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(20.dp))
                            }
                        }
                    }

                    if (isSendingGift) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                            CircularProgressIndicator(strokeWidth = 2.dp, color = Color(0xFF7C3AED))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StoreItemCard(
    item: StoreItem,
    userCoins: Long,
    isEquipped: Boolean,
    isStoreTab: Boolean,
    owned: Boolean,
    onCardClick: () -> Unit,
    onEquipToggle: () -> Unit,
    onRemove: (() -> Unit)? = null
) {
    val canAfford = userCoins >= item.price
    val mediaUrl = item.imageUrl?.let { u -> if (u.startsWith("http")) u else null }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (isEquipped) 2.dp else 1.dp,
                color = if (isEquipped) Color(0xFFFBBF24) else Color(0xFFE2E8F0),
                shape = RoundedCornerShape(16.dp)
            )
            .clickable { onCardClick() }
    ) {
        Column {
            Box(
                modifier = Modifier.fillMaxWidth().height(110.dp).background(Color(0xFFF8FAFC)),
                contentAlignment = Alignment.Center
            ) {
                if (mediaUrl != null) {
                    AsyncImage(
                        model = CdnUtils.toCdn(mediaUrl),
                        contentDescription = item.name,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                } else {
                    Box(
                        modifier = Modifier.fillMaxSize().background(
                            Brush.linearGradient(listOf(Color(0xFFC084FC), Color(0xFF818CF8)))
                        ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = when (item.type) {
                                "Wave" -> "\uD83C\uDF0A"
                                "Bubble" -> "\uD83D\uDCAC"
                                "Entry" -> "\uD83C\uDFAC"
                                "Frame" -> "\uD83D\uDDBC\uFE0F"
                                "Theme" -> "\uD83C\uDFA8"
                                "ID" -> "\uD83D\uDCDD"
                                "Medal" -> "\uD83C\uDFC5"
                                else -> "\u2728"
                            },
                            fontSize = 36.sp
                        )
                    }
                }

                if (isEquipped) {
                    Box(
                        modifier = Modifier.align(Alignment.TopEnd).padding(6.dp)
                            .size(20.dp).clip(CircleShape).background(Color(0xFFFBBF24))
                            .border(1.5.dp, Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("\u25B6", fontSize = 8.sp, color = Color.Black)
                    }
                } else if (owned) {
                    Box(
                        modifier = Modifier.align(Alignment.TopEnd).padding(6.dp)
                            .size(20.dp).clip(CircleShape).background(Color(0xFF10B981))
                            .border(1.5.dp, Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.CheckCircle, null, tint = Color.White, modifier = Modifier.size(12.dp))
                    }
                }
                if (item.notForSale) {
                    Box(
                        modifier = Modifier.align(Alignment.TopStart).padding(6.dp)
                            .clip(RoundedCornerShape(6.dp)).background(Color(0xFFFEF3C7).copy(alpha = 0.9f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("Exclusive", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                    }
                }
            }
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = item.name,
                    fontSize = 12.sp, fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A), maxLines = 1, overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = item.type,
                    fontSize = 9.sp, fontWeight = FontWeight.Medium, color = Color(0xFF94A3B8)
                )
                Spacer(modifier = Modifier.height(6.dp))
                if (isStoreTab) {
                    if (item.notForSale) {
                        Text("Not for Sale", fontSize = 10.sp, fontWeight = FontWeight.Bold,
                            color = Color(0xFFEF4444), modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            GoldDollarIcon(size = 12)
                            Text(
                                text = if (item.type == "ID") "Variable" else String.format("%,d", item.price),
                                fontSize = 11.sp, fontWeight = FontWeight.Bold,
                                color = if (canAfford) Color(0xFFD97706) else Color(0xFFEF4444)
                            )
                        }
                    }
                } else {
                    when {
                        isEquipped && onRemove != null -> {
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFFFEF3C7))
                                    .padding(horizontal = 6.dp, vertical = 3.dp)) {
                                    Text("ACTIVE", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF59E0B))
                                }
                                Spacer(modifier = Modifier.weight(1f))
                                Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFFEF4444).copy(alpha = 0.1f))
                                    .clickable { onRemove() }.padding(horizontal = 6.dp, vertical = 3.dp)) {
                                    Text("REMOVE", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                }
                            }
                        }
                        owned && item.type in listOf("Frame", "Wave", "Bubble", "Entry") -> {
                            Button(
                                onClick = onEquipToggle, shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFBBF24)),
                                modifier = Modifier.fillMaxWidth().height(28.dp), contentPadding = PaddingValues(0.dp)
                            ) { Text("USE", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color.Black) }
                        }
                        owned -> {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF10B981)))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("OWNED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF059669))
                            }
                            if (item.type == "Theme") {
                                Text("Apply in Room Settings", fontSize = 8.sp, color = Color(0xFF94A3B8),
                                    textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                            }
                        }
                        item.notForSale -> {
                            Text("Not for Sale", fontSize = 10.sp, fontWeight = FontWeight.Bold,
                                color = Color(0xFFEF4444), modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                        }
                        else -> {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                GoldDollarIcon(size = 12)
                                Text(String.format("%,d", item.price), fontSize = 11.sp, fontWeight = FontWeight.Bold,
                                    color = if (canAfford) Color(0xFFD97706) else Color(0xFFEF4444))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PreviewPurchaseDialog(
    item: StoreItem,
    checkedId: String,
    userCoins: Long,
    isProcessing: Boolean,
    onDismiss: () -> Unit,
    onConfirmPurchase: (durationDays: Int) -> Unit,
    onGift: ((durationDays: Int) -> Unit)? = null
) {
    var selectedDuration by remember { mutableStateOf(7) }
    val finalPrice = if (item.type == "ID") getDynamicIDPrice(checkedId, selectedDuration) else when (selectedDuration) {
        3 -> (item.price * 0.5).toLong()
        7 -> item.price
        15 -> item.price * 2
        30 -> (item.price * 3.5).toLong()
        else -> item.price
    }
    val canAfford = userCoins >= finalPrice

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Item Details", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color(0xFF64748B))
                    }
                }

                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFF8FAFC)),
                    contentAlignment = Alignment.Center
                ) {
                    if (!item.imageUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = item.imageUrl,
                            contentDescription = item.name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.linearGradient(
                                        listOf(Color(0xFFC084FC), Color(0xFF818CF8))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (item.type == "Wave") "🌊" else if (item.type == "Bubble") "💬" else "✨",
                                fontSize = 48.sp
                            )
                        }
                    }
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = if (item.type == "ID") "Custom ID \"$checkedId\"" else item.name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF0F172A),
                        textAlign = TextAlign.Center
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFF7C3AED).copy(alpha = 0.1f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(item.type.uppercase(Locale.ROOT), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7C3AED))
                    }
                }

                Text(
                    text = item.description.ifBlank { "Exclusive premium asset for your profile." },
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    textAlign = TextAlign.Center
                )

                HorizontalDivider(color = Color(0xFFE2E8F0))

                Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Text("SELECT DURATION", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        listOf(3, 7, 15, 30).forEach { days ->
                            val isSelected = selectedDuration == days
                            Box(
                                modifier = Modifier.weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSelected) Color(0xFF7C3AED) else Color(0xFFF1F5F9))
                                    .border(1.dp, if (isSelected) Color(0xFF7C3AED) else Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                                    .clickable { selectedDuration = days }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$days Days",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White else Color(0xFF475569)
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFF8FAFC)).padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text("TOTAL COST", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            GoldDollarIcon(size = 14)
                            Text(
                                text = String.format("%,d", finalPrice),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = if (canAfford) Color(0xFFD97706) else Color(0xFFEF4444)
                            )
                        }
                    }
                    if (!canAfford) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.Error, null, tint = Color(0xFFEF4444), modifier = Modifier.size(12.dp))
                            Text("Insufficient", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text("Cancel", fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                    }
                    if (onGift != null && !item.notForSale) {
                        Button(
                            onClick = { onGift(selectedDuration) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899)),
                            enabled = !isProcessing && canAfford,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f).height(44.dp)
                        ) {
                            if (isProcessing) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            } else {
                                Text("\uD83C\uDF81 Gift", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                    Button(
                        onClick = { onConfirmPurchase(selectedDuration) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                        enabled = !isProcessing && canAfford,
                        shape = RoundedCornerShape(12.dp),
                        modifier = if (onGift != null && !item.notForSale) Modifier.weight(1f).height(44.dp) else Modifier.weight(1.5f).height(44.dp)
                    ) {
                        if (isProcessing) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Buy Now", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }
    }
}
