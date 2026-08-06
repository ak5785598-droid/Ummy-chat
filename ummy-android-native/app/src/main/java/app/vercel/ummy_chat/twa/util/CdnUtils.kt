package app.vercel.ummy_chat.twa.util

import android.net.Uri

/**
 * CDN proxy utility — parity with RN src/lib/cdn.ts
 * Proxies Firebase Storage URLs through images.weserv.nl CDN
 * Also resolves relative paths (e.g. public folder assets) to absolute URLs.
 */
object CdnUtils {
    private const val BASE_URL = "https://ummy-chat.vercel.app"

    fun toCdn(url: String?): String? {
        if (url.isNullOrBlank()) return url

        // 1. Resolve relative URLs (e.g. "/images/..." or "assets/...")
        var resolvedUrl = url.trim()
        if (resolvedUrl.startsWith("/")) {
            resolvedUrl = "$BASE_URL$resolvedUrl"
        } else if (!resolvedUrl.startsWith("http://") && 
                   !resolvedUrl.startsWith("https://") && 
                   !resolvedUrl.startsWith("file://") && 
                   !resolvedUrl.startsWith("content://")) {
            resolvedUrl = "$BASE_URL/$resolvedUrl"
        }

        // 2. Proxy Firebase Storage URLs through images.weserv.nl CDN
        if (resolvedUrl.contains("firebasestorage.googleapis.com")) {
            var cdnUrl = "https://images.weserv.nl/?url=${Uri.encode(resolvedUrl)}"

            if (resolvedUrl.contains(".gif", ignoreCase = true) || resolvedUrl.contains("gif", ignoreCase = true)) {
                cdnUrl += "&n=-1"
            }
            if (resolvedUrl.contains(".png", ignoreCase = true)) {
                cdnUrl += "&output=png"
            }
            return cdnUrl
        }

        return resolvedUrl
    }
}
