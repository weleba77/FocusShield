package com.focusshield.expo

import android.app.*
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import org.json.JSONArray

class FocusBlockingService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var checkRunnable: Runnable? = null
    private var endTime: Double = 0.0
    private val channelId = "FocusShieldChannel"
    private val notificationId = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        endTime = intent?.getDoubleExtra("end_time", 0.0) ?: 0.0
        val durationMinutes = intent?.getIntExtra("duration_minutes", 25) ?: 25

        val notification = createNotification("Focus Shield is Active", "Your strict deep work session is currently running.")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(notificationId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(notificationId, notification)
        }

        startMonitoring()

        return START_NOT_STICKY
    }

    private fun startMonitoring() {
        checkRunnable = object : Runnable {
            override fun run() {
                val now = System.currentTimeMillis().toDouble()
                if (now >= endTime) {
                    // Focus session finished naturally!
                    stopSelf()
                    return
                }

                val currentApp = getForegroundPackage()
                if (currentApp != null && isPackageBlocked(currentApp)) {
                    // Blocked app detected! Direct overlay launch
                    val overlayIntent = Intent(applicationContext, FocusBlockingOverlayActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        putExtra("blocked_package", currentApp)
                        putExtra("end_time", endTime)
                    }
                    startActivity(overlayIntent)
                }

                handler.postDelayed(this, 500)
            }
        }
        handler.post(checkRunnable!!)
    }

    private fun isPackageBlocked(packageName: String): Boolean {
        if (packageName == applicationContext.packageName) {
            // Do not block our own Focus Shield app!
            return false
        }
        
        val sharedPrefs = getSharedPreferences("FocusShieldPrefs", Context.MODE_PRIVATE)
        val blockedString = sharedPrefs.getString("blocked_packages", "[]") ?: "[]"
        return try {
            val jsonArray = JSONArray(blockedString)
            for (i in 0 until jsonArray.length()) {
                if (jsonArray.getString(i) == packageName) {
                    return true
                }
            }
            false
        } catch (e: Exception) {
            false
        }
    }

    private fun getForegroundPackage(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val events = usageStatsManager.queryEvents(time - 1000 * 60 * 5, time)
        val event = android.app.usage.UsageEvents.Event()
        var currentForegroundPackage: String? = null
        
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                currentForegroundPackage = event.packageName
            } else if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_PAUSED) {
                if (event.packageName == currentForegroundPackage) {
                    currentForegroundPackage = null
                }
            }
        }
        return currentForegroundPackage
    }

    private fun createNotification(title: String, text: String): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_secure)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Focus Shield Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps manual focus mode strictly active in the background."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        checkRunnable?.let { handler.removeCallbacks(it) }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
