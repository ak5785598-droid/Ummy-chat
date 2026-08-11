package app.vercel.ummy_chat.twa.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch

@Composable
fun RechargeRequestsTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var requests by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf<String?>(null) }

    DisposableEffect(Unit) {
        val listener = db.collection("rechargeRequests")
            .whereEqualTo("status", "pending")
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    message = "Error: ${error.message}"
                    isLoading = false
                    return@addSnapshotListener
                }
                if (snap != null) {
                    requests = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
                }
                isLoading = false
            }
        onDispose { listener.remove() }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Header
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.AccountBalance, null, tint = Color(0xFF22C55E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Recharge Requests", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
            Spacer(modifier = Modifier.weight(1f))
            Text("${requests.size} pending", fontSize = 12.sp, color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
        }

        Divider(color = Color(0xFFF1F5F9))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF22C55E))
            }
        } else if (requests.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("NO PENDING RECHARGE REQUESTS", fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color(0xFFCBD5E1))
            }
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
                requests.forEach { req ->
                    val reqId = req["id"] as? String ?: return@forEach
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val timestamp = req["createdAt"] as? com.google.firebase.Timestamp
                                val dateStr = timestamp?.toDate()?.toString() ?: "Pending..."
                                Text(dateStr, fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF64748B))
                                Spacer(modifier = Modifier.weight(1f))
                                Text("₹${req["amount"] ?: 0}", fontWeight = FontWeight.Black, color = Color(0xFF1E293B), fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("User: ${req["username"] ?: "Unknown"} (ID: ${req["accountNumber"] ?: "N/A"})", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color(0xFF334155))
                            Text("Method: ${req["paymentMethod"] ?: "UPI"}", fontSize = 11.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 2.dp))
                            if (req["utr"] != null) {
                                Text("UTR/Txn ID: ${req["utr"]}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569), modifier = Modifier.padding(top = 2.dp))
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                // Approve
                                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFF22C55E)).clickable {
                                    if (userLevel < 5) {
                                        message = "Error: Unauthorized."
                                        return@clickable
                                    }
                                    scope.launch {
                                        try {
                                            db.collection("rechargeRequests").document(reqId).update(
                                                mapOf(
                                                    "status" to "approved",
                                                    "processedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                                                )
                                            ).await()
                                            message = "Success: Request has been approved."
                                        } catch (e: Exception) { message = "Error: ${e.message}" }
                                    }
                                }.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                                    Text("APPROVE", color = Color.White, fontWeight = FontWeight.Black, fontSize = 11.sp)
                                }
                                // Reject
                                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFFEF4444)).clickable {
                                    if (userLevel < 5) {
                                        message = "Error: Unauthorized."
                                        return@clickable
                                    }
                                    scope.launch {
                                        try {
                                            db.collection("rechargeRequests").document(reqId).update(
                                                mapOf(
                                                    "status" to "rejected",
                                                    "processedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                                                )
                                            ).await()
                                            message = "Success: Request has been rejected."
                                        } catch (e: Exception) { message = "Error: ${e.message}" }
                                    }
                                }.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                                    Text("REJECT", color = Color.White, fontWeight = FontWeight.Black, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        message?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(4000); message = null }
            val isError = it.startsWith("Error")
            Text(
                text = it,
                color = if (isError) Color(0xFFEF4444) else Color(0xFF22C55E),
                modifier = Modifier.padding(16.dp),
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }
    }
}

// ─── Financial Audit ─────────────────────────────────────────────────────────

@Composable
fun FinancialAuditTab(userLevel: Int, onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var auditLogs by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    DisposableEffect(Unit) {
        val listener = db.collection("coin_audit_logs")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(100)
            .addSnapshotListener { snap, error ->
                if (error != null) {
                    isLoading = false
                    return@addSnapshotListener
                }
                if (snap != null) {
                    auditLogs = snap.documents.mapNotNull { it.data?.plus("id" to it.id) }
                }
                isLoading = false
            }
        onDispose { listener.remove() }
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.List, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Financial Audit", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Divider(color = Color(0xFFF1F5F9))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF3B82F6))
            }
        } else if (auditLogs.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("NO AUDIT LOGS FOUND", fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color(0xFFCBD5E1))
            }
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
                auditLogs.forEach { log ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val timestamp = log["timestamp"] as? com.google.firebase.Timestamp
                                val dateStr = timestamp?.toDate()?.toString() ?: "Pending..."
                                Text(dateStr, fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF64748B))
                                Spacer(modifier = Modifier.weight(1f))
                                Text("+${log["amount"] ?: 0} Coins", fontWeight = FontWeight.Black, color = Color(0xFF22C55E), fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("From: ${log["adminName"] ?: "Admin"}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                            Text("To Account: ${log["targetAccount"] ?: "N/A"} (UID: ${log["targetName"] ?: "User"})", fontSize = 11.sp, color = Color(0xFF64748B), modifier = Modifier.padding(top = 2.dp))
                        }
                    }
                }
            }
        }
    }
}

// ─── Financial Settings ──────────────────────────────────────────────────────

@Composable
fun FinancialSettingsTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    var coin by remember { mutableStateOf("0") }
    var gem by remember { mutableStateOf("0") }
    var isLoading by remember { mutableStateOf(true) }
    var success by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("config").document("exchangeRate").get().await()
            if (snap.exists()) {
                coin = (snap.getLong("coin") ?: 0).toString()
                gem = (snap.getLong("gem") ?: 0).toString()
            }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White).padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CreditCard, null, tint = Color(0xFF22C55E), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Financial Settings", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Spacer(modifier = Modifier.height(24.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF7C3AED))
            }
        } else {
            Text("Exchange Rate Configuration", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF1E293B))
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = coin, onValueChange = { coin = it },
                label = { Text("Coins Per Recharge") },
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = gem, onValueChange = { gem = it },
                label = { Text("Gems Per Recharge") },
                modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
                shape = RoundedCornerShape(12.dp)
            )

            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF22C55E)).clickable {
                scope.launch {
                    try {
                        db.collection("config").document("exchangeRate").set(
                            mapOf("coin" to (coin.toLongOrNull() ?: 0), "gem" to (gem.toLongOrNull() ?: 0))
                        ).await()
                        success = "Exchange rates saved!"
                    } catch (e: Exception) { success = "Error: ${e.message}" }
                }
            }.padding(16.dp), contentAlignment = Alignment.Center) {
                Text("Save Exchange Rates", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }

            success?.let {
                LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }
                Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(top = 12.dp), fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── App Ledger ──────────────────────────────────────────────────────────────

@Composable
fun AppLedgerTab(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    var ledger by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        try {
            val snap = db.collection("ledger")
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(100).get().await()
            ledger = snap.documents.mapNotNull { it.data?.plus("docId" to it.id) }
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Storage, null, tint = Color(0xFF3B82F6), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("App Ledger", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
        }
        Divider(color = Color(0xFFF1F5F9))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF7C3AED))
            }
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
                ledger.forEach { entry ->
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AccountBalanceWallet, null, tint = Color(0xFF6366F1), modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(entry["action"] as? String ?: "Entry", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${entry["description"] ?: ""}", fontSize = 12.sp, color = Color(0xFF64748B))
                            }
                            Text("₹${entry["amount"] ?: 0}", fontWeight = FontWeight.Black, fontSize = 14.sp, color = if ((entry["type"] as? String) == "credit") Color(0xFF22C55E) else Color(0xFFEF4444))
                        }
                    }
                }
                if (ledger.isEmpty()) Text("No ledger entries", color = Color(0xFF94A3B8), modifier = Modifier.padding(16.dp))
            }
        }
    }
}
