package app.vercel.ummy_chat.twa.ui.components

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import app.vercel.ummy_chat.twa.R
import com.google.firebase.firestore.FirebaseFirestore

@Composable
fun SvipPillBadge(
    level: Int, 
    modifier: Modifier = Modifier, 
    badgeUrlOverride: String? = null
) {
    if (level !in 1..18) return // Limit: only show for levels 1-18

    val stripId = when (level) {
        1 -> R.drawable.svip_strip_1
        2 -> R.drawable.svip_strip_2
        3 -> R.drawable.svip_strip_3
        4 -> R.drawable.svip_strip_4
        5 -> R.drawable.svip_strip_5
        6 -> R.drawable.svip_strip_6
        7 -> R.drawable.svip_strip_7
        8 -> R.drawable.svip_strip_8
        9 -> R.drawable.svip_strip_9
        10 -> R.drawable.svip_strip_10
        11 -> R.drawable.svip_strip_11
        12 -> R.drawable.svip_strip_12
        13 -> R.drawable.svip_strip_13
        14 -> R.drawable.svip_strip_14
        15 -> R.drawable.svip_strip_15
        16 -> R.drawable.svip_strip_16
        17 -> R.drawable.svip_strip_17
        18 -> R.drawable.svip_strip_18
        else -> 0
    }
    
    // Real-time listener state for badgeUrl if not provided
    var badgeUrl by remember(level, badgeUrlOverride) { mutableStateOf(badgeUrlOverride) }

    DisposableEffect(level, badgeUrlOverride) {
        if (badgeUrlOverride == null) {
            val db = FirebaseFirestore.getInstance()
            val listener = db.document("settings/svipConfig").addSnapshotListener { snap, _ ->
                if (snap != null && snap.exists()) {
                    val levelsConfig = snap.get("levels") as? Map<*, *>
                    val currentLevelData = levelsConfig?.get(level.toString()) as? Map<*, *>
                    badgeUrl = currentLevelData?.get("badgeUrl") as? String
                }
            }
            onDispose {
                listener.remove()
            }
        } else {
            onDispose { }
        }
    }

    Box(
        modifier = modifier.width(75.dp).height(34.dp)
    ) {
        // The background strip (70x20) anchored to the right
        if (stripId != 0) {
            androidx.compose.foundation.Image(
                painter = painterResource(id = stripId),
                contentDescription = "SVIP $level",
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .width(70.dp)
                    .height(20.dp),
                contentScale = ContentScale.FillBounds
            )
        }
        
        // The logo (34x34) anchored directly to the left! 
        // No negative offsets used. It automatically sticks out by 5.dp.
        if (!badgeUrl.isNullOrBlank()) {
            val size = if (level in 16..18) 28.dp else 34.dp
            AsyncImage(
                model = badgeUrl,
                contentDescription = "Badge Logo",
                modifier = Modifier
                    .size(size)
                    .align(Alignment.CenterStart),
                contentScale = ContentScale.Fit
            )
        }
    }
}
