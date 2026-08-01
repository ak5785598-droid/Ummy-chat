package app.vercel.ummy_chat.twa.ui.home

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

data class BannerData(
    val title: String,
    val subtitle: String,
    val colors: List<Color>,
    val icon: String
)

val defaultBanners = listOf(
    BannerData(
        title = "Weekly Star",
        subtitle = "1:1,000,000",
        colors = listOf(Color(0xFF7C3AED), Color(0xFF4F46E5), Color(0xFF312E81)),
        icon = "⭐"
    ),
    BannerData(
        title = "Merge Aristocracy",
        subtitle = "EXCLUSIVE PERKS",
        colors = listOf(Color(0xFF1E40AF), Color(0xFF1E293B), Color(0xFF1E3A8A)),
        icon = "👑"
    ),
    BannerData(
        title = "Lucky Spin",
        subtitle = "TRY YOUR LUCK",
        colors = listOf(Color(0xFFF43F5E), Color(0xFFDC2626), Color(0xFF881337)),
        icon = "🎁"
    )
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun BannerCarousel() {
    val pagerState = rememberPagerState(pageCount = { defaultBanners.size })

    LaunchedEffect(pagerState) {
        while (true) {
            delay(5000)
            val nextPage = (pagerState.currentPage + 1) % defaultBanners.size
            pagerState.animateScrollToPage(nextPage)
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
                .padding(horizontal = 16.dp)
        ) { page ->
            val banner = defaultBanners[page]
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.linearGradient(banner.colors))
                    .padding(20.dp)
            ) {
                Column(
                    modifier = Modifier.align(Alignment.CenterStart),
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "${banner.icon} ${banner.title}",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = banner.subtitle.uppercase(),
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    text = banner.icon,
                    fontSize = 100.sp,
                    color = Color.White.copy(alpha = 0.15f),
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .offset(x = 20.dp, y = 10.dp)
                        .rotate(12f)
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(defaultBanners.size) { iteration ->
                val color = if (pagerState.currentPage == iteration) Color.DarkGray else Color.LightGray
                val width = if (pagerState.currentPage == iteration) 24.dp else 6.dp
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
