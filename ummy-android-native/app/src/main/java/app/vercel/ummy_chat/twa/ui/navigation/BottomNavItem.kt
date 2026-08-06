package app.vercel.ummy_chat.twa.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

// React Native (tabs)/_layout.tsx L86-145: lucide icons Home / Compass / Mail / User
sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Home : BottomNavItem("home", "Home", Icons.Filled.Home)
    object Discover : BottomNavItem("discover", "Discover", Icons.Filled.Explore)
    object Messages : BottomNavItem("messages", "Message", Icons.Filled.Email)
    object Profile : BottomNavItem("profile", "Me", Icons.Filled.Person)
}
