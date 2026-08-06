package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

// ─────────────────────────────────────────────────────────────────────────────
// OfficialCenterDialog — 1-to-1 RN parity of OfficialCenterDialog.tsx
// Bottom sheet dark theme, level-based title, admin links list
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun OfficialCenterDialog(
    visible: Boolean,
    onDismiss: () -> Unit,
    isAuthorized: Boolean,
    userLevel: Int,
    onNavigate: (String) -> Unit = {}
) {
    if (!visible || !isAuthorized) return

    // Dynamic metadata based on userLevel — RN L30-53
    val (title, subtitle) = when {
        userLevel >= 6 -> "Supreme Authority" to "Tribal Command & Control Center"
        userLevel >= 4 -> "Operations Desk" to "Staff Management & Moderation"
        userLevel == 3 -> "Audit Control" to "Financial Oversight & Ledger Reports"
        else -> "Support Desk" to "User Operations Support Room"
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        // RN: backgroundColor:'#0f172a', borderTopLeftRadius:32, maxHeight:'85%'
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(top = 60.dp),
            shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
            color = Color(0xFF0F172A)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // ── Header with gradient — RN L97-142 ──
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0x1A6366F1), Color.Transparent)
                            )
                        )
                        .padding(24.dp)
                ) {
                    // Close button — RN: absolute top:20 right:20
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.05f))
                            .clickable { onDismiss() }
                            .padding(6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Close, "Close",
                            tint = Color.White.copy(alpha = 0.6f),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Shield icon — RN: w:64 h:64 bg:#ef4444 borderRadius:16
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color(0xFFEF4444)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Shield, "Shield",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Title — RN: fontSize:20 fontWeight:900 letterSpacing:2 uppercase
                        Text(
                            title,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            letterSpacing = 2.sp
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        // Subtitle — RN: fontSize:9 fontWeight:800 color:rgba(255,255,255,0.4) letterSpacing:3
                        Text(
                            subtitle.uppercase(),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White.copy(alpha = 0.4f),
                            letterSpacing = 3.sp
                        )
                    }
                }

                // ── Links list — RN L145-219 ──
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 20.dp)
                ) {
                    // Admin Portal / Operations Hub / Audit Panel / Support Desk — all levels
                    val portalLabel = when {
                        userLevel >= 6 -> "Admin Portal"
                        userLevel >= 4 -> "Operations Hub"
                        userLevel == 3 -> "Audit Panel"
                        else -> "Support Desk"
                    }
                    AdminLinkItem(
                        icon = Icons.Default.Shield,
                        label = portalLabel,
                        iconBg = Color(0xFFEF4444).copy(alpha = 0.2f),
                        iconTint = Color(0xFFF87171),
                        onClick = { onDismiss(); onNavigate("/admin") }
                    )

                    // Broadcast & Banning — level >= 6
                    if (userLevel >= 6) {
                        AdminLinkItem(
                            icon = Icons.Default.Campaign,
                            label = "Broadcast & Banning",
                            iconBg = Color(0xFFFBBF24).copy(alpha = 0.2f),
                            iconTint = Color(0xFFFBBF24),
                            onClick = { onDismiss(); onNavigate("/admin") }
                        )
                    }

                    // Store Management — level >= 3
                    if (userLevel >= 3) {
                        AdminLinkItem(
                            icon = Icons.Default.ShoppingBag,
                            label = "Store Management",
                            iconBg = Color(0xFFC084FC).copy(alpha = 0.2f),
                            iconTint = Color(0xFFC084FC),
                            onClick = { onDismiss(); onNavigate("/store") }
                        )
                    }

                    // Game Controls — level >= 4 or < 3
                    if (userLevel >= 4 || userLevel < 3) {
                        AdminLinkItem(
                            icon = Icons.Default.AdsClick,
                            label = "Game Controls",
                            iconBg = Color(0xFF4ADE80).copy(alpha = 0.2f),
                            iconTint = Color(0xFF4ADE80),
                            onClick = { onDismiss(); onNavigate("/games") }
                        )
                    }

                    // Task Management — level >= 6
                    if (userLevel >= 6) {
                        AdminLinkItem(
                            icon = Icons.AutoMirrored.Filled.Assignment,
                            label = "Task Management",
                            iconBg = Color(0xFF60A5FA).copy(alpha = 0.2f),
                            iconTint = Color(0xFF60A5FA),
                            onClick = { onDismiss(); onNavigate("/tasks") }
                        )
                    }

                    // Coin Dispatch — level >= 3
                    if (userLevel >= 3) {
                        AdminLinkItem(
                            icon = Icons.Default.CreditCard,
                            label = "Coin Dispatch",
                            iconBg = Color(0xFF22D3EE).copy(alpha = 0.2f),
                            iconTint = Color(0xFF22D3EE),
                            onClick = { onDismiss(); onNavigate("/wallet") }
                        )
                    }

                    // Leaderboard — level >= 4
                    if (userLevel >= 4) {
                        AdminLinkItem(
                            icon = Icons.Default.EmojiEvents,
                            label = "Leaderboard",
                            iconBg = Color(0xFFFB923C).copy(alpha = 0.2f),
                            iconTint = Color(0xFFFB923C),
                            onClick = { onDismiss(); onNavigate("/leaderboard") }
                        )
                    }
                }

                // ── Footer — RN L222-230 ──
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(99.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(99.dp))
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF22C55E))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "AUTHORIZATION ACTIVE",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White.copy(alpha = 0.6f),
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminLinkItem(
    icon: ImageVector,
    label: String,
    iconBg: Color,
    iconTint: Color,
    onClick: () -> Unit
) {
    // RN: paddingVertical:16 paddingHorizontal:12 borderBottom:1 rgba(255,255,255,0.05)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 16.dp, horizontal = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Icon bg — RN: p-2 rounded-xl
            Box(
                modifier = Modifier
                    .padding(end = 12.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(iconBg)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = iconTint, modifier = Modifier.size(20.dp))
            }
            // Label — RN: font-bold text-sm tracking-tight text-white/95
            Text(
                label,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.95f)
            )
        }
        Icon(
            Icons.Default.ChevronRight, null,
            tint = Color.White.copy(alpha = 0.2f),
            modifier = Modifier.size(16.dp)
        )
    }
}
