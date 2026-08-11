package app.vercel.ummy_chat.twa.ui.wallet

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.Timestamp
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import app.vercel.ummy_chat.twa.ui.profile.GoldDollarIcon
import app.vercel.ummy_chat.twa.ui.profile.PremiumDiamondIcon

data class CoinPackage(val id: String, val amount: String, val price: String, val bonus: Long?)
data class DiamondPackage(val id: String, val diamonds: Long, val coins: Long)

val COIN_PACKAGES = listOf(
    CoinPackage("p1", "50,000", "10", null),
    CoinPackage("p2", "500,000", "100", null),
    CoinPackage("p3", "2,500,000", "500", 250000L),
    CoinPackage("p4", "5,000,000", "1000", 750000L),
    CoinPackage("p5", "12,500,000", "2500", 2500000L),
    CoinPackage("p6", "50,000,000", "10000", 13500000L)
)

val DIAMOND_EXCHANGE_PACKAGES = listOf(
    DiamondPackage("d1", 100L, 33L),
    DiamondPackage("d2", 1000000L, 330000L),
    DiamondPackage("d3", 5000000L, 1650000L),
    DiamondPackage("d4", 50000000L, 16500000L),
    DiamondPackage("d5", 90000000L, 29700000L)
)

const val CONVERSION_RATE = 0.33

fun formatNumberWithCommas(num: Long): String {
    return String.format(java.util.Locale.US, "%,d", num)
}

