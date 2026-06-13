package com.devlog.hub

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.devlog.hub.services.DevLogService
import com.devlog.hub.settings.DevLogSettings

/**
 * Main entry point for DevLog Hub plugin.
 * Provides utility methods for accessing plugin services.
 */
object DevLogPlugin {

    private val LOG = Logger.getInstance(DevLogPlugin::class.java)

    const val PLUGIN_ID = "com.devlog.hub"
    const val PLUGIN_NAME = "DevLog Hub"
    const val NOTIFICATION_GROUP_ID = "DevLog Hub Notifications"

    /**
     * Get the DevLog service instance
     */
    val service: DevLogService
        get() = ApplicationManager.getApplication().getService(DevLogService::class.java)

    /**
     * Get the DevLog settings instance
     */
    val settings: DevLogSettings
        get() = ApplicationManager.getApplication().getService(DevLogSettings::class.java)

    /**
     * Check if the plugin is connected to the server
     */
    val isConnected: Boolean
        get() = service.isConnected

    /**
     * Initialize the plugin on startup if auto-connect is enabled
     */
    fun initializeOnStartup() {
        LOG.info("DevLog Hub plugin initializing...")

        if (settings.state.autoConnect) {
            LOG.info("Auto-connect enabled, connecting to server...")
            service.connect()
        }
    }
}
