package app.vercel.ummy_chat.twa.ui.wallet

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

data class RechargePackage(val id: String, val coins: String, val price: String, val bonus: String? = null)

val COIN_PACKAGES_LIST = listOf(
    RechargePackage("p1", "50,000", "₹10"),
    RechargePackage("p2", "500,000", "₹100"),
    RechargePackage("p3", "2,500,000", "₹500", "+250K Bonus"),
    RechargePackage("p4", "5,000,000", "₹1000", "+750K Bonus"),
    RechargePackage("p5", "12,500,000", "₹2500", "+2.5M Bonus"),
    RechargePackage("p6", "50,000,000", "₹10000", "+13.5M Bonus")
)

@Composable
fun WalletScreen(
    onBack: () -> Unit
) {
    var activeTab by remember { mutableStateOf("Coins") }
    var selectedPkgId by remember { mutableStateOf("p1") }

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
                    Text("My Wallet & Store", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                }
            }

            // Wallet Summary Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFF4F46E5), Color(0xFF9333EA))
                        )
                    )
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Current Balance", color = Color(0xFFC7D2FE), fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🟡 125,000", color = Color(0xFFFBBF24), fontWeight = FontWeight.Black, fontSize = 20.sp)
                            Text("💎 450", color = Color(0xFF38BDF8), fontWeight = FontWeight.Black, fontSize = 18.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Coins / Diamonds Tab Selector
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFF1E293B))
                    .padding(4.dp)
            ) {
                listOf("Coins", "Diamonds").forEach { tab ->
                    val isSelected = activeTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color(0xFF6366F1) else Color.Transparent)
                            .clickable { activeTab = tab }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (tab == "Coins") "🟡 Coin Recharge" else "💎 Diamond Exchange",
                            color = if (isSelected) Color.White else Color.Gray,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (activeTab == "Coins") {
                // Packages Grid (2 Columns)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(COIN_PACKAGES_LIST) { pkg ->
                        val isSelected = selectedPkgId == pkg.id
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .border(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) Color(0xFFFBBF24) else Color(0xFF334155),
                                    shape = RoundedCornerShape(16.dp)
                                )
                                .background(if (isSelected) Color(0xFF312E81) else Color(0xFF1E293B))
                                .clickable { selectedPkgId = pkg.id }
                                .padding(16.dp)
                        ) {
                            Text("🟡", fontSize = 24.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(pkg.coins, color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
                            if (pkg.bonus != null) {
                                Text(pkg.bonus, color = Color(0xFF10B981), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFF6366F1))
                                    .padding(horizontal = 16.dp, vertical = 6.dp)
                            ) {
                                Text(pkg.price, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }

                Button(
                    onClick = { },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Recharge Now 🚀", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("💎 Diamond to Coin Instant Exchange Rate: 0.33", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
