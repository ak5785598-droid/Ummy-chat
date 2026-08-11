package app.vercel.ummy_chat.twa.ui.games

import android.content.pm.ActivityInfo
import androidx.compose.animation.core.Animatable
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
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.MutableData
import com.google.firebase.database.Transaction
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Job
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.util.CdnUtils
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

// ─────────────────────────────────────────────────────────────────────────────
// CarromGame — full port of RN carrom-game.tsx + use-carrom-engine.ts +
// lib/carrom-physics.ts (exact physics parity: friction, COR, pockets).
// ─────────────────────────────────────────────────────────────────────────────

// ── Physics constants (carrom-physics.ts) ────────────────────────────────────
private const val BOARD_SIZE = 100.0
private const val FRICTION = 0.982
private const val MIN_VELOCITY = 0.08
private const val BOUNCE_DAMPING = 0.72
private const val COR = 0.83
private const val PIECE_RADIUS = 3.5
private const val STRIKER_RADIUS = 5.5
private const val POCKET_RADIUS = 9.0

private data class Vec(var x: Double, var y: Double)

private data class CarromPiece(
    val id: String,
    val type: String, // 'white' | 'black' | 'queen' | 'striker'
    val position: Vec,
    val velocity: Vec,
    var isPocketed: Boolean
)

private data class PhysicsResult(
    val pieces: List<CarromPiece>,
    val hasMovement: Boolean,
    val newlyPocketed: List<CarromPiece>
)

private val POCKETS_POS = listOf(
    Vec(4.5, 4.5), Vec(95.5, 4.5), Vec(4.5, 95.5), Vec(95.5, 95.5)
)

private fun createInitialPieces(): List<CarromPiece> {
    val pieces = mutableListOf<CarromPiece>()
    pieces.add(CarromPiece("queen", "queen", Vec(50.0, 50.0), Vec(0.0, 0.0), false))

    val innerColors = listOf("black", "white", "black", "white", "black", "white")
    for (i in 0 until 6) {
        val angle = (i * 60 * Math.PI) / 180
        pieces.add(
            CarromPiece(
                "r1-$i", innerColors[i],
                Vec(50 + cos(angle) * 8, 50 + sin(angle) * 8),
                Vec(0.0, 0.0), false
            )
        )
    }

    val outerColors = listOf(
        "black", "white", "black", "white", "black", "white",
        "black", "white", "black", "white", "black", "white"
    )
    for (i in 0 until 12) {
        val angle = (i * 30 * Math.PI) / 180
        pieces.add(
            CarromPiece(
                "r2-$i", outerColors[i],
                Vec(50 + cos(angle) * 16, 50 + sin(angle) * 16),
                Vec(0.0, 0.0), false
            )
        )
    }

    pieces.add(CarromPiece("striker", "striker", Vec(50.0, 85.0), Vec(0.0, 0.0), false))
    return pieces
}

private fun updatePhysics(pieces: List<CarromPiece>): PhysicsResult {
    var hasMovement = false
    val newPieces = pieces.map { p ->
        p.copy(position = Vec(p.position.x, p.position.y), velocity = Vec(p.velocity.x, p.velocity.y))
    }

    // 1. FRICTION FIRST, THEN POSITION UPDATE
    for (piece in newPieces) {
        if (piece.isPocketed) continue

        var vx = piece.velocity.x * FRICTION
        var vy = piece.velocity.y * FRICTION

        if (Math.abs(vx) < MIN_VELOCITY) vx = 0.0
        if (Math.abs(vy) < MIN_VELOCITY) vy = 0.0

        var nx = piece.position.x + vx
        var ny = piece.position.y + vy

        val r = if (piece.type == "striker") STRIKER_RADIUS else PIECE_RADIUS

        // 2. WALL BOUNCE
        if (nx <= r) {
            vx = Math.abs(piece.velocity.x) * BOUNCE_DAMPING
            nx = r
        } else if (nx >= BOARD_SIZE - r) {
            vx = -Math.abs(piece.velocity.x) * BOUNCE_DAMPING
            nx = BOARD_SIZE - r
        }
        if (ny <= r) {
            vy = Math.abs(piece.velocity.y) * BOUNCE_DAMPING
            ny = r
        } else if (ny >= BOARD_SIZE - r) {
            vy = -Math.abs(piece.velocity.y) * BOUNCE_DAMPING
            ny = BOARD_SIZE - r
        }

        piece.velocity.x = vx
        piece.velocity.y = vy
        piece.position.x = nx
        piece.position.y = ny

        if (vx != 0.0 || vy != 0.0) hasMovement = true
    }

    // 3. CIRCLE-CIRCLE ELASTIC COLLISION
    for (i in newPieces.indices) {
        for (j in i + 1 until newPieces.size) {
            val p1 = newPieces[i]
            val p2 = newPieces[j]
            if (p1.isPocketed || p2.isPocketed) continue

            val dx = p2.position.x - p1.position.x
            val dy = p2.position.y - p1.position.y
            val dist = sqrt(dx * dx + dy * dy)
            val r1 = if (p1.type == "striker") STRIKER_RADIUS else PIECE_RADIUS
            val r2 = if (p2.type == "striker") STRIKER_RADIUS else PIECE_RADIUS
            val minDist = r1 + r2

            if (dist < minDist && dist > 0) {
                val nx = dx / dist
                val ny = dy / dist

                val overlap = (minDist - dist) / 2
                p1.position.x -= nx * overlap
                p1.position.y -= ny * overlap
                p2.position.x += nx * overlap
                p2.position.y += ny * overlap

                val tx = -ny
                val ty = nx

                val v1n = p1.velocity.x * nx + p1.velocity.y * ny
                val v2n = p2.velocity.x * nx + p2.velocity.y * ny
                val v1t = p1.velocity.x * tx + p1.velocity.y * ty
                val v2t = p2.velocity.x * tx + p2.velocity.y * ty

                if (v1n - v2n <= 0) continue

                val m1 = if (p1.type == "striker") 1.6 else 1.0
                val m2 = if (p2.type == "striker") 1.6 else 1.0

                val v1nPrime = (v1n * (m1 - m2 * COR) + v2n * m2 * (1 + COR)) / (m1 + m2)
                val v2nPrime = (v2n * (m2 - m1 * COR) + v1n * m1 * (1 + COR)) / (m1 + m2)

                p1.velocity.x = v1nPrime * nx + v1t * tx
                p1.velocity.y = v1nPrime * ny + v1t * ty
                p2.velocity.x = v2nPrime * nx + v2t * tx
                p2.velocity.y = v2nPrime * ny + v2t * ty

                hasMovement = true
            }
        }
    }

    // 4. POCKET DETECTION
    val newlyPocketed = mutableListOf<CarromPiece>()
    for (piece in newPieces) {
        if (piece.isPocketed) continue
        val inPocket = POCKETS_POS.any { pocket ->
            val dx0 = piece.position.x - pocket.x
            val dy0 = piece.position.y - pocket.y
            sqrt(dx0 * dx0 + dy0 * dy0) < POCKET_RADIUS
        }
        if (inPocket) {
            piece.isPocketed = true
            piece.velocity.x = 0.0
            piece.velocity.y = 0.0
            newlyPocketed.add(piece.copy(position = Vec(piece.position.x, piece.position.y), velocity = Vec(0.0, 0.0)))
        }
    }

    return PhysicsResult(newPieces, hasMovement, newlyPocketed)
}

// ── Card Maker data model (parsed from RTDB) ────────────────────────────────
private data class CarromPlayer(
    val uid: String, val username: String, val avatarUrl: String,
    val score: Int, val isReady: Boolean, val coinColor: String, val queenCovered: Boolean
)

