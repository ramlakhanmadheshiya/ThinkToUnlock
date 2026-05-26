package com.ramlakhan0001.frontend

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class AppBlockerService : Service() {
    private lateinit var handler: Handler
    private lateinit var runnable: Runnable

    companion object {
        var lockedApps: MutableMap<String, Int> = mutableMapOf()
        var consumedSeconds: MutableMap<String, Int> = mutableMapOf()
        var smartRemindersEnabled: Boolean = true
        var temporarilyUnlockedApp: String? = null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
        smartRemindersEnabled = prefs.getBoolean("smartReminders", true)
        
        val notification = NotificationCompat.Builder(this, "blocker_channel")
            .setContentTitle("ThinkToUnlock is Active")
            .setContentText("Protecting your focus.")
            .setSmallIcon(resources.getIdentifier("ic_launcher", "mipmap", packageName))
            .build()
        startForeground(1, notification)

        try {
            val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE)
            val lockedJson = org.json.JSONObject(prefs.getString("lockedApps", "{}")!!)
            val consumedJson = org.json.JSONObject(prefs.getString("consumedSeconds", "{}")!!)
            for (key in lockedJson.keys()) lockedApps[key] = lockedJson.getInt(key)
            for (key in consumedJson.keys()) consumedSeconds[key] = consumedJson.getInt(key)
        } catch (e: Exception) {}

        handler = Handler(Looper.getMainLooper())
        runnable = object : Runnable {
            override fun run() {
                checkForegroundApp()
                handler.postDelayed(this, 1000)
            }
        }
        handler.post(runnable)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    private var lastForegroundApp: String = ""
    private var multiWindowApps: MutableSet<String> = mutableSetOf()

    private fun checkForegroundApp() {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val events = usm.queryEvents(time - 2000, time)
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    lastForegroundApp = event.packageName
                    multiWindowApps.add(event.packageName)
                }
                UsageEvents.Event.ACTIVITY_PAUSED -> {
                    // In multi-window, PAUSED doesn't mean invisible — only remove on STOPPED
                }
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    multiWindowApps.remove(event.packageName)
                }
            }
        }

        // In multi-window/floating mode, count time for all visible locked apps
        val appsToTrack = mutableSetOf<String>()
        if (lastForegroundApp.isNotEmpty() && lastForegroundApp != packageName) {
            appsToTrack.add(lastForegroundApp)
        }
        // Also track apps in multi-window that haven't been stopped
        for (app in multiWindowApps) {
            if (app != packageName) appsToTrack.add(app)
        }

        // Reset temporary unlock if user switched away
        if (temporarilyUnlockedApp != null && temporarilyUnlockedApp !in appsToTrack) {
            temporarilyUnlockedApp = null
        }

        for (currentApp in appsToTrack) {
            if (!lockedApps.containsKey(currentApp) || currentApp == temporarilyUnlockedApp) continue

            val remaining = lockedApps[currentApp] ?: 0
            if (remaining > 0) {
                lockedApps[currentApp] = remaining - 1
                consumedSeconds[currentApp] = (consumedSeconds[currentApp] ?: 0) + 1
                saveStateToPrefs()
                
                if (remaining - 1 == 30 && smartRemindersEnabled) {
                    val n = NotificationCompat.Builder(this, "blocker_channel")
                        .setContentTitle("ThinkToUnlock Warning")
                        .setContentText("You have 30 seconds left in this app!")
                        .setSmallIcon(resources.getIdentifier("ic_launcher", "mipmap", packageName))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setVibrate(longArrayOf(0, 500))
                        .build()
                    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    nm.notify(currentApp.hashCode(), n)
                }
            } else {
                // Blocked app! Force to home then show lock screen
                val homeIntent = Intent(Intent.ACTION_MAIN)
                homeIntent.addCategory(Intent.CATEGORY_HOME)
                homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                startActivity(homeIntent)

                val uri = android.net.Uri.parse("frontend://app-locked?appId=$currentApp")
                val launchIntent = Intent(Intent.ACTION_VIEW, uri)
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                startActivity(launchIntent)
            }
        }
    }

    private fun saveStateToPrefs() {
        val prefs = getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE).edit()
        val lockedJson = org.json.JSONObject()
        val consumedJson = org.json.JSONObject()
        for ((k, v) in lockedApps) lockedJson.put(k, v)
        for ((k, v) in consumedSeconds) consumedJson.put(k, v)
        prefs.putString("lockedApps", lockedJson.toString())
        prefs.putString("consumedSeconds", consumedJson.toString())
        prefs.apply()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(runnable)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("blocker_channel", "App Blocker", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
