package app.vercel.ummy_chat.twa.ui.gift

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.data.model.DEFAULT_GIFTS_LIST
import app.vercel.ummy_chat.twa.data.model.GiftModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GiftBottomSheet(
    onDismiss: () -> Unit,
    onSendGift: (gift: GiftModel, count: Int) -> Unit
) {
    var selectedCategory by remember { mutableStateOf("HOT") }
    val categories = listOf("HOT", "SPECIAL", "LUXURY", "VIP")
    var selectedGift by remember { mutableStateOf<GiftModel?>(DEFAULT_GIFTS_LIST[0]) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E1B4B)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // Category Tabs Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) Color(0xFF6366F1) else Color(0xFF31103F))
                            .clickable { selectedCategory = cat }
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(cat, color = if (isSelected) Color.White else Color.Gray, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Gift Grid Items (4 Columns)
            val filteredGifts = DEFAULT_GIFTS_LIST.filter { it.category == selectedCategory }
            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredGifts) { gift ->
                    val isSelected = selectedGift?.id == gift.id
                    val isLocked = gift.requiredSvipLevel > userSvipLevel
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .border(
                                width = if (isSelected) 2.dp else 0.5.dp,
                                color = if (isSelected) Color(0xFF22D3EE) else Color(0xFF475569),
                                shape = RoundedCornerShape(14.dp)
                            )
                            .background(if (isSelected) Color(0xFF312E81) else Color(0xFF0F172A))
                            .clickable { if (!isLocked) selectedGift = gift }
                            .padding(8.dp)
                    ) {
                        Text(gift.iconEmoji, fontSize = 32.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        if (isLocked) {
                            Text("SVIP + Only", color = Color.Red, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        } else {
                            Text(gift.name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("🟡", fontSize = 10.sp)
                            Text("${gift.price}", color = Color(0xFFFBBF24), fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Footer Send Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Balance:", color = Color.Gray, fontSize = 12.sp)
                    Text("🟡 125,000", color = Color(0xFFFBBF24), fontWeight = FontWeight.Black, fontSize = 13.sp)
                }

                Button(
                    onClick = {
                        selectedGift?.let { onSendGift(it, 1) }
                        onDismiss()
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEC4899))
                ) {
                    Text("Send 🎁", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

