package app.vercel.ummy_chat.twa.ui.room

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import app.vercel.ummy_chat.twa.R
import app.vercel.ummy_chat.twa.data.model.RoomTask
import app.vercel.ummy_chat.twa.data.model.TaskCategory
import app.vercel.ummy_chat.twa.data.model.RoomTasksConstants
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale

@Composable
fun RoomTasksBottomSheet(
    visible: Boolean,
    onDismiss: () -> Unit,
    vm: RoomViewModel,
    totalRoomGifts: Long = 0L
) {
    val accumulatedBonus = (totalRoomGifts * 0.05).toLong()

    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it })
    ) {
        BackHandler { onDismiss() }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .zIndex(999f)
                .background(Color(0xFF0D011C))
                .navigationBarsPadding()
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                // Hero Section
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(3f / 4f)
                            .background(Color(0xFF1C011E))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Brush.radialGradient(listOf(Color(0x26FFD700), Color.Transparent)))
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Brush.verticalGradient(listOf(Color(0x80FFD700), Color.Transparent, Color.Transparent)))
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .align(Alignment.BottomCenter)
                                .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF0D011C))))
                        )

                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .statusBarsPadding()
                                .padding(top = 8.dp, start = 16.dp)
                                .size(48.dp)
                                .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                                .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                                .align(Alignment.TopStart)
                                .zIndex(100f)
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Close", tint = Color.White)
                        }

                        Image(
                            painter = painterResource(id = R.drawable.pink_violet_golden_task_jar),
                            contentDescription = "Golden Task Jar",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    scaleX = 1.05f
                                    scaleY = 1.05f
                                }
                        )

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 110.dp)
                                .align(Alignment.TopCenter),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Room\nMissions",
                                color = Color.White,
                                fontSize = 40.sp,
                                fontWeight = FontWeight.Black,
                                fontStyle = FontStyle.Italic,
                                textAlign = TextAlign.Center,
                                letterSpacing = (-2).sp,
                                modifier = Modifier.shadow(20.dp, spotColor = Color(0xB38D4F80))
                            )
                            Box(
                                modifier = Modifier
                                    .width(80.dp)
                                    .height(4.dp)
                                    .padding(top = 8.dp)
                                    .background(
                                        Brush.horizontalGradient(
                                            listOf(Color.Transparent, Color(0xFFF9E58A), Color.Transparent)
                                        )
                                    )
                            )
                        }

                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 24.dp, start = 40.dp, end = 40.dp)
                                .clip(RoundedCornerShape(24.dp))
                                .background(Color.Black.copy(alpha = 0.4f))
                                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                                .padding(horizontal = 20.dp, vertical = 12.dp)
                        ) {
                            Text(
                                text = "The Task Jar allows the room host to get a \uD83D\uDD355% bonus \uD83D\uDD35 of the total Gold Coins consumed in the room.",
                                color = Color(0xFFFFD1DC),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center,
                                lineHeight = 20.sp
                            )
                        }
                    }

                    // Accumulated Bonus Panel
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(
                                    Brush.linearGradient(
                                        listOf(Color(0xFF805E26), Color(0xFFB38D4F), Color(0xFF5E4113))
                                    )
                                )
                                .padding(1.5.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color(0xFF4D0246))
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = String.format(Locale.US, "%,d", accumulatedBonus),
                                    color = Color(0xFFF9E58A),
                                    fontSize = 30.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "ACCUMULATED BONUS GOLD COINS",
                                    color = Color(0xFFE8C27E).copy(alpha = 0.6f),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp
                                )
                            }
                        }
                    }

                    // Daily Missions Header + Timer
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                            .padding(top = 16.dp, bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "DAILY MISSIONS",
                            color = Color(0xFFF9E58A),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                        Spacer(Modifier.weight(1f))
                        Box(
                            modifier = Modifier
                                .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            ResetTimerText()
                        }
                    }
                }

                // Task Cards
                items(RoomTasksConstants.ROOM_TASKS) { task ->
                    val taskProgress by vm.taskProgress.collectAsState()
                    val achievedTasks by vm.achievedTasks.collectAsState()
                    val claimedTasks by vm.claimedTasks.collectAsState()
                    val progress = taskProgress[task.id] ?: 0
                    val isAchieved = achievedTasks.contains(task.id) || progress >= task.target
                    val isClaimed = claimedTasks.contains(task.id)

                    TaskCard(
                        task = task,
                        progress = progress,
                        isAchieved = isAchieved,
                        isClaimed = isClaimed,
                        onClaim = { vm.claimTask(task.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ResetTimerText() {
    var timeLeft by remember { mutableStateOf("00:00:00") }

    LaunchedEffect(Unit) {
        while (true) {
            val cal = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
            val now = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 24)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val nextReset = cal.timeInMillis
            val diff = nextReset - now
            if (diff <= 0) {
                timeLeft = "00:00:00"
            } else {
                val h = (diff / (1000 * 60 * 60)).toInt()
                val m = ((diff / (1000 * 60)) % 60).toInt()
                val s = ((diff / 1000) % 60).toInt()
                timeLeft = String.format("End in %02d:%02d:%02d", h, m, s)
            }
            delay(1000)
        }
    }

    Text(timeLeft, color = Color(0xFFFCA5A5), fontSize = 10.sp, fontWeight = FontWeight.Black)
}

@Composable
private fun TaskCard(
    task: RoomTask,
    progress: Int,
    isAchieved: Boolean,
    isClaimed: Boolean,
    onClaim: () -> Unit
) {
    val progressFloat = (progress.toFloat() / task.target.toFloat()).coerceIn(0f, 1f)

    val icon: ImageVector = when (task.category) {
        TaskCategory.MIC -> Icons.Default.Mic
        TaskCategory.INVITE -> Icons.Default.PersonAdd
        TaskCategory.GIFT -> Icons.Default.CardGiftcard
        TaskCategory.TRAFFIC, TaskCategory.FOLLOW -> Icons.Default.Group
        TaskCategory.SHARE -> Icons.Default.Share
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.05f))
            .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.3f))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = Color(0xFFF9E58A), modifier = Modifier.size(18.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    task.title,
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2
                )
                Text(
                    "+${task.reward} Coins",
                    color = Color(0xFFFBBF24),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            if (isClaimed) {
                Column(
                    modifier = Modifier.width(70.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Claimed",
                        tint = Color(0xFF22C55E),
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        "Claimed",
                        color = Color(0xFF22C55E),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            } else if (isAchieved) {
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFFEAB308), Color(0xFFD97706))
                            )
                        )
                        .clickable(onClick = onClaim)
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Claim",
                        color = Color.Black,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            } else {
                Column(
                    modifier = Modifier.width(70.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.RadioButtonUnchecked,
                        contentDescription = "Pending",
                        tint = Color.White.copy(alpha = 0.2f),
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        "Pending",
                        color = Color.White.copy(alpha = 0.3f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(Color.Black.copy(alpha = 0.4f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(progressFloat)
                    .clip(RoundedCornerShape(3.dp))
                    .background(
                        if (isAchieved) Color(0xFF22C55E)
                        else Color(0xFFEAB308)
                    )
            )
        }

        Text(
            text = "${minOf(progress, task.target)} / ${task.target} ${task.unit ?: ""}",
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            textAlign = TextAlign.End
        )
    }
}
