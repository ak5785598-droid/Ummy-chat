package app.vercel.ummy_chat.twa.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgencyApplicationScreen(
    onBack: () -> Unit
) {
    val auth = FirebaseAuth.getInstance()
    val db = FirebaseFirestore.getInstance()
    val uid = auth.currentUser?.uid
    val scope = rememberCoroutineScope()

    var agencyName by remember { mutableStateOf("") }
    var whatsapp by remember { mutableStateOf("") }
    var experience by remember { mutableStateOf("") }

    var isSubmitting by remember { mutableStateOf(false) }
    var existingStatus by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf("") }

    // Fetch existing application if any
    LaunchedEffect(uid) {
        if (uid != null) {
            try {
                val query = db.collection("agency_applications")
                    .whereEqualTo("uid", uid)
                    .get()
                    .await()
                
                if (!query.isEmpty) {
                    // Check if there is any pending or approved application
                    val apps = query.documents.mapNotNull { it.getString("status") }
                    if (apps.contains("APPROVED")) {
                        existingStatus = "APPROVED"
                    } else if (apps.contains("PENDING")) {
                        existingStatus = "PENDING"
                    } else {
                        existingStatus = "REJECTED"
                    }
                }
            } catch (e: Exception) {
                // handle error silently
            }
        }
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agency/Center Application", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        containerColor = Color(0xFFF8FAFC)
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFFC084FC))
            }
            return@Scaffold
        }

        if (existingStatus == "PENDING") {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                    Text("Application Pending", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Your application is currently under review by the admin team. Please wait patiently.", 
                        color = Color(0xFF64748B), 
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
            return@Scaffold
        } else if (existingStatus == "APPROVED") {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Your application has already been approved!", color = Color(0xFF10B981), fontWeight = FontWeight.Bold)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (existingStatus == "REJECTED") {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFE4E6)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "Your previous application was rejected. You may apply again.",
                        color = Color(0xFFBE123C),
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Text("Please fill out the form below to apply to become an Official Agency or Center.", color = Color(0xFF475569))

            OutlinedTextField(
                value = agencyName,
                onValueChange = { agencyName = it },
                label = { Text("Agency / Center Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFC084FC),
                    focusedLabelColor = Color(0xFFC084FC)
                )
            )

            OutlinedTextField(
                value = whatsapp,
                onValueChange = { whatsapp = it },
                label = { Text("Contact Info (WhatsApp)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFC084FC),
                    focusedLabelColor = Color(0xFFC084FC)
                )
            )

            OutlinedTextField(
                value = experience,
                onValueChange = { experience = it },
                label = { Text("Experience / Why do you want to join?") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                maxLines = 5,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFC084FC),
                    focusedLabelColor = Color(0xFFC084FC)
                )
            )

            if (message.isNotEmpty()) {
                Text(message, color = Color.Red, fontSize = 14.sp)
            }

            Button(
                onClick = {
                    if (agencyName.isBlank() || whatsapp.isBlank() || experience.isBlank()) {
                        message = "Please fill in all fields"
                        return@Button
                    }
                    if (uid == null) return@Button

                    isSubmitting = true
                    message = ""
                    scope.launch {
                        try {
                            // fetch user data
                            val userSnap = db.collection("users").document(uid).get().await()
                            val username = userSnap.getString("username") ?: userSnap.getString("name") ?: "Unknown"

                            val docRef = db.collection("agency_applications").document()
                            val application = hashMapOf(
                                "id" to docRef.id,
                                "uid" to uid,
                                "username" to username,
                                "agencyName" to agencyName,
                                "contactInfo" to whatsapp,
                                "experience" to experience,
                                "status" to "PENDING",
                                "submittedAt" to System.currentTimeMillis()
                            )
                            
                            docRef.set(application).await()
                            existingStatus = "PENDING"
                        } catch (e: Exception) {
                            message = "Failed to submit application: ${e.message}"
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC084FC)),
                shape = RoundedCornerShape(8.dp),
                enabled = !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text("Submit Application", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
