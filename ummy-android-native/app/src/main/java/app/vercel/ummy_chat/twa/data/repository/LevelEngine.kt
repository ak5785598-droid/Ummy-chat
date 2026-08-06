package app.vercel.ummy_chat.twa.data.repository

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

data class LevelProgress(
    val currentLevel: Int,
    val nextLevel: Int,
    val currentSpent: Double,
    val nextLevelThreshold: Double,
    val progressPercent: Float,
    val remainingToLevelUp: Double
)

data class LevelThreshold(val level: Int, val spent: Double)

object LevelEngine {
    private val THRESHOLDS = listOf(
        LevelThreshold(0, 0.0),
        LevelThreshold(1, 20000.0),
        LevelThreshold(10, 3500000000.0),
        LevelThreshold(20, 10000000000.0),
        LevelThreshold(30, 100000000000.0),
        LevelThreshold(40, 2000000000000.0),
        LevelThreshold(50, 25000000000000.0),
        LevelThreshold(60, 350000500000000.0),
        LevelThreshold(70, 5000002500000000.0),
        LevelThreshold(80, 70000000000000000.0),
        LevelThreshold(90, 850000000000000000.0),
        LevelThreshold(100, 1000000000000000000.0)
    )

    fun calculateLevelProgress(totalSpent: Double = 0.0): LevelProgress {
        val spent = max(0.0, totalSpent)
        var currentLevel = 0
        var nextLevelThreshold = THRESHOLDS[1].spent

        for (i in THRESHOLDS.indices) {
            if (spent >= THRESHOLDS[i].spent) {
                currentLevel = THRESHOLDS[i].level
                if (i < THRESHOLDS.size - 1) {
                    val startLevel = THRESHOLDS[i].level
                    val endLevel = THRESHOLDS[i + 1].level
                    val startSpent = THRESHOLDS[i].spent
                    val endSpent = THRESHOLDS[i + 1].spent

                    val levelsInRange = endLevel - startLevel
                    val spentPerLevel = (endSpent - startSpent) / (if (levelsInRange == 0) 1 else levelsInRange)

                    val extraSpent = spent - startSpent
                    val extraLevels = floor(extraSpent / (if (spentPerLevel == 0.0) 1.0 else spentPerLevel)).toInt()

                    currentLevel = startLevel + extraLevels
                    nextLevelThreshold = startSpent + (extraLevels + 1) * spentPerLevel
                } else {
                    currentLevel = 100
                    nextLevelThreshold = spent
                }
            } else {
                break
            }
        }

        currentLevel = min(currentLevel, 100)
        val remaining = max(0.0, nextLevelThreshold - spent)

        val currentLevelBaseSpent = THRESHOLDS.findLast { it.level <= currentLevel }?.spent ?: 0.0
        val rangeSpent = max(1.0, nextLevelThreshold - currentLevelBaseSpent)
        val progressPercent = if (currentLevel >= 100) 100f else (1f - (remaining / rangeSpent).toFloat()) * 100f

        return LevelProgress(
            currentLevel = currentLevel,
            nextLevel = min(currentLevel + 1, 100),
            currentSpent = spent,
            nextLevelThreshold = nextLevelThreshold,
            progressPercent = progressPercent.coerceIn(0f, 100f),
            remainingToLevelUp = remaining
        )
    }
}
