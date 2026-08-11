package app.vercel.ummy_chat.twa.data.model

enum class TaskCategory {
    MIC, INVITE, GIFT, TRAFFIC, FOLLOW, SHARE
}

data class RoomTask(
    val id: String,
    val title: String,
    val target: Int,
    val reward: Int,
    val category: TaskCategory,
    val unit: String? = null
)

object RoomTasksConstants {
    val ROOM_TASKS = listOf(
        RoomTask("mic_10", "On mic for 10 Minutes", 10, 2500, TaskCategory.MIC, "min"),
        RoomTask("mic_30", "On mic for 30 Minutes", 30, 10000, TaskCategory.MIC, "min"),
        RoomTask("mic_60", "On mic for 60 Minute", 60, 25000, TaskCategory.MIC, "min"),
        RoomTask("invite_1", "Successfully invited 1 user on mic", 1, 2500, TaskCategory.INVITE),
        RoomTask("invite_10", "Successfully Invited 10 user on mic", 10, 25000, TaskCategory.INVITE),
        RoomTask("invite_new_3", "Successfully invited 3 New user on mic", 3, 2000, TaskCategory.INVITE),
        RoomTask("gift_once", "Send gift once", 1, 500, TaskCategory.GIFT),
        RoomTask("traffic_consecutive", "more then 5 user enter Your room for 2 Consecutive days", 2, 20000, TaskCategory.TRAFFIC, "days"),
        RoomTask("sim_mic_1", "3 User on mic at the same time for 1 minutes", 1, 5000, TaskCategory.MIC, "min"),
        RoomTask("sim_mic_10", "3 user on mic at the same time for 10 minutes", 10, 10000, TaskCategory.MIC, "min"),
        RoomTask("sim_mic_new_5", "3 New user on mice at the same time for 5 minutes", 5, 10000, TaskCategory.MIC, "min"),
        RoomTask("new_user_gift_3", "3 New user send gifts in the room", 3, 5000, TaskCategory.GIFT),
        RoomTask("follow_1", "1 New follower", 1, 1000, TaskCategory.FOLLOW),
        RoomTask("follow_10", "10 New follower", 10, 5000, TaskCategory.FOLLOW),
        RoomTask("follow_new_3", "3 New follower From new user", 3, 2500, TaskCategory.FOLLOW),
        RoomTask("share_whatsapp", "Successfully Shared room link to whatsApp", 1, 5000, TaskCategory.SHARE),
        RoomTask("entry_10", "10 User enter the room", 10, 10000, TaskCategory.TRAFFIC),
        RoomTask("entry_3", "3 User enter the room", 3, 2500, TaskCategory.TRAFFIC)
    )
}
