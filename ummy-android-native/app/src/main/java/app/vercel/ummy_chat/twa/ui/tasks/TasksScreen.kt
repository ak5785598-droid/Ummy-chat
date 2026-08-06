package app.vercel.ummy_chat.twa.ui.tasks

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
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

// React Native tasks/index.tsx → Kotlin Compose (EXACT PARITY)

@Composable
fun TasksScreen(onBack: () -> Unit) {
    val db = FirebaseFirestore.getInstance()
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val scope = rememberCoroutineScope()

    var activityPoints by remember { mutableLongStateOf(0L) }
    var streak by remember { mutableIntStateOf(0) }
    var lastCheckIn by remember { mutableStateOf<String?>(null) }
    var isCheckedInToday by remember { mutableStateOf(false) }
    var tasks by remember { mutableStateOf(listOf<Map<String, Any?>>()) }
    var completedTaskIds by remember { mutableStateOf(setOf<String>()) }
    var collectedTaskIds by remember { mutableStateOf(setOf<String>()) }
    var isLoading by remember { mutableStateOf(true) }
    var success by remember { mutableStateOf<String?>(null) }

    // Fetch data
    LaunchedEffect(uid) {
        if (uid.isEmpty()) { isLoading = false; return@LaunchedEffect }
        try {
            // User profile
            val userSnap = db.collection("users").document(uid).get().await()
            activityPoints = userSnap.getLong("activityPoints") ?: 0L
            streak = (userSnap.getLong("streak") ?: 0L).toInt()
            lastCheckIn = userSnap.getString("lastCheckIn")

            // Check if checked in today
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            isCheckedInToday = lastCheckIn == today

            // Global tasks
            val tasksSnap = db.collection("globalTasks")
                .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get().await()
            tasks = tasksSnap.documents.map { it.data ?: emptyMap() }

            // Completed tasks
            val completedSnap = db.collection("users").document(uid)
                .collection("completedTasks").get().await()
            completedTaskIds = completedSnap.documents.mapNotNull { it.id }.toSet()

            // Collected tasks
            val collectedSnap = db.collection("users").document(uid)
                .collection("collectedTasks").get().await()
            collectedTaskIds = collectedSnap.documents.mapNotNull { it.id }.toSet()
        } catch (_: Exception) {}
        isLoading = false
    }

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Header
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.List, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(28.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text("Tasks", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF1E293B))
            Spacer(modifier = Modifier.weight(1f))
            Text("🔥 $streak", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF59E0B))
        }
        Divider(color = Color(0xFFF1F5F9))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF7C3AED))
            }
        } else {
            Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(16.dp)) {
                // ─── Activity Points Card ─────────────────────────────────
                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                    Box(modifier = Modifier.fillMaxWidth().background(Brush.horizontalGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316)))).padding(20.dp)) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            Text("Activity Points", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("$activityPoints", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("🔥 Streak: $streak days", color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // ─── Daily Attendance (7 Days) ────────────────────────────
                Text("Daily Attendance", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF1E293B))
                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    val days = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
                    val rewards = listOf(100, 200, 300, 500, 800, 1200, 2000)
                    val dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1 // 0=Sun
                    val adjustedDay = if (dayOfWeek == 0) 6 else dayOfWeek - 1 // 0=Mon

                    days.forEachIndexed { index, day ->
                        val isCompleted = index < adjustedDay || (index == adjustedDay && isCheckedInToday)
                        val isToday = index == adjustedDay
                        Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .then(
                                        when {
                                            isCompleted -> Modifier.background(Color(0xFF22C55E))
                                            isToday -> Modifier.background(Brush.horizontalGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316))))
                                            else -> Modifier.background(Brush.linearGradient(listOf(Color(0xFFE2E8F0), Color(0xFFCBD5E1))))
                                        }
                                    )
                                    .then(if (isToday && !isCheckedInToday) Modifier.border(2.dp, Color(0xFFF59E0B), CircleShape) else Modifier),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isCompleted) {
                                    Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(18.dp))
                                } else {
                                    Text("🎁", fontSize = 16.sp)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(day, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = if (isToday) Color(0xFFF59E0B) else Color(0xFF94A3B8))
                            Text("${rewards[index]}", fontSize = 8.sp, color = Color(0xFF94A3B8))
                        }
                    }
                }

                // Check-in Button
                Spacer(modifier = Modifier.height(16.dp))
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).then(
                    if (isCheckedInToday) Modifier.background(Color(0xFFE2E8F0))
                    else Modifier.background(Brush.horizontalGradient(listOf(Color(0xFFF59E0B), Color(0xFFF97316))))
                ).clickable(enabled = !isCheckedInToday) {
                    if (!isCheckedInToday) {
                        scope.launch {
                            try {
                                val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                                val newStreak = streak + 1
                                db.collection("users").document(uid).update(
                                    mapOf(
                                        "lastCheckIn" to today,
                                        "streak" to newStreak,
                                        "activityPoints" to (activityPoints + 100)
                                    )
                                ).await()
                                isCheckedInToday = true
                                streak = newStreak
                                activityPoints += 100
                                success = "Checked in! +100 points"
                            } catch (e: Exception) { success = "Error: ${e.message}" }
                        }
                    }
                }.padding(14.dp), contentAlignment = Alignment.Center) {
                    Text(
                        if (isCheckedInToday) "✓ Already Checked In" else "Check In",
                        color = if (isCheckedInToday) Color(0xFF94A3B8) else Color.White,
                        fontWeight = FontWeight.Bold, fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // ─── Daily Tasks ──────────────────────────────────────────
                Text("Daily Tasks", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF1E293B))
                Spacer(modifier = Modifier.height(12.dp))

                if (tasks.isEmpty()) {
                    Text("No tasks available", color = Color(0xFF94A3B8), fontSize = 13.sp)
                } else {
                    tasks.forEach { task ->
                        val taskId = task["id"] as? String ?: ""
                        val title = task["title"] as? String ?: "Task"
                        val description = task["description"] as? String ?: ""
                        val reward = (task["reward"] as? Number)?.toLong() ?: 0L
                        val isCompleted = taskId in completedTaskIds
                        val isCollected = taskId in collectedTaskIds

                        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(12.dp)) {
                            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                // Task icon
                                Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFEF3C7)), contentAlignment = Alignment.Center) {
                                    Text("🎯", fontSize = 18.sp)
                                }
                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF1E293B))
                                    if (description.isNotBlank()) {
                                        Text(description, fontSize = 11.sp, color = Color(0xFF64748B))
                                    }
                                    Text("+$reward points", fontSize = 11.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
                                }

                                // Action button
                                when {
                                    isCollected -> {
                                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFF22C55E)).padding(horizontal = 12.dp, vertical = 6.dp)) {
                                            Text("✓ Done", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    isCompleted -> {
                                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFF59E0B)).clickable {
                                            scope.launch {
                                                try {
                                                    db.collection("users").document(uid).collection("collectedTasks").document(taskId).set(mapOf("collectedAt" to Timestamp.now())).await()
                                                    db.collection("users").document(uid).update("activityPoints", activityPoints + reward).await()
                                                    collectedTaskIds = collectedTaskIds + taskId
                                                    activityPoints += reward
                                                    success = "Collected +$reward points!"
                                                } catch (e: Exception) { success = "Error: ${e.message}" }
                                            }
                                        }.padding(horizontal = 12.dp, vertical = 6.dp)) {
                                            Text("Collect", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    else -> {
                                        Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFE2E8F0)).padding(horizontal = 12.dp, vertical = 6.dp)) {
                                            Text("Pending", color = Color(0xFF94A3B8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Toast
        success?.let {
            LaunchedEffect(it) { kotlinx.coroutines.delay(3000); success = null }
            Text(it, color = if (it.startsWith("Error")) Color(0xFFEF4444) else Color(0xFF22C55E), modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
    }
}
