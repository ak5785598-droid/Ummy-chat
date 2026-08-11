package app.vercel.ummy_chat.twa.ui.games

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.VectorConverter
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

// ─────────────────────────────────────────────────────────────────────────────
// LudoGame — full port of RN ludo-game.tsx + use-ludo-engine.ts
// 15x15 board, 52-cell path, lobby/quick/classic/bot modes, host referee.
// ─────────────────────────────────────────────────────────────────────────────

// ── 52-cell main path mapped to [row, col] on 15×15 grid ──
private val PATH_COORDS = listOf(
    6f to 1f, 6f to 2f, 6f to 3f, 6f to 4f, 6f to 5f,
    5f to 6f, 4f to 6f, 3f to 6f, 2f to 6f, 1f to 6f, 0f to 6f,
    0f to 7f, // top middle crossover
    0f to 8f, 1f to 8f, 2f to 8f, 3f to 8f, 4f to 8f, 5f to 8f,
    6f to 9f, 6f to 10f, 6f to 11f, 6f to 12f, 6f to 13f, 6f to 14f,
    7f to 14f, // right middle crossover
    8f to 14f, 8f to 13f, 8f to 12f, 8f to 11f, 8f to 10f, 8f to 9f,
    9f to 8f, 10f to 8f, 11f to 8f, 12f to 8f, 13f to 8f, 14f to 8f,
    14f to 7f, // bottom middle crossover
    14f to 6f, 13f to 6f, 12f to 6f, 11f to 6f, 10f to 6f, 9f to 6f,
    8f to 5f, 8f to 4f, 8f to 3f, 8f to 2f, 8f to 1f, 8f to 0f,
    7f to 0f, // left middle crossover
    6f to 0f
)

// Home stretch for each color (positions 53-57)
private val HOME_STRETCH = mapOf(
    "blue" to listOf(7f to 1f, 7f to 2f, 7f to 3f, 7f to 4f, 7f to 5f),
    "red" to listOf(1f to 7f, 2f to 7f, 3f to 7f, 4f to 7f, 5f to 7f),
    "green" to listOf(7f to 13f, 7f to 12f, 7f to 11f, 7f to 10f, 7f to 9f),
    "yellow" to listOf(13f to 7f, 12f to 7f, 11f to 7f, 10f to 7f, 9f to 7f)
)

// Start positions for each color (position 1 on the path)
private val COLOR_START_INDEX = mapOf("blue" to 0, "red" to 13, "green" to 26, "yellow" to 39)

// Home base positions (inside the colored quadrants)
private val HOME_BASE = mapOf(
    "blue" to listOf(1.7f to 1.7f, 1.7f to 3.3f, 3.3f to 1.7f, 3.3f to 3.3f),
    "red" to listOf(1.7f to 10.7f, 1.7f to 12.3f, 3.3f to 10.7f, 3.3f to 12.3f),
    "green" to listOf(10.7f to 10.7f, 10.7f to 12.3f, 12.3f to 10.7f, 12.3f to 12.3f),
    "yellow" to listOf(10.7f to 1.7f, 10.7f to 3.3f, 12.3f to 1.7f, 12.3f to 3.3f)
)

private val COLOR_HEX = mapOf(
    "red" to Color(0xFFff3f34), "green" to Color(0xFF10b981),
    "yellow" to Color(0xFFffa502), "blue" to Color(0xFF0fbcf9)
)

private val BOARD_COLORS = mapOf(
    "red" to Color(0xFFff4757), "green" to Color(0xFF2ed573),
    "blue" to Color(0xFF1e90ff), "yellow" to Color(0xFFffa502),
    "redLight" to Color(0x40ff4757), "greenLight" to Color(0x402ed573),
    "blueLight" to Color(0x401e90ff), "yellowLight" to Color(0x40ffa502)
)

// Safe squares (star positions) on the main path
private val SAFE_POSITIONS = listOf(1, 9, 14, 22, 27, 35, 40, 48)

private val SAFE_COORDS = listOf(
    6f to 1f, 6f to 2f, 1f to 8f, 8f to 2f, 8f to 13f, 6f to 12f, 13f to 6f, 12f to 8f,
    6f to 1f, 1f to 7f, 7f to 13f, 13f to 7f
)

private val COLOR_ORDER = listOf("red", "green", "yellow", "blue")

private val PIECE_EMOJIS = mapOf(
    "red" to "\uD83D\uDC3B", "green" to "\uD83D\uDC3C",
    "blue" to "\uD83D\uDC31", "yellow" to "\uD83D\uDD81"
)

private const val TURN_DURATION = 30000L
private const val MATCH_TIMEOUT = 1200000L

// ── Data model (parsed from RTDB) ───────────────────────────────────────────
private data class LudoPlayer(
    val uid: String, val username: String, val avatarUrl: String, val color: String
)

private data class LudoPiece(
    val id: String, val ownerUid: String, val color: String, val position: Int
)

private data class LudoState(
    val players: List<LudoPlayer>,
    val pieces: List<LudoPiece>,
    val turn: String,
    val dice: Int?,
    val diceRolled: Boolean,
    val consecutiveSixes: Int,
    val status: String,
    val mode: String?,
    val isBotMode: Boolean,
    val winner: String?,
    val turnStartTime: Long?,
    val matchStartTime: Long?,
    val missedTurns: Map<String, Int>,
    val finishedRankings: List<String>,
    val updatedAt: Long
)

private fun parseLudoState(snap: DataSnapshot): LudoState? {
    if (!snap.exists()) return null
    fun str(v: Any?): String = v?.toString() ?: ""
    val players = (snap.child("players").value as? List<*>)?.mapNotNull { m ->
        val map = m as? Map<*, *> ?: return@mapNotNull null
        LudoPlayer(str(map["uid"]), str(map["username"]), str(map["avatarUrl"]), str(map["color"]))
    } ?: emptyList()
    val pieces = (snap.child("pieces").value as? List<*>)?.mapNotNull { m ->
        val map = m as? Map<*, *> ?: return@mapNotNull null
        LudoPiece(str(map["id"]), str(map["ownerUid"]), str(map["color"]), (map["position"] as? Number)?.toInt() ?: 0)
    } ?: emptyList()
    val missed = (snap.child("missedTurns").value as? Map<*, *>)?.mapNotNull { (k, v) ->
        k?.toString()?.let { it to ((v as? Number)?.toInt() ?: 0) }
    }?.toMap() ?: emptyMap()
    val rankings = (snap.child("finishedRankings").value as? List<*>)?.map { it.toString() } ?: emptyList()
    return LudoState(
        players = players,
        pieces = pieces,
        turn = str(snap.child("turn").value),
        dice = (snap.child("dice").value as? Number)?.toInt(),
        diceRolled = snap.child("diceRolled").value as? Boolean ?: false,
        consecutiveSixes = (snap.child("consecutiveSixes").value as? Number)?.toInt() ?: 0,
        status = str(snap.child("status").value),
        mode = snap.child("mode").value?.toString(),
        isBotMode = snap.child("isBotMode").value as? Boolean ?: false,
        winner = snap.child("winner").value?.toString(),
        turnStartTime = (snap.child("turnStartTime").value as? Number)?.toLong(),
        matchStartTime = (snap.child("matchStartTime").value as? Number)?.toLong(),
        missedTurns = missed,
        finishedRankings = rankings,
        updatedAt = (snap.child("updatedAt").value as? Number)?.toLong() ?: 0L
    )
}

private fun LudoPiece.toMap(): Map<String, Any> = mapOf(
    "id" to id, "ownerUid" to ownerUid, "color" to color, "position" to position
)

// ── Pure helpers (exact port of use-ludo-engine.ts) ─────────────────────────
private fun getPieceCoords(piece: LudoPiece): Pair<Float, Float>? {
    if (piece.position == 0) {
        val idx = piece.id.split("_").getOrNull(1)?.toIntOrNull() ?: 0
        return HOME_BASE[piece.color]?.getOrNull(idx)
    }
    if (piece.position >= 58) return 7f to 7f
    if (piece.position >= 53) {
        return HOME_STRETCH[piece.color]?.getOrNull(piece.position - 53)
    }
    val startIdx = COLOR_START_INDEX[piece.color] ?: 0
    val pathIdx = (startIdx + piece.position - 1) % PATH_COORDS.size
    return PATH_COORDS[pathIdx]
}

