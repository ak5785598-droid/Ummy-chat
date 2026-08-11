package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.layout
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.runtime.*
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asComposePath
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.core.graphics.PathParser
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.zIndex

// ==========================================
// 1. Gender/Age Tag
// ==========================================
@Composable
fun GenderAgeTag(gender: String?, age: Int?) {
    val isFemale = gender == "Female"
    val bgColor = if (isFemale) Color(0xFFEC4899) else Color(0xFF3B82F6)
    val symbol = if (isFemale) "\u2640" else "\u2642"

    Row(
        modifier = Modifier
            .height(18.dp)
            .then(if (age == null) Modifier.width(18.dp) else Modifier)
            .background(bgColor, CircleShape)
            .then(if (age != null) Modifier.padding(horizontal = 6.dp) else Modifier),
        horizontalArrangement = if (age != null) Arrangement.spacedBy(2.dp) else Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = symbol,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.offset(y = (-1).dp)
        )
        if (age != null) {
            Text(
                text = "$age",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.ExtraBold
            )
        }
    }
}

// ==========================================
// 2. User Level Badge
// ==========================================
// Helper to parse points string into a Compose Path
private fun parsePolygonPoints(pointsStr: String): Path {
    val path = Path()
    val coords = pointsStr.trim().split(Regex("[,\\s]+")).mapNotNull { it.toFloatOrNull() }
    if (coords.size >= 2) {
        path.moveTo(coords[0], coords[1])
        var i = 2
        while (i < coords.size) {
            if (i + 1 < coords.size) {
                path.lineTo(coords[i], coords[i + 1])
            }
            i += 2
        }
        path.close()
    }
    return path
}

