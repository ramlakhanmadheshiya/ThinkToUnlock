package com.ramlakhan0001.frontend

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap

class AppManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppManager"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val appList = WritableNativeArray()

            for (appInfo in packages) {
                // Only get apps that can be launched by the user (not background system services)
                if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                    val appMap = WritableNativeMap()
                    appMap.putString("id", appInfo.packageName)
                    appMap.putString("name", pm.getApplicationLabel(appInfo).toString())
                    
                    try {
                        val iconDrawable = pm.getApplicationIcon(appInfo)
                        var bitmap = if (iconDrawable is android.graphics.drawable.BitmapDrawable) {
                            iconDrawable.bitmap
                        } else {
                            val bmp = android.graphics.Bitmap.createBitmap(iconDrawable.intrinsicWidth.coerceAtLeast(1), iconDrawable.intrinsicHeight.coerceAtLeast(1), android.graphics.Bitmap.Config.ARGB_8888)
                            val canvas = android.graphics.Canvas(bmp)
                            iconDrawable.setBounds(0, 0, canvas.width, canvas.height)
                            iconDrawable.draw(canvas)
                            bmp
                        }
                        // Scale down to 96x96 to save memory and Binder transaction limits
                        bitmap = android.graphics.Bitmap.createScaledBitmap(bitmap, 96, 96, true)
                        val stream = java.io.ByteArrayOutputStream()
                        bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                        val base64Icon = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.NO_WRAP)
                        appMap.putString("icon", "data:image/png;base64,$base64Icon")
                    } catch (e: Exception) {
                        appMap.putString("icon", "apps-outline")
                    }
                    
                    appMap.putString("color", "#6366F1")
                    appList.pushMap(appMap)
                }
            }
            promise.resolve(appList)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun checkUsagePermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(android.content.Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
        } else {
            appOps.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
        }
        promise.resolve(mode == android.app.AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestUsagePermission() {
        val intent = android.content.Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun startBlockerService(promise: Promise) {
        try {
            val intent = android.content.Intent(reactApplicationContext, AppBlockerService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            promise.resolve(android.provider.Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            val intent = android.content.Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
            intent.data = android.net.Uri.parse("package:${reactApplicationContext.packageName}")
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            reactApplicationContext.startActivity(intent)
        }
    }

    @ReactMethod
    fun setLockedApps(apps: com.facebook.react.bridge.ReadableMap) {
        val newMap = mutableMapOf<String, Int>()
        val iterator = apps.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            newMap[key] = apps.getInt(key)
        }
        AppBlockerService.lockedApps = newMap

        // Persist to SharedPreferences so service can recover from process death
        val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE).edit()
        val lockedJson = org.json.JSONObject()
        for ((k, v) in newMap) lockedJson.put(k, v)
        prefs.putString("lockedApps", lockedJson.toString())
        prefs.apply()
    }

    @ReactMethod
    fun setSmartRemindersEnabled(enabled: Boolean) {
        AppBlockerService.smartRemindersEnabled = enabled
        val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE).edit()
        prefs.putBoolean("smartReminders", enabled)
        prefs.apply()
    }

    @ReactMethod
    fun getConsumedSeconds(promise: Promise) {
        val map = com.facebook.react.bridge.Arguments.createMap()
        for ((k, v) in AppBlockerService.consumedSeconds) {
            map.putInt(k, v)
        }
        AppBlockerService.consumedSeconds.clear()
        val prefs = reactApplicationContext.getSharedPreferences("AppBlockerPrefs", android.content.Context.MODE_PRIVATE).edit()
        prefs.putString("consumedSeconds", "{}")
        prefs.apply()
        promise.resolve(map)
    }

    @ReactMethod
    fun unlockAppTemporarily(appId: String, promise: Promise) {
        try {
            AppBlockerService.temporarilyUnlockedApp = appId
            val pm = reactApplicationContext.packageManager
            val intent = pm.getLaunchIntentForPackage(appId)
            if (intent != null) {
                // Clear task so it reconstructs without floating window bypass
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }

    @ReactMethod
    fun launchApp(appId: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val intent = pm.getLaunchIntentForPackage(appId)
            if (intent != null) {
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("Error", e)
        }
    }
}