private fun canPieceMove(piece: LudoPiece, dice: Int): Boolean {
    if (piece.position == 0 && dice != 6) return false
    if (piece.position >= 58) return false
    val dest = if (piece.position == 0) 1 else piece.position + dice
    if (dest > 58) return false
    return true
}

private fun isSafeCoord(coord: Pair<Float, Float>): Boolean =
    SAFE_COORDS.any { it.first == coord.first && it.second == coord.second }

private fun getNextTurn(gs: LudoState, currentUid: String, finished: List<String>): String {
    val idx = gs.players.indexOfFirst { it.uid == currentUid }
    if (idx == -1) return currentUid
    for (i in 1..gs.players.size) {
        val next = gs.players[(idx + i) % gs.players.size]
        if (!finished.contains(next.uid)) return next.uid
    }
    return currentUid
}

private fun buildFinalRankings(players: List<LudoPlayer>, pieces: List<LudoPiece>, winnerId: String): List<String> {
    val remaining = players
        .filter { it.uid != winnerId }
        .map { p -> p to pieces.filter { it.ownerUid == p.uid }.sumOf { it.position } }
        .sortedByDescending { it.second }
    return listOf(winnerId) + remaining.map { it.first.uid }
}

// ─────────────────────────────────────────────────────────────────────────────
// LudoGame composable
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun LudoGame(
    onClose: () -> Unit,
    roomId: String?,
    onRoundEnd: (GameRoundEndData) -> Unit,
    isMuted: Boolean = false,
    isAdmin: Boolean = false
) {
    val firestore = remember { FirebaseFirestore.getInstance() }
    val database = remember { FirebaseDatabase.getInstance() }
    val uid = remember { FirebaseAuth.getInstance().currentUser?.uid }
    val scope = rememberCoroutineScope()

    val gamePath = "games/ludo_${roomId ?: "lobby"}"

    var gameState by remember { mutableStateOf<LudoState?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isLaunching by remember { mutableStateOf(true) }
    var localLobbyMode by remember { mutableStateOf<String?>(null) }
    var countdown by remember { mutableIntStateOf(30) }
    var timeLeft by remember { mutableIntStateOf(30) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }

    val latestState by rememberUpdatedState(gameState)

    suspend fun writeUpdates(ref: DatabaseReference, map: Map<String, Any?>) {
        try { ref.updateChildren(map).await() } catch (_: Exception) {}
    }

    fun handleEngineEnd(winnerId: String?, rankings: List<String>) {
        val iWon = winnerId == uid
        val winnerName = latestState?.players?.firstOrNull { it.uid == winnerId }?.username ?: "Opponent"
        onRoundEnd(
            GameRoundEndData(
                resultText = if (iWon) "You won Ludo! \uD83C\uDFC6" else "$winnerName won!",
                resultEmoji = if (iWon) "\uD83C\uDFB2\uD83C\uDFC6" else "\uD83D\uDE22"
            )
        )
    }

    fun awardCoins(winner: String) {
        try {
            val batch = firestore.batch()
            val userRef = firestore.collection("users").document(winner)
            batch.set(
                userRef,
                mapOf<String, Any>("wallet.coins" to FieldValue.increment(5000), "updatedAt" to FieldValue.serverTimestamp()),
                SetOptions.merge()
            )
            val profileRef = firestore.collection("users").document(winner).collection("profile").document(winner)
            batch.set(
                profileRef,
                mapOf<String, Any>("wallet.coins" to FieldValue.increment(5000), "updatedAt" to FieldValue.serverTimestamp()),
                SetOptions.merge()
            )
            batch.commit()
        } catch (_: Exception) {}
    }

    // ── Firebase listener ────────────────────────────────────────────────
    LaunchedEffect(database, gamePath) {
        val ref = database.getReference(gamePath)
        val listener = object : ValueEventListener {
            override fun onDataChange(snap: DataSnapshot) {
                gameState = parseLudoState(snap)
                isLoading = false
            }
            override fun onCancelled(error: DatabaseError) {
                isLoading = false
            }
        }
        ref.addValueEventListener(listener)
        try { awaitCancellation() } finally { ref.removeEventListener(listener) }
    }

    // ── User profile ─────────────────────────────────────────────────────
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snap = firestore.collection("users").document(uid).get().await()
            if (snap.exists()) userProfile = snap.data
        } catch (_: Exception) {}
    }

    // ── joinLobby ─────────────────────────────────────────────────────────
    fun joinLobby(mode: String, isBot: Boolean) {
        val u = uid ?: return
        val gs = gameState
        val ref = database.getReference(gamePath)
        val now = System.currentTimeMillis()

        if (gs == null || gs.status == "ended") {
            val initialPieces = mutableListOf<Map<String, Any>>()
            COLOR_ORDER.forEach { color ->
                for (i in 0 until 4) {
                    initialPieces.add(
                        mapOf(
                            "id" to "${color}_$i",
                            "ownerUid" to (if (color == "red") u else if (isBot && color == "green") "bot" else ""),
                            "color" to color,
                            "position" to 0
                        )
                    )
                }
            }
            val data = mutableMapOf<String, Any?>(
                "id" to "ludo_${roomId ?: "lobby"}",
                "roomId" to (roomId ?: "lobby"),
                "players" to mutableListOf<Map<String, Any>>(
                    mapOf(
                        "uid" to u,
                        "username" to (userProfile?.get("username") as? String ?: "Player 1"),
                        "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: ""),
                        "color" to "red", "isReady" to true, "isActive" to true
                    )
                ).apply {
                    if (isBot) add(
                        mapOf(
                            "uid" to "bot", "username" to "Robot \uD83E\uDD16", "avatarUrl" to "bot",
                            "color" to "green", "isReady" to true, "isActive" to true
                        )
                    )
                },
                "pieces" to initialPieces,
                "turn" to u,
                "diceRolled" to false,
                "consecutiveSixes" to 0,
                "status" to (if (isBot) "playing" else "lobby"),
                "mode" to mode,
                "isBotMode" to isBot,
                "finishedRankings" to emptyList<Any>(),
                "updatedAt" to now
            )
            if (isBot) {
                data["matchStartTime"] = now
                data["turnStartTime"] = now
                data["missedTurns"] = mapOf(u to 0, "bot" to 0)
            }
            scope.launch {
                try { ref.setValue(data).await() } catch (_: Exception) {}
            }
        } else if (gs.status == "lobby") {
            if (gs.players.size >= 4) return
            if (gs.players.any { it.uid == u }) return
            val assignedColor = COLOR_ORDER.getOrNull(gs.players.size) ?: return
            val newPieces = gs.pieces.map { p ->
                if (p.color == assignedColor) p.copy(ownerUid = u) else p
            }.map { it.toMap() }
            val newPlayers = gs.players.map {
                mapOf(
                    "uid" to it.uid, "username" to it.username, "avatarUrl" to it.avatarUrl,
                    "color" to it.color, "isReady" to true, "isActive" to true
                )
            } + mapOf(
                "uid" to u,
                "username" to (userProfile?.get("username") as? String ?: "Player ${gs.players.size + 1}"),
                "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: ""),
                "color" to assignedColor, "isReady" to true, "isActive" to true
            )
            scope.launch {
                writeUpdates(ref, mapOf("players" to newPlayers, "pieces" to newPieces, "updatedAt" to System.currentTimeMillis()))
            }
        }
    }

    // ── startGame (host only) ─────────────────────────────────────────────
    fun startGame() {
        val gs = gameState ?: return
        if (gs.status != "lobby") return
        if (gs.players.firstOrNull()?.uid != uid) return
        val ref = database.getReference(gamePath)
        val missed = gs.players.map { it.uid to 0 }.toMap()
        scope.launch {
            writeUpdates(
                ref,
                mapOf(
                    "status" to "playing",
                    "matchStartTime" to System.currentTimeMillis(),
                    "turnStartTime" to System.currentTimeMillis(),
                    "missedTurns" to missed,
                    "updatedAt" to System.currentTimeMillis()
                )
            )
        }
    }

    // ── leaveLobby ────────────────────────────────────────────────────────
    fun leaveLobby() {
        val gs = gameState ?: return
        val u = uid ?: return
        val ref = database.getReference(gamePath)
        val isHost = gs.players.firstOrNull()?.uid == u
        scope.launch {
            if (isHost) {
                writeUpdates(ref, mapOf("status" to "ended", "winner" to "closed", "updatedAt" to System.currentTimeMillis()))
            } else {
                val newPlayers = gs.players.filter { it.uid != u }.map {
                    mapOf(
                        "uid" to it.uid, "username" to it.username, "avatarUrl" to it.avatarUrl,
                        "color" to it.color, "isReady" to true, "isActive" to true
                    )
                }
                val newPieces = gs.pieces.map { p ->
                    if (p.ownerUid == u) p.copy(ownerUid = "") else p
                }.map { it.toMap() }
                writeUpdates(ref, mapOf("players" to newPlayers, "pieces" to newPieces, "updatedAt" to System.currentTimeMillis()))
            }
        }
    }

    // ── rollDice ──────────────────────────────────────────────────────────
    fun rollDice() {
        val gs = gameState ?: return
        if (gs.status != "playing") return
        val isBotTurn = gs.turn == "bot"
        val isMyTurn = gs.turn == uid
        val isHost = gs.players.firstOrNull()?.uid == uid
        if (!isMyTurn && !(isBotTurn && isHost)) return
        if (gs.diceRolled) return

        val roll = (1..6).random()
        val prevSixes = gs.consecutiveSixes
        val newConsecutiveSixes = if (roll == 6) prevSixes + 1 else 0
        val ref = database.getReference(gamePath)
        val now = System.currentTimeMillis()

        scope.launch {
            if (newConsecutiveSixes >= 3) {
                val nextTurn = getNextTurn(gs, gs.turn, gs.finishedRankings)
                writeUpdates(
                    ref,
                    mapOf(
                        "dice" to roll, "diceRolled" to false, "consecutiveSixes" to 0,
                        "turn" to nextTurn, "turnStartTime" to now, "updatedAt" to now
                    )
                )
                return@launch
            }
            val myPieces = gs.pieces.filter { it.ownerUid == gs.turn }
            val hasMovable = myPieces.any { canPieceMove(it, roll) }

            if (!hasMovable) {
                writeUpdates(
                    ref,
                    mapOf("dice" to roll, "diceRolled" to true, "consecutiveSixes" to newConsecutiveSixes, "updatedAt" to now)
                )
                delay(1500)
                val gsCurrent = latestState ?: return@launch
                val nextTurn = getNextTurn(gsCurrent, gsCurrent.turn, gsCurrent.finishedRankings)
                writeUpdates(
                    ref,
                    mapOf(
                        "turn" to nextTurn, "dice" to null, "diceRolled" to false,
                        "consecutiveSixes" to 0, "turnStartTime" to System.currentTimeMillis(), "updatedAt" to System.currentTimeMillis()
                    )
                )
            } else {
                writeUpdates(
                    ref,
                    mapOf("dice" to roll, "diceRolled" to true, "consecutiveSixes" to newConsecutiveSixes, "updatedAt" to now)
                )
            }
        }
    }

    // ── movePiece ─────────────────────────────────────────────────────────
    fun movePiece(pieceId: String) {
        val gs = gameState ?: return
        if (gs.status != "playing" || !gs.diceRolled) return
        val isBotTurn = gs.turn == "bot"
        val isMyTurn = gs.turn == uid
        val isHost = gs.players.firstOrNull()?.uid == uid
        if (!isMyTurn && !(isBotTurn && isHost)) return
        val dice = gs.dice ?: return

        val pieceIndex = gs.pieces.indexOfFirst { it.id == pieceId }
        if (pieceIndex == -1) return
        val piece = gs.pieces[pieceIndex]
        if (piece.ownerUid != gs.turn) return
        if (!canPieceMove(piece, dice)) return

        val newPos = if (piece.position == 0) 1 else piece.position + dice
        if (newPos > 58) return

        val updatedPieces = gs.pieces.toMutableList()
        updatedPieces[pieceIndex] = piece.copy(position = newPos)

        var didCapture = false
        if (newPos in 1..52) {
            val newCoord = getPieceCoords(piece.copy(position = newPos))
            if (newCoord != null && !isSafeCoord(newCoord)) {
                for (i in updatedPieces.indices) {
                    val other = updatedPieces[i]
                    if (other.id == pieceId || other.ownerUid == gs.turn) continue
                    if (other.position in 1..52) {
                        val otherCoord = getPieceCoords(other)
                        if (otherCoord != null && otherCoord.first == newCoord.first && otherCoord.second == newCoord.second) {
                            updatedPieces[i] = other.copy(position = 0)
                            didCapture = true
                        }
                    }
                }
            }
        }

        val didReachHome = newPos == 58
        val myPieces = updatedPieces.filter { it.ownerUid == gs.turn }
        val allFinished = myPieces.all { it.position >= 58 }
        val isQuick = (gs.mode ?: "quick") == "quick"

        var isGameOver = false
        var winner: String? = null
        val newFinishedRankings = gs.finishedRankings.toMutableList()

        if (isQuick) {
            if (didReachHome) {
                isGameOver = true
                winner = gs.turn
                newFinishedRankings.clear()
                newFinishedRankings.addAll(buildFinalRankings(gs.players, updatedPieces, gs.turn))
            }
        } else {
            if (allFinished && !newFinishedRankings.contains(gs.turn)) {
                newFinishedRankings.add(gs.turn)
            }
            if (newFinishedRankings.size >= gs.players.size - 1) {
                isGameOver = true
                winner = newFinishedRankings.firstOrNull() ?: gs.turn
                val lastPlayer = gs.players.firstOrNull { !newFinishedRankings.contains(it.uid) }
                if (lastPlayer != null) newFinishedRankings.add(lastPlayer.uid)
            }
        }

        val extraTurn = dice == 6 || didCapture || didReachHome
        val newMissedTurns = gs.missedTurns + (gs.turn to 0)

        var nextTurn = gs.turn
        if (!isGameOver && !extraTurn) {
            nextTurn = getNextTurn(gs, gs.turn, newFinishedRankings)
        }

        val ref = database.getReference(gamePath)
        scope.launch {
            val updates = mutableMapOf<String, Any?>(
                "pieces" to updatedPieces.map { it.toMap() },
                "turn" to nextTurn,
                "dice" to null,
                "diceRolled" to false,
                "consecutiveSixes" to (if (extraTurn && !isGameOver) gs.consecutiveSixes else 0),
                "turnStartTime" to System.currentTimeMillis(),
                "missedTurns" to newMissedTurns,
                "finishedRankings" to newFinishedRankings,
                "updatedAt" to System.currentTimeMillis()
            )
            if (isGameOver) {
                updates["status"] = "ended"
                updates["winner"] = winner ?: ""
            }
            writeUpdates(ref, updates)

            if (isGameOver) {
                handleEngineEnd(winner, newFinishedRankings)
                if (winner != null && winner != "bot") awardCoins(winner!!)
            }
        }
    }

    // ── Bot AI (host drives) ──────────────────────────────────────────────
    LaunchedEffect(uid, gamePath) {
        while (isActive) {
            delay(1800)
            val gs = latestState ?: continue
            if (!gs.isBotMode || gs.status != "playing" || gs.turn != "bot") continue
            val isHost = gs.players.firstOrNull()?.uid == uid
            if (!isHost) continue
            val ref = database.getReference(gamePath)
            val now = System.currentTimeMillis()

            if (!gs.diceRolled) {
                val roll = (1..6).random()
                val prevSixes = gs.consecutiveSixes
                val newSixes = if (roll == 6) prevSixes + 1 else 0

                if (newSixes >= 3) {
                    val nextTurn = getNextTurn(gs, "bot", gs.finishedRankings)
                    writeUpdates(
                        ref,
                        mapOf(
                            "dice" to roll, "diceRolled" to false, "consecutiveSixes" to 0,
                            "turn" to nextTurn, "turnStartTime" to now, "updatedAt" to now
                        )
                    )
                    continue
                }

                val botPieces = gs.pieces.filter { it.ownerUid == "bot" }
                val hasMovable = botPieces.any { canPieceMove(it, roll) }

                if (!hasMovable) {
                    val nextTurn = getNextTurn(gs, "bot", gs.finishedRankings)
                    writeUpdates(
                        ref,
                        mapOf(
                            "dice" to roll, "diceRolled" to false, "consecutiveSixes" to newSixes,
                            "turn" to nextTurn, "turnStartTime" to now, "updatedAt" to now
                        )
                    )
                } else {
                    writeUpdates(
                        ref,
                        mapOf("dice" to roll, "diceRolled" to true, "consecutiveSixes" to newSixes, "updatedAt" to now)
                    )
                }
            } else if (gs.dice != null) {
                val dice = gs.dice!!
                val botPieces = gs.pieces.filter { it.ownerUid == "bot" && canPieceMove(it, dice) }
                if (botPieces.isEmpty()) continue

                var chosen = botPieces.first()

                val capturePiece = botPieces.find { p ->
                    val dest = if (p.position == 0) 1 else p.position + dice
                    if (dest < 1 || dest > 52) return@find false
                    val startIdx = COLOR_START_INDEX[p.color] ?: 0
                    val pathIdx = (startIdx + dest - 1) % PATH_COORDS.size
                    val (targetR, targetC) = PATH_COORDS[pathIdx]
                    if (isSafeCoord(targetR to targetC)) return@find false
                    gs.pieces.any { other ->
                        if (other.ownerUid == "bot" || other.position < 1 || other.position > 52) return@any false
                        val oc = getPieceCoords(other)
                        oc != null && oc.first == targetR && oc.second == targetC
                    }
                }
                if (capturePiece != null) chosen = capturePiece
                else chosen = botPieces.maxByOrNull { it.position } ?: botPieces.first()

                val newPos = if (chosen.position == 0) 1 else chosen.position + dice
                if (newPos > 58) continue

                val updatedPieces = gs.pieces.toMutableList()
                val idx = updatedPieces.indexOfFirst { it.id == chosen.id }
                if (idx == -1) continue
                updatedPieces[idx] = chosen.copy(position = newPos)

                var didCapture = false
                if (newPos in 1..52) {
                    val newCoord = getPieceCoords(chosen.copy(position = newPos))
                    if (newCoord != null && !isSafeCoord(newCoord)) {
                        for (i in updatedPieces.indices) {
                            val other = updatedPieces[i]
                            if (other.id == chosen.id || other.ownerUid == "bot") continue
                            if (other.position in 1..52) {
                                val oc = getPieceCoords(other)
                                if (oc != null && oc.first == newCoord.first && oc.second == newCoord.second) {
                                    updatedPieces[i] = other.copy(position = 0)
                                    didCapture = true
                                }
                            }
                        }
                    }
                }

                val didReachHome = newPos == 58
                val botPiecesAll = updatedPieces.filter { it.ownerUid == "bot" }
                val allFinished = botPiecesAll.all { it.position >= 58 }
                val isQuick = (gs.mode ?: "quick") == "quick"

                var isGameOver = false
                var winner: String? = null
                val newRankings = gs.finishedRankings.toMutableList()

                if (isQuick && didReachHome) {
                    isGameOver = true
                    winner = "bot"
                    newRankings.clear()
                    newRankings.addAll(buildFinalRankings(gs.players, updatedPieces, "bot"))
                } else if (!isQuick && allFinished && !newRankings.contains("bot")) {
                    newRankings.add("bot")
                    if (newRankings.size >= gs.players.size - 1) {
                        isGameOver = true
                        winner = newRankings.firstOrNull()
                        val last = gs.players.firstOrNull { !newRankings.contains(it.uid) }
                        if (last != null) newRankings.add(last.uid)
                    }
                }

                val extraTurn = dice == 6 || didCapture || didReachHome
                val nextTurn = if (!isGameOver && !extraTurn) getNextTurn(gs, "bot", newRankings) else "bot"

                val updates = mutableMapOf<String, Any?>(
                    "pieces" to updatedPieces.map { it.toMap() },
                    "turn" to (if (isGameOver) gs.turn else nextTurn),
                    "dice" to null,
                    "diceRolled" to false,
                    "consecutiveSixes" to 0,
                    "turnStartTime" to System.currentTimeMillis(),
                    "missedTurns" to (gs.missedTurns + ("bot" to 0)),
                    "finishedRankings" to newRankings,
                    "updatedAt" to System.currentTimeMillis()
                )
                if (isGameOver) {
                    updates["status"] = "ended"
                    updates["winner"] = winner ?: ""
                }
                writeUpdates(ref, updates)
                if (isGameOver) handleEngineEnd(winner, newRankings)
            }
        }
    }

    // ── Host referee: turn timeout + match limit ─────────────────────────
    LaunchedEffect(uid, gamePath) {
        while (isActive) {
            delay(2000)
            val gs = latestState ?: continue
            if (gs.status != "playing") continue
            val isHost = gs.players.firstOrNull()?.uid == uid
            if (!isHost) continue
            val ref = database.getReference(gamePath)
            val now = System.currentTimeMillis()

            val turnStart = gs.turnStartTime ?: now
            if (now - turnStart >= TURN_DURATION) {
                val activeUid = gs.turn
                val missed = (gs.missedTurns[activeUid] ?: 0) + 1
                val updatedMissed = gs.missedTurns + (activeUid to missed)

                if (missed >= 3) {
                    val other = gs.players.firstOrNull { it.uid != activeUid }
                    writeUpdates(ref, mapOf("status" to "ended", "winner" to (other?.uid ?: ""), "updatedAt" to now))
                    handleEngineEnd(other?.uid, gs.finishedRankings)
                } else {
                    val nextTurn = getNextTurn(gs, activeUid, gs.finishedRankings)
                    writeUpdates(
                        ref,
                        mapOf(
                            "turn" to nextTurn, "dice" to null, "diceRolled" to false, "consecutiveSixes" to 0,
                            "turnStartTime" to now, "missedTurns" to updatedMissed, "updatedAt" to now
                        )
                    )
                }
            }

            val matchStart = gs.matchStartTime ?: now
            if (now - matchStart >= MATCH_TIMEOUT) {
                val bestUid = gs.players.maxByOrNull { p ->
                    gs.pieces.filter { it.ownerUid == p.uid }.sumOf { it.position.toLong() }
                }?.uid ?: gs.players.firstOrNull()?.uid ?: ""
                writeUpdates(ref, mapOf("status" to "ended", "winner" to bestUid, "updatedAt" to now))
                handleEngineEnd(bestUid, gs.finishedRankings)
            }
        }
    }

    // ── resetGame ─────────────────────────────────────────────────────────
    fun resetGame() {
        scope.launch {
            try { database.getReference(gamePath).setValue(null).await() } catch (_: Exception) {}
        }
    }

    // ── Lobby countdown (auto-start by host) ──────────────────────────────
    LaunchedEffect(gameState?.status, gameState?.players?.size) {
        val gs = gameState
        if (gs?.status != "lobby" || gs.players.size < 2) {
            countdown = 30
            return@LaunchedEffect
        }
        countdown = 30
        while (countdown > 0) {
            delay(1000)
            countdown--
            if (countdown <= 0) {
                val fresh = gameState
                val isHost = fresh?.players?.firstOrNull()?.uid == uid
                if (isHost) startGame()
            }
        }
    }

    // ── Turn timer ────────────────────────────────────────────────────────
    LaunchedEffect(gameState?.turn, gameState?.turnStartTime, gameState?.status) {
        if (gameState?.status != "playing") {
            timeLeft = 30
            return@LaunchedEffect
        }
        while (true) {
            val gs = gameState ?: break
            val turnStart = gs.turnStartTime ?: System.currentTimeMillis()
            val elapsed = ((System.currentTimeMillis() - turnStart) / 1000).toInt()
            timeLeft = maxOf(0, 30 - elapsed)
            delay(500)
        }
    }

    // ── Launching / Loading Screen ────────────────────────────────────────
    if (isLaunching || isLoading) {
        LudoLaunchingScreen(isMuted = isMuted) {
            if (isLaunching) { isLaunching = false }
        }
        return
    }

    val hasJoined = gameState?.players?.any { it.uid == uid } ?: false
    val isMyTurn = gameState?.status == "playing" && gameState?.turn == uid

    // ── Mode Selection ────────────────────────────────────────────────────
    if ((gameState == null || gameState?.status == "ended") && localLobbyMode == null) {
        LudoModeSelectScreen(
            onSelect = { mode, isBot ->
                localLobbyMode = mode
                joinLobby(mode, isBot)
            }
        )
        return
    }

    // ── Lobby View ────────────────────────────────────────────────────────
    if (gameState?.status == "lobby") {
        val gs = gameState!!
        val modeLabel = if ((gs.mode ?: "quick") == "quick") "Quick Mode" else "Classic Mode"
        val canStart = gs.players.size >= 2
        LudoLobbyScreen(
            modeLabel = modeLabel,
            players = gs.players,
            hasJoined = hasJoined,
            canStart = canStart,
            isAdmin = isAdmin,
            countdown = countdown,
            onJoin = { joinLobby(gs.mode ?: "quick", false) },
            onStart = { startGame() },
            onLeave = { leaveLobby() }
        )
        return
    }

    // ── Ended Screen ──────────────────────────────────────────────────────
    if (gameState?.status == "ended") {
        val gs = gameState!!
        val rankings = gs.finishedRankings
        val sortedPlayers = gs.players.map { p ->
            val progress = gs.pieces.filter { it.ownerUid == p.uid }.sumOf { it.position }
            val rankIdx = rankings.indexOf(p.uid)
            Triple(p, progress, if (rankIdx != -1) rankIdx else 99)
        }.sortedWith(compareBy({ it.third }, { -it.second }))
        val iWon = gs.winner == uid
        LudoEndedScreen(
            sortedPlayers = sortedPlayers,
            iWon = iWon,
            winnerName = sortedPlayers.firstOrNull()?.first?.username ?: "Game Over",
            onPlayAgain = { resetGame() },
            onClose = onClose
        )
        return
    }

    // ── Main Board ────────────────────────────────────────────────────────
    val movablePieces = remember(gameState?.pieces, gameState?.dice, gameState?.diceRolled, isMyTurn) {
        if (!isMyTurn || gameState?.diceRolled != true || gameState?.dice == null) emptyList()
        else gameState!!.pieces.filter { it.ownerUid == uid && canPieceMove(it, gameState!!.dice!!) }
    }

    val piecesOnBoard = remember(gameState?.pieces) {
        gameState?.pieces?.mapNotNull { piece ->
            getPieceCoords(piece)?.let { PiecePlacement(piece, it.first, it.second) }
        } ?: emptyList()
    }

    val coordGroups = remember(piecesOnBoard) {
        piecesOnBoard.groupBy { "${it.r}_${it.c}" }
    }

    val arrowTransition = rememberInfiniteTransition(label = "ludoArrow")
    val arrowAnim by arrowTransition.animateFloat(
        -10f, 0f,
        infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "arrow"
    )

    val screenW = LocalConfiguration.current.screenWidthDp
    val boardSizeDp = min(screenW - 24, 380).toFloat().dp

    Box(Modifier.fillMaxSize().background(Color(0xFF0A1A4A))) {
        Column(Modifier.fillMaxSize()) {
            // Header
            Box(
                Modifier
                    .fillMaxWidth()
                    .padding(start = 0.dp, top = 34.dp, bottom = 8.dp)
                    .zIndex(40f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Ludo • ${(gameState?.mode ?: "quick").uppercase()}",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = (-0.5).sp,
                    fontStyle = FontStyle.Italic,
                    modifier = Modifier.offset(x = (-30).dp)
                )
            }

            // Board Area
            Box(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .offset(y = (-25).dp),
                contentAlignment = Alignment.Center
            ) {
                LudoBoard(
                    boardSizeDp = boardSizeDp,
                    gameState = gameState,
                    piecesOnBoard = piecesOnBoard,
                    coordGroups = coordGroups,
                    movablePieces = movablePieces,
                    isMyTurn = isMyTurn,
                    timeLeft = timeLeft,
                    arrowAnim = arrowAnim,
                    onMovePiece = { movePiece(it) },
                    onRollDice = { rollDice() }
                )
            }
        }
    }
}

