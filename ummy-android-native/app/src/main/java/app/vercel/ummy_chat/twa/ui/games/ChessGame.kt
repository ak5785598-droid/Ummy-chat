package app.vercel.ummy_chat.twa.ui.games

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import app.vercel.ummy_chat.twa.R
import kotlin.math.abs

// ─────────────────────────────────────────────────────────────────────────────
// ChessGame — full port of RN chess-game.tsx + use-chess-engine.ts +
// lib/chess-engine.ts (exact FEN engine: castling, en-passant, promotion,
// RTDB sync on games/chess_${roomId}, host referee + bot AI).
// ─────────────────────────────────────────────────────────────────────────────

// ── Chess engine types ──────────────────────────────────────────────────────
private data class ChessPiece(val type: Char, val color: Char) // type p|r|n|b|q|k, color w|b
private data class ChessStateData(
    val board: Array<Array<ChessPiece?>>,
    val turn: Char,
    val castling: String,
    val epSquare: String,
    val halfMove: Int,
    val fullMove: Int
)

private const val INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

private val PIECE_UNICODE = mapOf(
    "wk" to "\u2654", "wq" to "\u2655", "wr" to "\u2656", "wb" to "\u2657",
    "wn" to "\u2658", "wp" to "\u2659", "bk" to "\u265A", "bq" to "\u265B",
    "br" to "\u265C", "bb" to "\u265D", "bn" to "\u265E", "bp" to "\u265F"
)

private val PIECE_VALUES = mapOf('p' to 1, 'n' to 3, 'b' to 3, 'r' to 5, 'q' to 9, 'k' to 0)

private fun pieceToUnicode(piece: ChessPiece?): String {
    if (piece == null) return ""
    return PIECE_UNICODE["${piece.color}${piece.type}"] ?: ""
}

private fun sortCapturedPieces(pieces: List<ChessPiece?>): List<ChessPiece?> {
    return pieces.filterNotNull().sortedByDescending { PIECE_VALUES[it.type] ?: 0 }
}

private fun newBoard(): Array<Array<ChessPiece?>> = Array(8) { arrayOfNulls<ChessPiece?>(8) }

private fun enemyColor(color: Char): Char = if (color == 'w') 'b' else 'w'

// ── FEN parse / encode ──────────────────────────────────────────────────────
private fun parseFen(fen: String): ChessStateData {
    val parts = fen.split(" ")
    val boardStr = parts.getOrNull(0) ?: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
    val turn = parts.getOrNull(1)?.firstOrNull() ?: 'w'
    val castling = parts.getOrNull(2) ?: "KQkq"
    val epSquare = parts.getOrNull(3) ?: "-"
    val halfMove = parts.getOrNull(4)?.toIntOrNull() ?: 0
    val fullMove = parts.getOrNull(5)?.toIntOrNull() ?: 1

    val board = newBoard()
    val rows = boardStr.split("/")
    for (r in 0 until 8) {
        var c = 0
        for (ch in rows.getOrElse(r) { "" }) {
            if (ch in '1'..'8') {
                c += ch - '0'
            } else {
                val color = if (ch.isUpperCase()) 'w' else 'b'
                board[r][c] = ChessPiece(ch.lowercaseChar(), color)
                c++
            }
        }
    }
    return ChessStateData(board, turn, castling, epSquare, halfMove, fullMove)
}

private fun stateToFen(state: ChessStateData): String {
    val rows = mutableListOf<String>()
    for (r in 0 until 8) {
        var empty = 0
        var row = ""
        for (c in 0 until 8) {
            val p = state.board[r][c]
            if (p == null) { empty++; continue }
            if (empty > 0) { row += empty; empty = 0 }
            val ch = p.type.uppercaseChar()
            row += if (p.color == 'w') ch else ch.lowercaseChar()
        }
        if (empty > 0) row += empty
        rows.add(row)
    }
    return "${rows.joinToString("/")} ${state.turn} ${state.castling} ${state.epSquare} ${state.halfMove} ${state.fullMove}"
}

private fun getInitialBoard(): Array<Array<ChessPiece?>> = parseFen(INITIAL_FEN).board

// ── Coordinate helpers ──────────────────────────────────────────────────────
private fun rcToCoord(r: Int, c: Int): String = "${'a' + c}${8 - r}"

private fun coordToRc(coord: String): Pair<Int, Int> {
    if (coord.length < 2) return 0 to 0
    val c = coord[0] - 'a'
    val r = 8 - (coord.substring(1).toIntOrNull() ?: 1)
    return r to c
}

private fun inBounds(r: Int, c: Int): Boolean = r in 0..7 && c in 0..7
private fun isAlly(a: ChessPiece?, b: ChessPiece?): Boolean = a != null && b != null && a.color == b.color

// ── Attack / check detection ────────────────────────────────────────────────
private fun findKing(board: Array<Array<ChessPiece?>>, color: Char): Pair<Int, Int> {
    for (r in 0 until 8)
        for (c in 0 until 8)
            if (board[r][c]?.type == 'k' && board[r][c]?.color == color) return r to c
    return -1 to -1
}

private fun isAttackedBy(board: Array<Array<ChessPiece?>>, r: Int, c: Int, attackerColor: Char): Boolean {
    val pawnDir = if (attackerColor == 'w') 1 else -1
    for (dc in listOf(-1, 1)) {
        val pr = r + pawnDir; val pc = c + dc
        if (inBounds(pr, pc) && board[pr][pc]?.type == 'p' && board[pr][pc]?.color == attackerColor) return true
    }
    val knightDeltas = listOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
    for ((dr, dc) in knightDeltas) {
        val nr = r + dr; val nc = c + dc
        if (inBounds(nr, nc) && board[nr][nc]?.type == 'n' && board[nr][nc]?.color == attackerColor) return true
    }
    for (dr in -1..1) for (dc in -1..1) {
        if (dr == 0 && dc == 0) continue
        val nr = r + dr; val nc = c + dc
        if (inBounds(nr, nc) && board[nr][nc]?.type == 'k' && board[nr][nc]?.color == attackerColor) return true
    }
    for ((dr, dc) in listOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1)) {
        var i = 1
        while (i < 8) {
            val nr = r + dr * i; val nc = c + dc * i
            if (!inBounds(nr, nc)) break
            val p = board[nr][nc]
            if (p != null) {
                if (p.color == attackerColor && (p.type == 'b' || p.type == 'q')) return true
                break
            }
            i++
        }
    }
    for ((dr, dc) in listOf(-1 to 0, 1 to 0, 0 to -1, 0 to 1)) {
        var i = 1
        while (i < 8) {
            val nr = r + dr * i; val nc = c + dc * i
            if (!inBounds(nr, nc)) break
            val p = board[nr][nc]
            if (p != null) {
                if (p.color == attackerColor && (p.type == 'r' || p.type == 'q')) return true
                break
            }
            i++
        }
    }
    return false
}

