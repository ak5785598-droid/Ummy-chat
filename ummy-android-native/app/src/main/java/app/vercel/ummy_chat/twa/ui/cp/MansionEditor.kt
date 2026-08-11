package app.vercel.ummy_chat.twa.ui.cp

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

data class PlacedItem(
    val id: String,
    val catalogId: String,
    var x: Int,
    var y: Int,
    var rotation: Int // 0, 90, 180, 270
)

const val CELL_SIZE = 28 // dp
const val GRID_WIDTH = 12
const val GRID_HEIGHT = 16

@Composable
fun MansionEditor(
    placedItems: List<PlacedItem>,
    isEditMode: Boolean,
    onItemMoved: (index: Int, x: Int, y: Int) -> Unit,
    onItemRotated: (index: Int) -> Unit,
    onItemRemoved: (index: Int) -> Unit
) {
    val density = androidx.compose.ui.platform.LocalDensity.current
    Box(
        modifier = Modifier
            .width((GRID_WIDTH * CELL_SIZE).dp)
            .height((GRID_HEIGHT * CELL_SIZE).dp)
            .background(if (isEditMode) Color.White.copy(alpha = 0.1f) else Color.Transparent)
            .border(
                width = if (isEditMode) 1.dp else 0.dp,
                color = if (isEditMode) Color.White.copy(alpha = 0.3f) else Color.Transparent,
                shape = RoundedCornerShape(16.dp)
            )
            .clip(RoundedCornerShape(16.dp))
    ) {
        // Draw grid lines in edit mode
        if (isEditMode) {
            for (i in 0..GRID_WIDTH) {
                Box(modifier = Modifier.offset(x = (i * CELL_SIZE).dp).width(1.dp).fillMaxHeight().background(Color.White.copy(alpha = 0.15f)))
            }
            for (i in 0..GRID_HEIGHT) {
                Box(modifier = Modifier.offset(y = (i * CELL_SIZE).dp).height(1.dp).fillMaxWidth().background(Color.White.copy(alpha = 0.15f)))
            }
        }

        // Render placed items
        placedItems.forEachIndexed { index, item ->
            val catalogItem = FURNITURE_CATALOG.find { it.id == item.catalogId } ?: return@forEachIndexed
            var offsetX by remember { mutableStateOf(0f) }
            var offsetY by remember { mutableStateOf(0f) }

            Box(
                modifier = Modifier
                    .offset { 
                        IntOffset(
                            (item.x * CELL_SIZE * density.density + offsetX).roundToInt(),
                            (item.y * CELL_SIZE * density.density + offsetY).roundToInt()
                        )
                    }
                    .size((catalogItem.gridWidth * CELL_SIZE).dp, (catalogItem.gridLength * CELL_SIZE).dp)
                    .graphicsLayer { rotationZ = item.rotation.toFloat() }
                    .then(
                        if (isEditMode) Modifier.pointerInput(Unit) {
                            detectDragGestures(
                                onDragEnd = {
                                    val dx = (offsetX / (CELL_SIZE * density.density)).roundToInt()
                                    val dy = (offsetY / (CELL_SIZE * density.density)).roundToInt()
                                    onItemMoved(index, item.x + dx, item.y + dy)
                                    offsetX = 0f
                                    offsetY = 0f
                                }
                            ) { change, dragAmount ->
                                change.consume()
                                offsetX += dragAmount.x
                                offsetY += dragAmount.y
                            }
                        } else Modifier
                    )
            ) {
                catalogItem.renderIcon(null)
                
                if (isEditMode) {
                    Box(modifier = Modifier.fillMaxSize().background(Color(0x33FFFFFF).copy(alpha = 0.2f)).border(1.dp, Color(0xFFF43F5E)))
                    // Controls
                    IconButton(
                        onClick = { onItemRotated(index) },
                        modifier = Modifier.align(Alignment.TopEnd).size(24.dp).background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Rotate", tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                    IconButton(
                        onClick = { onItemRemoved(index) },
                        modifier = Modifier.align(Alignment.TopStart).size(24.dp).background(Color(0xFFEF4444), RoundedCornerShape(12.dp))
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
    }
}
