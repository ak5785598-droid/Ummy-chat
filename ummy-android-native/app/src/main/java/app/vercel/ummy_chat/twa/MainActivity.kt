package app.vercel.ummy_chat.twa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.core.view.WindowCompat
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.ui.graphics.Color
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import app.vercel.ummy_chat.twa.BuildConfig
import app.vercel.ummy_chat.twa.data.repository.UpdateRepository
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import app.vercel.ummy_chat.twa.ui.room.RoomViewModel
import app.vercel.ummy_chat.twa.ui.room.RoomMiniCard
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import app.vercel.ummy_chat.twa.ui.auth.LoginScreen
import app.vercel.ummy_chat.twa.ui.cp.CPRankingScreen
import app.vercel.ummy_chat.twa.ui.cp.CpHouseScreen
import app.vercel.ummy_chat.twa.ui.dashboard.MainDashboardScreen
import app.vercel.ummy_chat.twa.ui.families.FamilyProfileScreen
import app.vercel.ummy_chat.twa.ui.families.FamiliesScreen
import app.vercel.ummy_chat.twa.ui.games.GamesHubScreen
import app.vercel.ummy_chat.twa.ui.main.MainViewModel
import app.vercel.ummy_chat.twa.ui.onboarding.OnboardingScreen
import app.vercel.ummy_chat.twa.ui.room.RoomScreen
import app.vercel.ummy_chat.twa.ui.search.SearchScreen
import app.vercel.ummy_chat.twa.ui.leaderboard.LeaderboardScreen
import app.vercel.ummy_chat.twa.ui.settings.SettingsScreen
import app.vercel.ummy_chat.twa.ui.level.LevelScreen
import app.vercel.ummy_chat.twa.ui.store.StoreScreen
import app.vercel.ummy_chat.twa.ui.bonus.BonusScreen
import app.vercel.ummy_chat.twa.ui.helpcenter.HelpCenterScreen
import app.vercel.ummy_chat.twa.ui.about.AboutScreen
import app.vercel.ummy_chat.twa.ui.messages.ChatDetailScreen
import app.vercel.ummy_chat.twa.ui.splash.SplashScreen
import app.vercel.ummy_chat.twa.ui.theme.UmmyNativeTheme
import app.vercel.ummy_chat.twa.ui.vips.VipStoreScreen
import app.vercel.ummy_chat.twa.ui.wallet.WalletScreen
import app.vercel.ummy_chat.twa.ui.components.UpdateDialog
import app.vercel.ummy_chat.twa.util.ApkDownloader

class MainActivity : ComponentActivity() {
    private val mainViewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        lifecycle.addObserver(mainViewModel)
        mainViewModel.initializeUserPresence()

