package app.vercel.ummy_chat.twa.ui.games

import android.media.MediaPlayer
import android.widget.Toast
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
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
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
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
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import app.vercel.ummy_chat.twa.ui.home.GoldenCoin
import app.vercel.ummy_chat.twa.R

// -----------------------------------------------------------------------------
// RouletteGame — full port of RN roulette-game.tsx
// 37-slot wheel, 8 bet types (zero/red/black/odd/even/1-12/13-24/25-36),
// shared dealer transaction on RTDB, gameOracle forced results, spin animation,
// RTDB playerBets, Firestore wallet writes, history bar.
// -----------------------------------------------------------------------------

private const val COL_RED = 0xFFDC2626
private const val COL_BLACK = 0xFF0F172A
private const val COL_GREEN = 0xFF10B981
private const val COL_BG = 0xFF090714
private const val COL_GOLD = 0xFFFBBF24

private data class RouletteNumber(val n: Int, val color: Long)

private val RED_NUMS = setOf(1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36)

private val ROULETTE_NUMBERS = listOf(RouletteNumber(0, COL_GREEN)) +
    listOf(32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26)
        .map { RouletteNumber(it, if (RED_NUMS.contains(it)) COL_RED else COL_BLACK) }

private data class BetType(val id: String, val label: String, val payout: Int, val check: (Int) -> Boolean, val icon: String)

private val BET_TYPES = listOf(
    BetType("zero", "0", 36, { n -> n == 0 }, "\uD83C\uDFAF"),
    BetType("red", "RED", 2, { n -> RED_NUMS.contains(n) }, "\uD83D\uDD34"),
    BetType("black", "BLACK", 2, { n -> n != 0 && !RED_NUMS.contains(n) }, "\u26AB"),
    BetType("odd", "ODD", 2, { n -> n != 0 && n % 2 == 1 }, "1\uFE0F\u20E3"),
    BetType("even", "EVEN", 2, { n -> n != 0 && n % 2 == 0 }, "2\uFE0F\u20E3"),
    BetType("1-12", "1\u201312", 3, { n -> n in 1..12 }, "\uD83D\uDCCA"),
    BetType("13-24", "13\u201324", 3, { n -> n in 13..24 }, "\uD83D\uDCC8"),
    BetType("25-36", "25\u201336", 3, { n -> n in 25..36 }, "\uD83D\uDCC9")
)

private val ROULETTE_CHIPS = listOf(500L, 1000L, 5000L, 10000L, 50000L, 500000L)