@Composable
fun UserLevelBadge(level: Int, scale: Float = 1f) {
    val infiniteTransition = rememberInfiniteTransition(label = "badge_anims")
    
    // Scale pulse: 1f to 1.08f (2400ms repeat spec)
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )
    
    // Rotation loop for aura: 0f to 360f (3500ms duration)
    val rotateAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(3500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotate"
    )
    
    // Fast spin loop for stars/details: 0f to 360f (2500ms duration)
    val spinAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "spin"
    )

    // Shine sweep: -1f to 2.2f (1500ms duration)
    val shineOffset by infiniteTransition.animateFloat(
        initialValue = -1f,
        targetValue = 2.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shine"
    )

    // Floating particles progress: 0f to 1f
    val particle1Progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "p1"
    )
    val particle2Progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing, delayMillis = 1000),
            repeatMode = RepeatMode.Restart
        ),
        label = "p2"
    )

    // Size parameters (React Native shieldSize = 26 * scale, pillHeight = 15 * scale, pillWidth = 36 * scale)
    val shieldSize = 26f * scale
    val pillHeight = 15f * scale
    val pillWidth = 36f * scale
    val totalWidth = shieldSize + pillWidth - 6f * scale

    // Brackets checks
    val isLevel11To20 = level in 11..20
    val isLevel21To30 = level in 21..30
    val isLevel31To40 = level in 31..40
    val isLevel41To50 = level in 41..50
    val isLevel51To60 = level in 51..60
    val isLevel61To70 = level in 61..70
    val isLevel71To80 = level in 71..80
    val isLevel81To90 = level in 81..90
    val isLevel91To100 = level in 91..100
    val showShadow = level >= 31
    val showBevel = level >= 61
    val showGlossy = level >= 61

    // Configurations based on level range
    var shieldColors = listOf(Color(0xFFa3f7bf), Color(0xFF2e7d32), Color(0xFF1b5e20)) // Default 0-10 (Green)
    var wreathColor = Color(0xFFc4f4d2)
    var starColor = Color.White
    var pillGradient = listOf(Color(0xFF0a2e10), Color(0xFF031406)) // Dark green
    var pillBorder = Color(0xFF1b5e20)
    var textColor = Color(0xFFa3f7bf)
    var particleColor = Color(0xFFa3f7bf)

    when {
        isLevel11To20 -> {
            shieldColors = listOf(Color(0xFFe0f2fe), Color(0xFF0284c7), Color(0xFF0c4a6e))
            wreathColor = Color(0xFFbae6fd)
            starColor = Color(0xFFfbbf24)
            pillGradient = listOf(Color(0xFF00264d), Color(0xFF000f24))
            pillBorder = Color(0xFF0284c7)
            textColor = Color(0xFFe0f2fe)
            particleColor = Color(0xFF00f0ff)
        }
        isLevel21To30 -> {
            shieldColors = listOf(Color(0xFFf5e0ff), Color(0xFF8b5cf6), Color(0xFF4c1d95))
            wreathColor = Color(0xFFe9d5ff)
            pillGradient = listOf(Color(0xFF2e0c59), Color(0xFF14002c))
            pillBorder = Color(0xFF8b5cf6)
            textColor = Color(0xFFf5e0ff)
            particleColor = Color(0xFFdfa3ff)
        }
        isLevel31To40 -> {
            shieldColors = listOf(Color(0xFFffecd9), Color(0xFFff6b3b), Color(0xFFb31400))
            wreathColor = Color(0xFFfbcfe8)
            pillGradient = listOf(Color(0xFF4d0505), Color(0xFF240000))
            pillBorder = Color(0xFFf43f5e)
            textColor = Color.White
            particleColor = Color(0xFFffd6e8)
        }
        isLevel41To50 -> {
            shieldColors = listOf(Color(0xFFfffbeb), Color(0xFFd97706), Color(0xFF78350f))
            wreathColor = Color(0xFFfbbf24)
            pillGradient = listOf(Color(0xFF4d2600), Color(0xFF241100))
            pillBorder = Color(0xFFfbbf24)
            textColor = Color(0xFFfffbeb)
            particleColor = Color(0xFFfcd34d)
        }
        isLevel51To60 -> {
            shieldColors = listOf(Color(0xFFe2fcf0), Color(0xFF10b981), Color(0xFF064e3b))
            wreathColor = Color(0xFFfbbf24)
            pillGradient = listOf(Color(0xFF023826), Color(0xFF011b12))
            pillBorder = Color(0xFF10b981)
            textColor = Color(0xFFe2fcf0)
            particleColor = Color(0xFF34d399)
        }
        isLevel61To70 -> {
            shieldColors = listOf(Color(0xFFe0f7fa), Color(0xFF0097a7), Color(0xFF00363a))
            wreathColor = Color(0xFFe2e8f0)
            pillGradient = listOf(Color(0xFF004d5a), Color(0xFF00252c))
            pillBorder = Color(0xFF00acc1)
            textColor = Color(0xFFe0f7fa)
            particleColor = Color(0xFF22d3ee)
        }
        isLevel71To80 -> {
            shieldColors = listOf(Color(0xFFffd54f), Color(0xFFb78700), Color(0xFF5e4300))
            wreathColor = Color(0xFFb59049)
            pillGradient = listOf(Color(0xFF5e0f35), Color(0xFF2b0215))
            pillBorder = Color(0xFF9d174d)
            textColor = Color(0xFFfbcfe8)
            particleColor = Color(0xFFf472b6)
        }
        isLevel81To90 -> {
            shieldColors = listOf(Color(0xFFf0fdfa), Color(0xFFa5f3fc), Color(0xFF0891b2))
            wreathColor = Color(0xFFcbd5e1)
            pillGradient = listOf(Color(0xFF044237), Color(0xFF01241e))
            pillBorder = Color(0xFF14b8a6)
            textColor = Color(0xFFe0fdfa)
            particleColor = Color(0xFF38bdf8)
        }
        isLevel91To100 -> {
            shieldColors = listOf(Color(0xFF8b5cf6), Color(0xFF4c1d95), Color(0xFF1e1b4b))
            wreathColor = Color(0xFFfbbf24)
            pillGradient = listOf(Color(0xFF2e0c59), Color(0xFF14002c))
            pillBorder = Color(0xFFfbbf24)
            textColor = Color(0xFFfffbeb)
            particleColor = Color(0xFFfbbf24)
        }
        level > 100 -> {
            shieldColors = listOf(Color(0xFFfbcfe8), Color(0xFFf43f5e), Color(0xFF881337))
            wreathColor = Color(0xFFfce7f3)
            pillGradient = listOf(Color(0xFF500724), Color(0xFF24000d))
            pillBorder = Color(0xFFf43f5e)
            textColor = Color(0xFFfbcfe8)
            particleColor = Color(0xFFf43f5e)
        }
    }

    // Pre-parse and cache Paths to prevent parsing on every frame draw
    val parsedPaths = remember(level) {
        val paths = mutableMapOf<String, Path>()
        fun parse(key: String, data: String) {
            try {
                paths[key] = PathParser.createPathFromPathData(data).asComposePath()
            } catch (_: Exception) {}
        }

        when {
            isLevel11To20 -> {
                parse("left_wing", "M 32,50 L 14,41 L 28,38 L 10,26 L 28,24 C 18,37 18,45 32,50 Z")
                parse("left_wing_det", "M 28,32 L 16,35 L 24,23")
                parse("right_wing", "M 68,50 L 86,41 L 72,38 L 90,26 L 72,24 C 82,37 82,45 68,50 Z")
                parse("right_wing_det", "M 72,32 L 84,35 L 76,23")
                parse("bottom", "M 36,68 L 50,84 L 64,68 L 50,76 Z")
            }
            isLevel21To30 -> {
                parse("left_wing", "M 32,48 C 18,48 10,36 22,20 C 15,30 20,38 32,40 L 14,30 L 28,32 Z")
                parse("left_wing_det", "M 20,32 L 26,24")
                parse("right_wing", "M 68,48 C 82,48 90,36 78,20 C 85,30 80,38 68,40 L 86,30 L 72,32 Z")
                parse("right_wing_det", "M 80,32 L 74,24")
                parse("bottom", "M 32,64 L 50,84 L 68,64 L 50,74 L 42,70 L 58,70 Z")
                parse("moon", "M 64,48 C 64,57 56,64 47,64 C 42,64 38,61 35,56 C 45,56 52,48 52,38 C 52,33 49,29 45,26 C 56,27 64,36 64,48 Z")
            }
            isLevel31To40 -> {
                parse("tip_l", "M 24,24 C 23,23 22,22 23,21 C 23,22 24,22 24,23 Z")
                parse("tip_r", "M 76,24 C 77,23 78,22 77,21 C 77,22 76,22 76,23 Z")
                parse("flower", "M 50,12 C 41,10 34,18 30,22 C 22,18 16,24 18,32 C 10,34 8,42 14,48 C 8,54 10,62 18,64 C 16,72 22,78 30,74 C 34,78 41,86 50,84 C 59,86 66,78 70,74 C 78,78 84,72 82,64 C 90,62 92,54 86,48 C 92,42 90,34 82,32 C 84,24 78,18 70,22 C 66,18 59,10 50,12 Z")
                parse("flower_high", "M 50,18 C 43,16 38,22 34,26 C 27,22 22,27 24,34 C 17,36 15,42 20,47 C 15,52 17,58 24,60 C 22,67 27,71 34,68 C 38,72 43,78 50,77 C 57,77 62,72 66,68 C 73,71 78,67 76,60 C 83,58 85,52 80,47 C 85,42 83,36 76,34 C 78,27 73,22 66,26 C 62,22 57,16 50,18 Z")
                parse("spark", "M 36,38 C 36,32 42,28 48,28 C 45,28 40,32 38,36 C 36,40 39,43 39,43 C 39,43 36,42 36,38 Z")
            }
            isLevel41To50 -> {
                parse("l_wing1", "M 28,52 C 16,48 12,42 15,32 C 18,36 14,40 28,44")
                parse("l_wing2", "M 24,40 C 16,38 14,32 19,28 C 21,32 16,34 26,34")
                parse("l_wing3", "M 26,62 C 16,60 12,50 16,38")
                parse("r_wing1", "M 72,52 C 84,48 88,42 85,32 C 82,36 86,40 72,44")
                parse("r_wing2", "M 76,40 C 84,38 86,32 81,28 C 79,32 84,34 74,34")
                parse("r_wing3", "M 74,62 C 84,60 88,50 84,38")
                parse("crown_base", "M 32,70 C 50,84 50,84 68,70")
                parse("crown_det", "M 40,78 L 50,92 L 60,78 Z")
                
                paths["poly1"] = parsePolygonPoints("50,23 68,36 50,71 32,36")
                paths["poly2"] = parsePolygonPoints("50,23 62,36 38,36")
                paths["poly3"] = parsePolygonPoints("50,23 38,36 32,36")
                paths["poly4"] = parsePolygonPoints("50,23 62,36 68,36")
                paths["poly5"] = parsePolygonPoints("38,36 62,36 50,71")
                paths["poly6"] = parsePolygonPoints("32,36 38,36 50,71")
                paths["poly7"] = parsePolygonPoints("68,36 62,36 50,71")
            }
            isLevel51To60 -> {
                parse("l_wing1", "M 28,52 C 16,48 12,40 15,30 C 18,34 14,38 28,42")
                parse("l_wing2", "M 24,38 C 16,34 14,28 19,24 C 21,28 16,30 26,32")
                parse("l_leaf", "M 20,44 L 16,34 L 22,32 C 18,38 18,40 20,44 Z")
                parse("l_wing3", "M 26,62 C 14,60 10,48 14,34")
                parse("r_wing1", "M 72,52 C 84,48 88,40 85,30 C 82,34 86,38 72,42")
                parse("r_wing2", "M 76,38 C 84,34 86,28 81,24 C 79,28 84,30 74,32")
                parse("r_leaf", "M 80,44 L 84,34 L 78,32 C 82,38 82,40 80,44 Z")
                parse("r_wing3", "M 74,62 C 86,60 90,48 86,34")
                parse("crown_base", "M 32,70 C 50,84 50,84 68,70")
                parse("crown_det", "M 40,78 L 50,92 L 60,78 Z")
                
                paths["poly1"] = parsePolygonPoints("50,22 50,48 34,32")
                paths["poly2"] = parsePolygonPoints("50,22 50,48 66,32")
                paths["poly3"] = parsePolygonPoints("74,48 50,48 66,32")
                paths["poly4"] = parsePolygonPoints("74,48 50,48 66,64")
                paths["poly5"] = parsePolygonPoints("50,74 50,48 66,64")
                paths["poly6"] = parsePolygonPoints("50,74 50,48 34,64")
                paths["poly7"] = parsePolygonPoints("26,48 50,48 34,64")
                paths["poly8"] = parsePolygonPoints("26,48 50,48 34,32")
            }
            isLevel61To70 -> {
                parse("l_wing1", "M 28,52 C 16,48 12,38 15,28 C 18,32 14,36 28,40")
                parse("l_wing2", "M 24,36 C 16,32 14,26 19,20 C 21,24 16,26 26,28")
                parse("l_leaf", "M 18,40 L 15,30 L 22,28 C 18,34 18,36 18,40 Z")
                parse("l_wing3", "M 26,62 C 12,60 8,46 12,32")
                parse("r_wing1", "M 72,52 C 84,48 88,38 85,28 C 82,32 86,36 72,40")
                parse("r_wing2", "M 76,36 C 84,32 86,26 81,20 C 79,24 84,26 74,28")
                parse("r_leaf", "M 82,40 L 85,30 L 78,28 C 82,34 82,36 82,40 Z")
                parse("r_wing3", "M 74,62 C 88,60 92,46 88,32")
                parse("crown_base", "M 32,70 C 50,84 50,84 68,70")
                parse("crown_det", "M 40,78 L 50,92 L 60,78 Z")
                
                paths["poly1"] = parsePolygonPoints("50,23 50,48 38,38")
                paths["poly2"] = parsePolygonPoints("50,23 50,48 62,38")
                paths["poly3"] = parsePolygonPoints("75,48 50,48 62,38")
                paths["poly4"] = parsePolygonPoints("75,48 50,48 62,58")
                paths["poly5"] = parsePolygonPoints("50,73 50,48 62,58")
                paths["poly6"] = parsePolygonPoints("50,73 50,48 38,58")
                paths["poly7"] = parsePolygonPoints("25,48 50,48 38,58")
                paths["poly8"] = parsePolygonPoints("25,48 50,48 38,38")
            }
            isLevel71To80 -> {
                parse("shield", "M 50,15 L 85,25 C 80,55 70,75 50,92 C 30,75 20,55 15,25 Z")
                parse("inner_shield", "M 50,22 L 78,30 C 74,54 66,72 50,86 C 34,72 26,54 22,30 Z")
            }
            isLevel81To90 -> {
                parse("l_wing1", "M 28,52 C 16,48 12,40 15,30 C 18,34 14,38 28,40")
                parse("l_wing2", "M 24,38 C 16,34 14,28 19,22 C 21,26 16,28 26,30")
                parse("l_wing3", "M 20,24 C 16,24 14,20 19,16 C 21,18 18,20 24,20")
                parse("r_wing1", "M 72,52 C 84,48 88,40 85,30 C 82,34 86,38 72,40")
                parse("r_wing2", "M 76,38 C 84,34 86,28 81,22 C 79,26 84,28 74,30")
                parse("r_wing3", "M 80,24 C 84,24 86,20 81,16 C 79,18 82,20 76,20")
                parse("crown_base", "M 32,70 C 50,84 50,84 68,70")
                parse("crown_det", "M 40,78 L 50,92 L 60,78 Z")
                
                paths["poly_base"] = parsePolygonPoints("50,25 65,38 50,71 35,38")
                paths["poly1"] = parsePolygonPoints("50,25 50,48 35,38")
                paths["poly2"] = parsePolygonPoints("50,25 50,48 65,38")
                paths["poly3"] = parsePolygonPoints("65,38 50,48 50,71")
                paths["poly4"] = parsePolygonPoints("35,38 50,48 50,71")
            }
            isLevel91To100 -> {
                parse("scepter1", "M 15,13 L 80,78")
                parse("scepter1_head", "M 12,6 L 12,14 M 8,10 L 16,10")
                parse("scepter1_hilt", "M 66,64 L 74,58")
                parse("scepter2", "M 85,13 L 20,78")
                parse("scepter2_head", "M 88,6 L 88,14 M 84,10 L 92,10")
                parse("scepter2_hilt", "M 34,64 L 26,58")
                
                parse("l_wing1", "M 28,52 C 10,48 2,36 4,24 C 6,36 12,44 28,42")
                parse("l_wing2", "M 26,60 C 8,56 4,46 6,34 C 10,44 14,50 26,48")
                parse("l_wing3", "M 26,68 C 10,64 8,56 12,44")
                
                parse("r_wing1", "M 72,52 C 90,48 98,36 96,24 C 94,36 88,44 72,42")
                parse("r_wing2", "M 74,60 C 92,56 96,46 94,34 C 90,44 86,50 74,48")
                parse("r_wing3", "M 74,68 C 90,64 92,56 88,44")
                
                parse("crown_base", "M 32,18 C 50,22 50,22 68,18 L 66,14 C 50,18 50,18 34,14 Z")
                parse("crown_spikes", "M 34,14 L 30,2 L 42,9 L 50,-4 L 58,9 L 70,2 L 66,14 Z")
                
                parse("t_base", "M 30,76 Q 50,88 70,76")
                parse("t_left", "M 40,76 Q 33,93 36,95 Q 42,87 45,76 Z")
                parse("t_right", "M 60,76 Q 67,93 64,95 Q 58,87 55,76 Z")
                parse("t_center", "M 46,78 Q 50,99 50,99 Q 54,78 54,78 Z")
                
                parse("bird_body", "M 50,38 L 56,54 L 50,66 L 44,54 Z")
                parse("bird_chest", "M 47,44 Q 50,47 53,44 M 46,49 Q 50,53 54,49 M 48,54 Q 50,57 52,54")
                parse("bird_medal", "M 50,44 L 52,49 L 57,51 L 52,53 L 50,58 L 48,53 L 43,51 L 48,49 Z")
                parse("bird_neck", "M 47,38 C 47,32 53,32 53,27 L 50,27 C 48,27 47,29 47,38 Z")
                parse("bird_head", "M 50,26 C 53,26 55,29 53,32 L 50,38 C 48,34 48,30 50,26 Z")
                parse("bird_beak", "M 48,28 L 42,31 L 47,33 Z")
                parse("bird_wing_l", "M 46,35 C 38,30 32,36 34,45 C 41,41 43,44 46,39 Z")
                parse("bird_wing_r", "M 54,35 C 62,30 68,36 66,45 C 59,41 57,44 54,39 Z")
                parse("bird_wing_high", "M 37,42 Q 41,39 44,41 M 63,42 Q 59,39 56,41")
                
                parse("dome_reflect", "M 22,35 C 32,22 68,22 78,35 C 70,25 30,25 22,35 Z")
            }
            else -> {
                // Default 0-10 Laurel Wreath
                parse("wreath_l", "M 13,65 C -2,50 3,25 24,20 C 19,35 21,50 31,58")
                parse("leaves_l", "M 0,45 C 2,40 10,42 14,48 M 4,30 C 8,28 14,34 16,40")
                parse("wreath_r", "M 87,65 C 102,50 97,25 76,20 C 81,35 79,50 69,58")
                parse("leaves_r", "M 100,45 C 98,40 90,42 86,48 M 96,30 C 92,28 86,34 84,40")
                parse("ribbon", "M 28,76 C 50,88 50,88 72,76")
            }
        }
        
        // Star fallback path
        parse("star", "M 50,30 L 55,41 L 67,43 L 58,51 L 60,63 L 50,57 L 40,63 L 42,51 L 33,43 L 45,41 Z")
        
        paths
    }

    // Floating particles drift translation offsets
    val p1TranslationX = if (isLevel31To40 || isLevel41To50 || isLevel51To60 || isLevel61To70 || isLevel71To80 || isLevel81To90 || isLevel91To100) {
        -20f * scale * particle1Progress
    } else if (isLevel21To30) {
        -18f * scale * particle1Progress
    } else {
        -14f * scale * particle1Progress
    }
    val p1TranslationY = if (isLevel31To40 || isLevel41To50 || isLevel51To60 || isLevel61To70 || isLevel71To80 || isLevel81To90 || isLevel91To100) {
        -24f * scale * particle1Progress
    } else if (isLevel21To30) {
        -22f * scale * particle1Progress
    } else {
        -18f * scale * particle1Progress
    }
    val p1Opacity = when {
        particle1Progress < 0.2f -> particle1Progress / 0.2f
        particle1Progress > 0.8f -> (1f - particle1Progress) / 0.2f
        else -> 1f
    }

    val p2TranslationX = if (isLevel31To40 || isLevel41To50 || isLevel51To60 || isLevel61To70 || isLevel71To80 || isLevel81To90 || isLevel91To100) {
        24f * scale * particle2Progress
    } else if (isLevel21To30) {
        22f * scale * particle2Progress
    } else {
        18f * scale * particle2Progress
    }
    val p2TranslationY = if (isLevel31To40 || isLevel41To50 || isLevel51To60 || isLevel61To70 || isLevel71To80 || isLevel81To90 || isLevel91To100) {
        -26f * scale * particle2Progress
    } else if (isLevel21To30) {
        -24f * scale * particle2Progress
    } else {
        -20f * scale * particle2Progress
    }
    val p2Opacity = when {
        particle2Progress < 0.2f -> particle2Progress / 0.2f
        particle2Progress > 0.8f -> (1f - particle2Progress) / 0.2f
        else -> 1f
    }

    Box(
        modifier = Modifier
            .size(width = totalWidth.dp, height = shieldSize.dp)
            .graphicsLayer {
                scaleX = pulseScale
                scaleY = pulseScale
            },
        contentAlignment = Alignment.CenterStart
    ) {
        
        // ─── 1. Animated Glow Aura ───
        Box(
            modifier = Modifier
                .offset(x = (4 * scale).dp, y = (4 * scale).dp)
                .size((shieldSize - 8 * scale).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(shieldColors[0].copy(alpha = if (isLevel31To40) 0.6f else 0.4f), Color.Transparent)
                    ),
                    shape = CircleShape
                )
        )

        // ─── 2. Floating Star Particles ───
        Box(
            modifier = Modifier
                .offset(
                    x = (shieldSize / 2f + p1TranslationX).dp,
                    y = (shieldSize / 2f + p1TranslationY).dp
                )
                .graphicsLayer { alpha = p1Opacity }
        ) {
            Text(
                text = "✦",
                color = particleColor,
                fontSize = (if (isLevel31To40) 8.5f * scale else 6f * scale).sp,
                fontWeight = FontWeight.Bold
            )
        }

        Box(
            modifier = Modifier
                .offset(
                    x = (shieldSize / 2f + p2TranslationX).dp,
                    y = (shieldSize / 2f + p2TranslationY).dp
                )
                .graphicsLayer { alpha = p2Opacity }
        ) {
            Text(
                text = "✦",
                color = particleColor,
                fontSize = (if (isLevel31To40) 7.5f * scale else 5f * scale).sp,
                fontWeight = FontWeight.Bold
            )
        }

        // ─── 3. Pill Capsule ───
        Box(
            modifier = Modifier
                .offset(x = (shieldSize / 2f).dp)
                .height(pillHeight.dp)
                .width(pillWidth.dp)
                .then(
                    if (showShadow) Modifier.shadow(
                        elevation = (2.5f * scale).dp,
                        shape = RoundedCornerShape((pillHeight / 2f).dp)
                    ) else Modifier
                )
                .clip(RoundedCornerShape((pillHeight / 2f).dp))
                .border(
                    width = 1.8.dp,
                    brush = Brush.verticalGradient(
                        colors = if (showBevel) listOf(Color.White.copy(alpha = 0.5f), Color.Black.copy(alpha = 0.65f))
                                 else listOf(pillBorder, pillBorder)
                    ),
                    shape = RoundedCornerShape((pillHeight / 2f).dp)
                )
                .background(Brush.horizontalGradient(colors = pillGradient)),
            contentAlignment = Alignment.CenterEnd
        ) {
            // Shiny sweep overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        translationX = totalWidth * scale * shineOffset
                    }
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(Color.Transparent, Color.White.copy(alpha = 0.45f), Color.Transparent)
                        )
                    )
            )

            // Glossy reflect
            if (showGlossy) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight(0.48f)
                        .align(Alignment.TopCenter)
                        .background(Color.White.copy(alpha = 0.08f))
                        .drawBehind {
                            drawLine(
                                color = Color.White.copy(alpha = 0.15f),
                                start = Offset(0f, size.height),
                                end = Offset(size.width, size.height),
                                strokeWidth = 0.5f * scale
                            )
                        }
                )
            }

            // Level text inside capsule
            Text(
                text = "Lv.$level",
                color = textColor,
                fontSize = (7.5f * scale).sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 0.1.sp,
                textAlign = TextAlign.Center,
                style = TextStyle(
                    platformStyle = PlatformTextStyle(
                        includeFontPadding = false
                    )
                ),
                modifier = Modifier.padding(end = (4.5f * scale).dp)
            )
        }

        // ─── 4. Shield / Wreath drawing Canvas ───
        Canvas(modifier = Modifier.size(shieldSize.dp)) {
            val scaleFactor = size.width / 100f
            
            withTransform({
                scale(scaleFactor, scaleFactor, pivot = Offset.Zero)
            }) {
                val shieldRadius = if (level <= 11) 35f else if (isLevel91To100) 33f else 23f
                val shieldBrush = Brush.radialGradient(
                    colors = shieldColors,
                    center = Offset(50f, 48f),
                    radius = shieldRadius
                )

                val wreathBrush = Brush.linearGradient(
                    colors = listOf(Color.White, wreathColor),
                    start = Offset(0f, 0f),
                    end = Offset(100f, 100f)
                )

                val goldStarBrush = Brush.linearGradient(
                    colors = listOf(Color(0xFFFFE082), Color(0xFFFFB300), Color(0xFFFF6F00)),
                    start = Offset(0f, 0f),
                    end = Offset(100f, 100f)
                )

                val moonGoldBrush = Brush.linearGradient(
                    colors = listOf(Color(0xFFFFE5A3), Color(0xFFF5B041), Color(0xFF9A5F00)),
                    start = Offset(0f, 0f),
                    end = Offset(100f, 100f)
                )

                when {
                    isLevel11To20 -> {
                        parsedPaths["left_wing"]?.let { drawPath(it, wreathBrush) }
                        parsedPaths["left_wing"]?.let { drawPath(it, Color(0xFF00D2FF), style = Stroke(4.5f)) }
                        parsedPaths["left_wing_det"]?.let { drawPath(it, Color.White, style = Stroke(2.5f)) }
                        
                        parsedPaths["right_wing"]?.let { drawPath(it, wreathBrush) }
                        parsedPaths["right_wing"]?.let { drawPath(it, Color(0xFF00D2FF), style = Stroke(4.5f)) }
                        parsedPaths["right_wing_det"]?.let { drawPath(it, Color.White, style = Stroke(2.5f)) }
                        
                        parsedPaths["bottom"]?.let { drawPath(it, Color(0xFF00D2FF)) }
                        parsedPaths["bottom"]?.let { drawPath(it, Color(0xFFE0F2FE), style = Stroke(3f)) }
                    }
                    isLevel21To30 -> {
                        parsedPaths["left_wing"]?.let { drawPath(it, wreathBrush) }
                        parsedPaths["left_wing"]?.let { drawPath(it, Color(0xFFA855F7), style = Stroke(4.5f)) }
                        parsedPaths["left_wing_det"]?.let { drawPath(it, Color.White, style = Stroke(2.5f)) }
                        
                        parsedPaths["right_wing"]?.let { drawPath(it, wreathBrush) }
                        parsedPaths["right_wing"]?.let { drawPath(it, Color(0xFFA855F7), style = Stroke(4.5f)) }
                        parsedPaths["right_wing_det"]?.let { drawPath(it, Color.White, style = Stroke(2.5f)) }
                        
                        parsedPaths["bottom"]?.let { drawPath(it, Color(0xFFA855F7)) }
                        parsedPaths["bottom"]?.let { drawPath(it, Color(0xFFF5E0FF), style = Stroke(3f)) }
                    }
                    isLevel31To40 -> {
                        parsedPaths["tip_l"]?.let { drawPath(it, Color(0xFFFDD835)) }
                        parsedPaths["tip_l"]?.let { drawPath(it, Color(0xFFF57F17), style = Stroke(1f)) }
                        parsedPaths["tip_r"]?.let { drawPath(it, Color(0xFFFDD835)) }
                        parsedPaths["tip_r"]?.let { drawPath(it, Color(0xFFF57F17), style = Stroke(1f)) }
                        
                        parsedPaths["flower"]?.let { drawPath(it, Color(0xFFFBCFE8)) }
                        parsedPaths["flower"]?.let { drawPath(it, Color(0xFFF43F5E), style = Stroke(4f)) }
                        parsedPaths["flower_high"]?.let { drawPath(it, Color(0xFFFFE4E6), style = Stroke(1.8f)) }
                    }
                    isLevel41To50 -> {
                        parsedPaths["l_wing1"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(4.5f)) }
                        parsedPaths["l_wing2"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4f)) }
                        parsedPaths["l_wing3"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(3f)) }
                        
                        parsedPaths["r_wing1"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(4.5f)) }
                        parsedPaths["r_wing2"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4f)) }
                        parsedPaths["r_wing3"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(3f)) }
                        
                        parsedPaths["crown_base"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(5.5f)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(2.5f)) }
                    }
                    isLevel51To60 -> {
                        parsedPaths["l_wing1"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(5f)) }
                        parsedPaths["l_wing2"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4.5f)) }
                        parsedPaths["l_leaf"]?.let { drawPath(it, Color(0xFF10B981)) }
                        parsedPaths["l_leaf"]?.let { drawPath(it, Color(0xFF047857), style = Stroke(1.5f)) }
                        parsedPaths["l_wing3"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(3f)) }
                        
                        parsedPaths["r_wing1"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(5f)) }
                        parsedPaths["r_wing2"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4.5f)) }
                        parsedPaths["r_leaf"]?.let { drawPath(it, Color(0xFF10B981)) }
                        parsedPaths["r_leaf"]?.let { drawPath(it, Color(0xFF047857), style = Stroke(1.5f)) }
                        parsedPaths["r_wing3"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(3f)) }
                        
                        parsedPaths["crown_base"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(5.5f)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFF10B981)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(2.5f)) }
                    }
                    isLevel61To70 -> {
                        parsedPaths["l_wing1"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(5f)) }
                        parsedPaths["l_wing2"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(4.5f)) }
                        parsedPaths["l_leaf"]?.let { drawPath(it, Color(0xFF22D3EE)) }
                        parsedPaths["l_leaf"]?.let { drawPath(it, Color(0xFF0891B2), style = Stroke(1.5f)) }
                        parsedPaths["l_wing3"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(3f)) }
                        
                        parsedPaths["r_wing1"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(5f)) }
                        parsedPaths["r_wing2"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(4.5f)) }
                        parsedPaths["r_leaf"]?.let { drawPath(it, Color(0xFF22D3EE)) }
                        parsedPaths["r_leaf"]?.let { drawPath(it, Color(0xFF0891B2), style = Stroke(1.5f)) }
                        parsedPaths["r_wing3"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(3f)) }
                        
                        parsedPaths["crown_base"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(5.5f)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFF22D3EE)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(2.5f)) }
                    }
                    isLevel71To80 -> {
                        parsedPaths["shield"]?.let { drawPath(it, Color(0xFF5C441C)) }
                        parsedPaths["shield"]?.let { drawPath(it, Color(0xFFB59049), style = Stroke(4f)) }
                        parsedPaths["inner_shield"]?.let { drawPath(it, Color(0xFFFFE082), style = Stroke(1.8f)) }
                        
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(26f, 32f))
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(74f, 32f))
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(32f, 50f))
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(68f, 50f))
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(40f, 68f))
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(60f, 68f))
                        
                        drawCircle(Color(0xFFFFD700), 3.5f, Offset(50f, 84f))
                        drawCircle(Color(0xFFB59049), 3.5f, Offset(50f, 84f), style = Stroke(1f))
                    }
                    isLevel81To90 -> {
                        parsedPaths["l_wing1"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(5f)) }
                        parsedPaths["l_wing2"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(4.5f)) }
                        parsedPaths["l_wing3"]?.let { drawPath(it, Color(0xFFF1F5F9), style = Stroke(3f)) }
                        
                        parsedPaths["r_wing1"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(5f)) }
                        parsedPaths["r_wing2"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(4.5f)) }
                        parsedPaths["r_wing3"]?.let { drawPath(it, Color(0xFFF1F5F9), style = Stroke(3f)) }
                        
                        parsedPaths["crown_base"]?.let { drawPath(it, Color(0xFFCBD5E1), style = Stroke(5.5f)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFFCBD5E1)) }
                        parsedPaths["crown_det"]?.let { drawPath(it, Color(0xFF94A3B8), style = Stroke(2.5f)) }
                    }
                    isLevel91To100 -> {
                        parsedPaths["scepter1"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(2.5f)) }
                        drawCircle(Color(0xFFFBBF24), 3.8f, Offset(12f, 10f), style = Stroke(1.8f))
                        drawLine(Color(0xFFFBBF24), Offset(12f, 6f), Offset(12f, 14f), strokeWidth = 1f)
                        drawLine(Color(0xFFFBBF24), Offset(8f, 10f), Offset(16f, 10f), strokeWidth = 1f)
                        drawCircle(Color(0xFFA78BFA), 1.5f, Offset(12f, 10f))
                        parsedPaths["scepter1_hilt"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(3f)) }
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(80f, 78f))
                        drawCircle(Color(0xFFD97706), 2.5f, Offset(80f, 78f), style = Stroke(0.8f))
                        
                        parsedPaths["scepter2"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(2.5f)) }
                        drawCircle(Color(0xFFFBBF24), 3.8f, Offset(88f, 10f), style = Stroke(1.8f))
                        drawLine(Color(0xFFFBBF24), Offset(88f, 6f), Offset(88f, 14f), strokeWidth = 1f)
                        drawLine(Color(0xFFFBBF24), Offset(84f, 10f), Offset(92f, 10f), strokeWidth = 1f)
                        drawCircle(Color(0xFFA78BFA), 1.5f, Offset(88f, 10f))
                        parsedPaths["scepter2_hilt"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(3f)) }
                        drawCircle(Color(0xFFFFD700), 2.5f, Offset(20f, 78f))
                        drawCircle(Color(0xFFD97706), 2.5f, Offset(20f, 78f), style = Stroke(0.8f))
                        
                        parsedPaths["l_wing1"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4.5f)) }
                        parsedPaths["l_wing2"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(4f)) }
                        parsedPaths["l_wing3"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(3f)) }
                        
                        parsedPaths["r_wing1"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4.5f)) }
                        parsedPaths["r_wing2"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(4f)) }
                        parsedPaths["r_wing3"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(3f)) }
                        
                        parsedPaths["crown_base"]?.let { drawPath(it, Color(0xFFD97706)) }
                        parsedPaths["crown_spikes"]?.let { drawPath(it, goldStarBrush) }
                        parsedPaths["crown_spikes"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(1f)) }
                        drawCircle(Color(0xFFA78BFA), 1.8f, Offset(50f, -4f))
                        drawCircle(Color(0xFFFBBF24), 1.8f, Offset(50f, -4f), style = Stroke(0.8f))
                        drawCircle(Color(0xFFA78BFA), 1.2f, Offset(30f, 2f))
                        drawCircle(Color(0xFFFBBF24), 1.2f, Offset(30f, 2f), style = Stroke(0.5f))
                        drawCircle(Color(0xFFA78BFA), 1.2f, Offset(70f, 2f))
                        drawCircle(Color(0xFFFBBF24), 1.2f, Offset(70f, 2f), style = Stroke(0.5f))
                        
                        drawCircle(Color(0xFFFFD700), 37f, Offset(50f, 48f), style = Stroke(1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3f, 4f), 0f)), alpha = 0.65f)
                        drawCircle(Color(0xFFFF6F00), 41f, Offset(50f, 48f), style = Stroke(1.2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 3f), 0f)), alpha = 0.45f)
                        
                        parsedPaths["t_base"]?.let { drawPath(it, Color(0xFFFBBF24), style = Stroke(4.5f)) }
                        parsedPaths["t_left"]?.let { drawPath(it, goldStarBrush) }
                        parsedPaths["t_left"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(1.5f)) }
                        parsedPaths["t_right"]?.let { drawPath(it, goldStarBrush) }
                        parsedPaths["t_right"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(1.5f)) }
                        parsedPaths["t_center"]?.let { drawPath(it, goldStarBrush) }
                        parsedPaths["t_center"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(1.5f)) }
                    }
                    else -> {
                        parsedPaths["wreath_l"]?.let { drawPath(it, wreathBrush, style = Stroke(6f)) }
                        parsedPaths["leaves_l"]?.let { drawPath(it, wreathBrush, style = Stroke(6f)) }
                        parsedPaths["wreath_r"]?.let { drawPath(it, wreathBrush, style = Stroke(6f)) }
                        parsedPaths["leaves_r"]?.let { drawPath(it, wreathBrush, style = Stroke(6f)) }
                        parsedPaths["ribbon"]?.let { drawPath(it, wreathBrush, style = Stroke(4f)) }
                    }
                }

                // Central shield core circle
                drawCircle(
                    brush = shieldBrush,
                    radius = shieldRadius,
                    center = Offset(50f, 48f)
                )

                val coreStrokeColor = when {
                    isLevel91To100 -> Color(0xFFFBBF24)
                    isLevel81To90 -> Color(0xFFCBD5E1)
                    isLevel71To80 -> Color(0xFFB59049)
                    isLevel61To70 -> Color(0xFFCBD5E1)
                    isLevel51To60 -> Color(0xFF10B981)
                    isLevel41To50 -> Color(0xFFD97706)
                    isLevel31To40 -> Color(0xFFF43F5E)
                    isLevel21To30 -> Color(0xFFC084FC)
                    isLevel11To20 -> Color(0xFF00D2FF)
                    else -> wreathColor
                }

                drawCircle(
                    color = coreStrokeColor,
                    radius = shieldRadius,
                    center = Offset(50f, 48f),
                    style = Stroke(width = if (isLevel91To100) 5.5f else 4.5f)
                )

                // Inner details
                when {
                    isLevel21To30 -> {
                        parsedPaths["moon"]?.let { drawPath(it, moonGoldBrush) }
                    }
                    isLevel31To40 -> {
                        parsedPaths["spark"]?.let { drawPath(it, Color.White, alpha = 0.65f) }
                        drawCircle(Color.White, 3f, Offset(60f, 56f), alpha = 0.5f)
                    }
                    isLevel41To50 -> {
                        parsedPaths["poly1"]?.let { drawPath(it, Color(0xFF78350F)) }
                        parsedPaths["poly2"]?.let { drawPath(it, Color(0xFFFEF08A)) }
                        parsedPaths["poly3"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                        parsedPaths["poly4"]?.let { drawPath(it, Color(0xFFF59E0B)) }
                        parsedPaths["poly5"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                        parsedPaths["poly6"]?.let { drawPath(it, Color(0xFFD97706)) }
                        parsedPaths["poly7"]?.let { drawPath(it, Color(0xFFB45309)) }
                        drawCircle(Color.White, 2.2f, Offset(44f, 30f), alpha = 0.8f)
                    }
                    isLevel51To60 -> {
                        parsedPaths["poly1"]?.let { drawPath(it, Color(0xFFA7F3D0)) }
                        parsedPaths["poly2"]?.let { drawPath(it, Color(0xFF34D399)) }
                        parsedPaths["poly3"]?.let { drawPath(it, Color(0xFF059669)) }
                        parsedPaths["poly4"]?.let { drawPath(it, Color(0xFF047857)) }
                        parsedPaths["poly5"]?.let { drawPath(it, Color(0xFF064E3B)) }
                        parsedPaths["poly6"]?.let { drawPath(it, Color(0xFF047857)) }
                        parsedPaths["poly7"]?.let { drawPath(it, Color(0xFF059669)) }
                        parsedPaths["poly8"]?.let { drawPath(it, Color(0xFF34D399)) }
                        drawCircle(Color.White, 3.5f, Offset(50f, 48f), alpha = 0.8f)
                        drawCircle(Color.White, 1.5f, Offset(46f, 44f))
                    }
                    isLevel61To70 -> {
                        parsedPaths["poly1"]?.let { drawPath(it, Color(0xFFE0F7FA)) }
                        parsedPaths["poly2"]?.let { drawPath(it, Color(0xFF4DD0E1)) }
                        parsedPaths["poly3"]?.let { drawPath(it, Color(0xFF00ACC1)) }
                        parsedPaths["poly4"]?.let { drawPath(it, Color(0xFF00838F)) }
                        parsedPaths["poly5"]?.let { drawPath(it, Color(0xFF006064)) }
                        parsedPaths["poly6"]?.let { drawPath(it, Color(0xFF00838F)) }
                        parsedPaths["poly7"]?.let { drawPath(it, Color(0xFF00ACC1)) }
                        parsedPaths["poly8"]?.let { drawPath(it, Color(0xFF4DD0E1)) }
                        drawCircle(Color.White, 2.8f, Offset(50f, 48f), alpha = 0.8f)
                    }
                    isLevel71To80 -> {
                        drawCircle(Color(0xFFFFE082), 11f, Offset(50f, 48f), style = Stroke(3f))
                        drawCircle(Color(0xFFB59049), 7f, Offset(42f, 42f), style = Stroke(2f), alpha = 0.8f)
                        drawCircle(Color(0xFFB59049), 7f, Offset(58f, 42f), style = Stroke(2f), alpha = 0.8f)
                        drawCircle(Color(0xFFB59049), 7f, Offset(50f, 56f), style = Stroke(2f), alpha = 0.8f)
                        drawCircle(Color.White, 3.5f, Offset(50f, 48f))
                    }
                    isLevel81To90 -> {
                        parsedPaths["poly_base"]?.let { drawPath(it, Color(0xFF0891B2)) }
                        parsedPaths["poly1"]?.let { drawPath(it, Color(0xFFE0FDFA)) }
                        parsedPaths["poly2"]?.let { drawPath(it, Color(0xFFA5F3FC)) }
                        parsedPaths["poly3"]?.let { drawPath(it, Color(0xFF06B6D4)) }
                        parsedPaths["poly4"]?.let { drawPath(it, Color(0xFF0891B2)) }
                        drawCircle(Color.White, 2.2f, Offset(44f, 34f), alpha = 0.85f)
                    }
                    isLevel91To100 -> {
                        scale(1.3f, 1.3f, pivot = Offset(50f, 48f)) {
                            parsedPaths["bird_body"]?.let { drawPath(it, goldStarBrush) }
                            parsedPaths["bird_body"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(1.2f)) }
                            parsedPaths["bird_chest"]?.let { drawPath(it, Color(0xFF8A4F00), style = Stroke(1f)) }
                            parsedPaths["bird_medal"]?.let { drawPath(it, Color.White) }
                            parsedPaths["bird_medal"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.5f)) }
                            drawCircle(Color(0xFFFF2222), 1.1f, Offset(50f, 51f))
                            parsedPaths["bird_neck"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                            parsedPaths["bird_neck"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.5f)) }
                            parsedPaths["bird_head"]?.let { drawPath(it, Color(0xFFFFD700)) }
                            parsedPaths["bird_head"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.8f)) }
                            parsedPaths["bird_beak"]?.let { drawPath(it, Color(0xFFFFD700)) }
                            parsedPaths["bird_beak"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.8f)) }
                            parsedPaths["bird_wing_l"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                            parsedPaths["bird_wing_l"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.8f)) }
                            parsedPaths["bird_wing_r"]?.let { drawPath(it, Color(0xFFFBBF24)) }
                            parsedPaths["bird_wing_r"]?.let { drawPath(it, Color(0xFFD97706), style = Stroke(0.8f)) }
                            parsedPaths["bird_wing_high"]?.let { drawPath(it, Color(0xFF8A4F00), style = Stroke(0.8f)) }
                            drawCircle(Color(0xFFFF2222), 0.9f, Offset(49f, 30f))
                            drawCircle(Color(0xFFFFCCCC), 0.9f, Offset(49f, 30f), style = Stroke(0.3f))
                            drawCircle(Color.White, 2.2f, Offset(50f, 46f), alpha = 0.8f)
                        }
                        
                        parsedPaths["dome_reflect"]?.let { drawPath(it, Color.White, alpha = 0.35f) }
                    }
                    else -> {
                        val starPath = parsedPaths["star"]
                        if (starPath != null) {
                            if (isLevel11To20) {
                                drawPath(starPath, goldStarBrush)
                            } else {
                                drawPath(starPath, starColor)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 3. Role Tag Pills
// ==========================================
@Composable
private fun RoleTag(
    text: String,
    startColor: Color,
    endColor: Color,
    borderColor: Color,
    textColor: Color,
    heightDp: Int? = null
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Brush.horizontalGradient(colors = listOf(startColor, endColor)))
            .border(1.dp, borderColor, RoundedCornerShape(10.dp))
            .then(if (heightDp != null) Modifier.height(heightDp.dp) else Modifier)
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun OfficialTag() {
    SVGA_OfficialTag()
}

@Composable
fun SuperAdminTag() {
    RoleTag("SUPER ADMIN", Color(0xFFB91C1C), Color(0xFF450A0A), Color(0xFFFFD700), Color(0xFFFFD700))
}

@Composable
fun ManagerTag() {
    RoleTag("Manager", Color(0xFF065F46), Color(0xFF022C22), Color(0xFFFFD700), Color(0xFFFFD700))
}

@Composable
fun AuditorTag() {
    RoleTag("Auditor", Color(0xFF1E3A8A), Color(0xFF020617), Color(0xFF00FFFF), Color(0xFF00FFFF))
}

@Composable
fun AdminTag() {
    RoleTag("Admin", Color(0xFFB91C1C), Color(0xFF450A0A), Color(0xFFFFD700), Color(0xFFFFD700))
}

@Composable
fun SellerTag() {
    RoleTag("Seller", Color(0xFFFFAE00), Color(0xFFFF9500), Color(0xFFFFE1A8), Color.White, heightDp = 22)
}

@Composable
fun ServiceTag() {
    RoleTag("Service", Color(0xFF17CFB8), Color(0xFF0D9482), Color(0xFFA7FFF1), Color.White, heightDp = 22)
}

@Composable
fun HostTag() {
    RoleTag("Host", Color(0xFFB57AFF), Color(0xFF803AF5), Color(0xFFE0C6FF), Color.White, heightDp = 22)
}

@Composable
fun CSLeaderTag() {
    RoleTag("CS Leader", Color(0xFF701A75), Color(0xFF1E1B4B), Color(0xFFF43F5E), Color(0xFFF43F5E))
}

@Composable
fun CustomerServiceTag() {
    RoleTag("CS", Color(0xFF0891B2), Color(0xFF083344), Color(0xFF06B6D4), Color(0xFF06B6D4))
}

// ==========================================
// 4. Wallet Icons
// ==========================================
@Composable
fun GoldDollarIcon(size: Int = 32) {
    Box(
        modifier = Modifier.size(size.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val cx = w / 2f
            val cy = h / 2f
            
            // 1. Outer Heavy Gold Rim
            val rimGrad = Brush.linearGradient(
                colors = listOf(Color(0xFFFFE57F), Color(0xFFFFB300), Color(0xFF8D6E63), Color(0xFFFFCA28), Color(0xFF5D4037)),
                start = Offset(0f, 0f),
                end = Offset(w, h)
            )
            drawCircle(brush = rimGrad, radius = w * 0.49f, center = Offset(cx, cy))
            
            // 2. Inner Bevel Cut
            val bevelGrad = Brush.linearGradient(
                colors = listOf(Color(0xFF3E2723).copy(alpha = 0.9f), Color(0xFF795548).copy(alpha = 0.3f), Color(0xFFFFE082).copy(alpha = 0.9f)),
                start = Offset(0f, h),
                end = Offset(w, 0f)
            )
            drawCircle(brush = bevelGrad, radius = w * 0.44f, center = Offset(cx, cy))
            
            // 3. Main Coin Face (Radial Sunburst)
            val faceGrad = Brush.radialGradient(
                colors = listOf(Color(0xFFFFF9C4), Color(0xFFFDD835), Color(0xFFF57F17), Color(0xFF5D4037)),
                center = Offset(w * 0.45f, h * 0.45f),
                radius = w * 0.50f
            )
            drawCircle(brush = faceGrad, radius = w * 0.41f, center = Offset(cx, cy))
            
            // 4. Fine Circular Ridge (Dashed Ridge) (made thinner)
            drawCircle(
                color = Color(0xFFFFE082),
                radius = w * 0.37f,
                center = Offset(cx, cy),
                style = Stroke(
                    width = 0.7f.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.dp.toPx(), 1.5.dp.toPx()), 0f)
                ),
                alpha = 0.85f
            )
            
            // 8. Star Sparkle (made thinner and more delicate)
            val sx = w * 0.72f
            val sy = h * 0.23f
            val sw = w * 0.08f
            drawLine(
                color = Color.White,
                start = Offset(sx, sy - sw),
                end = Offset(sx, sy + sw),
                strokeWidth = 0.8f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawLine(
                color = Color.White,
                start = Offset(sx - sw, sy),
                end = Offset(sx + sw, sy),
                strokeWidth = 0.8f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawCircle(color = Color.White, radius = 1.0f.dp.toPx(), center = Offset(sx, sy))
        }
        
        val symbolGrad = Brush.verticalGradient(
            colors = listOf(Color(0xFFFFFFFF), Color(0xFFFFEE58), Color(0xFFF57F17), Color(0xFF3E2723))
        )
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "$",
                fontSize = (size * 0.54f).sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF3E2723).copy(alpha = 0.7f),
                modifier = Modifier.offset(x = (size * 0.015f).dp, y = (size * 0.025f).dp)
            )
            Text(
                text = "$",
                fontSize = (size * 0.54f).sp,
                fontWeight = FontWeight.Black,
                style = TextStyle(brush = symbolGrad),
                letterSpacing = 1.sp
            )
        }
    }
}

