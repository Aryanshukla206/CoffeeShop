package com.coffeeshop

import android.os.Bundle
import android.content.Intent
import android.net.Uri
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import androidx.health.connect.client.HealthConnectClient
import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate
import com.google.firebase.installations.FirebaseInstallations
import android.util.Log;
import android.widget.Toast;


class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Health Connect initialization must be inside a function, like onCreate
        checkHealthConnectAvailability()
        HealthConnectPermissionDelegate.setPermissionDelegate(this)

        FirebaseInstallations.getInstance().id.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val fid = task.result
                Log.d("FirebaseFID", "Installation ID: $fid")
                // You can also copy it or display it
                Toast.makeText(this, "FID: " + fid, Toast.LENGTH_LONG).show();
            } else {
                Log.e("FirebaseFID", "Unable to get FID", task.exception)
            }
        }
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


    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.let { uri ->
            Log.d("DeepLink", "onNewIntent data: $uri")
        } ?: Log.d("DeepLink", "onNewIntent called with no data")
    }

}
