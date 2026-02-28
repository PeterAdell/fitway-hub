/**
 * StepCounterModule.swift
 * 
 * React Native Native Module for iOS step counter using CoreMotion/CMPedometer.
 * 
 * RESPONSIBILITIES:
 * - Bridge between React Native JS and native iOS pedometer
 * - Use CMPedometer for step counting (preferred over HealthKit to avoid entitlements)
 * - Deliver live step updates while app is in foreground
 * - On resume, fetch historical step data since app was backgrounded
 * - Emit events to JS via RCT event emitter
 * 
 * KEY APIS:
 * - CMPedometer: Device-level step counter (doesn't require HealthKit)
 *   - Requires iOS 8.0+
 *   - Live updates via startUpdates() (foreground)
 *   - Historical via queryPedometerData(from: to:) (background recovery)
 * - NSMotionUsageDescription: Info.plist key required
 * 
 * LIMITATIONS:
 * - iOS restricts background motion updates unless using BackgroundModes
 * - We use best-effort: queryPedometerData on resume to fill gaps
 * - No HealthKit integration to keep open-source and avoid paid entitlements
 */

import Foundation
import CoreMotion

@objc(StepCounterModule)
class StepCounterModule: NSObject {

  @objc static let moduleName = "StepCounterModule"
  
  // CMPedometer instance for step counting
  private let pedometer = CMPedometer()
  
  // Track whether we're currently getting live updates
  private var isTracking = false
  
  // For sending events to JS
  private var bridge: RCTBridge?
  
  // Track last queried timestamp to avoid gaps
  private var lastQueryTime: Date = Date()
  
  // MARK: - React Native Setup

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc func constantsToExport() -> [AnyHashable: Any]! {
    return [:]
  }

  // MARK: - Public Methods for JS

  /**
   * Start live step counting from the device pedometer.
   * 
   * This starts real-time step updates while the app is in foreground.
   * When app goes background, updates stop; we recover on resume via queryPedometerDataSinceLastQuery.
   */
  @objc func startStepCounter(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard CMPedometer.isStepCountingAvailable() else {
      reject("ERR_PEDOMETER_NOT_AVAILABLE", "Step counting is not available on this device", nil)
      return
    }

    // Start live updates
    pedometer.startUpdates(from: Date()) { [weak self] data, error in
      if let error = error {
        reject("ERR_PEDOMETER_UPDATE", error.localizedDescription, error)
        return
      }

      guard let data = data else {
        return
      }

      // Send event to JS with step count
      self?.sendStepUpdate(Int(data.numberOfSteps))
    }

    isTracking = true
    lastQueryTime = Date()
    resolve("Step tracking started")
  }

  /**
   * Stop live step updating
   */
  @objc func stopStepCounter(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    pedometer.stopUpdates()
    isTracking = false
    resolve("Step tracking stopped")
  }

  /**
   * Query historical pedometer data between two times.
   * Used on app resume to fill gaps while app was backgrounded.
   * 
   * - Parameters:
   *   - fromTime: Start timestamp (milliseconds since epoch)
   *   - toTime: End timestamp (milliseconds since epoch)
   */
  @objc func queryStepsBetween(_ fromTime: NSNumber, toTime: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let from = Date(timeIntervalSince1970: TimeInterval(fromTime.doubleValue) / 1000.0)
    let to = Date(timeIntervalSince1970: TimeInterval(toTime.doubleValue) / 1000.0)

    pedometer.queryPedometerData(from: from, to: to) { [weak self] data, error in
      if let error = error {
        reject("ERR_QUERY_PEDOMETER", error.localizedDescription, error)
        return
      }

      guard let data = data else {
        resolve(0)
        return
      }

      let stepCount = Int(data.numberOfSteps)
      self?.sendStepUpdate(stepCount)
      resolve(stepCount)
    }
  }

  /**
   * Get total steps since a reference date.
   * Useful for computing session totals.
   */
  @objc func getStepsSince(_ referenceTime: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let from = Date(timeIntervalSince1970: TimeInterval(referenceTime.doubleValue) / 1000.0)
    let to = Date()

    pedometer.queryPedometerData(from: from, to: to) { data, error in
      if let error = error {
        reject("ERR_QUERY_PEDOMETER", error.localizedDescription, error)
        return
      }

      let steps = Int(data?.numberOfSteps ?? 0)
      resolve(steps)
    }
  }

  /**
   * Called on app resume (AppDelegate or in JS via AppState listener).
   * Queries for steps during the background period and reconciles.
   */
  @objc func syncOnResume(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let from = lastQueryTime
    let to = Date()

    pedometer.queryPedometerData(from: from, to: to) { [weak self] data, error in
      if let error = error {
        reject("ERR_SYNC_ON_RESUME", error.localizedDescription, error)
        return
      }

      guard let data = data else {
        resolve(0)
        return
      }

      let steps = Int(data.numberOfSteps)
      self?.lastQueryTime = Date()
      
      if steps > 0 {
        self?.sendStepUpdate(steps)
      }
      
      resolve(steps)
    }
  }

  // MARK: - Private Helpers

  /**
   * Send a step update event to the React Native JS layer
   */
  private func sendStepUpdate(_ stepCount: Int) {
    guard let bridge = bridge else { return }

    DispatchQueue.main.async {
      bridge.eventDispatcher?.sendAppEvent(
        withName: "onStepCountUpdate",
        body: [
          "steps": stepCount,
          "timestamp": Date().timeIntervalSince1970 * 1000
        ]
      )
    }
  }
}

/**
 * Export the module so React Native can find it.
 * In a real project, use react-native-cli autolinking (RN 0.60+).
 * Otherwise, manually call RCTBridgeModule.addModule in MainApplication.
 */
@objc(StepCounterModule)
class StepCounterBridge: NSObject, RCTBridgeModule {
  @objc static func moduleName() -> String! {
    return "StepCounterModule"
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
