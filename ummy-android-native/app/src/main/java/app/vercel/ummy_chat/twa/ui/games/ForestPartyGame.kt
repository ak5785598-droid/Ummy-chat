package app.vercel.ummy_chat.twa.ui.games

import android.media.MediaPlayer
import android.widget.Toast
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
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
import kotlinx.coroutines.Job
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import app.vercel.ummy_chat.twa.ui.home.GoldenCoin
import app.vercel.ummy_chat.twa.R

// ─────────────────────────────────────────────────────────────────────────────
// ForestPartyGame — full port of RN forest-party-game.tsx (1188 lines)
// Wooden-helm jungle wheel, 40s continuous rounds, RTDB + Firestore sync.
// ─────────────────────────────────────────────────────────────────────────────

data class ForestChipStyle(val colors: List<Color>, val text: Color, val border: Color)

private val FOREST_CHIP_STYLES = mapOf<Long, ForestChipStyle>(
    500L to ForestChipStyle(listOf(Color(0xFF9D174D), Color(0xFFEC4899)), Color.White, Color(0xFFFBCFE8)),
    1000L to ForestChipStyle(listOf(Color(0xFF701A75), Color(0xFFD946EF)), Color.White, Color(0xFFF5D0FE)),
    5000L to ForestChipStyle(listOf(Color(0xFF065F46), Color(0xFF10B981)), Color.White, Color(0xFFA7F3D0)),
    10000L to ForestChipStyle(listOf(Color(0xFFB45309), Color(0xFFF59E0B)), Color.White, Color(0xFFFEF08A)),
    50000L to ForestChipStyle(listOf(Color(0xFF991B1B), Color(0xFFEF4444)), Color.White, Color(0xFFFCA5A5)),
    100000L to ForestChipStyle(listOf(Color(0xFF111827), Color(0xFF374151)), Color.White, Color(0xFF9CA3AF)),
    500000L to ForestChipStyle(listOf(Color(0xFF1E40AF), Color(0xFF3B82F6)), Color.White, Color(0xFF93C5FD))
)

