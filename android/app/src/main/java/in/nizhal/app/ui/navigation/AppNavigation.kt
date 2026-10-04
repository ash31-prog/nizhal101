package in.nizhal.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import in.nizhal.app.ui.auth.AuthState
import in.nizhal.app.ui.auth.AuthViewModel

object Screen {
    const val SPLASH = "splash_screen"
    const val LOGIN = "login_screen"
    const val CITIZEN = "citizen_dashboard"
    const val AUTHORITY = "authority_dashboard"
}

@Composable
fun AppNavigation(
    viewModel: AuthViewModel = viewModel(),
    navController: NavHostController = rememberNavController()
) {
    val authState by viewModel.authState.collectAsState()

    val startDestination = when (authState) {
        is AuthState.Loading -> Screen.SPLASH
        is AuthState.Unauthenticated -> Screen.LOGIN
        is AuthState.Authenticated -> {
            val role = (authState as AuthState.Authenticated).role
            if (role == "authority") Screen.AUTHORITY else Screen.CITIZEN
        }
    }

    // Handle backstack cleanup and redirection on auth state changes
    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Unauthenticated -> {
                navController.navigate(Screen.LOGIN) {
                    popUpTo(0) { inclusive = true }
                    launchSingleTop = true
                }
            }
            is AuthState.Authenticated -> {
                val role = (authState as AuthState.Authenticated).role
                val targetScreen = if (role == "authority") Screen.AUTHORITY else Screen.CITIZEN
                navController.navigate(targetScreen) {
                    popUpTo(Screen.LOGIN) { inclusive = true }
                    launchSingleTop = true
                }
            }
            is AuthState.Loading -> {}
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        NavHost(
            navController = navController,
            startDestination = startDestination
        ) {
            composable(Screen.SPLASH) {
                SplashScreen()
            }
            composable(Screen.LOGIN) {
                LoginScreen(
                    onLoginCitizen = { viewModel.login("citizen") },
                    onLoginAuthority = { viewModel.login("authority") }
                )
            }
            composable(Screen.CITIZEN) {
                CitizenDashboard(
                    onLogout = { viewModel.logout() }
                )
            }
            composable(Screen.AUTHORITY) {
                AuthorityDashboard(
                    onLogout = { viewModel.logout() }
                )
            }
        }
    }
}

@Composable
fun SplashScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Loading NIZHAL Session...", style = MaterialTheme.typography.bodyLarge)
        }
    }
}

@Composable
fun LoginScreen(
    onLoginCitizen: () => Unit,
    onLoginAuthority: () => Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "NIZHAL (நிழல்)", style = MaterialTheme.typography.headlineLarge)
            Text(text = "Urban Safety & Municipal Shield", style = MaterialTheme.typography.bodyMedium)
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onLoginCitizen,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Login as Citizen")
            }
            
            OutlinedButton(
                onClick = onLoginAuthority,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Login as Municipal Authority")
            }
        }
    }
}

@Composable
fun CitizenDashboard(onLogout: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Citizen Safety Portal", style = MaterialTheme.typography.headlineMedium)
            Text(text = "SOS, Scream Detection & Safe Routes Active", style = MaterialTheme.typography.bodyMedium)
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Logout")
            }
        }
    }
}

@Composable
fun AuthorityDashboard(onLogout: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Municipal Control Room", style = MaterialTheme.typography.headlineMedium)
            Text(text = "Dark-Spot Rankings & Streetlight Audit Dashboard", style = MaterialTheme.typography.bodyMedium)
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Logout")
            }
        }
    }
}
