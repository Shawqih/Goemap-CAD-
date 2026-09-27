package com.geovector.cadmobile

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class GeoVectorApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
