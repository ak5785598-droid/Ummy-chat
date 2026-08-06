package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay

data class BannerData(
    val id: String = "",
    val title: String = "",
    val subtitle: String = "",
    val colors: List<Color> = listOf(Color(0xFF8B5CF6), Color(0xFF6366F1), Color(0xFF4F46E5)),
    val icon: String = "✨",
    val imageUrl: String? = null,
    val link: String? = null
)

// React Native banner-carousel.tsx ICON_MAP: { Sparkles, Star, Crown, Compass, Trophy, Gamepad2, Gift }
private val bannerIconMap = mapOf(
    "Sparkles" to "✨",
    "Star" to "⭐",
    "Crown" to "👑",
    "Compass" to "🧭",
    "Trophy" to "🏆",
    "Gamepad2" to "🎮",
    "Gift" to "🎁"
)

val defaultBanners = listOf(
    BannerData(
        id = "weekly-star",
        title = "Weekly Star",
        subtitle = "1:1,000,000",
        colors = listOf(Color(0xFF7C3AED), Color(0xFF4F46E5), Color(0xFF312E81)),
        icon = "⭐",
        link = "/leaderboard?type=rich"
    ),
    BannerData(
        id = "merge-aristocracy",
        title = "Merge Aristocracy",
        subtitle = "EXCLUSIVE PERKS",
        colors = listOf(Color(0xFF1E40AF), Color(0xFF1E293B), Color(0xFF1E3A8A)),
        icon = "👑",
        link = "/families"
    ),
    BannerData(
        id = "lucky-spin",
        title = "Lucky Spin",
        subtitle = "TRY YOUR LUCK",
        colors = listOf(Color(0xFFF43F5E), Color(0xFFDC2626), Color(0xFF881337)),
        icon = "🎁",
        link = "/cp-house"
    )
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun BannerCarousel(
    onOpenSupport: (() -> Unit)? = null,
    onBannerClick: (link: String) -> Unit = {}
) {
    var displaySlides by remember { mutableStateOf(defaultBanners) }

    // React Native banner-carousel.tsx L56-64: Fetch from appConfig/banners
    DisposableEffect(Unit) {
        val fs = FirebaseFirestore.getInstance()
        val listener = fs.collection("appConfig").document("banners")
            .addSnapshotListener { snapshot, _ ->
                val slides = snapshot?.get("slides") as? List<Map<String, Any>>
                if (slides != null && slides.isNotEmpty()) {
                    displaySlides = slides.map { s ->
                        val colorList = s["colors"] as? List<String>
                        val colors = if (colorList != null && colorList.size >= 2) {
                            colorList.map { Color(android.graphics.Color.parseColor(it)) }
                        } else {
                            listOf(Color(0xFF8B5CF6), Color(0xFF6366F1), Color(0xFF4F46E5))
                        }
                        BannerData(
                            id = s["id"] as? String ?: "",
                            title = s["title"] as? String ?: "",
                            subtitle = (s["subtitle"] ?: s["sub"]) as? String ?: "",
                            colors = colors,
                            // React Native L66-72: ICON_MAP[iconName] || 'Sparkles'
                            icon = bannerIconMap[s["iconName"] as? String] ?: "✨",
                            imageUrl = s["imageUrl"] as? String,
                            link = s["link"] as? String
                        )
                    }
                }
            }
        onDispose { listener.remove() }
    }

    val pagerState = rememberPagerState(pageCount = { displaySlides.size })

    LaunchedEffect(displaySlides) {
        if (displaySlides.size > 1) {
            while (true) {
                delay(5000)
                val nextPage = (pagerState.currentPage + 1) % displaySlides.size
                pagerState.animateScrollToPage(nextPage)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .height(110.dp)
                .padding(horizontal = 0.dp) // padding removed to match BANNER_WIDTH logic
        ) { page ->
            val banner = displaySlides[page]
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 4.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.linearGradient(banner.colors))
                    .clickable {
                        // React Native L137-160: Banner Click Logic
                        // Navigates to link via router.push; support banners open support sheet instead
                        val isSupport = banner.id.contains("support", true) ||
                            banner.title?.contains("support", true) == true ||
                            banner.link?.contains("support", true) == true
                        if (isSupport && onOpenSupport != null) {
                            onOpenSupport()
                        } else if (!banner.link.isNullOrEmpty()) {
                            onBannerClick(banner.link)
                        }
                    }
            ) {
                if (!banner.imageUrl.isNullOrEmpty()) {
                    AsyncImage(
                        model = banner.imageUrl,
                        contentDescription = banner.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    // Left Content
                    Column(
                        modifier = Modifier
                            .align(Alignment.CenterStart)
                            .padding(20.dp),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White.copy(alpha = 0.2f))
                                    .padding(4.dp)
                            ) {
                                Text(text = banner.icon, fontSize = 14.sp, color = Color.White)
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = banner.title,
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = banner.subtitle.uppercase(),
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }
                    
                    // Decorative Background Icon
                    Text(
                        text = banner.icon,
                        fontSize = 100.sp,
                        color = Color.White.copy(alpha = 0.15f),
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .offset(x = 20.dp, y = 20.dp)
                            .rotate(12f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Indicator dots (React Native L205-214)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(displaySlides.size) { iteration ->
                val isSelected = pagerState.currentPage == iteration
                val color = if (isSelected) Color(0xFF1E293B) else Color(0xFFCBD5E1) // slate-800 / slate-300
                val width = if (isSelected) 24.dp else 6.dp
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .clip(CircleShape)
                        .background(color)
                        .height(6.dp)
                        .width(width)
                )
            }
        }
    }
}