@Composable
fun PremiumDiamondIcon(size: Int = 32) {
    Box(
        modifier = Modifier.size(size.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val cx = w / 2f
            val cy = h / 2f
            
            // 1. Subtle Outer Glow
            drawCircle(
                color = Color(0xFF00E5FF),
                radius = w * 0.43f,
                center = Offset(cx, h * 0.53f),
                alpha = 0.12f
            )

            // Gradients definition
            val blueShine = Brush.linearGradient(
                colors = listOf(Color(0xFFE0F7FA), Color(0xFF26C6DA), Color(0xFF006064))
            )
            val facetLight = Brush.verticalGradient(
                colors = listOf(Color(0xFFFFFFFF), Color(0xFFB2EBF2), Color(0xFF00ACC1))
            )
            val facetMid = Brush.linearGradient(
                colors = listOf(Color(0xFF80DEEA), Color(0xFF00BCD4), Color(0xFF00838F))
            )
            val facetDark = Brush.verticalGradient(
                colors = listOf(Color(0xFF00ACC1), Color(0xFF006064), Color(0xFF002D30))
            )
            val facetDeep = Brush.linearGradient(
                colors = listOf(Color(0xFF00838F), Color(0xFF00363A))
            )

            // 2. Main Diamond Facets
            val topLeftPath = Path().apply {
                moveTo(w * 0.3f, h * 0.25f)
                lineTo(w * 0.38f, h * 0.45f)
                lineTo(w * 0.15f, h * 0.45f)
                close()
            }
            drawPath(topLeftPath, facetMid)
            drawPath(topLeftPath, Color(0xFFB2EBF2), style = Stroke(0.8f.dp.toPx()))

            val topCenterLeftPath = Path().apply {
                moveTo(w * 0.3f, h * 0.25f)
                lineTo(w * 0.5f, h * 0.25f)
                lineTo(w * 0.38f, h * 0.45f)
                close()
            }
            drawPath(topCenterLeftPath, facetLight)
            drawPath(topCenterLeftPath, Color(0xFFB2EBF2), style = Stroke(0.8f.dp.toPx()))

            val topCenterRightPath = Path().apply {
                moveTo(w * 0.7f, h * 0.25f)
                lineTo(w * 0.5f, h * 0.25f)
                lineTo(w * 0.62f, h * 0.45f)
                close()
            }
            drawPath(topCenterRightPath, facetLight)
            drawPath(topCenterRightPath, Color(0xFFB2EBF2), style = Stroke(0.8f.dp.toPx()))

            val topRightPath = Path().apply {
                moveTo(w * 0.7f, h * 0.25f)
                lineTo(w * 0.85f, h * 0.45f)
                lineTo(w * 0.62f, h * 0.45f)
                close()
            }
            drawPath(topRightPath, facetMid)
            drawPath(topRightPath, Color(0xFFB2EBF2), style = Stroke(0.8f.dp.toPx()))

            val centerTopPath = Path().apply {
                moveTo(w * 0.5f, h * 0.25f)
                lineTo(w * 0.62f, h * 0.45f)
                lineTo(w * 0.38f, h * 0.45f)
                close()
            }
            drawPath(centerTopPath, blueShine)
            drawPath(centerTopPath, Color.White, style = Stroke(0.8f.dp.toPx()))

            val bottomLeftPath = Path().apply {
                moveTo(w * 0.15f, h * 0.45f)
                lineTo(w * 0.38f, h * 0.45f)
                lineTo(w * 0.5f, h * 0.85f)
                close()
            }
            drawPath(bottomLeftPath, facetDark)
            drawPath(bottomLeftPath, Color(0xFF26C6DA), style = Stroke(0.8f.dp.toPx()))

            val bottomCenterPath = Path().apply {
                moveTo(w * 0.38f, h * 0.45f)
                lineTo(w * 0.62f, h * 0.45f)
                lineTo(w * 0.5f, h * 0.85f)
                close()
            }
            drawPath(bottomCenterPath, facetMid)
            drawPath(bottomCenterPath, Color(0xFFE0F7FA), style = Stroke(0.8f.dp.toPx()))

            val bottomRightPath = Path().apply {
                moveTo(w * 0.85f, h * 0.45f)
                lineTo(w * 0.62f, h * 0.45f)
                lineTo(w * 0.5f, h * 0.85f)
                close()
            }
            drawPath(bottomRightPath, facetDeep)
            drawPath(bottomRightPath, Color(0xFF26C6DA), style = Stroke(0.8f.dp.toPx()))

            // 3. Pure White Sparkle Flare
            val sx = w * 0.73f
            val sy = h * 0.33f
            val sw = w * 0.10f
            drawLine(
                color = Color.White,
                start = Offset(sx, sy - sw),
                end = Offset(sx, sy + sw),
                strokeWidth = 2.5f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawLine(
                color = Color.White,
                start = Offset(sx - sw, sy),
                end = Offset(sx + sw, sy),
                strokeWidth = 2.5f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawCircle(color = Color.White, radius = 3.2f.dp.toPx(), center = Offset(sx, sy))

            // 4. Small Secondary Sparkle
            val s2x = w * 0.25f
            val s2y = h * 0.65f
            val s2w = w * 0.05f
            drawLine(
                color = Color.White,
                start = Offset(s2x, s2y - s2w),
                end = Offset(s2x, s2y + s2w),
                strokeWidth = 1.5f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawLine(
                color = Color.White,
                start = Offset(s2x - s2w, s2y),
                end = Offset(s2x + s2w, s2y),
                strokeWidth = 1.5f.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
            drawCircle(color = Color.White, radius = 1.5f.dp.toPx(), center = Offset(s2x, s2y))
        }
    }
}

// ==========================================
// 5. VIP Banner — RN SVGA_VIPBanner parity
// ==========================================
@Composable
fun VIPHexagonBadge(
    width: Int,
    height: Int,
    colors: List<Color>,
    strokeColor: Color? = null,
    strokeWidth: Float = 0f,
    fontSize: Int = 14,
    letterSpacing: Float = 0f,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.size(width.dp, height.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            
            // Hexagon path
            val path = Path().apply {
                moveTo(w * 0.5f, 0f)
                lineTo(w, h * 0.25f)
                lineTo(w, h * 0.75f)
                lineTo(w * 0.5f, h)
                lineTo(0f, h * 0.75f)
                lineTo(0f, h * 0.25f)
                close()
            }
            
            drawPath(
                path = path,
                brush = Brush.verticalGradient(colors = colors)
            )
            
            // Diamond shape at the top center of the hexagon
            val diamondPath = Path().apply {
                moveTo(w * 0.5f, h * 0.20f)
                lineTo(w * 0.64f, h * 0.38f)
                lineTo(w * 0.5f, h * 0.56f)
                lineTo(w * 0.36f, h * 0.38f)
                close()
            }
            drawPath(
                path = diamondPath,
                color = Color.White.copy(alpha = 0.45f)
            )
            
            if (strokeColor != null && strokeWidth > 0) {
                drawPath(
                    path = path,
                    color = strokeColor,
                    style = Stroke(width = strokeWidth.dp.toPx())
                )
            }
        }
        
        Text(
            text = "VIP",
            color = Color.White,
            fontSize = fontSize.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = letterSpacing.sp,
            modifier = Modifier.offset(y = (height * 0.20f).dp)
        )
    }
}

@Composable
fun VIPBanner(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(75.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(Color(0xFF02C697), Color(0xFF2087D6), Color(0xFF9C3FE4))
                )
            )
            .clickable { onClick() }
            .padding(horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: 3 overlapping VIP hexagon badges
            Box(
                modifier = Modifier
                    .width(90.dp)
                    .fillMaxHeight(),
                contentAlignment = Alignment.CenterStart
            ) {
                // 1. Pink Hexagon (right-most, back-most)
                VIPHexagonBadge(
                    width = 45,
                    height = 50,
                    colors = listOf(Color(0xFFFF7EB3), Color(0xFFE7227E)),
                    fontSize = 12,
                    modifier = Modifier
                        .offset(x = 32.dp)
                        .graphicsLayer {
                            scaleX = 0.7f
                            scaleY = 0.7f
                            rotationZ = 5f
                            alpha = 0.8f
                        }
                )
                
                // 2. Blue Hexagon (middle)
                VIPHexagonBadge(
                    width = 45,
                    height = 50,
                    colors = listOf(Color(0xFF4FACFE), Color(0xFF0066FF)),
                    fontSize = 12,
                    modifier = Modifier
                        .offset(x = 16.dp)
                        .graphicsLayer {
                            scaleX = 0.8f
                            scaleY = 0.8f
                            rotationZ = -5f
                        }
                )
                
                // 3. Green Hexagon (front-most, left-most)
                VIPHexagonBadge(
                    width = 50,
                    height = 55,
                    colors = listOf(Color(0xFF5AF9B1), Color(0xFF00AD69)),
                    strokeColor = Color.White,
                    strokeWidth = 1.5f,
                    fontSize = 10,
                    letterSpacing = 1f,
                    modifier = Modifier
                        .offset(x = 0.dp)
                        .graphicsLayer {
                            scaleX = 0.9f
                            scaleY = 0.9f
                        }
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Center: Text
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "VIP Club",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "✨", fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Upgrade to VIP and get free coins daily",
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 2,
                    lineHeight = 12.sp
                )
            }

            // Right: GET VIP button
            Box(
                modifier = Modifier
                    .shadow(elevation = 4.dp, shape = RoundedCornerShape(25.dp))
                    .clip(RoundedCornerShape(25.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFFFFF59D), Color(0xFFFFC107), Color(0xFFFF8F00))
                        )
                    )
                    .clickable { onClick() },
                contentAlignment = Alignment.Center
            ) {
                // Glossy reflection overlay (Edge-to-edge top half)
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .padding(bottom = 16.dp)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.White.copy(alpha = 0.45f), Color.White.copy(alpha = 0.05f))
                            )
                        )
                )

                Text(
                    text = "GET VIP",
                    color = Color(0xFF5D4037),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)
                )
            }
        }
    }
}

