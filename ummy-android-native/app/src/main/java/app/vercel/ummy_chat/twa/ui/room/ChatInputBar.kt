package app.vercel.ummy_chat.twa.ui.room

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import coil.compose.AsyncImage
import kotlinx.coroutines.delay

// ── Language data (matching RN LANGUAGES + SOURCE_LANGUAGES) ──

private data class Lang(val code: String, val name: String, val flag: String)

private val TARGET_LANGUAGES = listOf(
    Lang("hi", "Hindi", "🇮🇳"), Lang("en", "English", "🇺🇸"), Lang("bn", "Bengali", "🇧🇩"),
    Lang("mr", "Marathi", "🇮🇳"), Lang("te", "Telugu", "🇮🇳"), Lang("ta", "Tamil", "🇮🇳"),
    Lang("gu", "Gujarati", "🇮🇳"), Lang("ur", "Urdu", "🇵🇰"), Lang("kn", "Kannada", "🇮🇳"),
    Lang("or", "Odia", "🇮🇳"), Lang("ml", "Malayalam", "🇮🇳"), Lang("pa", "Punjabi", "🇮🇳"),
    Lang("as", "Assamese", "🇮🇳"), Lang("mai", "Maithili", "🇮🇳"), Lang("sat", "Santhali", "🇮🇳"),
    Lang("ks", "Kashmiri", "🇮🇳"), Lang("ne", "Nepali", "🇳🇵"), Lang("kok", "Konkani", "🇮🇳"),
    Lang("sd", "Sindhi", "🇮🇳"), Lang("doi", "Dogri", "🇮🇳"), Lang("mni", "Manipuri", "🇮🇳"),
    Lang("brx", "Bodo", "🇮🇳"), Lang("sa", "Sanskrit", "🇮🇳"), Lang("bho", "Bhojpuri", "🇮🇳"),
    Lang("bgc", "Haryanvi", "🇮🇳"), Lang("raj", "Rajasthani", "🇮🇳"), Lang("mag", "Magahi", "🇮🇳"),
    Lang("chg", "Chhattisgarhi", "🇮🇳"), Lang("si", "Sinhala", "🇱🇰"), Lang("dz", "Dzongkha", "🇧🇹"),
    Lang("ar", "Arabic", "🇸🇦"), Lang("zh", "Chinese", "🇨🇳"), Lang("es", "Spanish", "🇪🇸"),
    Lang("fr", "French", "🇫🇷"), Lang("ru", "Russian", "🇷🇺"), Lang("pt", "Portuguese", "🇧🇷"),
    Lang("id", "Indonesian", "🇮🇩"), Lang("de", "German", "🇩🇪"), Lang("ja", "Japanese", "🇯🇵"),
    Lang("sw", "Swahili", "🇰🇪"), Lang("tr", "Turkish", "🇹🇷"), Lang("vi", "Vietnamese", "🇻🇳"),
    Lang("it", "Italian", "🇮🇹"), Lang("fa", "Persian", "🇮🇷"), Lang("pl", "Polish", "🇵🇱"),
    Lang("uk", "Ukrainian", "🇺🇦"), Lang("nl", "Dutch", "🇳🇱"), Lang("th", "Thai", "🇹🇭"),
    Lang("el", "Greek", "🇬🇷"), Lang("cs", "Czech", "🇨🇿"), Lang("ro", "Romanian", "🇷🇴"),
    Lang("hu", "Hungarian", "🇭🇺"), Lang("sv", "Swedish", "🇸🇪"), Lang("af", "Afrikaans", "🇿🇦"),
    Lang("he", "Hebrew", "🇮🇱"), Lang("ko", "Korean", "🇰🇷"), Lang("ms", "Malay", "🇲🇾"),
    Lang("my", "Burmese", "🇲🇲"), Lang("tl", "Filipino", "🇵🇭"), Lang("km", "Khmer", "🇰🇭"),
    Lang("lo", "Lao", "🇱🇦"), Lang("kk", "Kazakh", "🇰🇿"), Lang("uz", "Uzbek", "🇺🇿"),
    Lang("az", "Azerbaijani", "🇦🇿"), Lang("ka", "Georgian", "🇬🇪"), Lang("hy", "Armenian", "🇦🇲"),
    Lang("mn", "Mongolian", "🇲🇳"), Lang("fi", "Finnish", "🇫🇮"), Lang("no", "Norwegian", "🇳🇴"),
    Lang("da", "Danish", "🇩🇰"), Lang("zu", "Zulu", "🇿🇦"), Lang("xh", "Xhosa", "🇿🇦"),
    Lang("am", "Amharic", "🇪🇹"), Lang("yo", "Yoruba", "🇳🇬"), Lang("ig", "Igbo", "🇳🇬"),
    Lang("om", "Oromo", "🇪🇹"), Lang("so", "Somali", "🇸🇴"), Lang("ps", "Pashto", "🇦🇫"),
    Lang("ku", "Kurdish", "🇹🇷"), Lang("tt", "Tatar", "🇷🇺"), Lang("ug", "Uyghur", "🇨🇳"),
    Lang("ti", "Tigrinya", "🇪🇹"), Lang("sr", "Serbian", "🇷🇸"), Lang("hr", "Croatian", "🇭🇷"),
    Lang("sl", "Slovenian", "🇸🇮"), Lang("sk", "Slovak", "🇸🇰"), Lang("bg", "Bulgarian", "🇧🇬"),
    Lang("sq", "Albanian", "🇦🇱"), Lang("mk", "Macedonian", "🇲🇰"), Lang("et", "Estonian", "🇪🇪"),
    Lang("lv", "Latvian", "🇱🇻"), Lang("lt", "Lithuanian", "🇱🇹"), Lang("is", "Icelandic", "🇮🇸"),
    Lang("ga", "Irish", "🇮🇪"), Lang("cy", "Welsh", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"), Lang("eu", "Basque", "🇪🇸"),
    Lang("ca", "Catalan", "🇪🇸"), Lang("gl", "Galician", "🇪🇸")
)

private val SOURCE_LANGUAGES = listOf(
    Lang("auto", "Auto Detect", "🌐"), Lang("en", "English", "🇺🇸"), Lang("hi", "Hindi", "🇮🇳"),
    Lang("bn", "Bengali", "🇧🇩"), Lang("te", "Telugu", "🇮🇳"), Lang("mr", "Marathi", "🇮🇳"),
    Lang("ta", "Tamil", "🇮🇳"), Lang("ur", "Urdu", "🇵🇰"), Lang("gu", "Gujarati", "🇮🇳"),
    Lang("kn", "Kannada", "🇮🇳"), Lang("ml", "Malayalam", "🇮🇳"), Lang("pa", "Punjabi", "🇮🇳"),
    Lang("es", "Spanish", "🇪🇸"), Lang("ar", "Arabic", "🇸🇦"), Lang("fr", "French", "🇫🇷"),
    Lang("de", "German", "🇩🇪"), Lang("ja", "Japanese", "🇯🇵"), Lang("zh", "Chinese", "🇨🇳")
)

// ── ChatInputBar composable (matching RN chat-input-bar.tsx) ──

@Composable
fun ChatInputBar(
    visible: Boolean,
    onClose: () -> Unit,
    onSend: (text: String, imageUrl: String?) -> Unit,
    onImageUpload: (String) -> Unit = {},
    targetLanguage: String = "en",
    sourceLanguage: String = "auto",
    onSelectLanguage: (String) -> Unit = {},
    onSelectSourceLanguage: (String) -> Unit = {},
    initialText: String = ""
) {
    if (!visible) return

    var text by remember { mutableStateOf(initialText) }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var showLangPicker by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current

    // Auto-focus + show keyboard immediately when dialog opens (same as RN autoFocus=true)
    LaunchedEffect(Unit) {
        delay(50) // tiny delay for dialog window to attach
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { selectedImageUri = it }
    }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onClose,
        properties = androidx.compose.ui.window.DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        // RN: KeyboardAvoidingView behavior="padding" + Modal transparent
        Box(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()   // push content up when keyboard shows
        ) {
            // RN: backdrop TouchableOpacity (flex:1)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable { onClose() }
            )

            // RN: inputContainer (white box anchored to bottom)
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(Color.White)
                    .padding(bottom = 4.dp)
            ) {
            // Image preview (RN: imageWrapper + previewImage)
            if (selectedImageUri != null) {
                Box(
                    modifier = Modifier.padding(start = 12.dp, top = 8.dp)
                ) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(80.dp)
                            .clip(RoundedCornerShape(12.dp))
                    )
                    // Remove button (RN: removeImageBtn)
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(x = 4.dp, y = (-4).dp)
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.6f))
                            .clickable { selectedImageUri = null },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Remove",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            // Input row (RN: inputRow)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Image picker button (RN: iconCircle)
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF1F5F9))
                        .clickable { imagePicker.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Image,
                        contentDescription = "Pick Image",
                        tint = Color(0xFF475569),
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Text input (RN: textInput gray bg rounded)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0xFFF1F5F9))
                ) {
                    androidx.compose.foundation.text.BasicTextField(
                        value = text,
                        onValueChange = { text = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .defaultMinSize(minHeight = 24.dp)
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                            .focusRequester(focusRequester),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            color = Color(0xFF0F172A),
                            fontSize = 14.sp
                        ),
                        maxLines = 3,
                        decorationBox = { inner ->
                            Box {
                                if (text.isEmpty()) {
                                    Text(
                                        "Type a message...",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 14.sp
                                    )
                                }
                                inner()
                            }
                        }
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Language badge (RN: langBadgeBtn)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFFF1F5F9))
                        .border(0.5f.dp, Color(0xFFCBD5E1), RoundedCornerShape(14.dp))
                        .clickable { showLangPicker = !showLangPicker }
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val lang = TARGET_LANGUAGES.find { it.code == targetLanguage }
                    Text(
                        text = lang?.let { "${it.flag} ${it.code.uppercase()}" } ?: "🌐 EN",
                        color = Color(0xFF475569),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Send button (RN: sendBtn — cyan when active, gray when empty)
                val isActive = text.isNotBlank() || selectedImageUri != null
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(
                            if (isActive) Color(0xFF06B6D4) else Color(0xFFE2E8F0)
                        )
                        .clickable(enabled = isActive) {
                            if (text.isNotBlank()) {
                                onSend(text.trim(), selectedImageUri?.toString())
                                text = ""
                                selectedImageUri = null
                                onClose()
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Send,
                        contentDescription = "Send",
                        tint = if (isActive) Color.White else Color(0xFF94A3B8),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // Inline language picker (RN: langPickerArea)
            if (showLangPicker) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp)
                        .padding(top = 4.dp)
                        .heightIn(max = 180.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Source languages header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Translate from:", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(
                            "Done",
                            color = Color(0xFFA855F7),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { showLangPicker = false }
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Source languages scroll (RN: horizontal ScrollView)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 2.dp)
                    ) {
                        items(SOURCE_LANGUAGES) { lang ->
                            val isSelected = (sourceLanguage) == lang.code
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isSelected) Color(0xFF06B6D4) else Color(0xFFF1F5F9)
                                    )
                                    .clickable { onSelectSourceLanguage(lang.code) }
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "${lang.flag} ${lang.name}",
                                    color = if (isSelected) Color.White else Color(0xFF475569),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Target languages header
                    Text("Translate to:", color = Color(0xFF64748B), fontSize = 10.sp, fontWeight = FontWeight.Bold)

                    Spacer(modifier = Modifier.height(4.dp))

                    // Target languages scroll (RN: horizontal ScrollView)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 2.dp)
                    ) {
                        items(TARGET_LANGUAGES) { lang ->
                            val isSelected = targetLanguage == lang.code
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isSelected) Color(0xFFA855F7) else Color(0xFFF1F5F9)
                                    )
                                    .clickable {
                                        onSelectLanguage(lang.code)
                                        showLangPicker = false
                                    }
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "${lang.flag} ${lang.name}",
                                    color = if (isSelected) Color.White else Color(0xFF475569),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
            }
        }
    }
}