private data class CarromState(
    val players: List<CarromPlayer>,
    val turn: String,
    val strikerPos: Double,
    val pieces: List<CarromPiece>,
    val status: String,
    val mode: String,
    val entryFee: Double,
    val winner: String?,
    val prize: Double?,
    val isBotMode: Boolean,
    val turnStartTime: Long?,
    val matchStartTime: Long?,
    val missedTurns: Map<String, Int>,
    val queenPocketed: Boolean,
    val queenCoveredBy: String
)

private fun parseCarromState(snap: DataSnapshot): CarromState? {
    if (!snap.exists()) return null
    fun str(v: Any?): String = v?.toString() ?: ""
    val players = (snap.child("players").value as? List<*>)?.mapNotNull { m ->
        val map = m as? Map<*, *> ?: return@mapNotNull null
        CarromPlayer(
            str(map["uid"]), str(map["username"]), str(map["avatarUrl"]),
            (map["score"] as? Number)?.toInt() ?: 0,
            map["isReady"] as? Boolean ?: false,
            str(map["coinColor"]),
            map["queenCovered"] as? Boolean ?: false
        )
    } ?: emptyList()
    val pieces = (snap.child("pieces").value as? List<*>)?.mapNotNull { m ->
        val map = m as? Map<*, *> ?: return@mapNotNull null
        val pos = map["position"] as? Map<*, *>
        val vel = map["velocity"] as? Map<*, *>
        CarromPiece(
            str(map["id"]), str(map["type"]),
            Vec((pos?.get("x") as? Number)?.toDouble() ?: 0.0, (pos?.get("y") as? Number)?.toDouble() ?: 0.0),
            Vec((vel?.get("x") as? Number)?.toDouble() ?: 0.0, (vel?.get("y") as? Number)?.toDouble() ?: 0.0),
            map["isPocketed"] as? Boolean ?: false
        )
    } ?: emptyList()
    val missed = (snap.child("missedTurns").value as? Map<*, *>)?.mapNotNull { (k, v) ->
        k?.toString()?.let { it to ((v as? Number)?.toInt() ?: 0) }
    }?.toMap() ?: emptyMap()
    return CarromState(
        players = players,
        turn = str(snap.child("turn").value),
        strikerPos = (snap.child("strikerPos").value as? Number)?.toDouble() ?: 50.0,
        pieces = pieces,
        status = str(snap.child("status").value),
        mode = str(snap.child("mode").value),
        entryFee = (snap.child("entryFee").value as? Number)?.toDouble() ?: 0.0,
        winner = snap.child("winner").value?.toString(),
        prize = (snap.child("prize").value as? Number)?.toDouble(),
        isBotMode = snap.child("isBotMode").value as? Boolean ?: false,
        turnStartTime = (snap.child("turnStartTime").value as? Number)?.toLong(),
        matchStartTime = (snap.child("matchStartTime").value as? Number)?.toLong(),
        missedTurns = missed,
        queenPocketed = snap.child("queenPocketed").value as? Boolean ?: false,
        queenCoveredBy = str(snap.child("queenCoveredBy").value)
    )
}

private fun CarromPiece.toMap(): Map<String, Any> = mapOf(
    "id" to id, "type" to type,
    "position" to mapOf("x" to position.x, "y" to position.y),
    "velocity" to mapOf("x" to velocity.x, "y" to velocity.y),
    "isPocketed" to isPocketed
)

