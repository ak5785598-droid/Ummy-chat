package app.vercel.ummy_chat.twa.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.vercel.ummy_chat.twa.R
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onNavigateNext: (isAuth: Boolean) -> Unit,
    onNavigateOnboarding: () -> Unit
) {
    // Exact React Native Animation States
    val scaleAnim = remember { Animatable(1.15f) }
    val opacityAnim = remember { Animatable(0f) }
    val textOpacity = remember { Animatable(0f) }
    val textY = remember { Animatable(30f) }

    // 3 Dots Pulse States
    val dot1Opacity = remember { Animatable(0.3f) }
    val dot2Opacity = remember { Animatable(0.3f) }
    val dot3Opacity = remember { Animatable(0.3f) }

    val dot1Scale = remember { Animatable(1f) }
    val dot2Scale = remember { Animatable(1f) }
    val dot3Scale = remember { Animatable(1f) }

    // Start Animations & Check Auth Logic
    LaunchedEffect(Unit) {
        // Image Scale & Fade-in (1000ms easeOut)
        delay(50)
        scaleAnim.animateTo(1.0f, animationSpec = tween(1000, easing = FastOutSlowInEasing))
        opacityAnim.animateTo(1.0f, animationSpec = tween(1000, easing = FastOutSlowInEasing))
    }

    LaunchedEffect(Unit) {
        // Text Slide Up + Fade In (Delay 400ms, Duration 700ms)
        delay(450)
        textOpacity.animateTo(1.0f, animationSpec = tween(700))
        textY.animateTo(0f, animationSpec = tween(700))
    }

    // Dot 1 Pulse Loop
    LaunchedEffect(Unit) {
        while (true) {
            dot1Opacity.animateTo(1.0f, tween(500))
            dot1Scale.animateTo(1.4f, tween(500))
            dot1Opacity.animateTo(0.3f, tween(500))
            dot1Scale.animateTo(1.0f, tween(500))
        }
    }

    // Dot 2 Pulse Loop (Delay 200ms)
    LaunchedEffect(Unit) {
        delay(200)
        while (true) {
            dot2Opacity.animateTo(1.0f, tween(500))
            dot2Scale.animateTo(1.4f, tween(500))
            dot2Opacity.animateTo(0.3f, tween(500))
            dot2Scale.animateTo(1.0f, tween(500))
        }
    }

    // Dot 3 Pulse Loop (Delay 400ms)
    LaunchedEffect(Unit) {
        delay(400)
        while (true) {
            dot3Opacity.animateTo(1.0f, tween(500))
            dot3Scale.animateTo(1.4f, tween(500))
            dot3Opacity.animateTo(0.3f, tween(500))
            dot3Scale.animateTo(1.0f, tween(500))
        }
    }

    // Exact 2800ms Redirect Logic (React Native index.tsx L136-154)
    LaunchedEffect(Unit) {
        delay(2800)
        val user = FirebaseAuth.getInstance().currentUser
        if (user == null) {
            onNavigateNext(false)
        } else {
            val fs = FirebaseFirestore.getInstance()
            fs.collection("users").document(user.uid).get()
                .addOnSuccessListener { snap ->
                    if (snap.exists() && (snap.getBoolean("onboardingComplete") == true || snap.contains("username"))) {
                        onNavigateNext(true)
                    } else {
                        onNavigateOnboarding()
                    }
                }
                .addOnFailureListener {
                    onNavigateNext(true)
                }
        }
    }

    // Exact Background Gradient: ['#ff8ebb', '#ffade0', '#f472b6']
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFFF8EBB),
                        Color(0xFFFFADE0),
                        Color(0xFFF472B6)
                    )
                )
            )
    ) {
        // Splash Image Container with Scale & Opacity
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = scaleAnim.value,
                    scaleY = scaleAnim.value,
                    alpha = opacityAnim.value
                )
        ) {
            Image(
                painter = painterResource(id = R.drawable.splash_bg),
                contentDescription = "Splash Background",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )

            // Web exact overlay: bg-black/10 (rgba(0,0,0,0.1))
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.1f))
            )
        }

        // Bottom Content (Tagline + Bouncing Dots)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp)
                .graphicsLayer(
                    alpha = textOpacity.value,
                    translationY = textY.value
                ),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Text: fontSize 20px, color #222222, fontWeight 400
            Text(
                text = "Ummy - Connect Your Tribe",
                color = Color(0xFF222222),
                fontSize = 20.sp,
                fontWeight = FontWeight.Normal
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 3 Bouncing Dots Container
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .scale(dot1Scale.value)
                        .alpha(dot1Opacity.value)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                )
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .scale(dot2Scale.value)
                        .alpha(dot2Opacity.value)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                )
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .scale(dot3Scale.value)
                        .alpha(dot3Opacity.value)
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                )
            }
        }
    }
}
