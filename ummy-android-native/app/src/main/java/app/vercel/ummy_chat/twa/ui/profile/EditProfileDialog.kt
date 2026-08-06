package app.vercel.ummy_chat.twa.ui.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

private data class CountryItem(val name: String, val code: String, val flag: String)

private val COUNTRIES = listOf(
    CountryItem("India", "IN", "\uD83C\uDDEE\uD83C\uDDF3"),
    CountryItem("Pakistan", "PK", "\uD83C\uDDF5\uD83C\uDDF0"),
    CountryItem("Bangladesh", "BD", "\uD83C\uDDE7\uD83C\uDDE9"),
    CountryItem("United Arab Emirates", "AE", "\uD83C\uDDE6\uD83C\uDDEA"),
    CountryItem("Saudi Arabia", "SA", "\uD83C\uDDF8\uD83C\uDDE6"),
    CountryItem("United States", "US", "\uD83C\uDDFA\uD83C\uDDF8"),
    CountryItem("United Kingdom", "GB", "\uD83C\uDDEC\uD83C\uDDE7"),
    CountryItem("Canada", "CA", "\uD83C\uDDE8\uD83C\uDDE6"),
    CountryItem("Australia", "AU", "\uD83C\uDDE6\uD83C\uDDFA"),
    CountryItem("Other", "OT", "\uD83C\uDF0D")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileDialog(
    onDismissRequest: () -> Unit,
    initialUsername: String = "",
    initialBio: String = "",
    initialGender: String = "",
    initialCountry: String = "",
    initialBirthday: String = "",
    initialWhatsapp: String = "",
    initialAvatarUrl: String = "",
    initialShowBirthday: Boolean = true,
    initialShowWhatsapp: Boolean = true,
    initialSpaceImages: List<String> = emptyList(),
    initialTags: List<String> = emptyList(),
    onSaved: () -> Unit = {}
) {
    val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""
    val db = FirebaseFirestore.getInstance()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var username by remember { mutableStateOf(initialUsername) }
    var bio by remember { mutableStateOf(initialBio) }
    var gender by remember { mutableStateOf(initialGender) }
    var country by remember { mutableStateOf(initialCountry) }
    var birthday by remember { mutableStateOf(initialBirthday) }
    var whatsapp by remember { mutableStateOf(initialWhatsapp) }
    var showBirthday by remember { mutableStateOf(initialShowBirthday) }
    var showWhatsapp by remember { mutableStateOf(initialShowWhatsapp) }
    var spaceImages by remember { mutableStateOf((initialSpaceImages + List(8) { "" }).take(8)) }
    var tags by remember { mutableStateOf(initialTags.toMutableList()) }
    var avatarUri by remember { mutableStateOf<String?>(initialAvatarUrl.ifEmpty { null }) }
    var isSubmitting by remember { mutableStateOf(false) }
    var showCountryPicker by remember { mutableStateOf(false) }
    var uploadingSlot by remember { mutableStateOf(-1) }

    val isGenderFixed = initialGender.isNotEmpty()
    val OFFICIAL_ROLES = listOf("Official", "Super Admin", "CS Leader", "Customer Service", "Auditor", "Manager", "CS")
    val isOfficialUser = initialTags.any { it in OFFICIAL_ROLES }
    val selectedCountry = COUNTRIES.find { it.name == country }

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { avatarUri = it.toString() }
    }

    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
        bitmap?.let {
            val path = java.io.File(context.cacheDir, "avatar_${System.currentTimeMillis()}.jpg")
            java.io.FileOutputStream(path).use { fos -> it.compress(android.graphics.Bitmap.CompressFormat.JPEG, 80, fos) }
            avatarUri = Uri.fromFile(path).toString()
        }
    }

    val spaceGalleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            if (uploadingSlot >= 0 && uploadingSlot < 8) {
                val newImages = spaceImages.toMutableList()
                newImages[uploadingSlot] = it.toString()
                spaceImages = newImages
            }
        }
        uploadingSlot = -1
    }

    fun handleSave() {
        if (username.isBlank() || uid.isEmpty()) return
        isSubmitting = true
        scope.launch {
            try {
                val userRef = db.collection("users").document(uid)
                val profileRef = db.collection("users").document(uid).collection("profile").document(uid)

                val baseData = mutableMapOf<String, Any?>(
                    "username" to username.trim(), "name" to username.trim(),
                    "whatsapp" to whatsapp, "showWhatsapp" to showWhatsapp,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (avatarUri != null) baseData["avatarUrl"] = avatarUri

                val profileData = mutableMapOf<String, Any?>(
                    "username" to username.trim(), "bio" to bio.trim(),
                    "birthday" to birthday, "whatsapp" to whatsapp,
                    "showBirthday" to showBirthday, "showWhatsapp" to showWhatsapp,
                    "spaceImages" to spaceImages.filter { it.isNotEmpty() },
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (country.isNotEmpty()) profileData["country"] = country
                if (!isGenderFixed && gender.isNotEmpty()) profileData["gender"] = gender
                if (isOfficialUser) profileData["tags"] = tags

                userRef.set(baseData, com.google.firebase.firestore.SetOptions.merge()).await()
                profileRef.set(profileData, com.google.firebase.firestore.SetOptions.merge()).await()

                isSubmitting = false
                onSaved()
                onDismissRequest()
            } catch (e: Exception) {
                e.printStackTrace()
                isSubmitting = false
            }
        }
    }

    Dialog(onDismissRequest = onDismissRequest) {
        Surface(modifier = Modifier.fillMaxSize(), color = Color.White) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Purple gradient top + header
                Box(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.fillMaxWidth().height(140.dp).background(Color(0xFFF3E8FF)))
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 48.dp, bottom = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha = 0.7f))
                                .clickable { onDismissRequest() }.padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color(0xFF1E293B), modifier = Modifier.size(22.dp))
                        }
                        Text("MODIFY PERSONA", fontSize = 12.sp, fontWeight = FontWeight.Black, color = Color(0xFF0F172A), letterSpacing = 1.5.sp)
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0xFF8B5CF6))
                                .clickable(enabled = !isSubmitting) { handleSave() }.padding(horizontal = 20.dp, vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isSubmitting) CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            else Text("SAVE", color = Color.White, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.sp)
                        }
                    }
                }

                // Scrollable content
                Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
                    // Avatar
                    Column(modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(Color(0xFFE2E8F0))) {
                            if (avatarUri != null) {
                                AsyncImage(model = ImageRequest.Builder(context).data(avatarUri).crossfade(true).build(),
                                    "Avatar", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            } else {
                                Icon(Icons.Default.Person, "Avatar", tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0xFFFACC15))
                                .clickable { galleryLauncher.launch("image/*") }.padding(horizontal = 20.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CloudUpload, null, tint = Color(0xFF78350F), modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CHANGE PHOTO", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF78350F), letterSpacing = 0.5.sp)
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(Color(0xFFEDE9FE))
                                .clickable { cameraLauncher.launch(null) }.padding(horizontal = 20.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CameraAlt, null, tint = Color(0xFF7C3AED), modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CAMERA", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF7C3AED), letterSpacing = 0.5.sp)
                                }
                            }
                        }
                    }

                    // Name
                    FieldRow(label = "TRIBE DISPLAY NAME", rightContent = {
                        Text("${username.length}/24", fontSize = 9.sp, fontWeight = FontWeight.Bold,
                            color = if (username.length >= 24) Color(0xFFEF4444) else Color(0xFFCBD5E1))
                    }) {
                        TextField(value = username, onValueChange = { if (it.length <= 24) username = it },
                            modifier = Modifier.fillMaxWidth(), singleLine = true,
                            colors = TextFieldDefaults.textFieldColors(containerColor = Color.Transparent, focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent, cursorColor = Color(0xFF8B5CF6)),
                            textStyle = LocalTextStyle.current.copy(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A)))
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Gender
                    FieldRow(label = "GENDER") {
                        if (isGenderFixed) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(if (gender == "Female") "\u2640 Female" else "\u2642 Male",
                                    fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFF1F5F9)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                                    Text("LOCKED", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                                }
                            }
                        } else {
                            Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFFF8FAFC)).padding(4.dp)) {
                                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                    .background(if (gender == "Male") Color(0xFF3B82F6) else Color.Transparent)
                                    .clickable { gender = "Male" }.padding(vertical = 10.dp), contentAlignment = Alignment.Center) {
                                    Text("\u2642 Male", fontWeight = FontWeight.Bold, color = if (gender == "Male") Color.White else Color(0xFF94A3B8))
                                }
                                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                    .background(if (gender == "Female") Color(0xFFEC4899) else Color.Transparent)
                                    .clickable { gender = "Female" }.padding(vertical = 10.dp), contentAlignment = Alignment.Center) {
                                    Text("\u2640 Female", fontWeight = FontWeight.Bold, color = if (gender == "Female") Color.White else Color(0xFF94A3B8))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Birthday
                    FieldRow(label = "BIRTHDAY", rightContent = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("PUBLIC VIEW", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            Spacer(modifier = Modifier.width(6.dp))
                            Switch(checked = showBirthday, onCheckedChange = { showBirthday = it },
                                colors = SwitchDefaults.colors(checkedTrackColor = Color(0xFF8B5CF6), uncheckedTrackColor = Color(0xFFE2E8F0)),
                                modifier = Modifier.scale(0.75f))
                        }
                    }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarToday, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            TextField(value = birthday, onValueChange = { birthday = it }, modifier = Modifier.weight(1f), singleLine = true,
                                colors = TextFieldDefaults.textFieldColors(containerColor = Color.Transparent, focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent, cursorColor = Color(0xFF8B5CF6)),
                                textStyle = LocalTextStyle.current.copy(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A)),
                                placeholder = { Text("YYYY-MM-DD", color = Color(0xFFE2E8F0), fontSize = 16.sp, fontWeight = FontWeight.Bold) })
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Country
                    FieldRow(label = "COUNTRY / REGION") {
                        Row(modifier = Modifier.fillMaxWidth().clickable { showCountryPicker = true }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                            if (selectedCountry != null) Text(selectedCountry.flag, fontSize = 22.sp)
                            else Icon(Icons.Default.Public, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(country.ifEmpty { "Select Country" }, fontSize = 16.sp, fontWeight = FontWeight.Bold,
                                color = if (country.isNotEmpty()) Color(0xFF0F172A) else Color(0xFFE2E8F0), modifier = Modifier.weight(1f))
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // WhatsApp
                    FieldRow(label = "WHATSAPP ID", rightContent = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("PUBLIC VIEW", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            Spacer(modifier = Modifier.width(6.dp))
                            Switch(checked = showWhatsapp, onCheckedChange = { showWhatsapp = it },
                                colors = SwitchDefaults.colors(checkedTrackColor = Color(0xFF8B5CF6), uncheckedTrackColor = Color(0xFFE2E8F0)),
                                modifier = Modifier.scale(0.75f))
                        }
                    }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            TextField(value = whatsapp, onValueChange = { whatsapp = it }, modifier = Modifier.weight(1f), singleLine = true,
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Phone),
                                colors = TextFieldDefaults.textFieldColors(containerColor = Color.Transparent, focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent, cursorColor = Color(0xFF8B5CF6)),
                                textStyle = LocalTextStyle.current.copy(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A)),
                                placeholder = { Text("Enter WhatsApp Number", color = Color(0xFFE2E8F0), fontSize = 16.sp, fontWeight = FontWeight.Bold) })
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Bio
                    FieldRow(label = "PERSONALITY SIGNATURE (BIO)") {
                        TextField(value = bio, onValueChange = { bio = it }, modifier = Modifier.fillMaxWidth().heightIn(min = 72.dp),
                            colors = TextFieldDefaults.textFieldColors(containerColor = Color.Transparent, focusedIndicatorColor = Color.Transparent, unfocusedIndicatorColor = Color.Transparent, cursorColor = Color(0xFF8B5CF6)),
                            textStyle = LocalTextStyle.current.copy(fontSize = 15.sp, fontWeight = FontWeight.Medium, color = Color(0xFF0F172A)),
                            placeholder = { Text("Tell your tribe about yourself...", color = Color(0xFFE2E8F0), fontSize = 15.sp, fontWeight = FontWeight.Medium) })
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Space Background
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("SPACE BACKGROUND (${spaceImages.count { it.isNotEmpty() }}/8)", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color(0xFF3B82F6), letterSpacing = 1.sp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Auto-scrolling in profile", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFCBD5E1))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Space images grid
                    val filledSlots = spaceImages.mapIndexed { idx, uri -> idx to uri }.filter { it.second.isNotEmpty() }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        filledSlots.take(4).forEach { (idx, uri) ->
                            Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)).border(2.dp, Color(0xFFF1F5F9), RoundedCornerShape(12.dp))) {
                                AsyncImage(model = uri, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                Box(modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(20.dp).clip(CircleShape)
                                    .background(Color.Black.copy(alpha = 0.6f)).clickable {
                                        val newImages = spaceImages.toMutableList(); newImages[idx] = ""; spaceImages = newImages
                                    }, contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Close, "Remove", tint = Color.White, modifier = Modifier.size(11.dp))
                                }
                            }
                        }
                        if (filledSlots.size < 8) {
                            Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(16.dp)).border(2.dp, Color(0xFFA5F3FC), RoundedCornerShape(16.dp))
                                .background(Color(0x0A06B6D4)).clickable {
                                    uploadingSlot = filledSlots.size; spaceGalleryLauncher.launch("image/*")
                                }, contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Add, "Add", tint = Color(0xFF67E8F9), modifier = Modifier.size(32.dp))
                            }
                        }
                    }

                    if (filledSlots.size > 4) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            filledSlots.drop(4).take(4).forEach { (idx, uri) ->
                                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)).border(2.dp, Color(0xFFF1F5F9), RoundedCornerShape(12.dp))) {
                                    AsyncImage(model = uri, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                    Box(modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(20.dp).clip(CircleShape)
                                        .background(Color.Black.copy(alpha = 0.6f)).clickable {
                                            val newImages = spaceImages.toMutableList(); newImages[idx] = ""; spaceImages = newImages
                                        }, contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.Close, "Remove", tint = Color.White, modifier = Modifier.size(11.dp))
                                    }
                                }
                            }
                            if (filledSlots.size < 8) {
                                Box(modifier = Modifier.size(80.dp).clip(RoundedCornerShape(16.dp)).border(2.dp, Color(0xFFA5F3FC), RoundedCornerShape(16.dp))
                                    .background(Color(0x0A06B6D4)).clickable {
                                        uploadingSlot = filledSlots.size; spaceGalleryLauncher.launch("image/*")
                                    }, contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Add, "Add", tint = Color(0xFF67E8F9), modifier = Modifier.size(32.dp))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(40.dp))
                }
            }
        }
    }

    // Country picker
    if (showCountryPicker) {
        Dialog(onDismissRequest = { showCountryPicker = false }) {
            Surface(modifier = Modifier.fillMaxWidth().padding(top = 100.dp).fillMaxHeight(0.7f),
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp), color = Color.White) {
                Column {
                    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Select Country", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF1E293B))
                        Box(modifier = Modifier.clip(CircleShape).clickable { showCountryPicker = false }.padding(4.dp), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Close, "Close", tint = Color(0xFF64748B), modifier = Modifier.size(20.dp))
                        }
                    }
                    Divider(color = Color(0xFFF1F5F9))
                    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                        COUNTRIES.forEach { item ->
                            Row(modifier = Modifier.fillMaxWidth().clickable { country = item.name; showCountryPicker = false }
                                .background(if (country == item.name) Color(0xFFF3F4F6) else Color.White)
                                .padding(horizontal = 20.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(item.flag, fontSize = 24.sp)
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(item.name, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF1E293B), modifier = Modifier.weight(1f))
                                if (country == item.name) Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(0xFF8B5CF6)))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FieldRow(label: String, rightContent: @Composable (() -> Unit)? = null, content: @Composable () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp)) {
        Row(modifier = Modifier.fillMaxWidth().padding(start = 4.dp, bottom = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color(0xFF94A3B8), letterSpacing = 1.sp)
            rightContent?.invoke()
        }
        content()
        Divider(color = Color(0xFFF1F5F9), thickness = 1.dp, modifier = Modifier.padding(top = 4.dp))
    }
}
