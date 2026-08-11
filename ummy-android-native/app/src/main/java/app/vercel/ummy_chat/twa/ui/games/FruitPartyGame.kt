package app.vercel.ummy_chat.twa.ui.games

import android.media.MediaPlayer
import android.widget.Toast
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FruitPartyGame â€” full port of RN fruit-party-game.tsx (1176 lines)
// 24/7 continuous 40s rounds (30s betting + 3s spin + 7s result), MurmurHash
// deterministic winner, wheel chase spin, wager chips, RTDB shared playerBets,
// Firestore wallet writes, history bar, launching splash screen.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

private const val COLOR_BG = 0xFF311082
private const val COLOR_GOLD = 0xFFF1C40F

@Composable
fun FruitPartyGame(
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
    var timeLeft by remember { mutableIntStateOf(30) }
    var selectedChip by remember { mutableLongStateOf(1000L) }
    var myBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var lastBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var highlightIdx by remember { mutableStateOf<Int?>(null) }
    var history by remember { mutableStateOf(listOf("pineapple", "cherry", "banana", "watermelon", "skewers", "burrito", "pizza", "chicken")) }
    var winnerData by remember { mutableStateOf<GameWinnerData?>(null) }
    var shiningGroup by remember { mutableStateOf("none") }
    var localCoins by remember { mutableLongStateOf(0L) }
    var droppedChips by remember { mutableStateOf<List<DroppedChip>>(emptyList()) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }

    // refs
    val lastProcessedRoundRef = remember { mutableLongStateOf(-1L) }
    val spinInitiatedRef = remember { mutableStateOf(false) }
    val locallyUpdatedCoinsRef = remember { mutableStateOf(false) }
    val myBetsRef = remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    val processedRef = remember { mutableStateOf(false) }
    val isDealerRef = remember { mutableStateOf(false) }
    val spinTimerJob = remember { mutableStateOf<Job?>(null) }
    val scope = rememberCoroutineScope()

    // dimensions (RN: SCREEN_WIDTH * 0.82 etc)
    val screenW = LocalConfiguration.current.screenWidthDp
    val screenH = LocalConfiguration.current.screenHeightDp
    val wheelDp = screenW * 0.82f
    val centerDp = wheelDp * 0.32f
    val boxDp = 64f
    val distanceDp = (wheelDp / 2) - (boxDp / 2) + 4f
    val wheelSize = wheelDp.dp
    val centerSize = (centerDp * 0.88f).dp

    val fruitPositions = remember(screenW) {
        FRUITS.indices.map { i ->
            val angle = (i * 45 - 90) * (Math.PI / 180)
            val top = (wheelDp / 2) + Math.sin(angle) * distanceDp - boxDp / 2
            val left = (wheelDp / 2) + Math.cos(angle) * distanceDp - boxDp / 2
            top.toFloat() to left.toFloat()
        }
    }

    // sound helpers (expo-av -> MediaPlayer)
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
        database.getReference("games/fruit_party_${r}/playerBets/$u")
            .setValue(mapOf("bets" to bets, "timestamp" to System.currentTimeMillis(), "username" to (userProfile?.get("username") ?: "Guest")))
            .addOnFailureListener {}
    }

    fun goWallet() {
        onClose()
        onGoToWallet()
    }

    // â”€â”€â”€ place bet (RN handlePlaceBet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun handlePlaceBet(fruitId: String) {
        if (gameState != "betting" || uid == null) return
        if (localCoins < selectedChip) {
            Toast.makeText(context, "Insufficient coins â€” go to wallet", Toast.LENGTH_SHORT).show()
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
                    "source" to "Fruit Party", "description" to "Fruit Party Bet ($fruitId)",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}

            locallyUpdatedCoinsRef.value = true
            localCoins -= selectedChip
        } catch (_: Exception) {}

        val newBets = myBetsRef.value.toMutableMap()
        newBets[fruitId] = (newBets[fruitId] ?: 0L) + selectedChip
        myBetsRef.value = newBets
        myBets = newBets
        saveBetsToRTDB(newBets)
        droppedChips = (droppedChips + DroppedChip("${System.currentTimeMillis()}-${(0..999999).random()}", fruitId, formatChipLabel(selectedChip))).takeLast(90)
    }

    // â”€â”€â”€ repeat bet (RN handleRepeat) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun handleRepeat() {
        if (gameState != "betting" || lastBets.isEmpty() || uid == null) return
        val totalCost = lastBets.values.sum()
        if (localCoins < totalCost) {
            Toast.makeText(context, "Insufficient coins â€” go to wallet", Toast.LENGTH_SHORT).show()
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
                    "source" to "Fruit Party", "description" to "Fruit Party Repeat Bet",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}

            locallyUpdatedCoinsRef.value = true
            localCoins -= totalCost
        } catch (_: Exception) {}

        val newDrops = ArrayList<DroppedChip>()
        lastBets.forEach { (fruitId, amount) ->
            val count = ceil(amount / selectedChip.toDouble()).toInt()
            for (i in 0 until count) {
                newDrops.add(DroppedChip("${System.currentTimeMillis()}-${(0..999999).random()}-$i", fruitId, formatChipLabel(selectedChip)))
            }
        }
        droppedChips = (droppedChips + newDrops).takeLast(90)

        val merged = myBets.toMutableMap()
        lastBets.forEach { (k, v) -> merged[k] = (merged[k] ?: 0L) + v }
        myBetsRef.value = merged
        myBets = merged
        saveBetsToRTDB(merged)
    }

    // â”€â”€â”€ finalize round (RN finalizeResult) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun finalizeResult(id: String, groupType: String) {
        playSfx("win")
        shiningGroup = groupType
        val winningIds = when (groupType) {
            "left" -> LEFT_GROUP
            "right" -> RIGHT_GROUP
            else -> listOf(id)
        }
        var winAmount = 0L
        winningIds.forEach { wid ->
            val winItem = FRUITS.firstOrNull { it.id == wid }
            winAmount += (myBetsRef.value[wid] ?: 0L) * (winItem?.multiplier ?: 0)
        }
        val winItem = FRUITS.firstOrNull { it.id == id }
        val updatedHistory = (listOf(id) + history).take(15)

        val rtdbPath = "games/fruit_party_${roomId ?: "global"}"
        database.getReference(rtdbPath)
            .updateChildren(mapOf("history" to updatedHistory, "updatedAt" to System.currentTimeMillis()))
            .addOnFailureListener {}
        firestore.collection("games").document("fruit-party")
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
                    "source" to "Fruit Party", "description" to "Fruit Party Win (${winItem?.id ?: "Payout"})",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}
            locallyUpdatedCoinsRef.value = true
            localCoins += winAmount
            firestore.collection("globalGameWins").add(
                mapOf("gameId" to "fruit-party", "roomId" to (roomId ?: "null"), "userId" to uid,
                    "username" to (userProfile?.get("username") ?: "Guest"), "avatarUrl" to (userProfile?.get("avatarUrl") ?: "null"),
                    "amount" to winAmount, "betAmount" to totalWagerForGroup, "timestamp" to Date())
            ).addOnFailureListener {}
        }

        // credit ALL players from RTDB (handles users who exited mid-round)
        scope.launch {
            try {
                val r = roomId ?: return@launch
                val playerBetsRef = database.getReference("games/fruit_party_${r}/playerBets")
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
                            val wItem = FRUITS.firstOrNull { it.id == wid }
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
                    database.getReference("games/fruit_party_${r}/playerBets").setValue(null)
                } catch (_: Exception) {}
            }
        }

        // round-end event â†’ overlay podium
        onRoundEnd(
            when (groupType) {
                "left" -> GameRoundEndData("Non-veg Mix!", "\uD83C\uDF62\uD83C\uDF2F\uD83C\uDF55\uD83C\uDF57", R.drawable.nonveg_mix, winAmount, totalWagerForGroup)
                "right" -> GameRoundEndData("Fruit Mix!", "\uD83C\uDF4D\uD83C\uDF52\uD83C\uDF4C\uD83C\uDF49", R.drawable.fruit_mix, winAmount, totalWagerForGroup)
                else -> GameRoundEndData(
                    "${winItem?.emoji ?: "\uD83C\uDFC6"} ${(winItem?.id?.uppercase() ?: "WIN")} x${winItem?.multiplier ?: 0}!",
                    winItem?.emoji ?: "\uD83C\uDFC6",
                    winItem?.imageRes,
                    winAmount, totalWagerForGroup
                )
            }
        )

        // local reset after 6s
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

            val newRoundStart = System.currentTimeMillis()
            timeLeft = 30
            try {
                val ref = database.getReference("games/fruit_party_${roomId ?: "global"}")
                ref.runTransaction(object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val data = mutableMapOf<String, Any?>()
                        data["status"] = "betting"
                        data["winningId"] = null
                        data["groupType"] = "none"
                        val existingHist = (currentData.value as? Map<*, *>)?.get("history") as? List<*>
                        data["history"] = (listOf(id) + (existingHist?.map { it.toString() } ?: emptyList())).take(15)
                        data["roundStartTime"] = newRoundStart
                        data["updatedAt"] = System.currentTimeMillis()
                        currentData.value = data
                        return Transaction.success(currentData)
                    }
                    override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
                })
            } catch (_: Exception) {}
        }
    }

    // â”€â”€â”€ spin chase (RN startSpin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    fun startSpin(winningId: String, groupType: String) {
        playSfx("spin")
        gameState = "spinning"

        val targetIdx = FRUITS.indexOfFirst { it.id == winningId }
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

    // master loop (RN updateContinuousLoop â€” 24/7 continuous)
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
                    val idx = getDeterministicWinnerIndex(roundIdx, FRUITS.size)
                    startSpin(FRUITS[idx].id, "none")
                }
            }
            delay(1000)
        }
    }

    // coins sync from user doc (guarded against optimistic updates)
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

    // RTDB pending-bets recovery on mount (credit/refund after exit)
    LaunchedEffect(uid, roomId) {
        if (uid == null || roomId == null) return@LaunchedEffect
        try {
            val pBetsRef = database.getReference("games/fruit_party_${roomId}/playerBets/$uid")
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
            val gameSnap = database.getReference("games/fruit_party_$roomId").get().await()
            val gameData = gameSnap.value as? Map<String, Any?>
            val winningId = gameData?.get("winningId") as? String
            val groupType = gameData?.get("groupType") as? String ?: "none"
            if (winningId != null) {
                val winIds = when (groupType) {
                    "left" -> LEFT_GROUP
                    "right" -> RIGHT_GROUP
                    else -> listOf(winningId)
                }
                var playerWin = 0L
                bets.forEach { (k, v) ->
                    if (winIds.contains(k)) {
                        val wItem = FRUITS.firstOrNull { it.id == k }
                        playerWin += ((v as? Number)?.toLong() ?: 0L) * (wItem?.multiplier ?: 0)
                    }
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

    // history realtime sync (Firestore + RTDB)
    LaunchedEffect(Unit) {
        val docRef = firestore.collection("games").document("fruit-party")
        val reg = docRef.addSnapshotListener { snap, _ ->
            val h = (snap?.data?.get("history") as? List<*>)?.map { it.toString() }
            if (h != null && h.isNotEmpty()) history = h
        }
        try { awaitCancellation() } finally { reg.remove() }
    }

    LaunchedEffect(Unit) {
        val target = database.getReference("games/fruit_party_${roomId ?: "global"}")
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

    // launching splash
    if (gameState == "launching") {
        FruitLaunchingScreen()
        return
    }

    // pulse + spin animations for main screen
    val infinite = rememberInfiniteTransition(label = "fp")
    val pulse by infinite.animateFloat(0.6f, 1f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "p")
    val rot by infinite.animateFloat(0f, 360f, infiniteRepeatable(tween(2000)), label = "r")

    // â”€â”€â”€ MAIN UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(COLOR_BG))
    ) {
        val density = LocalDensity.current.density
        val areaW = constraints.maxWidth / density
        val areaH = constraints.maxHeight / density

        // background party image (semi-transparent)
        Image(
            painter = painterResource(R.drawable.fruit_party),
            contentDescription = null,
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.35f),
            contentScale = ContentScale.Crop
        )

        Column(Modifier.fillMaxSize()) {
            // â”€â”€ Wheel Area â”€â”€
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                val wAreaW = constraints.maxWidth / density
                val wAreaH = constraints.maxHeight / density

                // Side mix icons (left = non-veg mix, right = fruit mix)
                MixIcon(
                    imageRes = R.drawable.nonveg_mix,
                    active = shiningGroup == "left",
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = ((wAreaW - wheelDp) / 2 - 20).dp, y = (wAreaH / 2 - wheelDp / 2 - 225).dp.coerceAtLeast(0.dp))
                        .zIndex(40f)
                )
                MixIcon(
                    imageRes = R.drawable.fruit_mix,
                    active = shiningGroup == "right",
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = ((wAreaW - wheelDp) / 2 + wheelDp - 36).dp, y = (wAreaH / 2 - wheelDp / 2 - 225).dp.coerceAtLeast(0.dp))
                        .zIndex(40f)
                )

                // A-frame stand
                WheelStand(Modifier.align(Alignment.BottomCenter).zIndex(1f))

                // base platform deck
                Box(Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(12.dp)
                    .background(Color(0xFF9333EA), RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp))
                    .zIndex(8f))

                // â”€â”€ Wheel â”€â”€
                Box(Modifier.size(wheelSize).zIndex(20f)) {
                    // golden outer ring
                    Box(Modifier
                        .fillMaxSize()
                        .shadow(12.dp, CircleShape, spotColor = Color(COLOR_GOLD))
                        .clip(CircleShape)
                        .background(Color.Transparent)
                        .border(12.dp, Color(COLOR_GOLD), CircleShape))

                    // glowing bulbs on rim
                    for (i in 0 until 8) {
                        val angle = (i * 45 - 90 + 22.5) * (Math.PI / 180)
                        val radius = (wheelDp / 2) - 20
                        val t = (wheelDp / 2) + Math.sin(angle) * radius - 7
                        val l = (wheelDp / 2) + Math.cos(angle) * radius - 7
                        Box(Modifier
                            .offset(x = l.dp, y = t.dp)
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(if (i % 2 == 0) Color.White else Color(0xFFFDA4AF))
                            .border(0.dp, Color.Transparent, CircleShape))
                    }

                    // inner golden ring
                    Box(Modifier
                        .fillMaxSize()
                        .padding(18.dp)
                        .clip(CircleShape)
                        .border(9.dp, Color(COLOR_GOLD).copy(alpha = 0.75f), CircleShape))

                    // spokes
                    for (i in 0 until FRUITS.size) {
                        val angle = i * 45 - 90
                        Box(Modifier
                            .offset(x = (wheelDp / 2).dp, y = (wheelDp / 2 - 4).dp)
                            .width((wheelDp / 2 - 14).dp)
                            .height(8.dp)
                            .graphicsLayer {
                                transformOrigin = TransformOrigin(0f, 0.5f)
                                rotationZ = angle.toFloat()
                            }
                            .background(Color(COLOR_GOLD).copy(alpha = 0.75f)))
                    }

                    // food boxes
                    FRUITS.forEachIndexed { i, fruit ->
                        val (top, left) = fruitPositions[i]
                        val isHighlighted = highlightIdx == i
                        val isItemInWinningGroup = when (shiningGroup) {
                            "left" -> LEFT_GROUP.contains(fruit.id)
                            "right" -> RIGHT_GROUP.contains(fruit.id)
                            else -> false
                        }
                        val active = isHighlighted || (gameState == "result" && isItemInWinningGroup)
                        val betAmount = myBets[fruit.id] ?: 0L
                        val fruitChips = droppedChips.filter { it.fruitId == fruit.id }

                        Box(Modifier
                            .offset(x = left.dp, y = top.dp)
                            .size(boxDp.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFF111827))
                            .border(if (active) 3.dp else 0.dp, if (active) Color.White else Color.Transparent, RoundedCornerShape(14.dp))
                            .shadow(if (active) 12.dp else 3.dp, RoundedCornerShape(14.dp), spotColor = if (active) Color(0xFF00E5FF) else Color.Black)
                            .then(if (active) Modifier.graphicsLayer { scaleX = 1.15f; scaleY = 1.15f } else Modifier)
                            .clickable { handlePlaceBet(fruit.id) }
                            .zIndex(if (active) 50f else 10f)
                        ) {
                            Image(painterResource(fruit.imageRes), contentDescription = null,
                                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            Column(Modifier.fillMaxSize()) {
                                Spacer(Modifier.weight(1f))
                                Box(Modifier
                                    .fillMaxWidth()
                                    .background(Color(0x80000000))
                                    .padding(vertical = 2.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(fruit.label.uppercase(), color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                            fruitChips.take(3).forEachIndexed { ci, chip ->
                                Box(Modifier
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-2).dp, y = (-4 + ci * 6).dp)
                                    .size(18.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEAB308))
                                    .border(1.5.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(chip.label, color = Color.White, fontSize = 6.sp, fontWeight = FontWeight.Black)
                                }
                            }
                            if (betAmount > 0) {
                                Box(Modifier
                                    .align(Alignment.TopStart)
                                    .offset(x = 2.dp, y = 2.dp)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(COLOR_GOLD)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(formatChipLabel(betAmount), color = Color(0xFF1A0533), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }

                    // center circle
                    Box(Modifier
                        .align(Alignment.Center)
                        .size(centerSize)
                        .clip(CircleShape)
                        .background(Color(0xFF100529))
                        .border(3.dp, Color(COLOR_GOLD), CircleShape)
                        .shadow(14.dp, CircleShape, spotColor = Color(COLOR_GOLD)),
                        contentAlignment = Alignment.Center
                    ) {
                        when {
                            gameState == "betting" -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                val scale = if (timeLeft < 10) 1f + (pulse - 0.6f) else 1f
                                Text("$timeLeft", color = Color(COLOR_GOLD), fontSize = 28.sp, fontWeight = FontWeight.Black,
                                    modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale })
                                Text("SECONDS", color = Color.White.copy(alpha = 0.7f), fontSize = 8.sp, fontWeight = FontWeight.Black)
                            }
                            gameState == "spinning" -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("\uD83C\uDFA1", fontSize = 26.sp, modifier = Modifier.graphicsLayer { rotationZ = rot })
                                Text("SPINNING...", color = Color(0xFF00E5FF), fontSize = 6.sp, fontWeight = FontWeight.Black)
                            }
                            else -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                val winEmoji = winnerData?.id?.let { wid -> FRUITS.firstOrNull { it.id == wid }?.emoji } ?: "\uD83C\uDF4D"
                                if (winnerData != null) {
                                    Text(winEmoji, fontSize = 24.sp)
                                    Text("WIN!", color = Color(0xFF00FFCC), fontSize = 8.sp, fontWeight = FontWeight.Black)
                                } else {
                                    Text("PARTY!", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }

                    // pointer triangle at top
                    Canvas(
                        Modifier
                            .align(Alignment.TopCenter)
                            .offset(y = (-10).dp)
                            .size(20.dp, 16.dp)
                            .zIndex(70f)
                    ) {
                        val p = Path().apply {
                            moveTo(0f, 0f)
                            lineTo(size.width, 0f)
                            lineTo(size.width / 2f, size.height)
                            close()
                        }
                        drawPath(p, Color(COLOR_GOLD))
                    }
                }
            }

            // â”€â”€ Wager Panel â”€â”€
            WagerPanelUI(
                localCoins = localCoins,
                selectedChip = selectedChip,
                showRepeat = lastBets.isNotEmpty(),
                onSelectChip = { selectedChip = it },
                onRepeat = { handleRepeat() },
                onGoToWallet = { goWallet() }
            )

            // â”€â”€ Winning History Bar â”€â”€
            HistoryBarUI(history)
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LaunchingScreen port (RN LaunchingScreen)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
private fun FruitLaunchingScreen() {
    val inft = rememberInfiniteTransition(label = "launch")
    val pulse by inft.animateFloat(0.4f, 1f, infiniteRepeatable(tween(1000), RepeatMode.Reverse), label = "p")
    val rot by inft.animateFloat(0f, 360f, infiniteRepeatable(tween(3000)), label = "r")

    Box(Modifier.fillMaxSize().background(Color(COLOR_BG)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("\uD83C\uDFA1", fontSize = 72.sp,
                modifier = Modifier.graphicsLayer { rotationZ = rot; this.alpha = pulse })
            Text("FRUIT PARTY", color = Color(0xFFFFD700), fontSize = 28.sp, fontWeight = FontWeight.Black,
                modifier = Modifier.padding(top = 12.dp))
            Spacer(Modifier.height(16.dp))
            Box(Modifier.width(180.dp).height(6.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.08f))) {
                Box(Modifier
                    .fillMaxWidth(0.6f)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFFD700))
                    .graphicsLayer { translationX = (pulse - 0.4f) * 300f - 180f })
            }
            Text("ENTERING THE PARTY...", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp,
                fontWeight = FontWeight.Black, letterSpacing = 2.sp, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Side mix icon (non-veg / fruit)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
private fun MixIcon(
    imageRes: Int,
    active: Boolean,
    modifier: Modifier = Modifier
) {
    Box(modifier
        .size(56.dp)
        .clip(RoundedCornerShape(14.dp))
        .background(Color(0xFF111827))
        .border(if (active) 3.dp else 0.dp, if (active) Color(COLOR_GOLD) else Color.Transparent, RoundedCornerShape(14.dp))
        .then(if (active) Modifier.graphicsLayer { scaleX = 1.25f; scaleY = 1.25f } else Modifier),
        contentAlignment = Alignment.Center
    ) {
        Image(painterResource(imageRes), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// A-frame stand (RN Svg) + base platform deck
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
private fun WheelStand(modifier: Modifier = Modifier) {
    Box(modifier.width(120.dp).height(150.dp)) {
        Canvas(Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val s = w / 120f
            val gold = Color(COLOR_GOLD)
            drawLine(gold, Offset(60f * s, 0f), Offset(20f * s, h), strokeWidth = 10f * s, cap = StrokeCap.Round)
            drawLine(gold, Offset(60f * s, 0f), Offset(100f * s, h), strokeWidth = 10f * s, cap = StrokeCap.Round)
            drawLine(gold, Offset(40f * s, 75f * s), Offset(80f * s, 75f * s), strokeWidth = 8f * s, cap = StrokeCap.Round)
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Wager Panel (RN L940-1076)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
private fun WagerPanelUI(
    localCoins: Long,
    selectedChip: Long,
    showRepeat: Boolean,
    onSelectChip: (Long) -> Unit,
    onRepeat: () -> Unit,
    onGoToWallet: () -> Unit
) {
    Column(Modifier
        .fillMaxWidth()
        .background(Color(0xFF7C3AED), RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
        .padding(horizontal = 20.dp, vertical = 8.dp)) {

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            // gold coin capsule
            Row(Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(Brush.horizontalGradient(listOf(Color(0xFFFFE885), Color(0xFFFFD700), Color(0xFFD97706))))
                .border(1.5.dp, Color(0xFFFFF5C0), RoundedCornerShape(8.dp))
                .padding(horizontal = 12.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically) {
                GoldenCoin(size = 25.dp)
                Spacer(Modifier.width(6.dp))
                Text(localCoins.toString().reversed().chunked(3).joinToString(",").reversed(),
                    color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.width(4.dp))
                Box(Modifier.size(16.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.3f)).clickable { onGoToWallet() },
                    contentAlignment = Alignment.Center) {
                    Text("+", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
            if (showRepeat) {
                Row(Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.White.copy(alpha = 0.15f))
                    .border(1.5.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .clickable { onRepeat() }
                    .padding(horizontal = 12.dp, vertical = 5.5.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("\u21BA", color = Color.White, fontSize = 12.sp)
                    Text(" REPEAT BET", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        Spacer(Modifier.height(8.dp))
        Text("Choose the amount of wager then choose food", color = Color.White, fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 10.dp))
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(start = 10.dp)) {
            FRUIT_CHIPS.forEach { value ->
                val selected = value == selectedChip
                Box(Modifier
                    .size(width = 48.dp, height = 42.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .border(if (selected) 2.dp else 1.dp, if (selected) Color(0xFFFFF5C0) else Color.White.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                    .shadow(if (selected) 6.dp else 0.dp, RoundedCornerShape(10.dp), spotColor = Color(0xFFFFD700))
                    .background(if (selected)
                        Brush.verticalGradient(listOf(Color(0xFFFFE885), Color(0xFFFFD700), Color(0xFFF59E0B)))
                        else Brush.verticalGradient(listOf(Color(0xFF6B21A8), Color(0xFF4C1D95))))
                    .clickable { onSelectChip(value) },
                    contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        GoldenCoin(size = 12.dp)
                        Spacer(Modifier.height(1.5.dp))
                        Text(formatChipLabel(value), color = if (selected) Color(0xFF4C1D95) else Color.White,
                            fontSize = 9.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Winning History Bar (RN L1078-1132)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@Composable
private fun HistoryBarUI(history: List<String>) {
    Row(Modifier
        .fillMaxWidth()
        .background(Color(0xFF2E0854))
        .border(2.dp, Color(COLOR_GOLD), RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp))
        .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(end = 10.dp)) {
            Text("\uD83C\uDFC6", fontSize = 13.sp)
            Text("Winning\nHistory", color = Color(0xFFFFD700), fontSize = 9.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
        }
        Row(Modifier
            .weight(1f)
            .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically) {
            val items = if (history.isNotEmpty()) history
                else listOf("pineapple", "cherry", "banana", "watermelon", "skewers", "burrito", "pizza", "chicken")
            items.forEachIndexed { i, id ->
                val item = FRUITS.firstOrNull { it.id == id }
                val isLatest = i == 0
                Box(Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color.White)
                    .border(if (isLatest) 2.dp else 1.5.dp, if (isLatest) Color(COLOR_GOLD) else Color(0x4DFFD700), CircleShape)
                    .graphicsLayer { alpha = 1f - (i * 0.06f) },
                    contentAlignment = Alignment.Center) {
                    if (item != null) {
                        Image(painterResource(item.imageRes), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                    } else {
                        Text("\uD83C\uDF4D", fontSize = 16.sp)
                    }
                }
            }
        }
    }
}
