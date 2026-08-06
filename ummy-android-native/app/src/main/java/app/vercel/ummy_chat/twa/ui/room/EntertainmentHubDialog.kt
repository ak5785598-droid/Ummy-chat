package app.vercel.ummy_chat.twa.ui.room

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

// ─────────────────────────────────────────────────────────────────────────────
// EntertainmentHubDialog — mirrors RN entertainment-hub-dialog.tsx
// TMDB movie search and room movie sync dialog
// ─────────────────────────────────────────────────────────────────────────────

data class TMDBMovie(
    val id: Int,
    val title: String,
    val posterPath: String?,
    val releaseYear: String = "",
    val rating: Double = 0.0
)

private val POPULAR_MOVIES_MOCK = listOf(
    TMDBMovie(550, "Fight Club", "/pB8O2CYJjyTAVJniR2sKGhR6Wi5.jpg", "1999", 8.4),
    TMDBMovie(27205, "Inception", "/oYuLEW9W2vBBGLM2vRq9iUdEos.jpg", "2010", 8.4),
    TMDBMovie(157336, "Interstellar", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", "2014", 8.6),
    TMDBMovie(299536, "Avengers: Endgame", "/or06FN3Dka5tukK1e9vTN3vzbR.jpg", "2019", 8.3),
    TMDBMovie(671, "Harry Potter", "/wuMc08IPKEatf9rnMNXvFFxqYyW.jpg", "2001", 7.9),
    TMDBMovie(120, "Lord of the Rings", "/6oom5WYQwhNvMfL2QToRVFifjfZ.jpg", "2001", 8.8)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EntertainmentHubDialog(
    visible: Boolean,
    onSelectMovie: (TMDBMovie) -> Unit,
    onDismiss: () -> Unit
) {
    if (!visible) return

    var searchQuery by remember { mutableStateOf("") }
    val filteredMovies = remember(searchQuery) {
        if (searchQuery.isBlank()) POPULAR_MOVIES_MOCK
        else POPULAR_MOVIES_MOCK.filter { it.title.contains(searchQuery, ignoreCase = true) }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0F172A),
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f)
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Movie, contentDescription = null, tint = Color(0xFFC084FC))
                    Spacer(Modifier.width(8.dp))
                    Text("Entertainment Hub", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.6f))
                }
            }

            Spacer(Modifier.height(10.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                placeholder = { Text("Search movies & TV shows...", color = Color.White.copy(alpha = 0.4f), fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = Color.White.copy(alpha = 0.4f)) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = Color.White.copy(alpha = 0.05f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                    focusedBorderColor = Color(0xFFC084FC)
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            Spacer(Modifier.height(16.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(filteredMovies, key = { it.id }) { movie ->
                    Column(
                        modifier = Modifier.clickable {
                            onSelectMovie(movie)
                            onDismiss()
                        }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(2f / 3f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White.copy(alpha = 0.05f))
                        ) {
                            if (movie.posterPath != null) {
                                AsyncImage(
                                    model = "https://image.tmdb.org/t/p/w500${movie.posterPath}",
                                    contentDescription = movie.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Movie, null, tint = Color.White.copy(alpha = 0.3f))
                                }
                            }
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(6.dp)
                                    .size(24.dp)
                                    .clip(CircleShape)
                                    .background(Color.Black.copy(alpha = 0.7f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(12.dp))
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            movie.title,
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            "${movie.releaseYear} • ⭐ ${movie.rating}",
                            color = Color.White.copy(alpha = 0.4f),
                            fontSize = 9.sp
                        )
                    }
                }
            }
        }
    }
}
