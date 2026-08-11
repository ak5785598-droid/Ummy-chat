package app.vercel.ummy_chat.twa.ui.games

import androidx.annotation.DrawableRes
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.MutableData
import com.google.firebase.database.Transaction
import kotlinx.coroutines.CompletableDeferred
import app.vercel.ummy_chat.twa.R

// run an RTDB transaction and suspend until onComplete is invoked
suspend fun runTransactionAndWait(ref: DatabaseReference, handler: Transaction.Handler): Boolean {
    val done = CompletableDeferred<Boolean>()
    ref.runTransaction(object : Transaction.Handler {
        override fun doTransaction(currentData: MutableData): Transaction.Result =
            handler.doTransaction(currentData)
        override fun onComplete(error: DatabaseError?, committed: Boolean, snapshot: DataSnapshot?) {
            done.complete(committed)
        }
    })
    return try { done.await() } catch (_: Exception) { false }
}

// ─────────────────────────────────────────────────────────────────────────────
// GameShared — shared infrastructure for all 7 room games, mirroring RN.
//   • getDeterministicWinner: exact MurmurHash3 32-bit finalizer port from
//     fruit-party-game.tsx / forest-party-game.tsx (100% same winners as RN)
//   • formatChipLabel: RN formatChipLabel
//   • FRUITS / ANIMALS data arrays + CHIPS + cycle constants
// ─────────────────────────────────────────────────────────────────────────────

data class GameWheelItem(
    val id: String,
    val emoji: String,
    @DrawableRes val imageRes: Int,
    val multiplier: Int,
    val label: String,
    val color: String,
    val bg: String
)

// RN: getDeterministicWinner(roundIdx, items) — MurmurHash3 finalizer
fun getDeterministicWinnerIndex(roundIdx: Long, count: Int): Int {
    var h = (roundIdx.toInt() xor 0x9e3779b9.toInt()).toLong() and 0xFFFFFFFFL
    var x = (h xor (h ushr 16)) and 0xFFFFFFFFL
    h = (x * 0x85ebca6bL) and 0xFFFFFFFFL
    x = (h xor (h ushr 13)) and 0xFFFFFFFFL
    h = (x * 0xc2b2ae35L) and 0xFFFFFFFFL
    h = (h xor (h ushr 16)) and 0xFFFFFFFFL
    return (h % count.toLong()).toInt()
}

// RN: formatChipLabel
fun formatChipLabel(value: Long): String {
    if (value >= 1_000_000L) return "${(value / 1_000_000L)}M"
    if (value >= 1_000L) return "${(value / 1_000L)}K"
    return "$value"
}

// RN: fruit-party-game.tsx FRUITS
val FRUITS = listOf(
    GameWheelItem("pineapple", "\uD83C\uDF4D", R.drawable.pineapple, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("cherry", "\uD83C\uDF52", R.drawable.cherry, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("banana", "\uD83C\uDF4C", R.drawable.banana, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("watermelon", "\uD83C\uDF49", R.drawable.watermelon, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("skewers", "\uD83C\uDF62", R.drawable.skewers, 10, "win 10 times", "#06b6d4", "#083344"),
    GameWheelItem("burrito", "\uD83C\uDF2F", R.drawable.burrito, 15, "win 15 times", "#06b6d4", "#083344"),
    GameWheelItem("pizza", "\uD83C\uDF55", R.drawable.pizza, 25, "win 25 times", "#06b6d4", "#083344"),
    GameWheelItem("chicken", "\uD83C\uDF57", R.drawable.chicken, 45, "win 45 times", "#06b6d4", "#083344")
)

// RN: forest-party-game.tsx ANIMALS
val ANIMALS = listOf(
    GameWheelItem("rabbit", "\uD83D\uDC30", R.drawable.rabbit, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("cat", "\uD83D\uDC31", R.drawable.cat, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("dog", "\uD83D\uDC36", R.drawable.dog, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("sheep", "\uD83D\uDC11", R.drawable.sheep, 5, "win 5 times", "#06b6d4", "#083344"),
    GameWheelItem("panda", "\uD83D\uDC3C", R.drawable.panda, 10, "win 10 times", "#06b6d4", "#083344"),
    GameWheelItem("bear", "\uD83D\uDC3B", R.drawable.bear, 15, "win 15 times", "#06b6d4", "#083344"),
    GameWheelItem("tiger", "\uD83D\uDC2F", R.drawable.tiger, 25, "win 25 times", "#06b6d4", "#083344"),
    GameWheelItem("lion", "\uD83E\uDD81", R.drawable.lion, 45, "win 45 times", "#06b6d4", "#083344")
)

val FRUIT_CHIPS = listOf(500L, 1000L, 5000L, 10000L, 50000L, 100000L, 500000L)
val SEQUENCE = listOf(0, 1, 2, 3, 4, 5, 6, 7)

const val GAME_CYCLE_DURATION = 40_000L // 40s total cycle
const val GAME_BETTING_DURATION = 30_000L // 30s betting window

// RN: winning groups
val LEFT_GROUP = listOf("skewers", "burrito", "pizza", "chicken")
val RIGHT_GROUP = listOf("pineapple", "cherry", "banana", "watermelon")

// RN: forest-party groups — left = wild, right = cute
val WILD_GROUP = listOf("panda", "bear", "tiger", "lion")
val CUTE_GROUP = listOf("rabbit", "cat", "dog", "sheep")

data class DroppedChip(val id: String, val fruitId: String, val label: String)

data class GameWinnerData(val id: String, val win: Long, val multiplier: Int)

data class GameRoundEndData(
    val resultText: String,
    val resultEmoji: String,
    @DrawableRes val resultImageRes: Int? = null,
    val myPrize: Long = 0L,
    val myWager: Long = 0L
)
