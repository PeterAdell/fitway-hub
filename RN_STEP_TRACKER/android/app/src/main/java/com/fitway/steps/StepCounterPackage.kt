/**
 * StepCounterPackage.kt
 * 
 * React Native Package registration for StepCounterModule.
 * This file is required to register the native module with React Native.
 * 
 * USAGE:
 * Add this to your MainApplication.getPackages() or use autolinking (RN 0.60+)
 */

package com.fitway.steps

import android.view.View
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoBuilder

class StepCounterPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      StepCounterModule.MODULE_NAME -> StepCounterModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider() = object : ReactPackageProvider {
    override fun getReactModuleInfos() = ReactModuleInfoBuilder()
      .add(StepCounterModule.MODULE_NAME, StepCounterModule::class.java.name)
      .build()
  }
}
