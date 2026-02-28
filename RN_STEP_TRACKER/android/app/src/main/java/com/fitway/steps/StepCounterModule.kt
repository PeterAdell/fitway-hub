/**
 * StepCounterModule.kt
 * 
 * React Native Native Module for Android step counter.
 * 
 * RESPONSIBILITIES:
 * - Bridge between React Native JS and native Android step sensor
 * - Listen to TYPE_STEP_COUNTER sensor
 * - Emit step count updates to JS via NativeEventEmitter
 * - Handle foreground service lifecycle
 * - Persist step totals for reboot reconciliation
 * 
 * KEY SENSOR:
 * - TYPE_STEP_COUNTER (API 19+): monotonic step count since last reboot
 *   - Low power, device-level counter
 *   - Resets on device reboot (we handle this in JS layer)
 * 
 * PERMISSION REQUIRED:
 * - android.permission.ACTIVITY_RECOGNITION (Android 10+)
 */

package com.fitway.steps

import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * StepCounterModule: Main entry point for step tracking on Android
 */
class StepCounterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), SensorEventListener {

  companion object {
    const val MODULE_NAME = "StepCounterModule"
    const val EVENT_STEP_COUNT = "onStepCountUpdate"
    private var instance: StepCounterModule? = null
  }

  init {
    instance = this
  }

  private val sensorManager: SensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val stepCounterSensor: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
  private var isListening = false
  private var lastRecordedSteps = 0
  private var sessionStartSteps = 0

  // Firebase-like event emitter (send events to JS)
  private fun sendEvent(eventName: String, params: Arguments) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  /**
   * Start listening to step counter sensor
   * Called from JS via useStepTracker.startStepListener()
   */
  @ReactMethod
  fun startStepCounter() {
    try {
      if (stepCounterSensor == null) {
        // Fallback: device doesn't have TYPE_STEP_COUNTER
        // JS layer will handle acceleration-based fallback
        sendEvent(EVENT_STEP_COUNT, Arguments.createMap().apply {
          putInt("steps", 0)
          putInt("totalSteps", 0)
          putString("reason", "SENSOR_NOT_AVAILABLE")
        })
        return
      }

      // Start foreground service for continuous background tracking (Android 8.0+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val intent = Intent(reactContext, StepCounterService::class.java)
        reactContext.startForegroundService(intent)
      } else {
        val intent = Intent(reactContext, StepCounterService::class.java)
        reactContext.startService(intent)
      }

      // Register sensor listener (foreground tracking)
      sessionStartSteps = lastRecordedSteps
      isListening = sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_NORMAL)

      if (!isListening) {
        sendEvent(EVENT_STEP_COUNT, Arguments.createMap().apply {
          putInt("steps", 0)
          putInt("totalSteps", 0)
          putString("error", "FAILED_TO_REGISTER_SENSOR")
        })
      }
    } catch (e: Exception) {
      sendEvent(EVENT_STEP_COUNT, Arguments.createMap().apply {
        putString("error", e.message ?: "Unknown error")
      })
    }
  }

  /**
   * Stop listening to step counter sensor
   * Called from JS via useStepTracker.stopTracking()
   */
  @ReactMethod
  fun stopStepCounter() {
    try {
      if (isListening) {
        sensorManager.unregisterListener(this)
        isListening = false
      }

      // Stop foreground service
      val intent = Intent(reactContext, StepCounterService::class.java)
      reactContext.stopService(intent)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  /**
   * Get current device step total
   * Callback returns absolute step count since last device reboot
   */
  @ReactMethod
  fun getDeviceStepTotal(callback: Callback) {
    try {
      callback.invoke(lastRecordedSteps)
    } catch (e: Exception) {
      callback.invoke(-1)
    }
  }

  /**
   * SensorEventListener callback: fired when sensor detects step change
   * 
   * Note: values[0] is the accumulated step count since last device reboot.
   * To get steps in a session, compute delta from session start.
   */
  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type == Sensor.TYPE_STEP_COUNTER) {
      val totalSteps = event.values[0].toInt()
      val stepsDelta = totalSteps - lastRecordedSteps
      lastRecordedSteps = totalSteps

      // Only emit positive deltas (device reboot detection in JS)
      if (stepsDelta > 0) {
        val params = Arguments.createMap().apply {
          putInt("steps", stepsDelta)
          putInt("totalSteps", totalSteps)
          putLong("timestamp", System.currentTimeMillis())
        }
        sendEvent(EVENT_STEP_COUNT, params)
      }
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    // Step counter accuracy rarely changes, but we could log if needed
  }

  override fun getName(): String = MODULE_NAME
}