private fun isInCheck(board: Array<Array<ChessPiece?>>, color: Char): Boolean {
    val (kr, kc) = findKing(board, color)
    if (kr == -1) return false
    return isAttackedBy(board, kr, kc, enemyColor(color))
}

// ── Move generation ─────────────────────────────────────────────────────────
private fun rawMoves(state: ChessStateData, r: Int, c: Int): List<Pair<Int, Int>> {
    val board = state.board
    val piece = board[r][c] ?: return emptyList()
    val moves = mutableListOf<Pair<Int, Int>>()
    val type = piece.type
    val color = piece.color
    val enemy = enemyColor(color)

    fun canGo(nr: Int, nc: Int): Boolean = inBounds(nr, nc) && !isAlly(piece, board[nr][nc])

    fun slide(dr: Int, dc: Int) {
        var i = 1
        while (i < 8) {
            val nr = r + dr * i; val nc = c + dc * i
            if (!inBounds(nr, nc)) break
            moves.add(nr to nc)
            if (board[nr][nc] != null) break
            i++
        }
    }

    if (type == 'p') {
        val dir = if (color == 'w') -1 else 1
        val startRow = if (color == 'w') 6 else 1
        val fr = r + dir
        if (inBounds(fr, c) && board[fr][c] == null) {
            moves.add(fr to c)
            if (r == startRow && inBounds(fr + dir, c) && board[fr + dir][c] == null) {
                moves.add(fr + dir to c)
            }
        }
        for (dc2 in listOf(-1, 1)) {
            val nr = r + dir; val nc = c + dc2
            if (!inBounds(nr, nc)) continue
            if (board[nr][nc]?.color == enemy) moves.add(nr to nc)
            if (state.epSquare != "-" && state.epSquare.isNotEmpty()) {
                val (epr, epc) = coordToRc(state.epSquare)
                if (nr == epr && nc == epc) moves.add(nr to nc)
            }
        }
    }

    if (type == 'n') {
        val knightDeltas = listOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
        for ((dr, dc) in knightDeltas) if (canGo(r + dr, c + dc)) moves.add(r + dr to c + dc)
    }

    if (type == 'b' || type == 'q') {
        slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1)
    }
    if (type == 'r' || type == 'q') {
        slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1)
    }

    if (type == 'k') {
        for (dr in -1..1) for (dc in -1..1) {
            if (dr != 0 || dc != 0) if (canGo(r + dr, c + dc)) moves.add(r + dr to c + dc)
        }
        val backRank = if (color == 'w') 7 else 0
        if (r == backRank && c == 4) {
            val ksRight = if (color == 'w') 'K' else 'k'
            if (state.castling.contains(ksRight)) {
                if (board[backRank][5] == null && board[backRank][6] == null &&
                    board[backRank][7]?.type == 'r' &&
                    !isAttackedBy(board, backRank, 4, enemy) &&
                    !isAttackedBy(board, backRank, 5, enemy) &&
                    !isAttackedBy(board, backRank, 6, enemy)) {
                    moves.add(backRank to 6)
                }
            }
            val qsRight = if (color == 'w') 'Q' else 'q'
            if (state.castling.contains(qsRight)) {
                if (board[backRank][3] == null && board[backRank][2] == null && board[backRank][1] == null &&
                    board[backRank][0]?.type == 'r' &&
                    !isAttackedBy(board, backRank, 4, enemy) &&
                    !isAttackedBy(board, backRank, 3, enemy) &&
                    !isAttackedBy(board, backRank, 2, enemy)) {
                    moves.add(backRank to 2)
                }
            }
        }
    }
    return moves
}

private fun isMoveLegal(state: ChessStateData, fromR: Int, fromC: Int, toR: Int, toC: Int): Boolean {
    val newBoard: Array<Array<ChessPiece?>> = state.board.map { it.copyOf() }.toTypedArray()
    val piece = newBoard[fromR][fromC]

    if (piece?.type == 'p' && state.epSquare != "-" && state.epSquare.isNotEmpty()) {
        val (epr, epc) = coordToRc(state.epSquare)
        if (toR == epr && toC == epc) {
            val capDir = if (piece.color == 'w') 1 else -1
            val pr = epr + capDir
            if (pr in 0..7) newBoard[pr][epc] = null
        }
    }

    if (piece?.type == 'k') {
        val dc = toC - fromC
        if (abs(dc) == 2) {
            val backRank = fromR
            if (dc > 0) {
                newBoard[backRank][5] = newBoard[backRank][7]
                newBoard[backRank][7] = null
            } else {
                newBoard[backRank][3] = newBoard[backRank][0]
                newBoard[backRank][0] = null
            }
        }
    }

    newBoard[toR][toC] = piece
    newBoard[fromR][fromC] = null

    return piece != null && !isInCheck(newBoard, piece.color)
}

private fun legalMoves(state: ChessStateData, r: Int, c: Int): List<Pair<Int, Int>> {
    val piece = state.board[r][c] ?: return emptyList()
    val raw = rawMoves(state, r, c)
    return raw.filter { (tr, tc) -> isMoveLegal(state, r, c, tr, tc) }
}

