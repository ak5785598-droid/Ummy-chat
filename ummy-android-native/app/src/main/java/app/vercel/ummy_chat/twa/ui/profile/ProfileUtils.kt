package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.ui.graphics.Color
import app.vercel.ummy_chat.twa.data.repository.LevelEngine
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

fun calculateAge(birthday: Any?): Int? {
    if (birthday == null) return null

    val birthDate: Date? = when (birthday) {
        is Date -> birthday
        is String -> {
            try {
                SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(birthday)
            } catch (e: Exception) {
                null
            }
        }
        else -> {
            try {
                // Handle Timestamp safely without requiring firebase import
                val javaClass = birthday.javaClass
                val secondsMethod = javaClass.getMethod("getSeconds")
                val seconds = secondsMethod.invoke(birthday) as Long
                Date(seconds * 1000)
            } catch (e: Exception) {
                null
            }
        }
    }

    if (birthDate == null) return null

    val dob = Calendar.getInstance().apply { time = birthDate }
    val today = Calendar.getInstance()

    var age = today.get(Calendar.YEAR) - dob.get(Calendar.YEAR)
    if (today.get(Calendar.DAY_OF_YEAR) < dob.get(Calendar.DAY_OF_YEAR)) {
        age--
    }
    return if (age >= 0) age else null
}

val COUNTRY_FLAGS = mapOf(
    "india" to "🇮🇳", "in" to "🇮🇳",
    "pakistan" to "🇵🇰", "pk" to "🇵🇰",
    "bangladesh" to "🇧🇩", "bd" to "🇧🇩",
    "nepal" to "🇳🇵",
    "sri_lanka" to "🇱🇰", "sri lanka" to "🇱🇰",
    "usa" to "🇺🇸", "us" to "🇺🇸", "united states" to "🇺🇸",
    "uk" to "🇬🇧", "gb" to "🇬🇧", "united kingdom" to "🇬🇧",
    "canada" to "🇨🇦", "ca" to "🇨🇦",
    "australia" to "🇦🇺", "au" to "🇦🇺",
    "germany" to "🇩🇪",
    "france" to "🇫🇷",
    "japan" to "🇯🇵",
    "china" to "🇨🇳",
    "south_korea" to "🇰🇷", "south korea" to "🇰🇷",
    "brazil" to "🇧🇷",
    "russia" to "🇷🇺",
    "turkey" to "🇹🇷", "tr" to "🇹🇷",
    "egypt" to "🇪🇬", "eg" to "🇪🇬",
    "nigeria" to "🇳🇬",
    "south_africa" to "🇿🇦", "south africa" to "🇿🇦",
    "indonesia" to "🇮🇩",
    "philippines" to "🇵🇭",
    "thailand" to "🇹🇭",
    "vietnam" to "🇻🇳",
    "malaysia" to "🇲🇾",
    "uae" to "🇦🇪", "ae" to "🇦🇪", "united arab emirates" to "🇦🇪",
    "saudi_arabia" to "🇸🇦", "sa" to "🇸🇦", "saudi arabia" to "🇸🇦",
    "iran" to "🇮🇷",
    "afghanistan" to "🇦🇫",
    "myanmar" to "🇲🇲"
)

fun getCountryFlag(country: String?): String {
    if (country.isNullOrBlank()) return "🌍"
    return COUNTRY_FLAGS[country.trim().lowercase()] ?: "🌍"
}

fun getLevelFromSpent(totalSpent: Long): Int {
    return LevelEngine.calculateLevelProgress(totalSpent.toDouble()).currentLevel
}

fun getLevelColors(level: Int): Pair<Color, Color> {
    return when (level) {
        in 0..10 -> Pair(Color(0xFF22C55E), Color(0xFF16A34A))
        in 11..20 -> Pair(Color(0xFF3B82F6), Color(0xFF2563EB))
        in 21..30 -> Pair(Color(0xFF8B5CF6), Color(0xFF7C3AED))
        in 31..40 -> Pair(Color(0xFFF43F5E), Color(0xFFE11D48))
        in 41..50 -> Pair(Color(0xFFF59E0B), Color(0xFFD97706))
        in 51..60 -> Pair(Color(0xFF10B981), Color(0xFF059669))
        in 61..70 -> Pair(Color(0xFF06B6D4), Color(0xFF0891B2))
        in 71..80 -> Pair(Color(0xFFB78700), Color(0xFF9D174D))
        in 81..90 -> Pair(Color(0xFF14B8A6), Color(0xFF0891B2))
        in 91..100 -> Pair(Color(0xFF8B5CF6), Color(0xFFFBBF24))
        else -> Pair(Color(0xFFF43F5E), Color(0xFF881337))
    }
}

fun getUserAdminLevel(tags: List<String>, isAdmin: Boolean, uid: String): Int {
    if (uid == "901piBzTQ0VzCtAvlyyobwvAaTs1") return 7
    if (tags.contains("Official") || tags.contains("Official center") || isAdmin) return 6
    if (tags.contains("Super Admin")) return 5
    if (tags.contains("Manager")) return 4
    if (tags.contains("Auditor")) return 3
    if (tags.contains("Admin")) return 2
    if (tags.contains("CS Leader")) return 1
    if (tags.contains("Customer Service")) return 0
    return -1
}

fun getAdminPanelTitle(level: Int): String {
    return when {
        level >= 6 -> "Official Centre"
        level >= 4 -> "Operations Hub"
        level == 3 -> "Audit Panel"
        level >= 0 -> "Support Desk"
        else -> "Admin Centre"
    }
}

fun isInventoryItemExpired(inventory: Map<String, Any?>?, itemId: String?): Boolean {
    if (itemId.isNullOrEmpty() || itemId.equals("None", ignoreCase = true)) return true
    if (inventory == null) return true
    
    val itemExpiry = inventory[itemId] ?: return true
    
    val expiryTimeMs = when (itemExpiry) {
        is Number -> itemExpiry.toLong()
        is String -> itemExpiry.toLongOrNull() ?: return true
        is Date -> itemExpiry.time
        else -> {
            try {
                val javaClass = itemExpiry.javaClass
                val secondsMethod = javaClass.getMethod("getSeconds")
                val seconds = secondsMethod.invoke(itemExpiry) as Long
                seconds * 1000
            } catch (e: Exception) {
                return true
            }
        }
    }
    
    return System.currentTimeMillis() > expiryTimeMs
}

fun isCertifiedSeller(tags: List<String>?, isAuthorizedAdmin: Boolean): Boolean {
    if (isAuthorizedAdmin) return true
    if (tags == null) return false
    return tags.contains("Seller") || tags.contains("Seller center") || tags.contains("Coin Seller")
}