// ==========================================
// 6. Quick Action Icons
// ==========================================
@Composable
private fun QuickActionIcon(emoji: String, startColor: Color, endColor: Color) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(Brush.linearGradient(listOf(startColor, endColor))),
        contentAlignment = Alignment.Center
    ) {
        Text(text = emoji, fontSize = 18.sp)
    }
}

@Composable
fun LevelCrownIcon() {
    val pathStr = "M5 16 L3 5 L8.5 10 L12 4 L15.5 10 L21 5 L19 16 L5 16 Z M5 19 L19 19 C19 20.1 18.1 21 17 21 L7 21 C5.9 21 5 20.1 5 19 Z"
    val path = remember { PathParser.createPathFromPathData(pathStr).asComposePath() }
    
    Canvas(modifier = Modifier.size(32.dp)) {
        val s = size.width / 24f
        
        // Native Drop Shadow
        drawIntoCanvas { canvas ->
            val androidPath = path.asAndroidPath()
            val shadowPaint = android.graphics.Paint().apply {
                isAntiAlias = true
                style = android.graphics.Paint.Style.FILL
                color = android.graphics.Color.argb(12, 0, 0, 0)
                setShadowLayer(3.5f.dp.toPx(), 0f, 2.5f.dp.toPx(), android.graphics.Color.argb(80, 0, 0, 0))
            }
            canvas.save()
            canvas.scale(s, s)
            canvas.nativeCanvas.drawPath(androidPath, shadowPaint)
            canvas.restore()
        }
        
        val brush = Brush.verticalGradient(
            colors = listOf(Color(0xFFFFC837), Color(0xFFFF8008), Color(0xFFFF6A00)),
            startY = 4f,
            endY = 21f
        )
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(path, brush)
        }
    }
}

