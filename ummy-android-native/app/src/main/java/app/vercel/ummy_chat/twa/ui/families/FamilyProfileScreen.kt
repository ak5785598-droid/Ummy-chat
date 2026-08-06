package app.vercel.ummy_chat.twa.ui.families

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.firebase.firestore.FirebaseFirestore

data class FamilyMember(
    val uid: String = "",
    val username: String = "",
    val avatarUrl: String? = null,
    val role: String = "Member",
    val contribution: Long = 0
)

@Composable
fun FamilyProfileScreen(
    familyId: String,
    onBack: () -> Unit
) {
    var family by remember { mutableStateOf<FamilyModel?>(null) }
    var members by remember { mutableStateOf<List<FamilyMember>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(familyId) {
        val fs = FirebaseFirestore.getInstance()
        fs.collection("families").document(familyId).get().addOnSuccessListener { doc ->
            family = doc.toObject(FamilyModel::class.java)?.copy(id = doc.id)
        }
        fs.collection("families").document(familyId).collection("members")
            .orderBy("contribution", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { snap ->
                members = snap.documents.mapNotNull { it.toObject(FamilyMember::class.java) }
                loading = false
            }
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF03000F))) {
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF6366F1))
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                item { EliteBanner(family, onBack) }
                item { StatsSection(family) }
                item { Text("Members", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp, modifier = Modifier.padding(16.dp)) }
                items(members) { member -> MemberRow(member) }
                item { Spacer(modifier = Modifier.height(32.dp)) }
            }
        }
    }
}

@Composable
fun EliteBanner(family: FamilyModel?, onBack: () -> Unit) {
    Box(modifier = Modifier.fillMaxWidth().height(280.dp)) {
        AsyncImage(
            model = family?.avatarUrl ?: "https://picsum.photos/800/400",
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF03000F)))))
        
        Row(modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            IconButton(onClick = onBack, modifier = Modifier.background(Color.Black.copy(alpha = 0.3f), CircleShape)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
            }
            IconButton(onClick = {}, modifier = Modifier.background(Color.Black.copy(alpha = 0.3f), CircleShape)) {
                Icon(Icons.Default.MoreVert, null, tint = Color.White)
            }
        }

        Column(modifier = Modifier.align(Alignment.BottomStart).padding(20.dp)) {
            Text(family?.name ?: "Family Name", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFFBBF24)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                    Text("Lv.${family?.level ?: 1}", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text("ID: ${family?.id?.take(6) ?: "000000"}", color = Color.White.copy(alpha = 0.7f), fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun StatsSection(family: FamilyModel?) {
    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        StatCard("Wealth", "🟡 ${family?.wealth ?: 0}", Modifier.weight(1f))
        StatCard("Members", "👥 ${family?.membersCount ?: 0}/${family?.capacity ?: 100}", Modifier.weight(1f))
    }
}

@Composable
fun StatCard(label: String, value: String, modifier: Modifier) {
    Column(modifier = modifier.clip(RoundedCornerShape(16.dp)).background(Color(0xFF1E1B4B)).padding(16.dp)) {
        Text(label, color = Color.Gray, fontSize = 12.sp)
        Text(value, color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
    }
}

@Composable
fun MemberRow(member: FamilyMember) {
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(model = member.avatarUrl ?: "https://picsum.photos/200", contentDescription = null, modifier = Modifier.size(48.dp).clip(CircleShape), contentScale = ContentScale.Crop)
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(member.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Text(member.role, color = if(member.role == "Leader") Color(0xFFFBBF24) else Color.Gray, fontSize = 12.sp)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text("${member.contribution}", color = Color(0xFF6366F1), fontWeight = FontWeight.Black, fontSize = 14.sp)
            Text("Contrib", color = Color.Gray, fontSize = 10.sp)
        }
    }
}
