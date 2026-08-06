package app.vercel.ummy_chat.twa.ui.about

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.FileCopy
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// React Native about.tsx → Kotlin Compose (EXACT PARITY)
// Dark theme about page with app info

@Composable
fun AboutScreen(onBack: () -> Unit) {
    val bgDark = Color(0xFF0A0314)
    val purple500 = Color(0xFFA855F7)
    val white = Color.White
    val textDim = Color(0x66FFFFFF)    // rgba(255,255,255,0.4)
    val textMuted = Color(0x4DFFFFFF)  // rgba(255,255,255,0.3)
    val textSubtle = Color(0xB3FFFFFF) // rgba(255,255,255,0.7)
    val cardBg = Color(0x08FFFFFF)     // rgba(255,255,255,0.03)
    val cardBorder = Color(0x0DFFFFFF) // rgba(255,255,255,0.05)
    val separator = Color(0x0FFFFFFF)  // rgba(255,255,255,0.06)

    Box(modifier = Modifier.fillMaxSize().background(bgDark)) {
        Column(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
            // Header (React Native L12-20)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(CircleShape)
                        .clickable { onBack() }
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = white, modifier = Modifier.size(24.dp))
                }
                Text("About Ummy Chat", color = white, fontSize = 18.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.width(40.dp))
            }

            // Content (React Native L22-end)
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 40.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(30.dp))

                // Logo Circle (React Native L33-40): 90x90 purple circle with "U"
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .shadow(16.dp, CircleShape, ambientColor = purple500.copy(alpha = 0.35f))
                        .clip(CircleShape)
                        .background(purple500),
                    contentAlignment = Alignment.Center
                ) {
                    Text("U", color = white, fontSize = 48.sp, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.height(16.dp))

                // App Name (React Native L41)
                Text("Ummy Chat", color = white, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(4.dp))

                // Version (React Native L42)
                Text("Version 1.0.2 (Build 2026)", color = textDim, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(14.dp))

                // Description (React Native L43-44)
                Text(
                    "The ultimate premium social voice chat rooms and friendship lounge app.",
                    color = textSubtle,
                    fontSize = 13.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 24.dp),
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Info Card (React Native L46-68)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(cardBg)
                        .border(1.dp, cardBorder, RoundedCornerShape(16.dp))
                        .padding(horizontal = 16.dp)
                ) {
                    AboutMenuItem(
                        icon = Icons.Default.FileCopy,
                        label = "Terms of Service"
                    )
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(separator))
                    AboutMenuItem(
                        icon = Icons.Default.Shield,
                        label = "Privacy Policy"
                    )
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(separator))
                    AboutMenuItem(
                        icon = Icons.Default.Star,
                        label = "Licenses & Attribution"
                    )
                }

                Spacer(modifier = Modifier.height(50.dp))

                // Copyright (React Native L70)
                Text(
                    "© 2026 Ummy Dev Team. All rights reserved.",
                    color = textMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun AboutMenuItem(icon: ImageVector, label: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* No-op in RN too */ }
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(icon, null, tint = Color(0xFFA855F7), modifier = Modifier.size(18.dp))
            Text(label, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
        }
        Icon(Icons.AutoMirrored.Filled.OpenInNew, null, tint = Color(0x4DFFFFFF), modifier = Modifier.size(16.dp))
    }
}