@Composable
fun StoreCartIcon() {
    val pathStr = "M7 18 C5.9 18 5.01 18.9 5.01 20 C5.01 21.1 5.9 22 7 22 C8.1 22 9 21.1 9 20 C9 18.9 8.1 18.1 7 18 Z M1 2 L1 4 L3 4 L6.6 11.59 L5.25 14.04 C5.09 14.32 5 14.65 5 15 C5 16.1 5.9 17 7 17 L19 17 L19 15 L7.42 15 C7.28 15 7.17 14.89 7.17 14.75 L7.2 14.63 L8.1 13 L15.55 13 C16.3 13 16.96 12.59 17.3 11.97 L20.88 5.48 C21.05 5.17 21 4.82 21 4.5 C21 4.22 20.78 4 20.5 4 L5.21 4 L4.27 2 L1 2 Z M17 18 C15.9 18 15.01 18.9 15.01 20 C15.01 21.1 15.9 22 17 22 C18.1 22 19 21.1 19 20 C19 18.9 18.1 18.1 17 18 Z"
    val path = remember { PathParser.createPathFromPathData(pathStr).asComposePath() }
    
    Canvas(modifier = Modifier.size(32.dp)) {
        val s = size.width / 24f
        
        // Native Drop Shadow
        drawIntoCanvas { canvas ->
            val androidPath = path.asAndroidPath()
            val shadowPaint = android.graphics.Paint().apply {
                isAntiAlias = true
                style = android.graphics.Paint.Style.FILL
                color = android.graphics.Color.argb(12, 0, 0, 0)
                setShadowLayer(3.5f.dp.toPx(), 0f, 2.5f.dp.toPx(), android.graphics.Color.argb(80, 0, 0, 0))
            }
            canvas.save()
            canvas.scale(s, s)
            canvas.nativeCanvas.drawPath(androidPath, shadowPaint)
            canvas.restore()
        }
        
        val brush = Brush.verticalGradient(
            colors = listOf(Color(0xFF00D2FF), Color(0xFF3a7bd5)),
            startY = 2f,
            endY = 22f
        )
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(path, brush)
        }
    }
}

