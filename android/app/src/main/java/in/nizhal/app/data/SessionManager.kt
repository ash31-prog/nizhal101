package in.nizhal.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "nizhal_session_prefs")

data class SessionData(
    val isLoggedIn: Boolean,
    val role: String
)

class SessionManager(private val context: Context) {
    companion object {
        private val KEY_IS_LOGGED_IN = stringPreferencesKey("is_logged_in")
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
    }

    val userSessionFlow: Flow<SessionData> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            val isLoggedIn = preferences[KEY_IS_LOGGED_IN]?.toBoolean() ?: false
            val role = preferences[KEY_USER_ROLE] ?: "citizen"
            SessionData(isLoggedIn = isLoggedIn, role = role)
        }

    suspend fun saveSession(isLoggedIn: Boolean, role: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_IS_LOGGED_IN] = isLoggedIn.toString()
            preferences[KEY_USER_ROLE] = role
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            preferences[KEY_IS_LOGGED_IN] = "false"
            preferences[KEY_USER_ROLE] = "citizen"
        }
    }
}
