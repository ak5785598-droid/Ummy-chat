package app.vercel.ummy_chat.twa.data.model

data class CpPairModel(
    val id: String,
    val user1Uid: String,
    val user1Name: String,
    val user2Uid: String,
    val user2Name: String,
    val cpValue: Long,
    val level: Int = 1,
    val user1Avatar: String? = null,
    val user2Avatar: String? = null
)

val MOCK_CP_PAIRS = listOf(
    CpPairModel("cp_1", "u1", "Romeo 👑", "u2", "Juliet 🌹", 3500000L, 10),
    CpPairModel("cp_2", "u3", "King", "u4", "Queen", 2100000L, 8),
    CpPairModel("cp_3", "u5", "Alex", "u6", "Sophia", 1450000L, 6),
    CpPairModel("cp_4", "u7", "David", "u8", "Emma", 890000L, 4),
    CpPairModel("cp_5", "u9", "Ryan", "u10", "Chloe", 540000L, 3)
)
