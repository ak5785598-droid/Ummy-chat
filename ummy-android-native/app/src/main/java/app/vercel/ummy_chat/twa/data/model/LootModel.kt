package app.vercel.ummy_chat.twa.data.model

data class LootLevel(
    val id: String = "",
    val name: String = "",
    val threshold: Long = 0L,
    val image: String = "",
    val animation: String = "",
    val voice: String = ""
)

data class LootReward(
    val id: String = "",
    val name: String = "",
    val type: String = "coins", // coins, frame, badge, special, theme
    val rarity: String = "common", // common, rare, epic, legendary
    val value: Long = 0L,
    val icon: String = ""
)

data class LootingItem(
    val id: String,
    val reward: LootReward,
    val x: Float,
    val y: Float,
    var collected: Boolean = false
)

object LootConstants {
    val DEFAULT_LOOT_LEVELS = listOf(
        LootLevel("home", "Home", 10000000L, "", "", ""),
        LootLevel("bank", "Bank", 30000000L, "", "", ""),
        LootLevel("car", "Car", 50000000L, "", "", ""),
        LootLevel("hotel", "Hotel", 80000000L, "", "", ""),
        LootLevel("bus", "Bus", 90000000L, "", "", ""),
        LootLevel("train", "Train", 120000000L, "", "", ""),
        LootLevel("ship", "Ship", 130000000L, "", "", ""),
        LootLevel("aeroplane", "Aeroplane", 150000000L, "", "", ""),
        LootLevel("submarine", "Submarine", 180000000L, "", "", ""),
        LootLevel("rocket", "Rocket", 220000000L, "", "", "")
    )

    val DEFAULT_LOOT_REWARDS = listOf(
        LootReward("coins-common", "Coins", "coins", "common", 100L, ""),
        LootReward("frame-common", "Frame", "frame", "common", 1L, ""),
        LootReward("badge-rare", "Badge", "badge", "rare", 1L, ""),
        LootReward("special-legendary", "Special Item", "special", "legendary", 1L, ""),
        LootReward("theme-epic", "Room Theme", "theme", "epic", 1L, "")
    )
}
