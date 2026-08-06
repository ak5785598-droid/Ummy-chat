package app.vercel.ummy_chat.twa.data.model

import com.google.firebase.Timestamp

data class MomentModel(
    val id: String = "",
    val userId: String = "",
    val username: String = "",
    val avatarUrl: String = "",
    val userLevel: Int = 0,
    val userCountry: String = "IN",
    val content: String = "",
    val imageUrl: String? = null,
    val videoUrl: String? = null,
    val type: String? = null,
    val likes: Int = 0,
    val views: Int = 0,
    val reach: Int = 0,
    val commentsCount: Int = 0,
    val createdAt: Any? = null
)

data class MomentCommentModel(
    val id: String = "",
    val text: String = "",
    val userId: String = "",
    val username: String = "",
    val avatarUrl: String = "",
    val parentId: String? = null,
    val likesCount: Int = 0,
    val createdAt: Any? = null
)
