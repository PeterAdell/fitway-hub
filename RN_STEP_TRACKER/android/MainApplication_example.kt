/**
 * MainApplication.java / MainApplication.kt (Android)
 * 
 * Example of how to register the StepCounterPackage if not using autolinking.
 * 
 * If you're using React Native 0.60+, autolinking should handle this automatically.
 * Only add the StepCounterPackage manually if autolinking is disabled.
 */

// Kotlin version (recommended for modern Android projects)
package com.yourcompany.yourapp

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.fitway.steps.StepCounterPackage  // Add this import

class MainApplication : Application(), ReactApplication {

  override fun getReactNativeHost(): ReactNativeHost =
    object : ReactNativeHost(this) {
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override fun getPackages(): List<ReactPackage> =
        listOf(
          MainReactPackage(),
          StepCounterPackage()  // Register the step counter package
        )

      override fun getJSMainModuleName(): String = "index"
    }
}

// ============================================================================

// Java version (if using older Java codebase)
/**
 * 
package com.yourcompany.yourapp;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.fitway.steps.StepCounterPackage;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.asList(
        new MainReactPackage(),
        new StepCounterPackage()  // Register the step counter packagepackage
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }
}
 * 
 */
