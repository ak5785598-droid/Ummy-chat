package app.vercel.ummy_chat.twa.ui.games

import android.widget.Toast
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.MutableData
import com.google.firebase.database.Transaction
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max
import app.vercel.ummy_chat.twa.ui.home.GoldenCoin
import app.vercel.ummy_chat.twa.R

// -----------------------------------------------------------------------------
// TeenPattiGame — full port of RN teen-patti-game.tsx
// 3 factions (Wolf/Lion/Fish) betting, shared RTDB reveal transaction,
// gameOracle forced winners, card flip reveal, 20s betting countdown,
// RTDB playerBets + Firestore wallet writes.
// -----------------------------------------------------------------------------

private data class TeenChip(val value: Long, val label: String, val color: Long)

private val TEEN_CHIPS = listOf(
    TeenChip(10000L, "10K", 0xFF00E5FF),
    TeenChip(100000L, "100K", 0xFF2196F3),
    TeenChip(300000L, "300K", 0xFF9C27B0),
    TeenChip(1000000L, "1M", 0xFFF44336),
    TeenChip(2000000L, "2M", 0xFF795548),
    TeenChip(5000000L, "5M", 0xFFFFD700)
)

private data class TeenFaction(
    val id: String,
    val label: String,
    val emoji: String,
    val imageRes: Int,
    val color: Long,
    val gradient: List<Long>
)

private val TEEN_FACTIONS = listOf(
    TeenFaction("WOLF", "Wolf", "\uD83D\uDC3A", R.drawable.wolf, 0xFF4B4B4F, listOf(0xFF2D2D30, 0xFF4B4B4F)),
    TeenFaction("LION", "Lion", "\uD83E\uDD81", R.drawable.lion, 0xFF1DB88F, listOf(0xFF0F766E, 0xFF1DB88F)),
    TeenFaction("FISH", "Fish", "\uD83D\uDC1F", R.drawable.fish, 0xFF2C4F7C, listOf(0xFF1E3A5F, 0xFF2C4F7C))
)

private data class TeenCard(val value: String, val suit: String)

private val CARD_VALUES = listOf("A", "J", "Q", "K", "10", "9", "8", "7")
private val CARD_SUITS = listOf("\u2660", "\u2665", "\u2666", "\u2663")

