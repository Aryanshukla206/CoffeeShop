package com.coffeeshop

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import androidx.health.connect.client.HealthConnectClient

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Health Connect initialization must be inside a function, like onCreate
        checkHealthConnectAvailability()
    }

    private fun checkHealthConnectAvailability() {
        val providerPackageName = "com.google.android.apps.healthdata"
        val availabilityStatus = HealthConnectClient.getSdkStatus(this, providerPackageName)

        if (availabilityStatus == HealthConnectClient.SDK_UNAVAILABLE) return

        if (availabilityStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            val uriString = "market://details?id=$providerPackageName&url=healthconnect%3A%2F%2Fonboarding"
            startActivity(Intent(Intent.ACTION_VIEW).apply {
                setPackage("com.android.vending")
                data = Uri.parse(uriString)
                putExtra("overlay", true)
                putExtra("callerId", packageName)
            })
            return
        }

        // Create HealthConnectClient instance
        val healthConnectClient = HealthConnectClient.getOrCreate(this)
        // You can now use healthConnectClient to read/write health data
    }

    override fun getMainComponentName(): String = "coffeeshop"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
