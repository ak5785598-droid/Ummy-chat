package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.util.CdnUtils

// ─────────────────────────────────────────────────────────────────────────────
// RoomBanners — mirrors RN room-banners.tsx
// Auto-scrolling vertical banner strip (75dp wide) for:
// Weekly Star, Aristocracy, Room Support, Golden Chest, Lucky Spin
// ─────────────────────────────────────────────────────────────────────────────

private data class BannerItemConfig(
    val id: String,
    val localDrawableRes: Int?,
    val defaultFallbackUrl: String? = null
)

private val STATIC_BANNERS = listOf(
    BannerItemConfig("weekly-star", R.drawable.banner_weekly_star),
    BannerItemConfig("merge-aristocracy", R.drawable.banner_aristocracy),
    BannerItemConfig("room-support", null, "https://ummy-chat.vercel.app/images/haza_style_room_support_lions_trophy_header_1776810688232.png"),
    BannerItemConfig("golden-chest", R.drawable.banner_golden_chest),
    BannerItemConfig("lucky-spin", R.drawable.banner_lucky_spin)
)

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun RoomBanners(
    onOpenSupport: () -> Unit = {},
    onOpenSpin: () -> Unit = {},
    onOpenChest: () -> Unit = {},
    onOpenAristocracy: () -> Unit = {},
    onOpenWeeklyStar: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val firestore = FirebaseFirestore.getInstance()
    var activeIndex by remember { mutableIntStateOf(0) }
    var dbSlides by remember { mutableStateOf<List<Map<String, Any>>>(emptyList()) }

    // Realtime listener for appConfig/roomBanners
    DisposableEffect(Unit) {
        val docRef = firestore.collection("appConfig").document("roomBanners")
        val registration = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener
            if (snapshot != null && snapshot.exists()) {
                @Suppress("UNCHECKED_CAST")
                val slides = snapshot.get("slides") as? List<Map<String, Any>>
                if (slides != null) {
                    dbSlides = slides
                }
            }
        }
        onDispose {
            registration.remove()
        }
    }

    // Auto-scroll every 4 seconds
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(4000)
            activeIndex = (activeIndex + 1) % STATIC_BANNERS.size
        }
    }

    val currentBanner = STATIC_BANNERS[activeIndex]

    // Resolve banner source URL or resource
    val customSlide = dbSlides.find { it["id"] == currentBanner.id }
    val customUrl = customSlide?.get("imageUrl")?.toString()?.trim()
    
    // Weekly Star and Golden Chest are forced local in React Native code
    val forceLocal = currentBanner.id == "weekly-star" || currentBanner.id == "golden-chest"
    val bannerImageUrl = if (customUrl != null && customUrl.isNotEmpty() && !forceLocal) customUrl else null

    Column(
        modifier = modifier.width(56.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Banner card with vertical slide transition
        AnimatedContent(
            targetState = currentBanner,
            transitionSpec = {
                slideInVertically { it } + fadeIn() togetherWith
                slideOutVertically { -it } + fadeOut()
            },
            label = "room_banner"
        ) { banner ->
            Box(
                modifier = Modifier
                    .width(56.dp)
                    .aspectRatio(5f / 6f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1E293B)) // Fallback slate bg
                    .clickable {
                        when (banner.id) {
                            "room-support"      -> onOpenSupport()
                            "lucky-spin"        -> onOpenSpin()
                            "golden-chest"      -> onOpenChest()
                            "merge-aristocracy" -> onOpenAristocracy()
                            "weekly-star"       -> onOpenWeeklyStar()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (bannerImageUrl != null) {
                    AsyncImage(
                        model = CdnUtils.toCdn(bannerImageUrl),
                        contentDescription = banner.id,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else if (banner.localDrawableRes != null) {
                    Image(
                        painter = painterResource(id = banner.localDrawableRes),
                        contentDescription = banner.id,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else if (banner.defaultFallbackUrl != null) {
                    AsyncImage(
                        model = CdnUtils.toCdn(banner.defaultFallbackUrl),
                        contentDescription = banner.id,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }

                // Shine overlay matches React Native shine
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(30.dp)
                        .align(Alignment.TopCenter)
                        .background(Color.White.copy(alpha = 0.08f))
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Dot indicators below the banner
        Row(
            modifier = Modifier,
            horizontalArrangement = Arrangement.spacedBy(3.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            STATIC_BANNERS.forEachIndexed { i, _ ->
                Box(
                    modifier = Modifier
                        .size(3.dp)
                        .clip(CircleShape)
                        .background(
                            if (i == activeIndex) Color.White.copy(alpha = 0.8f)
                            else Color.White.copy(alpha = 0.3f)
                        )
                )
            }
        }
    }
}
