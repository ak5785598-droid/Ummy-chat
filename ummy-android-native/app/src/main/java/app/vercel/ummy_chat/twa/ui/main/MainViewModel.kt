package app.vercel.ummy_chat.twa.ui.main

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.vercel.ummy_chat.twa.data.repository.PresenceInitializerRepository
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch

class MainViewModel(
    private val presenceRepository: PresenceInitializerRepository = PresenceInitializerRepository(),
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) : ViewModel(), DefaultLifecycleObserver {

    fun initializeUserPresence() {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            presenceRepository.initializeProfileAndResets(uid)
            presenceRepository.setGlobalOnlineStatus(uid, true)
        }
    }

    override fun onStart(owner: LifecycleOwner) {
        super.onStart(owner)
        val uid = auth.currentUser?.uid ?: return
        presenceRepository.setGlobalOnlineStatus(uid, true)
    }

    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        val uid = auth.currentUser?.uid ?: return
        presenceRepository.setGlobalOnlineStatus(uid, false)
    }
}
