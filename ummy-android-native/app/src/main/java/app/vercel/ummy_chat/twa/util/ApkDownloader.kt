package app.vercel.ummy_chat.twa.util

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URL

class ApkDownloader(private val context: Context) {

    private val storage = FirebaseStorage.getInstance()
    private val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }

    suspend fun downloadAndInstall(apkUrl: String, onProgress: (Float) -> Unit): Result<Unit> {
        return try {
            val apkFile = if (apkUrl.startsWith("gs://") || apkUrl.contains("firebasestorage.googleapis.com")) {
                downloadFromFirebase(apkUrl, onProgress)
            } else {
                downloadFromUrl(apkUrl, onProgress)
            }

            if (!isValidApk(apkFile)) {
                apkFile.delete()
                return Result.failure(Exception("Downloaded file is corrupted. Please try again."))
            }

            onProgress(1f)
            installApk(apkFile)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun downloadFromFirebase(apkUrl: String, onProgress: (Float) -> Unit): File {
        val ref: StorageReference = storage.getReferenceFromUrl(apkUrl)
        val metadata = ref.metadata.await()
        val totalBytes = metadata.sizeBytes
        
        var attempt = 0
        while (true) {
            attempt++
            val apkFile = File(updatesDir, "update_${System.currentTimeMillis()}_f$attempt.apk")
            val task = ref.getFile(apkFile)
            task.addOnProgressListener { snapshot ->
                val progress = if (totalBytes > 0) snapshot.bytesTransferred.toFloat() / totalBytes else 0f
                onProgress(progress)
            }
            task.await()
            if (apkFile.length() == totalBytes) return apkFile
            apkFile.delete()
            if (attempt >= 3) throw Exception("Firebase download failed after 3 attempts.")
        }
    }

    private suspend fun downloadFromUrl(apkUrl: String, onProgress: (Float) -> Unit): File = withContext(Dispatchers.IO) {
        val apkFile = File(updatesDir, "update_${System.currentTimeMillis()}_u.apk")
        val url = URL(apkUrl)
        val connection = url.openConnection() as HttpURLConnection
        connection.connect()

        if (connection.responseCode != HttpURLConnection.HTTP_OK) {
            throw Exception("Server returned HTTP ${connection.responseCode}")
        }

        val fileLength = connection.contentLength
        val input: InputStream = connection.inputStream
        val output = FileOutputStream(apkFile)

        val data = ByteArray(4096)
        var total: Long = 0
        var count: Int
        while (input.read(data).also { count = it } != -1) {
            total += count
            if (fileLength > 0) {
                onProgress(total.toFloat() / fileLength)
            }
            output.write(data, 0, count)
        }

        output.flush()
        output.close()
        input.close()
        apkFile
    }

    private fun isValidApk(apkFile: File): Boolean {
        return try {
            RandomAccessFile(apkFile, "r").use { raf ->
                if (raf.length() < 8) return false
                val magic = ByteArray(2)
                raf.seek(0)
                raf.readFully(magic)
                // APK is a ZIP file, starts with 'PK'
                magic[0] == 0x50.toByte() && magic[1] == 0x4B.toByte()
            }
        } catch (_: Exception) {
            false
        }
    }

    private fun installApk(apkFile: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        context.startActivity(intent)
    }

    fun cleanupOldUpdates() {
        updatesDir.listFiles()?.forEach { it.delete() }
    }
}