private fun applyMove(state: ChessStateData, fromR: Int, fromC: Int, toR: Int, toC: Int, promoteTo: Char = 'q'): ChessStateData? {
    if (!isMoveLegal(state, fromR, fromC, toR, toC)) return null
    val newBoard: Array<Array<ChessPiece?>> = state.board.map { it.copyOf() }.toTypedArray()
    val piece = newBoard[fromR][fromC]!!
    var newEpSquare = "-"
    var newCastling = state.castling
    var newHalfMove = state.halfMove + 1

    if (piece.type == 'p' && state.epSquare != "-" && state.epSquare.isNotEmpty()) {
        val (epr, epc) = coordToRc(state.epSquare)
        if (toR == epr && toC == epc) {
            val capDir = if (piece.color == 'w') 1 else -1
            val pr = epr + capDir
            if (pr in 0..7) newBoard[pr][epc] = null
        }
    }

    if (piece.type == 'p' && abs(toR - fromR) == 2) {
        val epR = (fromR + toR) / 2
        newEpSquare = rcToCoord(epR, fromC)
    }

    if (piece.type == 'k') {
        val dc = toC - fromC
        if (abs(dc) == 2) {
            val backRank = fromR
            if (dc > 0) {
                newBoard[backRank][5] = newBoard[backRank][7]
                newBoard[backRank][7] = null
            } else {
                newBoard[backRank][3] = newBoard[backRank][0]
                newBoard[backRank][0] = null
            }
        }
        newCastling = newCastling.replace(if (piece.color == 'w') "K" else "k", "")
            .replace(if (piece.color == 'w') "Q" else "q", "")
    }

    if (piece.type == 'r') {
        val backRank = if (piece.color == 'w') 7 else 0
        if (fromR == backRank && fromC == 7)
            newCastling = newCastling.replace(if (piece.color == 'w') "K" else "k", "")
        if (fromR == backRank && fromC == 0)
            newCastling = newCastling.replace(if (piece.color == 'w') "Q" else "q", "")
    }

    val captured = state.board[toR][toC]
    if (captured?.type == 'r') {
        val oppBackRank = if (captured.color == 'w') 7 else 0
        if (toR == oppBackRank && toC == 7)
            newCastling = newCastling.replace(if (captured.color == 'w') "K" else "k", "")
        if (toR == oppBackRank && toC == 0)
            newCastling = newCastling.replace(if (captured.color == 'w') "Q" else "q", "")
    }

    if (piece.type == 'p' || captured != null) newHalfMove = 0

    newBoard[toR][toC] = piece
    newBoard[fromR][fromC] = null

    if (piece.type == 'p' && (toR == 0 || toR == 7)) {
        newBoard[toR][toC] = ChessPiece(promoteTo, piece.color)
    }

    val nextTurn: Char = if (state.turn == 'w') 'b' else 'w'
    return ChessStateData(
        board = newBoard,
        turn = nextTurn,
        castling = newCastling.ifEmpty { "-" },
        epSquare = newEpSquare,
        halfMove = newHalfMove,
        fullMove = if (state.turn == 'b') state.fullMove + 1 else state.fullMove
    )
}

private fun getGameStatus(state: ChessStateData): String {
    fun hasLegal(): Boolean {
        for (r in 0 until 8) for (c in 0 until 8) {
            if (state.board[r][c]?.color == state.turn && legalMoves(state, r, c).isNotEmpty()) return true
        }
        return false
    }
    if (!hasLegal()) {
        return if (isInCheck(state.board, state.turn)) "checkmate" else "stalemate"
    }
    return "playing"
}

// ── RTDB data model ─────────────────────────────────────────────────────────
private data class ChessPlayer(val uid: String, val username: String, val avatarUrl: String)

private data class ChessGameState(
    val white: ChessPlayer?,
    val black: ChessPlayer?,
    val turn: String,
    val fen: String,
    val status: String,
    val winner: String?,
    val isBot: Boolean,
    val turnStartTime: Long?,
    val matchStartTime: Long?,
    val missedTurns: Map<String, Int>
)

private fun parseChessGameState(snap: DataSnapshot): ChessGameState? {
    if (!snap.exists()) return null
    fun str(v: Any?): String = v?.toString() ?: ""
    fun parsePlayer(child: String): ChessPlayer? {
        val m = snap.child(child).value as? Map<*, *> ?: return null
        return ChessPlayer(str(m["uid"]), str(m["username"]), str(m["avatarUrl"]))
    }
    val missed = (snap.child("missedTurns").value as? Map<*, *>)?.mapNotNull { (k, v) ->
        k?.toString()?.let { it to ((v as? Number)?.toInt() ?: 0) }
    }?.toMap() ?: emptyMap()
    return ChessGameState(
        white = parsePlayer("white"),
        black = parsePlayer("black"),
        turn = str(snap.child("turn").value),
        fen = str(snap.child("fen").value),
        status = str(snap.child("status").value),
        winner = snap.child("winner").value?.toString(),
        isBot = snap.child("isBotMode").value as? Boolean ?: false,
        turnStartTime = (snap.child("turnStartTime").value as? Number)?.toLong(),
        matchStartTime = (snap.child("matchStartTime").value as? Number)?.toLong(),
        missedTurns = missed
    )
}

private fun ChessPlayer.toMap(): Map<String, Any> = mapOf(
    "uid" to uid, "username" to username, "avatarUrl" to avatarUrl
)