@Composable
fun MedalStarIcon() {
    val ribbonStr = "M8 2 L16 2 L15 5 L9 5 Z"
    val starStr = "M12 9.5 L13.2 12.1 L16 12.4 L13.9 14.2 L14.5 17 L12 15.5 L9.5 17 L10.1 14.2 L8 12.4 L10.8 12.1 Z"
    
    val ribbonPath = remember { PathParser.createPathFromPathData(ribbonStr).asComposePath() }
    val starPath = remember { PathParser.createPathFromPathData(starStr).asComposePath() }
    
    Canvas(modifier = Modifier.size(36.dp)) {
        val s = size.width / 24f
        
        // Native Drop Shadow
        drawIntoCanvas { canvas ->
            val androidRibbonPath = ribbonPath.asAndroidPath()
            val shadowPaint = android.graphics.Paint().apply {
                isAntiAlias = true
                style = android.graphics.Paint.Style.FILL
                color = android.graphics.Color.argb(12, 0, 0, 0)
                setShadowLayer(3.5f.dp.toPx(), 0f, 2.5f.dp.toPx(), android.graphics.Color.argb(80, 0, 0, 0))
            }
            canvas.save()
            canvas.scale(s, s)
            canvas.nativeCanvas.drawPath(androidRibbonPath, shadowPaint)
            canvas.nativeCanvas.drawCircle(12f, 13f, 8f, shadowPaint)
            canvas.restore()
        }
        
        val circleBrush = Brush.verticalGradient(
            colors = listOf(Color(0xFFC084FC), Color(0xFF9333EA)),
            startY = 5f,
            endY = 21f
        )
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(ribbonPath, Color(0xFF7E22CE))
            drawCircle(circleBrush, radius = 8f, center = Offset(12f, 13f))
            drawPath(starPath, Color.White.copy(alpha = 0.9f))
        }
    }
}

@Composable
fun BonusGiftIcon() {
    val bowPath = Path().apply {
        moveTo(12f, 6f)
        cubicTo(10f, 3f, 10f, 1f, 12f, 3f)
        cubicTo(14f, 1f, 14f, 3f, 12f, 6f)
        close()
    }
    
    Canvas(modifier = Modifier.size(36.dp)) {
        val w = size.width
        val h = size.height
        val s = w / 24f
        
        // Native Drop Shadow
        drawIntoCanvas { canvas ->
            val androidBowPath = bowPath.asAndroidPath()
            val shadowPaint = android.graphics.Paint().apply {
                isAntiAlias = true
                style = android.graphics.Paint.Style.FILL
                color = android.graphics.Color.argb(12, 0, 0, 0)
                setShadowLayer(3.5f.dp.toPx(), 0f, 2.5f.dp.toPx(), android.graphics.Color.argb(80, 0, 0, 0))
            }
            canvas.save()
            canvas.scale(s, s)
            canvas.nativeCanvas.drawRoundRect(4f, 9f, 20f, 20f, 2f, 2f, shadowPaint)
            canvas.nativeCanvas.drawRoundRect(3f, 6f, 21f, 9f, 1.5f, 1.5f, shadowPaint)
            canvas.nativeCanvas.drawPath(androidBowPath, shadowPaint)
            canvas.restore()
        }
        
        withTransform({ scale(s, s, Offset.Zero) }) {
            // Gradient for the Box body
            val bgGrad = Brush.verticalGradient(
                colors = listOf(Color(0xFFFB923C), Color(0xFFEA580C)),
                startY = 6f,
                endY = 20f
            )
            // Gradient for the Ribbon
            val bgRibbon = Brush.verticalGradient(
                colors = listOf(Color(0xFFFDE047), Color(0xFFCA8A04)),
                startY = 2f,
                endY = 20f
            )
            
            val strokeColor = Color(0xFFC2410C)
            val ribbonStrokeColor = Color(0xFFCA8A04)

            // <Rect x="4" y="9" width="16" height="11" rx="2" fill="url(#bgGrad)" stroke="#C2410C" strokeWidth="0.5" />
            drawRoundRect(
                brush = bgGrad,
                topLeft = Offset(4f, 9f),
                size = Size(16f, 11f),
                cornerRadius = CornerRadius(2f)
            )
            drawRoundRect(
                color = strokeColor,
                topLeft = Offset(4f, 9f),
                size = Size(16f, 11f),
                cornerRadius = CornerRadius(2f),
                style = Stroke(width = 0.5f)
            )

            // <Rect x="3" y="6" width="18" height="3" rx="1.5" fill="url(#bgGrad)" stroke="#C2410C" strokeWidth="0.5" />
            drawRoundRect(
                brush = bgGrad,
                topLeft = Offset(3f, 6f),
                size = Size(18f, 3f),
                cornerRadius = CornerRadius(1.5f)
            )
            drawRoundRect(
                color = strokeColor,
                topLeft = Offset(3f, 6f),
                size = Size(18f, 3f),
                cornerRadius = CornerRadius(1.5f),
                style = Stroke(width = 0.5f)
            )

            // <Rect x="11" y="6" width="2" height="14" fill="url(#bgRibbon)" />
            drawRect(
                brush = bgRibbon,
                topLeft = Offset(11f, 6f),
                size = Size(2f, 14f)
            )

            // <Rect x="3" y="7" width="18" height="1" fill="url(#bgRibbon)" />
            drawRect(
                brush = bgRibbon,
                topLeft = Offset(3f, 7f),
                size = Size(18f, 1f)
            )

            // <Path d="M12 6 C10 3 10 1 12 3 C14 1 14 3 12 6 Z" fill="url(#bgRibbon)" stroke="#CA8A04" strokeWidth="0.5" />
            drawPath(bowPath, brush = bgRibbon)
            drawPath(bowPath, color = ribbonStrokeColor, style = Stroke(width = 0.5f))
        }
    }
}

@Composable
fun TasksIcon() {
    QuickActionIcon("📋", Color(0xFF3B82F6), Color(0xFF2563EB))
}

// ==========================================
// 7. Menu Item Icons
// ==========================================
@Composable
private fun MenuItemIcon(emoji: String, bgColor: Color) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor),
        contentAlignment = Alignment.Center
    ) {
        Text(text = emoji, fontSize = 16.sp)
    }
}

