package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// ─────────────────────────────────────────────────────────────────────────────
// SellerTransferDialog — 1-to-1 RN parity of SellerTransferDialog.tsx
// Center modal, coin transfer form with recipient search by accountNumber
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun SellerTransferDialog(
    visible: Boolean,
    onDismiss: () -> Unit,
    userTags: List<String> = emptyList(),
    userCoins: Long = 0L
) {
    if (!visible) return

    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()

    val SELLER_TAGS = listOf("Seller", "Seller center", "Coin Seller")
    val CREATOR_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1"
    val isAuthorized = userTags.any { it in SELLER_TAGS } || uid == CREATOR_ID

    var recipientId by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    var isSearching by remember { mutableStateOf(false) }
    var foundRecipient by remember { mutableStateOf<Map<String, Any>?>(null) }
    var recipientName by remember { mutableStateOf("") }

    // Auto-close if permission revoked
    LaunchedEffect(visible, isAuthorized) {
        if (visible && !isAuthorized && uid != CREATOR_ID) {
            onDismiss()
        }
    }

    // Recipient lookup with debounce
    LaunchedEffect(recipientId) {
        if (recipientId.length < 1) {
            foundRecipient = null
            recipientName = ""
            return@LaunchedEffect
        }
        isSearching = true
        kotlinx.coroutines.delay(500)
        try {
            val snap = db.collection("users")
                .whereEqualTo("accountNumber", recipientId.trim())
                .limit(1)
                .get()
                .await()
            if (!snap.isEmpty) {
                val doc = snap.documents[0]
                foundRecipient = doc.data
                recipientName = doc.getString("username") ?: doc.getString("name") ?: "Unknown"
            } else {
                foundRecipient = null
                recipientName = ""
            }
        } catch (_: Exception) {
            foundRecipient = null
            recipientName = ""
        } finally {
            isSearching = false
        }
    }

    fun handleTransfer() {
        val coinsToTransfer = amount.toLongOrNull() ?: return
        if (coinsToTransfer <= 0 || foundRecipient == null) return
        if (coinsToTransfer > userCoins) return
        val recipientUid = foundRecipient?.get("uid") ?: foundRecipient?.get("id") ?: return
        if (recipientUid == uid) return

        isProcessing = true
        scope.launch {
            try {
                // Fresh auth check
                val freshSnap = db.collection("users").document(uid).get().await()
                val freshTags = freshSnap.get("tags") as? List<String> ?: emptyList()
                val isStillAuthorized = freshTags.any { it in SELLER_TAGS } || uid == CREATOR_ID
                if (!isStillAuthorized) {
                    isProcessing = false
                    onDismiss()
                    return@launch
                }

                // Batch transfer
                val batch = db.batch()
                val senderRef = db.collection("users").document(uid)
                val senderProfileRef = db.collection("users").document(uid).collection("profile").document(uid)
                val receiverRef = db.collection("users").document(recipientUid.toString())
                val receiverProfileRef = db.collection("users").document(recipientUid.toString()).collection("profile").document(recipientUid.toString())
                val receiverNotifRef = db.collection("users").document(recipientUid.toString()).collection("notifications").document()

                batch.update(senderRef, mapOf(
                    "wallet.coins" to com.google.firebase.firestore.FieldValue.increment(-coinsToTransfer),
                    "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                ))
                batch.update(senderProfileRef, mapOf(
                    "wallet.coins" to com.google.firebase.firestore.FieldValue.increment(-coinsToTransfer),
                    "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                ))
                batch.update(receiverRef, mapOf(
                    "wallet.coins" to com.google.firebase.firestore.FieldValue.increment(coinsToTransfer),
                    "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                ))
                batch.update(receiverProfileRef, mapOf(
                    "wallet.coins" to com.google.firebase.firestore.FieldValue.increment(coinsToTransfer),
                    "updatedAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
                ))
                batch.set(receiverNotifRef, mapOf(
                    "title" to "Coins Dispatched",
                    "content" to "You received $coinsToTransfer Gold Coins from Official Seller.",
                    "type" to "system",
                    "timestamp" to com.google.firebase.firestore.FieldValue.serverTimestamp(),
                    "isRead" to false
                ))

                batch.commit().await()
                isProcessing = false
                onDismiss()
            } catch (_: Exception) {
                isProcessing = false
            }
        }
    }

    // ── Center Dialog — RN: centered modal with white bg, borderRadius:24 ──
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header — RN L153-158
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "SELLER CENTER",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF1E293B)
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .clickable { onDismiss() }
                            .padding(4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Close, "Close", tint = Color(0xFF64748B), modifier = Modifier.size(20.dp))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Recipient Account ID — RN L161-177
                Text(
                    "RECIPIENT ACCOUNT ID",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF64748B),
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
                )
                OutlinedTextField(
                    value = recipientId,
                    onValueChange = { recipientId = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Enter Account Number", color = Color(0xFFCBD5E1)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFCBD5E1),
                        unfocusedBorderColor = Color(0xFFCBD5E1),
                        focusedContainerColor = Color(0xFFF8FAFC),
                        unfocusedContainerColor = Color(0xFFF8FAFC),
                        focusedTextColor = Color(0xFF1E293B),
                        unfocusedTextColor = Color(0xFF1E293B),
                        cursorColor = Color(0xFFEF4444)
                    )
                )

                // Searching indicator
                if (isSearching) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp).padding(top = 8.dp),
                        color = Color(0xFFEF4444),
                        strokeWidth = 2.dp
                    )
                }

                // Found recipient card — RN L171-176
                if (!isSearching && foundRecipient != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFFEF2F2))
                            .border(1.dp, Color(0xFFFEE2E2), RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Person, null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            recipientName,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFB91C1C)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Coins Amount — RN L179-191
                Text(
                    "COINS AMOUNT",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF64748B),
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
                )
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it.filter { c -> c.isDigit() } },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Enter Transfer Amount", color = Color(0xFFCBD5E1)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFCBD5E1),
                        unfocusedBorderColor = Color(0xFFCBD5E1),
                        focusedContainerColor = Color(0xFFF8FAFC),
                        unfocusedContainerColor = Color(0xFFF8FAFC),
                        focusedTextColor = Color(0xFF1E293B),
                        unfocusedTextColor = Color(0xFF1E293B),
                        cursorColor = Color(0xFFEF4444)
                    )
                )
                Text(
                    "Your balance: %,d coins".format(userCoins),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(start = 4.dp, top = 6.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Dispatch button — RN L193-209
                val canSubmit = foundRecipient != null && amount.isNotEmpty() && !isProcessing
                Button(
                    onClick = { handleTransfer() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (canSubmit) Color(0xFFEF4444) else Color(0xFFCBD5E1)
                    ),
                    enabled = canSubmit
                ) {
                    if (isProcessing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Default.Send, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "DISPATCH COINS",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}
