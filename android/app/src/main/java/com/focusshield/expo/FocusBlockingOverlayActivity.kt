package com.focusshield.expo

import android.app.Activity
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class FocusBlockingOverlayActivity : Activity() {

    private val handler = Handler(Looper.getMainLooper())
    private var checkRunnable: Runnable? = null
    private var timerRunnable: Runnable? = null
    private var blockedPackage: String = ""
    private var endTime: Double = 0.0

    private lateinit var timerText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make activity full screen and draw over other windows
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )

        blockedPackage = intent.getStringExtra("blocked_package") ?: ""
        endTime = intent.getDoubleExtra("end_time", 0.0) ?: 0.0

        // Programmatic Dark Glass UI Layout
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#050810")) // Premium Deep Space Blue/Black
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // Shield Padlock Icon
        val iconView = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_lock_lock)
            setColorFilter(Color.parseColor("#818CF8")) // Indigo light accent
            layoutParams = LinearLayout.LayoutParams(160, 160).apply {
                bottomMargin = 48
            }
        }
        rootLayout.addView(iconView)

        // Lock Title
        val titleText = TextView(this).apply {
            text = "Focus Shield Active 🛡️"
            textSize = 24f
            setTextColor(Color.WHITE)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 16
            }
        }
        rootLayout.addView(titleText)

        // Lock Subtitle
        val subtitleText = TextView(this).apply {
            text = "This application is currently locked to keep you focused."
            textSize = 14f
            setTextColor(Color.parseColor("#94A3B8")) // Slate text secondary
            gravity = Gravity.CENTER
            setPadding(64, 0, 64, 48)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        rootLayout.addView(subtitleText)

        // Real-time Countdown Timer Label
        timerText = TextView(this).apply {
            text = "Calculating..."
            textSize = 28f
            setTextColor(Color.parseColor("#818CF8")) // Glowing indigo accent
            typeface = Typeface.create("sans-serif-condensed", Typeface.BOLD)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        rootLayout.addView(timerText)

        setContentView(rootLayout)

        startTimer()
        startDismissalChecker()
    }

    private fun startTimer() {
        timerRunnable = object : Runnable {
            override fun run() {
                val now = System.currentTimeMillis().toDouble()
                val diff = endTime - now
                if (diff <= 0) {
                    finish()
                    return
                }

                val totalSecs = (diff / 1000).toInt()
                val mins = totalSecs / 60
                val secs = totalSecs % 60
                
                timerText.text = String.format("%02dm %02ds remaining", mins, secs)
                handler.postDelayed(this, 1000)
            }
        }
        handler.post(timerRunnable!!)
    }

    private fun startDismissalChecker() {
        // High frequency check (every 500ms) to dismiss overlay immediately if user exits blocked app
        checkRunnable = object : Runnable {
            override fun run() {
                val currentApp = getForegroundPackage()
                if (currentApp != null && currentApp != blockedPackage && currentApp != packageName) {
                    // User has exited the blocked app (went home or opened allowed app). Dismiss immediately!
                    finish()
                    return
                }
                handler.postDelayed(this, 500)
            }
        }
        handler.postDelayed(checkRunnable!!, 1000)
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

    override fun onBackPressed() {
        // Strict blocking: Do not allow back button to close the overlay activity!
    }

    override fun onDestroy() {
        super.onDestroy()
        timerRunnable?.let { handler.removeCallbacks(it) }
        checkRunnable?.let { handler.removeCallbacks(it) }
    }
}