@Composable
fun RouletteGame(
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
    var timeLeft by remember { mutableIntStateOf(15) }
    var selectedChip by remember { mutableLongStateOf(1000L) }
    var myBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var lastBets by remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var winningNumber by remember { mutableStateOf<Int?>(null) }
    var resultMessage by remember { mutableStateOf<String?>(null) }
    var history by remember { mutableStateOf<List<Int>>(emptyList()) }
    var localCoins by remember { mutableLongStateOf(0L) }
    var roundStartTime by remember { mutableStateOf<Long?>(null) }
    var syncedRotation by remember { mutableFloatStateOf(0f) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }

    // refs
    val spinInitiatedRef = remember { mutableStateOf(false) }
    val isDealerRef = remember { mutableStateOf(false) }
    val locallyUpdatedCoinsRef = remember { mutableStateOf(false) }
    val myBetsRef = remember { mutableStateOf<Map<String, Long>>(emptyMap()) }
    val processedRef = remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val wheelRotation = remember { Animatable(0f) }

    // dimensions (RN: Math.min(SCREEN_WIDTH - 64, 300))
    val screenW = LocalConfiguration.current.screenWidthDp
    val screenH = LocalConfiguration.current.screenHeightDp
    val wheelDp = minOf(screenW - 64, 300).toFloat()
    val centerDp = wheelDp * 0.32f
    val wheelSize = wheelDp.dp
    val centerSize = centerDp.dp

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
        database.getReference("games/roulette_${r}/playerBets/$u")
            .setValue(mapOf("bets" to bets, "timestamp" to System.currentTimeMillis(), "username" to (userProfile?.get("username") ?: "Guest")))
            .addOnFailureListener {}
    }

    fun goWallet() {
        onClose()
        onGoToWallet()
    }

    fun fmt(v: Long): String = v.toString().reversed().chunked(3).joinToString(",").reversed()

    // place bet (RN handlePlaceBet)
    fun handlePlaceBet(betId: String) {
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
                    "source" to "Roulette", "description" to "Roulette Bet ($betId)",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}

            locallyUpdatedCoinsRef.value = true
            localCoins -= selectedChip
        } catch (_: Exception) {}

        val newBets = myBetsRef.value.toMutableMap()
        newBets[betId] = (newBets[betId] ?: 0L) + selectedChip
        myBetsRef.value = newBets
        myBets = newBets
        saveBetsToRTDB(newBets)
    }

    // repeat last round bets (RN handleRepeat)
    fun handleRepeat() {
        if (gameState != "betting" || lastBets.isEmpty() || uid == null) return
        val totalCost = lastBets.values.sum()
        if (localCoins < totalCost) {
            Toast.makeText(context, "Insufficient coins \u2014 go to wallet", Toast.LENGTH_SHORT).show()
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
                    "source" to "Roulette", "description" to "Roulette Repeat Bet",
                    "timestamp" to FieldValue.serverTimestamp())
            ).addOnFailureListener {}

            locallyUpdatedCoinsRef.value = true
            localCoins -= totalCost
        } catch (_: Exception) {}

        val merged = myBets.toMutableMap()
        lastBets.forEach { (k, v) -> merged[k] = (merged[k] ?: 0L) + v }
        myBetsRef.value = merged
        myBets = merged
        saveBetsToRTDB(merged)
    }

    // finalize round (RN finalizeResult)
    suspend fun finalizeResult(num: Int) {
        var totalWin = 0L
        BET_TYPES.forEach { bt ->
            val betAmt = myBetsRef.value[bt.id] ?: 0L
            if (betAmt > 0 && bt.check(num)) totalWin += betAmt * bt.payout
        }
        val totalBet = myBetsRef.value.values.sum()

        if (totalWin > 0) {
            val winDec = mapOf<String, Any>("wallet.coins" to FieldValue.increment(totalWin), "coins" to FieldValue.increment(totalWin))
            updateBothUserDocs(winDec)
            locallyUpdatedCoinsRef.value = true
            localCoins += totalWin
            firestore.collection("globalGameWins").add(
                mapOf("gameId" to "roulette", "roomId" to (roomId ?: "null"), "userId" to uid,
                    "username" to (userProfile?.get("username") ?: "Guest"), "avatarUrl" to (userProfile?.get("avatarUrl") ?: "null"),
                    "amount" to totalWin, "betAmount" to totalBet, "timestamp" to Date())
            ).addOnFailureListener {}
        }

        // credit all players from RTDB (handles users who exited mid-round)
        if (roomId != null) {
            try {
                val playerBetsRef = database.getReference("games/roulette_${roomId}/playerBets")
                val snapshot = playerBetsRef.get().await()
                val hasLocalBets = myBetsRef.value.isNotEmpty()
                if (snapshot.exists()) {
                    val allPlayers = snapshot.value as? Map<String, Any?> ?: emptyMap()
                    val batch2 = firestore.batch()
                    var hasOther = false
                    allPlayers.forEach { (userId, datum) ->
                        if (userId == uid && hasLocalBets) return@forEach
                        if (userId == uid && processedRef.value) return@forEach
                        val bets = (datum as? Map<*, *>)?.get("bets") as? Map<String, Any?> ?: return@forEach
                        var playerWin = 0L
                        BET_TYPES.forEach { bt ->
                            val betAmt = (bets[bt.id] as? Number)?.toLong() ?: 0L
                            if (betAmt > 0 && bt.check(num)) playerWin += betAmt * bt.payout
                        }
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

        val numInfo = ROULETTE_NUMBERS.firstOrNull { it.n == num }
        val colorName = if (num == 0) "GREEN" else if (numInfo?.color == COL_RED) "RED" else "BLACK"

        resultMessage = when {
            num == 0 -> "\uD83C\uDFAF $num GREEN!"
            totalWin > 0 -> "\uD83C\uDF89 $num $colorName! +${fmt(totalWin)}"
            else -> "\u274C $num $colorName!"
        }

        onRoundEnd(
            GameRoundEndData(
                resultText = "$num $colorName",
                resultEmoji = if (totalWin > 0) "\uD83C\uDF89" else "\uD83C\uDFAF",
                myPrize = totalWin,
                myWager = totalBet
            )
        )

        lastBets = myBetsRef.value
        myBets = emptyMap()
        myBetsRef.value = emptyMap()
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

    // On mount: check RTDB for pending bets from previous exit and credit/refund
    LaunchedEffect(uid, roomId) {
        if (uid == null || roomId == null) return@LaunchedEffect
        try {
            val pBetsRef = database.getReference("games/roulette_${roomId}/playerBets/$uid")
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
            val gameSnap = database.getReference("games/roulette_$roomId").get().await()
            val gameData = gameSnap.value as? Map<String, Any?>
            val resultNum = (gameData?.get("winningNumber") as? Number)?.toInt()
            if (resultNum != null) {
                var playerWin = 0L
                BET_TYPES.forEach { bt ->
                    val betAmt = (bets[bt.id] as? Number)?.toLong() ?: 0L
                    if (betAmt > 0 && bt.check(resultNum)) playerWin += betAmt * bt.payout
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

    // entrance loader
    LaunchedEffect(Unit) {
        delay(2000)
        gameState = "betting"
        roundStartTime = System.currentTimeMillis()
    }

    // real-time ticking countdown based on synced roundStartTime
    LaunchedEffect(gameState, roundStartTime) {
        if (gameState != "betting" || roundStartTime == null) return@LaunchedEffect
        val rt = roundStartTime ?: return@LaunchedEffect
        while (isActive) {
            val elapsed = System.currentTimeMillis() - rt
            val remaining = max(0, 15 - (elapsed / 1000).toInt())
            timeLeft = remaining
            if (remaining <= 0) break
            delay(1000)
        }
    }

    // timer hits 0 -> shared winner via RTDB transaction (all players same result)
    LaunchedEffect(timeLeft) {
        if (gameState != "betting" || spinInitiatedRef.value || timeLeft != 0) return@LaunchedEffect
        spinInitiatedRef.value = true

        var targetNum = 0
        var isDealer = false

        if (roomId != null) {
            try {
                val gamePath = "games/roulette_${roomId}"
                runTransactionAndWait(database.getReference(gamePath), object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val data = currentData.value as? Map<*, *>
                        if (data == null || data["status"] != "betting") return Transaction.abort()
                        val existing = (data["winningNumber"] as? Number)?.toInt()
                        if (existing != null) {
                            targetNum = existing
                            return Transaction.abort()
                        }
                        isDealer = true
                        targetNum = ROULETTE_NUMBERS.random().n
                        val newData = HashMap<String, Any?>()
                        newData["status"] = "spinning"
                        newData["winningNumber"] = targetNum
                        newData["updatedAt"] = System.currentTimeMillis()
                        currentData.value = newData
                        return Transaction.success(currentData)
                    }
                    override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
                })?: {}
            } catch (_: Exception) {}
        }

        if (targetNum == 0) {
            targetNum = ROULETTE_NUMBERS.random().n
            isDealer = true
        }

        if (isDealer) {
            try {
                val oracleSnap = firestore.collection("gameOracle").document("roulette").get().await()
                if (oracleSnap.exists()) {
                    val od = oracleSnap.data ?: emptyMap()
                    val isActive = od["isActive"] as? Boolean ?: false
                    if (isActive) {
                        val forced = (od["forcedResult"] as? Number)?.toInt()
                        if (forced != null && forced >= 0 && forced <= 36) targetNum = forced
                        firestore.collection("gameOracle").document("roulette")
                            .update(mapOf("isActive" to false)).addOnFailureListener {}
                        if (roomId != null) {
                            database.getReference("games/roulette_${roomId}")
                                .updateChildren(mapOf("winningNumber" to targetNum)).addOnFailureListener {}
                        }
                    }
                }
            } catch (_: Exception) {}
        }

        val targetIdx = ROULETTE_NUMBERS.indexOfFirst { it.n == targetNum }
        val rotationStep = 360f / ROULETTE_NUMBERS.size
        val extraSpins = 5 + (0..4).random()
        val newRotation = syncedRotation + (extraSpins * 360) + (targetIdx * rotationStep)

        gameState = "spinning"
        syncedRotation = newRotation
        playSfx("spin")
        scope.launch {
            wheelRotation.animateTo(newRotation, tween(durationMillis = 5000, easing = FastOutSlowInEasing))
        }

        delay(5000)
        gameState = "result"
        winningNumber = targetNum
        finalizeResult(targetNum)

        delay(5000)
        gameState = "betting"
        timeLeft = 15
        winningNumber = null
        resultMessage = null
        myBets = emptyMap()
        myBetsRef.value = emptyMap()
        spinInitiatedRef.value = false
        val newRoundStart = System.currentTimeMillis()
        roundStartTime = newRoundStart
        try {
            runTransactionAndWait(database.getReference("games/roulette_${roomId ?: "global"}"), object : Transaction.Handler {
                    override fun doTransaction(currentData: MutableData): Transaction.Result {
                        val data = (currentData.value as? Map<String, Any?>)?.toMutableMap() ?: mutableMapOf()
                        data["status"] = "betting"
                        data["winningNumber"] = null
                        if (isDealer) {
                            val h = (data["history"] as? List<*>)?.mapNotNull { (it as? Number)?.toInt() ?: it.toString().toIntOrNull() }
                                ?: emptyList()
                            data["history"] = (listOf(targetNum) + h).take(15)
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

    // RTDB sync - shared history, rotation for all players
    LaunchedEffect(roomId) {
        val target = database.getReference("games/roulette_${roomId ?: "global"}")
        val listener = object : ValueEventListener {
            override fun onCancelled(error: DatabaseError) {}
            override fun onDataChange(snap: DataSnapshot) {
                if (!snap.exists()) {
                    target.setValue(mapOf(
                        "status" to "betting", "winningNumber" to null, "rotation" to 0,
                        "history" to emptyList<Int>(), "roundStartTime" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    )).addOnFailureListener {}
                    return
                }
                val data = snap.value as? Map<String, Any?>
                val h = data?.get("history")
                if (h is List<*>) {
                    history = h.mapNotNull { (it as? Number)?.toInt() ?: it.toString().toIntOrNull() }
                } else if (h is Map<*, *>) {
                    history = h.values.mapNotNull { (it as? Number)?.toInt() ?: it.toString().toIntOrNull() }
                }
                val rot = data?.get("rotation")
                if (rot is Number) {
                    syncedRotation = rot.toFloat()
                    if (gameState != "spinning") {
                        scope.launch { wheelRotation.snapTo(syncedRotation) }
                    }
                }
            }
        }
        target.addValueEventListener(listener)
        try { awaitCancellation() } finally { target.removeEventListener(listener) }
    }

    // launching splash
    if (gameState == "launching") {
        RouletteLaunchingScreen()
        return
    }

    // pulse + spin animations
    val infinite = rememberInfiniteTransition(label = "roulette")
    val pulse by infinite.animateFloat(0.6f, 1f, infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "p")
    val rot by infinite.animateFloat(0f, 360f, infiniteRepeatable(tween(2000)), label = "r")

    val totalBet = myBets.values.sum()
    val segAngle = 360f / ROULETTE_NUMBERS.size
    val labelR = (wheelDp / 2f) - 12f

    Box(
        Modifier
            .fillMaxSize()
            .background(Color(COL_BG))
    ) {
        // background roulette image (65% screen height)
        Image(
            painter = painterResource(R.drawable.roulette),
            contentDescription = null,
            modifier = Modifier
                .fillMaxWidth()
                .height((screenH * 0.65f).dp)
                .align(Alignment.TopStart)
                .alpha(0.55f),
            contentScale = ContentScale.Crop
        )

        // smooth bottom fade-out
        Box(Modifier
            .fillMaxWidth()
            .height(120.dp)
            .align(Alignment.TopStart)
            .offset(y = ((screenH * 0.65f) - 120f).dp)
            .background(Brush.verticalGradient(listOf(Color.Transparent, Color(COL_BG)))))

        // top header - floating game history
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 32.dp)
            .zIndex(50f)) {
            Row(Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0x66000000))
                    .border(1.dp, Color(0x26EAB676), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 5.dp)) {
                    Text("HISTORY", color = Color(COL_GOLD), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                }
                history.forEachIndexed { i, num ->
                    val info = ROULETTE_NUMBERS.firstOrNull { it.n == num }
                    Box(Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(info?.color?.let { Color(it) } ?: Color(COL_BLACK))
                        .border(1.5.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                        .graphicsLayer { alpha = 1f - (i * 0.05f) },
                        contentAlignment = Alignment.Center) {
                        Text("$num", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        // wheel area
        Box(Modifier.fillMaxSize().zIndex(10f), contentAlignment = Alignment.Center) {
            Box(Modifier.padding(top = 20.dp, bottom = 140.dp), contentAlignment = Alignment.Center) {
                // neon backlighting glow container
                Box(Modifier
                    .size((wheelDp + 44).dp)
                    .clip(CircleShape)
                    .background(Color(0x148B5CF6))
                    .border(2.dp, Color(0x40A78BFA), CircleShape)
                    .shadow(20.dp, CircleShape, spotColor = Color(0xFF8B5CF6)),
                    contentAlignment = Alignment.Center) {
                    // polished mahogany wood frame outer ring
                    Box(Modifier
                        .size((wheelDp + 28).dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(
                            Color(0xFF5C2514), Color(0xFF2D0F06), Color(0xFF3F150A), Color(0xFF5C2514), Color(0xFF2D0F06))))
                        .border(2.dp, Color(0x73FBBF24), CircleShape)
                        .shadow(10.dp, CircleShape, spotColor = Color.Black),
                        contentAlignment = Alignment.Center) {
                        // dark wood bevel contrast
                        Box(Modifier
                            .size((wheelDp + 16).dp)
                            .clip(CircleShape)
                            .background(Color(0xFF1C0803))
                            .border(1.5.dp, Color(0xFF0F0402), CircleShape),
                            contentAlignment = Alignment.Center) {
                            // golden outer wheel track bezel
                            Box(Modifier
                                .size((wheelDp + 6).dp)
                                .clip(CircleShape)
                                .background(Color(0xFF111827))
                                .border(3.dp, Color(0xFFD97706), CircleShape)
                                .shadow(6.dp, CircleShape, spotColor = Color(COL_GOLD)),
                                contentAlignment = Alignment.Center) {
                                // unified wheel container
                                Box(Modifier.size(wheelSize)) {
                                    // animated spin wheel
                                    Box(Modifier
                                        .fillMaxSize()
                                        .graphicsLayer { rotationZ = wheelRotation.value },
                                        contentAlignment = Alignment.Center) {
                                        Canvas(Modifier.fillMaxSize()) {
                                            val cx = size.width / 2f
                                            val cy = size.height / 2f
                                            val r = size.width / 2f - 12.dp.toPx()
                                            drawCircle(Color(0xFF0F0C1B), r, center = Offset(cx, cy), style = Stroke(width = 2.5.dp.toPx()))
                                            ROULETTE_NUMBERS.forEachIndexed { i, item ->
                                                val startAngle = i * segAngle - 90f
                                                drawArc(
                                                    color = Color(item.color).copy(alpha = 0.92f),
                                                    startAngle = startAngle,
                                                    sweepAngle = segAngle,
                                                    useCenter = true,
                                                    topLeft = Offset(cx - r, cy - r),
                                                    size = Size(r * 2f, r * 2f),
                                                    style = Fill
                                                )
                                                drawArc(
                                                    color = Color(COL_GOLD),
                                                    startAngle = startAngle,
                                                    sweepAngle = segAngle,
                                                    useCenter = true,
                                                    topLeft = Offset(cx - r, cy - r),
                                                    size = Size(r * 2f, r * 2f),
                                                    style = Stroke(width = 0.6f)
                                                )
                                            }
                                            // golden division spokes
                                            ROULETTE_NUMBERS.forEachIndexed { i, _ ->
                                                val angle = (i * segAngle - 90) * (Math.PI / 180)
                                                val c = Math.cos(angle).toFloat()
                                                val s = Math.sin(angle).toFloat()
                                                drawLine(Color(COL_GOLD), Offset(cx + c * (r * 0.45f), cy + s * (r * 0.45f)),
                                                    Offset(cx + c * r, cy + s * r), strokeWidth = 1.2.dp.toPx(), alpha = 0.65f)
                                            }
                                            // track metallic pin deflectors
                                            for (i in 0 until 8) {
                                                val angle = (i * 45) * (Math.PI / 180)
                                                val pinR = r - 15.dp.toPx()
                                                val px = cx + Math.cos(angle).toFloat() * pinR
                                                val py = cy + Math.sin(angle).toFloat() * pinR
                                                drawCircle(Color(0xFFE5E7EB), 3.5.dp.toPx(), center = Offset(px, py))
                                                drawCircle(Color(COL_GOLD), 3.5.dp.toPx(), center = Offset(px, py), style = Stroke(width = 1.dp.toPx()))
                                                drawCircle(Color.White, 1.5.dp.toPx(), center = Offset(px, py))
                                            }
                                            // concentric detail rings
                                            drawCircle(Color(COL_GOLD), r * 0.88f, center = Offset(cx, cy), style = Stroke(width = 1.5.dp.toPx()), alpha = 0.45f)
                                            drawCircle(Color(COL_GOLD), r * 0.7f, center = Offset(cx, cy), style = Stroke(width = 1.dp.toPx()), alpha = 0.35f)
                                            // golden inner ring border
                                            drawCircle(Color(COL_GOLD), r * 0.45f, center = Offset(cx, cy), style = Stroke(width = 3.5.dp.toPx()))
                                        }
                                        // number labels
                                        ROULETTE_NUMBERS.forEachIndexed { i, item ->
                                            val midAngle = i * segAngle + segAngle / 2f
                                            val rad = Math.toRadians((midAngle - 90).toDouble())
                                            val lx = (wheelDp / 2f) + Math.cos(rad).toFloat() * labelR * 0.76f
                                            val ly = (wheelDp / 2f) + Math.sin(rad).toFloat() * labelR * 0.76f
                                            Text("${item.n}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier
                                                    .offset(x = (lx - 14f).dp, y = (ly - 8f).dp)
                                                    .size(28.dp, 16.dp)
                                                    .graphicsLayer { rotationZ = midAngle }
                                                    .zIndex(5f))
                                        }
                                    }

                                    // glossy varnished glass cover overlay
                                    Box(Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                        .background(Brush.linearGradient(
                                            listOf(Color.White.copy(alpha = 0.15f), Color.White.copy(alpha = 0.03f), Color.Transparent, Color.Transparent),
                                            start = Offset.Zero, end = Offset.Infinite))
                                        .zIndex(25f))

                                    // center countdown hub
                                    Box(Modifier
                                        .align(Alignment.Center)
                                        .size(centerSize)
                                        .clip(CircleShape)
                                        .background(Color(0xFF0A0915))
                                        .border(3.dp, Color(COL_GOLD), CircleShape)
                                        .shadow(8.dp, CircleShape, spotColor = Color(COL_GOLD))
                                        .zIndex(30f),
                                        contentAlignment = Alignment.Center) {
                                        when {
                                            gameState == "betting" -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                val scale = if (timeLeft > 0 && timeLeft <= 5) pulse else 0.6f
                                                Text("$timeLeft", color = Color(COL_GOLD), fontSize = 22.sp, fontWeight = FontWeight.Black,
                                                    modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale })
                                                Text("SECONDS", color = Color.White.copy(alpha = 0.4f), fontSize = 7.sp, fontWeight = FontWeight.Black)
                                            }
                                            gameState == "spinning" -> Text("\u21BB", color = Color(COL_GOLD), fontSize = 22.sp,
                                                modifier = Modifier.graphicsLayer { rotationZ = rot })
                                            else -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text(if (winningNumber != null) "$winningNumber" else "\uD83C\uDFC6",
                                                    color = Color(COL_GOLD), fontSize = 22.sp, fontWeight = FontWeight.Black)
                                                Text("WIN", color = Color.White.copy(alpha = 0.4f), fontSize = 7.sp, fontWeight = FontWeight.Black)
                                            }
                                        }
                                    }

                                    // golden pointer indicator (downward triangle at top)
                                    Canvas(Modifier
                                        .align(Alignment.TopCenter)
                                        .offset(y = (-6).dp)
                                        .size(22.dp, 20.dp)
                                        .zIndex(50f)) {
                                        val p = Path().apply {
                                            moveTo(0f, 0f)
                                            lineTo(size.width, 0f)
                                            lineTo(size.width / 2f, size.height)
                                            close()
                                        }
                                        drawPath(p, Color(COL_GOLD))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // balance & total bet row (above bet cards)
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(bottom = 136.dp)
            .align(Alignment.BottomCenter)
            .zIndex(50f),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically) {
            // premium balance capsule
            Row(Modifier
                .clip(CircleShape)
                .background(Brush.horizontalGradient(listOf(Color(0x40FBBF24), Color(0x14D97706))))
                .border(1.2.dp, Color(0x59FBBF24), CircleShape)
                .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier
                    .size(7.dp)
                    .clip(CircleShape)
                    .background(Color(COL_GREEN))
                    .shadow(4.dp, CircleShape, spotColor = Color(COL_GREEN)))
                Spacer(Modifier.width(6.dp))
                GoldenCoin(size = 25.dp)
                Spacer(Modifier.width(6.dp))
                Text(fmt(localCoins), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.3.sp)
                Spacer(Modifier.width(4.dp))
                Box(Modifier
                    .size(18.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0x33FBBF24))
                    .border(0.8.dp, Color(0x66FBBF24), RoundedCornerShape(8.dp))
                    .clickable { goWallet() },
                    contentAlignment = Alignment.Center) {
                    Text("+", color = Color(COL_GOLD), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
            // premium total bet capsule
            if (totalBet > 0) {
                Row(Modifier
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(Color(0x403B82F6), Color(0x141E40AF))))
                    .border(1.2.dp, Color(0x596096FA), CircleShape)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("BET: ", color = Color.White.copy(alpha = 0.75f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
                    Text("\uD83E\uDE99 ${fmt(totalBet)}", color = Color(0xFF3B82F6), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
        }

        // bet options row
        Row(Modifier
            .fillMaxWidth()
            .padding(bottom = 74.dp)
            .align(Alignment.BottomCenter)
            .zIndex(50f)) {
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                BET_TYPES.forEach { bt ->
                    val betAmt = myBets[bt.id] ?: 0L
                    val isActive = betAmt > 0
                    val bgColor = when (bt.id) {
                        "red" -> Color(COL_RED)
                        "black" -> Color(COL_BLACK)
                        "zero" -> Color(COL_GREEN)
                        else -> if (isActive) Color(0xFF3B82F6) else Color(0x0FFFFFFF)
                    }
                    val isColored = bt.id == "red" || bt.id == "black" || bt.id == "zero" || isActive
                    Box(Modifier
                        .widthIn(min = 72.dp)
                        .height(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(bgColor)
                        .border(2.dp,
                            if (isActive) Color(COL_GOLD)
                            else if (isColored) Color.White.copy(alpha = 0.35f)
                            else Color.White.copy(alpha = 0.09f),
                            RoundedCornerShape(16.dp))
                        .shadow(if (isActive) 6.dp else 0.dp, RoundedCornerShape(16.dp),
                            spotColor = if (isActive) Color(COL_GOLD) else Color.Black)
                        .graphicsLayer { alpha = if (gameState == "betting") 1f else 0.5f }
                        .clickable(enabled = gameState == "betting") { handlePlaceBet(bt.id) }
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(bt.icon, fontSize = 14.sp)
                            Text(bt.label, color = if (isColored) Color.White else Color.White.copy(alpha = 0.6f),
                                fontSize = 9.sp, fontWeight = FontWeight.Black)
                            Text("x${bt.payout}", color = if (isColored) Color.White.copy(alpha = 0.75f) else Color.White.copy(alpha = 0.35f),
                                fontSize = 7.sp, fontWeight = FontWeight.Bold)
                        }
                        if (betAmt > 0) {
                            Box(Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = (-3).dp, y = 3.dp)
                                .widthIn(min = 20.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(COL_GOLD))
                                .border(0.5.dp, Color.White, RoundedCornerShape(6.dp))
                                .padding(horizontal = 4.dp, vertical = 1.dp),
                                contentAlignment = Alignment.Center) {
                                Text(formatChipLabel(betAmt), color = Color(COL_BG), fontSize = 8.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            }
        }

        // chip selection panel
        Row(Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .padding(bottom = 12.dp)
            .align(Alignment.BottomCenter)
            .zIndex(50f)) {
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(start = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ROULETTE_CHIPS.forEach { value ->
                    val selected = selectedChip == value
                    Box(Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(if (selected) Color(COL_GOLD) else Color(0x14FFFFFF))
                        .border(if (selected) 2.5.dp else 1.5.dp,
                            if (selected) Color.White else Color.White.copy(alpha = 0.18f), CircleShape)
                        .shadow(if (selected) 6.dp else 0.dp, CircleShape,
                            spotColor = if (selected) Color(COL_GOLD) else Color.Black)
                        .clickable { selectedChip = value },
                        contentAlignment = Alignment.Center) {
                        Box(Modifier
                            .fillMaxSize()
                            .padding(3.dp)
                            .border(1.dp, if (selected) Color.White.copy(alpha = 0.45f) else Color.White.copy(alpha = 0.1f), CircleShape))
                        Text(formatChipLabel(value), color = if (selected) Color(COL_BG) else Color.White.copy(alpha = 0.85f),
                            fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
private fun RouletteLaunchingScreen() {
    val inft = rememberInfiniteTransition(label = "roulette-launch")
    val pulse by inft.animateFloat(0.4f, 1f, infiniteRepeatable(tween(1000), RepeatMode.Reverse), label = "p")
    val rot by inft.animateFloat(0f, 360f, infiniteRepeatable(tween(3000)), label = "r")

    Box(Modifier.fillMaxSize().background(Color(COL_BG)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("\uD83C\uDFB0", fontSize = 72.sp,
                modifier = Modifier.graphicsLayer { rotationZ = rot; this.alpha = pulse })
            Text("ROULETTE", color = Color(COL_GOLD), fontSize = 28.sp, fontWeight = FontWeight.Black,
                modifier = Modifier.padding(top = 12.dp))
            Spacer(Modifier.height(16.dp))
            Box(Modifier.width(180.dp).height(6.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.08f))) {
                Box(Modifier
                    .fillMaxWidth(0.6f)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(Color(COL_GOLD))
                    .graphicsLayer { translationX = (pulse - 0.4f) * 300f - 180f })
            }
            Text("ENTERING ROOM...", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp,
                fontWeight = FontWeight.Black, letterSpacing = 2.sp, modifier = Modifier.padding(top = 12.dp))
        }
    }
}
