package app.vercel.ummy_chat.twa.ui.games

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class GameCardModel(val id: String, val name: String, val desc: String, val iconEmoji: String, val colorHex: Long)

val MINI_GAMES_LIST = listOf(
    GameCardModel("ludo", "Ludo Master", "4-Player Realtime Board Game", "🎲", 0xFF6366F1),
    GameCardModel("carrom", "Carrom 3D", "2-Player Realtime Physics Game", "🎯", 0xFF10B981),
    GameCardModel("teen_patti", "Teen Patti", "Classic Indian 3-Card Poker", "🃏", 0xFFF59E0B),
    GameCardModel("roulette", "Lucky Spin Wheel", "Spin the wheel for jackpot coins", "🎰", 0xFFEC4899),
    GameCardModel("dice", "Dice Duel", "Roll higher than your opponent", "🎲", 0xFF3B82F6),
    GameCardModel("chest", "Golden Chest", "Open daily chests for rewards", "🎁", 0xFFFBBF24)
)

@Composable
fun GamesHubScreen(
    onBack: () -> Unit,
    onLaunchGame: (gameId: String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("‹", color = Color.White, fontSize = 28.sp, modifier = Modifier.clickable { onBack() })
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Mini Games Hub", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFD946EF).copy(alpha = 0.2f))
                        .border(1.dp, Color(0xFFD946EF), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text("🏆 JACKPOT", color = Color(0xFFD946EF), fontWeight = FontWeight.Black, fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Games Grid (2 Columns)
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(MINI_GAMES_LIST) { game ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(130.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(game.colorHex).copy(alpha = 0.3f), Color(0xFF1E293B))
                                )
                            )
                            .border(1.dp, Color(game.colorHex).copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                            .clickable { onLaunchGame(game.id) }
                            .padding(14.dp)
                    ) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(game.iconEmoji, fontSize = 36.sp)
                            Column {
                                Text(game.name, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp)
                                Text(game.desc, color = Color.Gray, fontSize = 10.sp, maxLines = 1)
                            }
                        }
                    }
                }
            }
        }
    }
}
