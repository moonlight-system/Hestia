package com.lin.hestia

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    // Pad the whole app by the status bar, the navigation bar and the keyboard,
    // so nothing is drawn underneath them.
    val content = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
      // CONSUMED: the WebView gets no insets of its own, so nothing is padded twice
      WindowInsetsCompat.CONSUMED
    }
    requestBatteryExemption()
  }

  // Asks once. If the user denies, we don't ask again; they can still
  // change it manually in Settings → Apps → Hestia → Battery.
  private fun requestBatteryExemption() {
    val prefs = getSharedPreferences("hestia", MODE_PRIVATE)
    if (prefs.getBoolean("battery_asked", false)) return

    val pm = getSystemService(POWER_SERVICE) as PowerManager
    if (pm.isIgnoringBatteryOptimizations(packageName)) return

    prefs.edit().putBoolean("battery_asked", true).apply()

    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
      .setData(Uri.parse("package:$packageName"))
    startActivity(intent)
  }
}