        setContent {
            UmmyNativeTheme {
                val navController = rememberNavController()
                val context = LocalContext.current
                val scope = rememberCoroutineScope()
                val roomVm: RoomViewModel = androidx.lifecycle.viewmodel.compose.viewModel(context as ComponentActivity)
                val activeRoom by roomVm.room.collectAsState()
                val isRoomMinimized by roomVm.isMinimized.collectAsState()
                var updateInfo by remember { mutableStateOf<app.vercel.ummy_chat.twa.data.model.UpdateModel?>(null) }
                var showUpdateDialog by remember { mutableStateOf(false) }
                var isDownloading by remember { mutableStateOf(false) }
                var downloadProgress by remember { mutableStateOf(0f) }
                var downloadError by remember { mutableStateOf<String?>(null) }

                LaunchedEffect(Unit) {
                    val repository = UpdateRepository()
                    val latest = repository.getLatestVersionInfo()
                    if (latest != null && latest.latestVersionCode > BuildConfig.VERSION_CODE) {
                        updateInfo = latest
                        showUpdateDialog = true
                    }
                }

                if (showUpdateDialog && updateInfo != null) {
                    val apkUrl = updateInfo!!.updateUrl
                    UpdateDialog(
                        versionName = updateInfo!!.latestVersionName,
                        releaseNotes = updateInfo!!.releaseNotes,
                        forceUpdate = updateInfo!!.forceUpdate,
                        isDownloading = isDownloading,
                        downloadProgress = downloadProgress,
                        downloadError = downloadError,
                        onUpdate = {
                            if (apkUrl.isBlank()) {
                                updateInfo = null
                                showUpdateDialog = false
                            } else {
                                downloadError = null
                                isDownloading = true
                                downloadProgress = 0f
                                scope.launch {
                                    val downloader = ApkDownloader(context)
                                    val result = downloader.downloadAndInstall(apkUrl) { progress ->
                                        downloadProgress = progress
                                    }
                                    if (result.isFailure) {
                                        isDownloading = false
                                        downloadProgress = 0f
                                        downloadError = result.exceptionOrNull()?.message ?: "Download failed. Please try again."
                                    }
                                }
                            }
                        },
                        onDismiss = { showUpdateDialog = false }
                    )
                }

                Box(modifier = Modifier.fillMaxSize()) {
                    NavHost(navController = navController, startDestination = "splash") {
                        composable("splash") {
                            SplashScreen(
                                onNavigateNext = { isAuth ->
                                    if (isAuth) {
                                        navController.navigate("main/home") {
                                            popUpTo("splash") { inclusive = true }
                                        }
                                    } else {
                                        navController.navigate("login") {
                                            popUpTo("splash") { inclusive = true }
                                        }
                                    }
                                },
                                onNavigateOnboarding = {
                                    navController.navigate("onboarding") {
                                        popUpTo("splash") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("login") {
                            LoginScreen(
                                onNavigateHome = {
                                    navController.navigate("main/home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                },
                                onNavigateOnboarding = {
                                    navController.navigate("onboarding") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("onboarding") {
                            OnboardingScreen(
                                onNavigateHome = {
                                    navController.navigate("main/home") {
                                        popUpTo("onboarding") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("main/{tab}") { backStackEntry ->
                            val tab = backStackEntry.arguments?.getString("tab") ?: "home"
                            MainDashboardScreen(
                                initialTab = tab,
                                onNavigateToRoom = { roomId ->
                                    navController.navigate("room/$roomId")
                                },
                                onNavigateToFamilies = {
                                    navController.navigate("families")
                                },
                                onNavigateToFamilyProfile = { familyId ->
                                    navController.navigate("family-profile/$familyId")
                                },
                                onNavigateToCpRanking = {
                                    navController.navigate("cp-ranking")
                                },
                                onNavigateToLeaderboard = {
                                    navController.navigate("leaderboard")
                                },
                                onNavigateToSearch = {
                                    navController.navigate("search")
                                },
                                onNavigateToWallet = {
                                    navController.navigate("wallet")
                                },
                                onNavigateToSettings = {
                                    navController.navigate("settings")
                                },
                                onNavigateToLevel = {
                                    navController.navigate("level")
                                },
                                onNavigateToStore = {
                                    navController.navigate("store")
                                },
                                onNavigateToBonus = {
                                    navController.navigate("bonus")
                                },
                                onNavigateToHelpCenter = {
                                    navController.navigate("help-center")
                                },
                                onNavigateToAbout = {
                                    navController.navigate("about")
                                },
                                onNavigateToVips = {
                                    navController.navigate("vips")
                                },
                                onNavigateToGames = {
                                    navController.navigate("games")
                                },
                                onNavigateToChatDetail = { chatId, recipientId, recipientName, recipientAvatar, recipientIsOnline ->
                                    val safeChatId = chatId.replace("/", "~")
                                    val safeRecipientId = recipientId.ifBlank { "_" }
                                    val encodedName = java.net.URLEncoder.encode(recipientName.ifBlank { "_" }, "UTF-8")
                                    val encodedAvatar = java.net.URLEncoder.encode(recipientAvatar.ifBlank { "_" }, "UTF-8")
                                    navController.navigate("chat-detail/$safeChatId/$safeRecipientId/$encodedName/$encodedAvatar/$recipientIsOnline")
                                },
                                onNavigateToOfficial = {
                                    navController.navigate("official-page")
                                },
                                onNavigateToSystem = {
                                    navController.navigate("system-page")
                                },
                                onNavigateToRequests = {
                                    navController.navigate("requests-page")
                                },
                                onNavigateToTasks = {
                                    navController.navigate("tasks")
                                },
                                onNavigateToAdmin = {
                                    navController.navigate("admin-screen")
                                }
                            )
                        }

                        composable("leaderboard") {
                            LeaderboardScreen(
                                onBack = { navController.popBackStack() },
                                onOpenRoom = { roomId -> navController.navigate("room/$roomId") },
                                onOpenProfile = { uid -> /* Navigate to profile */ }
                            )
                        }

                        composable("search") {
                            SearchScreen(
                                onBack = { navController.popBackStack() },
                                onOpenRoom = { roomId -> navController.navigate("room/$roomId") }
                            )
                        }

                        composable("settings") {
                            SettingsScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("level") {
                            LevelScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("store") {
                            StoreScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("bonus") {
                            BonusScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("help-center") {
                            HelpCenterScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("about") {
                            AboutScreen(onBack = { navController.navigate("main/profile") { popUpTo("main/profile") { inclusive = true } } })
                        }

                        composable("families") {
                            FamiliesScreen(
                                onBack = {
                                    navController.popBackStack()
                                },
                                onOpenFamily = { familyId ->
                                    navController.navigate("family-profile/$familyId")
                                }
                            )
                        }

                        composable("family-profile/{familyId}") { backStackEntry ->
                            val familyId = backStackEntry.arguments?.getString("familyId") ?: ""
                            FamilyProfileScreen(
                                familyId = familyId,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("cp-ranking") {
                            CPRankingScreen(
                                onBack = {
                                    navController.popBackStack()
                                },
                                onGoToMyHouse = {
                                    navController.navigate("cp-house")
                                }
                            )
                        }

                        composable("cp-house") {
                            CpHouseScreen(
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("wallet") {
                            WalletScreen(
                                onBack = {
                                    navController.popBackStack()
                                }
                            )
                        }

                        composable("vips") {
                            VipStoreScreen(
                                onBack = {
                                    navController.popBackStack()
                                }
                            )
                        }

                        composable("games") {
                            GamesHubScreen(
                                onBack = {
                                    navController.popBackStack()
                                },
                                onLaunchGame = { gameId ->
                                    // Launch Game Engine
                                }
                            )
                        }

                        composable("room/{roomId}") { backStackEntry ->
                            val roomId = backStackEntry.arguments?.getString("roomId") ?: "1001"
                            RoomScreen(
                                roomId = roomId,
                                onLeaveRoom = {
                                    navController.popBackStack()
                                },
                                vm = roomVm
                            )
                        }

                        composable("chat-detail/{chatId}/{recipientId}/{recipientName}/{recipientAvatar}/{recipientIsOnline}") { backStackEntry ->
                            val chatId = (backStackEntry.arguments?.getString("chatId") ?: "").replace("~", "/")
                            val rawRecipientId = backStackEntry.arguments?.getString("recipientId") ?: "_"
                            val recipientId = if (rawRecipientId == "_") "" else rawRecipientId
                            val rawName = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("recipientName") ?: "_", "UTF-8")
                            val recipientName = if (rawName == "_") "" else rawName
                            val rawAvatar = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("recipientAvatar") ?: "_", "UTF-8")
                            val recipientAvatar = if (rawAvatar == "_") "" else rawAvatar
                            val recipientIsOnline = backStackEntry.arguments?.getString("recipientIsOnline")?.toBooleanStrictOrNull() ?: false
                            ChatDetailScreen(
                                navController = navController,
                                chatId = chatId,
                                recipientId = recipientId,
                                recipientName = recipientName,
                                recipientAvatar = recipientAvatar,
                                recipientIsOnline = recipientIsOnline
                            )
                        }

                        composable("official-page") {
                            app.vercel.ummy_chat.twa.ui.messages.OfficialPageFullScreen(
                                onBack = {
                                    navController.navigate("main/messages") {
                                        popUpTo("main/messages") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("admin-screen") {
                            app.vercel.ummy_chat.twa.ui.admin.AdminScreen(
                                onBack = {
                                    navController.popBackStack()
                                },
                                onNavigate = { route -> navController.navigate(route) }
                            )
                        }

                        composable("system-page") {
                            app.vercel.ummy_chat.twa.ui.messages.SystemPageFullScreen(
                                onBack = {
                                    navController.navigate("main/messages") {
                                        popUpTo("main/messages") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("requests-page") {
                            app.vercel.ummy_chat.twa.ui.messages.RequestsPageFullScreen(
                                onBack = {
                                    navController.navigate("main/messages") {
                                        popUpTo("main/messages") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("tasks") {
                            app.vercel.ummy_chat.twa.ui.tasks.TasksScreen(
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }

                    if (isRoomMinimized && activeRoom != null) {
                        RoomMiniCard(
                            room = activeRoom!!,
                            onExpand = {
                                roomVm.setMinimized(false)
                                navController.navigate("room/${activeRoom!!.id}")
                            },
                            onExit = {
                                roomVm.leaveRoom()
                                roomVm.setMinimized(false)
                            },
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(bottom = 80.dp, end = 16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "$name!",
        modifier = modifier
    )
}