// ─────────────────────────────────────────────────────────────────────────────
// ChessGame composable
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun ChessGame(
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

    val gamePath = "games/chess_${roomId ?: "lobby"}"

    var gameState by remember { mutableStateOf<ChessGameState?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var userProfile by remember { mutableStateOf<Map<String, Any?>?>(null) }
    var isLaunching by remember { mutableStateOf(true) }
    var localLobbyMode by remember { mutableStateOf<String?>(null) }
    var countdown by remember { mutableIntStateOf(30) }
    var timeLeft by remember { mutableIntStateOf(30) }

    var selectedSquare by remember { mutableStateOf<String?>(null) }
    var lastMove by remember { mutableStateOf<Pair<String, String>?>(null) }
    var capturedByWhite by remember { mutableStateOf<List<ChessPiece?>>(emptyList()) }
    var capturedByBlack by remember { mutableStateOf<List<ChessPiece?>>(emptyList()) }
    var promotionPending by remember { mutableStateOf<Pair<Pair<Int, Int>, Pair<Int, Int>>?>(null) }

    val latestState by rememberUpdatedState(gameState)

    suspend fun writeUpdates(ref: DatabaseReference, map: Map<String, Any?>) {
        try { ref.updateChildren(map).await() } catch (_: Exception) {}
    }
    suspend fun writeSet(ref: DatabaseReference, map: Map<String, Any?>) {
        try { ref.setValue(map).await() } catch (_: Exception) {}
    }

    // ── Loading timer (RN 5s launch screen) ────────────────────────────────
    LaunchedEffect(Unit) {
        delay(5000)
        isLaunching = false
    }

    // ── Firebase RTDB listener + unmount cleanup ───────────────────────────
    LaunchedEffect(database, gamePath) {
        val ref = database.getReference(gamePath)
        val listener = object : ValueEventListener {
            override fun onDataChange(snap: DataSnapshot) {
                gameState = parseChessGameState(snap)
                isLoading = false
            }
            override fun onCancelled(error: DatabaseError) {
                isLoading = false
            }
        }
        ref.addValueEventListener(listener)
        try { awaitCancellation() } finally {
            ref.removeEventListener(listener)
            val gs = latestState
            if (gs?.status == "playing" || gs?.status == "lobby") {
                scope.launch { writeUpdates(ref, mapOf("status" to "ended", "updatedAt" to System.currentTimeMillis())) }
            }
        }
    }

    // ── user profile ───────────────────────────────────────────────────────
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        try {
            val snap = firestore.collection("users").document(uid).get().await()
            if (snap.exists()) userProfile = snap.data
        } catch (_: Exception) {}
    }

    // ── startMatch (fresh game or join as black) ───────────────────────────
    fun startMatch(isbot: Boolean) {
        val u = uid ?: return
        if (roomId == null) return
        val ref = database.getReference(gamePath)
        val gs = latestState
        val terminal = gs == null || gs.status in listOf("checkmate", "stalemate", "draw", "resigned", "ended")
        val now = System.currentTimeMillis()
        scope.launch {
            if (terminal) {
                val writeMap = linkedMapOf<String, Any?>(
                    "id" to "chess_$roomId",
                    "roomId" to roomId,
                    "white" to mapOf(
                        "uid" to u,
                        "username" to (userProfile?.get("username") as? String ?: "White"),
                        "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: "")
                    ),
                    "turn" to "w",
                    "fen" to INITIAL_FEN,
                    "status" to (if (isbot) "playing" else "lobby"),
                    "isBotMode" to isbot,
                    "matchStartTime" to (if (isbot) now else null),
                    "turnStartTime" to (if (isbot) now else null),
                    "updatedAt" to now
                )
                writeMap["black"] = if (isbot) mapOf("uid" to "bot", "username" to "Robot \uD83E\uDD16", "avatarUrl" to "bot") else null
                writeMap["missedTurns"] = if (isbot) mapOf(u to 0, "bot" to 0) else null
                writeSet(ref, writeMap)
            } else if (gs?.status == "lobby" && gs.black == null && gs.white?.uid != u) {
                writeUpdates(
                    ref,
                    mapOf(
                        "black" to mapOf(
                            "uid" to u,
                            "username" to (userProfile?.get("username") as? String ?: "Black"),
                            "avatarUrl" to (userProfile?.get("avatarUrl") as? String ?: "")
                        ),
                        "updatedAt" to now
                    )
                )
            }
        }
    }

    // ── startGame (host kicks off from lobby) ──────────────────────────────
    fun startGame() {
        val gs = latestState ?: return
        if (gs.status != "lobby") return
        if (gs.white?.uid != uid) return
        val ref = database.getReference(gamePath)
        val now = System.currentTimeMillis()
        val missed = mapOf((gs.white?.uid ?: "white") to 0, (gs.black?.uid ?: "black") to 0)
        scope.launch {
            writeUpdates(
                ref,
                mapOf(
                    "status" to "playing",
                    "matchStartTime" to now,
                    "turnStartTime" to now,
                    "missedTurns" to missed,
                    "updatedAt" to now
                )
            )
        }
    }

    // ── makeMove (engine) ──────────────────────────────────────────────────
    fun engineMove(newFen: String) {
        val gs = latestState ?: return
        if (gs.status != "playing") return
        val currentTurnUid = if (gs.turn == "w") gs.white?.uid else gs.black?.uid
        if (currentTurnUid != uid && currentTurnUid != "bot") return
        val nextTurn = if (gs.turn == "w") "b" else "w"
        val newMissed = gs.missedTurns.toMutableMap()
        if (!currentTurnUid.isNullOrEmpty()) newMissed[currentTurnUid] = 0
        val ref = database.getReference(gamePath)
        scope.launch {
            writeUpdates(
                ref,
                mapOf(
                    "fen" to newFen,
                    "turn" to nextTurn,
                    "turnStartTime" to System.currentTimeMillis(),
                    "missedTurns" to newMissed,
                    "updatedAt" to System.currentTimeMillis()
                )
            )
        }
    }

    // ── endGame (engine) ───────────────────────────────────────────────────
    fun handleRoundEnd(status: String, winnerId: String?) {
        val iWon = winnerId == uid
        val text: String
        val emoji: String
        when {
            status == "checkmate" -> { text = if (iWon) "You won by Checkmate!" else "Checkmated!"; emoji = if (iWon) "\u265F\uD83C\uDFC6" else "\uD83D\uDE14" }
            status == "stalemate" -> { text = "Stalemate — Draw"; emoji = "\uD83E\uDD1D" }
            status == "draw" -> { text = "Draw!"; emoji = "\uD83E\uDD1D" }
            else -> { text = if (iWon) "Opponent Resigned — You Win!" else "You Resigned"; emoji = if (iWon) "\u265F\uD83C\uDFC6" else "\uD83D\uDE22" }
        }
        onRoundEnd(GameRoundEndData(resultText = text, resultEmoji = emoji))
    }

    fun endGameEngine(status: String, winnerId: String?) {
        val gs = latestState ?: return
        if (gs.status in setOf("checkmate", "stalemate", "draw", "resigned", "ended")) return
        val ref = database.getReference(gamePath)
        scope.launch {
            writeUpdates(ref, mapOf("status" to status, "winner" to (winnerId ?: ""), "updatedAt" to System.currentTimeMillis()))
            handleRoundEnd(status, winnerId)
        }
    }

    // ── Host referee: turn timeout (30s) + match timeout (20min) ───────────
    LaunchedEffect(uid, gamePath) {
        while (isActive) {
            delay(2000)
            val gs = latestState ?: continue
            if (gs.status != "playing") continue
            if (gs.white?.uid != uid) continue
            val now = System.currentTimeMillis()

            val turnStart = gs.turnStartTime ?: now
            if (now - turnStart >= 30000) {
                val activeColor = gs.turn
                val activeUid = if (activeColor == "w") gs.white?.uid else gs.black?.uid
                val opponentUid = if (activeColor == "w") gs.black?.uid else gs.white?.uid
                if (activeUid != null) {
                    val missed = (gs.missedTurns[activeUid] ?: 0) + 1
                    val updatedMissed = gs.missedTurns + (activeUid to missed)
                    val ref = database.getReference(gamePath)
                    if (missed >= 3) {
                        writeUpdates(ref, mapOf("status" to "resigned", "winner" to (opponentUid ?: ""), "updatedAt" to now))
                        handleRoundEnd("resigned", opponentUid)
                    } else {
                        writeUpdates(
                            ref,
                            mapOf(
                                "turn" to (if (activeColor == "w") "b" else "w"),
                                "turnStartTime" to now,
                                "missedTurns" to updatedMissed,
                                "updatedAt" to now
                            )
                        )
                    }
                }
            }

            val matchStart = gs.matchStartTime ?: now
            if (now - matchStart >= 1200000) {
                writeUpdates(database.getReference(gamePath), mapOf("status" to "draw", "winner" to "", "updatedAt" to now))
                handleRoundEnd("draw", null)
            }
        }
    }

    // ── Derived chess state ────────────────────────────────────────────────
    val chessState = remember(gameState?.fen) {
        gameState?.fen?.let { runCatching { parseFen(it) }.getOrNull() }
    }
    val board = remember(gameState?.fen) {
        chessState?.board ?: getInitialBoard()
    }

    val myColor: Char? = when {
        uid != null && gameState?.white?.uid == uid -> 'w'
        uid != null && gameState?.black?.uid == uid -> 'b'
        else -> null
    }
    val isMyTurn = gameState?.status == "playing" && myColor != null && myColor.toString() == gameState?.turn

    val selectedMoves = if (selectedSquare != null && chessState != null) {
        val sr = 8 - (selectedSquare!!.substring(1).toIntOrNull() ?: 0)
        val sc = selectedSquare!![0] - 'a'
        if (sr in 0..7 && sc in 0..7) legalMoves(chessState, sr, sc) else emptyList()
    } else emptyList()
    val legalMoveSet = selectedMoves.map { "${it.first},${it.second}" }.toSet()

    val isInCheck = remember(board, gameState?.turn) {
        val side = gameState?.turn?.firstOrNull() ?: return@remember false
        val (kr, kc) = findKing(board, side)
        if (kr == -1) false else isAttackedBy(board, kr, kc, enemyColor(side))
    }

    // ── captured pieces from FEN diff ──────────────────────────────────────
    LaunchedEffect(gameState?.fen) {
        val fenStr = gameState?.fen ?: return@LaunchedEffect
        val cur = runCatching { parseFen(fenStr).board }.getOrNull() ?: return@LaunchedEffect
        val initBs = getInitialBoard()
        val wCap = mutableListOf<ChessPiece?>()
        val bCap = mutableListOf<ChessPiece?>()
        for (r in 0 until 8) for (c in 0 until 8) {
            val i = initBs[r][c]
            val cur2 = cur[r][c]
            if (i != null && cur2 == null) {
                if (i.color == 'w') bCap.add(i) else wCap.add(i)
            }
        }
        capturedByWhite = sortCapturedPieces(wCap)
        capturedByBlack = sortCapturedPieces(bCap)
    }

    // ── Lobby countdown (2 players) ────────────────────────────────────────
    LaunchedEffect(gameState?.status, gameState?.white?.uid, gameState?.black?.uid) {
        val gs = gameState
        val numPlayers = (if (gs?.white != null) 1 else 0) + (if (gs?.black != null) 1 else 0)
        if (gs?.status != "lobby" || numPlayers < 2) {
            countdown = 30
            return@LaunchedEffect
        }
        countdown = 30
        while (countdown > 0) {
            delay(1000)
            countdown--
            if (countdown <= 0) {
                val fresh = gameState
                if (fresh?.white?.uid == uid) startGame()
            }
        }
    }

    // ── Turn timer ─────────────────────────────────────────────────────────
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

    // ── Bot AI ─────────────────────────────────────────────────────────────
    LaunchedEffect(gameState?.turn, gameState?.status, gameState?.isBot, gameState?.fen) {
        val gs = latestState ?: return@LaunchedEffect
        if (!gs.isBot || gs.status != "playing" || gs.turn != "b") return@LaunchedEffect
        if (gs.black?.uid != "bot") return@LaunchedEffect
        val st = runCatching { parseFen(gs.fen) }.getOrNull() ?: return@LaunchedEffect
        delay(1200)
        val fresh = latestState ?: return@LaunchedEffect
        if (fresh.turn != "b") return@LaunchedEffect
        val freshSt = runCatching { parseFen(fresh.fen) }.getOrNull() ?: return@LaunchedEffect

        val movesList = mutableListOf<Pair<Pair<Int, Int>, Pair<Int, Int>>>()
        for (r in 0 until 8) for (c in 0 until 8) {
            val piece = freshSt.board[r][c]
            if (piece != null && piece.color == 'b') {
                legalMoves(freshSt, r, c).forEach { (tr, tc) -> movesList.add((r to c) to (tr to tc)) }
            }
        }

        if (movesList.isEmpty()) {
            val status = getGameStatus(freshSt)
            if (status == "checkmate" || status == "stalemate") {
                endGameEngine(status, if (status == "checkmate") gameState?.white?.uid else null)
            }
            return@LaunchedEffect
        }

        var chosen = movesList.random()
        val captures = movesList.filter { freshSt.board[it.second.first][it.second.second] != null }
        if (captures.isNotEmpty() && Math.random() < 0.7) chosen = captures.random()

        val newState = applyMove(freshSt, chosen.first.first, chosen.first.second, chosen.second.first, chosen.second.second, 'q')
        if (newState != null) {
            val fromCoord = rcToCoord(chosen.first.first, chosen.first.second)
            val toCoord = rcToCoord(chosen.second.first, chosen.second.second)
            val newFen = stateToFen(newState)
            val status = getGameStatus(newState)
            lastMove = fromCoord to toCoord
            engineMove(newFen)
            if (status == "checkmate" || status == "stalemate") {
                endGameEngine(status, if (status == "checkmate") "bot" else null)
            }
        }
    }

    // ── local move handler (disp = rendered indices, real = board indices) ─
    fun handleSquarePress(dispR: Int, dispC: Int) {
        if (!isMyTurn || chessState == null || gameState == null) return
        val realR = if (myColor == 'b') 7 - dispR else dispR
        val realC = if (myColor == 'b') 7 - dispC else dispC
        val coord = rcToCoord(realR, realC)
        val piece = chessState.board[realR][realC]

        if (selectedSquare != null) {
            val fromSquare = selectedSquare
            if (fromSquare == null) return
            val sr = 8 - (fromSquare.substring(1).toIntOrNull() ?: 0)
            val sc = fromSquare[0] - 'a'
            val isLegal = legalMoves(chessState, sr, sc).any { it.first == realR && it.second == realC }
            if (isLegal) {
                val movingPiece = chessState.board[sr][sc]
                if (movingPiece?.type == 'p' && (realR == 0 || realR == 7)) {
                    promotionPending = (sr to sc) to (realR to realC)
                    selectedSquare = null
                    return
                }
                val newState = applyMove(chessState, sr, sc, realR, realC, 'q')
                if (newState != null) {
                    val newFen = stateToFen(newState)
                    val status = getGameStatus(newState)
                    lastMove = fromSquare to coord
                    engineMove(newFen)
                    if (status == "checkmate" || status == "stalemate") {
                        endGameEngine(status, if (status == "checkmate") uid else null)
                    }
                }
                selectedSquare = null
                return
            }
            if (piece != null && piece.color == myColor) {
                selectedSquare = coord
                return
            }
            selectedSquare = null
            return
        }

        if (piece != null && piece.color == myColor) {
            selectedSquare = coord
        }
    }

    fun handlePromotion(promoteTo: Char) {
        val pending = promotionPending ?: run { promotionPending = null; return }
        val st = chessState ?: run { promotionPending = null; return }
        val from = pending.first; val to = pending.second
        val newState = applyMove(st, from.first, from.second, to.first, to.second, promoteTo)
        if (newState != null) {
            val newFen = stateToFen(newState)
            val status = getGameStatus(newState)
            promotionPending = null
            engineMove(newFen)
            if (status == "checkmate" || status == "stalemate") {
                endGameEngine(status, if (status == "checkmate") uid else null)
            }
        } else {
            promotionPending = null
        }
    }

    // ── UI dispatch ────────────────────────────────────────────────────────
    if (isLaunching || isLoading) {
        ChessLoadingScreen()
        return
    }

    val gs = gameState
    val terminal = gs == null || gs.status in setOf("checkmate", "stalemate", "draw", "resigned", "ended")

    if (terminal && localLobbyMode == null) {
        ChessModeSelect(onMode = { isBot -> localLobbyMode = "classic"; startMatch(isBot) })
        return
    }

    if (gs == null) {
        Box(Modifier.fillMaxSize().background(Color(0xFF0F172A)))
        return
    }

    if (gs.status == "lobby") {
        ChessLobbyScreen(
            gameState = gs,
            isAdmin = isAdmin,
            countdown = countdown,
            onJoin = { startMatch(false) },
            onStart = { startGame() },
            onClose = onClose
        )
        return
    }

    if (gs.status in setOf("checkmate", "stalemate", "draw", "resigned")) {
        ChessEndedScreen(status = gs.status, iWon = gs.winner == uid, onClose = onClose)
        return
    }

    // ── PLAYING ────────────────────────────────────────────────────────────
    Column(Modifier.fillMaxSize().background(Color(0xFF0F172A))) {
        // Players row
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(top = 36.dp, bottom = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
                ChessPlayerBadgeCompact(
                    label = gs.white?.username ?: "White",
                    isMe = gs.white?.uid == uid,
                    isActive = gs.turn == "w",
                    isWhite = true
                )
                Row {
                    capturedByBlack.forEach { p ->
                        if (p != null) Text(pieceToUnicode(p), color = Color(0xFF94A3B8).copy(alpha = 0.5f), fontSize = 10.sp)
                    }
                }
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(
                    Modifier
                        .clip(CircleShape)
                        .background(if (isMyTurn) Color(0x2622C55E) else Color(0x26EF4444))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(Modifier.size(6.dp).clip(CircleShape).background(if (isMyTurn) Color(0xFF22C55E) else Color(0xFFEF4444)))
                    Spacer(Modifier.width(4.dp))
                    Text(
                        if (isMyTurn) "Your Turn (${timeLeft}s)" else "Their Turn (${timeLeft}s)",
                        color = if (isMyTurn) Color(0xFF22C55E) else Color(0xFFEF4444),
                        fontSize = 9.sp, fontWeight = FontWeight.Black
                    )
                }
                if (isInCheck) {
                    Text("\u2654 CHECK", color = Color(0xFFEF4444), fontSize = 9.sp, fontWeight = FontWeight.Black)
                }
            }
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                ChessPlayerBadgeCompact(
                    label = gs.black?.username ?: "Black",
                    isMe = gs.black?.uid == uid,
                    isActive = gs.turn == "b",
                    isWhite = false
                )
                Row {
                    capturedByWhite.forEach { p ->
                        if (p != null) Text(pieceToUnicode(p), color = Color(0xFF94A3B8).copy(alpha = 0.5f), fontSize = 10.sp)
                    }
                }
            }
        }

        // Board + labels
        Column(Modifier.fillMaxWidth().padding(horizontal = 8.dp).padding(top = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            val flipped = myColor == 'b'
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.width(14.dp)) {
                    val ranks = if (flipped) listOf("1", "2", "3", "4", "5", "6", "7", "8") else listOf("8", "7", "6", "5", "4", "3", "2", "1")
                    ranks.forEach { rk ->
                        Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                            Text(rk, color = Color.White.copy(alpha = 0.25f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.width(2.dp))
                ChessSquareBoard(
                    board = board,
                    flipped = flipped,
                    myColor = myColor,
                    selectedSquare = selectedSquare,
                    legalMoveSet = legalMoveSet,
                    lastMove = lastMove,
                    isInCheck = isInCheck,
                    sideToMove = gs.turn.firstOrNull() ?: 'w',
                    onSquareClick = { rr, cc -> handleSquarePress(rr, cc) }
                )
            }
            Row(Modifier.fillMaxWidth(0.95f).padding(top = 3.dp)) {
                val files = if (flipped) listOf("h", "g", "f", "e", "d", "c", "b", "a") else listOf("a", "b", "c", "d", "e", "f", "g", "h")
                files.forEach { f ->
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Text(f, color = Color.White.copy(alpha = 0.25f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Resign
        Box(Modifier.fillMaxWidth().padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
            Box(
                Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0x1FEF4444))
                    .border(1.dp, Color(0x66EF4444), RoundedCornerShape(8.dp))
                    .clickable {
                        val opponentUid = if (myColor == 'w') gs.black?.uid else gs.white?.uid
                        endGameEngine("resigned", opponentUid ?: "")
                    }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text("RESIGN", color = Color(0xFFEF4444), fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }

        // Promotion Modal
        promotionPending?.let {
            Box(
                Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    Modifier
                        .background(Color(0xFF1E293B), RoundedCornerShape(20.dp))
                        .border(2.dp, Color(0xFFFBBF24), RoundedCornerShape(20.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Choose Promotion", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp, modifier = Modifier.padding(bottom = 16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        listOf('q', 'r', 'b', 'n').forEach { pt ->
                            Box(
                                Modifier
                                    .size(56.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF334155))
                                    .border(2.dp, Color(0xFF475569), RoundedCornerShape(12.dp))
                                    .clickable { handlePromotion(pt) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(pieceToUnicode(ChessPiece(pt, myColor ?: 'w')), fontSize = 32.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Chess sub-screens ───────────────────────────────────────────────────────

@Composable
private fun ChessLoadingScreen() {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        progress.animateTo(1f, tween(5000))
    }
    Box(Modifier.fillMaxSize().background(Color(0xFF0F172A)), contentAlignment = Alignment.Center) {
        Image(painterResource(R.drawable.chess), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(Color(0xFF0F172A).copy(alpha = 0.75f)))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(140.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .border(4.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
            ) {
                Image(painterResource(R.drawable.chess), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
            Text("CHESS", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp, modifier = Modifier.padding(top = 12.dp))
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
private fun ChessModeSelect(onMode: (Boolean) -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0xFF0F172A)), contentAlignment = Alignment.Center) {
        Image(painterResource(R.drawable.chess), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(Color(0xFF0F172A).copy(alpha = 0.5f)))
        Column(
            Modifier
                .fillMaxWidth(0.85f)
                .clip(RoundedCornerShape(24.dp))
                .border(3.dp, Color(0xFFFBBF24), RoundedCornerShape(24.dp))
                .background(Color(0xFF334155))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Select Mode", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp, modifier = Modifier.padding(bottom = 24.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(25.dp))
                    .background(Color(0xFFFBBF24))
                    .clickable { onMode(false) },
                contentAlignment = Alignment.Center
            ) {
                Text("CLASSIC CHESS", color = Color(0xFF0F172A), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
            Spacer(Modifier.height(12.dp))
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(25.dp))
                    .background(Color(0x14FFFFFF))
                    .border(1.5.dp, Color(0xFFFBBF24), RoundedCornerShape(25.dp))
                    .clickable { onMode(true) },
                contentAlignment = Alignment.Center
            ) {
                Text("\uD83E\uDD16 PLAY WITH ROBOT", color = Color(0xFFFBBF24), fontSize = 16.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
            }
        }
    }
}

@Composable
private fun ChessLobbyScreen(
    gameState: ChessGameState,
    isAdmin: Boolean,
    countdown: Int,
    onJoin: () -> Unit,
    onStart: () -> Unit,
    onClose: () -> Unit
) {
    val authUid = FirebaseAuth.getInstance().currentUser?.uid
    val hasOpponent = gameState.black != null && gameState.white != null
    Column(
        Modifier.fillMaxSize().background(Color(0xFF0F172A)).padding(top = 48.dp, start = 32.dp, end = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(36.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) { Text("\u2715", color = Color.White, fontSize = 16.sp, modifier = Modifier.clickable { onClose() }) }
            Text("Chess", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black, letterSpacing = (-1).sp)
            Spacer(Modifier.width(36.dp))
        }

        Spacer(Modifier.height(40.dp))

        Column(
            Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(24.dp))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier.size(72.dp).clip(CircleShape).background(Color(0xFFF5F5F5)).border(3.dp, Color(0xFFFBBF24), CircleShape),
                        contentAlignment = Alignment.Center
                    ) { Text("\u2654", fontSize = 36.sp, color = Color.Black) }
                    Text(gameState.white?.username ?: "Waiting...", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
                    Text("WHITE", color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
                Text("\u2694", color = Color(0xFFFBBF24), fontSize = 20.sp, fontWeight = FontWeight.Black)
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(if (gameState.black != null) Color(0xFF1A1A1A) else Color.White.copy(alpha = 0.03f))
                            .border(3.dp, if (gameState.black != null) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.08f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) { Text(if (gameState.black != null) "\u265A" else "?", fontSize = 36.sp, color = if (gameState.black != null) Color.White else Color.White.copy(alpha = 0.3f)) }
                    Text(gameState.black?.username ?: "Open", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
                    Text("BLACK", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }

            Spacer(Modifier.height(28.dp))

            when {
                !hasOpponent -> {
                    if (gameState.white != null && gameState.white!!.uid != authUid) {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0xFF22C55E))
                                .clickable { onJoin() }
                                .padding(vertical = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("JOIN AS BLACK", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        }
                    } else {
                        Row(
                            Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("\u231A", color = Color.White.copy(alpha = 0.4f), fontSize = 14.sp)
                            Spacer(Modifier.width(6.dp))
                            Text("WAITING FOR OPPONENT...", color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                        }
                    }
                }
                else -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Game starting automatically in ${countdown}s", color = Color(0xFFFBBF24), fontSize = 13.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp, modifier = Modifier.padding(bottom = 20.dp))
                        if (isAdmin) {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFFBBF24))
                                    .clickable { onStart() }
                                    .padding(vertical = 16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("START MATCH", color = Color(0xFF0F172A), fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                            }
                        } else {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color.White.copy(alpha = 0.05f))
                                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
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
    }
}

@Composable
private fun ChessEndedScreen(status: String, iWon: Boolean, onClose: () -> Unit) {
    val emoji: String; val title: String; val color: Color; val subtitle: String
    when (status) {
        "checkmate" -> { emoji = if (iWon) "\uD83D\uDC51" else "\uD83D\uDC80"; title = if (iWon) "CHECKMATE!" else "CHECKMATED"; color = Color(0xFFFBBF24); subtitle = "You won the match!" }
        "stalemate" -> { emoji = "\uD83E\uDD1D"; title = "STALEMATE"; color = Color(0xFF94A3B8); subtitle = "Nobody wins" }
        "resigned" -> { emoji = if (iWon) "\uD83C\uDFC6" else "\uD83C\uDFF3\uFE0F"; title = if (iWon) "YOU WIN!" else "RESIGNED"; color = if (iWon) Color(0xFFFBBF24) else Color(0xFFEF4444); subtitle = if (iWon) "Opponent resigned" else "You resigned" }
        "draw" -> { emoji = "\uD83E\uDD1D"; title = "DRAW"; color = Color(0xFF94A3B8); subtitle = "Better luck next time" }
        else -> { emoji = if (iWon) "\uD83C\uDFC6" else "\uD83D\uDE22"; title = if (iWon) "YOU WIN!" else "GAME OVER"; color = Color(0xFFFBBF24); subtitle = "" }
    }
    Box(Modifier.fillMaxSize().background(Color(0xFF0F172A)), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 72.sp)
            Text(title, color = color, fontSize = 32.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 8.dp))
            Text(subtitle, color = Color.White.copy(alpha = 0.5f), fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp, bottom = 32.dp))
            Box(
                Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFFFBBF24))
                    .clickable { onClose() }
                    .padding(horizontal = 40.dp, vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("BACK TO ROOM", color = Color(0xFF0F172A), fontSize = 14.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }
    }
}

@Composable
private fun ChessPlayerBadgeCompact(label: String, isMe: Boolean, isActive: Boolean, isWhite: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(if (isWhite) Color(0xFFF5F5F5) else Color(0xFF1A1A1A))
                .border(2.5.dp, if (isActive) Color(0xFFFBBF24) else Color.White.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(if (isWhite) "\u2654" else "\u265A", fontSize = 18.sp, color = if (isWhite) Color(0xFF000000) else Color.White)
        }
        Spacer(Modifier.width(8.dp))
        Column {
            Text(label + if (isMe) " (You)" else "", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(if (isWhite) "WHITE" else "BLACK", color = Color.White.copy(alpha = 0.3f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
    }
}

// ── Chess board grid ────────────────────────────────────────────────────────
@Composable
private fun ChessSquareBoard(
    board: Array<Array<ChessPiece?>>,
    flipped: Boolean,
    myColor: Char?,
    selectedSquare: String?,
    legalMoveSet: Set<String>,
    lastMove: Pair<String, String>?,
    isInCheck: Boolean,
    sideToMove: Char,
    onSquareClick: (Int, Int) -> Unit
) {
    val squareSizeDp: Dp = 44.dp
    Column {
        for (rowIdx in 0 until 8) {
            val r = if (flipped) 7 - rowIdx else rowIdx
            Row {
                for (colIdx in 0 until 8) {
                    val c = if (flipped) 7 - colIdx else colIdx
                    val isDark = (r + c) % 2 == 1
                    val coord = rcToCoord(r, c)
                    val isSelected = selectedSquare == coord
                    val isLastMove = lastMove != null && (lastMove.first == coord || lastMove.second == coord)
                    val isLegalMove = legalMoveSet.contains("$r,$c")
                    val piece = board[r][c]
                    val hasEnemy = piece != null && piece.color != myColor
                    val isCapture = isLegalMove && hasEnemy
                    val isKingInCheck = isInCheck && piece?.type == 'k' && piece.color == sideToMove

                    Box(
                        Modifier
                            .size(squareSizeDp)
                            .background(
                                when {
                                    isSelected -> Color(0xB3FACC15)
                                    isKingInCheck -> Color(0x80EF4444)
                                    isLastMove -> Color(0x4DFACC15)
                                    isDark -> Color(0xFF006B3F)
                                    else -> Color(0xFFE8F5E9)
                                }
                            )
                            .clickable { onSquareClick(rowIdx, colIdx) },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isLegalMove && !hasEnemy) {
                            Box(
                                Modifier
                                    .size(squareSizeDp * 0.28f)
                                    .clip(CircleShape)
                                    .background(Color(0x66006B3F))
                            )
                        }
                        if (isCapture) {
                            Box(
                                Modifier
                                    .size(squareSizeDp * 0.88f)
                                    .clip(CircleShape)
                                    .border(3.dp, Color(0xB3EF4444), CircleShape)
                            )
                        }
                        if (piece != null) {
                            Text(
                                pieceToUnicode(piece),
                                fontSize = (squareSizeDp.value * 0.76f).sp,
                                color = Color(0xFF111111)
                            )
                        }
                    }
                }
            }
        }
    }
}