@Composable
fun InviteHeartIcon() {
    val p1 = remember { PathParser.createPathFromPathData("M8 14 L20 24 L32 14 V28 C32 29.1 31.1 30 30 30 H10 C8.9 30 8 29.1 8 28 V14 Z").asComposePath() }
    val p2 = remember { PathParser.createPathFromPathData("M20 24 L8 14 H32 L20 24 Z").asComposePath() }
    val p3 = remember { PathParser.createPathFromPathData("M20 22 C20 22 18.5 20.5 17.5 20.5 C16.5 20.5 15.5 21.3 15.5 22.5 C15.5 24 18 26 20 27 C22 26 24.5 24 24.5 22.5 C24.5 21.3 23.5 20.5 22.5 20.5 C21.5 20.5 20 22 20 22 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFFF9EB5), Color(0xFFFF5C8A)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawRoundRect(brush, topLeft = Offset(4f, 4f), size = Size(32f, 32f), cornerRadius = CornerRadius(10f))
            drawPath(p1, Color.White)
            drawPath(p2, Color(0xFFFFD1DC))
            drawPath(p3, Color(0xFFFF5C8A))
        }
    }
}

@Composable
fun FamilyShieldIcon() {
    val p = remember { PathParser.createPathFromPathData("M10 6 H30 V26 C30 26 20 34 20 34 C20 34 10 26 10 26 V6 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFCD7F32), Color(0xFF8B4513)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p, brush)
            drawPath(p, Color(0xFF5D2E0A), style = Stroke(1f))
            drawRoundRect(Color(0xFF5D2E0A), topLeft = Offset(8f, 4f), size = Size(24f, 4f), cornerRadius = CornerRadius(2f))
            drawCircle(Color(0xFFFFE4D1), radius = 3.5f, center = Offset(20f, 16f))
            drawCircle(Color(0xFFFFE4D1).copy(alpha = 0.8f), radius = 3.5f, center = Offset(14f, 19f))
            drawCircle(Color(0xFFFFE4D1).copy(alpha = 0.8f), radius = 3.5f, center = Offset(26f, 19f))
        }
    }
}

@Composable
fun BagShirtIcon() {
    val p = remember { PathParser.createPathFromPathData("M10 12 L16 8 L24 8 L30 12 L34 22 L28 26 L28 34 C28 35.1 27.1 36 26 36 L14 36 C12.9 36 12 35.1 12 34 L12 26 L6 22 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFB678FF), Color(0xFF7E22CE)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p, brush)
        }
    }
}

@Composable
fun CpHeartIcon() {
    val p = remember { PathParser.createPathFromPathData("M20 34 C20 34 6 24 6 14 C6 8.5 10.5 4 16 4 C18.5 4 20 6 20 6 C20 6 21.5 4 24 4 C29.5 4 34 8.5 34 14 C34 24 20 34 20 34 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFFF6B9E), Color(0xFFFF1463)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p, brush)
        }
    }
}

@Composable
fun SellerBagIcon() {
    val p1 = remember { PathParser.createPathFromPathData("M20 6 C16 6 14 9 14 12 C14 14 16 15 18 15 L22 15 C24 15 26 14 26 12 C26 9 24 6 20 6 Z").asComposePath() }
    val p2 = remember { PathParser.createPathFromPathData("M10 16 C10 16 6 20 6 28 C6 34 10 36 20 36 C30 36 34 34 34 28 C34 20 30 16 30 16 L10 16 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFFF5F5F), Color(0xFFB91C1C)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p1, Color(0xFF991B1B))
            drawPath(p2, brush)
            drawCircle(Color.White.copy(alpha = 0.2f), radius = 6f, center = Offset(20f, 27f))
        }
    }
}

@Composable
fun OfficialUserIcon() {
    val p = remember { PathParser.createPathFromPathData("M10 30 C10 25 14 23 20 23 C26 23 30 25 30 30 V32 H10 V30 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFFFB347), Color(0xFFFF8C00)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawRoundRect(brush, topLeft = Offset(5f, 5f), size = Size(30f, 30f), cornerRadius = CornerRadius(10f))
            drawCircle(Color.White, radius = 6f, center = Offset(20f, 16f))
            drawPath(p, Color.White)
        }
    }
}

@Composable
fun SettingsIcon() {
    val p = remember { PathParser.createPathFromPathData("M20 6 L32.99 13.5 V28.5 L20 36 L7.01 28.5 V13.5 L20 6 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFFC7D2FE), Color(0xFF818CF8)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p, brush)
            drawCircle(Color.White, radius = 5f, center = Offset(20f, 21f))
        }
    }
}

@Composable
fun HelpCenterIcon() {
    val p = remember { PathParser.createPathFromPathData("M10 8 H30 C32.2 8 34 9.8 34 12 V26 C34 28.2 32.2 30 30 30 H22 L20 33 L18 30 H10 C7.8 30 6 28.2 6 26 V12 C6 9.8 7.8 8 10 8 Z").asComposePath() }
    val brush = Brush.verticalGradient(listOf(Color(0xFF38BDF8), Color(0xFF0EA5E9)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawPath(p, brush)
            drawRoundRect(Color.White, topLeft = Offset(18.5f, 13f), size = Size(3f, 9f), cornerRadius = CornerRadius(1.5f))
            drawCircle(Color.White, radius = 2f, center = Offset(20f, 26f))
        }
    }
}

@Composable
fun AboutInfoIcon() {
    val brush = Brush.verticalGradient(listOf(Color(0xFF94a3b8), Color(0xFF64748b)))
    
    Canvas(modifier = Modifier.size(24.dp)) {
        val s = size.width / 40f
        withTransform({ scale(s, s, Offset.Zero) }) {
            drawRoundRect(brush, topLeft = Offset(5f, 5f), size = Size(30f, 30f), cornerRadius = CornerRadius(10f))
            drawCircle(Color.White, radius = 2f, center = Offset(20f, 15f))
            drawRoundRect(Color.White, topLeft = Offset(19f, 19f), size = Size(2f, 7f), cornerRadius = CornerRadius(1f))
        }
    }
}

// ==========================================
// 8. Glossy ID Tag
// ==========================================
@Composable
fun GlossyIDTag(label: String) {
    SVGA_GlossyID(label = label)
}

@Composable
fun SVGA_GlossyID(label: String) {
    val idNum = label.replace("ID: ", "").trim()
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(28.dp).padding(start = 2.dp)
    ) {
        // Hexagonal Gold Frame SVG representation as a Canvas
        Box(
            modifier = Modifier.size(28.dp).zIndex(10f)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                
                // Hexagonal Gold border path
                val goldPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.07f)
                    lineTo(w * 0.9f, h * 0.3f)
                    lineTo(w * 0.9f, h * 0.7f)
                    lineTo(w * 0.5f, h * 0.93f)
                    lineTo(w * 0.1f, h * 0.7f)
                    lineTo(w * 0.1f, h * 0.3f)
                    close()
                }
                val goldBrush = Brush.linearGradient(
                    colors = listOf(Color(0xFFFBE3A4), Color(0xFFD2923A), Color(0xFFF9D479), Color(0xFFB37322))
                )
                drawPath(goldPath, goldBrush)

                // Purple gem inner shape
                val gemPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.13f)
                    lineTo(w * 0.83f, h * 0.33f)
                    lineTo(w * 0.83f, h * 0.67f)
                    lineTo(w * 0.5f, h * 0.87f)
                    lineTo(w * 0.17f, h * 0.67f)
                    lineTo(w * 0.17f, h * 0.33f)
                    close()
                }
                val gemBrush = Brush.verticalGradient(
                    colors = listOf(Color(0xFFD57EEB), Color(0xFF8A2387), Color(0xFF4A00E0))
                )
                drawPath(gemPath, gemBrush)

                // Highlight reflections
                val highlightPath = Path().apply {
                    moveTo(w * 0.17f, h * 0.33f)
                    lineTo(w * 0.5f, h * 0.13f)
                    lineTo(w * 0.83f, h * 0.33f)
                    lineTo(w * 0.5f, h * 0.47f)
                    close()
                }
                drawPath(highlightPath, Color.White.copy(alpha = 0.15f))
                
                // Bottom gold details "S"
                val tailPath = Path().apply {
                    moveTo(w * 0.3f, h * 0.75f)
                    quadraticBezierTo(w * 0.4f, h * 0.97f, w * 0.5f, h * 0.97f)
                    quadraticBezierTo(w * 0.6f, h * 0.97f, w * 0.7f, h * 0.75f)
                    quadraticBezierTo(w * 0.6f, h * 0.87f, w * 0.5f, h * 0.87f)
                    quadraticBezierTo(w * 0.4f, h * 0.87f, w * 0.3f, h * 0.75f)
                    close()
                }
                drawPath(tailPath, goldBrush)
                
                val tabPath = Path().apply {
                    moveTo(w * 0.37f, h * 0.72f)
                    lineTo(w * 0.63f, h * 0.72f)
                    lineTo(w * 0.57f, h * 0.9f)
                    lineTo(w * 0.43f, h * 0.9f)
                    close()
                }
                drawPath(tabPath, goldBrush)
            }
            
            // "ID" and "S" text centered inside
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "ID",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = (-0.5).sp
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    "S",
                    fontSize = 7.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFF3A92A)
                )
            }
        }
        
        // Purple pill with ID number
        Box(
            modifier = Modifier
                .layout { measurable, constraints ->
                    val placeable = measurable.measure(constraints)
                    layout(placeable.width - 11.dp.roundToPx(), placeable.height) {
                        placeable.place(x = -11.dp.roundToPx(), y = 0)
                    }
                }
                .zIndex(5f)
                .height(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(Color(0xFF6B1E60), Color(0xFF912480), Color(0xFFB33596))
                    )
                )
                .border(1.dp, Color(0xFFC157A8), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            // Top gloss highlight - edge to edge and fading downwards
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .padding(top = 1.dp, bottom = 7.dp, start = 1.dp, end = 1.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.4f),
                                Color.White.copy(alpha = 0.0f)
                            )
                        ),
                        RoundedCornerShape(topStart = 11.dp, topEnd = 11.dp)
                    )
            )
            
            Text(
                text = idNum,
                modifier = Modifier
                    .padding(start = 12.dp, end = 5.dp)
                    .offset(y = (-2).dp),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
fun SVGA_OfficialTag() {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .height(28.dp)
            .padding(start = 2.dp)
    ) {
        Box(
            modifier = Modifier
                .width(60.dp) // tightly bounds the visual elements
                .height(34.dp)
                .offset(y = (-1.5).dp), // moved slightly up to align with ID badge
            contentAlignment = Alignment.TopStart
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                // viewBox="-5 -7 96 34" -> 0,0 is at x=0, y=7
                translate(left = 0.dp.toPx(), top = 7.dp.toPx()) {
                    // Gradients
                    val otRedInner = Brush.verticalGradient(
                        0.0f to Color(0xFFB82340),
                        0.2f to Color(0xFFA81835),
                        0.5f to Color(0xFF98142F),
                        0.85f to Color(0xFF8A102B),
                        1.0f to Color(0xFF7F0E27)
                    )
                    
                    val otGoldBorder = Brush.verticalGradient(
                        0.0f to Color(0xFFFFE8B8),
                        0.3f to Color(0xFFF5C57A),
                        0.7f to Color(0xFFE4A95A),
                        1.0f to Color(0xFFD08C3A)
                    )
                    
                    val otRadialCoin = Brush.radialGradient(
                        0.0f to Color(0xFFFFFAE0),
                        0.25f to Color(0xFFFFD859),
                        0.65f to Color(0xFFFCA01A),
                        1.0f to Color(0xFFA35200),
                        center = Offset(11.dp.toPx(), 10.dp.toPx()),
                        radius = 12.5f.dp.toPx()
                    )

                    // Main Red capsule with gold border
                    drawRoundRect(
                        brush = otRedInner,
                        topLeft = Offset(8.dp.toPx(), 3f.dp.toPx()),
                        size = Size(50.dp.toPx(), 14.dp.toPx()),
                        cornerRadius = CornerRadius(7f.dp.toPx(), 7f.dp.toPx())
                    )
                    drawRoundRect(
                        brush = otGoldBorder,
                        topLeft = Offset(6.5f.dp.toPx(), 2f.dp.toPx()),
                        size = Size(53.dp.toPx(), 16.dp.toPx()),
                        cornerRadius = CornerRadius(8f.dp.toPx(), 8f.dp.toPx()),
                        style = Stroke(1.8f.dp.toPx())
                    )

                    // Bottom subtle shadow line
                    drawRoundRect(
                        color = Color.Black.copy(alpha = 0.3f),
                        topLeft = Offset(20.dp.toPx(), 17.dp.toPx()),
                        size = Size(26.dp.toPx(), 0.8f.dp.toPx()),
                        cornerRadius = CornerRadius(0.4f.dp.toPx(), 0.4f.dp.toPx())
                    )

                    // U MEDALLION
                    // Drop shadow
                    drawCircle(
                        color = Color.Black.copy(alpha = 0.22f),
                        radius = 11f.dp.toPx(),
                        center = Offset(12.2f.dp.toPx(), 11.2f.dp.toPx())
                    )
                    // Outer border
                    drawCircle(
                        color = Color(0xFF5B2700),
                        radius = 11f.dp.toPx(),
                        center = Offset(11.dp.toPx(), 10.dp.toPx())
                    )
                    // Highlight ring
                    drawCircle(
                        color = Color(0xFFF3C26F),
                        radius = 10.0f.dp.toPx(),
                        center = Offset(11.dp.toPx(), 10.dp.toPx())
                    )
                    // Inner border
                    drawCircle(
                        color = Color(0xFF3B1800),
                        radius = 9.1f.dp.toPx(),
                        center = Offset(11.dp.toPx(), 10.dp.toPx())
                    )
                    // Coin Surface
                    drawCircle(
                        brush = otRadialCoin,
                        radius = 8.5f.dp.toPx(),
                        center = Offset(11.dp.toPx(), 10.dp.toPx())
                    )
                    // Inner Gold Bevel reflection
                    drawCircle(
                        color = Color.White.copy(alpha = 0.55f),
                        radius = 7.5f.dp.toPx(),
                        center = Offset(11.dp.toPx(), 10.dp.toPx()),
                        style = Stroke(0.6f.dp.toPx())
                    )
                }
            }

            val otLetterGold = Brush.verticalGradient(
                0.0f to Color(0xFFFFFEEE),
                0.4f to Color(0xFFFFF8CD),
                0.8f to Color(0xFFFFD86B),
                1.0f to Color(0xFFE5A93B)
            )

            // Texts positioned absolutely over the canvas
            // Text "U" - transformed and layered
            Box(
                modifier = Modifier
                    .offset(x = 0.dp, y = 7.dp) // shift by viewBox origin
                    .offset(x = 7.dp, y = 3.dp) // Move further right and even lower
                    .graphicsLayer {
                        scaleX = -1.35f
                        scaleY = 0.95f
                    },
                contentAlignment = Alignment.Center
            ) {
                // Stroke/Shadow for U
                Text(
                    text = "U",
                    fontSize = 12.2.sp,
                    fontWeight = FontWeight.W700,
                    fontFamily = FontFamily.Serif,
                    color = Color(0xFF3B1800),
                    style = androidx.compose.ui.text.TextStyle(
                        drawStyle = androidx.compose.ui.graphics.drawscope.Stroke(
                            width = 1.0f,
                            join = androidx.compose.ui.graphics.StrokeJoin.Round
                        )
                    ),
                    modifier = Modifier.offset(x = 0.8.dp, y = 1.dp) // relative offset to main U
                )
                // Main U
                Text(
                    text = "U",
                    fontSize = 12.2.sp,
                    fontWeight = FontWeight.W700,
                    fontFamily = FontFamily.Serif,
                    style = androidx.compose.ui.text.TextStyle(brush = otLetterGold)
                )
            }

            // "Official" text
            Box(
                modifier = Modifier
                    .offset(x = 0.dp, y = 7.dp)
                    .offset(x = 18.5f.dp, y = 0.dp) // adjust so text aligns in the new rect (shifted right)
                    .width(41.dp) // reduced by 10.dp
                    .height(20.dp),
                contentAlignment = Alignment.Center
            ) {
                // Official Shadow/Stroke
                Text(
                    text = "Official",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.W900,
                    fontFamily = FontFamily.Serif,
                    letterSpacing = 0.2.sp,
                    color = Color(0xFF4D0613),
                    style = androidx.compose.ui.text.TextStyle(
                        drawStyle = androidx.compose.ui.graphics.drawscope.Stroke(
                            width = 1.2f,
                            join = androidx.compose.ui.graphics.StrokeJoin.Round
                        )
                    ),
                    modifier = Modifier.offset(x = 0.5.dp, y = 0.8.dp)
                )
                // Official Main Stroke
                Text(
                    text = "Official",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.W900,
                    fontFamily = FontFamily.Serif,
                    letterSpacing = 0.2.sp,
                    style = androidx.compose.ui.text.TextStyle(
                        brush = otLetterGold,
                        drawStyle = androidx.compose.ui.graphics.drawscope.Stroke(
                            width = 0.8f,
                            join = androidx.compose.ui.graphics.StrokeJoin.Round
                        )
                    )
                )
                // Official Main Fill
                Text(
                    text = "Official",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.W900,
                    fontFamily = FontFamily.Serif,
                    letterSpacing = 0.2.sp,
                    style = androidx.compose.ui.text.TextStyle(brush = otLetterGold)
                )
            }
        }
    }
}