private data class PiecePlacement(val piece: LudoPiece, val r: Float, val c: Float)

// ─────────────────────────────────────────────────────────────────────────────
// Launching screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LudoLaunchingScreen(isMuted: Boolean, onDone: () -> Unit) {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        progress.animateTo(1f, tween(5000))
        onDone()
    }
    val rot = remember { Animatable(0f) }

    Box(Modifier.fillMaxSize().background(Color(0xFF0A1A4A)), contentAlignment = Alignment.Center) {
        Image(
            painterResource(R.drawable.ludo),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            Modifier
                .fillMaxSize()
                .background(Color(0xFF0A1A4A).copy(alpha = 0.75f))
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(140.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(4.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
            ) {
                Image(painterResource(R.drawable.ludo), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
            Text(
                "LUDO",
                color = Color.White,
                fontSize = 36.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(top = 12.dp)
            )
            Spacer(Modifier.height(16.dp))
            Box(
                Modifier
                    .width(220.dp)
                    .height(8.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.15f))
            ) {
                Box(
                    Modifier
                        .fillMaxWidth(progress.value)
                        .fillMaxHeight()
                        .clip(CircleShape)
                        .background(Brush.horizontalGradient(listOf(Color(0xFFFBBF24), Color(0xFFF59E0B))))
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode selection screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LudoModeSelectScreen(onSelect: (mode: String, isBot: Boolean) -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFF1E1B4B)), contentAlignment = Alignment.Center) {
        Image(
            painterResource(R.drawable.ludo),
            contentDescription = null,
            modifier = Modifier.fillMaxSize().graphicsLayer { alpha = 0.25f },
            contentScale = ContentScale.Crop
        )
        Column(
            Modifier
                .fillMaxWidth(0.85f)
                .background(Color(0xFF7C3AED), RoundedCornerShape(24.dp))
                .border(3.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
                .shadow(10.dp, RoundedCornerShape(24.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Select Mode", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            Spacer(Modifier.height(24.dp))

            Box(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFBBF24))
                    .clickable { onSelect("quick", false) },
                contentAlignment = Alignment.Center
            ) {
                Text("QUICK", color = Color(0xFF7C3AED), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
            Spacer(Modifier.height(14.dp))

            Box(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE2E8F0))
                    .clickable { onSelect("classic", false) },
                contentAlignment = Alignment.Center
            ) {
                Text("CLASSIC", color = Color(0xFF475569), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
            Spacer(Modifier.height(14.dp))

            Box(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(CircleShape)
                    .border(1.5.dp, Color(0xFFFBBF24), CircleShape)
                    .clickable { onSelect("quick", true) },
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83E\uDD16 PLAY WITH ROBOT", color = Color(0xFFFBBF24), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lobby screen
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LudoLobbyScreen(
    modeLabel: String,
    players: List<LudoPlayer>,
    hasJoined: Boolean,
    canStart: Boolean,
    isAdmin: Boolean,
    countdown: Int,
    onJoin: () -> Unit,
    onStart: () -> Unit,
    onLeave: () -> Unit
) {
    Box(Modifier.fillMaxSize().background(Color(0xFF1E1B4B)), contentAlignment = Alignment.Center) {
        Image(
            painterResource(R.drawable.ludo),
            contentDescription = null,
            modifier = Modifier.fillMaxSize().graphicsLayer { alpha = 0.2f },
            contentScale = ContentScale.Crop
        )
        Column(
            Modifier
                .fillMaxWidth(0.9f)
                .background(Color(0xFF5B21B6), RoundedCornerShape(24.dp))
                .border(3.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(modeLabel, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(20.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                for (idx in 0 until 4) {
                    val player = players.getOrNull(idx)
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (player != null) {
                            Box(
                                Modifier
                                    .size(64.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.1f))
                                    .border(2.dp, COLOR_HEX[player.color] ?: Color.White, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                if (player.uid == "bot") {
                                    Text("\uD83E\uDD16", fontSize = 26.sp)
                                } else if (player.avatarUrl.isNotBlank()) {
                                    AsyncImage(
                                        model = CdnUtils.toCdn(player.avatarUrl),
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Text(player.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        } else {
                            Box(
                                Modifier
                                    .size(64.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.1f))
                                    .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape)
                                    .clickable(enabled = !hasJoined) { onJoin() },
                                contentAlignment = Alignment.Center
                            ) {
                                Text("＋", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(
                            player?.username ?: "Empty",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 10.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.widthIn(max = 64.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Text(
                if (!canStart) "Waiting for players to join..." else "Game starting automatically in ${countdown}s",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(24.dp))

            if (!hasJoined) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF10B981))
                        .clickable { onJoin() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("JOIN GAME", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
            } else {
                if (canStart) {
                    if (isAdmin) {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFBBF24))
                                .clickable { onStart() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text("START", color = Color(0xFF5B21B6), fontSize = 16.sp, fontWeight = FontWeight.Black)
                        }
                    } else {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .padding(vertical = 14.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.05f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Waiting for Admin to start...", color = Color.White.copy(alpha = 0.5f), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFEF4444))
                        .clickable { onLeave() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("LEAVE", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ended screen (podium)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LudoEndedScreen(
    sortedPlayers: List<Triple<LudoPlayer, Int, Int>>,
    iWon: Boolean,
    winnerName: String,
    onPlayAgain: () -> Unit,
    onClose: () -> Unit
) {
    val first = sortedPlayers.getOrNull(0)
    val second = sortedPlayers.getOrNull(1)
    val third = sortedPlayers.getOrNull(2)
    val fourth = sortedPlayers.getOrNull(3)

    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1E1B4B), Color(0xFF090D1F))))
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxSize()) {
            Spacer(Modifier.height(20.dp))
            Text(
                if (iWon) "✨ Victory! ✨" else "Match Ended",
                color = Color(0xFFFFD700),
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 3.sp
            )
            Spacer(Modifier.height(6.dp))
            Text(
                if (first != null) "${first.first.username} Won!" else "Game Over",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(Modifier.height(30.dp))

            // Podium row
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(260.dp),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.Center
            ) {
                // 2nd
                if (second != null) {
                    PodiumColumn(
                        player = second.first,
                        progress = second.second,
                        avatarSize = 56.dp,
                        borderColor = Color(0xFFCBD5E1),
                        nameWidth = 70.dp,
                        barHeight = 75.dp,
                        rank = "2",
                        rankSub = "ND",
                        rankColor = Color.White,
                        barColors = listOf(Color(0xFF94A3B8), Color(0xFF475569)),
                        modifier = Modifier.weight(1f)
                    )
                }
                // 1st
                if (first != null) {
                    PodiumColumn(
                        player = first.first,
                        progress = first.second,
                        avatarSize = 72.dp,
                        borderColor = Color(0xFFFFD700),
                        nameWidth = 85.dp,
                        barHeight = 110.dp,
                        rank = "1",
                        rankSub = "ST",
                        rankColor = Color.White,
                        barColors = listOf(Color(0xFFFBBF24), Color(0xFFB45309)),
                        modifier = Modifier.weight(1.2f),
                        isFirst = true
                    )
                }
                // 3rd
                if (third != null) {
                    PodiumColumn(
                        player = third.first,
                        progress = third.second,
                        avatarSize = 50.dp,
                        borderColor = Color(0xFFD97706),
                        nameWidth = 65.dp,
                        barHeight = 55.dp,
                        rank = "3",
                        rankSub = "RD",
                        rankColor = Color.White,
                        barColors = listOf(Color(0xFFB45309), Color(0xFF78350F)),
                        modifier = Modifier.weight(0.9f)
                    )
                }
            }

            // 4th row
            if (fourth != null) {
                Row(
                    Modifier
                        .fillMaxWidth(0.9f)
                        .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("4th", color = Color(0xFFA1A1AA), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Box(Modifier.size(32.dp).clip(CircleShape).background(Color(0xFF1E293B)), contentAlignment = Alignment.Center) {
                            if (fourth.first.uid == "bot") {
                                Text("\uD83E\uDD16", fontSize = 16.sp)
                            } else if (fourth.first.avatarUrl.isNotBlank()) {
                                AsyncImage(model = CdnUtils.toCdn(fourth.first.avatarUrl), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            } else {
                                Text(fourth.first.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(fourth.first.username, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("${fourth.second} pts", color = Color(0xFFA1A1AA), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.weight(1f))

            // Play again
            Box(
                Modifier
                    .fillMaxWidth(0.85f)
                    .height(50.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(Color(0xFFFFD700), Color(0xFFF59E0B))))
                    .clickable { onPlayAgain() },
                contentAlignment = Alignment.Center
            ) {
                Text("PLAY AGAIN", color = Color(0xFF090D1F), fontSize = 15.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
            Spacer(Modifier.height(16.dp))
            Text(
                "Back to Room",
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline,
                modifier = Modifier.clickable { onClose() }.padding(8.dp)
            )
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun PodiumColumn(
    player: LudoPlayer,
    progress: Int,
    avatarSize: Dp,
    borderColor: Color,
    nameWidth: Dp,
    barHeight: Dp,
    rank: String,
    rankSub: String,
    rankColor: Color,
    barColors: List<Color>,
    modifier: Modifier = Modifier,
    isFirst: Boolean = false
) {
    Column(
        modifier.padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (isFirst) {
            Text("\uD83D\uDC51", fontSize = 24.sp)
        }
        Box(
            Modifier
                .size(avatarSize)
                .clip(CircleShape)
                .border(if (isFirst) 4.dp else 3.dp, borderColor, CircleShape)
                .background(Color(0xFF1E293B)),
            contentAlignment = Alignment.Center
        ) {
            if (player.uid == "bot") {
                Text("\uD83E\uDD16", fontSize = (avatarSize.value * 0.45f).sp)
            } else if (player.avatarUrl.isNotBlank()) {
                AsyncImage(model = CdnUtils.toCdn(player.avatarUrl), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            } else {
                Text(player.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontWeight = FontWeight.Bold, fontSize = if (isFirst) 20.sp else 14.sp)
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(
            player.username,
            color = if (isFirst) Color(0xFFFFD700) else Color.White,
            fontSize = if (isFirst) 13.sp else 11.sp,
            fontWeight = FontWeight.Black,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(nameWidth)
        )
        Text("$progress pts", color = if (isFirst) Color(0xFFFCD34D) else Color(0xFFA1A1AA), fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .height(barHeight)
                .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
                .background(Brush.verticalGradient(barColors)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(rank, color = rankColor, fontSize = if (isFirst) 32.sp else 24.sp, fontWeight = FontWeight.Black)
                Text(rankSub, color = Color.White.copy(alpha = 0.85f), fontSize = if (isFirst) 10.sp else 9.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main board
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun LudoBoard(
    boardSizeDp: Dp,
    gameState: LudoState?,
    piecesOnBoard: List<PiecePlacement>,
    coordGroups: Map<String, List<PiecePlacement>>,
    movablePieces: List<LudoPiece>,
    isMyTurn: Boolean,
    timeLeft: Int,
    arrowAnim: Float,
    onMovePiece: (String) -> Unit,
    onRollDice: () -> Unit
) {
    val density = LocalDensity.current
    val innerPx = with(density) { (boardSizeDp - 8.dp).toPx() }
    val cellPx = innerPx / 15f

    // Wooden frame
    Box(
        Modifier
            .padding(8.dp)
            .background(Color(0xFF8B5A2B), RoundedCornerShape(28.dp))
            .border(6.dp, Color(0xFF5C3A21), RoundedCornerShape(28.dp))
            .shadow(15.dp, RoundedCornerShape(28.dp), clip = false)
    ) {
        Box(Modifier.size(boardSizeDp)) {
            // Board grid canvas (inside gold border)
            Canvas(Modifier.padding(4.dp).fillMaxSize()) {
                LudoBoardGrid(cellPx, size.width)
            }

            // Base slots
            HOME_BASE.forEach { (color, coords) ->
                coords.forEach { (r, c) ->
                    val slotSize = cellPx * 0.72f
                    val x = (c / 15f) * innerPx + cellPx / 2f - slotSize / 2f
                    val y = (r / 15f) * innerPx + cellPx / 2f - slotSize / 2f
                    val darkColor = when (color) {
                        "blue" -> Color(0x731E90FF)
                        "red" -> Color(0x73FF4757)
                        "yellow" -> Color(0x73FFA502)
                        else -> Color(0x732ED573)
                    }
                    Box(
                        Modifier
                            .offset(x = with(density) { x.toDp() }, y = with(density) { y.toDp() })
                            .size(with(density) { slotSize.toDp() })
                            .clip(CircleShape)
                            .background(darkColor)
                            .border(1.dp, Color.Black.copy(alpha = 0.12f), CircleShape)
                    )
                }
            }

            // Safe square stars
            SAFE_POSITIONS.forEach { absPos ->
                val pathIdx = (absPos - 1 + 52) % 52
                val (r, c) = PATH_COORDS[pathIdx]
                val x = (c / 15f) * innerPx + cellPx / 2f
                val y = (r / 15f) * innerPx + cellPx / 2f
                Text(
                    "\u2B50",
                    fontSize = 11.sp,
                    color = Color(0xFFFBBF24),
                    modifier = Modifier
                        .offset(x = with(density) { (x - cellPx / 2f).toDp() }, y = with(density) { (y - cellPx / 2f).toDp() })
                        .size(with(density) { cellPx.toDp() })
                        .zIndex(1f),
                    textAlign = TextAlign.Center
                )
            }

            // Center trophy circle
            val trophySize = 36.dp
            val trophyCenterX = (7.5f / 15f) * innerPx + cellPx / 2f
            val trophyCenterY = trophyCenterX
            Box(
                Modifier
                    .offset(
                        x = with(density) { (trophyCenterX - trophySize.value / 2f).dp },
                        y = with(density) { (trophyCenterY - trophySize.value / 2f).dp }
                    )
                    .size(trophySize)
                    .clip(CircleShape)
                    .background(Color(0xFF0F172A))
                    .border(2.dp, Color(0xFFFBBF24), CircleShape)
                    .zIndex(10f),
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83C\uDFC6", fontSize = 16.sp)
            }

            // Pieces
            piecesOnBoard.forEachIndexed { idx, placement ->
                val piece = placement.piece
                val isClickable = movablePieces.any { it.id == piece.id }
                val group = coordGroups["${placement.r}_${placement.c}"] ?: emptyList()
                val groupIndex = group.indexOfFirst { it.piece.id == piece.id }
                val count = group.size

                var offsetX = 0f
                var offsetY = 0f
                if (count > 1 && groupIndex != -1) {
                    val radius = cellPx * 0.22f
                    val angle = (groupIndex * 2.0 * Math.PI) / count
                    offsetX = (Math.cos(angle) * radius).toFloat()
                    offsetY = (Math.sin(angle) * radius).toFloat()
                }

                AnimatedLudoPiece(
                    piece = piece,
                    r = placement.r,
                    c = placement.c,
                    innerPx = innerPx,
                    cellPx = cellPx,
                    offsetX = offsetX,
                    offsetY = offsetY,
                    isClickable = isClickable,
                    arrowAnim = arrowAnim,
                    idx = idx,
                    onTap = { onMovePiece(piece.id) }
                )
            }

            // Corner avatars + dice button
            COLOR_ORDER.forEach { color ->
                val p = gameState?.players?.firstOrNull { it.color == color } ?: return@forEach
                val isCurrentTurn = gameState?.turn == p.uid

                val posStyle = when (color) {
                    "blue" -> Triple(0f, 0f, false)     // top-left
                    "red" -> Triple(1f, 0f, false)      // top-right
                    "yellow" -> Triple(0f, 1f, false)   // bottom-left
                    else -> Triple(1f, 1f, false)       // bottom-right
                }
                val avatarDp = 56.dp
                val avatarSizePx = with(density) { avatarDp.toPx() }
                val containerPx = with(density) { boardSizeDp.toPx() }

                val xPx = if (posStyle.first == 0f) -28f * (avatarSizePx / 56f) else containerPx - avatarSizePx + 12f * (avatarSizePx / 56f)
                val yPx = if (posStyle.second == 0f) -42f * (avatarSizePx / 56f) else containerPx - avatarSizePx + 42f * (avatarSizePx / 56f)

                Box(
                    Modifier
                        .offset(x = with(density) { xPx.toDp() }, y = with(density) { yPx.toDp() })
                        .size(avatarDp)
                        .zIndex(110f)
                ) {
                    // Username capsule badge
                    Box(
                        Modifier
                            .offset(
                                x = if (color == "blue" || color == "yellow") with(density) { 42f.dp } else with(density) { (-67f).dp },
                                y = if (color == "blue" || color == "red") with(density) { 52f.dp } else with(density) { (-20f).dp }
                            )
                            .width(85.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xE60F172A))
                            .border(1.dp, if (isCurrentTurn) Color(0xFFFFD700) else (COLOR_HEX[color] ?: Color.White), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                            .shadow(4.dp, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (isCurrentTurn) "${p.username} (${timeLeft}s)" else p.username,
                            color = if (isCurrentTurn) Color(0xFFFFD700) else Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center
                        )
                    }

                    // Circular avatar
                    Box(
                        Modifier
                            .size(avatarDp)
                            .clip(CircleShape)
                            .border(3.5.dp, COLOR_HEX[color] ?: Color.White, CircleShape)
                            .background(Color(0xFF1E293B))
                            .shadow(6.dp, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        if (p.uid == "bot") {
                            Text("\uD83E\uDD16", fontSize = 22.sp)
                        } else if (p.avatarUrl.isNotBlank()) {
                            AsyncImage(
                                model = CdnUtils.toCdn(p.avatarUrl),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Text(p.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        }
                    }

                    // Dice button (current turn only)
                    if (isCurrentTurn) {
                        DiceRollButton(
                            isMyTurn = isMyTurn,
                            diceRolled = gameState?.diceRolled == true,
                            dice = gameState?.dice,
                            offsetX = if (color == "blue" || color == "yellow") with(density) { 34f.dp } else with(density) { (-51f).dp },
                            onRollDice = onRollDice
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DiceRollButton(
    isMyTurn: Boolean,
    diceRolled: Boolean,
    dice: Int?,
    offsetX: Dp,
    onRollDice: () -> Unit
) {
    val scale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()
    Box(
        Modifier
            .offset(x = offsetX)
            .size(45.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White)
            .border(1.5.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
            .shadow(6.dp, RoundedCornerShape(10.dp))
            .graphicsLayer { scaleX = scale.value; scaleY = scale.value }
            .clickable {
                if (isMyTurn && !diceRolled) {
                    scope.launch {
                        scale.animateTo(1.2f, tween(80))
                        scale.animateTo(0.8f, tween(80))
                        scale.animateTo(1.1f, tween(80))
                        scale.animateTo(1f, tween(80))
                    }
                }
                onRollDice()
            },
        contentAlignment = Alignment.Center
    ) {
        when {
            isMyTurn && !diceRolled -> Text("ROLL", color = Color(0xFFFF4757), fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            diceRolled && dice != null -> DiceDots(value = dice, dotSize = 6.dp)
            else -> Text("\uD83C\uDFB2", fontSize = 20.sp)
        }
    }
}

@Composable
private fun DiceDots(value: Int, dotSize: Dp) {
    val active = when (value) {
        1 -> listOf(4)
        2 -> listOf(0, 8)
        3 -> listOf(0, 4, 8)
        4 -> listOf(0, 2, 6, 8)
        5 -> listOf(0, 2, 4, 6, 8)
        else -> listOf(0, 2, 3, 5, 6, 8)
    }
    Column(
        Modifier
            .fillMaxSize(0.82f)
            .padding(2.dp),
        verticalArrangement = Arrangement.SpaceEvenly,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        for (r in 0 until 3) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                for (c in 0 until 3) {
                    val idx = r * 3 + c
                    Box(Modifier.size(dotSize * 2f)) {
                        if (idx in active) {
                            Box(
                                Modifier
                                    .size(dotSize)
                                    .clip(CircleShape)
                                    .background(Color(0xFF1E293B))
                                    .align(Alignment.Center)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated piece (step-by-step movement)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun AnimatedLudoPiece(
    piece: LudoPiece,
    r: Float,
    c: Float,
    innerPx: Float,
    cellPx: Float,
    offsetX: Float,
    offsetY: Float,
    isClickable: Boolean,
    arrowAnim: Float,
    idx: Int,
    onTap: () -> Unit
) {
    val density = LocalDensity.current
    val targetX = (c / 15f) * innerPx + cellPx / 2f + offsetX
    val targetY = (r / 15f) * innerPx + cellPx / 2f + offsetY
    val target = Offset(targetX, targetY)
    val anim = remember { Animatable(Offset.Zero, Offset.VectorConverter) }
    var prevPos by remember { mutableIntStateOf(-1) }

    LaunchedEffect(piece.position, offsetX, offsetY) {
        val prev = prevPos
        if (prev == -1) {
            prevPos = piece.position
            anim.snapTo(target)
            return@LaunchedEffect
        }
        if (piece.position > prev && prev >= 0) {
            prevPos = piece.position
            val steps = mutableListOf<Offset>()
            val startStep = if (prev == 0) 1 else prev + 1
            for (p in startStep..piece.position) {
                val coord = getPieceCoords(piece.copy(position = p))
                if (coord != null) {
                    val isLast = p == piece.position
                    steps.add(
                        Offset(
                            (coord.second / 15f) * innerPx + cellPx / 2f + (if (isLast) offsetX else 0f),
                            (coord.first / 15f) * innerPx + cellPx / 2f + (if (isLast) offsetY else 0f)
                        )
                    )
                }
            }
            if (steps.isNotEmpty()) {
                steps.forEach { step -> anim.animateTo(step, tween(220)) }
            } else {
                anim.snapTo(target)
            }
        } else {
            prevPos = piece.position
            anim.snapTo(target)
        }
    }

    val isCenter = r == 7f && c == 7f
    val pieceSizePx = cellPx * (if (isCenter) 0.65f else 0.82f)
    val pieceSizeDp = with(density) { pieceSizePx.toDp() }

    Box(
        Modifier
            .offset {
                IntOffset(
                    (anim.value.x - pieceSizePx / 2f).roundToInt(),
                    (anim.value.y - pieceSizePx / 2f).roundToInt()
                )
            }
            .size(pieceSizeDp)
            .zIndex(if (isClickable) 100f else (idx + 10).toFloat())
    ) {
        if (isClickable) {
            Text(
                "\uD83D\uDC47",
                fontSize = 22.sp,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = with(density) { arrowAnim.toDp() })
                    .zIndex(120f)
            )
        }
        Box(
            Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(COLOR_HEX[piece.color] ?: Color(0xFF999999))
                .border(2.dp, if (isClickable) Color(0xFFFFD700) else Color.White, CircleShape)
                .shadow(5.dp, CircleShape)
                .clickable(enabled = isClickable) { onTap() },
            contentAlignment = Alignment.Center
        ) {
            Box(
                Modifier
                    .fillMaxSize(0.84f)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.05f))
                    .border(1.5.dp, Color.White.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    PIECE_EMOJIS[piece.color] ?: "\u26AA",
                    fontSize = with(density) { (pieceSizePx * 0.48f).toSp() }
                )
            }
        }
        if (piece.position >= 58) {
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 4.dp, y = (-4).dp)
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF22C55E))
                    .border(1.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("\u2713", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Board grid canvas (15x15 cells + homes + center)
// ─────────────────────────────────────────────────────────────────────────────
private fun androidx.compose.ui.graphics.drawscope.DrawScope.LudoBoardGrid(cellPx: Float, canvasSize: Float) {
    val bg = Color(0xFF131926)
    val gridLine = Color(0x14FFFFFF) // rgba(255,255,255,0.08)

    drawRect(bg)

    // colored path cells
    for (r in 0 until 15) {
        for (c in 0 until 15) {
            val color = when {
                r in 1..5 && c == 7 -> BOARD_COLORS["red"]
                r == 1 && c == 8 -> BOARD_COLORS["redLight"]
                r == 7 && c in 1..5 -> BOARD_COLORS["blue"]
                r == 6 && c == 1 -> BOARD_COLORS["blueLight"]
                r == 7 && c in 9..13 -> BOARD_COLORS["green"]
                r == 8 && c == 13 -> BOARD_COLORS["greenLight"]
                r in 9..13 && c == 7 -> BOARD_COLORS["yellow"]
                r == 13 && c == 6 -> BOARD_COLORS["yellowLight"]
                else -> null
            }
            if (color != null) {
                drawRect(color, topLeft = Offset(c * cellPx, r * cellPx), size = androidx.compose.ui.geometry.Size(cellPx, cellPx))
            }
        }
    }

    // gridlines
    for (i in 0..15) {
        drawLine(gridLine, Offset(i * cellPx, 0f), Offset(i * cellPx, canvasSize), strokeWidth = 0.5f)
        drawLine(gridLine, Offset(0f, i * cellPx), Offset(canvasSize, i * cellPx), strokeWidth = 0.5f)
    }

    // home quadrants
    val cornerRadius = CornerRadius(16f, 16f)
    val homeSpecs = listOf(
        Triple(0f to 0f, Color(0xFF1E3C72) to Color(0xFF2A5298), Color(0xFF1E90FF)), // blue
        Triple(0f to 9f, Color(0xFFB22222) to Color(0xFFFF4757), Color(0xFFFF4757)), // red
        Triple(9f to 9f, Color(0xFF065F46) to Color(0xFF10B981), Color(0xFF2ED573)), // green
        Triple(9f to 0f, Color(0xFFB45309) to Color(0xFFFFA502), Color(0xFFFFA502))  // yellow
    )
    homeSpecs.forEach { (origin, colors, borderColor) ->
        val (sr, sc) = origin
        val left = sc * cellPx
        val top = sr * cellPx
        val homeSize = 6f * cellPx
        val path = Path().apply {
            addRoundRect(
                androidx.compose.ui.geometry.RoundRect(
                    left = left, top = top, right = left + homeSize, bottom = top + homeSize,
                    radiusX = 16f, radiusY = 16f
                )
            )
        }
        clipPath(path) {
            drawRect(
                Brush.verticalGradient(
                    listOf(colors.first, colors.second),
                    startY = top, endY = top + homeSize
                ),
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(homeSize, homeSize)
            )
            drawRoundRect(
                Color.White.copy(alpha = 0.22f),
                topLeft = Offset(left + homeSize * 0.04f, top + homeSize * 0.04f),
                size = androidx.compose.ui.geometry.Size(homeSize * 0.92f, homeSize * 0.92f),
                cornerRadius = CornerRadius(16f, 16f),
                style = Stroke(width = 1.5f)
            )
        }
        drawRoundRect(
            borderColor,
            topLeft = Offset(left, top),
            size = androidx.compose.ui.geometry.Size(homeSize, homeSize),
            cornerRadius = cornerRadius,
            style = Stroke(width = 3f)
        )
    }

    // center 3x3
    val cx0 = 6f * cellPx
    val cy0 = 6f * cellPx
    val centerSize = 3f * cellPx
    drawRect(Color(0xFF111827), topLeft = Offset(cx0, cy0), size = androidx.compose.ui.geometry.Size(centerSize, centerSize))
    val center = Offset(cx0 + centerSize / 2f, cy0 + centerSize / 2f)

    // Red triangle (top)
    drawTriangle(center, Offset(cx0, cy0), Offset(cx0 + centerSize, cy0), BOARD_COLORS["red"] ?: Color.Red)
    // Green triangle (right)
    drawTriangle(center, Offset(cx0 + centerSize, cy0), Offset(cx0 + centerSize, cy0 + centerSize), BOARD_COLORS["green"] ?: Color.Green)
    // Yellow triangle (bottom)
    drawTriangle(center, Offset(cx0 + centerSize, cy0 + centerSize), Offset(cx0, cy0 + centerSize), BOARD_COLORS["yellow"] ?: Color.Yellow)
    // Blue triangle (left)
    drawTriangle(center, Offset(cx0, cy0 + centerSize), Offset(cx0, cy0), BOARD_COLORS["blue"] ?: Color.Blue)

    // center border
    drawRect(Color(0xFFFBBF24), topLeft = Offset(cx0, cy0), size = androidx.compose.ui.geometry.Size(centerSize, centerSize), style = Stroke(width = 2f))
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawTriangle(a: Offset, b: Offset, c: Offset, color: Color) {
    val path = Path().apply {
        moveTo(a.x, a.y)
        lineTo(b.x, b.y)
        lineTo(c.x, c.y)
        close()
    }
    drawPath(path, color)
}
