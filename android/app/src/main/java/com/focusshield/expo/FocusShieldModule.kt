package com.focusshield.expo

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray

class FocusShieldModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val sharedPreferences: SharedPreferences = reactContext.getSharedPreferences("FocusShieldPrefs", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "FocusShieldModule"
    }

    @ReactMethod
    fun setBlockedPackages(packages: ReadableArray) {
        val packageList = ArrayList<String>()
        for (i in 0 until packages.size()) {
            packages.getString(i)?.let { packageList.add(it) }
        }
        val jsonArray = JSONArray(packageList)
        sharedPreferences.edit().putString("blocked_packages", jsonArray.toString()).apply()
    }

    @ReactMethod
    fun startFocusService(durationMinutes: Int, endTime: Double) {
        val context = reactApplicationContext
        val intent = Intent(context, FocusBlockingService::class.java).apply {
            putExtra("duration_minutes", durationMinutes)
            putExtra("end_time", endTime)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    @ReactMethod
    fun stopFocusService() {
        val context = reactApplicationContext
        val intent = Intent(context, FocusBlockingService::class.java)
        context.stopService(intent)
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val context = reactApplicationContext
        val result = Arguments.createMap().apply {
            putBoolean("overlay", hasOverlayPermission(context))
            putBoolean("usage", hasUsageStatsPermission(context))
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun requestPermissions() {
        val context = reactApplicationContext
        
        if (!hasOverlayPermission(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } else if (!hasUsageStatsPermission(context)) {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val context = reactApplicationContext
        val pm = context.packageManager
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfos = pm.queryIntentActivities(mainIntent, 0)
        val appList = Arguments.createArray()
        val seenPackages = HashSet<String>()

        for (resolveInfo in resolveInfos) {
            val packageName = resolveInfo.activityInfo.packageName
            if (packageName == context.packageName) continue
            
            if (!seenPackages.contains(packageName)) {
                seenPackages.add(packageName)
                val appName = resolveInfo.loadLabel(pm).toString()
                val appMap = Arguments.createMap().apply {
                    putString("appName", appName)
                    putString("packageName", packageName)
                }
                appList.pushMap(appMap)
            }
        }
        promise.resolve(appList)
    }

    private fun hasOverlayPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    private fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