// ─────────────────────────────────────────────────────────────────────────────
// CarromGame composable
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CarromGame(
    onClose: () -> Unit,
    roomId: String?,
    onRoundEnd: (GameRoundEndData) -> Unit,
    isMuted: Boolean = false,
    isAdmin: Boolean = false
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val firestore = remember { FirebaseFirestore.getInstance() }
    val database = remember { FirebaseDatabase.getInstance() }
    val uid = remember { FirebaseAuth.getInstance().currentUser?.uid }
    val scope = rememberCoroutineScope()

    val gamePath = "games/carrom_${roomId ?: "lobby"}"

    var gameState by remember { mutableStateOf<CarromState?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var power by remember { mutableIntStateOf(0) }
    var angle by remember { mutableFloatStateOf(0f) }
    var isStriking by remember { mutableStateOf(false) }
    var countdown by remember { mutableIntStateOf(30) }
    var timeLeft by remember { mutableIntStateOf(30) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var initDone by remember { mutableStateOf(false) }

    val latestState by rememberUpdatedState(gameState)

    suspend fun writeUpdates(ref: DatabaseReference, map: Map<String, Any?>) {
        try { ref.updateChildren(map).await() } catch (_: Exception) {}
    }

    suspend fun writeSet(ref: DatabaseReference, map: Map<String, Any?>) {
        try { ref.setValue(map).await() } catch (_: Exception) {}
    }

    // ── Firebase listener ────────────────────────────────────────────────
    LaunchedEffect(database, gamePath) {
        val ref = database.getReference(gamePath)
        val listener = object : ValueEventListener {
            override fun onDataChange(snap: DataSnapshot) {
                gameState = parseCarromState(snap)
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

    // ── initializeGame ───────────────────────────────────────────────────
    LaunchedEffect(uid, gamePath) {
        // wait for initial load
        while (isLoading) delay(100)
        if (initDone) return@LaunchedEffect
        initDone = true
        if (uid == null || roomId == null) return@LaunchedEffect
        val gs = latestState
        if (gs == null) {
            scope.launch {
                val ref = database.getReference(gamePath)
                writeSet(
                    ref,
                    mapOf(
                        "id" to "carrom_$roomId",
                        "roomId" to roomId,
                        "players" to emptyList<Any>(),
                        "turn" to "",
                        "strikerPos" to 50.0,
                        "pieces" to emptyList<Any>(),
                        "status" to "loading",
                        "mode" to "none",
                        "entryFee" to 0.0,
                        "updatedAt" to System.currentTimeMillis()
                    )
                )
                delay(2000)
                writeUpdates(ref, mapOf("status" to "mode_select"))
            }
        }
    }

    // ── selectMode ───────────────────────────────────────────────────────
    fun selectMode(mode: String, isBot: Boolean) {
        val gs = latestState ?: return
        if (gs.status != "mode_select") return
        val ref = database.getReference(gamePath)
        val now = System.currentTimeMillis()
        scope.launch {
            if (isBot) {
                val initialPieces = createInitialPieces().map { p -> p.toMap() }
                writeUpdates(
                    ref,
                    mapOf(
                        "status" to "playing",
                        "mode" to mode,
                        "entryFee" to 0.0,
                        "isBotMode" to true,
                        "players" to listOf(
                            mapOf(
                                "uid" to (uid ?: ""),
                                "username" to (userProfile?.get("username") as? String ?: "Player 1"),
                                "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: ""),
                                "score" to 0, "isReady" to true, "coinColor" to "black", "queenCovered" to false
                            ),
                            mapOf(
                                "uid" to "bot", "username" to "Robot \uD83E\uDD16", "avatarUrl" to "bot",
                                "score" to 0, "isReady" to true, "coinColor" to "white", "queenCovered" to false
                            )
                        ),
                        "pieces" to initialPieces,
                        "turn" to (uid ?: ""),
                        "matchStartTime" to now,
                        "turnStartTime" to now,
                        "missedTurns" to mapOf((uid ?: "") to 0, "bot" to 0),
                        "queenPocketed" to false,
                        "queenCoveredBy" to "",
                        "updatedAt" to now
                    )
                )
            } else {
                writeUpdates(
                    ref,
                    mapOf("status" to "lobby", "mode" to mode, "entryFee" to 0.0, "updatedAt" to now)
                )
            }
        }
    }

    // ── joinArena ────────────────────────────────────────────────────────
    fun joinArena() {
        val gs = latestState ?: return
        val u = uid ?: return
        if (gs.status != "lobby") return
        if (gs.players.any { it.uid == u }) return
        val ref = database.getReference(gamePath)
        val playersRef = database.getReference("$gamePath/players")

        scope.launch {
            val committed = runTransactionAndWait(playersRef, object : Transaction.Handler {
                override fun doTransaction(currentData: MutableData): Transaction.Result {
                    val existing = currentData.value as? List<*> ?: emptyList<Any>()
                    val coinColor = if (existing.isEmpty()) "black" else "white"
                    val updated = buildList {
                        addAll(existing)
                        add(
                            mapOf(
                                "uid" to u,
                                "username" to (userProfile?.get("username") as? String ?: "P"),
                                "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: ""),
                                "score" to 0, "isReady" to false, "coinColor" to coinColor, "queenCovered" to false
                            )
                        )
                    }
                    currentData.value = updated
                    return Transaction.success(currentData)
                }
                override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {}
            })
            if (committed) {
                writeUpdates(ref, mapOf("updatedAt" to System.currentTimeMillis()))
            }
        }
    }

    // ── startMatch ───────────────────────────────────────────────────────
    fun startMatch() {
        val gs = latestState ?: return
        if (gs.status != "lobby" || gs.players.size < 2) return
        val ref = database.getReference(gamePath)
        val now = System.currentTimeMillis()
        val initialPieces = createInitialPieces().map { it.toMap() }
        val playersWithColors = gs.players.mapIndexed { idx, p ->
            mapOf(
                "uid" to p.uid, "username" to p.username, "avatarUrl" to p.avatarUrl,
                "score" to 0, "isReady" to true, "coinColor" to (if (idx == 0) "black" else "white"),
                "queenCovered" to false
            )
        }
        val missed = gs.players.map { it.uid to 0 }.toMap()
        scope.launch {
            writeUpdates(
                ref,
                mapOf(
                    "status" to "playing",
                    "pieces" to initialPieces,
                    "players" to playersWithColors,
                    "turn" to gs.players[0].uid,
                    "matchStartTime" to now,
                    "turnStartTime" to now,
                    "missedTurns" to missed,
                    "queenPocketed" to false,
                    "queenCoveredBy" to "",
                    "updatedAt" to now
                )
            )
        }
    }

    // ── updateStriker ────────────────────────────────────────────────────
    fun updateStriker(pos: Double) {
        val gs = latestState ?: return
        if (gs.status != "playing") return
        val isBotTurn = gs.turn == "bot"
        val isMyTurn = gs.turn == uid
        val isHost = gs.players.firstOrNull()?.uid == uid
        if (!isMyTurn && !(isBotTurn && isHost)) return
        scope.launch {
            writeUpdates(database.getReference(gamePath), mapOf("strikerPos" to pos))
        }
    }

    // ── endMatch ─────────────────────────────────────────────────────────
    fun handleEngineEnd(winnerId: String, prize: Double) {
        val iWon = winnerId == uid
        onRoundEnd(
            GameRoundEndData(
                resultText = if (iWon) "You win! \uD83E\uDE99 $prize" else "Better luck next time!",
                resultEmoji = if (iWon) "\uD83C\uDFC6" else "\uD83D\uDE22"
            )
        )
    }

    suspend fun endMatch(winnerId: String) {
        val gs = latestState ?: return
        if (gs.status != "playing") return
        try {
            val entryFee = gs.entryFee
            val totalPool = entryFee * gs.players.size
            val prize = Math.floor(totalPool * 0.9)

            if (prize > 0 && winnerId != "bot") {
                firestore.runTransaction { transaction ->
                    val winnerRef = firestore.collection("users").document(winnerId)
                    transaction.update(winnerRef, "wallet.coins", FieldValue.increment(prize))
                    val winnerProfileRef = firestore.collection("users").document(winnerId).collection("profile").document(winnerId)
                    transaction.update(winnerProfileRef, "wallet.coins", FieldValue.increment(prize))
                    null
                }.await()
            }

            writeUpdates(
                database.getReference(gamePath),
                mapOf("status" to "ended", "winner" to winnerId, "prize" to prize, "updatedAt" to System.currentTimeMillis())
            )
            handleEngineEnd(winnerId, prize)
        } catch (_: Exception) {}
    }

    // ── strike ───────────────────────────────────────────────────────────
    fun strike(angleDeg: Float, power: Double) {
        val gs = latestState ?: return
        if (gs.status != "playing") return
        val isBotTurn = gs.turn == "bot"
        val isMyTurn = gs.turn == uid
        val isHost = gs.players.firstOrNull()?.uid == uid
        if (!isMyTurn && !(isBotTurn && isHost)) return

        val pieces = gs.pieces.map { p ->
            CarromPiece(p.id, p.type, Vec(p.position.x, p.position.y), Vec(p.velocity.x, p.velocity.y), p.isPocketed)
        }
        val striker = pieces.firstOrNull { it.id == "striker" } ?: return
        striker.position.x = gs.strikerPos
        striker.position.y = 85.0
        striker.isPocketed = false

        val rad = (angleDeg - 90.0) * Math.PI / 180.0
        striker.velocity.x = cos(rad) * power
        striker.velocity.y = sin(rad) * power

        scope.launch {
            val MAX_ITER = 400
            var currentPieces = pieces
            val allPocketed = mutableListOf<CarromPiece>()
            for (i in 0 until MAX_ITER) {
                val res = updatePhysics(currentPieces)
                currentPieces = res.pieces
                if (res.newlyPocketed.isNotEmpty()) allPocketed.addAll(res.newlyPocketed)
                if (!res.hasMovement) break
            }

            val currentPlayerUid = gs.turn
            val currentPlayer = gs.players.firstOrNull { it.uid == currentPlayerUid }
            val myColor = currentPlayer?.coinColor ?: "black"

            var strikerPocketed = false
            var myCoinsIn = 0
            var opponentCoinsIn = 0
            var queenIn = false
            for (pp in allPocketed) {
                when {
                    pp.id == "striker" -> strikerPocketed = true
                    pp.type == "queen" -> queenIn = true
                    pp.type == myColor -> myCoinsIn++
                    else -> opponentCoinsIn++
                }
            }

            val updatedPlayers = gs.players.map { p ->
                if (p.uid == currentPlayerUid) {
                    p.copy(score = p.score + myCoinsIn)
                } else {
                    p.copy(score = p.score + if (strikerPocketed) 1 else 0)
                }
            }.toMutableList()

            var queenPocketed = gs.queenPocketed
            var queenCoveredBy = gs.queenCoveredBy

            if (queenIn && !queenPocketed) {
                if (myCoinsIn > 0) {
                    queenPocketed = true
                    queenCoveredBy = currentPlayerUid
                    val idx = updatedPlayers.indexOfFirst { it.uid == currentPlayerUid }
                    if (idx != -1) updatedPlayers[idx] = updatedPlayers[idx].copy(score = updatedPlayers[idx].score + 3)
                } else {
                    queenPocketed = false
                    queenCoveredBy = ""
                    val queenPiece = currentPieces.firstOrNull { it.id == "queen" }
                    if (queenPiece != null) {
                        queenPiece.isPocketed = false
                        queenPiece.position.x = 50.0
                        queenPiece.position.y = 50.0
                        queenPiece.velocity.x = 0.0
                        queenPiece.velocity.y = 0.0
                    }
                }
            } else if (queenPocketed && queenCoveredBy.isEmpty() && myCoinsIn > 0) {
                queenCoveredBy = currentPlayerUid
                val idx = updatedPlayers.indexOfFirst { it.uid == currentPlayerUid }
                if (idx != -1) updatedPlayers[idx] = updatedPlayers[idx].copy(score = updatedPlayers[idx].score + 3)
            }

            val finalPieces = currentPieces.map { p ->
                if (p.id == "striker") {
                    CarromPiece(p.id, p.type, Vec(50.0, 85.0), Vec(0.0, 0.0), false)
                } else p
            }

            val myPocketedCount = finalPieces.count { it.type == myColor && it.isPocketed }
            // hasWon: myPocketedCount >= 9 && (queen covered || queen not on board unpocketed)
            val queenUnpocketed = finalPieces.any { it.id == "queen" && !it.isPocketed }
            val hasWon = myPocketedCount >= 9 && (queenCoveredBy.isNotEmpty() || !queenUnpocketed)

            val ref = database.getReference(gamePath)
            val now = System.currentTimeMillis()

            suspend fun writeFinal() {
                writeUpdates(
                    ref,
                    mapOf(
                        "pieces" to finalPieces.map { it.toMap() },
                        "players" to updatedPlayers.map {
                            mapOf(
                                "uid" to it.uid, "username" to it.username, "avatarUrl" to it.avatarUrl,
                                "score" to it.score, "isReady" to it.isReady,
                                "coinColor" to it.coinColor, "queenCovered" to it.queenCovered
                            )
                        },
                        "queenPocketed" to queenPocketed,
                        "queenCoveredBy" to queenCoveredBy,
                        "updatedAt" to now
                    )
                )
            }

            if (hasWon) {
                writeFinal()
                endMatch(currentPlayerUid)
                return@launch
            }

            val keepTurn = myCoinsIn > 0 && !strikerPocketed
            val currentPlayerIndex = gs.players.indexOfFirst { it.uid == currentPlayerUid }
            val nextPlayerIndex = (currentPlayerIndex + 1) % gs.players.size
            val nextPlayerUid = if (keepTurn) currentPlayerUid else gs.players[nextPlayerIndex].uid

            val newMissedTurns = gs.missedTurns.toMutableMap()
            if (currentPlayerUid.isNotEmpty()) newMissedTurns[currentPlayerUid] = 0

            writeUpdates(
                ref,
                mapOf(
                    "pieces" to finalPieces.map { it.toMap() },
                    "players" to updatedPlayers.map {
                        mapOf(
                            "uid" to it.uid, "username" to it.username, "avatarUrl" to it.avatarUrl,
                            "score" to it.score, "isReady" to it.isReady,
                            "coinColor" to it.coinColor, "queenCovered" to it.queenCovered
                        )
                    },
                    "turn" to nextPlayerUid,
                    "strikerPos" to 50.0,
                    "turnStartTime" to now,
                    "missedTurns" to newMissedTurns,
                    "queenPocketed" to queenPocketed,
                    "queenCoveredBy" to queenCoveredBy,
                    "updatedAt" to now
                )
            )
        }
    }

    // ── Host referee ─────────────────────────────────────────────────────
    LaunchedEffect(uid, gamePath) {
        while (isActive) {
            delay(2000)
            val gs = latestState ?: continue
            if (gs.status != "playing") continue
            val isHost = gs.players.firstOrNull()?.uid == uid
            if (!isHost) continue
            val now = System.currentTimeMillis()

            val turnStart = gs.turnStartTime ?: now
            if (now - turnStart >= 30000) {
                val activeUid = gs.turn
                val missed = (gs.missedTurns[activeUid] ?: 0) + 1
                val updatedMissed = gs.missedTurns + (activeUid to missed)
                val ref = database.getReference(gamePath)
                if (missed >= 3) {
                    val other = gs.players.firstOrNull { it.uid != activeUid }
                    writeUpdates(ref, mapOf("status" to "ended", "winner" to (other?.uid ?: ""), "updatedAt" to now))
                    handleEngineEnd(other?.uid ?: "", 0.0)
                } else {
                    val nextIdx = (gs.players.indexOfFirst { it.uid == activeUid } + 1) % gs.players.size
                    writeUpdates(
                        ref,
                        mapOf(
                            "turn" to gs.players[nextIdx].uid, "turnStartTime" to now,
                            "missedTurns" to updatedMissed, "updatedAt" to now
                        )
                    )
                }
            }

            val matchStart = gs.matchStartTime ?: now
            if (now - matchStart >= 1200000) {
                var best = gs.players.firstOrNull()?.uid ?: ""
                var maxScore = -1
                gs.players.forEach { pp ->
                    if (pp.score > maxScore) { maxScore = pp.score; best = pp.uid }
                }
                writeUpdates(database.getReference(gamePath), mapOf("status" to "ended", "winner" to best, "updatedAt" to now))
                handleEngineEnd(best, 0.0)
            }
        }
    }

    // ── Bot AI ───────────────────────────────────────────────────────────
    LaunchedEffect(gameState?.turn, gameState?.status, uid, gamePath) {
        val gs = latestState ?: return@LaunchedEffect
        if (gs.status != "playing" || gs.turn != "bot") return@LaunchedEffect
        val isHost = gs.players.firstOrNull()?.uid == uid
        if (!isHost) return@LaunchedEffect

        delay(1500)
        val currentGs = latestState ?: return@LaunchedEffect
        if (currentGs.turn != "bot") return@LaunchedEffect

        val target = currentGs.pieces.firstOrNull { it.type == "white" && !it.isPocketed }
            ?: currentGs.pieces.firstOrNull { it.type != "striker" && !it.isPocketed }

        var botAngle = 180.0
        var botPower = 7.0
        if (target != null) {
            val strikerX = currentGs.strikerPos
            val strikerY = 15.0
            val dx = target.position.x - strikerX
            val dy = target.position.y - strikerY
            val deg = (atan2(dy, dx) * 180.0) / Math.PI + 90.0
            botAngle = deg
            val dist = sqrt(dx * dx + dy * dy)
            botPower = min(10.0, max(4.0, dist * 0.25))
        }
        val jitter = (Math.random() - 0.5) * 8.0
        strike((botAngle + jitter).toFloat(), botPower)
    }

    // ── Lobby countdown ──────────────────────────────────────────────────
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
                if (isHost) startMatch()
            }
        }
    }

    // ── Turn timer ───────────────────────────────────────────────────────
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

    // power hold job
    val powerJob = remember { mutableStateOf<Job?>(null) }
    fun startPower() {
        powerJob.value?.cancel()
        powerJob.value = scope.launch {
            var p = 0
            while (isActive) {
                p = min(100, p + 2)
                power = p
                if (p >= 100) break
                delay(25)
            }
        }
    }
    fun stopPower() {
        powerJob.value?.cancel()
    }

    // ── UI dispatch ──────────────────────────────────────────────────────
    if (isLoading || gameState == null || gameState?.status == "loading") {
        CarromLoadingScreen()
        return
    }

    if (gameState?.status == "mode_select") {
        CarromModeSelect(onSelect = { mode, isBot -> selectMode(mode, isBot) })
        return
    }

    if (gameState?.status == "lobby") {
        val gs = gameState!!
        val canStart = gs.players.size >= 2
        CarromLobbyScreen(
            players = gs.players,
            canStart = canStart,
            isAdmin = isAdmin,
            countdown = countdown,
            onJoin = { joinArena() },
            onStart = { startMatch() },
            onClose = onClose
        )
        return
    }

    if (gameState?.status == "ended") {
        val gs = gameState!!
        val won = gs.winner == uid
        val prize = gs.prize
        CarromEndedScreen(won = won, prize = prize, onClose = onClose)
        return
    }

    // ── PLAYING ──────────────────────────────────────────────────────────
    val gs = gameState!!
    val isMyTurn = gs.turn == uid

    Box(Modifier.fillMaxSize().background(Color(0xFF004D40))) {
        // Ambient glow
        Box(
            Modifier
                .align(Alignment.TopStart)
                .offset(x = 30.dp, y = 45.dp)
                .size(200.dp)
                .clip(CircleShape)
                .background(Color(0x0A00E5FF))
        )
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .offset(x = (-20).dp, y = (-80).dp)
                .size(180.dp)
                .clip(CircleShape)
                .background(Color(0x0A3B82F6))
        )

        Column(Modifier.fillMaxSize()) {
            // Header
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .zIndex(40f),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(Modifier.size(8.dp).clip(CircleShape).background(Color(0xFFEF4444)))
                Spacer(Modifier.width(6.dp))
                Text("Carrom Live", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = (-0.5).sp)
            }

            // Board
            val screenW = LocalConfiguration.current.screenWidthDp
            val screenH = LocalConfiguration.current.screenHeightDp
            val boardSizeDp = min(screenW - 80, (screenH * 0.36f).toInt()).toFloat().dp

            Box(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                CarromBoard(
                    boardSizeDp = boardSizeDp,
                    gameState = gs,
                    isMyTurn = isMyTurn,
                    isStriking = isStriking,
                    angle = angle,
                    onAngle = { angle = it },
                    onStrikerPos = { updateStriker(it) }
                )
            }

            // Controls
            Column(Modifier.padding(horizontal = 16.dp).padding(bottom = 32.dp).zIndex(40f)) {
                if (isMyTurn) {
                    // Power Bar
                    Text(
                        "POWER: ${power}%",
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(6.dp))
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(18.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.05f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                            .pointerInput(Unit) {
                                detectTapGestures(
                                    onPress = {
                                        startPower()
                                        try { awaitRelease() } finally { stopPower() }
                                    }
                                )
                            }
                    ) {
                        Box(
                            Modifier
                                .fillMaxWidth(power / 100f)
                                .fillMaxHeight()
                                .clip(CircleShape)
                                .background(if (power < 40) Color(0xFF22C55E) else if (power < 70) Color(0xFFEAB308) else Color(0xFFEF4444))
                        )
                    }
                    Spacer(Modifier.height(12.dp))

                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            gs.players.take(2).forEach { p ->
                                val isActive = gs.turn == p.uid
                                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.graphicsLayer { alpha = if (isActive) 1f else 0.4f }) {
                                    Box(
                                        Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(if (isActive) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.1f))
                                            .border(2.dp, if (isActive) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.1f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (p.uid == "bot") {
                                            Text("\uD83E\uDD16", fontSize = 20.sp)
                                        } else if (p.avatarUrl.isNotBlank()) {
                                            AsyncImage(model = CdnUtils.toCdn(p.avatarUrl), contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                                        } else {
                                            Text(p.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Text(
                                        if (p.uid == "bot") p.username else p.username + (if (isActive) " (${timeLeft}s)" else ""),
                                        color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold,
                                        maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 70.dp)
                                    )
                                    Text("${p.score}", color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }

                        // Strike button
                        val strikeScale = remember { Animatable(1f) }
                        Box(
                            Modifier
                                .clip(CircleShape)
                                .background(Color(0xFF00E5FF))
                                .clickable(enabled = !isStriking) {
                                    isStriking = true
                                    strike(angle, power / 10.0)
                                    scope.launch {
                                        delay(2000)
                                        isStriking = false
                                        power = 0
                                    }
                                }
                                .padding(horizontal = 32.dp, vertical = 16.dp)
                                .graphicsLayer {
                                    scaleX = if (isStriking) 0.95f else 1f
                                    scaleY = if (isStriking) 0.95f else 1f
                                    alpha = if (isStriking) 0.5f else 1f
                                }
                        ) {
                            Text(if (isStriking) "..." else "STRIKE", color = Color(0xFF004D40), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        }

                        // Live score indicators
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            gs.players.take(2).forEach { p ->
                                Row(
                                    Modifier
                                        .size(width = 32.dp, height = 24.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color.Black.copy(alpha = 0.4f)),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(Modifier.size(10.dp).clip(CircleShape).background(if (p.coinColor == "black") Color(0xFF2A1F18) else Color(0xFFEED6B3)).border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape))
                                    Spacer(Modifier.width(2.dp))
                                    Text("${p.score}", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                    }
                } else {
                    // Enemy aiming
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp)
                            .clip(RoundedCornerShape(32.dp))
                            .background(Color.Black.copy(alpha = 0.3f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(32.dp)),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("ENEMY IS AIMING", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            gs.players.forEach { p ->
                                val isActive = gs.turn == p.uid
                                Box(contentAlignment = Alignment.Center) {
                                    Box(
                                        Modifier
                                            .size(44.dp)
                                            .clip(CircleShape)
                                            .background(if (isActive) Color(0xFFEF4444) else Color.White.copy(alpha = 0.1f))
                                            .border(2.dp, if (isActive) Color(0xFFEF4444) else Color.White.copy(alpha = 0.1f), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (p.uid == "bot") {
                                            Text("\uD83E\uDD16", fontSize = 22.sp)
                                        } else if (p.avatarUrl.isNotBlank()) {
                                            AsyncImage(model = CdnUtils.toCdn(p.avatarUrl), contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                                        } else {
                                            Text(p.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    if (isActive) {
                                        Box(
                                            Modifier
                                                .align(Alignment.TopEnd)
                                                .offset(x = 4.dp, y = (-4).dp)
                                                .size(16.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFFEF4444)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("!", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-screens
// ─────────────────────────────────────────────────────────────────────────────
@Composable
private fun CarromLoadingScreen() {
    val progress = remember { Animatable(0f) }
    val scale = remember { Animatable(0.8f) }
    LaunchedEffect(Unit) {
        progress.animateTo(1f, tween(5000))
        scale.animateTo(1f, tween(800))
    }
    Box(Modifier.fillMaxSize().background(Color(0xFF004D40)), contentAlignment = Alignment.Center) {
        Image(painterResource(R.drawable.carrom), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(Color(0xFF004D40).copy(alpha = 0.75f)))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(140.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(4.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
                    .graphicsLayer { scaleX = scale.value; scaleY = scale.value; this.alpha = ((scale.value - 0.8f) / 0.2f).coerceIn(0f, 1f) }
            ) {
                Image(painterResource(R.drawable.carrom), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
            Text("CARROM", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp, modifier = Modifier.padding(top = 12.dp))
            Spacer(Modifier.height(10.dp))
            Box(Modifier.width(220.dp).height(8.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.15f))) {
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

@Composable
private fun CarromModeSelect(onSelect: (String, Boolean) -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFF00897B)), contentAlignment = Alignment.Center) {
        Column(
            Modifier
                .fillMaxWidth(0.7f)
                .background(Color(0xC000696C), RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("SELECT MODE", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            Spacer(Modifier.height(20.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFFB300), RoundedCornerShape(16.dp))
                    .clickable { onSelect("freestyle", false) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("FREESTYLE", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
            Spacer(Modifier.height(12.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                    .border(1.5.dp, Color(0xFFFFB300), RoundedCornerShape(16.dp))
                    .clickable { onSelect("freestyle", true) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83E\uDD16 PLAY WITH ROBOT", color = Color(0xFFFFB300), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }
    }
}

@Composable
private fun CarromLobbyScreen(
    players: List<CarromPlayer>,
    canStart: Boolean,
    isAdmin: Boolean,
    countdown: Int,
    onJoin: () -> Unit,
    onStart: () -> Unit,
    onClose: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFF006064))
            .padding(horizontal = 32.dp)
            .padding(top = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) { Text("\u2715", color = Color.White, fontSize = 16.sp, modifier = Modifier.clickable { onClose() }) }
            Text("CARROM ARENA", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.width(36.dp))
        }

        Spacer(Modifier.height(48.dp))

        Column(
            Modifier
                .fillMaxWidth(0.9f)
                .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(48.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(48.dp))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                if (!canStart) "WAITING FOR PLAYERS TO JOIN..." else "GAME STARTING AUTOMATICALLY IN ${countdown}s",
                color = Color.White.copy(alpha = 0.4f),
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(32.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                for (i in 0 until 4) {
                    val p = players.getOrNull(i)
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        if (p != null) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    Modifier
                                        .size(64.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF4D2C19))
                                        .border(4.dp, Color(0xFFFBBF24), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (p.uid == "bot") {
                                        Text("\uD83E\uDD16", fontSize = 26.sp)
                                    } else if (p.avatarUrl.isNotBlank()) {
                                        AsyncImage(model = CdnUtils.toCdn(p.avatarUrl), contentDescription = null, modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
                                    } else {
                                        Text(p.username.firstOrNull()?.uppercase() ?: "?", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Box(
                                    Modifier.offset(y = (-8).dp).clip(CircleShape).background(Color(0xFF00E676))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text("READY", color = Color.White, fontSize = 6.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        } else {
                            Box(
                                Modifier
                                    .size(64.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.05f))
                                    .border(2.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                                    .clickable { onJoin() },
                                contentAlignment = Alignment.Center
                            ) { Text("＋", color = Color.White.copy(alpha = 0.2f), fontSize = 24.sp) }
                        }
                        Text("${p?.username ?: "Open"}", color = Color.White.copy(alpha = 0.5f), fontSize = 8.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            if (canStart) {
                if (isAdmin) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFFFF6D00))
                            .clickable { onStart() }
                            .padding(vertical = 20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("START MATCH", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
                    }
                } else {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                            .padding(vertical = 14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Waiting for Admin to start...", color = Color.White.copy(alpha = 0.5f), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun CarromEndedScreen(won: Boolean, prize: Double?, onClose: () -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFF004D40)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(if (won) "\uD83C\uDFC6" else "\uD83D\uDE22", fontSize = 72.sp)
            Text(if (won) "YOU WIN!" else "GAME OVER", color = Color(0xFFFBBF24), fontSize = 32.sp, fontWeight = FontWeight.Black)
            if (prize != null && prize > 0) {
                Text("Prize: \uD83E\uDE99 $prize", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(32.dp))
            Box(
                Modifier
                    .clip(CircleShape)
                    .background(Color(0xFFFBBF24))
                    .clickable { onClose() }
                    .padding(horizontal = 40.dp, vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("BACK TO ROOM", color = Color(0xFF004D40), fontSize = 16.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Carrom Board + gestures + trajectory
// ─────────────────────────────────────────────────────────────────────────────
private data class Trajectory(
    val startX: Double, val startY: Double, val endX: Double, val endY: Double,
    val hitPieceId: String?, val hitPieceX: Double, val hitPieceY: Double,
    val pieceDirX: Double?, val pieceDirY: Double?,
    val bounceDirX: Double?, val bounceDirY: Double?
)

private fun computeTrajectory(
    pieces: List<CarromPiece>,
    localStrikerPos: Double,
    angle: Double
): Trajectory {
    val x0 = localStrikerPos
    val y0 = 85.0
    val rad = (angle - 90.0) * Math.PI / 180.0
    val vx = cos(rad)
    val vy = sin(rad)

    var closestT = Double.POSITIVE_INFINITY
    var hitPiece: CarromPiece? = null

    val collisionDist = STRIKER_RADIUS + PIECE_RADIUS

    pieces.forEach { pp ->
        if (pp.id == "striker" || pp.isPocketed) return@forEach
        val dx = pp.position.x - x0
        val dy = pp.position.y - y0
        val projection = dx * vx + dy * vy
        if (projection < 0) return@forEach
        val distSq = (dx * dx + dy * dy) - projection * projection
        val limitSq = collisionDist * collisionDist
        if (distSq <= limitSq) {
            val halfCord = sqrt(limitSq - distSq)
            val t = projection - halfCord
            if (t > 0 && t < closestT) {
                closestT = t
                hitPiece = pp
            }
        }
    }

    var wallT = Double.POSITIVE_INFINITY
    var wallNormal = Vec(0.0, 0.0)
    val minCoord = STRIKER_RADIUS
    val maxCoord = 100.0 - STRIKER_RADIUS

    if (vx > 0) { val t = (maxCoord - x0) / vx; if (t > 0 && t < wallT) { wallT = t; wallNormal = Vec(-1.0, 0.0) } }
    else if (vx < 0) { val t = (minCoord - x0) / vx; if (t > 0 && t < wallT) { wallT = t; wallNormal = Vec(1.0, 0.0) } }
    if (vy > 0) { val t = (maxCoord - y0) / vy; if (t > 0 && t < wallT) { wallT = t; wallNormal = Vec(0.0, -1.0) } }
    else if (vy < 0) { val t = (minCoord - y0) / vy; if (t > 0 && t < wallT) { wallT = t; wallNormal = Vec(0.0, 1.0) } }

    val finalT = minOf(closestT, wallT)
    val endX = x0 + (if (finalT.isInfinite()) 50.0 else finalT) * vx
    val endY = y0 + (if (finalT.isInfinite()) 50.0 else finalT) * vy

    var pieceDirX: Double? = null
    var pieceDirY: Double? = null
    var bounceDirX: Double? = null
    var bounceDirY: Double? = null

    val hitPieceSnapshot = hitPiece
    if (closestT < wallT && hitPieceSnapshot != null) {
        val dx = hitPieceSnapshot.position.x - endX
        val dy = hitPieceSnapshot.position.y - endY
        val len = sqrt(dx * dx + dy * dy)
        if (len > 0) {
            pieceDirX = dx / len
            pieceDirY = dy / len
            val nx = dx / len
            val ny = dy / len
            val dot = vx * nx + vy * ny
            var bx = vx - dot * nx
            var by = vy - dot * ny
            val bLen = sqrt(bx * bx + by * by)
            if (bLen > 0) { bx /= bLen; by /= bLen }
            bounceDirX = bx
            bounceDirY = by
        }
    } else if (wallT < Double.POSITIVE_INFINITY) {
        bounceDirX = vx * (if (wallNormal.x != 0.0) -1.0 else 1.0)
        bounceDirY = vy * (if (wallNormal.y != 0.0) -1.0 else 1.0)
    }

    return Trajectory(
        x0, y0, endX, endY,
        hitPiece?.id, hitPiece?.position?.x ?: 0.0, hitPiece?.position?.y ?: 0.0,
        pieceDirX, pieceDirY, bounceDirX, bounceDirY
    )
}

@Composable
private fun CarromBoard(
    boardSizeDp: Dp,
    gameState: CarromState,
    isMyTurn: Boolean,
    isStriking: Boolean,
    angle: Float,
    onAngle: (Float) -> Unit,
    onStrikerPos: (Double) -> Unit
) {
    val frameW = 14.dp
    val innerSizeDp = boardSizeDp - frameW * 2
    val density = androidx.compose.ui.platform.LocalDensity.current
    val innerSizePx = with(density) { innerSizeDp.toPx() }

    var localStrikerPos by remember(gameState.strikerPos) { mutableDoubleStateOf(gameState.strikerPos) }
    // keep local striker synced from backend unless we're dragging
    androidx.compose.runtime.LaunchedEffect(gameState.strikerPos) {
        localStrikerPos = gameState.strikerPos
    }

    val trajectory = remember(localStrikerPos, angle, gameState.pieces, isMyTurn, isStriking) {
        if (!isMyTurn || isStriking) null
        else computeTrajectory(gameState.pieces, localStrikerPos, angle.toDouble())
    }

    var aimStartY by remember { mutableFloatStateOf(0f) }
    var aimStartX by remember { mutableFloatStateOf(0f) }
    var strikerDragStart by remember { mutableFloatStateOf(0f) }
    var strikerDragAccum by remember { mutableFloatStateOf(0f) }

    Box(
        Modifier
            .size(boardSizeDp)
            .clip(RoundedCornerShape(24.dp))
            .border(frameW, Color(0xFF2B1B11), RoundedCornerShape(24.dp))
            .background(Color(0xFF2B1B11), RoundedCornerShape(24.dp))
            .shadow(12.dp, RoundedCornerShape(24.dp), clip = false),
        contentAlignment = Alignment.Center
    ) {
        // Aiming overlay
        if (isMyTurn && !isStriking) {
            Box(
                Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { _ ->
                                aimStartX = 0f
                                aimStartY = 0f
                            },
                            onDrag = { c, dragAmount ->
                                aimStartX += dragAmount.x
                                aimStartY += dragAmount.y
                                val newAngle = Math.toDegrees(atan2(aimStartX.toDouble(), -aimStartY.toDouble())) 
                                onAngle(((newAngle).coerceIn(-45.0, 45.0)).toFloat())
                                c.consume()
                            }
                        )
                    }
            ) {}
        }

        // Board canvas
        Canvas(
            Modifier
                .padding(frameW)
                .fillMaxSize()
        ) {
            val canvas = size.width
            val s = canvas / 1000f // svg scale

            // Wood surface
            drawCircle(
                brush = Brush.radialGradient(
                    listOf(Color(0xFFF9DFBE), Color(0xFFF0CE9E), Color(0xFFE0B784)),
                    center = center,
                    radius = canvas * 0.9f
                ),
                radius = canvas * 0.75f,
                center = center
            )

            val woodDark = Color(0x0D664422)
            val woodLine = Color(0x0A664422)

            // grain lines
            val grainY = listOf(150, 300, 450, 600, 750, 900)
            for (y in grainY) {
                val py = y * s
                val path = Path().apply {
                    moveTo(0f, py)
                    cubicTo(canvas * 0.3f, py - 10 * s, canvas * 0.7f, py + 15 * s, canvas, py)
                }
                drawPath(path, woodDark, style = Stroke(width = 1.5f * s))
            }
            val grainX = listOf(150, 300, 450, 600, 750, 900)
            for (x in grainX) {
                val px = x * s
                val path = Path().apply {
                    moveTo(px, 0f)
                    cubicTo(px - 15 * s, canvas * 0.3f, px + 10 * s, canvas * 0.7f, px, canvas)
                }
                drawPath(path, woodLine, style = Stroke(width = 1f * s))
            }

            val mahogany = Color(0xFF2D2319)

            // Bottom track
            drawRect(Color(0x0F2B1B11), topLeft = Offset(220 * s, 815 * s), size = androidx.compose.ui.geometry.Size(560 * s, 70 * s))
            drawLine(mahogany, Offset(220 * s, 815 * s), Offset(780 * s, 815 * s), strokeWidth = 3f * s)
            drawLine(mahogany, Offset(220 * s, 885 * s), Offset(780 * s, 885 * s), strokeWidth = 4f * s)
            // Top baseline
            drawRoundRect(Color(0x0F2B1B11), topLeft = Offset(220 * s, 115 * s), size = androidx.compose.ui.geometry.Size(560 * s, 70 * s))
            drawLine(mahogany, Offset(220 * s, 185 * s), Offset(780 * s, 185 * s), strokeWidth = 3f * s)
            drawLine(mahogany, Offset(220 * s, 115 * s), Offset(780 * s, 115 * s), strokeWidth = 4f * s)
            // Left baseline
            drawRoundRect(Color(0x0F2B1B11), topLeft = Offset(115 * s, 220 * s), size = androidx.compose.ui.geometry.Size(70 * s, 560 * s))
            drawLine(mahogany, Offset(185 * s, 220 * s), Offset(185 * s, 780 * s), strokeWidth = 3f * s)
            drawLine(mahogany, Offset(115 * s, 220 * s), Offset(115 * s, 780 * s), strokeWidth = 4f * s)
            // Right baseline
            drawRoundRect(Color(0x0F2B1B11), topLeft = Offset(815 * s, 220 * s), size = androidx.compose.ui.geometry.Size(70 * s, 560 * s))
            drawLine(mahogany, Offset(815 * s, 220 * s), Offset(815 * s, 780 * s), strokeWidth = 3f * s)
            drawLine(mahogany, Offset(885 * s, 220 * s), Offset(885 * s, 780 * s), strokeWidth = 4f * s)

            // Base strike circles
            val baseRed = Color(0xFFB91C1C)
            fun baseCircle(cx: Float, cy: Float) {
                drawCircle(baseRed, radius = 35 * s, center = Offset(cx * s, cy * s))
                drawCircle(mahogany, radius = 35 * s, center = Offset(cx * s, cy * s), style = Stroke(width = 2.5f * s))
            }
            baseCircle(200f, 850f); baseCircle(800f, 850f)
            baseCircle(200f, 150f); baseCircle(800f, 150f)
            baseCircle(150f, 200f); baseCircle(150f, 800f)
            baseCircle(850f, 200f); baseCircle(850f, 800f)

            // Corner loop arcs + arrowheads
            fun arc(cx: Float, cy: Float, r: Float, start: Float, sweep: Float, flipX: Int, flipY: Int) {
                val path = Path()
                path.moveTo((cx + cos(Math.toRadians(start.toDouble())).toFloat() * r) * s, (cy + sin(Math.toRadians(start.toDouble())).toFloat() * r) * s)
                val end = start + sweep
                for (deg in (start.toInt()..end.toInt()).step(5)) {
                    path.lineTo((cx + cos(Math.toRadians(deg.toDouble())).toFloat() * r) * s, (cy + sin(Math.toRadians(deg.toDouble())).toFloat() * r) * s)
                }
                drawPath(path, mahogany, style = Stroke(width = 2.5f * s))
            }
            // approximation of the 4 corner arcs
            drawCornerArc(115f, 115f, s, mahogany)
            drawCornerArc(885f, 115f, s, mahogany)
            drawCornerArc(115f, 885f, s, mahogany)
            drawCornerArc(885f, 885f, s, mahogany)

            // Diagonal corner-to-center lines
            drawLine(mahogany, Offset(110 * s, 110 * s), Offset(330 * s, 330 * s), strokeWidth = 1.5f * s)
            drawLine(mahogany, Offset(890 * s, 110 * s), Offset(670 * s, 330 * s), strokeWidth = 1.5f * s)
            drawLine(mahogany, Offset(110 * s, 890 * s), Offset(330 * s, 670 * s), strokeWidth = 1.5f * s)
            drawLine(mahogany, Offset(890 * s, 890 * s), Offset(670 * s, 670 * s), strokeWidth = 1.5f * s)

            // Center wheel ornament
            val cc = Offset(500 * s, 500 * s)
            drawCircle(mahogany, radius = 160 * s, center = cc, style = Stroke(width = 3f * s))
            drawCircle(mahogany, radius = 148 * s, center = cc, style = Stroke(width = 1f * s))
            drawCircle(mahogany, radius = 136 * s, center = cc, style = Stroke(width = 1f * s))
            drawCircle(mahogany, radius = 100 * s, center = cc, style = Stroke(width = 2f * s))
            drawCircle(mahogany, radius = 80 * s, center = cc, style = Stroke(width = 1f * s))
            drawCircle(mahogany, radius = 30 * s, center = cc, style = Stroke(width = 1.5f * s))
            drawCircle(baseRed, radius = 14 * s, center = cc)
            drawCircle(mahogany, radius = 14 * s, center = cc, style = Stroke(width = 1.5f * s))

            // 8 radiating arrows
            for (i in 0 until 8) {
                val deg = i * 45.0
                val rad = (deg * Math.PI) / 180.0
                val xStart = 500 + cos(rad) * 30
                val yStart = 500 + sin(rad) * 30
                val xEnd = 500 + cos(rad) * 136
                val yEnd = 500 + sin(rad) * 136
                val arrowLength = 12.0
                val arrowWidth = 5.0
                val xHeadL = xEnd - arrowLength * cos(rad) + arrowWidth * sin(rad)
                val yHeadL = yEnd - arrowLength * sin(rad) - arrowWidth * cos(rad)
                val xHeadR = xEnd - arrowLength * cos(rad) - arrowWidth * sin(rad)
                val yHeadR = yEnd - arrowLength * sin(rad) + arrowWidth * cos(rad)
                drawLine(mahogany, Offset((xStart * s).toFloat(), (yStart * s).toFloat()), Offset((xEnd * s).toFloat(), (yEnd * s).toFloat()), strokeWidth = 1.5f * s)
                val head = Path().apply {
                    moveTo((xEnd * s).toFloat(), (yEnd * s).toFloat())
                    lineTo((xHeadL * s).toFloat(), (yHeadL * s).toFloat())
                    lineTo((xHeadR * s).toFloat(), (yHeadR * s).toFloat())
                    close()
                }
                drawPath(head, mahogany)
            }

            // ── Game pieces (coin pieces + striker) ──────────────────────
            gameState.pieces.filter { !it.isPocketed }.forEach { piece ->
                val isStrikerPiece = piece.id == "striker"
                val pieceRadius = size.width * if (isStrikerPiece) 0.045f else 0.035f
                val xVal = when {
                    isStrikerPiece && isMyTurn && !isStriking -> localStrikerPos
                    isStrikerPiece -> gameState.strikerPos
                    else -> piece.position.x
                }
                val yVal = if (isStrikerPiece && !isStriking) 85.0 else piece.position.y
                val cx = ((xVal / 100.0) * size.width).toFloat()
                val cy = ((yVal / 100.0) * size.width).toFloat()
                val bg = when (piece.type) {
                    "black" -> Color(0xFF2A1F18)
                    "queen" -> Color(0xFFB91C1C)
                    "striker" -> Color(0xFFFAFAFA)
                    else -> Color(0xFFEED6B3)
                }
                val bd = when (piece.type) {
                    "black" -> Color(0xFF0F0906)
                    "queen" -> Color(0xFF6B0A0A)
                    "striker" -> Color(0xFFEF4444)
                    else -> Color(0xFF8C603E)
                }
                val strokeW = pieceRadius * 0.16f
                drawCircle(bg, radius = pieceRadius, center = Offset(cx, cy))
                drawCircle(bd, radius = pieceRadius, center = Offset(cx, cy), style = Stroke(width = strokeW))
                // glossy top highlight
                drawCircle(Color.White.copy(alpha = 0.15f), radius = pieceRadius * 0.55f, center = Offset(cx - pieceRadius * 0.35f, cy - pieceRadius * 0.4f))
                // inner ring
                drawCircle(
                    color = if (piece.type == "black") Color.White.copy(alpha = 0.12f) else Color.Black.copy(alpha = 0.08f),
                    radius = pieceRadius * 0.6f, center = Offset(cx, cy),
                    style = Stroke(width = strokeW * 0.7f)
                )
                if (isStrikerPiece) drawCircle(Color(0xFFEF4444), radius = pieceRadius * 0.25f, center = Offset(cx, cy))
                if (piece.type == "queen") drawCircle(Color(0xFFFBBF24), radius = pieceRadius * 0.28f, center = Offset(cx, cy))
            }
        }

        // Trajectory separate canvas overlay (viewBox 0-1000 space)
        Canvas(Modifier.padding(frameW).fillMaxSize()) {
            val qu = size.width / 1000f
            val t = trajectory ?: return@Canvas
            if (isMyTurn && !isStriking) {
                fun sx(v: Double) = (v * 10 * qu).toFloat()
                val start = Offset(sx(t.startX), sx(t.startY))
                val end = Offset(sx(t.endX), sx(t.endY))
                drawLine(
                    Color(0xFFEF4444).copy(alpha = 0.9f), start, end,
                    strokeWidth = 5f * qu,
                    pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f * qu, 8f * qu))
                )
                drawCircle(Color(0xFFEF4444).copy(alpha = 0.8f), radius = 55f * qu, center = end, style = Stroke(width = 3.5f * qu))
                drawCircle(Color(0xFFEF4444).copy(alpha = 0.9f), radius = 10f * qu, center = end)

                if (t.hitPieceId != null && t.pieceDirX != null && t.pieceDirY != null) {
                    val p = Offset(sx(t.hitPieceX), sx(t.hitPieceY))
                    val p2 = Offset(sx(t.hitPieceX + t.pieceDirX * 20.0), sx(t.hitPieceY + t.pieceDirY * 20.0))
                    drawLine(
                        Color(0xFF22C55E).copy(alpha = 0.95f), p, p2,
                        strokeWidth = 4.5f * qu,
                        pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(6f * qu, 6f * qu))
                    )
                    drawCircle(Color(0xFF22C55E), radius = 6.5f * qu, center = p2)
                }
                if (t.bounceDirX != null && t.bounceDirY != null) {
                    val b2 = Offset(sx(t.endX + t.bounceDirX * 15.0), sx(t.endY + t.bounceDirY * 15.0))
                    drawLine(
                        Color(0xFF3B82F6).copy(alpha = 0.95f), end, b2,
                        strokeWidth = 4f * qu,
                        pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(6f * qu, 6f * qu))
                    )
                    drawCircle(Color(0xFF3B82F6), radius = 6f * qu, center = b2)
                }
            }
        }

        // Pockets
        val pocketSize = 22.dp
        // simpler: place four pocket circles
        Box(Modifier.align(Alignment.TopStart).offset(x = 4.dp, y = 4.dp).size(pocketSize).clip(CircleShape).background(Color(0xFF1C1917)).border(2.dp, Color(0xFF3D2616), CircleShape), contentAlignment = Alignment.Center) {}
        Box(Modifier.align(Alignment.TopEnd).offset(x = (-4).dp, y = 4.dp).size(pocketSize).clip(CircleShape).background(Color(0xFF1C1917)).border(2.dp, Color(0xFF3D2616), CircleShape), contentAlignment = Alignment.Center) {}
        Box(Modifier.align(Alignment.BottomStart).offset(x = 4.dp, y = (-4).dp).size(pocketSize).clip(CircleShape).background(Color(0xFF1C1917)).border(2.dp, Color(0xFF3D2616), CircleShape), contentAlignment = Alignment.Center) {}
        Box(Modifier.align(Alignment.BottomEnd).offset(x = (-4).dp, y = (-4).dp).size(pocketSize).clip(CircleShape).background(Color(0xFF1C1917)).border(2.dp, Color(0xFF3D2616), CircleShape), contentAlignment = Alignment.Center) {}

        // Striker drag zone
        if (isMyTurn && !isStriking) {
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(130.dp)
                    .zIndex(100f)
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = {
                                strikerDragStart = localStrikerPos.toFloat()
                                strikerDragAccum = 0f
                            },
                            onDrag = { c, d ->
                                strikerDragAccum += d.x
                                val deltaPercent = (strikerDragAccum / innerSizePx) * 100.0
                                val newPos = (strikerDragStart + deltaPercent).toFloat().coerceIn(22f, 78f)
                                localStrikerPos = newPos.toDouble()
                                c.consume()
                            },
                            onDragEnd = {
                                onStrikerPos(localStrikerPos)
                            }
                        )
                    }
            ) {}
        }
    }
}

// helper: approximate corner-arc pocket connectors as rounded lines
private inline fun androidx.compose.ui.graphics.drawscope.DrawScope.drawCornerArc(px: Float, py: Float, s: Float, color: Color) {
    // radial bracket around pocket
    drawArc(
        color = color,
        startAngle = if (px > 500f && py < 500f) 0f else if (px > 500f) 180f else if (py > 500f) 90f else 270f,
        sweepAngle = 90f,
        useCenter = false,
        topLeft = Offset((px - 62 * s) / 1f * 1f, (py - 62 * s) / 1f * 1f + 0f),
        size = androidx.compose.ui.geometry.Size(124 * s, 124 * s),
        style = Stroke(width = 2.5f * s)
    )
}