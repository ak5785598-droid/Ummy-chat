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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

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
            .background(bgColor, RoundedCornerShape(8.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = symbol,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold
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
@Composable
fun UserLevelBadge(level: Int, scale: Float = 1f) {
    val (primary, secondary) = getLevelColors(level)
    val gradientColors = listOf(primary, secondary)
    
    Box(
        modifier = Modifier
            .background(Brush.horizontalGradient(colors = gradientColors), RoundedCornerShape(8.dp))
            .padding(horizontal = (6 * scale).dp, vertical = (2 * scale).dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "👑 Lv.$level",
            color = Color.White,
            fontSize = (10 * scale).sp,
            fontWeight = FontWeight.Black
        )
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
    RoleTag("Official", Color(0xFFB82340), Color(0xFF7F0E27), Color(0xFFFFD700), Color(0xFFFFD700))
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
    Text(
        text = "💰",
        fontSize = size.sp
    )
}

@Composable
fun PremiumDiamondIcon(size: Int = 32) {
    Text(
        text = "💎",
        fontSize = size.sp
    )
}

// ==========================================
// 5. VIP Banner — RN SVGA_VIPBanner parity
// ==========================================
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
            // Left: 3 overlapping diamond gems
            Box(modifier = Modifier.size(48.dp)) {
                Box(
                    modifier = Modifier
                        .offset(x = 0.dp, y = 4.dp)
                        .size(28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFFF69B4).copy(alpha = 0.8f))
                )
                Box(
                    modifier = Modifier
                        .offset(x = 10.dp, y = 0.dp)
                        .size(28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF60A5FA).copy(alpha = 0.8f))
                )
                Box(
                    modifier = Modifier
                        .offset(x = 20.dp, y = 4.dp)
                        .size(28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF34D399).copy(alpha = 0.8f))
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Center: Text
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "VIP Club",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "✨", fontSize = 14.sp)
                }
                Text(
                    text = "Upgrade to VIP and get free coins daily",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
            }

            // Right: GET VIP button
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(25.dp))
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(Color(0xFFFFE770), Color(0xFF9E7302))
                        )
                    )
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "GET VIP",
                    color = Color(0xFF5C4000),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black
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
    QuickActionIcon("👑", Color(0xFFF59E0B), Color(0xFFD97706))
}

@Composable
fun StoreCartIcon() {
    QuickActionIcon("🛒", Color(0xFF8B5CF6), Color(0xFF6D28D9))
}

@Composable
fun MedalStarIcon() {
    QuickActionIcon("⭐", Color(0xFFF59E0B), Color(0xFFD97706))
}

@Composable
fun BonusGiftIcon() {
    QuickActionIcon("🎁", Color(0xFFF43F5E), Color(0xFFE11D48))
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

@Composable fun InviteHeartIcon() = MenuItemIcon("💕", Color(0xFFFDF2F8))
@Composable fun FamilyShieldIcon() = MenuItemIcon("🛡️", Color(0xFFFFF7ED))
@Composable fun BagShirtIcon() = MenuItemIcon("👜", Color(0xFFFAF5FF))
@Composable fun CpHeartIcon() = MenuItemIcon("💞", Color(0xFFFDF2F8))
@Composable fun SellerBagIcon() = MenuItemIcon("🛍️", Color(0xFFFEF2F2))
@Composable fun OfficialUserIcon() = MenuItemIcon("👤", Color(0xFFFFF7ED))
@Composable fun SettingsIcon() = MenuItemIcon("⚙️", Color(0xFFF8FAFC))
@Composable fun HelpCenterIcon() = MenuItemIcon("🆘", Color(0xFFF0F9FF))
@Composable fun AboutInfoIcon() = MenuItemIcon("ℹ️", Color(0xFFF8FAFC))

// ==========================================
// 8. Glossy ID Tag
// ==========================================
@Composable
fun GlossyIDTag(label: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(Brush.horizontalGradient(colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A))))
            .padding(horizontal = 8.dp, vertical = 3.5.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = Color(0xFFFBBF24),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
