package com.example.animenationindia

import android.annotation.SuppressLint
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.View
import android.webkit.WebSettings
import androidx.compose.runtime.DisposableEffect
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.animenationindia.theme.AnimeNationIndiaTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AnimeNationIndiaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF050716) // Brand Deep Space Blue
                ) {
                    AppScreen()
                }
            }
        }
    }
}

@Composable
fun AppScreen() {
    val context = LocalContext.current
    var progress by remember { mutableIntStateOf(0) }
    var isLoading by remember { mutableStateOf(true) }
    var isOffline by remember { mutableStateOf(!isNetworkAvailable(context)) }
    var loadError by remember { mutableStateOf(false) }
    val webViewRef = remember { mutableStateOf<WebView?>(null) }
    val scope = rememberCoroutineScope()
    
    // States for custom fullscreen video view
    var customView by remember { mutableStateOf<View?>(null) }
    var customViewCallback by remember { mutableStateOf<WebChromeClient.CustomViewCallback?>(null) }
    
    // Fullscreen back handler
    val isFullscreen = customView != null
    
    BackHandler(enabled = isFullscreen || (webViewRef.value?.canGoBack() == true && !isOffline)) {
        if (isFullscreen) {
            // Exit fullscreen video
            customView = null
            customViewCallback?.onCustomViewHidden()
            customViewCallback = null
            
            // Restore System UI
            val window = (context as? Activity)?.window
            if (window != null) {
                val controller = WindowCompat.getInsetsController(window, window.decorView)
                controller.show(WindowInsetsCompat.Type.systemBars())
            }
            
            // Restore screen orientation
            val activity = context as? Activity
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        } else {
            // Web view navigation back
            webViewRef.value?.goBack()
        }
    }
    
    // Webview lifecycle observer (Pause/Resume JS and media playback on background/foreground)
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> webViewRef.value?.onResume()
                Lifecycle.Event.ON_PAUSE -> {
                    // If playing video fullscreen, exit fullscreen when app goes background
                    if (isFullscreen) {
                        customView = null
                        customViewCallback?.onCustomViewHidden()
                        customViewCallback = null
                        val window = (context as? Activity)?.window
                        if (window != null) {
                            val controller = WindowCompat.getInsetsController(window, window.decorView)
                            controller.show(WindowInsetsCompat.Type.systemBars())
                        }
                        val activity = context as? Activity
                        activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                    }
                    webViewRef.value?.onPause()
                }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
    
    // Check network connectivity on retry or load
    val checkConnectionAndLoad = {
        val available = isNetworkAvailable(context)
        isOffline = !available
        if (available) {
            loadError = false
            isLoading = true
            webViewRef.value?.loadUrl("https://animenationindia.vercel.app/")
        }
    }
    
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF050716))) {
        if (isOffline || loadError) {
            OfflineScreen(onRetry = {
                checkConnectionAndLoad()
            })
        } else {
            // Render WebView Layout
            WebViewContainer(
                url = "https://animenationindia.vercel.app/",
                onProgressChange = { newProgress ->
                    progress = newProgress
                    isLoading = newProgress < 100
                },
                onPageFinished = { swipeRefreshLayout ->
                    isLoading = false
                    swipeRefreshLayout?.isRefreshing = false
                },
                onReceivedError = {
                    if (!isNetworkAvailable(context)) {
                        isOffline = true
                    } else {
                        loadError = true
                    }
                },
                webViewRef = webViewRef,
                onRefresh = { swipeRefreshLayout ->
                    scope.launch {
                        if (isNetworkAvailable(context)) {
                            webViewRef.value?.reload()
                        } else {
                            isOffline = true
                            swipeRefreshLayout.isRefreshing = false
                        }
                        // Safety timeout to dismiss loading animation
                        delay(6000)
                        swipeRefreshLayout.isRefreshing = false
                    }
                },
                onShowCustomView = { view, callback ->
                    customView = view
                    customViewCallback = callback
                    
                    // Hide System UI
                    val window = (context as? Activity)?.window
                    if (window != null) {
                        val controller = WindowCompat.getInsetsController(window, window.decorView)
                        controller.hide(WindowInsetsCompat.Type.systemBars())
                        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    }
                    
                    // Set Orientation to Landscape for full screen video smoothness
                    val activity = context as? Activity
                    activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                },
                onHideCustomView = {
                    customView = null
                    customViewCallback?.onCustomViewHidden()
                    customViewCallback = null
                    
                    // Show System UI
                    val window = (context as? Activity)?.window
                    if (window != null) {
                        val controller = WindowCompat.getInsetsController(window, window.decorView)
                        controller.show(WindowInsetsCompat.Type.systemBars())
                    }
                    
                    // Reset orientation
                    val activity = context as? Activity
                    activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }
            )
            
            // Progress Bar
            AnimatedVisibility(
                visible = isLoading,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.TopCenter)
            ) {
                LinearProgressIndicator(
                    progress = { progress / 100f },
                    modifier = Modifier.fillMaxWidth().height(3.dp),
                    color = Color(0xFFFF4DD2), // Neon Pink
                    trackColor = Color(0x22FF4DD2)
                )
            }
            
            // Fullscreen Custom Video View Overlay
            if (customView != null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black)
                ) {
                    AndroidView(
                        factory = { customView!! },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

@Composable
fun OfflineScreen(onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050716))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Glowing Neon Icon
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0x33FF4DD2), Color.Transparent)
                    ),
                    shape = RoundedCornerShape(50.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Offline",
                modifier = Modifier.size(48.dp),
                tint = Color(0xFFFF4DD2)
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "CONNECTION LOST",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            letterSpacing = 2.sp,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = "Oops! It seems you are disconnected from the network. Please check your internet connection and try again.",
            fontSize = 14.sp,
            color = Color(0xFFA0A0A0),
            textAlign = TextAlign.Center,
            modifier = Modifier.width(300.dp)
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFFF4DD2),
                contentColor = Color.White
            ),
            shape = RoundedCornerShape(8.dp),
            contentPadding = PaddingValues(horizontal = 32.dp, vertical = 12.dp),
            modifier = Modifier.height(48.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Refresh,
                contentDescription = "Retry",
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "TRY AGAIN",
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(
    url: String,
    onProgressChange: (Int) -> Unit,
    onPageFinished: (SwipeRefreshLayout?) -> Unit,
    onReceivedError: () -> Unit,
    webViewRef: MutableState<WebView?>,
    onRefresh: (SwipeRefreshLayout) -> Unit,
    onShowCustomView: (View, WebChromeClient.CustomViewCallback) -> Unit,
    onHideCustomView: () -> Unit
) {
    AndroidView(
        factory = { context ->
            val swipeRefreshLayout = SwipeRefreshLayout(context).apply {
                // Set size and styling matching deep space/pink theme
                setColorSchemeColors(android.graphics.Color.parseColor("#FF4DD2"))
                setProgressBackgroundColorSchemeColor(android.graphics.Color.parseColor("#121326"))
            }

            val webView = WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                
                // Hardware layer acceleration for fast rendering
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                scrollBarStyle = View.SCROLLBARS_INSIDE_OVERLAY
                
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    javaScriptCanOpenWindowsAutomatically = true
                    
                    // Hardware Acceleration and Smooth Rendering Optimizations
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                    textZoom = 100 // Prevent layout breakage from system text scaling
                    offscreenPreRaster = true // Smooth scrolling offscreen content pre-rendering
                    safeBrowsingEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                }
                
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        onPageFinished(swipeRefreshLayout)
                    }
                    
                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        if (request?.isForMainFrame == true) {
                            onReceivedError()
                        }
                    }
                }
                
                webChromeClient = object : WebChromeClient() {
                    override fun onProgressChanged(view: WebView?, newProgress: Int) {
                        onProgressChange(newProgress)
                    }
                    
                    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                        super.onShowCustomView(view, callback)
                        if (view != null && callback != null) {
                            onShowCustomView(view, callback)
                        }
                    }
                    
                    override fun onHideCustomView() {
                        super.onHideCustomView()
                        onHideCustomView()
                    }
                }
                
                loadUrl(url)
                webViewRef.value = this
            }

            swipeRefreshLayout.addView(webView)
            swipeRefreshLayout.setOnRefreshListener {
                onRefresh(swipeRefreshLayout)
            }

            swipeRefreshLayout
        },
        update = { webView ->
            // Update reference if needed
        }
    )
}

fun isNetworkAvailable(context: Context): Boolean {
    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = connectivityManager.activeNetwork ?: return false
    val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
    return when {
        activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> true
        activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> true
        activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> true
        else -> false
    }
}