fun formatTimeAgo(timestamp: Timestamp?): String {
    if (timestamp == null) return "Just now"
    val diffMs = System.currentTimeMillis() - (timestamp.seconds * 1000)
    val diffMins = diffMs / 60000
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return "${diffMins}m ago"
    val diffHours = diffMins / 60
    if (diffHours < 24) return "${diffHours}h ago"
    val diffDays = diffHours / 24
    return "${diffDays}d ago"
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val db = Firebase.firestore
    val auth = Firebase.auth
    val uid = auth.currentUser?.uid

    // User state
    var coins by remember { mutableLongStateOf(0L) }
    var diamonds by remember { mutableLongStateOf(0L) }
    var username by remember { mutableStateOf("") }
    var accountNumber by remember { mutableStateOf("") }

    // Config state
    var upiId by remember { mutableStateOf("7209741932@ptyes") }
    var upiName by remember { mutableStateOf("Ummy Chat") }
    var paymentQrUrl by remember { mutableStateOf("") }

    // UI screen states
    var activeTab by remember { mutableStateOf("Coins") }
    var selectedPackageId by remember { mutableStateOf("p1") }
    var selectedDiamondId by remember { mutableStateOf("d1") }

    // Text inputs
    var utrNumber by remember { mutableStateOf("") }
    var customDiamonds by remember { mutableStateOf("") }

    // Loading & action states
    var submittingManual by remember { mutableStateOf(false) }
    var exchangingPreset by remember { mutableStateOf(false) }
    var exchangingCustom by remember { mutableStateOf(false) }
    var transactions by remember { mutableStateOf<List<Map<String, Any?>>>(emptyList()) }
    var loadingTx by remember { mutableStateOf(true) }

    // ── Listen to real-time user coins/diamonds balance ──
    DisposableEffect(uid) {
        if (uid == null) return@DisposableEffect onDispose {}

        val unsub = db.collection("users").document(uid)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null && snapshot.exists()) {
                    username = snapshot.getString("username") ?: "Tribe Member"
                    accountNumber = snapshot.getString("accountNumber") ?: "0000"
                    
                    val wallet = snapshot.get("wallet") as? Map<*, *>
                    coins = (wallet?.get("coins") as? Number)?.toLong() ?: 0L
                    diamonds = (wallet?.get("diamonds") as? Number)?.toLong() ?: 0L
                }
            }
        onDispose { unsub.remove() }
    }

    // ── Listen to Global Payment Config ──
    LaunchedEffect(Unit) {
        db.collection("appConfig").document("global")
            .get()
            .addOnSuccessListener { snap ->
                if (snap != null && snap.exists()) {
                    upiId = snap.getString("upiId") ?: "7209741932@ptyes"
                    upiName = snap.getString("upiName") ?: "Ummy Chat"
                    paymentQrUrl = snap.getString("paymentQrUrl") ?: ""
                }
            }
    }

    // ── Listen to Transaction history collection ──
    DisposableEffect(uid) {
        if (uid == null) {
            loadingTx = false
            return@DisposableEffect onDispose {}
        }

        val unsub = db.collection("users").document(uid)
            .collection("transactions")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(200)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null) {
                    val list = mutableListOf<Map<String, Any?>>()
                    for (doc in snapshot.documents) {
                        val map = doc.data
                        if (map != null) {
                            list.add(map)
                        }
                    }
                    transactions = list
                }
                loadingTx = false
            }
        onDispose { unsub.remove() }
    }

    // 1. RECHARGE COINS FLOW
    val handleOpenUPI = {
        val pkg = COIN_PACKAGES.find { it.id == selectedPackageId }
        if (pkg != null) {
            val amountFormatted = String.format(java.util.Locale.US, "%.2f", pkg.price.toDouble())
            val upiUri = "upi://pay?pa=$upiId&pn=${Uri.encode(upiName)}&am=$amountFormatted&cu=INR&tn=${Uri.encode("Recharge ${pkg.amount} Coins")}"
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUri))
                context.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "Could not launch UPI apps. Scan QR manually.", Toast.LENGTH_LONG).show()
            }
        }
    }

    val handleSubmitManualRecharge = {
        if (uid != null && utrNumber.isNotBlank()) {
            val pkg = COIN_PACKAGES.find { it.id == selectedPackageId }
            if (pkg != null) {
                submittingManual = true
                val coinsAmount = pkg.amount.replace(",", "").toLong()
                val bonusAmount = pkg.bonus ?: 0L

                val requestData = hashMapOf(
                    "uid" to uid,
                    "username" to username,
                    "accountNumber" to accountNumber,
                    "amount" to pkg.price,
                    "coins" to coinsAmount,
                    "bonus" to bonusAmount,
                    "utrNumber" to utrNumber.trim(),
                    "status" to "pending",
                    "createdAt" to FieldValue.serverTimestamp()
                )

                db.collection("rechargeRequests").add(requestData)
                    .addOnSuccessListener {
                        // Write transaction ledger entry
                        db.collection("users").document(uid)
                            .collection("transactions")
                            .add(
                                hashMapOf(
                                    "amount" to (coinsAmount + bonusAmount),
                                    "currency" to "coins",
                                    "type" to "recharge",
                                    "source" to "Manual Recharge",
                                    "description" to "Coins Recharge (Pending: UTR ${utrNumber.trim()})",
                                    "timestamp" to FieldValue.serverTimestamp()
                                )
                            )
                        Toast.makeText(context, "Recharge request submitted successfully!", Toast.LENGTH_LONG).show()
                        utrNumber = ""
                        submittingManual = false
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(context, "Failed: ${e.message}", Toast.LENGTH_LONG).show()
                        submittingManual = false
                    }
            }
        }
    }

    // 2. EXCHANGE DIAMONDS FLOW
    val handlePresetExchange = {
        val pkg = DIAMOND_EXCHANGE_PACKAGES.find { it.id == selectedDiamondId }
        if (pkg != null && uid != null) {
            val reqDiamonds = pkg.diamonds
            val resCoins = pkg.coins

            if (diamonds < reqDiamonds) {
                Toast.makeText(context, "Insufficient diamonds balance.", Toast.LENGTH_SHORT).show()
            } else {
                exchangingPreset = true
                val newDiamonds = diamonds - reqDiamonds
                val newCoins = coins + resCoins

                val batch = db.batch()
                val uRef = db.collection("users").document(uid)
                val pRef = db.collection("users").document(uid).collection("profile").document(uid)

                batch.update(uRef, "wallet.diamonds", newDiamonds, "wallet.coins", newCoins, "updatedAt", FieldValue.serverTimestamp())
                batch.update(pRef, "wallet.diamonds", newDiamonds, "wallet.coins", newCoins, "updatedAt", FieldValue.serverTimestamp())

                val auditRef = db.collection("users").document(uid).collection("diamondExchanges").document()
                batch.set(
                    auditRef, hashMapOf(
                        "id" to auditRef.id,
                        "type" to "exchange",
                        "diamondAmount" to reqDiamonds,
                        "coinAmount" to resCoins,
                        "timestamp" to FieldValue.serverTimestamp()
                    )
                )

                val txCoinsRef = db.collection("users").document(uid).collection("transactions").document()
                batch.set(
                    txCoinsRef, hashMapOf(
                        "amount" to resCoins,
                        "currency" to "coins",
                        "type" to "exchange",
                        "source" to "Diamond Exchange",
                        "description" to "Exchanged ${formatNumberWithCommas(reqDiamonds)} Diamonds for Coins",
                        "timestamp" to FieldValue.serverTimestamp()
                    )
                )

                val txDiamondsRef = db.collection("users").document(uid).collection("transactions").document()
                batch.set(
                    txDiamondsRef, hashMapOf(
                        "amount" to -reqDiamonds,
                        "currency" to "diamonds",
                        "type" to "exchange",
                        "source" to "Diamond Exchange",
                        "description" to "Exchanged Diamonds for ${formatNumberWithCommas(resCoins)} Coins",
                        "timestamp" to FieldValue.serverTimestamp()
                    )
                )

                batch.commit()
                    .addOnSuccessListener {
                        Toast.makeText(context, "Exchanged successfully!", Toast.LENGTH_LONG).show()
                        exchangingPreset = false
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(context, "Exchange failed: ${e.message}", Toast.LENGTH_LONG).show()
                        exchangingPreset = false
                    }
            }
        }
    }

    val handleCustomExchange = {
        val reqDiamonds = customDiamonds.toLongOrNull() ?: 0L
        if (reqDiamonds <= 0L) {
            Toast.makeText(context, "Please enter a valid amount.", Toast.LENGTH_SHORT).show()
        } else if (diamonds < reqDiamonds) {
            Toast.makeText(context, "Insufficient diamonds balance.", Toast.LENGTH_SHORT).show()
        } else if (uid != null) {
            exchangingCustom = true
            val resCoins = (reqDiamonds * CONVERSION_RATE).toLong()
            val newDiamonds = diamonds - reqDiamonds
            val newCoins = coins + resCoins

            val batch = db.batch()
            val uRef = db.collection("users").document(uid)
            val pRef = db.collection("users").document(uid).collection("profile").document(uid)

            batch.update(uRef, "wallet.diamonds", newDiamonds, "wallet.coins", newCoins, "updatedAt", FieldValue.serverTimestamp())
            batch.update(pRef, "wallet.diamonds", newDiamonds, "wallet.coins", newCoins, "updatedAt", FieldValue.serverTimestamp())

            val auditRef = db.collection("users").document(uid).collection("diamondExchanges").document()
            batch.set(
                auditRef, hashMapOf(
                    "id" to auditRef.id,
                    "type" to "exchange",
                    "diamondAmount" to reqDiamonds,
                    "coinAmount" to resCoins,
                    "timestamp" to FieldValue.serverTimestamp()
                )
            )

            val txCoinsRef = db.collection("users").document(uid).collection("transactions").document()
            batch.set(
                txCoinsRef, hashMapOf(
                    "amount" to resCoins,
                    "currency" to "coins",
                    "type" to "exchange",
                    "source" to "Diamond Exchange",
                    "description" to "Exchanged ${formatNumberWithCommas(reqDiamonds)} Diamonds for Coins",
                    "timestamp" to FieldValue.serverTimestamp()
                )
            )

            val txDiamondsRef = db.collection("users").document(uid).collection("transactions").document()
            batch.set(
                txDiamondsRef, hashMapOf(
                    "amount" to -reqDiamonds,
                    "currency" to "diamonds",
                    "type" to "exchange",
                    "source" to "Diamond Exchange",
                    "description" to "Exchanged Diamonds for ${formatNumberWithCommas(resCoins)} Coins",
                    "timestamp" to FieldValue.serverTimestamp()
                )
            )

            batch.commit()
                .addOnSuccessListener {
                    Toast.makeText(context, "Converted successfully!", Toast.LENGTH_LONG).show()
                    customDiamonds = ""
                    exchangingCustom = false
                }
                .addOnFailureListener { e ->
                    Toast.makeText(context, "Conversion failed: ${e.message}", Toast.LENGTH_LONG).show()
                    exchangingCustom = false
                }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // 1. Header Bar
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Text("‹", fontSize = 34.sp, fontWeight = FontWeight.Light, color = Color(0xFF1E293B))
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "SUPREME WALLET",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1E293B),
                    letterSpacing = 0.5.sp
                )
            }
            HorizontalDivider(color = Color(0xFFF1F5F9), thickness = 1.dp)
        }

        // 2. Tab selection segment
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFFF1F5F9))
                    .padding(4.dp)
            ) {
                listOf("Coins", "Diamonds").forEach { tab ->
                    val isSelected = activeTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color.White else Color.Transparent)
                            .clickable { activeTab = tab }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (tab == "Coins") "COINS UPLOADER" else "DIAMONDS EXCHANGE",
                            color = if (isSelected) Color(0xFF1E293B) else Color(0xFF64748B),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            letterSpacing = 0.2.sp
                        )
                    }
                }
            }
        }

        // 3. Balance Gradient Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                if (activeTab == "Coins") {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(95.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(Color(0xFFFFD700), Color(0xFFFDB931), Color(0xFF9E7302))
                                )
                            )
                            .padding(16.dp)
                    ) {
                        Column(modifier = Modifier.align(Alignment.CenterStart)) {
                            Text(
                                "Coins Balance",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White.copy(alpha = 0.85f),
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formatNumberWithCommas(coins),
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                overflow = TextOverflow.Ellipsis,
                                maxLines = 1
                            )
                        }
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .size(48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            GoldDollarIcon(size = 48)
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(95.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(Color(0xFF00D2FF), Color(0xFF3A7BD5), Color(0xFF004E92))
                                )
                            )
                            .padding(16.dp)
                    ) {
                        Column(modifier = Modifier.align(Alignment.CenterStart)) {
                            Text(
                                "Diamonds",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White.copy(alpha = 0.85f),
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formatNumberWithCommas(diamonds),
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                overflow = TextOverflow.Ellipsis,
                                maxLines = 1
                            )
                        }
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .size(48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            PremiumDiamondIcon(size = 40)
                        }
                    }
                }
            }
        }

        // 4. Tab Contents
        if (activeTab == "Coins") {
            item {
                Text(
                    text = "SELECT COIN RECHARGE PACKAGE",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1E293B),
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp)
                )
            }

            // Coin Packages list mapping
            items(COIN_PACKAGES) { pkg ->
                val selected = selectedPackageId == pkg.id
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (selected) Color(0xFFF5F3FF) else Color(0xFFF8FAFC))
                        .border(
                            width = 1.5.dp,
                            color = if (selected) Color(0xFF7C3AED) else Color(0xFFE2E8F0),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .clickable { selectedPackageId = pkg.id }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        GoldDollarIcon(size = 22)
                        Column {
                            Text(
                                text = pkg.amount,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF1E293B)
                            )
                            if (pkg.bonus != null) {
                                Text(
                                    text = "BONUS: +${formatNumberWithCommas(pkg.bonus)}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF10B981)
                                )
                            }
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFF7C3AED))
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "₹${pkg.price}",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            // UPI Box
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFFF5F3FF))
                        .border(1.5.dp, Color(0xFFE0E7FF), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "INSTANT UPI REDIRECT",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF7C3AED)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Open PhonePe, Google Pay, or Paytm directly to recharge the selected package.",
                            fontSize = 11.sp,
                            color = Color(0xFF6366F1),
                            lineHeight = 16.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = handleOpenUPI,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                        ) {
                            Text(
                                text = "PAY INSTANTLY VIA UPI APP",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            // Manual Verification Box
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFFF8FAFC))
                        .border(1.5.dp, Color(0xFFE2E8F0), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "2. SUBMIT UTR / TRANSACTION ID",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF1E293B)
                        )
                        if (paymentQrUrl.isNotBlank()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Alternatively, scan QR manually to pay:",
                                    fontSize = 10.sp,
                                    color = Color(0xFF64748B),
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                AsyncImage(
                                    model = paymentQrUrl,
                                    contentDescription = "Payment QR Code",
                                    modifier = Modifier
                                        .size(160.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = utrNumber,
                            onValueChange = { if (it.length <= 20) utrNumber = it },
                            placeholder = { Text("Enter 12-Digit UPI Ref / UTR / Txn ID", fontSize = 13.sp) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = handleSubmitManualRecharge,
                            enabled = !submittingManual && utrNumber.isNotBlank(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF0F172A),
                                disabledContainerColor = Color(0xFFCBD5E1)
                            )
                        ) {
                            if (submittingManual) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            } else {
                                Text(
                                    text = "VERIFY TRANSACTION ID",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        } else {
            // Diamonds Exchange Tab
            item {
                Text(
                    text = "PRESET EXCHANGE VAULTS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1E293B),
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp)
                )
            }

            // Diamonds Packages mapping list
            items(DIAMOND_EXCHANGE_PACKAGES) { pkg ->
                val selected = selectedDiamondId == pkg.id
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (selected) Color(0xFFF5F3FF) else Color(0xFFF8FAFC))
                        .border(
                            width = 1.5.dp,
                            color = if (selected) Color(0xFF7C3AED) else Color(0xFFE2E8F0),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .clickable { selectedDiamondId = pkg.id }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        PremiumDiamondIcon(size = 24)
                        Text(
                            text = formatNumberWithCommas(pkg.diamonds),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF1E293B)
                        )
                    }

                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFE6FDF4))
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "RECEIVE:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF10B981)
                        )
                        GoldDollarIcon(size = 18)
                        Text(
                            text = formatNumberWithCommas(pkg.coins),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF10B981)
                        )
                    }
                }
            }

            // Preset Convert Button
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Button(
                        onClick = handlePresetExchange,
                        enabled = !exchangingPreset,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))
                    ) {
                        if (exchangingPreset) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Text(
                                "EXCHANGE PRESET PACKAGE",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            // Custom Exchange conversion box
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFFF0FDFA))
                        .border(1.5.dp, Color(0xFFCCFBF1), RoundedCornerShape(20.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text(
                            text = "CUSTOM DIAMOND CONVERSION",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF1E293B)
                        )
                        Text(
                            text = "Rate: 100 Diamonds = 33 Coins",
                            fontSize = 10.sp,
                            color = Color(0xFF64748B),
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = customDiamonds,
                            onValueChange = { customDiamonds = it.filter { c -> c.isDigit() } },
                            placeholder = { Text("Enter Diamond Amount", fontSize = 13.sp) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        val enteredDiamonds = customDiamonds.toLongOrNull() ?: 0L
                        if (enteredDiamonds > 0L) {
                            val computedCoins = (enteredDiamonds * CONVERSION_RATE).toLong()
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(start = 4.dp)
                            ) {
                                Text(
                                    text = "WILL RECEIVE: ",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF0D9488)
                                )
                                GoldDollarIcon(size = 15)
                                Text(
                                    text = "${formatNumberWithCommas(computedCoins)} COINS",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFFFBBF24)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = handleCustomExchange,
                            enabled = !exchangingCustom && customDiamonds.isNotBlank(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF0F172A),
                                disabledContainerColor = Color(0xFFCBD5E1)
                            )
                        ) {
                            if (exchangingCustom) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            } else {
                                Text(
                                    text = "CONVERT TO COINS",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        // 5. Transaction History Section Title
        item {
            HorizontalDivider(
                color = Color(0xFFF1F5F9),
                thickness = 1.dp,
                modifier = Modifier.padding(top = 28.dp, bottom = 20.dp)
            )
            Text(
                text = "TRANSACTION HISTORY",
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1E293B),
                modifier = Modifier.padding(horizontal = 18.dp)
            )
        }

        // 6. Transaction History Feed List
        if (loadingTx) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF7C3AED), modifier = Modifier.size(24.dp))
                }
            }
        } else if (transactions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No transactions recorded yet",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        } else {
            items(transactions) { tx ->
                val rawAmount = (tx["amount"] as? Number)?.toLong() ?: 0L
                val isPositive = rawAmount > 0
                val currency = tx["currency"]?.toString() ?: "coins"
                val isCoins = currency.lowercase() == "coins"
                val description = tx["description"]?.toString() ?: "Transaction"
                val type = tx["type"]?.toString() ?: ""
                val source = tx["source"]?.toString() ?: ""
                val timestamp = tx["timestamp"] as? Timestamp

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFF8FAFC))
                        .border(1.5.dp, Color(0xFFE2E8F0), RoundedCornerShape(16.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = description,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF1E293B)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${if (source.isNotBlank()) "[$source] " else ""}${type.uppercase()} • ${formatTimeAgo(timestamp)}",
                            fontSize = 9.sp,
                            color = Color(0xFF94A3B8),
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (isCoins) GoldDollarIcon(size = 18) else PremiumDiamondIcon(size = 18)
                        Text(
                            text = "${if (isPositive) "+" else ""}${formatNumberWithCommas(rawAmount)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isPositive) Color(0xFF10B981) else Color(0xFFEF4444)
                        )
                    }
                }
            }
        }
    }
}