@Composable
fun ForestPartyGame(
    onClose: () -> Unit,
    roomId: String?,
    onRoundEnd: (GameRoundEndData) -> Unit,
    isMuted: Boolean = false,
    onGoToWallet: () -> Unit = {}
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val firestore = remember { FirebaseFirestore.getInstance() }
    val database = remember { FirebaseDatabase.getInstance() }
    val uid = remember { FirebaseAuth.getInstance().currentUser?.uid }

    var gameState by remember { mutableStateOf("launching") }
    var timeLeft by remember { mutableIntStateOf(30) }
    var selectedChip by remember { mutableLongStateOf(1000L) }
    var myBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var lastBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var highlightIdx by remember { mutableStateOf<Int?>(null) }
    var history by remember { mutableStateOf(listOf("lion", "panda", "monkey", "rabbit", "fox", "bear", "deer", "owl")) }
    var winnerData by remember { mutableStateOf<GameWinnerData?>(null) }
    var shiningGroup by remember { mutableStateOf("none") }
    var localCoins by remember { mutableLongStateOf(0L) }
    var droppedChips by remember { mutableStateOf<List<DroppedChip>>(emptyList()) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }

    val lastProcessedRoundRef = remember { mutableLongStateOf(-1L) }
    val spinInitiatedRef = remember { mutableStateOf(false) }
    val locallyUpdatedCoinsRef = remember { mutableStateOf(false) }
    val myBetsRef = remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    val processedRef = remember { mutableStateOf(false) }
    val isDealerRef = remember { mutableStateOf(false) }
    val spinTimerJob = remember { mutableStateOf<Job?>(null) }
    val scope = rememberCoroutineScope()

    val screenW = LocalConfiguration.current.screenWidthDp
    val wheelDp = screenW * 0.85f
    val centerDp = wheelDp * 0.32f
    val boxDp = 64f
    val distanceDp = (wheelDp / 2) - (boxDp / 2) + 4f
    val wheelSize = wheelDp.dp
    val centerSize = (centerDp * 1.15f).dp

    val animalPositions = remember(screenW) {
        ANIMALS.indices.map { i ->
            val angle = (i * 45 - 90) * (Math.PI / 180)
            val top = (wheelDp / 2) + Math.sin(angle) * distanceDp - boxDp / 2
            val left = (wheelDp / 2) + Math.cos(angle) * distanceDp - boxDp / 2
            top.toFloat() to left.toFloat()
        }
    }

    val soundPlayers = remember { mutableMapOf<String, MediaPlayer?>() }
    fun playSfx(type: String) {
        if (isMuted) return
        val url = when (type) {
            "tick" -> "https://github.com/wesbos/JavaScript30/raw/master/01%20-%20JavaScript%20Drum%20Kit/sounds/tink.wav"
            "spin" -> "https://github.com/wesbos/JavaScript30/raw/master/01%20-%20JavaScript%20Drum%20Kit/sounds/hihat.wav"
            else -> "https://github.com/wesbos/JavaScript30/raw/master/01%20-%20JavaScript%20Drum%20Kit/sounds/openhat.wav"
        }
        try {
            val mp = soundPlayers.getOrPut(type) {
                MediaPlayer().apply {
                    setVolume(if (type == "tick") 0.35f else 0.75f, if (type == "tick") 0.35f else 0.75f)
                    setDataSource(url)
                    prepare()
                }
            }
            mp?.let { it.seekTo(0); it.start() }
        } catch (_: Exception) {}
    }

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
        database.getReference("games/forest_party_${r}/playerBets/$u")
            .setValue(mapOf("bets" to bets, "timestamp" to System.currentTimeMillis(), "username" to (userProfile?.get("username") ?: "Guest")))
            .addOnFailureListener {}
    }

    fun goWallet() {
        onClose()
        onGoToWallet()
    }

    fun handlePlaceBet(animalId: String) {
        if (gameState != "betting" || uid == null) return
        if (localCoins < selectedChip) {
            Toast.makeText(context, "Insufficient coins — go to wallet", Toast.LENGTH_SHORT).show()
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
                    "source" to "Forest Party", "description" to "Forest Party Bet ($animalId)",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}
            locallyUpdatedCoinsRef.value = true
            localCoins -= selectedChip
        } catch (_: Exception) {}

        val newBets = myBetsRef.value.toMutableMap()
        newBets[animalId] = (newBets[animalId] ?: 0L) + selectedChip
        myBetsRef.value = newBets
        myBets = newBets
        saveBetsToRTDB(newBets)
        droppedChips = (droppedChips + DroppedChip("${System.currentTimeMillis()}-${(0..999999).random()}", animalId, formatChipLabel(selectedChip))).takeLast(90)
    }

    fun handleRepeat() {
        if (gameState != "betting" || lastBets.isEmpty() || uid == null) return
        val totalCost = lastBets.values.sum()
        if (localCoins < totalCost) {
            Toast.makeText(context, "Insufficient coins — go to wallet", Toast.LENGTH_SHORT).show()
            goWallet()
            return
        }
        try {
            val dec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(-totalCost), "coins" to FieldValue.increment(-totalCost))
            updateBothUserDocs(dec)
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val statsBatch = firestore.batch()
            statsBatch.set(firestore.collection("jackpots").document("daily"),
                mapOf("totalPool" to FieldValue.increment(totalCost * 0.05)), SetOptions.merge())
            statsBatch.set(firestore.collection("gameDailyWagers").document("${uid}_${todayStr}"),
                mapOf("userId" to uid, "username" to (userProfile?.get("username") ?: "User"),
                    "avatarUrl" to (userProfile?.get("avatarUrl") ?: ""),
                    "coinsPlayed" to FieldValue.increment(totalCost), "date" to todayStr), SetOptions.merge())
            statsBatch.commit().addOnFailureListener {}
            firestore.collection("users").document(uid).collection("transactions").add(
                mapOf("amount" to -totalCost, "currency" to "coins", "type" to "game_bet",
                    "source" to "Forest Party", "description" to "Forest Party Repeat Bet",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}
            locallyUpdatedCoinsRef.value = true
            localCoins -= totalCost
        } catch (_: Exception) {}

        val newDrops = ArrayList<DroppedChip>()
        lastBets.forEach { (animalId, amount) ->
            val count = ceil(amount / selectedChip.toDouble()).toInt()
            for (i in 0 until count) {
                newDrops.add(DroppedChip("${System.currentTimeMillis()}-${(0..999999).random()}-$i", animalId, formatChipLabel(selectedChip)))
            }
        }
        droppedChips = (droppedChips + newDrops).takeLast(90)

        val merged = myBets.toMutableMap()
        lastBets.forEach { (k, v) -> merged[k] = (merged[k] ?: 0L) + v }
        myBetsRef.value = merged
        myBets = merged
        saveBetsToRTDB(merged)
    }

    fun finalizeResult(id: String, groupType: String) {
        playSfx("win")
        shiningGroup = groupType
        val winningIds = when (groupType) {
            "left" -> WILD_GROUP
            "right" -> CUTE_GROUP
            else -> listOf(id)
        }
        var winAmount = 0L
        winningIds.forEach { wid ->
            val winItem = ANIMALS.firstOrNull { it.id == wid }
            winAmount += (myBetsRef.value[wid] ?: 0L) * (winItem?.multiplier ?: 0)
        }
        val winItem = ANIMALS.firstOrNull { it.id == id }
        val updatedHistory = (listOf(id) + history).take(15)

        val rtdbPath = "games/forest_party_${roomId ?: "global"}"
        database.getReference(rtdbPath)
            .updateChildren(mapOf("history" to updatedHistory, "updatedAt" to System.currentTimeMillis()))
            .addOnFailureListener {}
        firestore.collection("games").document("forest-party")
            .set(mapOf("history" to updatedHistory, "updatedAt" to FieldValue.serverTimestamp()), SetOptions.merge())
            .addOnFailureListener {}

        winnerData = GameWinnerData(id, winAmount, winItem?.multiplier ?: 0)
        gameState = "result"
        val totalWagerForGroup = winningIds.sumOf { myBetsRef.value[it] ?: 0L }

        if (winAmount > 0 && uid != null) {
            val winDec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(winAmount), "coins" to FieldValue.increment(winAmount))
            updateBothUserDocs(winDec)
            firestore.collection("users").document(uid).collection("transactions").add(
                mapOf("amount" to winAmount, "currency" to "coins", "type" to "game_win",
                    "source" to "Forest Party", "description" to "Forest Party Win (${winItem?.id ?: "Payout"})",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}
            locallyUpdatedCoinsRef.value = true
            localCoins += winAmount
            firestore.collection("globalGameWins").add(
                mapOf("gameId" to "forest-party", "roomId" to (roomId ?: "null"), "userId" to uid,
                    "username" to (userProfile?.get("username") ?: "Guest"), "avatarUrl" to (userProfile?.get("avatarUrl") ?: "null"),
                    "amount" to winAmount, "betAmount" to totalWagerForGroup, "timestamp" to Date())
            ).addOnFailureListener {}
        }

        scope.launch {
            try {
                val r = roomId ?: return@launch
                val playerBetsRef = database.getReference("games/forest_party_${r}/playerBets")
                val snapshot = playerBetsRef.get().await()
                val hasLocalBets = myBetsRef.value.isNotEmpty()
                if (snapshot.exists()) {
                    val allPlayers = snapshot.value as? Map<String, Any?> ?: emptyMap()
                    val creditBatch = firestore.batch()
                    var hasOther = false
                    allPlayers.forEach { (userId, datum) ->
                        if (userId == uid && hasLocalBets) return@forEach
                        if (userId == uid && processedRef.value) return@forEach
                        val bets = (datum as? Map<*, *>)?.get("bets") as? Map<*, *> ?: return@forEach
                        var playerWin = 0L
                        winningIds.forEach { wid ->
                            val wItem = ANIMALS.firstOrNull { it.id == wid }
                            val betAmt = (bets[wid] as? Number)?.toLong() ?: 0L
                            playerWin += betAmt * (wItem?.multiplier ?: 0)
                        }
                        if (playerWin > 0) {
                            hasOther = true
                            creditBatch.set(
                                firestore.collection("users").document(userId).collection("profile").document(userId),
                                mapOf("wallet.coins" to FieldValue.increment(playerWin)), SetOptions.merge()
                            )
                        }
                    }
                    if (hasOther) creditBatch.commit().await()
                }
                processedRef.value = true
                playerBetsRef.setValue(null).addOnFailureListener {}
            } catch (_: Exception) {
                try {
                    val r = roomId ?: return@launch
                    database.getReference("games/forest_party_${r}/playerBets").setValue(null)
                } catch (_: Exception) {}
            }
        }

        onRoundEnd(
            when (groupType) {
                "left" -> GameRoundEndData("Wild Mix!", "\uD83D\uDC3C\uD83D\uDC3B\uD83D\uDC2F\uD83E\uDD81", R.drawable.wild_mix, winAmount, totalWagerForGroup)
                "right" -> GameRoundEndData("Cute Mix!", "\uD83D\uDC30\uD83D\uDC31\uD83D\uDC36\uD83D\uDC11", R.drawable.cute_mix, winAmount, totalWagerForGroup)
                else -> GameRoundEndData(
                    "${winItem?.emoji ?: "\uD83C\uDFC6"} ${(winItem?.id?.uppercase() ?: "WIN")} x${winItem?.multiplier ?: 0}!",
                    winItem?.emoji ?: "\uD83C\uDFC6",
                    winItem?.imageRes,
                    winAmount, totalWagerForGroup
                )
            }
        )

        val betsSnapshot = myBetsRef.value
        scope.launch {
            delay(6000)
            winnerData = null
            shiningGroup = "none"
            lastBets = betsSnapshot
            myBets = emptyMap()
            myBetsRef.value = emptyMap()
            highlightIdx = null
            droppedChips = emptyList()
            gameState = "betting"
            spinInitiatedRef.value = false
            timeLeft = 30
            try {
                val ref = database.getReference("games/forest_party_${roomId ?: "global"}")
                ref.runTransaction(object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val data = mutableMapOf<String, Any?>()
                        data["status"] = "betting"
                        data["winningId"] = null
                        data["groupType"] = "none"
                        val existingHist = (currentData.value as? Map<*, *>)?.get("history") as? List<*>
                        data["history"] = (listOf(id) + (existingHist?.map { it.toString() } ?: emptyList())).take(15)
                        data["roundStartTime"] = System.currentTimeMillis()
                        data["updatedAt"] = System.currentTimeMillis()
                        currentData.value = data
                        return Transaction.success(currentData)
                    }
                    override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
                })
            } catch (_: Exception) {}
        }
    }

    fun startSpin(winningId: String, groupType: String) {
        playSfx("spin")
        gameState = "spinning"

        val targetIdx = ANIMALS.indexOfFirst { it.id == winningId }
        val totalSteps = (SEQUENCE.size * 2) + targetIdx
        var currentStep = 0
        var speed = 40L

        spinTimerJob.value?.cancel()
        spinTimerJob.value = scope.launch {
            while (currentStep < totalSteps) {
                val active = SEQUENCE[currentStep % SEQUENCE.size]
                highlightIdx = active
                val remaining = totalSteps - currentStep
                if (remaining < 6) speed += 30
                else if (remaining < 12) speed += 15
                currentStep++
                delay(speed)
            }
            delay(400)
            finalizeResult(winningId, groupType)
        }
    }

    // master loop
    LaunchedEffect(Unit) {
        while (isActive) {
            val now = System.currentTimeMillis()
            val offset = now % GAME_CYCLE_DURATION
            val roundIdx = now / GAME_CYCLE_DURATION

            if (lastProcessedRoundRef.longValue != roundIdx) {
                lastProcessedRoundRef.longValue = roundIdx
                gameState = if (offset < GAME_BETTING_DURATION) "betting" else "launching"
                winnerData = null
                highlightIdx = null
                myBetsRef.value = emptyMap()
                myBets = emptyMap()
                spinInitiatedRef.value = offset >= GAME_BETTING_DURATION
            }

            if (offset < GAME_BETTING_DURATION) {
                val sec = max(1, ceil((GAME_BETTING_DURATION - offset) / 1000.0).toInt())
                timeLeft = sec
                if (gameState != "betting") gameState = "betting"
                if (sec <= 5 && sec > 0) playSfx("tick")
            } else {
                timeLeft = 0
                if (!spinInitiatedRef.value) {
                    spinInitiatedRef.value = true
                    val idx = getDeterministicWinnerIndex(roundIdx, ANIMALS.size)
                    startSpin(ANIMALS[idx].id, "none")
                }
            }
            delay(1000)
        }
    }

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

    LaunchedEffect(uid, roomId) {
        if (uid == null || roomId == null) return@LaunchedEffect
        try {
            val pBetsRef = database.getReference("games/forest_party_${roomId}/playerBets/$uid")
            val pbSnapshot = pBetsRef.get().await()
            if (!pbSnapshot.exists()) return@LaunchedEffect
            val data = pbSnapshot.value as? Map<String, Any?> ?: return@LaunchedEffect
            val bets = data["bets"] as? Map<String, Any?> ?: return@LaunchedEffect
            var totalWager = 0L
            bets.forEach { (_, v) -> totalWager += (v as? Number)?.toLong() ?: 0L }
            if (totalWager <= 0) { pBetsRef.setValue(null).addOnFailureListener {}; return@LaunchedEffect }
            processedRef.value = true
            val gameData = (database.getReference("games/forest_party_$roomId").get().await().value) as? Map<String, Any?>
            val winningId = gameData?.get("winningId") as? String
            if (winningId != null) {
                val wItem = ANIMALS.firstOrNull { it.id == winningId }
                var playerWin = 0L
                bets.forEach { (k, v) ->
                    if (k == winningId) playerWin += ((v as? Number)?.toLong() ?: 0L) * (wItem?.multiplier ?: 0)
                }
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

    LaunchedEffect(Unit) {
        val docRef = firestore.collection("games").document("forest-party")
        val reg = docRef.addSnapshotListener { snap, _ ->
            val h = (snap?.data?.get("history") as? List<*>)?.map { it.toString() }
            if (h != null && h.isNotEmpty()) history = h
        }
        try { awaitCancellation() } finally { reg.remove() }
    }

    LaunchedEffect(Unit) {
        val target = database.getReference("games/forest_party_${roomId ?: "global"}")
        val listener = object : ValueEventListener {
            override fun onCancelled(error: DatabaseError) {}
            override fun onDataChange(snap: DataSnapshot) {
                val h = (snap.child("history").value as? List<*>)?.map { it.toString() }
                if (h != null && h.isNotEmpty()) history = h
            }
        }
        target.addValueEventListener(listener)
        try { awaitCancellation() } finally { target.removeEventListener(listener) }
    }

    if (gameState == "launching") {
        ForestLaunchingScreen()
        return
    }

    val infinite = rememberInfiniteTransition(label = "fp")
    val pulse by infinite.animateFloat(0.6f, 1f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "p")
    val rot by infinite.animateFloat(0f, 360f, infiniteRepeatable(tween(2000)), label = "r")

    // ─── MAIN UI ──────────────────────────────────────────────────────────────
    Box(Modifier.fillMaxSize().background(Color(0xFF022C22))) {
        // jungle background at 0.85 opacity
        Image(painterResource(R.drawable.forest_party), contentDescription = null,
            modifier = Modifier.fillMaxSize().alpha(0.85f), contentScale = ContentScale.Crop)

        Column(Modifier.fillMaxSize()) {
            // Floating history capsule at top
            Row(
                modifier = Modifier
                    .align(Alignment.CenterHorizontally)
                    .padding(top = 2.dp, bottom = 4.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.Black.copy(alpha = 0.2f))
                    .padding(horizontal = 12.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                history.forEachIndexed { i, id ->
                    val a = ANIMALS.firstOrNull { it.id == id }
                    val isLatest = i == 0
                    Box(Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .border(if (isLatest) 1.8.dp else 1.dp, if (isLatest) Color(0xFFEAB308) else Color.White.copy(alpha = 0.2f), CircleShape)
                        .graphicsLayer { alpha = 1f - (i * 0.08f) },
                        contentAlignment = Alignment.Center) {
                        if (a != null) {
                            Image(painterResource(a.imageRes), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        } else {
                            Text(a?.emoji ?: "\uD83E\uDD81", fontSize = 12.sp)
                        }
                    }
                }
            }

            BoxWithConstraints(modifier = Modifier.fillMaxWidth().weight(1f).graphicsLayer { translationY = -25f }) {
                val density = androidx.compose.ui.platform.LocalDensity.current.density
                val areaW = constraints.maxWidth / density
                val areaH = constraints.maxHeight / density

                // Wild / Cute badges above wager panel
                MixBadge(
                    imageRes = R.drawable.wild_mix,
                    active = shiningGroup == "left",
                    modifier = Modifier.align(Alignment.BottomStart).offset(x = 16.dp, y = (-150).dp).zIndex(40f)
                )
                MixBadge(
                    imageRes = R.drawable.cute_mix,
                    active = shiningGroup == "right",
                    modifier = Modifier.align(Alignment.BottomEnd).offset(x = (-16).dp, y = (-150).dp).zIndex(40f)
                )

                // floating glow under wheel
                Box(Modifier
                    .align(Alignment.Center)
                    .size((wheelDp - 20).dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.4f))
                    .shadow(elevation = 10.dp, shape = CircleShape))

                // wheel
                Box(Modifier.size(wheelSize).align(Alignment.Center).zIndex(20f)) {
                    // wooden rim
                    Box(Modifier
                        .fillMaxSize()
                        .shadow(8.dp, CircleShape)
                        .clip(CircleShape)
                        .background(Color.Transparent)
                        .border(14.dp, Color(0xFF854D0E), CircleShape))

                    // inner wooden ring
                    Box(Modifier
                        .fillMaxSize()
                        .padding(22.dp)
                        .clip(CircleShape)
                        .border(6.dp, Color(0xFFA16207), CircleShape))

                    // spokes + helm handles
                    for (i in 0 until ANIMALS.size) {
                        val angle = i * 45 - 90
                        // main spoke
                        Box(Modifier
                            .offset(x = (wheelDp / 2).dp, y = (wheelDp / 2 - 5).dp)
                            .width((wheelDp / 2 - 12).dp)
                            .height(10.dp)
                            .graphicsLayer { transformOrigin = TransformOrigin(0f, 0.5f); rotationZ = angle.toFloat() }
                            .background(Color(0xFF854D0E)))
                        // helm handle extending outside rim (behind)
                        Box(Modifier
                            .offset(x = (wheelDp / 2).dp, y = (wheelDp / 2 - 7.5).dp)
                            .width((wheelDp / 2 + 16).dp)
                            .height(15.dp)
                            .graphicsLayer { transformOrigin = TransformOrigin(0f, 0.5f); rotationZ = angle.toFloat() }
                            .background(Color(0xFF713F12), RoundedCornerShape(6.dp))
                            .zIndex(-1f))
                    }

                    // animal boxes
                    ANIMALS.forEachIndexed { i, animal ->
                        val (top, left) = animalPositions[i]
                        val isHighlighted = highlightIdx == i
                        val isItemInWinningGroup = when (shiningGroup) {
                            "left" -> WILD_GROUP.contains(animal.id)
                            "right" -> CUTE_GROUP.contains(animal.id)
                            else -> false
                        }
                        val active = isHighlighted || (gameState == "result" && isItemInWinningGroup)
                        val betAmount = myBets[animal.id] ?: 0L
                        val animalChips = droppedChips.filter { it.fruitId == animal.id }

                        Box(Modifier
                            .offset(x = left.dp, y = top.dp)
                            .size(boxDp.dp)
                            .zIndex(if (active) 50f else 10f)
                        ) {
                            Box(Modifier
                                .size(boxDp.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .border(if (active) 3.dp else 0.dp, if (active) Color.White else Color.Transparent, CircleShape)
                                .shadow(if (active) 12.dp else 4.dp, CircleShape, spotColor = Color(0xFF4ADE80))
                                .then(if (active) Modifier.graphicsLayer { scaleX = 1.15f; scaleY = 1.15f } else Modifier)
                                .clickable { handlePlaceBet(animal.id) }) {
                                Image(painterResource(animal.imageRes), contentDescription = null,
                                    modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            }

                            // win multiplier banner below circle
                            Box(Modifier
                                .align(Alignment.BottomCenter)
                                .offset(y = 11.dp)
                                .widthIn(min = 54.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF7F1D1D))
                                .border(0.8.dp, Color(0xFFF59E0B), RoundedCornerShape(6.dp))
                                .padding(horizontal = 4.dp, vertical = 1.5.dp)
                                .zIndex(6f),
                                contentAlignment = Alignment.Center) {
                                Text(animal.label, color = Color(0xFFFEF08A), fontSize = 7.2.sp, fontWeight = FontWeight.Black,
                                    maxLines = 1, textAlign = TextAlign.Center)
                            }

                            // dropped chips
                            animalChips.take(3).forEachIndexed { ci, chip ->
                                Box(Modifier
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-16).dp, y = (2 + ci * 6).dp)
                                    .size(18.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEAB308))
                                    .border(1.5.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center) {
                                    Text(chip.label, color = Color.White, fontSize = 6.sp, fontWeight = FontWeight.Black)
                                }
                            }
                            if (betAmount > 0) {
                                Box(Modifier
                                    .align(Alignment.TopStart)
                                    .offset(x = 6.dp, y = 4.dp)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF1C40F)),
                                    contentAlignment = Alignment.Center) {
                                    Text(formatChipLabel(betAmount), color = Color(0xFF064E3B), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }
                }

                // center circle (wooden helm hub)
                Box(Modifier.align(Alignment.Center).size(centerSize).zIndex(60f)
                    .clip(CircleShape)
                    .background(Color(0xFFA16207))
                    .border(5.dp, Color(0xFF713F12), CircleShape)) {
                    Box(Modifier.align(Alignment.Center).size(centerSize * 0.88f)
                        .clip(CircleShape)
                        .background(Color(0xFF451A03))
                        .border(2.dp, Color(0xFFEAB308), CircleShape)) {
                        Box(Modifier.align(Alignment.Center).size(centerSize * 0.78f)
                            .clip(CircleShape)
                            .background(Brush.verticalGradient(listOf(Color(0xFFFFFBEB), Color(0xFFFED7AA), Color(0xFFFB97316))))
                            .border(1.5.dp, Color(0xFFF59E0B), CircleShape),
                            contentAlignment = Alignment.Center) {
                            when {
                                gameState == "betting" -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    val scale = if (timeLeft < 10) 1f + (pulse - 0.6f) else 1f
                                    Text("$timeLeft", color = Color(0xFF3F2305), fontSize = 28.sp, fontWeight = FontWeight.Black,
                                        modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale })
                                    Text("SECONDS", color = Color(0xFF7C2D12), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                                gameState == "spinning" -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    WoodenHelm(Modifier.size(38.dp).graphicsLayer { rotationZ = rot })
                                    Text("SPINNING...", color = Color(0xFF3F2305), fontSize = 6.5.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 4.dp))
                                }
                                else -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    val winEmoji = winnerData?.id?.let { wid -> ANIMALS.firstOrNull { it.id == wid }?.emoji } ?: "\uD83C\uDFC6"
                                    if (winnerData != null) {
                                        Text(winEmoji, fontSize = 24.sp)
                                        Text("WIN!", color = Color(0xFF3F2305), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                    } else {
                                        Text("FOREST", color = Color(0xFF3F2305), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                    }
                                }
                            }
                        }
                    }
                }

                // pointer at top
                Canvas(Modifier.align(Alignment.TopCenter).offset(y = (-10).dp).size(20.dp, 16.dp).zIndex(70f)) {
                    val p = Path().apply {
                        moveTo(0f, 0f)
                        lineTo(size.width, 0f)
                        lineTo(size.width / 2f, size.height)
                        close()
                    }
                    drawPath(p, Color(0xFFEAB308))
                }
            }

            // Wager Panel — wooden board
            Column(Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(Color(0xFF271201), Color(0xFF3B1C02), Color(0xFF221001))))
                .border(BorderStroke(5.dp, Color(0xFF5C2D0C)))
                .padding(horizontal = 16.dp, vertical = 8.dp)) {
                // history row
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    (if (history.isNotEmpty()) history else listOf("panda", "rabbit", "cow", "dog", "fox", "bear", "tiger", "lion")).forEach { id ->
                        val a = ANIMALS.firstOrNull { it.id == id }
                        Box(Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF451A03))
                            .border(1.dp, Color(0xFFEAB308), CircleShape),
                            contentAlignment = Alignment.Center) {
                            Text("${a?.emoji ?: "?"}", fontSize = 12.sp)
                        }
                    }
                }

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Brush.horizontalGradient(listOf(Color(0xFFFED7AA), Color(0xFFD97706))))
                        .border(1.8.dp, Color(0xFF713F12), RoundedCornerShape(20.dp))
                        .padding(horizontal = 14.dp, vertical = 5.5.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        GoldenCoin(size = 25.dp)
                        Spacer(Modifier.width(6.dp))
                        Text(localCoins.toString().reversed().chunked(3).joinToString(",").reversed(),
                            color = Color(0xFF3F2305), fontSize = 16.sp, fontWeight = FontWeight.Black)
                        Spacer(Modifier.width(4.dp))
                        Box(Modifier.size(16.dp).clip(CircleShape).background(Color(0xFF713F12)).clickable { goWallet() },
                            contentAlignment = Alignment.Center) {
                            Text("+", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                    if (lastBets.isNotEmpty()) {
                        Row(Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.15f))
                            .border(1.5.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                            .clickable { handleRepeat() }
                            .padding(horizontal = 12.dp, vertical = 5.5.dp),
                            verticalAlignment = Alignment.CenterVertically) {
                            Text("\u21BA", color = Color.White, fontSize = 12.sp)
                            Text(" REPEAT BET", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))
                Text("Choose the amount of wager then choose animal", color = Color.White, fontSize = 11.sp,
                    fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 10.dp))
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(start = 10.dp)) {
                    FRUIT_CHIPS.forEach { value ->
                        val style = FOREST_CHIP_STYLES[value] ?: ForestChipStyle(listOf(Color(0xFF047857), Color(0xFF064E3B)), Color.White, Color.White.copy(alpha = 0.2f))
                        val selected = value == selectedChip
                        Box(Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .border(2.dp, if (selected) Color.White else Color(0xFFF59E0B), CircleShape)
                            .shadow(if (selected) 6.dp else 3.dp, CircleShape, spotColor = if (selected) Color.White else Color.Black)
                            .background(Brush.verticalGradient(style.colors))
                            .clickable { selectedChip = value },
                            contentAlignment = Alignment.Center) {
                            Box(Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .border(1.2.dp, Color.White.copy(alpha = 0.35f), CircleShape),
                                contentAlignment = Alignment.Center) {
                                Text(formatChipLabel(value), color = style.text, fontSize = 10.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Forest launching screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun ForestLaunchingScreen() {
    val inft = rememberInfiniteTransition(label = "launch")
    val pulse by inft.animateFloat(0.4f, 1f, infiniteRepeatable(tween(1000), RepeatMode.Reverse), label = "p")
    val rot by inft.animateFloat(0f, 360f, infiniteRepeatable(tween(3000)), label = "r")

    Box(Modifier.fillMaxSize().background(Color(0xFF022C22)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("\uD83C\uDF32", fontSize = 72.sp,
                modifier = Modifier.graphicsLayer { rotationZ = rot; this.alpha = pulse })
            Text("Forest Party", color = Color(0xFFEAB308), fontSize = 28.sp, fontWeight = FontWeight.Black,
                modifier = Modifier.padding(top = 12.dp))
            Spacer(Modifier.height(16.dp))
            Box(Modifier.width(180.dp).height(6.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.08f))) {
                Box(Modifier
                    .fillMaxWidth(0.6f)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFEAB308))
                    .graphicsLayer { translationX = (pulse - 0.4f) * 300f - 180f })
            }
            Text("ENTERING THE FOREST...", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp,
                fontWeight = FontWeight.Black, letterSpacing = 2.sp, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// wild/cute circular badge (52dp circle)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun MixBadge(imageRes: Int, active: Boolean, modifier: Modifier = Modifier) {
    Box(modifier
        .size(52.dp)
        .clip(CircleShape)
        .background(Color.White)
        .border(if (active) 2.5.dp else 0.dp, Color(0xFFEAB308), CircleShape)
        .then(if (active) Modifier.graphicsLayer { scaleX = 1.15f; scaleY = 1.15f } else Modifier),
        contentAlignment = Alignment.Center) {
        Image(painterResource(imageRes), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wooden helm spinner SVG port
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun WoodenHelm(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val c = Offset(size.width / 2f, size.height / 2f)
        val rOuter = size.width * 0.35f
        val rInner = size.width * 0.22f
        val hub = size.width * 0.10f
        drawCircle(color = Color(0xFF854D0E), radius = rOuter, center = c, style = Stroke(width = size.width * 0.08f))
        drawCircle(color = Color(0xFFA16207), radius = rInner, center = c, style = Stroke(width = size.width * 0.03f))
        drawCircle(color = Color(0xFF713F12), radius = hub, center = c)
        drawCircle(color = Color(0xFFEAB308), radius = hub, center = c, style = Stroke(width = size.width * 0.02f))
        for (angle in listOf(0, 45, 90, 135, 180, 225, 270, 315)) {
            val rad = Math.toRadians(angle.toDouble())
            val dx = Math.sin(rad).toFloat()
            val dy = -Math.cos(rad).toFloat()
            val start = c + Offset(dx * rOuter * 0.1f, dy * rOuter * 0.1f)
            val end = c + Offset(dx * rOuter * 1.2f, dy * rOuter * 1.2f)
            drawLine(Color(0xFF854D0E), start, end, strokeWidth = size.width * 0.05f, cap = StrokeCap.Round)
            val knob = c + Offset(dx * rOuter * 1.35f, dy * rOuter * 1.35f)
            drawCircle(Color(0xFF713F12), radius = size.width * 0.045f, center = knob)
            drawCircle(Color(0xFFEAB308), radius = size.width * 0.045f, center = knob, style = Stroke(width = size.width * 0.01f))
        }
    }
}