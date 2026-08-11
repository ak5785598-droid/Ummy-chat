package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke

data class FurnitureItem(
    val id: String,
    val name: String,
    val category: String, // 'seating' | 'decor' | 'ambient' | 'luxury'
    val unlockLevel: Int,
    val price: Int,
    val gridWidth: Int,
    val gridLength: Int,
    val renderIcon: @Composable (color: Color?) -> Unit
)

val FURNITURE_CATALOG = listOf(
    FurnitureItem(
        id = "neon-gaming-chair",
        name = "Neon Cyber Seat",
        category = "seating",
        unlockLevel = 1,
        price = 0,
        gridWidth = 1,
        gridLength = 1,
        renderIcon = { color ->
            val tint = color ?: Color(0xFF00FFFF)
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sX = size.width / 100f
                val sY = size.height / 120f
                
                // Ellipse
                drawOval(
                    color = Color(0x4D000000),
                    topLeft = Offset(20f * sX, 83f * sY),
                    size = Size(60f * sX, 24f * sY)
                )
                // Paths
                drawLine(
                    color = Color(0xFF334155),
                    start = Offset(50f * sX, 95f * sY),
                    end = Offset(50f * sX, 75f * sY),
                    strokeWidth = 6f * sX,
                    cap = StrokeCap.Round
                )
                val p2 = Path().apply {
                    moveTo(30f * sX, 95f * sY)
                    lineTo(70f * sX, 95f * sY)
                    moveTo(50f * sX, 95f * sY)
                    lineTo(40f * sX, 100f * sY)
                    moveTo(50f * sX, 95f * sY)
                    lineTo(60f * sX, 100f * sY)
                }
                drawPath(p2, Color(0xFF1E293B), style = Stroke(width = 4f * sX, cap = StrokeCap.Round))
                
                val p3 = Path().apply {
                    moveTo(25f * sX, 60f * sY)
                    lineTo(75f * sX, 60f * sY)
                    lineTo(65f * sX, 75f * sY)
                    lineTo(35f * sX, 75f * sY)
                    close()
                }
                drawPath(p3, Color(0xFF0F172A))
                drawPath(p3, Color(0xFF1E293B), style = Stroke(width = 2f * sX))

                val p4 = Path().apply {
                    moveTo(25f * sX, 60f * sY)
                    lineTo(75f * sX, 60f * sY)
                    lineTo(65f * sX, 67f * sY)
                    lineTo(35f * sX, 67f * sY)
                    close()
                }
                drawPath(p4, Color(0xFF1E293B))

                val p5 = Path().apply {
                    moveTo(32f * sX, 60f * sY)
                    lineTo(32f * sX, 20f * sY)
                    quadraticBezierTo(50f * sX, 10f * sY, 68f * sX, 20f * sY)
                    lineTo(68f * sX, 60f * sY)
                    close()
                }
                drawPath(p5, tint, style = Stroke(width = 3f * sX))

                val p6 = Path().apply {
                    moveTo(35f * sX, 58f * sY)
                    lineTo(35f * sX, 22f * sY)
                    quadraticBezierTo(50f * sX, 14f * sY, 65f * sX, 22f * sY)
                    lineTo(65f * sX, 58f * sY)
                    close()
                }
                drawPath(p6, Color(0xFF020617))

                val p7 = Path().apply {
                    moveTo(42f * sX, 30f * sY)
                    lineTo(58f * sX, 30f * sY)
                    lineTo(55f * sX, 45f * sY)
                    lineTo(45f * sX, 45f * sY)
                    close()
                }
                drawPath(p7, tint.copy(alpha = 0.15f))

                val p8 = Path().apply {
                    moveTo(23f * sX, 60f * sY)
                    lineTo(23f * sX, 48f * sY)
                    lineTo(28f * sX, 48f * sY)
                }
                drawPath(p8, Color(0xFF475569), style = Stroke(width = 3f * sX, cap = StrokeCap.Round, join = StrokeJoin.Round))

                val p9 = Path().apply {
                    moveTo(77f * sX, 60f * sY)
                    lineTo(77f * sX, 48f * sY)
                    lineTo(72f * sX, 48f * sY)
                }
                drawPath(p9, Color(0xFF475569), style = Stroke(width = 3f * sX, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
        }
    ),
    FurnitureItem(
        id = "lovers-canopy-bed",
        name = "Lover Canopy Bed",
        category = "luxury",
        unlockLevel = 5,
        price = 15000,
        gridWidth = 3,
        gridLength = 3,
        renderIcon = { _ ->
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sX = size.width / 160f
                val sY = size.height / 160f
                
                val p1 = Path().apply {
                    moveTo(10f * sX, 120f * sY)
                    lineTo(80f * sX, 85f * sY)
                    lineTo(150f * sX, 120f * sY)
                    lineTo(80f * sX, 155f * sY)
                    close()
                }
                drawPath(p1, Color(0x59000000))
                
                drawLine(Color(0xFF451A03), Offset(15f * sX, 120f * sY), Offset(15f * sX, 30f * sY), 6f * sX, StrokeCap.Round)
                drawLine(Color(0xFF451A03), Offset(80f * sX, 85f * sY), Offset(80f * sX, 10f * sY), 4f * sX, StrokeCap.Round)
                drawLine(Color(0xFF451A03), Offset(145f * sX, 120f * sY), Offset(145f * sX, 30f * sY), 6f * sX, StrokeCap.Round)

                val p2 = Path().apply {
                    moveTo(20f * sX, 115f * sY)
                    lineTo(80f * sX, 85f * sY)
                    lineTo(140f * sX, 115f * sY)
                    lineTo(80f * sX, 145f * sY)
                    close()
                }
                drawPath(p2, Color(0xFFFECDD3))
                drawPath(p2, Color(0xFFFDA4AF), style = Stroke(width = 2f * sX))

                val p3 = Path().apply {
                    moveTo(45f * sX, 112f * sY)
                    lineTo(80f * sX, 95f * sY)
                    lineTo(130f * sX, 120f * sY)
                    lineTo(90f * sX, 140f * sY)
                    close()
                }
                drawPath(p3, Color(0xFFE11D48))

                val p4 = Path().apply {
                    moveTo(90f * sX, 140f * sY)
                    lineTo(130f * sX, 120f * sY)
                    lineTo(135f * sX, 123f * sY)
                    lineTo(88f * sX, 143f * sY)
                    close()
                }
                drawPath(p4, Color(0xFFBE123C))

                val p5 = Path().apply {
                    moveTo(40f * sX, 100f * sY)
                    lineTo(60f * sX, 90f * sY)
                    lineTo(70f * sX, 95f * sY)
                    lineTo(50f * sX, 105f * sY)
                    close()
                }
                drawPath(p5, Color.White)
                drawPath(p5, Color(0xFFE2E8F0), style = Stroke(width = 1f * sX))

                val p6 = Path().apply {
                    moveTo(62f * sX, 90f * sY)
                    lineTo(82f * sX, 80f * sY)
                    lineTo(92f * sX, 85f * sY)
                    lineTo(72f * sX, 95f * sY)
                    close()
                }
                drawPath(p6, Color.White)
                drawPath(p6, Color(0xFFE2E8F0), style = Stroke(width = 1f * sX))

                val p7 = Path().apply {
                    moveTo(15f * sX, 30f * sY)
                    lineTo(80f * sX, 10f * sY)
                    lineTo(145f * sX, 30f * sY)
                }
                drawPath(p7, Color(0xFFF43F5E), style = Stroke(width = 3f * sX))

                val p8 = Path().apply {
                    moveTo(15f * sX, 30f * sY)
                    quadraticBezierTo(35f * sX, 70f * sY, 20f * sX, 110f * sY)
                }
                drawPath(p8, Color(0x66F43F5E), style = Stroke(width = 8f * sX, cap = StrokeCap.Round))

                val p9 = Path().apply {
                    moveTo(145f * sX, 30f * sY)
                    quadraticBezierTo(125f * sX, 70f * sY, 140f * sX, 110f * sY)
                }
                drawPath(p9, Color(0x66F43F5E), style = Stroke(width = 8f * sX, cap = StrokeCap.Round))

                val heart = Path().apply {
                    moveTo(80f * sX, 40f * sY)
                    quadraticBezierTo(77f * sX, 35f * sY, 72f * sX, 37f * sY)
                    quadraticBezierTo(68f * sX, 40f * sY, 73f * sX, 48f * sY)
                    lineTo(80f * sX, 55f * sY)
                    lineTo(87f * sX, 48f * sY)
                    quadraticBezierTo(92f * sX, 40f * sY, 88f * sX, 37f * sY)
                    quadraticBezierTo(83f * sX, 35f * sY, 80f * sX, 40f * sY)
                    close()
                }
                drawPath(heart, Color(0xFFF43F5E))
            }
        }
    ),
    FurnitureItem(
        id = "ambient-lava-lamp",
        name = "Love Aura Lamp",
        category = "ambient",
        unlockLevel = 2,
        price = 2500,
        gridWidth = 1,
        gridLength = 1,
        renderIcon = { color ->
            val tint = color ?: Color(0xFFEC4899)
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sX = size.width / 60f
                val sY = size.height / 120f

                drawOval(Color(0x4D000000), Offset(12f * sX, 104f * sY), Size(36f * sX, 12f * sY))

                val p1 = Path().apply {
                    moveTo(15f * sX, 110f * sY)
                    lineTo(45f * sX, 110f * sY)
                    lineTo(40f * sX, 95f * sY)
                    lineTo(20f * sX, 95f * sY)
                    close()
                }
                drawPath(p1, Color(0xFF64748B))
                drawPath(p1, Color(0xFF475569), style = Stroke(width = 1f * sX))

                val p2 = Path().apply {
                    moveTo(22f * sX, 95f * sY)
                    lineTo(26f * sX, 35f * sY)
                    cubicTo(28f * sX, 25f * sY, 32f * sX, 25f * sY, 34f * sX, 35f * sY)
                    lineTo(38f * sX, 95f * sY)
                    close()
                }
                drawPath(p2, Color(0x26FFFFFF))
                drawPath(p2, Color(0xFF94A3B8), style = Stroke(width = 1f * sX))

                val p3 = Path().apply {
                    moveTo(23f * sX, 93f * sY)
                    lineTo(27f * sX, 45f * sY)
                    quadraticBezierTo(30f * sX, 40f * sY, 33f * sX, 45f * sY)
                    lineTo(37f * sX, 93f * sY)
                    close()
                }
                drawPath(p3, tint.copy(alpha = 0.75f))

                val p4 = Path().apply {
                    moveTo(25f * sX, 35f * sY)
                    lineTo(35f * sX, 35f * sY)
                    lineTo(32f * sX, 25f * sY)
                    lineTo(28f * sX, 25f * sY)
                    close()
                }
                drawPath(p4, Color(0xFF64748B))

                drawCircle(Color.White.copy(alpha = 0.9f), 4f * sX, Offset(30f * sX, 75f * sY))
                drawCircle(Color.White.copy(alpha = 0.9f), 5f * sX, Offset(28f * sX, 55f * sY))
                drawCircle(tint.copy(alpha = 0.15f), 25f * sX, Offset(30f * sX, 65f * sY))
            }
        }
    ),
    FurnitureItem(
        id = "zen-bonsai-plant",
        name = "Bonsai Harmony",
        category = "decor",
        unlockLevel = 1,
        price = 800,
        gridWidth = 1,
        gridLength = 1,
        renderIcon = { _ ->
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sX = size.width / 80f
                val sY = size.height / 100f
                
                drawOval(Color(0x40000000), Offset(20f * sX, 79f * sY), Size(40f * sX, 12f * sY))
                
                val p1 = Path().apply {
                    moveTo(25f * sX, 75f * sY)
                    lineTo(55f * sX, 75f * sY)
                    lineTo(50f * sX, 90f * sY)
                    lineTo(30f * sX, 90f * sY)
                    close()
                }
                drawPath(p1, Color(0xFFF8FAFC))
                drawPath(p1, Color(0xFFCBD5E1), style = Stroke(width = 1.5f * sX))

                drawOval(Color(0xFFCBD5E1), Offset(25f * sX, 72f * sY), Size(30f * sX, 6f * sY))

                val trunk1 = Path().apply {
                    moveTo(40f * sX, 75f * sY)
                    quadraticBezierTo(42f * sX, 55f * sY, 30f * sX, 50f * sY)
                    quadraticBezierTo(22f * sX, 45f * sY, 35f * sX, 35f * sY)
                    quadraticBezierTo(45f * sX, 28f * sY, 40f * sX, 15f * sY)
                }
                drawPath(trunk1, Color(0xFF78350F), style = Stroke(width = 5f * sX, cap = StrokeCap.Round))

                val trunk2 = Path().apply {
                    moveTo(35f * sX, 50f * sY)
                    quadraticBezierTo(48f * sX, 45f * sY, 45f * sX, 35f * sY)
                }
                drawPath(trunk2, Color(0xFF78350F), style = Stroke(width = 3f * sX, cap = StrokeCap.Round))

                drawCircle(Color(0xFF15803D).copy(alpha = 0.9f), 12f * sX, Offset(28f * sX, 42f * sY))
                drawCircle(Color(0xFF166534), 9f * sX, Offset(25f * sX, 40f * sY))
                drawCircle(Color(0xFF16A34A).copy(alpha = 0.95f), 14f * sX, Offset(48f * sX, 32f * sY))
                drawCircle(Color(0xFF15803D), 11f * sX, Offset(45f * sX, 30f * sY))
                drawCircle(Color(0xFF22C55E).copy(alpha = 0.9f), 10f * sX, Offset(38f * sX, 15f * sY))
                drawCircle(Color(0xFF16A34A), 7f * sX, Offset(36f * sX, 13f * sY))
            }
        }
    ),
    FurnitureItem(
        id = "aquarium-virtual",
        name = "Dynamic Aquarium",
        category = "luxury",
        unlockLevel = 3,
        price = 8000,
        gridWidth = 2,
        gridLength = 2,
        renderIcon = { _ ->
            Canvas(modifier = Modifier.fillMaxSize()) {
                val sX = size.width / 120f
                val sY = size.height / 120f

                val p1 = Path().apply {
                    moveTo(10f * sX, 95f * sY)
                    lineTo(60f * sX, 70f * sY)
                    lineTo(110f * sX, 95f * sY)
                    lineTo(60f * sX, 118f * sY)
                    close()
                }
                drawPath(p1, Color(0x59000000))

                val p2 = Path().apply {
                    moveTo(15f * sX, 85f * sY)
                    lineTo(60f * sX, 63f * sY)
                    lineTo(105f * sX, 85f * sY)
                    lineTo(100f * sX, 105f * sY)
                    lineTo(60f * sX, 115f * sY)
                    lineTo(20f * sX, 105f * sY)
                    close()
                }
                drawPath(p2, Color(0xFF1E293B))
                drawPath(p2, Color(0xFF0F172A), style = Stroke(width = 1.5f * sX))

                val p3 = Path().apply {
                    moveTo(15f * sX, 40f * sY)
                    lineTo(60f * sX, 18f * sY)
                    lineTo(105f * sX, 40f * sY)
                    lineTo(105f * sX, 85f * sY)
                    lineTo(60f * sX, 98f * sY)
                    lineTo(15f * sX, 85f * sY)
                    close()
                }
                drawPath(p3, Color(0x4006B6D4))
                drawPath(p3, Color(0x66FFFFFF), style = Stroke(width = 1.5f * sX))

                val kelp1 = Path().apply {
                    moveTo(35f * sX, 83f * sY)
                    quadraticBezierTo(30f * sX, 65f * sY, 38f * sX, 52f * sY)
                    quadraticBezierTo(43f * sX, 45f * sY, 35f * sX, 35f * sY)
                }
                drawPath(kelp1, Color(0xCC10B981), style = Stroke(width = 3f * sX, cap = StrokeCap.Round))

                val kelp2 = Path().apply {
                    moveTo(85f * sX, 83f * sY)
                    quadraticBezierTo(90f * sX, 68f * sY, 83f * sX, 55f * sY)
                    quadraticBezierTo(78f * sX, 48f * sY, 85f * sX, 38f * sY)
                }
                drawPath(kelp2, Color(0xCC059669), style = Stroke(width = 3f * sX, cap = StrokeCap.Round))

                val fish1 = Path().apply {
                    moveTo(50f * sX, 55f * sY)
                    cubicTo(53f * sX, 53f * sY, 58f * sX, 53f * sY, 60f * sX, 55f * sY)
                    lineTo(65f * sX, 52f * sY)
                    lineTo(63f * sX, 56f * sY)
                    lineTo(60f * sX, 57f * sY)
                    close()
                }
                drawPath(fish1, Color(0xFFF97316))

                val fish2 = Path().apply {
                    moveTo(72f * sX, 70f * sY)
                    cubicTo(75f * sX, 68f * sY, 80f * sX, 68f * sY, 82f * sX, 70f * sY)
                    lineTo(87f * sX, 67f * sY)
                    lineTo(85f * sX, 71f * sY)
                    lineTo(82f * sX, 72f * sY)
                    close()
                }
                drawPath(fish2, Color(0xFFEF4444))

                drawCircle(Color.White.copy(alpha = 0.8f), 1.5f * sX, Offset(58f * sX, 75f * sY))
                drawCircle(Color.White.copy(alpha = 0.8f), 1f * sX, Offset(62f * sX, 60f * sY))
                drawCircle(Color.White.copy(alpha = 0.6f), 2f * sX, Offset(60f * sX, 45f * sY))

                val p4 = Path().apply {
                    moveTo(13f * sX, 38f * sY)
                    lineTo(60f * sX, 15f * sY)
                    lineTo(107f * sX, 38f * sY)
                    lineTo(60f * sX, 45f * sY)
                    close()
                }
                drawPath(p4, Color(0xFF334155))
            }
        }
    )
)