@Composable
fun ActiveIDBadge(badgeData: Map<*, *>?, fallbackNumber: String) {
    if (badgeData == null) return
    val num = badgeData["displayId"]?.toString() ?: fallbackNumber
    val isPinkDiamond = badgeData["isPinkDiamond"] as? Boolean ?: false
    val isSilver = badgeData["isSilver"] as? Boolean ?: false
    
    val capColors = when {
        isPinkDiamond -> listOf(Color(0xFF9D174D), Color(0xFFDB2777))
        isSilver -> listOf(Color(0xFF0C3E8A), Color(0xFF1D5DC2))
        else -> listOf(Color(0xFFD91B10), Color(0xFFF13A24))
    }
    
    val capBorder = when {
        isPinkDiamond -> Color(0xFFF472B6)
        isSilver -> Color(0xFF4A85E6)
        else -> Color(0xFFFF6B55)
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(28.dp).padding(start = 2.dp)
    ) {
        Box(
            modifier = Modifier.size(32.dp).zIndex(10f)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height
                
                val borderGrad = when {
                    isPinkDiamond -> Brush.linearGradient(
                        colors = listOf(Color(0xFFFFFFFF), Color(0xFFFCE7F3), Color(0xFFF9A8D4), Color(0xFFDB2777))
                    )
                    isSilver -> Brush.linearGradient(
                        colors = listOf(Color(0xFFFFFFFF), Color(0xFFE2E8F0), Color(0xFF94A3B8), Color(0xFF64748B))
                    )
                    else -> Brush.linearGradient(
                        colors = listOf(Color(0xFFFFF1AA), Color(0xFFFFD335), Color(0xFFC98B13), Color(0xFF9E6100))
                    )
                }

                val innerGrad = when {
                    isPinkDiamond -> Brush.linearGradient(
                        colors = listOf(Color(0xFFF472B6), Color(0xFFEC4899), Color(0xFF9D174D))
                    )
                    isSilver -> Brush.linearGradient(
                        colors = listOf(Color(0xFF60A5FA), Color(0xFF3B82F6), Color(0xFF1E3A8A))
                    )
                    else -> androidx.compose.ui.graphics.SolidColor(Color(0xFF750600))
                }

                val shieldPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.05f)
                    lineTo(w * 0.9f, h * 0.25f)
                    lineTo(w * 0.9f, h * 0.75f)
                    lineTo(w * 0.5f, h * 0.95f)
                    lineTo(w * 0.1f, h * 0.75f)
                    lineTo(w * 0.1f, h * 0.25f)
                    close()
                }
                drawPath(shieldPath, borderGrad)

                val innerShieldPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.14f)
                    lineTo(w * 0.82f, h * 0.32f)
                    lineTo(w * 0.82f, h * 0.68f)
                    lineTo(w * 0.5f, h * 0.86f)
                    lineTo(w * 0.18f, h * 0.68f)
                    lineTo(w * 0.18f, h * 0.32f)
                    close()
                }
                drawPath(innerShieldPath, innerGrad)
            }
            
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "ID",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                if (!isPinkDiamond && !isSilver) {
                    Text(
                        "SSS",
                        fontSize = 6.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFFFFD335)
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .layout { measurable, constraints ->
                    val placeable = measurable.measure(constraints)
                    layout(placeable.width - 10.dp.roundToPx(), placeable.height) {
                        placeable.place(x = -10.dp.roundToPx(), y = 0)
                    }
                }
                .zIndex(5f)
                .height(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.horizontalGradient(capColors))
                .border(0.5.dp, capBorder, RoundedCornerShape(12.dp))
                .padding(start = 12.dp, end = 5.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = num,
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
fun SovereignIDBadge(color: String, number: String) {
    val capColors = when (color.lowercase()) {
        "gold" -> listOf(Color(0xFF854D0E), Color(0xFFCA8A04))
        "rose" -> listOf(Color(0xFF9F1239), Color(0xFFE11D48))
        "diamond" -> listOf(Color(0xFF0891B2), Color(0xFF06B6D4))
        "purple" -> listOf(Color(0xFF6B21A8), Color(0xFFA855F7))
        "emerald" -> listOf(Color(0xFF065F46), Color(0xFF10B981))
        else -> listOf(Color(0xFF854D0E), Color(0xFFCA8A04))
    }

    val capBorder = when (color.lowercase()) {
        "gold" -> Color(0xFFFEF08A)
        "rose" -> Color(0xFFFDA4AF)
        "diamond" -> Color(0xFFCFFAFE)
        "purple" -> Color(0xFFF3E8FF)
        "emerald" -> Color(0xFFD1FAE5)
        else -> Color(0xFFFEF08A)
    }

    val shieldGrad = when (color.lowercase()) {
        "gold" -> listOf(Color(0xFFFEF9C3), Color(0xFFCA8A04), Color(0xFF854D0E))
        "rose" -> listOf(Color(0xFFFFF1F2), Color(0xFFE11D48), Color(0xFF9F1239))
        "diamond" -> listOf(Color(0xFFECFEFF), Color(0xFF06B6D4), Color(0xFF0891B2))
        "purple" -> listOf(Color(0xFFFAF5FF), Color(0xFFA855F7), Color(0xFF6B21A8))
        "emerald" -> listOf(Color(0xFFECFDF5), Color(0xFF10B981), Color(0xFF065F46))
        else -> listOf(Color(0xFFFEF9C3), Color(0xFFCA8A04), Color(0xFF854D0E))
    }

    val shieldInnerColor = when (color.lowercase()) {
        "gold" -> Color(0xFF581C87)
        "rose" -> Color(0xFF4C0519)
        "diamond" -> Color(0xFF083344)
        "purple" -> Color(0xFF2E1065)
        "emerald" -> Color(0xFF064E3B)
        else -> Color(0xFF581C87)
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(28.dp).padding(start = 2.dp)
    ) {
        Box(
            modifier = Modifier.size(28.dp).zIndex(10f)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val w = size.width
                val h = size.height

                val borderBrush = Brush.linearGradient(shieldGrad)

                val shieldPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.05f)
                    lineTo(w * 0.9f, h * 0.25f)
                    lineTo(w * 0.9f, h * 0.75f)
                    lineTo(w * 0.5f, h * 0.95f)
                    lineTo(w * 0.1f, h * 0.75f)
                    lineTo(w * 0.1f, h * 0.25f)
                    close()
                }
                drawPath(shieldPath, borderBrush)

                val innerShieldPath = Path().apply {
                    moveTo(w * 0.5f, h * 0.15f)
                    lineTo(w * 0.8f, h * 0.32f)
                    lineTo(w * 0.8f, h * 0.68f)
                    lineTo(w * 0.5f, h * 0.85f)
                    lineTo(w * 0.2f, h * 0.68f)
                    lineTo(w * 0.2f, h * 0.32f)
                    close()
                }
                drawPath(innerShieldPath, shieldInnerColor)
            }

            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "SOV",
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
            }
        }

        Box(
            modifier = Modifier
                .offset(x = (-10).dp)
                .zIndex(5f)
                .height(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.horizontalGradient(capColors))
                .border(0.5.dp, capBorder, RoundedCornerShape(12.dp))
                .padding(start = 12.dp, end = 5.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number,
                modifier = Modifier.offset(y = (-2).dp),
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