@Composable
fun TeenPattiGame(
    onClose: () -> Unit,
    roomId: String?,
    onRoundEnd: (GameRoundEndData) -> Unit,
    isMuted: Boolean = false,
    onGoToWallet: () -> Unit = {}
) {
    val context = LocalContext.current
    val firestore = remember { FirebaseFirestore.getInstance() }
    val database = remember { FirebaseDatabase.getInstance() }
    val uid = remember { FirebaseAuth.getInstance().currentUser?.uid }

    // state
    var gameState by remember { mutableStateOf("launching") }
    var timeLeft by remember { mutableIntStateOf(20) }
    var roundStartTime by remember { mutableStateOf<Long?>(null) }
    var selectedChip by remember { mutableLongStateOf(10000L) }
    var myBets by remember { mutableStateOf(mapOf("WOLF" to 0L, "LION" to 0L, "FISH" to 0L)) }
    var totalPots by remember { mutableStateOf(mapOf("WOLF" to 0L, "LION" to 650000L, "FISH" to 800000L)) }
    var history by remember { mutableStateOf<List<String>>(emptyList()) }
    var winnerId by remember { mutableStateOf<String?>(null) }
    var cardReveal by remember { mutableStateOf<Map<String, List<TeenCard>>>(emptyMap()) }
    var totalWinAmount by remember { mutableLongStateOf(0L) }
    var localCoins by remember { mutableLongStateOf(0L) }
    var flippedCards by remember { mutableStateOf<Map<String, Boolean>>(emptyMap()) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }

    // refs
    val revealInitiatedRef = remember { mutableStateOf(false) }
    val isDealerRef = remember { mutableStateOf(false) }
    val locallyUpdatedCoinsRef = remember { mutableStateOf(false) }
    val processedRef = remember { mutableStateOf(false) }
    val myBetsRef = remember { mutableStateOf(mapOf("WOLF" to 0L, "LION" to 0L, "FISH" to 0L)) }
    val scope = rememberCoroutineScope()

    val screenW = LocalConfiguration.current.screenWidthDp
    val screenH = LocalConfiguration.current.screenHeightDp

    // firestore dual-doc write (users/{uid} + users/{uid}/profile/{uid})
    fun updateBothUserDocs(map: Map<String, Any>) {
        val u = uid ?: return
        try {
            val base = firestore.collection("users").document(u)
            base.update(map).addOnFailureListener { base.set(map, SetOptions.merge()) }
            val sub = firestore.collection("users").document(u).collection("profile").document(u)
            sub.update(map).addOnFailureListener { sub.set(map, SetOptions.merge()) }
        } catch (_: Exception) {}
    }

    fun saveBetsToRTDB(bets: Map<String, Long>) {
        val u = uid ?: return
        val r = roomId ?: return
        database.getReference("games/teen_patti_${r}/playerBets/$u")
            .setValue(mapOf("bets" to bets, "timestamp" to System.currentTimeMillis(), "username" to (userProfile?.get("username") ?: "Guest")))
            .addOnFailureListener {}
    }

    fun goWallet() {
        onClose()
        onGoToWallet()
    }

    fun fmt(v: Long): String = v.toString().reversed().chunked(3).joinToString(",").reversed()

    fun potLabel(v: Long): String {
        if (v >= 1_000_000L) return String.format(Locale.US, "%.1fM", v / 1_000_000.0)
        if (v >= 1_000L) return "${v / 1_000L}K"
        return "$v"
    }

    // place bet (RN handlePlaceBet)
    fun handlePlaceBet(factionId: String) {
        if (gameState != "betting" || uid == null) return
        if (localCoins < selectedChip) {
            Toast.makeText(context, "Insufficient coins \u2014 go to wallet", Toast.LENGTH_SHORT).show()
            goWallet()
            return
        }
        try {
            val dec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(-selectedChip), "coins" to FieldValue.increment(-selectedChip))
            updateBothUserDocs(dec)

            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val statsBatch = firestore.batch()
            statsBatch.set(firestore.collection("jackpots").document("daily"),
                mapOf("totalPool" to FieldValue.increment(selectedChip * 0.05)), SetOptions.merge())
            statsBatch.set(firestore.collection("gameDailyWagers").document("${uid}_${todayStr}"),
                mapOf("userId" to uid, "username" to (userProfile?.get("username") ?: "User"),
                    "avatarUrl" to (userProfile?.get("avatarUrl") ?: ""),
                    "coinsPlayed" to FieldValue.increment(selectedChip), "date" to todayStr), SetOptions.merge())
            statsBatch.commit().addOnFailureListener {}

            firestore.collection("users").document(uid).collection("transactions").add(
                mapOf("amount" to -selectedChip, "currency" to "coins", "type" to "game_bet",
                    "source" to "Teen Patti", "description" to "Teen Patti Bet ($factionId)",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}

            locallyUpdatedCoinsRef.value = true
            localCoins -= selectedChip
        } catch (_: Exception) {}

        val next = myBetsRef.value.toMutableMap()
        next[factionId] = (next[factionId] ?: 0L) + selectedChip
        myBetsRef.value = next
        myBets = next
        saveBetsToRTDB(next)

        val nextPots = totalPots.toMutableMap()
        nextPots[factionId] = (nextPots[factionId] ?: 0L) + selectedChip
        totalPots = nextPots
    }

    // finalize round (RN finalizeRound)
    suspend fun finalizeRound(winId: String) {
        winnerId = winId
        gameState = "result"

        val winAmount = Math.floor((myBetsRef.value[winId] ?: 0L) * 1.95).toLong()
        totalWinAmount = winAmount

        if (winAmount > 0) {
            val winDec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(winAmount), "coins" to FieldValue.increment(winAmount))
            updateBothUserDocs(winDec)
            locallyUpdatedCoinsRef.value = true
            localCoins += winAmount
            firestore.collection("globalGameWins").add(
                mapOf("gameId" to "teen-patti", "roomId" to (roomId ?: "null"), "userId" to uid,
                    "username" to (userProfile?.get("username") ?: "Guest"), "avatarUrl" to (userProfile?.get("avatarUrl") ?: "null"),
                    "amount" to winAmount, "betAmount" to (myBetsRef.value[winId] ?: 0L), "timestamp" to Date())
            ).addOnFailureListener {}
        }

        // credit all players from RTDB (handles users who exited mid-round)
        if (roomId != null) {
            try {
                val playerBetsRef = database.getReference("games/teen_patti_${roomId}/playerBets")
                val snapshot = playerBetsRef.get().await()
                val hasLocalBets = myBetsRef.value.values.any { it > 0 }
                if (snapshot.exists()) {
                    val allPlayers = snapshot.value as? Map<String, Any?> ?: emptyMap()
                    val batch2 = firestore.batch()
                    var hasOther = false
                    allPlayers.forEach { (userId, datum) ->
                        if (userId == uid && hasLocalBets) return@forEach
                        if (userId == uid && processedRef.value) return@forEach
                        val bets = (datum as? Map<*, *>)?.get("bets") as? Map<String, Any?> ?: return@forEach
                        val betAmt = (bets[winId] as? Number)?.toLong() ?: 0L
                        val playerWin = Math.floor(betAmt * 1.95).toLong()
                        if (playerWin > 0) {
                            hasOther = true
                            batch2.set(
                                firestore.collection("users").document(userId).collection("profile").document(userId),
                                mapOf("wallet.coins" to FieldValue.increment(playerWin)), SetOptions.merge()
                            )
                        }
                    }
                    if (hasOther) batch2.commit().await()
                }
                processedRef.value = true
                playerBetsRef.setValue(null).addOnFailureListener {}
            } catch (_: Exception) {}
        }

        val winnerFaction = TEEN_FACTIONS.firstOrNull { it.id == winId }
        onRoundEnd(
            GameRoundEndData(
                resultText = "${winnerFaction?.label ?: "Winner"} Wins!",
                resultEmoji = winnerFaction?.emoji ?: "\uD83C\uDFC6",
                resultImageRes = winnerFaction?.imageRes,
                myPrize = winAmount,
                myWager = myBetsRef.value[winId] ?: 0L
            )
        )
    }

    // coins sync from user doc
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snap = firestore.collection("users").document(uid).get().await()
            if (snap.exists()) userProfile = snap.data
            val coins = (snap.data?.get("wallet") as? Map<*, *>)?.get("coins") as? Number
                ?: snap.data?.get("coins") as? Number
            if (coins != null && !locallyUpdatedCoinsRef.value) localCoins = coins.toLong()
        } catch (_: Exception) {}
    }

    // On mount: check RTDB for pending bets from previous exit and credit/refund
    LaunchedEffect(uid, roomId) {
        if (uid == null || roomId == null) return@LaunchedEffect
        try {
            val pBetsRef = database.getReference("games/teen_patti_${roomId}/playerBets/$uid")
            val pbSnapshot = pBetsRef.get().await()
            if (!pbSnapshot.exists()) return@LaunchedEffect
            val data = pbSnapshot.value as? Map<String, Any?> ?: return@LaunchedEffect
            val bets = data["bets"] as? Map<String, Any?> ?: return@LaunchedEffect
            var totalWager = 0L
            bets.forEach { (_, v) -> totalWager += (v as? Number)?.toLong() ?: 0L }
            if (totalWager <= 0) {
                pBetsRef.setValue(null).addOnFailureListener {}
                return@LaunchedEffect
            }
            processedRef.value = true
            val gameSnap = database.getReference("games/teen_patti_$roomId").get().await()
            val gameData = gameSnap.value as? Map<String, Any?>
            val winId = gameData?.get("winId") as? String
            if (!winId.isNullOrEmpty()) {
                val betAmt = (bets[winId] as? Number)?.toLong() ?: 0L
                val playerWin = Math.floor(betAmt * 1.95).toLong()
                if (playerWin > 0) {
                    val winDec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(playerWin), "coins" to FieldValue.increment(playerWin))
                    updateBothUserDocs(winDec)
                    localCoins += playerWin
                }
            } else {
                val refund = mapOf<String, Any>("wallet.coins" to FieldValue.increment(totalWager), "coins" to FieldValue.increment(totalWager))
                updateBothUserDocs(refund)
                localCoins += totalWager
            }
            pBetsRef.setValue(null).addOnFailureListener {}
        } catch (_: Exception) {}
    }

    // entrance loader + bg breathing animation
    LaunchedEffect(Unit) {
        delay(1500)
        gameState = "betting"
        roundStartTime = System.currentTimeMillis()
    }

    // real-time ticking countdown based on roundStartTime (stable — not restarted every second)
    LaunchedEffect(gameState, roundStartTime) {
        if (gameState != "betting" || roundStartTime == null) return@LaunchedEffect
        val rt = roundStartTime ?: return@LaunchedEffect
        while (isActive) {
            val elapsed = (System.currentTimeMillis() - rt) / 1000
            val remaining = max(0, 20 - elapsed.toInt())
            timeLeft = remaining
            if (remaining <= 0) break
            delay(1000)
        }
    }

    // timer hits 0 -> shared reveal via RTDB transaction (all players same winner)
    LaunchedEffect(timeLeft, gameState) {
        if (gameState != "betting" || timeLeft != 0 || revealInitiatedRef.value) return@LaunchedEffect
        revealInitiatedRef.value = true
        isDealerRef.value = false

        // generate cards locally (same for all - just visual)
        val newCards = TEEN_FACTIONS.associate { f ->
            f.id to List(3) {
                TeenCard(CARD_VALUES.random(), CARD_SUITS.random())
            }
        }

        // shared winner via RTDB transaction
        var winId = ""
        if (roomId != null) {
            try {
                runTransactionAndWait(database.getReference("games/teen_patti_${roomId}"), object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val data = currentData.value as? Map<*, *>
                        if (data == null || data["status"] != "betting") return Transaction.abort()
                        val existing = data["winId"] as? String
                        if (!existing.isNullOrEmpty()) {
                            winId = existing
                            return Transaction.abort()
                        }
                        isDealerRef.value = true
                        winId = TEEN_FACTIONS.random().id
                        val newData = HashMap<String, Any?>()
                        newData["status"] = "reveal"
                        newData["winId"] = winId
                        newData["cards"] = newCards.mapValues { e -> e.value.map { c -> mapOf("value" to c.value, "suit" to c.suit) } }
                        newData["roundStartTime"] = data["roundStartTime"] ?: System.currentTimeMillis()
                        newData["updatedAt"] = System.currentTimeMillis()
                        currentData.value = newData
                        return Transaction.success(currentData)
                    }
                    override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
                })
            } catch (_: Exception) {}
        }

        if (winId.isEmpty()) {
            winId = TEEN_FACTIONS.random().id
            isDealerRef.value = true
        }

        if (isDealerRef.value) {
            try {
                val oracleSnap = firestore.collection("gameOracle").document("teen-patti").get().await()
                if (oracleSnap.exists()) {
                    val od = oracleSnap.data ?: emptyMap()
                    val isActive = od["isActive"] as? Boolean ?: false
                    if (isActive) {
                        val forced = od["forcedResult"] as? String
                        if (forced != null && TEEN_FACTIONS.any { it.id == forced }) winId = forced
                        firestore.collection("gameOracle").document("teen-patti")
                            .update(mapOf("isActive" to false)).addOnFailureListener {}
                        if (roomId != null) {
                            database.getReference("games/teen_patti_${roomId}")
                                .updateChildren(mapOf("winId" to winId)).addOnFailureListener {}
                        }
                    }
                }
            } catch (_: Exception) {}
        }

        // start reveal for all players
        cardReveal = newCards
        gameState = "reveal"
        TEEN_FACTIONS.forEachIndexed { fi, f ->
            (0 until 3).forEach { ci ->
                scope.launch {
                    delay(((fi * 3 + ci) * 200).toLong())
                    flippedCards = flippedCards + ("${f.id}_$ci" to true)
                }
            }
        }

        // after 2.5s -> finalize result
        delay(2500)
        finalizeRound(winId)

        // after 8s total -> reset to betting
        delay(5500)
        gameState = "betting"
        timeLeft = 20
        myBets = mapOf("WOLF" to 0L, "LION" to 0L, "FISH" to 0L)
        myBetsRef.value = mapOf("WOLF" to 0L, "LION" to 0L, "FISH" to 0L)
        totalPots = mapOf("WOLF" to 0L, "LION" to 0L, "FISH" to 0L)
        winnerId = null
        cardReveal = emptyMap()
        flippedCards = emptyMap()
        totalWinAmount = 0L
        revealInitiatedRef.value = false
        val newRoundStart = System.currentTimeMillis()
        roundStartTime = newRoundStart
        try {
            runTransactionAndWait(database.getReference("games/teen_patti_${roomId ?: "global"}"), object : Transaction.Handler {
                override fun doTransaction(currentData: MutableData): Transaction.Result {
                    val data = (currentData.value as? Map<String, Any?>)?.toMutableMap() ?: mutableMapOf()
                    data["status"] = "betting"
                    data["winId"] = null
                    data["cards"] = null
                    if (isDealerRef.value) {
                        val h = (data["history"] as? List<*>)?.mapNotNull { it.toString() } ?: emptyList()
                        data["history"] = (listOf(winId) + h).take(8)
                    }
                    data["roundStartTime"] = newRoundStart
                    data["updatedAt"] = System.currentTimeMillis()
                    currentData.value = data
                    return Transaction.success(currentData)
                }
                override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
            })
        } catch (_: Exception) {}
    }

    // RTDB sync - shared history, cards for all players
    LaunchedEffect(roomId) {
        val target = database.getReference("games/teen_patti_${roomId ?: "global"}")
        val listener = object : ValueEventListener {
            override fun onCancelled(error: DatabaseError) {}
            override fun onDataChange(snap: DataSnapshot) {
                if (!snap.exists()) {
                    target.setValue(mapOf(
                        "status" to "betting", "winId" to null, "cards" to null,
                        "history" to emptyList<String>(), "roundStartTime" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    )).addOnFailureListener {}
                    return
                }
                val data = snap.value as? Map<String, Any?>
                val h = data?.get("history")
                if (h is List<*>) {
                    history = h.mapNotNull { it.toString() }
                } else if (h is Map<*, *>) {
                    history = h.values.mapNotNull { it.toString() }
                }
                val cards = data?.get("cards")
                if (cards is Map<*, *>) {
                    val parsed = mutableMapOf<String, List<TeenCard>>()
                    cards.forEach { (k, v) ->
                        val key = k as? String ?: return@forEach
                        val list = v as? List<*> ?: return@forEach
                        parsed[key] = list.mapNotNull { entry ->
                            val m = entry as? Map<*, *> ?: return@mapNotNull null
                            val value = m["value"] as? String ?: return@mapNotNull null
                            val suit = m["suit"] as? String ?: return@mapNotNull null
                            TeenCard(value, suit)
                        }
                    }
                    cardReveal = parsed
                }
            }
        }
        target.addValueEventListener(listener)
        try { awaitCancellation() } finally { target.removeEventListener(listener) }
    }

    // launching splash
    if (gameState == "launching") {
        TeenPattiLaunchingScreen()
        return
    }

    // pulse animation for countdown badge (last 5s)
    val infinite = rememberInfiniteTransition(label = "teenpatti")
    val pulse by infinite.animateFloat(0.6f, 1f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "p")
    val bgScale by infinite.animateFloat(1f, 1.05f, infiniteRepeatable(tween(12000), RepeatMode.Reverse), label = "bg")

    val isResult = gameState == "result"
    val totalBet = myBets.values.sum()

    Box(
        Modifier
            .fillMaxSize()
            .background(Color(0xFF3B0764))
    ) {
        // background image with breathing zoom
        Image(
            painter = painterResource(R.drawable.teen_patti_bg),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.TopStart)
                .offset(x = (-40).dp)
                .fillMaxWidth(1.25f)
                .height((screenH * 0.5f).dp)
                .alpha(0.45f)
                .graphicsLayer { scaleX = bgScale; scaleY = bgScale },
            contentScale = ContentScale.Fit
        )

        // bottom fade-out gradient
        Box(Modifier
            .align(Alignment.TopStart)
            .fillMaxWidth()
            .height(80.dp)
            .offset(y = ((screenH * 0.5f) - 30f).dp)
            .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF3B0764)))))

        // floating history bar
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 56.dp)
            .zIndex(50f)) {
            Row(Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0x66000000))
                    .border(1.dp, Color(0x26FFD700), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 5.dp)) {
                    Text("HISTORY", color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                }
                history.forEachIndexed { i, id ->
                    val f = TEEN_FACTIONS.firstOrNull { it.id == id }
                    Box(Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(f?.color?.let { Color(it) } ?: Color(0xFF333333))
                        .border(1.5.dp, if (i == 0) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.2f), CircleShape)
                        .shadow(2.dp, CircleShape, spotColor = if (i == 0) Color(0xFFFBBF24) else Color.Black)
                        .graphicsLayer { alpha = 1f - (i * 0.1f) },
                        contentAlignment = Alignment.Center) {
                        if (f != null) {
                            Image(painterResource(f.imageRes), contentDescription = null,
                                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        } else {
                            Text("\uD83C\uDFC6", fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // countdown / round state badge
        Box(Modifier
            .fillMaxWidth()
            .padding(top = 108.dp)
            .zIndex(40f),
            contentAlignment = Alignment.Center) {
            val badgeAlpha = if (gameState == "betting" && timeLeft > 0 && timeLeft <= 5) pulse else 0.6f
            Row(Modifier
                .graphicsLayer { this.alpha = badgeAlpha }
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Color(0xFF2E1049), Color(0xFF0F021A))))
                .border(2.dp, Color(0xFFFBBF24), CircleShape)
                .shadow(8.dp, CircleShape, spotColor = Color(0xFFFBBF24))
                .padding(horizontal = 22.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Text("\u23F3", fontSize = 13.sp, color = Color(0xFFFBBF24))
                Spacer(Modifier.width(8.dp))
                when {
                    gameState == "reveal" -> Text("\uD83C\uDFB0 REVEALING...", color = Color(0xFFFBBF24), fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.2.sp)
                    isResult -> {
                        val wf = winnerId?.let { wid -> TEEN_FACTIONS.firstOrNull { it.id == wid } }
                        if (wf != null) {
                            Text("\uD83C\uDFC6 ${wf.label.uppercase()} WINS!", color = Color(0xFF10B981), fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.2.sp)
                        } else {
                            Text("ROUND OVER", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.2.sp)
                        }
                    }
                    else -> Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("BET: ", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.2.sp)
                        Text("${timeLeft}s", color = Color(0xFFFBBF24), fontSize = 13.5.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        // faction cards area
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .padding(top = 20.dp)
            .zIndex(30f),
            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            TEEN_FACTIONS.forEach { f ->
                val isWinner = winnerId == f.id
                val pot = totalPots[f.id] ?: 0L
                val myBet = myBets[f.id] ?: 0L
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    // premium gold-bordered faction tag
                    Box(Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xB3000000))
                        .border(1.dp, if (isWinner) Color(0xFFFBBF24) else Color(0x4DFBBF24), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 3.dp)) {
                        Text(f.label.uppercase(), color = if (isWinner) Color(0xFFFBBF24) else Color.White,
                            fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 0.8.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    // velvet table felt card holder tray
                    Box(Modifier
                        .fillMaxWidth()
                        .height(94.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isWinner) Color(0x38FBBF24) else Color(0xA60F0A19))
                        .border(2.dp, if (isWinner) Color(0xFFFBBF24) else Color(0x33FBBF24), RoundedCornerShape(18.dp))
                        .shadow(if (isWinner) 12.dp else 3.dp, RoundedCornerShape(18.dp),
                            spotColor = if (isWinner) Color(0xFFFBBF24) else Color.Black),
                        contentAlignment = Alignment.Center) {
                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            (0 until 3).forEach { ci ->
                                val isFlipped = flippedCards["${f.id}_$ci"] == true
                                val card = cardReveal[f.id]?.getOrNull(ci)
                                val isRed = card?.suit == "\u2665" || card?.suit == "\u2666"
                                Box(Modifier.size(width = 32.dp, height = 52.dp)) {
                                    if (isFlipped && card != null) {
                                        Box(Modifier
                                            .fillMaxSize()
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Color.White)
                                            .border(1.2.dp, Color(0xFFFBBF24), RoundedCornerShape(6.dp)),
                                            contentAlignment = Alignment.Center) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text(card.value, fontSize = 13.sp, fontWeight = FontWeight.Black,
                                                    color = if (isRed) Color(0xFFDC2626) else Color(0xFF111827))
                                                Text(card.suit, fontSize = 11.sp,
                                                    color = if (isRed) Color(0xFFDC2626) else Color(0xFF111827))
                                            }
                                        }
                                    } else {
                                        Box(Modifier
                                            .fillMaxSize()
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Brush.linearGradient(listOf(Color(0xFFDC2626), Color(0xFF7F1D1D))))
                                            .border(1.2.dp, Color(0xFFFDE047), RoundedCornerShape(6.dp)),
                                            contentAlignment = Alignment.Center) {
                                            Text("\uD83D\uDD31", fontSize = 13.sp, color = Color(0xFFFDE047), fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // gold-trimmed stats capsule
                    Row(Modifier
                        .padding(top = 6.dp)
                        .clip(CircleShape)
                        .background(Color(0xA6000000))
                        .border(0.8.dp, Color(0x4DFBBF24), CircleShape)
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Text("POT: ", color = Color.White.copy(alpha = 0.7f), fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                        Text(potLabel(pot), color = Color.White, fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                        Text("  | ME: ", color = Color(0xFFFBBF24), fontSize = 8.5.sp, fontWeight = FontWeight.Black)
                        Text(potLabel(myBet), color = Color(0xFFFBBF24), fontSize = 8.5.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        // faction banners / betting buttons
        Row(Modifier
            .fillMaxSize()
            .zIndex(30f)
            .graphicsLayer { translationY = -28f }
            .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically) {
            TEEN_FACTIONS.forEach { f ->
                Column(Modifier
                    .graphicsLayer { alpha = if (gameState == "betting") 1f else 0.7f }
                    .clickable(enabled = gameState == "betting") { handlePlaceBet(f.id) },
                    horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier
                        .size(width = 92.dp, height = 112.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color(f.color))
                        .border(3.dp, if (winnerId == f.id) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.18f), RoundedCornerShape(24.dp))
                        .shadow(if (winnerId == f.id) 16.dp else 8.dp, RoundedCornerShape(24.dp),
                            spotColor = if (winnerId == f.id) Color(0xFFFBBF24) else Color.Black),
                        contentAlignment = Alignment.Center) {
                        Image(painterResource(f.imageRes), contentDescription = null,
                            modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                    }
                    Text(f.label.uppercase(), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(top = 8.dp))
                }
            }
        }

        // balance & total bet row
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp)
            .padding(bottom = 102.dp)
            .align(Alignment.BottomCenter)
            .zIndex(50f),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            // premium playing card styled balance badge
            Row(Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(Color.White)
                .border(1.5.dp, Color(0xFFFBBF24), RoundedCornerShape(8.dp))
                .shadow(5.dp, RoundedCornerShape(8.dp), spotColor = Color.Black)
                .padding(horizontal = 12.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically) {
                // mini cards graphic
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier
                        .size(width = 14.dp, height = 20.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color(0xFFDC2626))
                        .border(0.8.dp, Color(0xFFFEF08A), RoundedCornerShape(2.dp)),
                        contentAlignment = Alignment.Center) {
                        Text("A", fontSize = 9.sp, color = Color(0xFFFEF08A), fontWeight = FontWeight.Black)
                    }
                    Box(Modifier
                        .offset(x = (-6).dp)
                        .size(width = 14.dp, height = 20.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(Color.White)
                        .border(0.8.dp, Color(0xFFFBBF24), RoundedCornerShape(2.dp)),
                        contentAlignment = Alignment.Center) {
                        Text("\u2665", fontSize = 9.sp, color = Color(0xFFDC2626), fontWeight = FontWeight.Black)
                    }
                }
                Spacer(Modifier.width(8.dp))
                GoldenCoin(size = 25.dp)
                Spacer(Modifier.width(6.dp))
                Text(fmt(localCoins), color = Color(0xFFB45309), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.3.sp)
                Spacer(Modifier.width(4.dp))
                Box(Modifier
                    .size(18.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0x33FBBF24))
                    .border(0.8.dp, Color(0x99FBBF24), RoundedCornerShape(6.dp))
                    .clickable { goWallet() },
                    contentAlignment = Alignment.Center) {
                    Text("+", color = Color(0xFFB45309), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
            // premium total bet capsule
            if (totalBet > 0) {
                Row(Modifier
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(Color(0x33FBBF24), Color(0x0DFBBF24))))
                    .border(1.dp, Color(0x4DFBBF24), CircleShape)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("\uD83D\uDCC8", fontSize = 12.sp, color = Color(0xFFFBBF24))
                    Spacer(Modifier.width(6.dp))
                    Text("BET: ${fmt(totalBet)}", color = Color(0xFFFBBF24), fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
                }
            }
        }

        // footer - premium wooden/gold card strip with chips
        Column(Modifier
            .align(Alignment.BottomCenter)
            .fillMaxWidth()
            .background(Color(0xFF1B072B))
            .border(width = 2.dp, color = Color(0xFFFBBF24), shape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp))
            .shadow(8.dp, RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp), spotColor = Color.Black)
            .padding(horizontal = 6.dp, vertical = 10.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TEEN_CHIPS.forEach { chip ->
                    val isActive = selectedChip == chip.value
                    Box(Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(Color(chip.color))
                        .border(2.2.dp, if (isActive) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.4f), CircleShape)
                        .shadow(if (isActive) 8.dp else 3.dp, CircleShape, spotColor = Color(chip.color))
                        .graphicsLayer { scaleX = if (isActive) 1.06f else 1f; scaleY = if (isActive) 1.06f else 1f }
                        .clickable { selectedChip = chip.value },
                        contentAlignment = Alignment.Center) {
                        // inner white cover circle with card suits pattern
                        Box(Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                            .border(1.2.dp, Color(chip.color), CircleShape),
                            contentAlignment = Alignment.Center) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
                                Text("\u2660", fontSize = 6.8.sp, fontWeight = FontWeight.Black, color = Color(chip.color), modifier = Modifier.padding(top = 1.dp))
                            }
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.CenterStart) {
                                Text("\u2665", fontSize = 6.8.sp, fontWeight = FontWeight.Black, color = Color(chip.color), modifier = Modifier.padding(start = 2.dp))
                            }
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.CenterEnd) {
                                Text("\u2666", fontSize = 6.8.sp, fontWeight = FontWeight.Black, color = Color(chip.color), modifier = Modifier.padding(end = 2.dp))
                            }
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                                Text("\u2663", fontSize = 6.8.sp, fontWeight = FontWeight.Black, color = Color(chip.color), modifier = Modifier.padding(bottom = 1.dp))
                            }
                            Text(chip.label, color = Color(chip.color), fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TeenPattiLaunchingScreen() {
    val inft = rememberInfiniteTransition(label = "teenpatti-launch")
    val pulse by inft.animateFloat(0.4f, 1f, infiniteRepeatable(tween(1000), RepeatMode.Reverse), label = "p")
    val rot by inft.animateFloat(0f, 360f, infiniteRepeatable(tween(3000)), label = "r")

    Box(Modifier.fillMaxSize().background(Color(0xFF1A0A2E)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("\uD83C\uDCCF", fontSize = 80.sp,
                modifier = Modifier.graphicsLayer { rotationZ = rot; this.alpha = pulse })
            Text("TEEN PATTI", color = Color(0xFFFBBF24), fontSize = 36.sp, fontWeight = FontWeight.Black,
                modifier = Modifier.padding(top = 16.dp))
            Spacer(Modifier.height(16.dp))
            Box(Modifier.width(200.dp).height(6.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.08f))) {
                Box(Modifier
                    .fillMaxWidth(0.6f)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFBBF24))
                    .graphicsLayer { translationX = (pulse - 0.4f) * 400f - 200f })
            }
            Text("SHUFFLING CARDS...", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp,
                fontWeight = FontWeight.Black, letterSpacing = 2.sp, modifier = Modifier.padding(top = 12.dp))
        }
    }
}
