/**
 * StepCounterService.kt
 * 
 * Android Foreground Service for continuous step tracking in background.
 * 
 * PURPOSE:
 * - Keep step counter sensor active even when app is backgrounded
 * - Use Android foreground service (visible notification) instead of relying on background services that can be killed
 * - Send step updates to the main app via LocalBroadcastManager or shared storage
 * 
 * REQUIREMENTS:
 * - android.permission.FOREGROUND_SERVICE (Android 10+)
 * - android.permission.ACTIVITY_RECOGNITION (Android 10+)
 * 
 * FLOW:
 * 1. App calls StepCounterModule.startStepCounter()
 * 2. Creates and starts StepCounterService with startForegroundService()
 * 3. Service shows persistent notification (user sees "Step Tracking" in status bar)
 * 4. Service listens to step sensor and broadcasts updates
 * 5. App can be backgrounded/killed safely; service continues running
 */

package com.fitway.steps

import android.app.Service
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager

/**
 * Foreground service that maintains step sensor listening in the background
 */
class StepCounterService : Service(), SensorEventListener {

  companion object {
    const val NOTIFICATION_ID = 1001
    const val CHANNEL_ID = "step_counter_channel"
    const val ACTION_STEP_UPDATE = "com.fitway.steps.ACTION_STEP_UPDATE"
    const val EXTRA_STEPS = "steps"
    const val EXTRA_TOTAL = "totalSteps"
  }

  private var sensorManager: SensorManager? = null
  private var stepCounter: Sensor? = null
  private var lastStepValue = 0
  private val broadcastManager: LocalBroadcastManager by lazy { LocalBroadcastManager.getInstance(this) }

  /**
   * Service lifecycle: onCreate
   */
  override fun onCreate() {
    super.onCreate()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepCounter = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    createNotificationChannel()
  }

  /**
   * Service lifecycle: onStartCommand (called when service is started)
   */
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Register sensor listener
    if (stepCounter != null) {
      sensorManager?.registerListener(this, stepCounter, SensorManager.SENSOR_DELAY_NORMAL)
    }

    // Show persistent foreground notification
    startForeground(NOTIFICATION_ID, createNotification())

    // Return START_STICKY: if the service is killed, Android will restart it
    return START_STICKY
  }

  /**
   * Service lifecycle: onDestroy
   */
  override fun onDestroy() {
    super.onDestroy()
    if (stepCounter != null) {
      sensorManager?.unregisterListener(this)
    }
  }

  /**
   * IBinder callback: not used for this service (it's not bound)
   */
  override fun onBind(intent: Intent?): IBinder? = null

  /**
   * SensorEventListener: onSensorChanged
   * Fired when step sensor reports new step count
   */
  override fun onSensorChanged(event: SensorEvent?) {
    if (event?.sensor?.type == Sensor.TYPE_STEP_COUNTER) {
      val currentSteps = event.values[0].toInt()
      val stepsDelta = currentSteps - lastStepValue

      if (stepsDelta > 0) {
        lastStepValue = currentSteps

        // Broadcast step update so the app can catch it
        val intent = Intent(ACTION_STEP_UPDATE).apply {
          putExtra(EXTRA_STEPS, stepsDelta)
          putExtra(EXTRA_TOTAL, currentSteps)
        }
        broadcastManager.sendBroadcast(intent)

        // Also update the notification to show current step count
        updateNotification(currentSteps)
      }
    }
  }

  /**
   * SensorEventListener: onAccuracyChanged (unused but required to implement)
   */
  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  /**
   * Create notification channel for Android 8+
   * Required before showing notifications on Android 8 and above
   */
  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Step Counter",
        NotificationManager.IMPORTANCE_LOW // Low importance so notification doesn't pop up aggressively
      ).apply {
        description = "Offline step tracking in progress"
        enableVibration(false)
        setSound(null, null)
      }

      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }

  /**
   * Create notification shown to user while service is running
   * This is required for a foreground service
   */
  private fun createNotification(): NotificationCompat.Notification {
    // Intent to open app when user taps notification
    val intent = Intent(this, MainActivity::class.java) // Adjust MainActivity to your main activity
    val pendingIntent = PendingIntent.getActivity(
      this, 0, intent,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      } else {
        PendingIntent.FLAG_UPDATE_CURRENT
      }
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Step Tracking")
      .setContentText("Tracking your steps in the background")
      .setSmallIcon(android.R.drawable.ic_menu_view) // Use your app's own icon
      .setContentIntent(pendingIntent)
      .setAutoCancel(false)
      .setOngoing(true) // Ongoing notifications can't be dismissed by user
      .build()
  }

  /**
   * Update the notification with current step count
   */
  private fun updateNotification(stepCount: Int) {
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Step Tracking")
      .setContentText("Steps: $stepCount")
      .setSmallIcon(android.R.drawable.ic_menu_view)
      .setOngoing(true)
      .build()

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(NOTIFICATION_ID, notification)
  }
}

/**
 * NOTE: MainActivity reference above should be replaced with your actual main Activity class.
 * If using React Native navigation, you may need to adjust this to your navigation structure.
 */
