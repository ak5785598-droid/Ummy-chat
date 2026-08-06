package app.vercel.ummy_chat.twa.data.repository

import app.vercel.ummy_chat.twa.data.model.UpdateModel
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class UpdateRepository {
    private val firestore = FirebaseFirestore.getInstance()

    suspend fun getLatestVersionInfo(): UpdateModel? {
        return try {
            val snapshot = firestore.collection("appConfig")
                .document("versioning")
                .get()
                .await()
            snapshot.toObject(UpdateModel::class.java)
        } catch (e: Exception) {
            null
        }
    }
}
